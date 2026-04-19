import { describe, it, expect } from 'vitest';
import { createGame, step } from '../step';
import { makeScenario } from './fixtures';
import type { PBI } from '../types';

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

describe('step reducer', () => {
  it('createGame seeds planning phase and copies backlog', () => {
    const scenario = makeScenario({ initialBacklog: [pbi('a'), pbi('b')] });
    const g = createGame(scenario, 'seed');
    expect(g.phase).toBe('planning');
    expect(g.productBacklog.length).toBe(2);
    expect(g.iterationNumber).toBe(1);
  });

  it('add/remove between backlogs', () => {
    const scenario = makeScenario({ initialBacklog: [pbi('a')] });
    let g = createGame(scenario, 'seed');
    g = step(g, { type: 'add-to-iteration', pbiId: 'a' }, scenario);
    expect(g.iterationBacklog.map((p) => p.id)).toEqual(['a']);
    expect(g.productBacklog.length).toBe(0);
    g = step(g, { type: 'remove-from-iteration', pbiId: 'a' }, scenario);
    expect(g.productBacklog.map((p) => p.id)).toEqual(['a']);
  });

  it('place-release-card inserts a release-card pbi', () => {
    const scenario = makeScenario({ initialBacklog: [pbi('a'), pbi('b')] });
    let g = createGame(scenario, 'seed');
    g = step(g, { type: 'add-to-iteration', pbiId: 'a' }, scenario);
    g = step(g, { type: 'add-to-iteration', pbiId: 'b' }, scenario);
    g = step(g, { type: 'place-release-card', index: 1 }, scenario);
    expect(g.iterationBacklog[1].kind).toBe('release-card');
    expect(g.iterationBacklog.length).toBe(3);
  });

  it('commit → execute → advance cycles phase', () => {
    const scenario = makeScenario({ initialBacklog: [pbi('a')] });
    let g = createGame(scenario, 'seed');
    g = step(g, { type: 'add-to-iteration', pbiId: 'a' }, scenario);
    g = step(g, { type: 'commit-iteration' }, scenario);
    expect(g.phase).toBe('committed');
    g = step(g, { type: 'execute-iteration' }, scenario);
    expect(g.phase).toBe('review');
    g = step(g, { type: 'advance-iteration' }, scenario);
    expect(g.phase).toBe('planning');
    expect(g.iterationNumber).toBe(2);
  });

  it('advance past totalIterations → complete', () => {
    const scenario = makeScenario({ totalIterations: 1, initialBacklog: [] });
    let g = createGame(scenario, 'seed');
    g = step(g, { type: 'commit-iteration' }, scenario);
    g = step(g, { type: 'execute-iteration' }, scenario);
    g = step(g, { type: 'advance-iteration' }, scenario);
    expect(g.phase).toBe('complete');
  });
});
