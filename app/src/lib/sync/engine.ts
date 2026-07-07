'use client';

import { browserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { isSyncedKey } from './keys';
import { encodeEnvelope, decodeEnvelope, type SyncEnvelope } from './envelope';
import { planSync } from './planner';
import { registerSyncKeyHandler } from './notify';

// The eight persisted Zustand stores, imported in ONE place. After we write
// server values back into localStorage, we call `.persist.rehydrate()` on the
// affected store so the live UI re-reads the new value instead of the stale
// in-memory copy. Mapping key -> store lives here so nothing else needs to know
// the whole set.
import { useLearnStore } from '@/store/learnStore';
import { useReviewStore } from '@/store/reviewStore';
import { useGameStore } from '@/store/gameStore';
import { useCalibrationStore } from '@/store/calibrationStore';
import { useCoachStore } from '@/store/coachStore';
import { useIndustryStore } from '@/store/industryStore';
import { useSimEvidenceStore } from '@/store/simEvidenceStore';
import { useSimDifficultyStore } from '@/store/simDifficultyStore';

/**
 * The browser-only sync executor: applies the pure planner's decisions against
 * localStorage + Supabase, and keeps the server copy warm with a debounced push
 * on every allowlisted store change.
 *
 * The Supabase table is `learner_state` (columns: user_id, store_key, data). RLS
 * scopes every SELECT/UPSERT to the signed-in user, so we never pass a user_id —
 * the token does. Row shape in `data` is the {v,value} envelope; a `value:null`
 * envelope is a tombstone (there is no DELETE policy, so a clear is an UPDATE).
 */

const TABLE = 'learner_state';

/**
 * The single key -> store mapping, used both to rehydrate after a pull and to
 * subscribe for continuous push — one map so the two uses can never disagree
 * about which persist key belongs to which store.
 */
const STORE_BY_KEY: Record<
  string,
  { persist: { rehydrate: () => void }; subscribe: (listener: () => void) => () => void }
> = {
  'praxis-learn-v2': useLearnStore,
  'praxis-review-v1': useReviewStore,
  'praxis-game-v1': useGameStore,
  'praxis-calibration-v1': useCalibrationStore,
  'praxis-coach-v1': useCoachStore,
  'praxis-industry-v1': useIndustryStore,
  'praxis-sim-evidence-v1': useSimEvidenceStore,
  'praxis-sim-difficulty-v1': useSimDifficultyStore,
};

/* ------------------------------------------------------------------
   localStorage helpers. All guarded — a private-mode / blocked-storage browser
   degrades to "nothing to read / write" rather than throwing mid-sync.
   ------------------------------------------------------------------ */

/** Read every allowlisted localStorage entry: key -> raw string. */
function readLocalAllowlisted(): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof window === 'undefined') return out;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !isSyncedKey(key)) continue;
      const raw = window.localStorage.getItem(key);
      if (raw !== null) out.set(key, raw);
    }
  } catch {
    // Storage blocked: treat as empty.
  }
  return out;
}

function readLocal(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage full/blocked: the pulled value stays server-side only.
  }
}

function removeLocal(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** A single upsert row for the batched writes. */
interface StateRow {
  user_id: string;
  store_key: string;
  data: SyncEnvelope;
}

/**
 * Build the upsert rows for a set of keys, reading each key's CURRENT
 * localStorage value at build time. A missing key becomes a tombstone envelope
 * (the clear propagates to the server as an UPDATE).
 */
function buildRows(userId: string, keys: Iterable<string>): StateRow[] {
  const rows: StateRow[] = [];
  for (const key of keys) {
    rows.push({ user_id: userId, store_key: key, data: encodeEnvelope(readLocal(key)) });
  }
  return rows;
}

/** Rehydrate the Zustand store that owns a key, so the UI re-reads the pull. */
function rehydrateStoreFor(key: string): void {
  const store = STORE_BY_KEY[key];
  if (!store) return; // raw families (artifact/interview) have no store to poke.
  try {
    store.persist.rehydrate();
  } catch {
    // A rehydrate failure is non-fatal: the value is already in localStorage and
    // the next mount will read it.
  }
}

/* ------------------------------------------------------------------
   Initial sync: pull the server truth, push local-only keys, reconcile.
   ------------------------------------------------------------------ */

/**
 * Run the two-way sync once, on sign-in. Selects the user's rows, plans against
 * localStorage, applies pulls (write + rehydrate) and one batched upsert of
 * pushes, and records the outcome on the auth store's sync status line. Safe to
 * call more than once — it simply re-reconciles.
 */
export async function runInitialSync(): Promise<void> {
  const client = browserClient();
  const auth = useAuthStore.getState();
  if (!client) return;

  const userId = auth.user?.id;
  if (!userId) return;

  auth.setSyncPhase('syncing');

  try {
    const { data, error } = await client.from(TABLE).select('store_key, data');
    if (error) throw error;

    // Build the server map from the user's rows (RLS already scoped them to us).
    const server = new Map<string, SyncEnvelope>();
    for (const row of (data ?? []) as { store_key: string; data: unknown }[]) {
      server.set(row.store_key, row.data as SyncEnvelope);
    }

    const local = readLocalAllowlisted();
    const plan = planSync(local, server);

    const pushKeys: string[] = [];
    for (const action of plan.actions) {
      if (action.op === 'pull') {
        const str = decodeEnvelope(server.get(action.key));
        if (str !== null) {
          writeLocal(action.key, str);
          rehydrateStoreFor(action.key);
        }
      } else if (action.op === 'remove-local') {
        removeLocal(action.key);
        rehydrateStoreFor(action.key);
      } else {
        pushKeys.push(action.key);
      }
    }

    if (pushKeys.length > 0) {
      const { error: upsertError } = await client
        .from(TABLE)
        .upsert(buildRows(userId, pushKeys), { onConflict: 'user_id,store_key' });
      if (upsertError) throw upsertError;
    }

    useAuthStore.getState().setSynced(Date.now());
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    useAuthStore.getState().setSyncError(message);
  }
}

/* ------------------------------------------------------------------
   Continuous push: debounced, batched upsert of changed keys while signed in.
   ------------------------------------------------------------------ */

const PUSH_DEBOUNCE_MS = 2000;

// Keys changed since the last flush, and the pending trailing-edge timer.
const pendingKeys = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Queue a key for the next debounced push. No-op when signed out / unconfigured
 * (nowhere to push). The value is read at FLUSH time, so rapid edits collapse to
 * the latest value in one upsert.
 */
export function schedulePush(key: string): void {
  if (!isSyncedKey(key)) return;
  const auth = useAuthStore.getState();
  if (auth.status !== 'signed-in' || !auth.user) return;

  pendingKeys.add(key);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushPush(), PUSH_DEBOUNCE_MS);
}

/** Flush all pending keys in one batched upsert. Best-effort; never throws. */
async function flushPush(): Promise<void> {
  flushTimer = null;
  if (pendingKeys.size === 0) return;

  const client = browserClient();
  const auth = useAuthStore.getState();
  const userId = auth.user?.id;
  if (!client || auth.status !== 'signed-in' || !userId) {
    pendingKeys.clear();
    return;
  }

  const keys = [...pendingKeys];
  pendingKeys.clear();

  try {
    await client
      .from(TABLE)
      .upsert(buildRows(userId, keys), { onConflict: 'user_id,store_key' });
  } catch {
    // A dropped push is recoverable: the next change re-queues, and the next
    // sign-in reconciles from the server. We do not surface it as a hard error.
  }
}

/* ------------------------------------------------------------------
   Push subscriptions: wire the eight stores + raw write-site notifier to
   schedulePush, and flush best-effort on unload.
   ------------------------------------------------------------------ */

let unsubscribers: Array<() => void> = [];
let beforeUnloadBound = false;

const flushOnUnload = () => {
  // Best-effort synchronous-ish flush: fire the upsert and let it race the
  // unload. Wrapped so a throw here never blocks navigation.
  try {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    void flushPush();
  } catch {
    // ignore
  }
};

/**
 * Subscribe to every allowlisted source so a change schedules a push:
 *  - the eight Zustand stores (state changes), mapped to their persist key;
 *  - the raw write-site notifier (artifact/interview localStorage families).
 * Idempotent: re-calling tears down the previous subscriptions first.
 */
export function startPushSubscriptions(): void {
  if (typeof window === 'undefined') return;
  stopPushSubscriptions();

  for (const [key, store] of Object.entries(STORE_BY_KEY)) {
    // Any state change on a persisted store means its localStorage value will
    // change; debounce collapses the burst and reads the final value at flush.
    unsubscribers.push(store.subscribe(() => schedulePush(key)));
  }

  // Raw families (artifact-v2 / interview) notify through the dependency-free
  // seam; the notifier now routes their key changes into the same debounce.
  registerSyncKeyHandler((key) => schedulePush(key));

  if (!beforeUnloadBound) {
    window.addEventListener('beforeunload', flushOnUnload);
    beforeUnloadBound = true;
  }
}

/** Tear down all push subscriptions (called on sign-out). */
export function stopPushSubscriptions(): void {
  for (const unsub of unsubscribers) {
    try {
      unsub();
    } catch {
      // ignore
    }
  }
  unsubscribers = [];
  registerSyncKeyHandler(null);
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  pendingKeys.clear();
}
