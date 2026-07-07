import type Stripe from 'stripe';
import { stripeConfigured, stripeClient } from '@/lib/stripe';
import {
  sprintEntitlement,
  subscriptionEntitlement,
  revokedEntitlement,
  upsertEntitlement,
  bumpBudgetOnGrant,
} from '@/lib/entitlements';

/**
 * Stripe webhook — the ONLY trustworthy source of "this user paid".
 *
 * SECURITY: we never trust the request body until its signature is verified
 * against STRIPE_WEBHOOK_SECRET. Two things make that verification correct here:
 *
 *  1. We read the RAW request text (`await request.text()`), NOT `request.json()`.
 *     Signature verification hashes the exact bytes Stripe sent; re-serializing
 *     parsed JSON changes whitespace/key order and breaks the signature. The
 *     default body parser is not in play for App Router route handlers, so the
 *     raw text is the untouched payload.
 *  2. We verify with `constructEventAsync` (the async, Web-Crypto variant — the
 *     Node runtime's crypto is async-friendly and this avoids the sync SubtleCrypto
 *     pitfalls). A missing signature header, missing secret, or bad signature is
 *     a 400 — a forged event never reaches a grant.
 *
 * RETRY SEMANTICS (why the status codes differ):
 *  - Unconfigured Stripe → 503 so Stripe RETRIES later. A webhook is a retry
 *    target; a calm 200 would tell Stripe to give up, which is wrong here.
 *  - A recognized event missing its userId → 200 + console.warn. Retrying will
 *    not conjure a metadata field, so we acknowledge and move on.
 *  - A Supabase WRITE failure → 500 so Stripe RETRIES: the payment is real, the
 *    grant just did not land yet.
 *  - Any unhandled event type → 200 ignored.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Pull the entitlement owner off a subscription's metadata (set at checkout). */
function userIdFromSubscription(sub: Stripe.Subscription): string | null {
  const id = sub.metadata?.praxis_user_id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/**
 * A subscription's period end in v22 lives on its ITEMS, not the top-level
 * object (a breaking change from older SDKs). We take the first item's
 * `current_period_end`; a single-price subscription — which the wedge always
 * is — has exactly one item.
 */
function periodEndOf(sub: Stripe.Subscription): number | null {
  const item = sub.items?.data?.[0];
  return item?.current_period_end ?? null;
}

export async function POST(request: Request) {
  // Unconfigured → 503 so Stripe retries (NOT a calm 200 — a webhook must be a
  // retry target). This also means stripeClient() below is safe to call.
  if (!stripeConfigured()) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) {
    return Response.json({ error: 'Missing webhook signature or secret' }, { status: 400 });
  }

  // RAW body — verification breaks on re-serialized JSON.
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripeClient().webhooks.constructEventAsync(raw, signature, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid signature';
    return Response.json({ error: `Signature verification failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // Subscriptions are granted by their own subscription.created/updated
        // events (below), which carry the period end, so a subscription-mode
        // checkout completion is acknowledged here without action.
        if (session.mode !== 'payment') break;

        // The wedge is CARD-ONLY by design. Cards settle synchronously, so a
        // completed payment-mode session arrives 'paid'. Asynchronous methods
        // (bank debits etc.) fire this event 'unpaid' and settle later — or
        // never — via `checkout.session.async_payment_succeeded`, which we do
        // NOT handle. Granting on 'unpaid' would hand out a sprint before the
        // money lands, so we require 'paid'. If async methods are ever enabled
        // in the Stripe dashboard, add an async_payment_succeeded handler FIRST.
        if (session.payment_status !== 'paid') {
          console.warn(
            `[stripe-webhook] checkout.session.completed payment_status=${session.payment_status} (not paid); ignoring.`,
          );
          break;
        }

        const userId =
          session.client_reference_id ??
          (typeof session.metadata?.praxis_user_id === 'string'
            ? session.metadata.praxis_user_id
            : null);
        if (!userId) {
          console.warn('[stripe-webhook] checkout.session.completed without a userId; ignoring.');
          break;
        }

        await upsertEntitlement(userId, sprintEntitlement(new Date()));
        await bumpBudgetOnGrant(userId);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = userIdFromSubscription(sub);
        if (!userId) {
          console.warn(`[stripe-webhook] ${event.type} without praxis_user_id metadata; ignoring.`);
          break;
        }
        // A null period end would make subscriptionEntitlement() yield
        // expires_at: null — a NEVER-EXPIRING grant. Never hand that out. Like
        // the missing-userId case this is acknowledged (200): retrying won't
        // conjure a period end, and a corrected re-send from Stripe upserts and
        // catches up.
        const periodEnd = periodEndOf(sub);
        if (periodEnd === null) {
          console.warn(`[stripe-webhook] ${event.type} for ${userId} has no period end; ignoring.`);
          break;
        }
        await upsertEntitlement(userId, subscriptionEntitlement(periodEnd));
        await bumpBudgetOnGrant(userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = userIdFromSubscription(sub);
        if (!userId) {
          console.warn('[stripe-webhook] customer.subscription.deleted without praxis_user_id; ignoring.');
          break;
        }
        // Revoke by expiry (never DELETE): access lapses, the audit row stays.
        await upsertEntitlement(userId, revokedEntitlement(new Date()));
        break;
      }

      default:
        // Everything else is acknowledged and ignored.
        break;
    }
  } catch (e) {
    // A real payment whose grant did not land: 500 so Stripe retries.
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[stripe-webhook] handler failed:', msg);
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return Response.json({ received: true });
}
