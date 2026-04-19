import { describe, it, expect } from 'vitest';
import type { PBI } from '../types';
import { resolveIteration } from '../execution';
import { makeScenario, makeState } from './fixtures';

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

describe('resolveIteration', () => {
  it('points consumed never exceed capacity', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      pbi({ id: `p${i}`, effort: 4, effortRevealed: 4 }),
    );
    const state = makeState({ iterationBacklog: items, phase: 'committed' });
    const scenario = makeScenario({ initialBacklog: items });
    const { outcome } = resolveIteration(state, scenario, new Set());
    const consumed = outcome.done.reduce((s, p) => s + (p.effortRevealed ?? p.effort), 0);
    expect(consumed).toBeLessThanOrEqual(outcome.capacityRolled);
  });

  it('not-done items return to product backlog', () => {
    const items = [
      pbi({ id: 'a', effort: 10 }),
      pbi({ id: 'b', effort: 10 }),
      pbi({ id: 'c', effort: 10 }),
    ];
    const state = makeState({ iterationBacklog: items, phase: 'committed' });
    const scenario = makeScenario({ initialBacklog: items });
    const { next, outcome } = resolveIteration(state, scenario, new Set());
    expect(next.productBacklog.length).toBe(outcome.notDone.length);
    expect(next.iterationBacklog.length).toBe(0);
  });

  it('deterministic: same seed → same outcome', () => {
    const items = Array.from({ length: 6 }, (_, i) =>
      pbi({ id: `p${i}`, effort: 3, effortRevealed: null, effortUncertain: true }),
    );
    const state = makeState({
      iterationBacklog: items,
      phase: 'committed',
      seed: 'fixed',
    });
    const scenario = makeScenario({ initialBacklog: items });
    const a = resolveIteration(state, scenario, new Set());
    const b = resolveIteration(state, scenario, new Set());
    expect(a.outcome.capacityRolled).toBe(b.outcome.capacityRolled);
    expect(a.outcome.done.map((d) => d.id)).toEqual(b.outcome.done.map((d) => d.id));
  });

  it('transitions phase to review', () => {
    const state = makeState({ iterationBacklog: [], phase: 'committed' });
    const scenario = makeScenario();
    const { next } = resolveIteration(state, scenario, new Set());
    expect(next.phase).toBe('review');
  });

  it('releases products only when release-card present and all product PBIs shipped', () => {
    const productPBIs = [
      pbi({ id: 'a', productId: 'canary', effort: 3, satisfies: ['c1'] }),
      pbi({ id: 'b', productId: 'canary', effort: 3, satisfies: ['c1'] }),
    ];
    const release = pbi({ id: 'release-card', kind: 'release-card', effort: 3 });
    const state = makeState({
      iterationBacklog: [...productPBIs, release],
      phase: 'committed',
      customers: {
        c1: {
          id: 'c1',
          name: 'Alice',
          archetype: 'mainstream',
          engagementState: 'interested',
          happiness: 5,
          ltv: 200,
          lastFullRelease: null,
          consecutivePartial: 0,
          consecutiveNothing: 0,
        },
      },
    });
    const scenario = makeScenario({ initialBacklog: [...productPBIs, release] });
    const { outcome, next } = resolveIteration(state, scenario, new Set());
    expect(outcome.releasedProducts).toContain('canary');
    expect(outcome.revenueEarned).toBe(200);
    expect(next.customers.c1.happiness).toBeGreaterThan(5);
  });
});
