import { describe, it, expect } from 'vitest';
import { deriveActsState, rolledDayProgress } from '../standupActs';

/**
 * Pure act-gating logic for the /standup daily loop. These pin the sequential
 * unlock rule (warm-up -> workload -> standup) and the day-rollover behavior
 * that resets Act 3's "opened today" flag, independent of any store or React.
 */

describe('deriveActsState', () => {
  it('starts with only Warm-up interactive; Workload and Standup are locked', () => {
    const state = deriveActsState({
      warmupComplete: false,
      workloadComplete: false,
      standupComplete: false,
    });
    expect(state).toEqual({ warmup: 'now', workload: 'locked', standup: 'locked' });
  });

  it('unlocks Workload the moment Warm-up completes (empty deck or answered queue)', () => {
    const state = deriveActsState({
      warmupComplete: true,
      workloadComplete: false,
      standupComplete: false,
    });
    expect(state).toEqual({ warmup: 'done', workload: 'now', standup: 'locked' });
  });

  it('unlocks Standup only once Workload completes', () => {
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

  it('never lets a later act read as unlocked while an earlier one is incomplete, even with out-of-order inputs', () => {
    // workloadComplete/standupComplete true but warmup still pending is not a
    // state the real UI produces, but the derivation must still gate safely.
    const state = deriveActsState({
      warmupComplete: false,
      workloadComplete: true,
      standupComplete: true,
    });
    expect(state.warmup).toBe('now');
    expect(state.workload).toBe('locked');
    expect(state.standup).toBe('locked');
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
