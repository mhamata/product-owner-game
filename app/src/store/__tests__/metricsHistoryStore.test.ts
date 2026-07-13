import { describe, it, expect } from 'vitest';
import type { GameState } from '@/engine/types';
import { makeState } from '@/engine/__tests__/fixtures';
import {
  deriveMetricSnapshot,
  recordSnapshotPure,
  selectHistoryForRun,
  clearRunHistoryPure,
  MAX_SNAPSHOTS,
  type MetricsSnapshot,
} from '../metricsHistoryStore';

function snapshot(sprint: number, overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
  return {
    sprint,
    revenue: 100 * sprint,
    morale: 7,
    techDebt: 10,
    reliability: 6,
    boardConfidence: 60,
    ...overrides,
  };
}

describe('deriveMetricSnapshot', () => {
  it('reads the raw current values straight off GameState, with no math', () => {
    const state: GameState = makeState({
      iterationNumber: 3,
      economy: { revenue: 4200, interestAccrued: 0, budgetRemaining: 0, interestRate: 0 },
      team: { morale: 8, headcount: 5, onboarding: 0, sickOrVacation: 0, burnoutFlag: false },
      tech: {
        releaseCost: 3,
        capacityBaseline: 15,
        capacityVariance: 3,
        techDebt: 42,
        reliability: 6.5,
        cycleTime: 1,
        investmentsDone: [],
        lastTechInvestmentIter: null,
      },
      board: { confidence: 55, expectations: [] },
    });
    expect(deriveMetricSnapshot(state)).toEqual({
      sprint: 3,
      revenue: 4200,
      morale: 8,
      techDebt: 42,
      reliability: 6.5,
      boardConfidence: 55,
      customerHappiness: {},
    });
  });

  it('reads boardConfidence as null when `board` is absent (old persisted saves)', () => {
    const state: GameState = makeState({ board: undefined });
    expect(deriveMetricSnapshot(state).boardConfidence).toBeNull();
  });

  it('reads customerHappiness straight off state.customers, keyed by customer id (W4-G)', () => {
    const state: GameState = makeState({
      customers: {
        maya: { id: 'maya', name: 'Maya', archetype: 'enterprise', engagementState: 'active', happiness: 7, ltv: 0, lastFullRelease: null, consecutivePartial: 0, consecutiveNothing: 0 },
        theo: { id: 'theo', name: 'Theo', archetype: 'skeptic', engagementState: 'interested', happiness: 3, ltv: 0, lastFullRelease: null, consecutivePartial: 0, consecutiveNothing: 0 },
      },
    });
    expect(deriveMetricSnapshot(state).customerHappiness).toEqual({ maya: 7, theo: 3 });
  });
});

describe('recordSnapshotPure', () => {
  it('appends a new (runId, sprint) pair', () => {
    const next = recordSnapshotPure([], 'run-1', snapshot(1));
    expect(next).toHaveLength(1);
    expect(next[0]).toEqual({ runId: 'run-1', snapshot: snapshot(1) });
  });

  it('upserts (replaces) an existing sprint for the same run rather than duplicating it', () => {
    let history = recordSnapshotPure([], 'run-1', snapshot(1, { revenue: 0 }));
    history = recordSnapshotPure(history, 'run-1', snapshot(1, { revenue: 500 }));
    expect(history).toHaveLength(1);
    expect(history[0].snapshot.revenue).toBe(500);
  });

  it('keeps separate runs and separate sprints independent', () => {
    let history = recordSnapshotPure([], 'run-1', snapshot(1));
    history = recordSnapshotPure(history, 'run-1', snapshot(2));
    history = recordSnapshotPure(history, 'run-2', snapshot(1));
    expect(history).toHaveLength(3);
  });

  it('caps total snapshots at MAX_SNAPSHOTS via oldest-first eviction', () => {
    let history: { runId: string; snapshot: MetricsSnapshot }[] = [];
    for (let i = 0; i < MAX_SNAPSHOTS + 5; i++) {
      history = recordSnapshotPure(history, 'run-1', snapshot(i));
    }
    expect(history).toHaveLength(MAX_SNAPSHOTS);
    expect(history[0].snapshot.sprint).toBe(5);
  });
});

describe('selectHistoryForRun', () => {
  it('returns only the given run, sprint-ascending regardless of insertion order', () => {
    let history = recordSnapshotPure([], 'run-1', snapshot(2));
    history = recordSnapshotPure(history, 'run-1', snapshot(1));
    history = recordSnapshotPure(history, 'run-2', snapshot(1));
    const result = selectHistoryForRun(history, 'run-1');
    expect(result.map((s) => s.sprint)).toEqual([1, 2]);
  });

  it('returns an empty array for a run with no snapshots', () => {
    expect(selectHistoryForRun([], 'nope')).toEqual([]);
  });
});

describe('clearRunHistoryPure', () => {
  it('drops only the given run', () => {
    let history = recordSnapshotPure([], 'run-1', snapshot(1));
    history = recordSnapshotPure(history, 'run-2', snapshot(1));
    const next = clearRunHistoryPure(history, 'run-1');
    expect(next).toHaveLength(1);
    expect(next[0].runId).toBe('run-2');
  });
});
