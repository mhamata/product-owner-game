/**
 * PURE act-sequencing logic for the /standup daily loop: three acts (Warm-up
 * → Workload → Standup). Kept separate from `scheduler.ts` (which decides
 * WHAT Act 2 is) because this module only decides which act is the
 * recommended "now" one — two different questions, two small pure modules,
 * each trivially testable.
 *
 * SELF-STUDY RULING (2026-07-16, Mike): no act is ever locked. All three
 * acts are always fully actionable — Workload and Standup no longer require
 * finishing an earlier act first. `'now'` is a visual SUGGESTION only (the
 * first incomplete act in order); every other incomplete act is `'open'`.
 */

/** One act's display/interaction state. */
export type ActStatus = 'done' | 'now' | 'open';

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
 *  - A complete act is always 'done', regardless of order.
 *  - The FIRST incomplete act in order (Warm-up, then Workload, then
 *    Standup) is 'now' — the rail's highlighted suggestion for what to do
 *    next. Every other incomplete act is 'open': fully actionable today,
 *    just not the suggestion.
 *  - Nothing is ever 'locked'. Exactly one act is 'now' at a time, or none
 *    once all three are 'done'.
 */
export function deriveActsState(input: StandupActsInput): StandupActsState {
  const order: [keyof StandupActsState, boolean][] = [
    ['warmup', input.warmupComplete],
    ['workload', input.workloadComplete],
    ['standup', input.standupComplete],
  ];
  const nowIndex = order.findIndex(([, complete]) => !complete);

  const statusFor = (index: number, complete: boolean): ActStatus => {
    if (complete) return 'done';
    return index === nowIndex ? 'now' : 'open';
  };

  return {
    warmup: statusFor(0, input.warmupComplete),
    workload: statusFor(1, input.workloadComplete),
    standup: statusFor(2, input.standupComplete),
  };
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
