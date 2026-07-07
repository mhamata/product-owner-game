import Stripe from 'stripe';

/**
 * SERVER-ONLY Stripe access. The secret key and the SDK must never reach the
 * client bundle.
 *
 * This repo has a documented history of a server-only-content leak into the
 * client chunk (a value-import of a curriculum barrel dragged hidden case
 * answers into the interview bundle — see docs/PHASE1.md "Incidents"). We treat
 * the Stripe SDK + STRIPE_SECRET_KEY with the same discipline: nothing under a
 * 'use client' file, and nothing reachable from one, may import this module.
 * Only route handlers (`/api/checkout`, `/api/stripe-webhook`) pull it in.
 *
 * Configuration is optional. With no STRIPE_SECRET_KEY the app stays free and
 * functional: `stripeConfigured()` returns false and the checkout route
 * degrades to a calm "payments are off here" 200, exactly like the AI routes
 * degrade with no ANTHROPIC_API_KEY.
 */

/** True when the Stripe secret key is present. */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Lazily-created singleton (mirrors serviceClient in supabase/server.ts): throw
// if unconfigured, cache the instance. The route always checks stripeConfigured()
// first, so the throw is a guard against a programming error, not a runtime path.
let cachedStripe: Stripe | null = null;

/** The Stripe client. Throws when STRIPE_SECRET_KEY is not configured. */
export function stripeClient(): Stripe {
  if (cachedStripe) return cachedStripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  // Pin nothing here: we let the SDK use its own bundled apiVersion default so
  // an SDK upgrade moves the version deliberately, in the lockfile.
  cachedStripe = new Stripe(key);
  return cachedStripe;
}

/** The two plans in the wedge. Both grant the single 'interview-gym' entitlement. */
export type PlanId = 'sprint' | 'monthly';

/**
 * Plan config derived from env. Price IDs are set per-environment in the Stripe
 * dashboard; when a plan's price ID is unset the checkout route treats that plan
 * as unavailable (calm 200), rather than erroring.
 *
 *  - sprint  — the $99 one-time six-week Interview Sprint (a `payment` session).
 *  - monthly — the $39/mo subscription with a 3-day free trial.
 *
 * The `priceId` is a GETTER (reads `process.env` on access), not a value frozen
 * at module load: env can be injected after this module is imported (notably in
 * tests, where ESM hoists `import` above `process.env` assignments), and a live
 * deploy may set the price IDs after the process starts. `mode`/`trialDays` are
 * static — they are product facts, not per-environment config.
 */
export const PLANS: Record<
  PlanId,
  { readonly priceId: string | undefined; mode: 'payment' | 'subscription'; trialDays?: number }
> = {
  sprint: {
    get priceId() {
      return process.env.STRIPE_PRICE_SPRINT;
    },
    mode: 'payment',
  },
  monthly: {
    get priceId() {
      return process.env.STRIPE_PRICE_MONTHLY;
    },
    mode: 'subscription',
    trialDays: 3,
  },
};

/** The Interview Sprint runs six weeks; the entitlement it grants expires then. */
export const SPRINT_DURATION_DAYS = 42;
