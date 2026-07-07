import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * `authHeaders` is spread into every AI fetch, so its "empty when we shouldn't
 * authenticate" behavior is load-bearing: a stray header on an anonymous call
 * would trip the server's auth gate. These pin the three honest-empty cases
 * (server-side, unconfigured, signed-out) and the one signed-in case, by driving
 * the real module against a stubbed `@supabase/supabase-js` and a stubbed
 * `window`.
 *
 * The module memoizes its client, so each test resets modules and re-imports.
 */

const ORIGINAL_ENV = { ...process.env };

// A settable stub for what supabase-js's auth.getSession returns.
let sessionResult: { data: { session: { access_token: string } | null } };

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: async () => sessionResult,
    },
  }),
}));

beforeEach(() => {
  vi.resetModules();
  sessionResult = { data: { session: null } };
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  // @ts-expect-error — clean up the jsdom-free window stub between tests.
  delete globalThis.window;
});

/** Configure the two public env vars so `supabaseConfigured()` is true. */
function configure() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
}

/** Stub a browser `window` so `browserClient()` does not short-circuit on SSR. */
function stubWindow() {
  // @ts-expect-error — minimal window stub; authHeaders only checks it exists.
  globalThis.window = {};
}

describe('authHeaders', () => {
  it('returns an empty object on the server (no window)', async () => {
    configure();
    const { authHeaders } = await import('../client');
    expect(await authHeaders()).toEqual({});
  });

  it('returns an empty object when Supabase is unconfigured', async () => {
    // No env vars: even in a browser, there is no client to ask.
    stubWindow();
    const { authHeaders } = await import('../client');
    expect(await authHeaders()).toEqual({});
  });

  it('returns an empty object when configured but signed out', async () => {
    configure();
    stubWindow();
    sessionResult = { data: { session: null } };
    const { authHeaders } = await import('../client');
    expect(await authHeaders()).toEqual({});
  });

  it('returns a bearer header when configured and signed in', async () => {
    configure();
    stubWindow();
    sessionResult = { data: { session: { access_token: 'jwt-123' } } };
    const { authHeaders } = await import('../client');
    expect(await authHeaders()).toEqual({ Authorization: 'Bearer jwt-123' });
  });
});
