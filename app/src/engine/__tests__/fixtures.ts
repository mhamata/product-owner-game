import type { GameState, Scenario } from '../types';

export function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'test',
    name: 'Test Scenario',
    summary: '',
    totalIterations: 6,
    targetRevenue: 1000,
    initialBacklog: [],
    customers: [],
    stakeholders: [],
    team: {
      morale: 7,
      headcount: 5,
      onboarding: 0,
      sickOrVacation: 0,
      burnoutFlag: false,
    },
    tech: {
      releaseCost: 3,
      capacityBaseline: 15,
      capacityVariance: 3,
      techDebt: 0,
      reliability: 7,
      cycleTime: 1.0,
      investmentsDone: [],
      lastTechInvestmentIter: null,
    },
    economy: {
      revenue: 0,
      interestAccrued: 0,
      budgetRemaining: 0,
      interestRate: 0,
    },
    eventDeck: [],
    ...overrides,
  };
}

export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    scenarioId: 'test',
    totalIterations: 6,
    iterationNumber: 1,
    seed: 'seed-1',
    phase: 'planning',
    productBacklog: [],
    iterationBacklog: [],
    releaseCardPosition: null,
    sprintGoal: null,
    customers: {},
    stakeholders: {},
    team: {
      morale: 7,
      headcount: 5,
      onboarding: 0,
      sickOrVacation: 0,
      burnoutFlag: false,
    },
    tech: {
      releaseCost: 3,
      capacityBaseline: 15,
      capacityVariance: 3,
      techDebt: 0,
      reliability: 7,
      cycleTime: 1.0,
      investmentsDone: [],
      lastTechInvestmentIter: null,
    },
    economy: {
      revenue: 0,
      interestAccrued: 0,
      budgetRemaining: 0,
      interestRate: 0,
    },
    eventLog: [],
    activePatterns: [],
    lastOutcome: null,
    pendingEvents: [],
    ...overrides,
  };
}
