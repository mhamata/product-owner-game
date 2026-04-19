import { describe, it, expect } from 'vitest';
import { calculateCapacityRange } from '../capacity';
import { makeState } from './fixtures';

describe('calculateCapacityRange', () => {
  it('returns baseline/variance with no modifiers', () => {
    const r = calculateCapacityRange(makeState());
    expect(r.expected).toBe(15);
    expect(r.lower).toBe(12);
    expect(r.upper).toBe(18);
  });

  it('low morale reduces baseline', () => {
    const r = calculateCapacityRange(makeState({ team: { ...makeState().team, morale: 3 } }));
    expect(r.expected).toBe(13);
  });

  it('very low morale reduces baseline more', () => {
    const r = calculateCapacityRange(makeState({ team: { ...makeState().team, morale: 1 } }));
    expect(r.expected).toBe(10);
  });

  it('tech debt adds variance and reduces baseline', () => {
    const r = calculateCapacityRange(
      makeState({ tech: { ...makeState().tech, techDebt: 70 } }),
    );
    expect(r.expected).toBeLessThan(15);
  });

  it('automated-tests reduces variance', () => {
    const r = calculateCapacityRange(
      makeState({ tech: { ...makeState().tech, investmentsDone: ['automated-tests'] } }),
    );
    expect(r.upper - r.lower).toBeLessThan(6);
  });

  it('burnout adds both baseline drop and variance', () => {
    const r = calculateCapacityRange(
      makeState({ team: { ...makeState().team, burnoutFlag: true } }),
    );
    expect(r.expected).toBe(12);
    expect(r.upper - r.lower).toBeGreaterThan(6);
  });

  it('baseline floored at 5', () => {
    const r = calculateCapacityRange(
      makeState({
        team: {
          morale: 0,
          headcount: 5,
          onboarding: 5,
          sickOrVacation: 5,
          burnoutFlag: true,
        },
        tech: { ...makeState().tech, techDebt: 100 },
      }),
    );
    expect(r.expected).toBeGreaterThanOrEqual(5);
  });
});
