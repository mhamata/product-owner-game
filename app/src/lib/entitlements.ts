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
 * multiply by 1000. A missing/zero period end yields a null expiry rather than
 * the 1970 epoch — the webhook logs and ignores that malformed case.
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
 * DELIBERATE FOLLOW-UP: the reverse — downgrading the cap/tier back when an
 * entitlement lapses — is NOT reconciled here. Expiry→downgrade reconciliation
 * is a documented Phase-1 follow-up (see docs/PHASE1.md, slice D next-actions).
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
