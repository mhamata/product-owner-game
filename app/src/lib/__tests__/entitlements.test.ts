import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The entitlement seam turns Stripe webhook facts into `entitlements` rows and
 * into service-role writes. The pure mappers get exact-value assertions (the
 * 42-day math, the unix-seconds→ms conversion, revoke-by-expiry); the writers
 * get their Supabase call shape asserted against a mocked service client, so a
 * wrong conflict target or a budget bump that stomps `cents_used` is caught here.
 */

// A single spy chain the mocked serviceClient returns, so tests can assert what
// table + payload + options each write used. `upsert` resolves to no error by
// default; individual tests override it to force the error path.
type UpsertResult = { error: { message: string } | null };
const upsertSpy =
  vi.fn<(payload: Record<string, unknown>, options: { onConflict: string }) => Promise<UpsertResult>>();
const fromSpy = vi.fn<(table: string) => { upsert: typeof upsertSpy }>(() => ({ upsert: upsertSpy }));

vi.mock('@/lib/supabase/server', () => ({
  serviceClient: () => ({ from: fromSpy }),
}));

import {
  ENTITLEMENT_ID,
  sprintEntitlement,
  subscriptionEntitlement,
  revokedEntitlement,
  upsertEntitlement,
  bumpBudgetOnGrant,
} from '../entitlements';

beforeEach(() => {
  upsertSpy.mockClear();
  fromSpy.mockClear();
  upsertSpy.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('sprintEntitlement', () => {
  it('grants the interview-gym entitlement via the stripe store', () => {
    const row = sprintEntitlement(new Date('2026-07-07T00:00:00.000Z'));
    expect(row.entitlement_id).toBe(ENTITLEMENT_ID);
    expect(row.store).toBe('stripe');
  });

  it('expires exactly 42 days (six weeks) after the purchase time', () => {
    const now = new Date('2026-07-07T12:00:00.000Z');
    const row = sprintEntitlement(now);
    expect(row.expires_at).toBe('2026-08-18T12:00:00.000Z');
  });
});

describe('subscriptionEntitlement', () => {
  it('converts a unix-seconds current_period_end into an ISO millisecond expiry', () => {
    // 2026-08-01T00:00:00Z is 1785542400 seconds since the epoch.
    const row = subscriptionEntitlement(1785542400);
    expect(row.expires_at).toBe('2026-08-01T00:00:00.000Z');
  });

  it('yields a null expiry (not the 1970 epoch) when the period end is missing', () => {
    expect(subscriptionEntitlement(undefined).expires_at).toBeNull();
    expect(subscriptionEntitlement(null).expires_at).toBeNull();
    expect(subscriptionEntitlement(0).expires_at).toBeNull();
  });
});

describe('revokedEntitlement', () => {
  it('sets the expiry to the cancellation time so access lapses now', () => {
    const now = new Date('2026-07-07T09:30:00.000Z');
    const row = revokedEntitlement(now);
    expect(row.expires_at).toBe('2026-07-07T09:30:00.000Z');
  });
});

describe('upsertEntitlement', () => {
  it('upserts the entitlements row on the (user_id, entitlement_id) conflict target', async () => {
    await upsertEntitlement('user-1', sprintEntitlement(new Date('2026-07-07T00:00:00.000Z')));

    expect(fromSpy).toHaveBeenCalledWith('entitlements');
    const [payload, options] = upsertSpy.mock.calls[0];
    expect(payload).toMatchObject({
      user_id: 'user-1',
      entitlement_id: ENTITLEMENT_ID,
      store: 'stripe',
    });
    expect(options).toEqual({ onConflict: 'user_id,entitlement_id' });
  });

  it('throws when the write returns an error so the webhook can 500 and be retried', async () => {
    upsertSpy.mockResolvedValueOnce({ error: { message: 'db down' } });
    await expect(
      upsertEntitlement('user-1', revokedEntitlement(new Date())),
    ).rejects.toThrow(/db down/);
  });
});

describe('bumpBudgetOnGrant', () => {
  it('raises a payer to the core tier at a 300-cent cap on the user_id conflict', async () => {
    await bumpBudgetOnGrant('user-9');

    expect(fromSpy).toHaveBeenCalledWith('user_budgets');
    const [payload, options] = upsertSpy.mock.calls[0];
    expect(payload).toMatchObject({ user_id: 'user-9', tier: 'core', cents_cap: 300 });
    expect(options).toEqual({ onConflict: 'user_id' });
  });

  it('does not touch cents_used or period_start so a re-grant cannot reset in-flight usage', async () => {
    await bumpBudgetOnGrant('user-9');
    const [payload] = upsertSpy.mock.calls[0];
    expect(payload).not.toHaveProperty('cents_used');
    expect(payload).not.toHaveProperty('period_start');
  });
});
