import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The checkout route's contract: validate the plan, ALWAYS require identity,
 * degrade calmly when payments are off, and otherwise build a correct Stripe
 * Checkout Session. We mock the Stripe SDK and the Supabase user lookup so no
 * network (or spend) happens and we can assert the exact session params — the
 * mode, the price, the client_reference_id, and that the 3-day trial rides only
 * on the monthly plan.
 */

// Env must be set BEFORE importing the route: stripe.ts reads the price IDs and
// the secret key at module load. A key + both price IDs = the "configured" path.
process.env.STRIPE_SECRET_KEY = 'sk_test_not_used_network_is_mocked';
process.env.STRIPE_PRICE_SPRINT = 'price_sprint_123';
process.env.STRIPE_PRICE_MONTHLY = 'price_monthly_456';

/** Spy for the mocked checkout.sessions.create; returns a canned hosted URL. */
const createSessionSpy = vi.fn<(params: Record<string, unknown>) => Promise<{ url: string }>>();

vi.mock('@/lib/stripe', async () => {
  const actual = await vi.importActual<typeof import('@/lib/stripe')>('@/lib/stripe');
  return {
    ...actual,
    stripeClient: () => ({ checkout: { sessions: { create: createSessionSpy } } }),
  };
});

/** The user the route sees; tests flip this to null to exercise the 401 path. */
let mockUser: { id: string; email: string } | null = { id: 'user-42', email: 'pm@example.com' };
vi.mock('@/lib/supabase/server', () => ({
  getUserFromRequest: async () => mockUser,
}));

import { POST } from '../route';

function checkoutRequest(body: unknown): Request {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  createSessionSpy.mockClear();
  createSessionSpy.mockResolvedValue({ url: 'https://checkout.stripe.test/session_abc' });
  mockUser = { id: 'user-42', email: 'pm@example.com' };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('checkout route: request validation', () => {
  it('returns 400 when the plan is not sprint or monthly', async () => {
    const res = await POST(checkoutRequest({ plan: 'enterprise' }));
    expect(res.status).toBe(400);
    expect(createSessionSpy).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/checkout', { method: 'POST', body: 'not json' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('checkout route: identity is always required', () => {
  it('returns 401 with a calm sign-in message when there is no user', async () => {
    mockUser = null;
    const res = await POST(checkoutRequest({ plan: 'sprint' }));
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Sign in to purchase.');
    expect(createSessionSpy).not.toHaveBeenCalled();
  });
});

describe('checkout route: calm degradation when payments are off', () => {
  it('returns a calm 200 unavailable (no session) when Stripe is unconfigured', async () => {
    // stripeConfigured() reads STRIPE_SECRET_KEY at call time, so clearing it
    // here (after the module already loaded the price IDs) exercises the
    // payments-off branch without disturbing PLANS.
    const savedKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      const res = await POST(checkoutRequest({ plan: 'sprint' }));
      expect(res.status).toBe(200);
      const body = (await res.json()) as { unavailable: boolean };
      expect(body.unavailable).toBe(true);
      expect(createSessionSpy).not.toHaveBeenCalled();
    } finally {
      process.env.STRIPE_SECRET_KEY = savedKey;
    }
  });
});

describe('checkout route: session creation', () => {
  it('creates a one-time payment session with the sprint price and the user reference', async () => {
    const res = await POST(checkoutRequest({ plan: 'sprint' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string };
    expect(body.url).toBe('https://checkout.stripe.test/session_abc');

    const params = createSessionSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(params.mode).toBe('payment');
    expect(params.line_items).toEqual([{ price: 'price_sprint_123', quantity: 1 }]);
    expect(params.client_reference_id).toBe('user-42');
    expect(params.customer_email).toBe('pm@example.com');
    // The sprint plan carries no subscription_data (and therefore no trial).
    expect(params.subscription_data).toBeUndefined();
  });

  it('creates a subscription session with the monthly price and a 3-day trial', async () => {
    await POST(checkoutRequest({ plan: 'monthly' }));

    const params = createSessionSpy.mock.calls[0][0] as unknown as {
      mode: string;
      line_items: unknown;
      subscription_data?: { trial_period_days?: number; metadata?: Record<string, string> };
    };
    expect(params.mode).toBe('subscription');
    expect(params.line_items).toEqual([{ price: 'price_monthly_456', quantity: 1 }]);
    expect(params.subscription_data?.trial_period_days).toBe(3);
    // The subscription's own metadata carries the user id the webhook reads.
    expect(params.subscription_data?.metadata).toEqual({
      praxis_user_id: 'user-42',
      praxis_plan: 'monthly',
    });
  });

  it('builds success and cancel URLs back to /account', async () => {
    await POST(checkoutRequest({ plan: 'sprint' }));
    const params = createSessionSpy.mock.calls[0][0] as unknown as { success_url: string; cancel_url: string };
    expect(params.success_url).toBe('http://localhost:3000/account?checkout=success');
    expect(params.cancel_url).toBe('http://localhost:3000/account?checkout=cancelled');
  });
});
