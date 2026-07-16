/**
 * Provider-auth failure detection for the AI routes' catch blocks.
 *
 * A rejected/expired/misconfigured ANTHROPIC_API_KEY surfaces as an Anthropic
 * SDK APIError with HTTP status 401 (or 403 for a key without access). Before
 * this helper existed, that error's raw message — provider JSON, request id
 * and all — flowed straight into the player-facing `error` string (QA finding,
 * 2026-07-13). A key problem is an OPERATOR problem, not a player problem, so
 * every AI route maps it to the same calm 200 `unavailable` shape the no-key
 * degrade already uses, right after the reservation is settled back to zero.
 *
 * Duck-typed on `.status` rather than `instanceof Anthropic.APIError` so the
 * route tests (which mock the whole SDK module) can exercise the path with a
 * plain object, and so a future SDK major bump can't silently break the check.
 */
export function isProviderAuthError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const status = (e as { status?: unknown }).status;
  return status === 401 || status === 403;
}
