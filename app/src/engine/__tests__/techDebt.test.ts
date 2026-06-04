import { describe, it, expect } from 'vitest';
import type { PBI } from '../types';
import { updateTechDebt } from '../techDebt';
import { makeState } from './fixtures';

function pbi(overrides: Partial<PBI>): PBI {
  return {
    id: 'x',
    title: 'x',
    kind: 'customer',
    effort: 3,
    effortRevealed: 3,
    value: 100,
    satisfies: [],
    requires: [],
    ...overrides,
  };
}

describe('updateTechDebt', () => {
  it('crossing 30 bumps releaseCost to at least 4', () => {
    const state = makeState({
      tech: { ...makeState().tech, techDebt: 26, releaseCost: 3 },
    });
    const { tech } = updateTechDebt(state, [pbi({})]); // +5 debt (no DoD)
    expect(tech.techDebt).toBeGreaterThanOrEqual(30);
    expect(tech.releaseCost).toBeGreaterThanOrEqual(4);
  });

  it('threshold is idempotent: re-crossing already-crossed threshold does not re-apply', () => {
    // Already at 50+: releaseCost already elevated; next iter no new threshold crossed
    const state = makeState({
      tech: { ...makeState().tech, techDebt: 55, releaseCost: 5 },
    });
    const { tech } = updateTechDebt(state, [pbi({})]);
    expect(tech.releaseCost).toBe(5);
  });

  it('refactor-core pays down 30 points', () => {
    const state = makeState({ tech: { ...makeState().tech, techDebt: 40 } });
    const { tech } = updateTechDebt(state, [
      pbi({ id: 'refactor-core', kind: 'tech' }),
    ]);
    expect(tech.techDebt).toBeLessThanOrEqual(10);
  });

  it('records investments in investmentsDone', () => {
    const state = makeState();
    const { tech } = updateTechDebt(state, [
      pbi({ id: 'automated-tests', kind: 'tech' }),
    ]);
    expect(tech.investmentsDone).toContain('automated-tests');
  });
});
