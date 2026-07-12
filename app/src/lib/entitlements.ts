import { serviceClient } from '@/lib/supabase/server';
import { SPRINT_DURATION_DAYS } from '@/lib/stripe';

/**
 * Entitlement mapping + server-only writes for the Interview Gym wedge.
 *
 * Two responsibilities, kept apart so the mapping stays pure and unit-testable:
 *  - PURE: turn a Stripe webhook fact (a sprint purchase, a subscription's
 *    period end, a cancellation) into an `entitlements` row. No I/O, no clock
 *    reached for implicitly — the caller passes `now`, so the 42-day math and
 *    the unix-seconds conversion are deterministic under test.
 *  - WRITES: `upsertEntitlement` and `bumpBudgetOnGrant` use the service-role
 *    client (RLS bypass). The `entitlements` and `user_budgets` tables have NO
 *    client write policies (see the Phase-0 migration): money- and rating-
 *    adjacent state is server-written only.
 *
 * We revoke by EXPIRY, never by DELETE: a cancelled subscription sets
 * `expires_at` to now, so the row (and its audit trail) survives and access
 * simply lapses.
 */

/** The single entitlement the wedge sells. Both plans grant exactly this. */
export const ENTITLEMENT_ID = 'interview-gym';

/** An `entitlements` row minus the user_id (supplied at write time). */
export interface EntitlementRow {
  entitlement_id: string;
  store: 'stripe';
  /** ISO timestamp, or null for a never-expiring grant (unused today). */
  expires_at: string | null;
}

/**
 * A completed sprint purchase at time `now` grants the entitlement for six
 * weeks. `now` is a Date so the conversion is testable; the route passes
 * `new Date()`.
 */
export function sprintEntitlement(now: Date): EntitlementRow {
  const expires = new Date(now.getTime() + SPRINT_DURATION_DAYS * 24 * 60 * 60 * 1000);
  return {
    entitlement_id: ENTITLEMENT_ID,
    store: 'stripe',
    expires_at: expires.toISOString(),
  };
}

/**
 * A subscription grants the entitlement until its current period end. Stripe
 * sends `current_period_end` as UNIX SECONDS; JS Date wants milliseconds, so we
 * multiply by 1000.
 *
 * This function stays null-tolerant defensively — a missing/zero period end
 * yields a null expiry rather than the 1970 epoch. But the WEBHOOK never lets a
 * null reach here: it guards on `periodEndOf(sub) === null`, logs, and ignores
 * the event, precisely because a null expiry would be a NEVER-EXPIRING grant
 * (see `EntitlementRow.expires_at`). So the null branch below is belt-and-braces,
 * not a live path.
 */
export function subscriptionEntitlement(currentPeriodEndUnixSeconds: number | null | undefined): EntitlementRow {
  const expires_at =
    currentPeriodEndUnixSeconds && currentPeriodEndUnixSeconds > 0
      ? new Date(currentPeriodEndUnixSeconds * 1000).toISOString()
      : null;
  return { entitlement_id: ENTITLEMENT_ID, store: 'stripe', expires_at };
}

/**
 * A cancelled/deleted subscription revokes access by setting the expiry to
 * `now` — never a DELETE, so the grant history is preserved.
 */
export function revokedEntitlement(now: Date): EntitlementRow {
  return {
    entitlement_id: ENTITLEMENT_ID,
    store: 'stripe',
    expires_at: now.toISOString(),
  };
}

/**
 * Upsert the entitlement row for a user. Conflict target is the table's
 * composite primary key (`user_id, entitlement_id`) so a re-grant (renewal,
 * plan change) overwrites the same row's expiry rather than inserting a
 * duplicate. Service-role only.
 */
export async function upsertEntitlement(userId: string, row: EntitlementRow): Promise<void> {
  const { error } = await serviceClient()
    .from('entitlements')
    .upsert({ user_id: userId, ...row, updated_at: new Date().toISOString() }, {
      onConflict: 'user_id,entitlement_id',
    });
  if (error) throw new Error(`upsertEntitlement failed: ${error.message}`);
}

/**
 * Raise a payer's monthly AI budget to the 'core' tier when they buy.
 *
 * We upsert `user_budgets` to `tier='core', cents_cap=300`. On conflict we touch
 * ONLY the cap and the tier — `cents_used` and `period_start` are left alone so
 * we never reset someone's in-flight monthly usage by granting them again (a
 * renewal must not hand back this month's spent allowance).
 *
 * The reverse — downgrading the cap/tier back when an entitlement lapses — is
 * NOT reconciled here (this function only ever raises). See
 * `reconcileBudgetOnLapse` below for that: it is a separate, lazy,
 * request-time check rather than something folded into this grant path,
 * because a grant is a webhook event but a lapse is discovered by the
 * absence of one (see docs/PHASE1.md, slice D decisions).
 */
export async function bumpBudgetOnGrant(userId: string): Promise<void> {
  const { error } = await serviceClient()
    .from('user_budgets')
    .upsert(
      { user_id: userId, tier: 'core', cents_cap: 300, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) throw new Error(`bumpBudgetOnGrant failed: ${error.message}`);
}

/**
 * Pure: is this `entitlements` row live at `now`?
 *
 * `null`/`undefined` (no row at all — never purchased, or a lookup that found
 * nothing) is NOT live. A `null` expires_at is the never-expiring-grant shape
 * `EntitlementRow` documents (unused by any writer today, but a valid value in
 * the type); we treat that as live. Otherwise the row is live only strictly
 * AFTER `now` — the moment of expiry itself does not count, matching how
 * `revokedEntitlement` sets `expires_at` to the exact cancellation instant.
 */
export function isEntitlementLive(
  row: { expires_at: string | null } | null | undefined,
  now: Date,
): boolean {
  if (!row) return false;
  if (row.expires_at === null) return true;
  return new Date(row.expires_at).getTime() > now.getTime();
}

/**
 * Lazy expiry->downgrade reconciliation: the counterpart `bumpBudgetOnGrant`
 * deliberately left undone (see its DELIBERATE FOLLOW-UP note above, and
 * docs/PHASE1.md slice D). Called at request time from the AI routes rather
 * than a scheduled job, so a lapsed subscriber is caught on their very next
 * request instead of waiting on a cron.
 *
 * Design: the entitlement does not hard-wall the AI routes. It only decides
 * which budget TIER the existing budget gate enforces against. Reading the
 * live entitlement, then downgrading the budget row when it has lapsed, keeps
 * that gate honest without adding a second enforcement path.
 *
 * The downgrade is an UPDATE, not an upsert: filtered to `tier = 'core'` so it
 * is a no-op for users who are already on `free` (no spurious `updated_at`
 * churn) and so a user with no `user_budgets` row yet is simply left alone —
 * `reserve_budget` creates that row at the free default on first use anyway.
 * `cents_used` / `period_start` are never touched here: a lapsed entitlement
 * must not reset or extend a month's in-flight usage, only cap it going
 * forward.
 */
export async function reconcileBudgetOnLapse(userId: string): Promise<{ entitled: boolean }> {
  const now = new Date();
  const { data, error } = await serviceClient()
    .from('entitlements')
    .select('expires_at')
    .eq('user_id', userId)
    .eq('entitlement_id', ENTITLEMENT_ID)
    .maybeSingle();
  if (error) throw new Error(`reconcileBudgetOnLapse read failed: ${error.message}`);

  if (isEntitlementLive(data as { expires_at: string | null } | null, now)) {
    return { entitled: true };
  }

  const { error: downgradeError } = await serviceClient()
    .from('user_budgets')
    .update({ tier: 'free', cents_cap: 15, updated_at: now.toISOString() })
    .eq('user_id', userId)
    .eq('tier', 'core');
  if (downgradeError) {
    throw new Error(`reconcileBudgetOnLapse downgrade failed: ${downgradeError.message}`);
  }

  return { entitled: false };
}
