import { describe, it, expect } from 'vitest';
import { createGame, step } from '../step';
import { applyEventEffects } from '../events';
import { generatePeopleRoster } from '../people';
import {
  FIRING_FLOOR,
  advanceBoard,
  deriveBoardExpectations,
  deriveConfidenceDelta,
  deriveInitialConfidence,
  deriveJobMarketOffers,
  deriveSeasonSummary,
  ensureBoard,
  getBoardConfidence,
  getExpectationStatuses,
  isFired,
  refreshExpectations,
  type BoardConfidenceInputs,
} from '../board';
import type { GameState } from '../types';
import { makeScenario, makeState } from './fixtures';

function baseInputs(overrides: Partial<BoardConfidenceInputs> = {}): BoardConfidenceInputs {
  return {
    commitRatio: 0.7,
    releasedAnyProduct: false,
    revenueAfter: 0,
    targetRevenue: 0,
    sprintsCompleted: 1,
    totalIterations: 6,
    techDebtBefore: 0,
    techDebtAfter: 0,
    ...overrides,
  };
}

describe('deriveInitialConfidence', () => {
  it('is deterministic for a given scenario', () => {
    const scenario = makeScenario();
    expect(deriveInitialConfidence(scenario)).toBe(deriveInitialConfidence(scenario));
  });

  it('stays clamped to [45, 65]', () => {
    const volatile = makeScenario({
      tech: { ...makeScenario().tech, capacityBaseline: 10, capacityVariance: 20 },
    });
    const calm = makeScenario({
      tech: { ...makeScenario().tech, capacityBaseline: 20, capacityVariance: 1 },
    });
    expect(deriveInitialConfidence(volatile)).toBeGreaterThanOrEqual(45);
    expect(deriveInitialConfidence(volatile)).toBeLessThanOrEqual(65);
    expect(deriveInitialConfidence(calm)).toBeGreaterThanOrEqual(45);
    expect(deriveInitialConfidence(calm)).toBeLessThanOrEqual(65);
  });

  it('a more volatile capacity (higher variance:baseline ratio) starts no higher than a calmer one', () => {
    const volatile = makeScenario({
      tech: { ...makeScenario().tech, capacityBaseline: 10, capacityVariance: 20 },
    });
    const calm = makeScenario({
      tech: { ...makeScenario().tech, capacityBaseline: 20, capacityVariance: 1 },
    });
    expect(deriveInitialConfidence(volatile)).toBeLessThanOrEqual(deriveInitialConfidence(calm));
  });
});

describe('deriveConfidenceDelta (rule table, each trigger)', () => {
  it('is 0 when nothing notable happens', () => {
    expect(deriveConfidenceDelta(baseInputs())).toBe(0);
  });

  it('+3 when commit delivery >= 90% ("goal met")', () => {
    expect(deriveConfidenceDelta(baseInputs({ commitRatio: 0.95 }))).toBe(3);
  });

  it('-4 when commit delivery < 50% ("goal missed")', () => {
    expect(deriveConfidenceDelta(baseInputs({ commitRatio: 0.3 }))).toBe(-4);
  });

  it('+5 when a product releases this sprint', () => {
    expect(deriveConfidenceDelta(baseInputs({ releasedAnyProduct: true }))).toBe(5);
  });

  it('+2 when cumulative revenue is at/above 90% of the pro-rated pace', () => {
    const inputs = baseInputs({
      targetRevenue: 1000,
      sprintsCompleted: 2,
      totalIterations: 4,
      revenueAfter: 500, // pace expected = 500, ratio 1.0
    });
    expect(deriveConfidenceDelta(inputs)).toBe(2);
  });

  it('-3 when cumulative revenue is under 50% of the pro-rated pace', () => {
    const inputs = baseInputs({
      targetRevenue: 1000,
      sprintsCompleted: 2,
      totalIterations: 4,
      revenueAfter: 100, // pace expected = 500, ratio 0.2
    });
    expect(deriveConfidenceDelta(inputs)).toBe(-3);
  });

  it('-5 when tech debt crosses upward into the 60+ band this sprint', () => {
    const inputs = baseInputs({ techDebtBefore: 55, techDebtAfter: 62 });
    expect(deriveConfidenceDelta(inputs)).toBe(-5);
  });

  it('-10 when tech debt crosses both the 60+ and 80+ bands in the same sprint', () => {
    const inputs = baseInputs({ techDebtBefore: 55, techDebtAfter: 85 });
    expect(deriveConfidenceDelta(inputs)).toBe(-10);
  });

  it('does not re-penalize a band already crossed in a prior sprint', () => {
    const inputs = baseInputs({ techDebtBefore: 65, techDebtAfter: 70 });
    expect(deriveConfidenceDelta(inputs)).toBe(0);
  });

  it('sums multiple simultaneous triggers', () => {
    const inputs = baseInputs({
      commitRatio: 0.95,
      releasedAnyProduct: true,
      techDebtBefore: 55,
      techDebtAfter: 62,
    });
    // +3 (goal met) + 5 (release) - 5 (debt incident) = 3
    expect(deriveConfidenceDelta(inputs)).toBe(3);
  });
});

describe('advanceBoard clamping', () => {
  it('clamps confidence to [0, 100]', () => {
    const scenario = makeScenario();
    const state = makeState();
    const highBoard = { confidence: 99, expectations: deriveBoardExpectations(scenario) };
    const high = advanceBoard(
      highBoard,
      state,
      scenario,
      baseInputs({ commitRatio: 1, releasedAnyProduct: true }),
    );
    expect(high.confidence).toBeLessThanOrEqual(100);

    const lowBoard = { confidence: 2, expectations: deriveBoardExpectations(scenario) };
    const low = advanceBoard(lowBoard, state, scenario, baseInputs({ commitRatio: 0 }));
    expect(low.confidence).toBeGreaterThanOrEqual(0);
  });
});

describe('board expectations derivation', () => {
  it('starts all 3 expectations on-track', () => {
    const scenario = makeScenario();
    const expectations = deriveBoardExpectations(scenario);
    expect(expectations).toHaveLength(3);
    expect(expectations.map((e) => e.id).sort()).toEqual(['customers', 'product', 'revenue']);
    for (const e of expectations) expect(e.status).toBe('on-track');
  });

  it('refreshExpectations reads revenue/customer/product status off current state', () => {
    const scenario = makeScenario({ targetRevenue: 1000 });
    const expectations = deriveBoardExpectations(scenario);

    const behind = makeState({
      iterationNumber: 4,
      totalIterations: 6,
      economy: { revenue: 50, interestAccrued: 0, budgetRemaining: 0, interestRate: 0 },
      customers: {
        a: {
          id: 'a',
          name: 'A',
          archetype: 'mainstream',
          engagementState: 'active',
          happiness: 1,
          ltv: 100,
          lastFullRelease: null,
          consecutivePartial: 0,
          consecutiveNothing: 0,
        },
      },
      tech: { ...makeState().tech, techDebt: 90 },
    });
    const refreshed = refreshExpectations(expectations, behind, scenario);
    const byId = Object.fromEntries(refreshed.map((e) => [e.id, e.status]));
    expect(byId.revenue).toBe('off-track');
    expect(byId.customers).toBe('off-track');
    expect(byId.product).toBe('off-track');

    const healthy = makeState({
      iterationNumber: 4,
      totalIterations: 6,
      economy: { revenue: 900, interestAccrued: 0, budgetRemaining: 0, interestRate: 0 },
      customers: {
        a: {
          id: 'a',
          name: 'A',
          archetype: 'mainstream',
          engagementState: 'active',
          happiness: 9,
          ltv: 100,
          lastFullRelease: null,
          consecutivePartial: 0,
          consecutiveNothing: 0,
        },
      },
      tech: { ...makeState().tech, techDebt: 5 },
    });
    const refreshedHealthy = refreshExpectations(expectations, healthy, scenario);
    const byIdHealthy = Object.fromEntries(refreshedHealthy.map((e) => [e.id, e.status]));
    expect(byIdHealthy.revenue).toBe('on-track');
    expect(byIdHealthy.customers).toBe('on-track');
    expect(byIdHealthy.product).toBe('on-track');
  });
});

describe('firing (fail state)', () => {
  it('advance-iteration fires when confidence is below the floor at review', () => {
    const scenario = makeScenario({ totalIterations: 6 });
    const state = makeState({
      phase: 'review',
      iterationNumber: 3,
      totalIterations: 6,
      board: { confidence: FIRING_FLOOR - 1, expectations: deriveBoardExpectations(scenario) },
    });
    const next = step(state, { type: 'advance-iteration' }, scenario);
    expect(next.phase).toBe('fired');
    expect(next.board?.firedAtSprint).toBe(3);
    expect(isFired(next)).toBe(true);
  });

  it('does NOT fire at or above the floor', () => {
    const scenario = makeScenario({ totalIterations: 6 });
    const state = makeState({
      phase: 'review',
      iterationNumber: 3,
      totalIterations: 6,
      board: { confidence: FIRING_FLOOR, expectations: deriveBoardExpectations(scenario) },
    });
    const next = step(state, { type: 'advance-iteration' }, scenario);
    expect(next.phase).toBe('planning');
    expect(next.board?.firedAtSprint).toBeUndefined();
  });

  it('firing takes priority over "complete" on the final sprint', () => {
    const scenario = makeScenario({ totalIterations: 3 });
    const state = makeState({
      phase: 'review',
      iterationNumber: 3,
      totalIterations: 3,
      board: { confidence: 5, expectations: deriveBoardExpectations(scenario) },
    });
    const next = step(state, { type: 'advance-iteration' }, scenario);
    expect(next.phase).toBe('fired');
  });

  it('is reachable ONLY from review: a low-confidence board mid-planning does not fire on other actions', () => {
    const scenario = makeScenario();
    const state = makeState({
      phase: 'planning',
      board: { confidence: 5, expectations: deriveBoardExpectations(scenario) },
    });
    const next = step(state, { type: 'set-sprint-goal', goal: 'ship it' }, scenario);
    expect(next.phase).toBe('planning');
    expect(next.board?.firedAtSprint).toBeUndefined();
  });

  it('step() on a fired game is a no-op for any action', () => {
    const scenario = makeScenario();
    // A realistically-reachable fired state already has its people roster
    // backfilled (every action does that before phase logic runs) — include
    // it here too, so this test isn't just re-proving the backfill.
    const firedState: GameState = makeState({
      phase: 'fired',
      board: { confidence: 5, expectations: deriveBoardExpectations(scenario), firedAtSprint: 3 },
      people: generatePeopleRoster(scenario.id, 'seed-1'),
      sprintGoal: null,
    });
    const afterGoal = step(firedState, { type: 'set-sprint-goal', goal: 'never mind' }, scenario);
    expect(afterGoal).toEqual(firedState);

    const afterAdvance = step(firedState, { type: 'advance-iteration' }, scenario);
    expect(afterAdvance).toEqual(firedState);

    const afterCommit = step(firedState, { type: 'commit-iteration' }, scenario);
    expect(afterCommit).toEqual(firedState);
  });
});

describe('board-confidence EventEffect', () => {
  it('moves confidence and clamps to [0, 100]', () => {
    const scenario = makeScenario();
    const state = makeState({ board: { confidence: 95, expectations: deriveBoardExpectations(scenario) } });
    const boosted = applyEventEffects(state, [{ kind: 'board-confidence', delta: 20 }]);
    expect(boosted.board?.confidence).toBe(100);

    const crashed = applyEventEffects(state, [{ kind: 'board-confidence', delta: -1000 }]);
    expect(crashed.board?.confidence).toBe(0);
  });

  it('is a no-op when state.board is missing entirely (does not throw)', () => {
    const state = makeState(); // no `board`
    expect(() =>
      applyEventEffects(state, [{ kind: 'board-confidence', delta: 10 }]),
    ).not.toThrow();
    const result = applyEventEffects(state, [{ kind: 'board-confidence', delta: 10 }]);
    expect(result.board).toBeUndefined();
  });
});

describe('deriveSeasonSummary', () => {
  it('reports verdict "fired" whenever the run ended fired', () => {
    const scenario = makeScenario();
    const state = makeState({
      phase: 'fired',
      board: { confidence: 10, expectations: deriveBoardExpectations(scenario), firedAtSprint: 4 },
    });
    const summary = deriveSeasonSummary(state, scenario);
    expect(summary.verdict).toBe('fired');
    expect(summary.fired).toBe(true);
    expect(summary.firedAtSprint).toBe(4);
  });
});

describe('deriveJobMarketOffers (deterministic)', () => {
  it('same final state -> same offers', () => {
    const scenario = makeScenario();
    const state = makeState({
      seed: 'seed-x',
      board: { confidence: 80, expectations: deriveBoardExpectations(scenario) },
      economy: { revenue: 900, interestAccrued: 0, budgetRemaining: 0, interestRate: 0 },
    });
    const a = deriveJobMarketOffers(state, scenario);
    const b = deriveJobMarketOffers(state, scenario);
    expect(a).toEqual(b);
  });

  it('produces 2-3 offers', () => {
    const scenario = makeScenario();
    const state = makeState({ board: { confidence: 60, expectations: deriveBoardExpectations(scenario) } });
    const offers = deriveJobMarketOffers(state, scenario);
    expect(offers.length).toBeGreaterThanOrEqual(2);
    expect(offers.length).toBeLessThanOrEqual(3);
  });

  it('a fired run only offers "down" or "same" levels, never "up"', () => {
    const scenario = makeScenario();
    const state = makeState({
      phase: 'fired',
      board: { confidence: 10, expectations: deriveBoardExpectations(scenario), firedAtSprint: 4 },
    });
    const offers = deriveJobMarketOffers(state, scenario);
    for (const o of offers) expect(o.level).not.toBe('up');
  });

  it('a different final record (same seed) yields different offers', () => {
    const scenario = makeScenario();
    const strong = makeState({
      seed: 'seed-y',
      economy: { revenue: 1000, interestAccrued: 0, budgetRemaining: 0, interestRate: 0 },
      board: { confidence: 90, expectations: deriveBoardExpectations(scenario) },
    });
    const weak = makeState({
      seed: 'seed-y',
      economy: { revenue: 0, interestAccrued: 0, budgetRemaining: 0, interestRate: 0 },
      board: { confidence: 20, expectations: deriveBoardExpectations(scenario) },
    });
    expect(deriveJobMarketOffers(strong, scenario)).not.toEqual(deriveJobMarketOffers(weak, scenario));
  });

  it('flavors company names by industry when provided', () => {
    const scenario = makeScenario();
    const state = makeState({ board: { confidence: 60, expectations: deriveBoardExpectations(scenario) } });
    const offers = deriveJobMarketOffers(state, scenario, 'fintech');
    // Fintech pool companies are distinguishable from the default pool.
    expect(offers.every((o) => typeof o.company === 'string' && o.company.length > 0)).toBe(true);
  });
});

describe('old-snapshot backward compatibility', () => {
  it('createGame always populates board on a fresh game', () => {
    const scenario = makeScenario();
    const g = createGame(scenario, 'seed-1');
    expect(g.board).toBeDefined();
    expect(g.board!.expectations).toHaveLength(3);
  });

  it('step() on a state missing `board` (pre-W2-C snapshot) does not crash and backfills it', () => {
    const scenario = makeScenario({ initialBacklog: [] });
    const oldSnapshot: GameState = makeState({ scenarioId: scenario.id, seed: 'legacy-seed' });
    expect(oldSnapshot.board).toBeUndefined();

    const next = step(oldSnapshot, { type: 'set-sprint-goal', goal: 'ship it' }, scenario);
    expect(next.board).toBeDefined();
    expect(next.sprintGoal).toBe('ship it');
  });

  it('a full commit/execute/advance cycle works fine without pre-seeded board', () => {
    const scenario = makeScenario({ id: 'turnaround', initialBacklog: [], totalIterations: 2 });
    let g: GameState = makeState({ scenarioId: scenario.id, totalIterations: 2, seed: 'legacy' });
    expect(g.board).toBeUndefined();
    g = step(g, { type: 'commit-iteration' }, scenario);
    g = step(g, { type: 'execute-iteration' }, scenario);
    expect(g.phase).toBe('review');
    expect(g.board).toBeDefined();
    g = step(g, { type: 'advance-iteration' }, scenario);
    expect(['planning', 'complete', 'fired']).toContain(g.phase);
  });

  it('getBoardConfidence/getExpectationStatuses fall back cleanly for a boardless state', () => {
    const scenario = makeScenario();
    const state = makeState();
    expect(getBoardConfidence(state, scenario)).toBe(deriveInitialConfidence(scenario));
    expect(getExpectationStatuses(state, scenario)).toHaveLength(3);
  });

  it('ensureBoard returns the existing board untouched when present', () => {
    const scenario = makeScenario();
    const board = { confidence: 42, expectations: deriveBoardExpectations(scenario) };
    expect(ensureBoard(board, scenario)).toBe(board);
  });
});
