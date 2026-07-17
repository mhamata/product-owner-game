import { describe, it, expect } from 'vitest';
import { deriveActsState, rolledDayProgress } from '../standupActs';

/**
 * Pure act-sequencing logic for the /standup daily loop. SELF-STUDY RULING
 * (2026-07-16, Mike): no act is ever locked. These pin the done/now/open
 * semantics — 'now' is a visual suggestion (the first incomplete act in
 * order), everything else incomplete is 'open' and fully actionable — plus
 * the day-rollover behavior that resets Act 3's "opened today" flag,
 * independent of any store or React.
 */

describe('deriveActsState', () => {
  it('starts with only Warm-up as "now"; Workload and Standup are "open" (never locked)', () => {
    const state = deriveActsState({
      warmupComplete: false,
      workloadComplete: false,
      standupComplete: false,
    });
    expect(state).toEqual({ warmup: 'now', workload: 'open', standup: 'open' });
  });

  it('moves the "now" suggestion to Workload once Warm-up completes (empty deck or answered queue)', () => {
    const state = deriveActsState({
      warmupComplete: true,
      workloadComplete: false,
      standupComplete: false,
    });
    expect(state).toEqual({ warmup: 'done', workload: 'now', standup: 'open' });
  });

  it('moves the "now" suggestion to Standup once Warm-up and Workload both complete', () => {
    const state = deriveActsState({
      warmupComplete: true,
      workloadComplete: true,
      standupComplete: false,
    });
    expect(state).toEqual({ warmup: 'done', workload: 'done', standup: 'now' });
  });

  it('marks all three done once the whole loop is complete', () => {
    const state = deriveActsState({
      warmupComplete: true,
      workloadComplete: true,
      standupComplete: true,
    });
    expect(state).toEqual({ warmup: 'done', workload: 'done', standup: 'done' });
  });

  it('never locks a later act, even out of order — a real completion signal always reads "done"', () => {
    // Completing Workload/Standup without Warm-up first is not a sequence the
    // real UI nudges toward (Warm-up stays 'now'), but nothing in this module
    // BLOCKS it — every act is always actionable, so an out-of-order
    // completion is honored, not hidden.
    const state = deriveActsState({
      warmupComplete: false,
      workloadComplete: true,
      standupComplete: true,
    });
    expect(state).toEqual({ warmup: 'now', workload: 'done', standup: 'done' });
  });
});

describe('rolledDayProgress', () => {
  it('returns the same record unchanged when the day matches', () => {
    const stored = { day: '2026-07-12', standupComplete: true };
    expect(rolledDayProgress(stored, '2026-07-12')).toBe(stored);
  });

  it('no-data fallback: resets to a fresh, all-clear record on a new day', () => {
    const stored = { day: '2026-07-11', standupComplete: true };
    const rolled = rolledDayProgress(stored, '2026-07-12');
    expect(rolled).toEqual({ day: '2026-07-12', standupComplete: false });
  });
});
