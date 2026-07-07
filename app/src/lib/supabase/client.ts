import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase access for the auth UI + progress sync.
 *
 * The design is deliberately cookie-free: we use plain `@supabase/supabase-js`
 * (NOT `@supabase/ssr`). The client persists its session in localStorage, and
 * every authenticated API call carries an `Authorization: Bearer <token>` header
 * that the server scaffold (`getUserFromRequest`) already validates. Pages are
 * client components; there is no server session to keep in sync.
 *
 * Everything here degrades calmly when the two NEXT_PUBLIC vars are unset (they
 * are unset in this environment): `browserClient()` returns null, `authHeaders()`
 * returns `{}`, and the app runs exactly as it does today. The same helpers are
 * server-safe — they return the "unconfigured" result rather than reaching for a
 * `window` that does not exist during SSR.
 */

/** True only when BOTH public Supabase vars are present (mirrors server.ts). */
export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// Lazily-created singleton. supabase-js keeps auth state in this instance and in
// localStorage, so there must be exactly one per tab; a second client would
// fight the first over the persisted session and the auth-state subscription.
let cachedClient: SupabaseClient | null = null;

/**
 * The browser Supabase client, or null when unconfigured or on the server.
 *
 * Auth options are the library defaults spelled out for intent: the session is
 * persisted (so a reload stays signed in), the OAuth redirect back to /account
 * is detected and consumed from the URL, and the flow is PKCE (the correct,
 * public-client OAuth flow). `null` on the server keeps this import safe to pull
 * into modules that also run during SSR.
 */
export function browserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseConfigured()) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        flowType: 'pkce',
      },
    },
  );
  return cachedClient;
}

/**
 * The bearer header for the current session, or `{}` when signed out /
 * unconfigured / on the server. Never throws — a failed `getSession` (offline,
 * corrupt storage) degrades to the anonymous `{}` rather than breaking the AI
 * call that spreads this in.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const client = browserClient();
  if (!client) return {};
  try {
    const { data } = await client.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
