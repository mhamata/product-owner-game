/**
 * In-memory cost guardrails for the public LLM endpoints.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every route that calls a paid model (grade, grade-artifact, retro, roleplay) is
 * a public POST with no auth. Without a cap, a single visitor (or a bot) could
 * fan out thousands of requests and run up a real bill. The hard rule for this
 * project is: no public LLM endpoint may be able to run up the bill. This module
 * holds the three guarantees that enforce that, in increasing strength:
 *
 *  1. PER-CLIENT RATE LIMIT (`checkRateLimit`). A sliding window per client key
 *     (session token, else IP). Slows a single identified client.
 *  2. PER-CLIENT REPLY COUNTER (`countReply` / `recordReply`). Server-tracked
 *     count of paid roleplay `reply` calls per client+session, so the multi-turn
 *     roleplay loop cannot be reset by a crafted client posting a fresh short
 *     transcript every request. This is authoritative for the roleplay turn cap.
 *  3. GLOBAL USAGE CEILING (`checkGlobalBudget` / `recordModelCall`). A single
 *     rolling-window counter of total model calls across ALL clients and ALL
 *     endpoints. This is the HARD cost cap: per-client limits slow one identity,
 *     but only a global ceiling stops cost when an attacker rotates client keys
 *     and IPs without bound. Every LLM route must consult it right before spend.
 *
 * DESIGN
 * ------
 * A true sliding window (not a fixed bucket): we keep the timestamps of recent
 * hits per key and, on each call, drop anything older than the window before
 * counting. That avoids the fixed-window edge case where 2x the limit can slip
 * through across a boundary. The global ceiling uses the same rolling-window
 * technique over one shared list of timestamps.
 *
 * The stores are plain module-scope state, so they live for the lifetime of the
 * server process. Next.js route handlers default to the Node.js runtime, where
 * module state persists across requests within an instance, which is exactly
 * what we want for a lightweight in-process guardrail.
 *
 * ONE HONEST CAVEAT (applies to all three stores, the global ceiling included):
 * the state is PER PROCESS. On a multi-instance serverless deployment each
 * instance keeps its own counters, so the effective global ceiling is
 * (ceiling x instance count) rather than a single number across the fleet. A
 * shared store (Redis, Upstash) behind these same signatures would make the
 * ceiling strictly global. For this app (a low-traffic teaching tool) the
 * per-instance ceiling is the accepted bound: it still turns "unbounded spend"
 * into "bounded by a small, known multiple", which is the guarantee we need.
 *
 * The windows are also self-cleaning: each per-client check prunes the key it
 * touches, a cheap opportunistic sweep drops fully-expired keys so the Maps
 * cannot grow without bound under a spray of distinct client ids, and the global
 * window is pruned on every read and write.
 */

/** Tunable limits for one logical endpoint. */
export interface RateLimitOptions {
  /** Max requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** Outcome of a rate-limit check, with the numbers a 429 response needs. */
export interface RateLimitResult {
  /** True when the caller is under the cap and may proceed. */
  allowed: boolean;
  /** The configured ceiling (for the X-RateLimit-Limit header). */
  limit: number;
  /** Requests still available in the current window after this call. */
  remaining: number;
  /** Seconds until the window frees up enough for one more request. */
  retryAfterSeconds: number;
}

/** Per-key ring of recent hit timestamps (ms epoch), oldest first. */
const hits = new Map<string, number[]>();

/** Timestamp of the last opportunistic sweep, to bound how often we scan. */
let lastSweep = 0;

/**
 * Drop keys whose most recent hit is older than `maxIdleMs`, so a flood of
 * one-shot client ids cannot leak memory. Cheap and infrequent: we only scan
 * when at least `maxIdleMs` has elapsed since the previous sweep.
 */
function sweep(now: number, maxIdleMs: number): void {
  if (now - lastSweep < maxIdleMs) return;
  lastSweep = now;
  for (const [key, times] of hits) {
    const last = times[times.length - 1];
    if (last === undefined || now - last > maxIdleMs) hits.delete(key);
  }
}

/**
 * Record a hit for `key` and report whether it is allowed under the sliding
 * window. Call exactly once per request you intend to count.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  const windowStart = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= limit) {
    // Over the cap: do NOT record this hit (so a hammering client cannot push
    // its own window further out). Retry-after is when the oldest hit ages out.
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    hits.set(key, recent);
    return { allowed: false, limit, remaining: 0, retryAfterSeconds };
  }

  recent.push(now);
  hits.set(key, recent);
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - recent.length),
    retryAfterSeconds: 0,
  };
}

/* ------------------------------------------------------------------
   PER-CLIENT REPLY COUNTER (the server-authoritative roleplay turn cap).

   The roleplay `reply` action is multi-turn, so the turn cap cannot be trusted
   to the client-supplied transcript: a crafted client can post a fresh, short
   `messages` array every request and loop the paid `reply` call forever. We
   therefore track, server-side, how many `reply` calls each client+session has
   actually spent, and refuse once that SERVER count hits the cap regardless of
   what the client sends. The client-array pre-check stays as a fast path, but
   THIS counter is authoritative.

   Keyed by the same client key the rate limiter uses (session token, else IP),
   so a fresh session legitimately gets its own turn budget while a single
   session cannot escape the cap by reshaping its payload.
   ------------------------------------------------------------------ */

/** Per-key count of paid roleplay replies spent so far this process lifetime. */
const replyCounts = new Map<string, number>();

/**
 * How many roleplay `reply` calls `key` has already spent. Pure read, so the
 * route can compare against the cap before deciding to generate another reply.
 */
export function countReply(key: string): number {
  return replyCounts.get(key) ?? 0;
}

/**
 * Record that `key` just spent one paid roleplay reply, returning the new total.
 * Call exactly once per SUCCESSFUL `reply` model call so the server-tracked count
 * is the source of truth for the turn cap.
 */
export function recordReply(key: string): number {
  const next = countReply(key) + 1;
  replyCounts.set(key, next);
  return next;
}

/* ------------------------------------------------------------------
   GLOBAL USAGE CEILING (the hard cost cap).

   The per-client limiter slows one identity; it does nothing against an attacker
   who rotates the session token and source IP on every request, which mints a
   fresh per-client window each time. The only thing that bounds cost in that case
   is a ceiling on TOTAL model calls across everyone. This rolling-window counter
   is that ceiling: every LLM route consults it right before spending and, once
   the window is full, returns a calm "at capacity" response WITHOUT calling the
   model. This is the guarantee that no amount of key/IP rotation can run up the
   bill (bounded per process; see the per-instance caveat in the file header).
   ------------------------------------------------------------------ */

/** Parse a positive-integer env override, falling back to `fallback`. */
function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * Max model calls allowed across ALL clients and ALL endpoints within
 * `GLOBAL_WINDOW_MS`. A sane default for a low-traffic teaching tool, overridable
 * via env for a louder launch without a code change. Read once at module load.
 */
const GLOBAL_DAILY_CEILING = envInt('PRAXIS_GLOBAL_LLM_CALLS_PER_DAY', 500);

/** Rolling window the global ceiling is measured over (24h). */
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Timestamps (ms epoch) of recent model calls across the whole process. */
let globalCalls: number[] = [];

/** Drop global-call timestamps that have aged out of the rolling window. */
function pruneGlobal(now: number): void {
  const windowStart = now - GLOBAL_WINDOW_MS;
  // Calls are appended in time order, so the live tail starts at the first
  // timestamp still inside the window; slice from there.
  let i = 0;
  while (i < globalCalls.length && globalCalls[i] <= windowStart) i += 1;
  if (i > 0) globalCalls = globalCalls.slice(i);
}

/** Outcome of a global-budget check, with the numbers a response may want. */
export interface GlobalBudgetResult {
  /** True when the global ceiling has NOT been reached and a call may proceed. */
  allowed: boolean;
  /** The configured ceiling (calls per window). */
  ceiling: number;
  /** Calls already spent in the current rolling window. */
  used: number;
}

/**
 * Report whether the process is under its global model-call ceiling for the
 * current rolling window. Read-only: call this right before spending, and only
 * call `recordModelCall` once you actually spend. When `allowed` is false the
 * route must return the calm "at capacity" payload and NOT call the model.
 */
export function checkGlobalBudget(): GlobalBudgetResult {
  const now = Date.now();
  pruneGlobal(now);
  const used = globalCalls.length;
  return { allowed: used < GLOBAL_DAILY_CEILING, ceiling: GLOBAL_DAILY_CEILING, used };
}

/**
 * Record one model call against the global ceiling. Call exactly once per call
 * actually sent to the model (after `checkGlobalBudget` allowed it), so the
 * rolling-window count stays honest.
 */
export function recordModelCall(): void {
  const now = Date.now();
  pruneGlobal(now);
  globalCalls.push(now);
}

/**
 * Derive a stable client key from a request. Prefers the explicit per-session
 * token the client sends (so two learners behind one office IP get separate
 * budgets), then falls back to the forwarded client IP, then to a shared
 * "anonymous" bucket. The `prefix` namespaces one endpoint's window from
 * another so a learner's grading budget and retro budget do not share a counter.
 */
export function clientKeyFromRequest(request: Request, prefix: string): string {
  const sessionToken = request.headers.get('x-praxis-session');
  if (sessionToken) return `${prefix}:session:${sessionToken.slice(0, 64)}`;

  // x-forwarded-for is a comma-separated list; the first entry is the client.
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim();
  if (ip) return `${prefix}:ip:${ip}`;

  return `${prefix}:anon`;
}

/**
 * Build a ready-to-return 429 response with the standard rate-limit headers.
 * Kept here so every endpoint reports the cap identically.
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      error: 'Rate limit reached. Please wait a moment before submitting again.',
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  );
}

/**
 * Reset all guardrail state (per-client windows, per-client reply counts, and the
 * global ceiling window). Test-only hook so suites do not leak state into each
 * other. Not exported through any route.
 */
export function _resetRateLimitState(): void {
  hits.clear();
  lastSweep = 0;
  replyCounts.clear();
  globalCalls = [];
}
