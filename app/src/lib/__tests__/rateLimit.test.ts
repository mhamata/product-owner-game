import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkRateLimit,
  checkGlobalBudget,
  clientKeyFromRequest,
  countReply,
  rateLimitedResponse,
  recordModelCall,
  recordReply,
  _resetRateLimitState,
} from '../rateLimit';

/**
 * The rate limiter is the one guardrail keeping the public LLM endpoints from
 * being uncapped, so its window behavior is worth pinning. These tests use fake
 * timers to walk the sliding window deterministically.
 */

const OPTS = { limit: 3, windowMs: 1000 };

beforeEach(() => {
  _resetRateLimitState();
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRateLimit', () => {
  it('allows requests up to the limit within the window', () => {
    expect(checkRateLimit('a', OPTS).allowed).toBe(true);
    expect(checkRateLimit('a', OPTS).allowed).toBe(true);
    expect(checkRateLimit('a', OPTS).allowed).toBe(true);
  });

  it('blocks the request that exceeds the limit within the window', () => {
    checkRateLimit('a', OPTS);
    checkRateLimit('a', OPTS);
    checkRateLimit('a', OPTS);
    const fourth = checkRateLimit('a', OPTS);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('reports remaining requests as the window fills', () => {
    expect(checkRateLimit('a', OPTS).remaining).toBe(2);
    expect(checkRateLimit('a', OPTS).remaining).toBe(1);
    expect(checkRateLimit('a', OPTS).remaining).toBe(0);
  });

  it('keeps a separate window per key', () => {
    checkRateLimit('a', OPTS);
    checkRateLimit('a', OPTS);
    checkRateLimit('a', OPTS);
    // A different key is unaffected by the first key being maxed out.
    expect(checkRateLimit('b', OPTS).allowed).toBe(true);
  });

  it('allows a new request once the oldest hit ages out of the window', () => {
    checkRateLimit('a', OPTS); // t=0
    vi.setSystemTime(400);
    checkRateLimit('a', OPTS); // t=400
    vi.setSystemTime(800);
    checkRateLimit('a', OPTS); // t=800, now at limit
    expect(checkRateLimit('a', OPTS).allowed).toBe(false);

    // At t=1001 the first hit (t=0) has aged out, freeing one slot.
    vi.setSystemTime(1001);
    expect(checkRateLimit('a', OPTS).allowed).toBe(true);
  });

  it('does not count a blocked request against the window', () => {
    checkRateLimit('a', OPTS);
    checkRateLimit('a', OPTS);
    checkRateLimit('a', OPTS);
    // Hammer while blocked: these must not push the window further out.
    vi.setSystemTime(500);
    checkRateLimit('a', OPTS); // blocked, not recorded
    checkRateLimit('a', OPTS); // blocked, not recorded
    // The window is still anchored on the first three hits at t=0, so at
    // t=1001 a fresh request is allowed.
    vi.setSystemTime(1001);
    expect(checkRateLimit('a', OPTS).allowed).toBe(true);
  });
});

describe('clientKeyFromRequest', () => {
  it('prefers the per-session token so users behind one IP get separate budgets', () => {
    const req = new Request('http://x', {
      headers: { 'x-praxis-session': 'sess-123', 'x-forwarded-for': '1.2.3.4' },
    });
    expect(clientKeyFromRequest(req, 'grade')).toBe('grade:session:sess-123');
  });

  it('falls back to the first forwarded IP when there is no session token', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' },
    });
    expect(clientKeyFromRequest(req, 'grade')).toBe('grade:ip:9.9.9.9');
  });

  it('falls back to an anonymous bucket when no client hints are present', () => {
    const req = new Request('http://x');
    expect(clientKeyFromRequest(req, 'grade')).toBe('grade:anon');
  });

  it('namespaces by prefix so different endpoints do not share a counter', () => {
    const req = new Request('http://x', { headers: { 'x-praxis-session': 's' } });
    expect(clientKeyFromRequest(req, 'grade')).not.toBe(
      clientKeyFromRequest(req, 'retro'),
    );
  });
});

describe('rateLimitedResponse', () => {
  it('returns a 429 with Retry-After and rate-limit headers', async () => {
    const res = rateLimitedResponse({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterSeconds: 42,
    });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    const body = (await res.json()) as { retryAfterSeconds: number };
    expect(body.retryAfterSeconds).toBe(42);
  });
});

describe('per-client reply counter (server-authoritative roleplay turn cap)', () => {
  it('starts at zero for an unseen key', () => {
    expect(countReply('roleplay:session:abc:reply:scn')).toBe(0);
  });

  it('increments on each recorded reply and reports the running total', () => {
    const key = 'roleplay:session:abc:reply:scn';
    expect(recordReply(key)).toBe(1);
    expect(recordReply(key)).toBe(2);
    expect(countReply(key)).toBe(2);
  });

  it('keeps a separate count per key (session/scenario)', () => {
    const a = 'roleplay:session:abc:reply:scn';
    const b = 'roleplay:session:xyz:reply:scn';
    recordReply(a);
    recordReply(a);
    expect(countReply(a)).toBe(2);
    // A different client+session counts independently.
    expect(countReply(b)).toBe(0);
  });

  it('does not decay with time: it is a session lifetime count, not a window', () => {
    const key = 'roleplay:session:abc:reply:scn';
    recordReply(key);
    vi.setSystemTime(60 * 60 * 1000); // an hour later
    // The count is intentionally not a rolling window; the turn cap is per
    // session for its whole life, so a slow looping client cannot wait it out.
    expect(countReply(key)).toBe(1);
  });
});

describe('global usage ceiling (the hard cost cap)', () => {
  // The module reads its ceiling from env once at import, so under test we drive
  // the COUNT up to whatever that ceiling is rather than hard-coding 500. We read
  // the ceiling back from the first check.
  it('allows calls below the ceiling and blocks once it is reached', () => {
    const { ceiling } = checkGlobalBudget();
    expect(ceiling).toBeGreaterThan(0);

    for (let i = 0; i < ceiling; i += 1) {
      const before = checkGlobalBudget();
      expect(before.allowed).toBe(true);
      expect(before.used).toBe(i);
      recordModelCall();
    }

    // At the ceiling, the next check refuses (this is the path a route turns into
    // a calm "at capacity" 200, calling no model).
    const atCap = checkGlobalBudget();
    expect(atCap.allowed).toBe(false);
    expect(atCap.used).toBe(ceiling);
  });

  it('counts calls across DIFFERENT client keys against one shared ceiling', () => {
    // The whole point of the global ceiling: rotating the client key/IP does not
    // mint fresh budget, because the ceiling is not keyed by client at all.
    const { ceiling } = checkGlobalBudget();
    for (let i = 0; i < ceiling; i += 1) {
      // Pretend each call came from a brand-new client; the global counter does
      // not care, so the ceiling still bites.
      clientKeyFromRequest(
        new Request('http://x', { headers: { 'x-praxis-session': `rotating-${i}` } }),
        'roleplay',
      );
      recordModelCall();
    }
    expect(checkGlobalBudget().allowed).toBe(false);
  });

  it('frees budget as calls age out of the 24h rolling window', () => {
    const { ceiling } = checkGlobalBudget();
    // Fill the window at t=0.
    for (let i = 0; i < ceiling; i += 1) recordModelCall();
    expect(checkGlobalBudget().allowed).toBe(false);

    // Just past 24h, every recorded call has aged out, so the window is clear.
    vi.setSystemTime(24 * 60 * 60 * 1000 + 1);
    const after = checkGlobalBudget();
    expect(after.allowed).toBe(true);
    expect(after.used).toBe(0);
  });
});
