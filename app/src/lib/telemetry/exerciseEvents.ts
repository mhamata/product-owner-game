'use client';

import { browserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

/**
 * SHARED LEARNER MODEL v0 — the `exercise_events` emitter.
 *
 * Every modality that already grades a completion (deterministic drills, the
 * judgment review deck, AI-graded artifacts, mock interviews; sim surfaces
 * adopt this later, see the `sim_decision` note below) calls
 * `emitExerciseEvent()` once at its natural completion point. Rows land in
 * Supabase's `exercise_events` table (append-only, RLS "append own events" —
 * see `supabase/migrations/20260707000000_phase0_substrate.sql`), which is the
 * substrate a future server-side rollup (`competency_state`) reconciles into
 * one learner model, replacing today's per-modality silo stores
 * (`learnStore`/`reviewStore`/`simEvidenceStore`) that never talk to each
 * other. Per the migration's own comment: nothing written here is trusted for
 * money or rating without server verification — this is low-stakes practice
 * history, not a source of truth.
 *
 * PRIVACY RULE (load-bearing, read before adding a call site): `payload` must
 * stay SMALL — ids, scores, counts, booleans. NEVER the graded text: no
 * artifact submissions, no interview transcripts, no free-text drill answers,
 * no rubric prose. The 0-1 `score` and a few small identifiers are enough for
 * a rollup to reason about a learner's trajectory without this table becoming
 * a second copy of everything they wrote.
 *
 * DEGRADE: mirrors `@/lib/supabase/client`'s "calm degrade" contract exactly —
 * SSR, an unconfigured Supabase project, or a signed-out learner all produce a
 * SILENT no-op (checked via `useAuthStore`, the same signed-in signal
 * `@/lib/sync/engine.ts`'s `schedulePush` already uses, so telemetry and sync
 * agree on what "signed in" means). `emitExerciseEvent` never throws and never
 * returns a promise the caller has to handle — it is fire-and-forget by
 * construction, so a call site is always exactly one line and can never block
 * or fail the UI it instruments.
 *
 * BATCHING: a small in-memory queue plus a trailing-edge debounce (2s),
 * modeled directly on `@/lib/sync/engine.ts`'s `schedulePush`/`flushPush` pair
 * (same `PUSH_DEBOUNCE_MS` value) — a burst of events (e.g. every item in one
 * drill block) collapses into a single `insert` call carrying every row,
 * rather than one round-trip per event.
 *
 * `sim_decision` (TODO, not this slice): the engine/sim surfaces
 * (`src/engine/`, `src/components/console/sim/`) are owned by a different
 * builder in this worktree and are off-limits here. Wiring `kind:
 * 'sim_decision'` at commit time in `InboxTurn.tsx`/`decisionLogStore` is
 * flagged as follow-up work in the W5-K ledger row — this emitter is ready for
 * that call site the moment it lands.
 */

/** The `exercise_events.kind` check-constraint values (see the migration). */
export type ExerciseEventKind =
  | 'drill'
  | 'judgment_card'
  | 'artifact'
  | 'roleplay'
  | 'sim_decision'
  | 'placement'
  | 'interview';

export interface ExerciseEventInput {
  kind: ExerciseEventKind;
  /** The curriculum competency (or a modality-local competency vocabulary, e.g. the judgment deck's) this event exercised. */
  competency?: string;
  /** The `Skill.id` this event belongs to, when the modality is skill-scoped (judgment/interview are not). */
  skillId?: string;
  /** 0-1, already normalized by the caller. Omit/null when not applicable. */
  score?: number | null;
  /** Small only — ids/scores/counts/booleans. Never raw text. See the privacy rule above. */
  payload?: Record<string, unknown>;
}

/** The literal row shape sent to `exercise_events` (before `user_id` is attached at flush time). */
interface QueuedEventRow {
  kind: ExerciseEventKind;
  competency: string | null;
  skill_id: string | null;
  score: number | null;
  payload: Record<string, unknown>;
}

/** Mirrors `@/lib/sync/engine.ts`'s `PUSH_DEBOUNCE_MS`. */
const FLUSH_DEBOUNCE_MS = 2000;

let pending: QueuedEventRow[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Queue one exercise event for the next debounced batch insert. Fire-and-forget:
 * returns nothing, never throws, never awaited by the caller.
 */
export function emitExerciseEvent(input: ExerciseEventInput): void {
  try {
    if (typeof window === 'undefined') return; // SSR: silent no-op

    const auth = useAuthStore.getState();
    if (auth.status !== 'signed-in' || !auth.user) return; // signed out/unconfigured/loading: silent no-op

    pending.push({
      kind: input.kind,
      competency: input.competency ?? null,
      skill_id: input.skillId ?? null,
      score: input.score ?? null,
      payload: input.payload ?? {},
    });

    // Trailing-edge debounce: each new event in a burst pushes the flush out
    // another FLUSH_DEBOUNCE_MS, same as schedulePush's reset-on-every-call.
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => void flushExerciseEvents(), FLUSH_DEBOUNCE_MS);
  } catch {
    // Telemetry must never break the surface that called it.
  }
}

/**
 * Best-effort batched insert of everything queued since the last flush. The
 * WHOLE body is one try/catch (not just the `insert` call): this runs
 * detached inside a `setTimeout` callback, so a synchronous throw from
 * `browserClient()`/`useAuthStore.getState()` would otherwise become an
 * unhandled promise rejection with no caller left to catch it.
 */
async function flushExerciseEvents(): Promise<void> {
  flushTimer = null;
  if (pending.length === 0) return;

  try {
    const client = browserClient();
    const auth = useAuthStore.getState();
    const userId = auth.user?.id;
    if (!client || auth.status !== 'signed-in' || !userId) {
      // Signed out mid-flight (or never configured): nothing to push to, and
      // this is low-stakes practice telemetry, so drop rather than retry.
      pending = [];
      return;
    }

    const batch = pending;
    pending = [];

    await client.from('exercise_events').insert(
      batch.map((row) => ({ ...row, user_id: userId })),
    );
  } catch {
    // A dropped batch is not worth surfacing — never blocks or errors the UI.
    pending = [];
  }
}
