/**
 * The allowlist of localStorage keys that sync to `learner_state`.
 *
 * Two families:
 *  - EXACT keys: the eight Zustand persist keys (each store's `name`). The value
 *    versioning lives in the key name (…-v1 / …-v2), so a key rename is a clean
 *    break, never a silent migration.
 *  - PREFIX families: the raw (non-Zustand) localStorage namespaces written
 *    directly by `artifactVersionsV2` and `InterviewSession`. Each concrete key
 *    (prefix + id) becomes its own `store_key` row, and all fit the 64-char
 *    column limit (`praxis:artifact-v2:<skillId>`, `praxis:interview:<caseId>`).
 *
 * Anything NOT matched here never leaves the browser. This is the trust boundary
 * for what we back up, so it is a plain data allowlist, not a heuristic.
 */

/** The eight Zustand persist keys, verbatim from each store's `name`. */
export const EXACT_SYNC_KEYS = [
  'praxis-learn-v2',
  'praxis-review-v1',
  'praxis-game-v1',
  'praxis-calibration-v1',
  'praxis-coach-v1',
  'praxis-industry-v1',
  'praxis-sim-evidence-v1',
  'praxis-sim-difficulty-v1',
] as const;

/** The raw-family prefixes. Every `${prefix}${id}` localStorage key syncs. */
export const SYNC_KEY_PREFIXES = ['praxis:artifact-v2:', 'praxis:interview:'] as const;

const EXACT_SET: ReadonlySet<string> = new Set(EXACT_SYNC_KEYS);

/** True when a localStorage key is in the allowlist (exact match or prefix). */
export function isSyncedKey(key: string): boolean {
  if (EXACT_SET.has(key)) return true;
  return SYNC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}
