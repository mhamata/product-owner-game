import { describe, it, expect } from 'vitest';
import { createGame, step } from '../step';
import { makeScenario } from './fixtures';
import type { PBI, Scenario } from '../types';

function pbi(id: string, overrides: Partial<PBI> = {}): PBI {
  return {
    id,
    title: id,
    kind: 'customer',
    effort: 3,
    effortRevealed: 3,
    value: 100,
    satisfies: [],
    requires: [],
    ...overrides,
  };
}

function scenarioWithPool(pool: PBI[]): Scenario {
  return makeScenario({ initialBacklog: [pbi('a')], discoveryPool: pool });
}

describe('discovery', () => {
  it('reveals one PBI when advancing to a new iteration', () => {
    const scenario = scenarioWithPool([pbi('d1'), pbi('d2'), pbi('d3')]);
    let g = createGame(scenario, 'seed-1');
    const startCount = g.productBacklog.length;

    g = step(g, { type: 'commit-iteration' }, scenario);
    g = step(g, { type: 'execute-iteration' }, scenario);
    g = step(g, { type: 'advance-iteration' }, scenario);

    expect(g.productBacklog.length).toBe(startCount + 1);
    expect(g.newlyDiscoveredIds.length).toBe(1);
    const discovered = g.productBacklog.find((p) =>
      g.newlyDiscoveredIds.includes(p.id),
    );
    expect(discovered?.source).toBe('discovery');
    expect(discovered?.discoveredInIteration).toBe(2);
  });

  it('does nothing when pool is empty', () => {
    const scenario = scenarioWithPool([]);
    let g = createGame(scenario, 'seed');
    g = step(g, { type: 'commit-iteration' }, scenario);
    g = step(g, { type: 'execute-iteration' }, scenario);
    g = step(g, { type: 'advance-iteration' }, scenario);
    expect(g.newlyDiscoveredIds).toEqual([]);
  });

  it('does not rediscover the same item', () => {
    const scenario = scenarioWithPool([pbi('d1'), pbi('d2')]);
    let g = createGame(scenario, 'seed');
    for (let i = 0; i < 2; i++) {
      g = step(g, { type: 'commit-iteration' }, scenario);
      g = step(g, { type: 'execute-iteration' }, scenario);
      g = step(g, { type: 'advance-iteration' }, scenario);
    }
    const ids = g.productBacklog.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('deterministic for same seed', () => {
    const scenario = scenarioWithPool([pbi('d1'), pbi('d2'), pbi('d3'), pbi('d4')]);
    const a = (() => {
      let g = createGame(scenario, 'seed-fixed');
      g = step(g, { type: 'commit-iteration' }, scenario);
      g = step(g, { type: 'execute-iteration' }, scenario);
      g = step(g, { type: 'advance-iteration' }, scenario);
      return g.newlyDiscoveredIds[0];
    })();
    const b = (() => {
      let g = createGame(scenario, 'seed-fixed');
      g = step(g, { type: 'commit-iteration' }, scenario);
      g = step(g, { type: 'execute-iteration' }, scenario);
      g = step(g, { type: 'advance-iteration' }, scenario);
      return g.newlyDiscoveredIds[0];
    })();
    expect(a).toBe(b);
  });
});

describe('event-driven add-pbi', () => {
  it('injects new PBI into backlog and tags as newly discovered', () => {
    const injected = pbi('from-event');
    const scenario = makeScenario({
      initialBacklog: [],
      eventDeck: [
        {
          id: 'test-event',
          category: 'vendor',
          baseWeight: 0,
          trigger: 'forced',
          forcedAtIteration: 99, // wont auto-fire; we inject manually
          narrative: 'test',
          options: [
            {
              id: 'opt',
              label: 'opt',
              visibleConsequence: 'adds pbi',
              effects: [{ kind: 'add-pbi', pbi: injected }],
            },
          ],
        },
      ],
    });

    let g = createGame(scenario, 'seed');
    g = step(g, { type: 'respond-to-event', eventId: 'test-event', optionId: 'opt' }, scenario);
    expect(g.productBacklog.some((p) => p.id === 'from-event')).toBe(true);
    const added = g.productBacklog.find((p) => p.id === 'from-event');
    expect(added?.source).toBe('event');
    expect(g.newlyDiscoveredIds).toContain('from-event');
  });

  it('does not duplicate if same id already in backlog', () => {
    const injected = pbi('dup');
    const scenario = makeScenario({
      initialBacklog: [pbi('dup')],
      eventDeck: [
        {
          id: 'e',
          category: 'vendor',
          baseWeight: 0,
          trigger: 'forced',
          forcedAtIteration: 99,
          narrative: 'x',
          options: [
            {
              id: 'opt',
              label: 'opt',
              visibleConsequence: '',
              effects: [{ kind: 'add-pbi', pbi: injected }],
            },
          ],
        },
      ],
    });
    let g = createGame(scenario, 'seed');
    g = step(g, { type: 'respond-to-event', eventId: 'e', optionId: 'opt' }, scenario);
    const count = g.productBacklog.filter((p) => p.id === 'dup').length;
    expect(count).toBe(1);
  });
});
