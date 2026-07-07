'use client';

import { create } from 'zustand';
import { browserClient, supabaseConfigured } from '@/lib/supabase/client';

/**
 * Auth + sync status for the account UI. Deliberately NOT persisted: the source
 * of truth for the session is supabase-js (localStorage-backed) via `getSession`
 * and `onAuthStateChange`; this store is just the React-facing mirror of that,
 * plus the progress-sync status line the account card renders. Persisting it
 * would risk showing a stale "signed-in" before supabase-js has actually
 * rehydrated its session.
 */

/** The auth lifecycle as the UI sees it. */
export type AuthStatus = 'unconfigured' | 'loading' | 'signed-out' | 'signed-in';

/** The phase of the progress sync (drives the account card's status line). */
export type SyncPhase = 'idle' | 'syncing' | 'synced' | 'error';

/** The minimal user shape the UI needs (never the full Supabase user object). */
export interface AuthUser {
  id: string;
  email: string | null;
  /** The sign-in provider ("email", "google", "apple", …), for the UI copy. */
  provider: string | null;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  syncPhase: SyncPhase;
  lastSyncedAt: number | null;
  syncError: string | null;
}

interface AuthActions {
  setSession: (status: AuthStatus, user: AuthUser | null) => void;
  setSyncPhase: (phase: SyncPhase) => void;
  setSynced: (at: number) => void;
  setSyncError: (message: string | null) => void;
  resetSync: () => void;
}

export type AuthStore = AuthState & AuthActions;

// Unconfigured is the honest initial status in THIS environment (no env vars);
// `initAuth` promotes it to 'loading' only when Supabase is actually configured.
const initialStatus: AuthStatus = supabaseConfigured() ? 'loading' : 'unconfigured';

export const useAuthStore = create<AuthStore>((set) => ({
  status: initialStatus,
  user: null,
  syncPhase: 'idle',
  lastSyncedAt: null,
  syncError: null,

  setSession: (status, user) => set({ status, user }),
  setSyncPhase: (syncPhase) => set({ syncPhase }),
  setSynced: (lastSyncedAt) =>
    set({ syncPhase: 'synced', lastSyncedAt, syncError: null }),
  setSyncError: (syncError) =>
    set({ syncPhase: syncError ? 'error' : 'idle', syncError }),
  resetSync: () => set({ syncPhase: 'idle', lastSyncedAt: null, syncError: null }),
}));

/**
 * Map a Supabase user into the trimmed `AuthUser` the UI holds. The provider is
 * read from `app_metadata.provider` (the identity the session was minted with).
 */
function toAuthUser(user: {
  id: string;
  email?: string | null;
  app_metadata?: { provider?: string };
}): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    provider: user.app_metadata?.provider ?? null,
  };
}

// initAuth must run exactly once per tab even though <AuthListener/> mounts it
// on every navigation to a page that renders the layout; this guard makes it
// idempotent.
let initialized = false;

/**
 * Resolve the initial session and subscribe to auth changes. Idempotent, and a
 * calm no-op when Supabase is unconfigured (the app's default state here). On
 * SIGNED_IN it kicks off the initial two-way sync and starts continuous push
 * subscriptions; on SIGNED_OUT it stops pushing and resets the sync status.
 *
 * The sync engine is imported LAZILY inside the callbacks so this module (and
 * anything that reads auth status) never pulls the eight store hooks or
 * supabase-js writes into an SSR/first-paint path.
 */
export function initAuth(): void {
  if (initialized) return;
  initialized = true;

  if (!supabaseConfigured()) {
    useAuthStore.getState().setSession('unconfigured', null);
    return;
  }

  const client = browserClient();
  if (!client) {
    // No window (SSR) — leave it 'loading'; the client mount will run this again.
    initialized = false;
    return;
  }

  const store = useAuthStore.getState();

  // Resolve whatever session supabase-js rehydrated from localStorage.
  void client.auth
    .getSession()
    .then(({ data }) => {
      const user = data.session?.user;
      if (user) {
        store.setSession('signed-in', toAuthUser(user));
        void startInitialSyncAndPush();
      } else {
        store.setSession('signed-out', null);
      }
    })
    .catch(() => store.setSession('signed-out', null));

  // React to future sign-in / sign-out (OTP verify, OAuth redirect, sign out).
  client.auth.onAuthStateChange((event, session) => {
    const s = useAuthStore.getState();
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      const user = session?.user;
      if (user) {
        s.setSession('signed-in', toAuthUser(user));
        // Only the first real sign-in should drive a full sync; a token refresh
        // must not re-run it. `startInitialSyncAndPush` is itself idempotent.
        if (event === 'SIGNED_IN') void startInitialSyncAndPush();
      }
      return;
    }
    if (event === 'SIGNED_OUT') {
      void stopPushOnSignOut();
      s.setSession('signed-out', null);
      s.resetSync();
    }
  });
}

/** Lazy bridge to the browser-only sync engine (keeps it out of SSR imports). */
async function startInitialSyncAndPush(): Promise<void> {
  const engine = await import('@/lib/sync/engine');
  await engine.runInitialSync();
  engine.startPushSubscriptions();
}

/** Lazy bridge: tear down push subscriptions on sign-out. */
async function stopPushOnSignOut(): Promise<void> {
  const engine = await import('@/lib/sync/engine');
  engine.stopPushSubscriptions();
}
