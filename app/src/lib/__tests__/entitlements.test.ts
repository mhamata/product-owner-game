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

// reconcileBudgetOnLapse's read: `.from('entitlements').select(...).eq(...).eq(...).maybeSingle()`.
// Tests set `entitlementSelectResult` per case; `entitlementEqCalls` records the
// two `.eq(field, value)` pairs the code chained, in order.
type EntitlementSelectResult = { data: { expires_at: string | null } | null; error: { message: string } | null };
let entitlementSelectResult: EntitlementSelectResult = { data: null, error: null };
const entitlementEqCalls: [string, unknown][] = [];
const maybeSingleSpy = vi.fn(async () => entitlementSelectResult);
const selectSpy = vi.fn(() => ({
  eq: (field: string, value: unknown) => {
    entitlementEqCalls.push([field, value]);
    return {
      eq: (field2: string, value2: unknown) => {
        entitlementEqCalls.push([field2, value2]);
        return { maybeSingle: maybeSingleSpy };
      },
    };
  },
}));

// reconcileBudgetOnLapse's downgrade write: `.from('user_budgets').update(payload).eq(...).eq(...)`.
// `updatePayloads` records the payload; `updateEqCalls` records the two filters.
type UpdateResult = { error: { message: string } | null };
let updateResult: UpdateResult = { error: null };
const updatePayloads: Record<string, unknown>[] = [];
const updateEqCalls: [string, unknown][] = [];
const updateSpy = vi.fn((payload: Record<string, unknown>) => {
  updatePayloads.push(payload);
  return {
    eq: (field: string, value: unknown) => {
      updateEqCalls.push([field, value]);
      return {
        eq: (field2: string, value2: unknown) => {
          updateEqCalls.push([field2, value2]);
          return Promise.resolve(updateResult);
        },
      };
    },
  };
});

const fromSpy = vi.fn(() => ({ upsert: upsertSpy, select: selectSpy, update: updateSpy }));

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
  isEntitlementLive,
  reconcileBudgetOnLapse,
} from '../entitlements';

beforeEach(() => {
  upsertSpy.mockClear();
  fromSpy.mockClear();
  selectSpy.mockClear();
  updateSpy.mockClear();
  maybeSingleSpy.mockClear();
  upsertSpy.mockResolvedValue({ error: null });
  entitlementSelectResult = { data: null, error: null };
  entitlementEqCalls.length = 0;
  updateResult = { error: null };
  updatePayloads.length = 0;
  updateEqCalls.length = 0;
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

describe('isEntitlementLive', () => {
  const now = new Date('2026-07-11T12:00:00.000Z');

  it('is false for a null row (never purchased, or lookup found nothing)', () => {
    expect(isEntitlementLive(null, now)).toBe(false);
  });

  it('is false for an undefined row', () => {
    expect(isEntitlementLive(undefined, now)).toBe(false);
  });

  it('is true when expires_at is null (a never-expiring grant)', () => {
    expect(isEntitlementLive({ expires_at: null }, now)).toBe(true);
  });

  it('is false once expires_at is in the past', () => {
    expect(isEntitlementLive({ expires_at: '2026-07-01T00:00:00.000Z' }, now)).toBe(false);
  });

  it('is true while expires_at is in the future', () => {
    expect(isEntitlementLive({ expires_at: '2026-08-01T00:00:00.000Z' }, now)).toBe(true);
  });

  it('is false exactly at the expiry instant (strictly-after, not on-or-after)', () => {
    expect(isEntitlementLive({ expires_at: now.toISOString() }, now)).toBe(false);
  });
});

describe('reconcileBudgetOnLapse', () => {
  it('reads the (user_id, interview-gym) entitlement row from any store', async () => {
    entitlementSelectResult = { data: { expires_at: '2026-08-01T00:00:00.000Z' }, error: null };
    await reconcileBudgetOnLapse('user-1');

    expect(fromSpy).toHaveBeenCalledWith('entitlements');
    expect(entitlementEqCalls).toEqual([
      ['user_id', 'user-1'],
      ['entitlement_id', ENTITLEMENT_ID],
    ]);
  });

  it('returns entitled: true and writes nothing when the entitlement is live', async () => {
    entitlementSelectResult = { data: { expires_at: '2026-08-01T00:00:00.000Z' }, error: null };
    const result = await reconcileBudgetOnLapse('user-1');

    expect(result).toEqual({ entitled: true });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('downgrades the budget to free and returns entitled: false when the entitlement has lapsed', async () => {
    entitlementSelectResult = { data: { expires_at: '2026-01-01T00:00:00.000Z' }, error: null };
    const result = await reconcileBudgetOnLapse('user-9');

    expect(result).toEqual({ entitled: false });
    expect(fromSpy).toHaveBeenCalledWith('user_budgets');
    expect(updatePayloads[0]).toMatchObject({ tier: 'free', cents_cap: 15 });
    expect(updatePayloads[0]).toHaveProperty('updated_at');
    expect(updatePayloads[0]).not.toHaveProperty('cents_used');
    expect(updatePayloads[0]).not.toHaveProperty('period_start');
    expect(updateEqCalls).toEqual([
      ['user_id', 'user-9'],
      ['tier', 'core'],
    ]);
  });

  it('treats a missing entitlement row (never purchased) as lapsed and returns entitled: false', async () => {
    entitlementSelectResult = { data: null, error: null };
    const result = await reconcileBudgetOnLapse('user-2');

    expect(result).toEqual({ entitled: false });
    // The tier='core' filter makes this a no-op in Postgres for a user who has
    // no row or is already free; we only assert the call shape here.
    expect(updatePayloads[0]).toMatchObject({ tier: 'free', cents_cap: 15 });
  });

  it('throws when the entitlement read fails', async () => {
    entitlementSelectResult = { data: null, error: { message: 'read down' } };
    await expect(reconcileBudgetOnLapse('user-1')).rejects.toThrow(/read down/);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('throws when the downgrade write fails', async () => {
    entitlementSelectResult = { data: { expires_at: '2026-01-01T00:00:00.000Z' }, error: null };
    updateResult = { error: { message: 'write down' } };
    await expect(reconcileBudgetOnLapse('user-1')).rejects.toThrow(/write down/);
  });
});
