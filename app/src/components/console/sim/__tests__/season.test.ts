import { describe, it, expect } from 'vitest';
import { makeScenario, makeState } from '@/engine/__tests__/fixtures';
import type { DecisionLogEntry } from '@/store/decisionLogStore';
import {
  careerFileSummary,
  deriveFiredBeatFacts,
  deriveFiredSurface,
  deriveJobMarketVisibility,
  deriveSprintTimeline,
  offerCardMeta,
  verdictCopy,
} from '../season';

/* ============================================================
   Sprint timeline
   ============================================================ */

describe('deriveSprintTimeline', () => {
  it('marks sprints before iterationNumber as past, the current one as now, the rest future', () => {
    const state = makeState({ totalIterations: 4, iterationNumber: 2, phase: 'planning' });
    const timeline = deriveSprintTimeline(state);
    expect(timeline.map((s) => s.status)).toEqual(['past', 'now', 'future', 'future']);
  });

  it('flags the final sprint as the QBR', () => {
    const state = makeState({ totalIterations: 3, iterationNumber: 1, phase: 'planning' });
    const timeline = deriveSprintTimeline(state);
    expect(timeline.map((s) => s.isQBR)).toEqual([false, false, true]);
  });

  it('reads every sprint up to iterationNumber as past once the run is complete — no more "now"', () => {
    const state = makeState({ totalIterations: 3, iterationNumber: 3, phase: 'complete' });
    const timeline = deriveSprintTimeline(state);
    expect(timeline.map((s) => s.status)).toEqual(['past', 'past', 'past']);
  });

  it('marks the sprint a fired run ended on, and reads sprints after it as future', () => {
    const state = makeState({
      totalIterations: 5,
      iterationNumber: 3,
      phase: 'fired',
      board: { confidence: 10, expectations: [], firedAtSprint: 3 },
    });
    const timeline = deriveSprintTimeline(state);
    expect(timeline.map((s) => s.status)).toEqual(['past', 'past', 'past', 'future', 'future']);
    expect(timeline.find((s) => s.sprint === 3)?.isFiredAt).toBe(true);
    expect(timeline.find((s) => s.sprint === 1)?.isFiredAt).toBe(false);
  });
});

/* ============================================================
   Job market visibility
   ============================================================ */

describe('deriveJobMarketVisibility', () => {
  it('stays locked for every non-terminal phase', () => {
    for (const phase of ['planning', 'committed', 'executing', 'review'] as const) {
      expect(deriveJobMarketVisibility(phase)).toBe('locked');
    }
  });

  it('opens once the season ends, win or fired', () => {
    expect(deriveJobMarketVisibility('complete')).toBe('open');
    expect(deriveJobMarketVisibility('fired')).toBe('open');
  });
});

/* ============================================================
   Offer-card display meta
   ============================================================ */

describe('offerCardMeta', () => {
  it('maps every JobOfferLevel to a distinct label + arrow', () => {
    expect(offerCardMeta('down')).toEqual({ levelLabel: 'Smaller scope', arrow: '▼' });
    expect(offerCardMeta('same')).toEqual({ levelLabel: 'Lateral move', arrow: '—' });
    expect(offerCardMeta('up')).toEqual({ levelLabel: 'Bigger scope', arrow: '▲' });
  });
});

/* ============================================================
   Fired-state routing
   ============================================================ */

describe('deriveFiredSurface', () => {
  it('always shows the tab shell for a non-fired phase, regardless of the seen flag', () => {
    expect(deriveFiredSurface('planning', false)).toBe('tabs');
    expect(deriveFiredSurface('review', true)).toBe('tabs');
  });

  it('shows the beat when fired and not yet dismissed', () => {
    expect(deriveFiredSurface('fired', false)).toBe('beat');
  });

  it('shows the tab shell once the beat has been dismissed', () => {
    expect(deriveFiredSurface('fired', true)).toBe('tabs');
  });
});

/* ============================================================
   Fired beat facts
   ============================================================ */

describe('deriveFiredBeatFacts', () => {
  it('uses board.firedAtSprint over the live iterationNumber when set', () => {
    const scenario = makeScenario({ targetRevenue: 1000 });
    const state = makeState({
      phase: 'fired',
      iterationNumber: 5,
      economy: { revenue: 250, interestAccrued: 0, budgetRemaining: 0, interestRate: 0 },
      board: {
        confidence: 20,
        firedAtSprint: 3,
        expectations: [
          { id: 'revenue', label: 'Hit revenue', status: 'off-track' },
          { id: 'customers', label: 'Keep customers happy', status: 'on-track' },
          { id: 'product', label: 'Keep tech debt down', status: 'at-risk' },
        ],
      },
    });
    const facts = deriveFiredBeatFacts(state, scenario);
    expect(facts.sprint).toBe(3);
    expect(facts.proofLine).toContain('1 of 3 board expectations held');
    expect(facts.proofLine).toContain('$250');
  });

  it('falls back to iterationNumber when firedAtSprint is unset', () => {
    const scenario = makeScenario();
    const state = makeState({
      phase: 'fired',
      iterationNumber: 4,
      board: { confidence: 10, expectations: [] },
    });
    expect(deriveFiredBeatFacts(state, scenario).sprint).toBe(4);
  });
});

/* ============================================================
   Verdict copy
   ============================================================ */

describe('verdictCopy', () => {
  it('gives every verdict its own non-empty heading + line', () => {
    const verdicts = ['exceeded', 'met', 'mixed', 'missed', 'fired'] as const;
    const seen = new Set<string>();
    for (const v of verdicts) {
      const copy = verdictCopy(v);
      expect(copy.heading.length).toBeGreaterThan(0);
      expect(copy.line.length).toBeGreaterThan(0);
      seen.add(copy.heading);
    }
    expect(seen.size).toBe(verdicts.length);
  });
});

/* ============================================================
   Career File summary
   ============================================================ */

describe('careerFileSummary', () => {
  function entry(overrides: Partial<DecisionLogEntry> = {}): DecisionLogEntry {
    return {
      runId: 'run-1',
      scenarioId: 'test',
      industry: 'saas',
      sprint: 1,
      committedAt: '2026-01-01T00:00:00.000Z',
      sprintGoal: null,
      backlogTitles: [],
      releaseCard: null,
      eventResponses: [],
      rationale: null,
      outcome: null,
      ...overrides,
    };
  }

  it('counts sprints logged, sprints with rationale, and total event responses', () => {
    const entries: DecisionLogEntry[] = [
      entry({ sprint: 1, rationale: 'Cut scope' }),
      entry({ sprint: 2, rationale: null, eventResponses: [{ event: 'e', choice: 'c' }] }),
      entry({ sprint: 3, rationale: 'Held the line', eventResponses: [{ event: 'e1', choice: 'c1' }, { event: 'e2', choice: 'c2' }] }),
    ];
    const summary = careerFileSummary(entries, 2);
    expect(summary).toEqual({
      sprintsLogged: 3,
      withRationale: 2,
      eventResponses: 3,
      interviewStoriesDrafted: 2,
    });
  });

  it('reads all zeros for an empty run', () => {
    expect(careerFileSummary([], 0)).toEqual({
      sprintsLogged: 0,
      withRationale: 0,
      eventResponses: 0,
      interviewStoriesDrafted: 0,
    });
  });
});
