/**
 * In-memory sliding-window rate limiter for the public LLM endpoints.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every route that calls a paid model (grade, grade-artifact, retro) is a public
 * POST with no auth. Without a cap, a single visitor (or a bot) could fan out
 * thousands of requests and run up a real bill. The hard rule for this project
 * is: no uncapped public LLM endpoint. This module is the one shared cap.
 *
 * DESIGN
 * ------
 * A true sliding window (not a fixed bucket): we keep the timestamps of recent
 * hits per key and, on each call, drop anything older than the window before
 * counting. That avoids the fixed-window edge case where 2x the limit can slip
 * through across a boundary.
 *
 * The store is a plain Map in module scope, so it lives for the lifetime of the
 * server process. Next.js route handlers default to the Node.js runtime, where
 * module state persists across requests within an instance, which is exactly
 * what we want for a lightweight in-process limiter. It is intentionally NOT a
 * distributed limiter: across many serverless instances each instance keeps its
 * own window, so the effective cap is per-instance. For this app (a low-traffic
 * teaching tool whose production deploy has no API key at all, so it never even
 * reaches the model) that is the right amount of protection for the complexity.
 * If this ever needs a global cap, swap the Map for a shared store (Redis,
 * Upstash) behind the same `checkRateLimit` signature.
 *
 * The window is also self-cleaning: each check prunes the key it touches, and a
 * cheap opportunistic sweep drops fully-expired keys so the Map cannot grow
 * without bound under a spray of distinct client ids.
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
 * Reset all rate-limit state. Test-only hook so suites do not leak windows into
 * each other. Not exported through any route.
 */
export function _resetRateLimitState(): void {
  hits.clear();
  lastSweep = 0;
}
