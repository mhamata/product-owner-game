import { isTombstone, type SyncEnvelope } from './envelope';

/**
 * The pure two-way reconciliation planner. Given what is in localStorage and
 * what is on the server, it decides — per key — whether to pull the server copy
 * down, push the local copy up, or remove a locally-present key the server has
 * tombstoned. It touches no browser API and no network; the executor applies the
 * plan. Keeping it pure is what lets every branch (including the first-sign-in
 * migration and both tombstone cases) be unit-tested exhaustively.
 *
 * Conflict rule: SERVER WINS when a key exists on both sides. This is the simple,
 * predictable rule for the common case (signing in on a second device pulls your
 * real progress down).
 *
 * KNOWN EDGE (accepted for v1): progress made while signed OUT, AFTER a previous
 * sync, can be overwritten by an older server copy on the next sign-in, because
 * the server copy wins and we carry no per-key vector clock. The mitigation is
 * that while signed IN we push continuously (see the executor), so the server is
 * almost always the freshest copy and this window is rare. A later slice can add
 * per-key timestamps if it proves painful.
 */

/** One planned action for a single key. */
export type SyncAction =
  /** Write the server value into localStorage (server has newer/only copy). */
  | { key: string; op: 'pull' }
  /** Upsert the local value to the server (local has newer/only copy). */
  | { key: string; op: 'push' }
  /** Remove the local key (server tombstoned it, local still has it). */
  | { key: string; op: 'remove-local' };

/** The full plan: the ordered list of per-key actions to apply. */
export interface SyncPlan {
  actions: SyncAction[];
}

/**
 * Reconcile local vs. server.
 *
 * @param local  allowlisted localStorage entries: key -> raw string.
 * @param server learner_state rows for this user: key -> envelope (data column).
 *
 * Special case — FIRST SIGN-IN MIGRATION: when the server has NO rows at all, we
 * push every local key. This is the anonymous→account migration: a brand-new
 * account adopts the browser's existing progress wholesale.
 */
export function planSync(
  local: Map<string, string>,
  server: Map<string, SyncEnvelope>,
): SyncPlan {
  const actions: SyncAction[] = [];

  // First sign-in: an empty server means "brand new account" — push everything
  // local so nothing the anonymous learner earned is lost.
  if (server.size === 0) {
    for (const key of local.keys()) {
      actions.push({ key, op: 'push' });
    }
    return { actions };
  }

  // The union of both key sets, so every key is decided exactly once regardless
  // of which side it lives on.
  const keys = new Set<string>([...local.keys(), ...server.keys()]);

  for (const key of keys) {
    const hasLocal = local.has(key);
    const serverEnv = server.get(key);
    const hasServer = serverEnv !== undefined;
    const serverTombstone = hasServer && isTombstone(serverEnv);

    if (serverTombstone) {
      // The server says this key was cleared. Remove it locally if present;
      // otherwise there is nothing to do (both agree it is gone).
      if (hasLocal) actions.push({ key, op: 'remove-local' });
      continue;
    }

    if (hasServer && hasLocal) {
      // Present on both, server non-tombstone: server wins (see conflict rule).
      actions.push({ key, op: 'pull' });
      continue;
    }

    if (hasServer) {
      // Server-only, non-tombstone: pull it down.
      actions.push({ key, op: 'pull' });
      continue;
    }

    // Local-only: push it up.
    actions.push({ key, op: 'push' });
  }

  return { actions };
}
