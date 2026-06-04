import { describe, it, expect, beforeEach } from 'vitest';
import { getScenario } from '..';
import { applyDifficulty } from '../difficulty';
import { useSimDifficultyStore, MAX_DIFFICULTY_TIER } from '@/store/simDifficultyStore';

describe('applyDifficulty', () => {
  const base = getScenario('turnaround');

  it('returns the scenario unchanged at tier 0', () => {
    expect(base).toBeTruthy();
    if (base) expect(applyDifficulty(base, 0)).toBe(base);
  });

  it('tightens capacity and widens variance without moving the target', () => {
    if (!base) return;
    const hard = applyDifficulty(base, 2);
    expect(hard.tech.capacityBaseline).toBe(Math.max(8, base.tech.capacityBaseline - 2));
    expect(hard.tech.capacityVariance).toBe(base.tech.capacityVariance + 2);
    expect(hard.targetRevenue).toBe(base.targetRevenue); // the target never moves
  });

  it('caps the squeeze at MAX_DIFFICULTY_TIER', () => {
    if (!base) return;
    const beyond = applyDifficulty(base, 99);
    const capped = applyDifficulty(base, MAX_DIFFICULTY_TIER);
    expect(beyond.tech.capacityBaseline).toBe(capped.tech.capacityBaseline);
  });
});

describe('simDifficultyStore', () => {
  beforeEach(() => useSimDifficultyStore.getState().reset());

  it('unlocks the next tier on an ace, idempotently', () => {
    const s = useSimDifficultyStore.getState();
    s.recordResult('x', 0, true);
    expect(useSimDifficultyStore.getState().tierFor('x')).toBe(1);
    s.recordResult('x', 0, true); // recording the same run again
    expect(useSimDifficultyStore.getState().tierFor('x')).toBe(1); // does not over-ratchet
    s.recordResult('x', 1, true);
    expect(useSimDifficultyStore.getState().tierFor('x')).toBe(2);
  });

  it('does not bump on a non-ace and caps at the max', () => {
    const s = useSimDifficultyStore.getState();
    s.recordResult('y', 0, false);
    expect(useSimDifficultyStore.getState().tierFor('y')).toBe(0);
    s.recordResult('y', 99, true);
    expect(useSimDifficultyStore.getState().tierFor('y')).toBe(MAX_DIFFICULTY_TIER);
  });
});
