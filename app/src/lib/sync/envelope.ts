/**
 * The row envelope stored in `learner_state.data` (jsonb, NOT NULL).
 *
 * `data` cannot be SQL-NULL and there is no DELETE policy on the table, so a
 * "clear" is an UPDATE to a tombstone, not a row deletion. The envelope makes
 * that explicit: `value` is the PARSED JSON of the localStorage string, or
 * `null` to mean "this key was cleared" (a tombstone). Wrapping the value (vs.
 * storing it bare) also gives us a version field to evolve the shape later
 * without guessing at a bare jsonb payload.
 */

/** The current envelope version. Bump only on a breaking envelope-shape change. */
export const ENVELOPE_VERSION = 1 as const;

/** A `learner_state.data` payload: the parsed value, or a `null` tombstone. */
export interface SyncEnvelope {
  v: typeof ENVELOPE_VERSION;
  /** Parsed JSON of the localStorage string, or null when the key was cleared. */
  value: unknown | null;
}

/**
 * Wrap a raw localStorage string into an envelope. A missing key (`null` in →
 * key absent) becomes a tombstone; a present string is JSON-parsed. If the
 * string is not valid JSON we store it as a raw string value rather than losing
 * it — every synced writer stores JSON today, so this is purely defensive.
 */
export function encodeEnvelope(raw: string | null): SyncEnvelope {
  if (raw === null) return { v: ENVELOPE_VERSION, value: null };
  try {
    return { v: ENVELOPE_VERSION, value: JSON.parse(raw) as unknown };
  } catch {
    return { v: ENVELOPE_VERSION, value: raw };
  }
}

/**
 * Unwrap an envelope back to the localStorage string it should write, or null
 * for a tombstone (meaning: remove the local key). Returns null for anything
 * that does not look like a valid, non-tombstone envelope, so a malformed server
 * row is treated as "nothing to pull" rather than throwing mid-sync.
 */
export function decodeEnvelope(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const env = data as { value?: unknown };
  if (!('value' in env) || env.value === null) return null;
  if (typeof env.value === 'string') return env.value;
  try {
    return JSON.stringify(env.value);
  } catch {
    return null;
  }
}

/** True when a server row is a tombstone (a cleared key). */
export function isTombstone(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const env = data as { value?: unknown };
  return 'value' in env && env.value === null;
}
