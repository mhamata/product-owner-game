import { describe, it, expect } from 'vitest';
import type { CustomerState, Scenario } from '@/engine/types';
import type { MetricsSnapshot } from '@/store/metricsHistoryStore';
import { makeScenario } from '@/engine/__tests__/fixtures';
import {
  allCohortSprints,
  cohortLinePoints,
  cohortPolylineFor,
  deriveCohortSegments,
  hasCohortTrend,
} from '../cohortCurves';

function customer(overrides: Partial<CustomerState> & Pick<CustomerState, 'id' | 'archetype'>): CustomerState {
  return {
    name: overrides.id,
    engagementState: 'active',
    happiness: 5,
    ltv: 0,
    lastFullRelease: null,
    consecutivePartial: 0,
    consecutiveNothing: 0,
    ...overrides,
  };
}

function snap(sprint: number, customerHappiness?: Record<string, number>): MetricsSnapshot {
  return {
    sprint,
    revenue: 0,
    morale: 7,
    techDebt: 0,
    reliability: 7,
    boardConfidence: 60,
    customerHappiness,
  };
}

describe('deriveCohortSegments', () => {
  const scenario: Scenario = makeScenario({
    customers: [
      customer({ id: 'maya', archetype: 'enterprise' }),
      customer({ id: 'theo', archetype: 'skeptic' }),
      customer({ id: 'nadia', archetype: 'enterprise' }),
    ],
  });

  it('groups per-customer happiness by archetype and averages within a sprint', () => {
    const history: MetricsSnapshot[] = [
      snap(1, { maya: 8, theo: 4, nadia: 6 }),
      snap(2, { maya: 7, theo: 3, nadia: 5 }),
    ];
    const segments = deriveCohortSegments(history, scenario);
    const enterprise = segments.find((s) => s.archetype === 'enterprise')!;
    const skeptic = segments.find((s) => s.archetype === 'skeptic')!;

    expect(enterprise.label).toBe('Enterprise');
    // Sprint 1: (8 + 6) / 2 = 7; sprint 2: (7 + 5) / 2 = 6.
    expect(enterprise.points).toEqual([
      { sprint: 1, avgHappiness: 7, customerCount: 2 },
      { sprint: 2, avgHappiness: 6, customerCount: 2 },
    ]);

    expect(skeptic.label).toBe('Skeptics');
    expect(skeptic.points).toEqual([
      { sprint: 1, avgHappiness: 4, customerCount: 1 },
      { sprint: 2, avgHappiness: 3, customerCount: 1 },
    ]);
  });

  it('skips snapshots recorded before customerHappiness existed, rather than inventing zeros', () => {
    const history: MetricsSnapshot[] = [
      snap(1, undefined), // pre-W4-G snapshot: no customerHappiness field at all
      snap(2, { maya: 9 }),
    ];
    const segments = deriveCohortSegments(history, scenario);
    const enterprise = segments.find((s) => s.archetype === 'enterprise')!;
    expect(enterprise.points).toEqual([{ sprint: 2, avgHappiness: 9, customerCount: 1 }]);
  });

  it('ignores a happiness reading for a customer id not in this scenario', () => {
    const history: MetricsSnapshot[] = [snap(1, { 'unknown-id': 10, maya: 8 })];
    const segments = deriveCohortSegments(history, scenario);
    expect(segments.every((s) => s.points.every((p) => p.avgHappiness !== 10))).toBe(true);
  });

  it('returns no segments for an empty history', () => {
    expect(deriveCohortSegments([], scenario)).toEqual([]);
  });

  it('returns segments sorted by label', () => {
    const history: MetricsSnapshot[] = [snap(1, { maya: 8, theo: 4 })];
    const labels = deriveCohortSegments(history, scenario).map((s) => s.label);
    expect(labels).toEqual([...labels].sort());
  });
});

describe('hasCohortTrend', () => {
  it('is false with zero or one recorded point per segment', () => {
    expect(hasCohortTrend([])).toBe(false);
    expect(hasCohortTrend([{ archetype: 'enterprise', label: 'Enterprise', points: [{ sprint: 1, avgHappiness: 7, customerCount: 1 }] }])).toBe(false);
  });

  it('is true once any segment has 2+ points', () => {
    const segments = [
      {
        archetype: 'enterprise' as const,
        label: 'Enterprise',
        points: [
          { sprint: 1, avgHappiness: 7, customerCount: 1 },
          { sprint: 2, avgHappiness: 6, customerCount: 1 },
        ],
      },
    ];
    expect(hasCohortTrend(segments)).toBe(true);
  });
});

describe('allCohortSprints', () => {
  it('unions and sorts sprints across every segment', () => {
    const segments = [
      { archetype: 'enterprise' as const, label: 'Enterprise', points: [{ sprint: 3, avgHappiness: 7, customerCount: 1 }, { sprint: 1, avgHappiness: 7, customerCount: 1 }] },
      { archetype: 'skeptic' as const, label: 'Skeptics', points: [{ sprint: 2, avgHappiness: 4, customerCount: 1 }] },
    ];
    expect(allCohortSprints(segments)).toEqual([1, 2, 3]);
  });
});

describe('cohortLinePoints / cohortPolylineFor', () => {
  it('maps happiness onto a fixed 0-10 y-domain shared across the whole chart, not a per-segment min/max', () => {
    const points = [
      { sprint: 1, avgHappiness: 0, customerCount: 1 },
      { sprint: 2, avgHappiness: 10, customerCount: 1 },
    ];
    const line = cohortLinePoints(points, [1, 2], 100, 50);
    // Happiness 0 -> bottom of the chart (y = height); happiness 10 -> top (y = 0).
    expect(line[0]).toEqual({ x: 0, y: 50, sprint: 1, value: 0 });
    expect(line[1]).toEqual({ x: 100, y: 0, sprint: 2, value: 10 });
  });

  it('positions x by the shared sprint domain, not the segment\'s own sprint range', () => {
    // This segment only has sprint 2, but the shared domain runs 1..3.
    const points = [{ sprint: 2, avgHappiness: 5, customerCount: 1 }];
    const line = cohortLinePoints(points, [1, 2, 3], 100, 50);
    expect(line[0].x).toBe(50); // midpoint of the 1..3 domain
  });

  it('returns an empty array for an empty sprint domain', () => {
    expect(cohortLinePoints([{ sprint: 1, avgHappiness: 5, customerCount: 1 }], [], 100, 50)).toEqual([]);
  });

  it('renders a polyline points string', () => {
    const line = cohortLinePoints(
      [
        { sprint: 1, avgHappiness: 5, customerCount: 1 },
        { sprint: 2, avgHappiness: 6, customerCount: 1 },
      ],
      [1, 2],
      100,
      50,
    );
    expect(cohortPolylineFor(line)).toBe(`${line[0].x},${line[0].y} ${line[1].x},${line[1].y}`);
  });
});
