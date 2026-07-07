import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

/**
 * Server-side Supabase access for API routes.
 *
 * Two clients, two trust levels:
 *  - `getUserFromRequest` validates the caller's bearer token against Supabase
 *    Auth and returns the user (or null). Routes use it to decide WHO is asking.
 *  - `serviceClient` uses the service-role key (RLS bypass) for the writes
 *    only the server may perform: budgets, usage log, entitlements. It must
 *    never be handed request-derived SQL or leak to the client bundle.
 *
 * All of it is optional-by-configuration: with no Supabase env vars set, the
 * helpers report "not configured" and the AI routes keep their current
 * anonymous behavior (PRAXIS_AUTH_MODE=off). This keeps local dev and the
 * current production deploy working unchanged until auth is turned on.
 */

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Auth mode for the AI routes:
 *  - 'off'      (default) anonymous access, in-memory rate limits only
 *  - 'required' verified Supabase JWT + per-user budget gate
 */
export function authMode(): 'off' | 'required' {
  return process.env.PRAXIS_AUTH_MODE === 'required' ? 'required' : 'off';
}

/** Validate the request's bearer token; null when absent/invalid/unconfigured. */
export async function getUserFromRequest(request: Request): Promise<User | null> {
  if (!supabaseConfigured()) return null;

  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return null;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

let cachedServiceClient: SupabaseClient | null = null;

/** Service-role client (RLS bypass). Throws when the key is not configured. */
export function serviceClient(): SupabaseClient {
  if (cachedServiceClient) return cachedServiceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL are not configured');
  }
  cachedServiceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedServiceClient;
}
