import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The webhook is the only trustworthy "this user paid" signal, so its contract
 * is worth pinning end to end: reject unverifiable requests, grant exactly the
 * right entitlement for each handled event, ignore the rest, and choose status
 * codes that make Stripe retry only when retrying can help.
 *
 * We mock signature verification (so no real secret is needed) and the
 * entitlement writers (so no Supabase call happens) and assert on what the route
 * asked them to do.
 */

process.env.STRIPE_SECRET_KEY = 'sk_test_not_used_network_is_mocked';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

/** The event constructEventAsync returns; tests set this per case, or make it throw. */
let nextEvent: unknown = null;
let verifyThrows = false;
const constructEventAsyncSpy = vi.fn(async () => {
  if (verifyThrows) throw new Error('bad signature');
  return nextEvent;
});

vi.mock('@/lib/stripe', async () => {
  const actual = await vi.importActual<typeof import('@/lib/stripe')>('@/lib/stripe');
  return {
    ...actual,
    stripeClient: () => ({ webhooks: { constructEventAsync: constructEventAsyncSpy } }),
  };
});

type EntitlementRow = { entitlement_id: string; store: string; expires_at: string | null };
const upsertEntitlementSpy = vi.fn<(userId: string, row: EntitlementRow) => Promise<void>>(
  () => Promise.resolve(),
);
const bumpBudgetOnGrantSpy = vi.fn<(userId: string) => Promise<void>>(() => Promise.resolve());
vi.mock('@/lib/entitlements', async () => {
  const actual = await vi.importActual<typeof import('@/lib/entitlements')>('@/lib/entitlements');
  // Reference the spies via closures, NOT directly: this factory is hoisted
  // above the spy declarations, so a direct reference reads them before init.
  return {
    ...actual,
    upsertEntitlement: (userId: string, row: EntitlementRow) => upsertEntitlementSpy(userId, row),
    bumpBudgetOnGrant: (userId: string) => bumpBudgetOnGrantSpy(userId),
  };
});

import { POST } from '../route';

/** A signed request (the signature is only checked by the mocked verifier). */
function webhookRequest(withSignature = true): Request {
  return new Request('http://localhost/api/stripe-webhook', {
    method: 'POST',
    headers: withSignature ? { 'stripe-signature': 't=1,v1=abc' } : {},
    body: '{"raw":"payload"}',
  });
}

beforeEach(() => {
  nextEvent = null;
  verifyThrows = false;
  constructEventAsyncSpy.mockClear();
  upsertEntitlementSpy.mockClear();
  bumpBudgetOnGrantSpy.mockClear();
  upsertEntitlementSpy.mockResolvedValue(undefined);
  bumpBudgetOnGrantSpy.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('stripe webhook: signature verification', () => {
  it('returns 400 when the stripe-signature header is missing', async () => {
    const res = await POST(webhookRequest(false));
    expect(res.status).toBe(400);
    expect(constructEventAsyncSpy).not.toHaveBeenCalled();
  });

  it('returns 400 when the signature does not verify', async () => {
    verifyThrows = true;
    const res = await POST(webhookRequest());
    expect(res.status).toBe(400);
    expect(upsertEntitlementSpy).not.toHaveBeenCalled();
  });
});

describe('stripe webhook: sprint purchase', () => {
  it('grants the sprint entitlement and bumps the budget on a completed payment checkout', async () => {
    nextEvent = {
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', client_reference_id: 'user-1', metadata: {} } },
    };
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(upsertEntitlementSpy).toHaveBeenCalledTimes(1);
    expect(upsertEntitlementSpy.mock.calls[0][0]).toBe('user-1');
    expect(upsertEntitlementSpy.mock.calls[0][1]).toMatchObject({ entitlement_id: 'interview-gym' });
    expect(bumpBudgetOnGrantSpy).toHaveBeenCalledWith('user-1');
  });

  it('falls back to metadata.praxis_user_id when client_reference_id is absent', async () => {
    nextEvent = {
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', client_reference_id: null, metadata: { praxis_user_id: 'user-meta' } } },
    };
    await POST(webhookRequest());
    expect(upsertEntitlementSpy.mock.calls[0][0]).toBe('user-meta');
  });

  it('acknowledges a subscription-mode checkout without granting (the subscription events do that)', async () => {
    nextEvent = {
      type: 'checkout.session.completed',
      data: { object: { mode: 'subscription', client_reference_id: 'user-1', metadata: {} } },
    };
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(upsertEntitlementSpy).not.toHaveBeenCalled();
  });
});

describe('stripe webhook: subscription lifecycle', () => {
  it('grants until the item current_period_end on subscription.created', async () => {
    nextEvent = {
      type: 'customer.subscription.created',
      data: {
        object: {
          metadata: { praxis_user_id: 'user-7' },
          items: { data: [{ current_period_end: 1785542400 }] },
        },
      },
    };
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(upsertEntitlementSpy).toHaveBeenCalledTimes(1);
    expect(upsertEntitlementSpy.mock.calls[0][1]).toMatchObject({
      expires_at: '2026-08-01T00:00:00.000Z',
    });
    expect(bumpBudgetOnGrantSpy).toHaveBeenCalledWith('user-7');
  });

  it('expires the entitlement now on subscription.deleted and does not bump budget', async () => {
    nextEvent = {
      type: 'customer.subscription.deleted',
      data: { object: { metadata: { praxis_user_id: 'user-7' }, items: { data: [] } } },
    };
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(upsertEntitlementSpy).toHaveBeenCalledTimes(1);
    // expires_at is "now" — an ISO string, not null.
    expect(typeof upsertEntitlementSpy.mock.calls[0][1].expires_at).toBe('string');
    expect(bumpBudgetOnGrantSpy).not.toHaveBeenCalled();
  });
});

describe('stripe webhook: ignore + retry semantics', () => {
  it('returns 200 and writes nothing for an unhandled event type', async () => {
    nextEvent = { type: 'invoice.paid', data: { object: {} } };
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(upsertEntitlementSpy).not.toHaveBeenCalled();
  });

  it('returns 200 without writing when a recognized event is missing its userId', async () => {
    nextEvent = {
      type: 'customer.subscription.updated',
      data: { object: { metadata: {}, items: { data: [{ current_period_end: 1785542400 }] } } },
    };
    const res = await POST(webhookRequest());
    expect(res.status).toBe(200);
    expect(upsertEntitlementSpy).not.toHaveBeenCalled();
  });

  it('returns 500 so Stripe retries when the entitlement write fails', async () => {
    upsertEntitlementSpy.mockRejectedValueOnce(new Error('supabase down'));
    nextEvent = {
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', client_reference_id: 'user-1', metadata: {} } },
    };
    const res = await POST(webhookRequest());
    expect(res.status).toBe(500);
  });

  it('returns 503 (a retry target) when Stripe is unconfigured', async () => {
    const savedKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      const res = await POST(webhookRequest());
      expect(res.status).toBe(503);
    } finally {
      process.env.STRIPE_SECRET_KEY = savedKey;
    }
  });
});
