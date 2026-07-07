import { getUserFromRequest } from '@/lib/supabase/server';
import { stripeConfigured, stripeClient, PLANS, type PlanId } from '@/lib/stripe';

/**
 * Stripe Checkout session creation for the Interview Gym wedge.
 *
 * Mirrors the guardrail order of the reference gated route (grade-artifact):
 * validate the body, then require identity, then degrade calmly if the payment
 * rail is unconfigured, and only then reach for Stripe.
 *
 * IDENTITY IS ALWAYS REQUIRED HERE — unlike the AI routes, this does NOT respect
 * PRAXIS_AUTH_MODE. A purchase must attach to a Supabase user, because the
 * webhook grants the entitlement by `client_reference_id`; with no user there is
 * nobody to grant, so we refuse up front with a calm 401.
 *
 * The Stripe SDK is imported only here and in the webhook — never from a client
 * component (see the leak warning at the top of src/lib/stripe.ts).
 */

export const dynamic = 'force-dynamic';
// Stripe's Node SDK wants the Node runtime; pin it like the other routes so an
// accidental edge switch cannot break the SDK.
export const runtime = 'nodejs';

interface CheckoutRequest {
  plan?: unknown;
}

function isPlanId(value: unknown): value is PlanId {
  return value === 'sprint' || value === 'monthly';
}

export async function POST(request: Request) {
  // 1) Parse + validate the body. Anything but a known plan is a 400.
  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!isPlanId(body.plan)) {
    return Response.json({ error: 'Unknown plan. Expected "sprint" or "monthly".' }, { status: 400 });
  }
  const plan: PlanId = body.plan;

  // 2) Identity — ALWAYS required (see the header note). A purchase with no
  //    Supabase user cannot be granted by the webhook, so refuse calmly.
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: 'Sign in to purchase.' }, { status: 401 });
  }

  // 3) Graceful degradation: no Stripe key, or this plan's price ID is unset,
  //    means payments are off in this environment. Return a calm 200 the UI can
  //    show (same shape as the AI routes' no-key path), NOT an error.
  const planConfig = PLANS[plan];
  if (!stripeConfigured() || !planConfig.priceId) {
    return Response.json({
      unavailable: true,
      message:
        'Payments are off in this environment. Set STRIPE_SECRET_KEY and the plan price IDs to enable checkout.',
    });
  }

  // 4) Create the Checkout Session. The success/cancel URLs come back to
  //    /account, where the SignedInCard shows the result.
  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get('origin') ??
    'http://localhost:3000';

  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: planConfig.mode,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      // client_reference_id is how the payment-mode webhook finds the user.
      client_reference_id: user.id,
      customer_email: user.email,
      // For the subscription plan the entitlement (and its budget bump) is
      // driven by the subscription events, so we stamp the user + plan onto the
      // subscription's own metadata — that is where the webhook reads it from.
      ...(plan === 'monthly'
        ? {
            subscription_data: {
              trial_period_days: planConfig.trialDays,
              metadata: { praxis_user_id: user.id, praxis_plan: 'monthly' },
            },
          }
        : {}),
      // Session-level metadata is a belt-and-suspenders copy for the payment
      // path and for dashboard debugging.
      metadata: { praxis_user_id: user.id, praxis_plan: plan },
      success_url: `${appOrigin}/account?checkout=success`,
      cancel_url: `${appOrigin}/account?checkout=cancelled`,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json({ error: `Could not start checkout: ${msg}` }, { status: 500 });
  }
}
