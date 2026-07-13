/**
 * PURE act-gating logic for the /standup daily loop: three acts (Warm-up →
 * Workload → Standup) that unlock strictly in sequence, per the design-doc
 * mockup. Kept separate from `scheduler.ts` (which decides WHAT Act 2 is)
 * because this module only decides WHICH acts are interactive right now —
 * two different questions, two small pure modules, each trivially testable.
 */

/** One act's display/interaction state. */
export type ActStatus = 'done' | 'now' | 'locked';

export interface StandupActsState {
  warmup: ActStatus;
  workload: ActStatus;
  standup: ActStatus;
}

export interface StandupActsInput {
  /**
   * True once Act 1 has nothing left to do today — either the due queue was
   * empty from the start (the mockup's "deck's clear" line), or the learner
   * answered every card in today's snapshot.
   */
  warmupComplete: boolean;
  /**
   * True once Act 2's chosen skill is mastered, or there was no live
   * competency left to assign (the "you've mastered everything live" state).
   */
  workloadComplete: boolean;
  /** True once the learner has opened today's Standup (Act 3). */
  standupComplete: boolean;
}

/**
 * Derive the three acts' statuses. Rules:
 *  - Warm-up is 'now' until complete, then 'done'. It is never locked — it is
 *    always the day's entry point.
 *  - Workload is 'locked' until warm-up is done, then 'now' until it is
 *    itself complete, then 'done'.
 *  - Standup is 'locked' until warm-up AND workload are both done, then 'now'
 *    until complete, then 'done'.
 *
 * Gating chains strictly: an act's OWN completion flag can only promote it to
 * 'now'/'done' once every act before it is done, regardless of what that
 * act's own flag says. Without this, a later act's independently-derived
 * completion signal (e.g. Workload completes via `learnStore.isMastered`,
 * which has no idea whether today's Warm-up ran) could read as 'done' while
 * an earlier act is still pending — defeating the whole point of "acts
 * unlock in order". Exactly one act is 'now' at a time (or none, once all
 * three are 'done').
 */
export function deriveActsState(input: StandupActsInput): StandupActsState {
  const warmup: ActStatus = input.warmupComplete ? 'done' : 'now';

  const workload: ActStatus = !input.warmupComplete
    ? 'locked'
    : input.workloadComplete
      ? 'done'
      : 'now';

  const standup: ActStatus =
    !input.warmupComplete || !input.workloadComplete
      ? 'locked'
      : input.standupComplete
        ? 'done'
        : 'now';

  return { warmup, workload, standup };
}

/** Today's persisted act-progress record (see `store/standupStore.ts`). */
export interface StandupDayProgress {
  /** Local yyyy-mm-dd day this record belongs to. */
  day: string;
  /** True once the learner has opened today's Standup (Act 3). */
  standupComplete: boolean;
}

/**
 * Roll a stored progress record over to a fresh day. If `stored.day` matches
 * `day`, the record is returned unchanged (same reference, so callers can
 * cheaply skip a write when nothing changed). Otherwise a brand-new, all-clear
 * record for `day` is returned — yesterday's "standup complete" flag must
 * never carry into today, or the gate would silently stay open forever.
 */
export function rolledDayProgress(
  stored: StandupDayProgress,
  day: string,
): StandupDayProgress {
  if (stored.day === day) return stored;
  return { day, standupComplete: false };
}
