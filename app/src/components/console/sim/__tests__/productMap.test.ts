import { describe, it, expect } from 'vitest';
import type { EventRecord, GameState, PBI, Scenario } from '@/engine/types';
import { makeScenario, makeState } from '@/engine/__tests__/fixtures';
import type { DecisionLogEntry } from '@/store/decisionLogStore';
import type { MetricsSnapshot } from '@/store/metricsHistoryStore';
import {
  annotatedPoints,
  deriveDecisionAnnotations,
  deriveDistricts,
  deriveMetricTrend,
  districtDebtAttribution,
  districtFactsLine,
  districtStatusLine,
  isFlatSeries,
  polylineFor,
  sparklineSeries,
} from '../productMap';

function snap(sprint: number, overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
  return {
    sprint,
    revenue: 0,
    morale: 7,
    techDebt: 10,
    reliability: 6,
    boardConfidence: 60,
    ...overrides,
  };
}

/* ============================================================
   Sparklines
   ============================================================ */

describe('sparklineSeries', () => {
  it('returns an empty array with no history', () => {
    expect(sparklineSeries([], 'revenue')).toEqual([]);
  });

  it('renders a single point as a flat mid-height line (nothing to compare yet)', () => {
    const points = sparklineSeries([snap(1, { revenue: 500 })], 'revenue', 56, 22);
    expect(points).toEqual([{ x: 0, y: 11, sprint: 1, value: 500 }]);
  });

  it('min-max scales a rising series so the lowest value sits at the bottom edge', () => {
    const history = [snap(1, { revenue: 0 }), snap(2, { revenue: 50 }), snap(3, { revenue: 100 })];
    const points = sparklineSeries(history, 'revenue', 56, 22);
    expect(points).toHaveLength(3);
    expect(points[0].y).toBe(22); // lowest value -> bottom
    expect(points[2].y).toBe(0); // highest value -> top
    expect(points[0].x).toBe(0);
    expect(points[2].x).toBe(56);
  });

  it('skips null values (e.g. boardConfidence on a pre-board save)', () => {
    const history = [snap(1, { boardConfidence: null }), snap(2, { boardConfidence: 40 })];
    expect(sparklineSeries(history, 'boardConfidence')).toHaveLength(1);
  });

  it('polylineFor renders "x,y x,y" pairs', () => {
    const points = sparklineSeries([snap(1, { revenue: 0 }), snap(2, { revenue: 10 })], 'revenue', 10, 10);
    expect(polylineFor(points)).toBe('0,10 10,0');
  });
});

describe('isFlatSeries', () => {
  it('is flat with fewer than 2 points', () => {
    expect(isFlatSeries([snap(1)], 'revenue')).toBe(true);
    expect(isFlatSeries([], 'revenue')).toBe(true);
  });

  it('is flat when every value is identical (e.g. static reliability)', () => {
    const history = [snap(1, { reliability: 6 }), snap(2, { reliability: 6 }), snap(3, { reliability: 6 })];
    expect(isFlatSeries(history, 'reliability')).toBe(true);
  });

  it('is not flat once a value moves', () => {
    const history = [snap(1, { techDebt: 10 }), snap(2, { techDebt: 25 })];
    expect(isFlatSeries(history, 'techDebt')).toBe(false);
  });
});

describe('deriveMetricTrend', () => {
  it('has no prior point with fewer than 2 recorded sprints', () => {
    expect(deriveMetricTrend([snap(1, { revenue: 100 })], 'revenue')).toEqual({
      direction: 'flat',
      delta: null,
      previousSprint: null,
    });
  });

  it('reads the delta between the latest two sprints', () => {
    const history = [snap(1, { revenue: 100 }), snap(2, { revenue: 300 })];
    expect(deriveMetricTrend(history, 'revenue')).toEqual({ direction: 'up', delta: 200, previousSprint: 1 });
  });

  it('reads a downward delta', () => {
    const history = [snap(1, { techDebt: 50 }), snap(2, { techDebt: 30 })];
    expect(deriveMetricTrend(history, 'techDebt')).toEqual({ direction: 'down', delta: -20, previousSprint: 1 });
  });
});

/* ============================================================
   Decision annotations
   ============================================================ */

function logEntry(sprint: number, rationale: string | null): DecisionLogEntry {
  return {
    runId: 'run-1',
    scenarioId: 'test',
    industry: 'saas',
    sprint,
    committedAt: new Date().toISOString(),
    sprintGoal: null,
    backlogTitles: [],
    releaseCard: null,
    eventResponses: [],
    rationale,
    outcome: null,
  };
}

describe('deriveDecisionAnnotations', () => {
  it('keeps only entries with a non-empty rationale, sprint-ascending', () => {
    const entries = [logEntry(3, 'because reasons'), logEntry(1, null), logEntry(2, 'earlier reason')];
    expect(deriveDecisionAnnotations(entries)).toEqual([
      { sprint: 2, rationale: 'earlier reason', sprintGoal: null },
      { sprint: 3, rationale: 'because reasons', sprintGoal: null },
    ]);
  });

  it('is empty when no entry has a rationale', () => {
    expect(deriveDecisionAnnotations([logEntry(1, null)])).toEqual([]);
  });
});

describe('annotatedPoints', () => {
  it('filters sparkline points down to annotated sprints', () => {
    const points = sparklineSeries(
      [snap(1, { revenue: 0 }), snap(2, { revenue: 50 }), snap(3, { revenue: 100 })],
      'revenue',
    );
    const annotated = annotatedPoints(points, [{ sprint: 2, rationale: 'x', sprintGoal: null }]);
    expect(annotated).toHaveLength(1);
    expect(annotated[0].sprint).toBe(2);
  });
});

/* ============================================================
   Districts
   ============================================================ */

function pbi(overrides: Partial<PBI> & Pick<PBI, 'id' | 'title'>): PBI {
  const effort = overrides.effort ?? 5;
  return {
    kind: 'customer',
    effort,
    effortRevealed: effort,
    value: 100,
    satisfies: [],
    requires: [],
    ...overrides,
  };
}

function districtScenario(overrides: Partial<Scenario> = {}): Scenario {
  return makeScenario({
    initialBacklog: [
      pbi({ id: 'a', title: 'Onboarding flow', productId: 'a', kind: 'customer', effort: 5, satisfies: ['cust1'] }),
      pbi({ id: 'b', title: 'Automated tests', productId: 'b', kind: 'tech', effort: 8 }),
      pbi({ id: 'c', title: 'SSO', productId: 'c', kind: 'customer', effort: 14 }),
    ],
    discoveryPool: [pbi({ id: 'discovery-x', title: 'Undiscovered feature', productId: 'discovery-x', effort: 3 })],
    ...overrides,
  });
}

describe('deriveDistricts', () => {
  it('classifies a shipped PBI (not in either backlog) as built', () => {
    const scenario = districtScenario();
    const state = makeState({ tech: { ...makeState().tech, techDebt: 10 }, productBacklog: [], iterationBacklog: [] });
    const districts = deriveDistricts(state, scenario);
    const a = districts.find((d) => d.id === 'a')!;
    expect(a.status).toBe('built');
    expect(a.healthPct).toBe(90); // 100 - techDebt(10), customer kind
  });

  it('classifies a PBI sitting in the current iteration backlog as investing', () => {
    const scenario = districtScenario();
    const cItem = scenario.initialBacklog.find((p) => p.id === 'c')!;
    const state = makeState({ productBacklog: [], iterationBacklog: [cItem] });
    const c = deriveDistricts(state, scenario).find((d) => d.id === 'c')!;
    expect(c.status).toBe('investing');
    expect(c.healthPct).toBe(45);
    expect(c.span).toBe(4); // effort 14 >= 11
  });

  it('classifies a PBI still sitting untouched in the product backlog as queued, health 0', () => {
    const scenario = districtScenario();
    const bItem = scenario.initialBacklog.find((p) => p.id === 'b')!;
    const state = makeState({ productBacklog: [bItem], iterationBacklog: [] });
    const b = deriveDistricts(state, scenario).find((d) => d.id === 'b')!;
    expect(b.status).toBe('queued');
    expect(b.healthPct).toBe(0);
    expect(b.span).toBe(3); // effort 8 -> span 3
  });

  it('a built tech-kind district reads fully healthy and never hatches, regardless of global debt', () => {
    const scenario = districtScenario();
    const state = makeState({
      productBacklog: [],
      iterationBacklog: [],
      tech: { ...makeState().tech, techDebt: 90 },
    });
    const b = deriveDistricts(state, scenario).find((d) => d.id === 'b')!;
    expect(b.status).toBe('built');
    expect(b.healthPct).toBe(100);
    expect(b.debtLevel).toBe('none');
  });

  it('a built customer-kind district hatches when global tech debt is high', () => {
    const scenario = districtScenario();
    const state = makeState({
      productBacklog: [],
      iterationBacklog: [],
      tech: { ...makeState().tech, techDebt: 70 },
    });
    const a = deriveDistricts(state, scenario).find((d) => d.id === 'a')!;
    expect(a.debtLevel).toBe('high');
    expect(a.healthPct).toBe(30);
  });

  it('never shows a district for an undiscovered discoveryPool item', () => {
    const scenario = districtScenario();
    const state = makeState({ productBacklog: [], iterationBacklog: [] });
    const districts = deriveDistricts(state, scenario);
    expect(districts.find((d) => d.id === 'discovery-x')).toBeUndefined();
  });

  it('shows a district for a discoveryPool item once it is actually revealed into the backlog', () => {
    const scenario = districtScenario();
    const revealed = scenario.discoveryPool!.find((p) => p.id === 'discovery-x')!;
    const state = makeState({ productBacklog: [revealed], iterationBacklog: [] });
    const d = deriveDistricts(state, scenario).find((x) => x.id === 'discovery-x');
    expect(d).toBeDefined();
    expect(d!.status).toBe('queued');
  });

  it('carries the satisfied-customer ids through for the detail sheet', () => {
    const scenario = districtScenario();
    const state = makeState({ productBacklog: [], iterationBacklog: [] });
    const a = deriveDistricts(state, scenario).find((d) => d.id === 'a')!;
    expect(a.satisfiesCustomerIds).toEqual(['cust1']);
  });
});

describe('districtStatusLine / districtFactsLine', () => {
  it('describes each status in plain language', () => {
    const scenario = districtScenario();
    const state = makeState({ productBacklog: [], iterationBacklog: [] });
    const a = deriveDistricts(state, scenario).find((d) => d.id === 'a')!;
    expect(districtStatusLine(a)).toBe('Shipped.');
    expect(districtFactsLine(a, scenario)).toContain('1 backlog item');
  });
});

/* ============================================================
   Debt attribution
   ============================================================ */

describe('districtDebtAttribution', () => {
  it('returns null when tech debt is below the elevated threshold', () => {
    const state: GameState = makeState({ tech: { ...makeState().tech, techDebt: 20 } });
    expect(districtDebtAttribution(state)).toBeNull();
  });

  it('names the last engineering-health investment when debt is elevated', () => {
    const state: GameState = makeState({
      iterationNumber: 5,
      tech: { ...makeState().tech, techDebt: 55, lastTechInvestmentIter: 2 },
    });
    const line = districtDebtAttribution(state)!;
    expect(line).toContain('3 sprints ago');
    expect(line).toContain('Sprint 2');
  });

  it('says no investment has shipped yet when lastTechInvestmentIter is null', () => {
    const state: GameState = makeState({ tech: { ...makeState().tech, techDebt: 55, lastTechInvestmentIter: null } });
    expect(districtDebtAttribution(state)).toContain('No engineering-health investment');
  });

  it('folds in the most recent debt-mentioning event log entry when one exists', () => {
    const events: EventRecord[] = [
      { iteration: 1, eventId: 'e1', optionId: 'o1', narrative: 'Unrelated event', summary: 'Nothing debt-related here' },
      { iteration: 2, eventId: 'e2', optionId: 'o2', narrative: 'Wei pushes an AI mandate', summary: 'Leadership +2, morale -3, tech debt +10.' },
    ];
    const state: GameState = makeState({
      iterationNumber: 3,
      tech: { ...makeState().tech, techDebt: 55, lastTechInvestmentIter: null },
      eventLog: events,
    });
    const line = districtDebtAttribution(state)!;
    expect(line).toContain('tech debt +10');
    expect(line).toContain('Sprint 2');
  });
});
