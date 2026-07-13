import { describe, it, expect } from 'vitest';
import type { PersonState } from '@/engine/types';
import type { DecisionLogEntry } from '@/store/decisionLogStore';
import {
  buildQBRRoster,
  buildQBRScoreDims,
  buildQBRSeasonInput,
  buildQBRSprintFacts,
  MAX_QBR_FACTS,
} from '../qbr';

/* ============================================================
   Roster: exactly exec / eng-lead / sales-cs, in that order.
   ============================================================ */

function person(role: PersonState['role'], id = `person-${role}`): PersonState {
  return { id, name: `Name for ${role}`, role, trust: 60, mood: 'steady', agenda: 'x', memory: [] };
}

const roleLabelFor = (role: PersonState['role']) => `Label(${role})`;

describe('buildQBRRoster', () => {
  it('picks exactly the exec, eng-lead, and sales-cs roles, in that order', () => {
    const people: Record<string, PersonState> = {
      [person('design').id]: person('design'),
      [person('data').id]: person('data'),
      [person('exec').id]: person('exec'),
      [person('eng-lead').id]: person('eng-lead'),
      [person('sales-cs').id]: person('sales-cs'),
    };
    const roster = buildQBRRoster(people, roleLabelFor);
    expect(roster.map((p) => p.id)).toEqual(['person-exec', 'person-eng-lead', 'person-sales-cs']);
    expect(roster[0].roleLabel).toBe('Label(exec)');
  });

  it('omits a role missing from the roster rather than inventing one', () => {
    const people: Record<string, PersonState> = {
      [person('exec').id]: person('exec'),
      [person('sales-cs').id]: person('sales-cs'),
    };
    const roster = buildQBRRoster(people, roleLabelFor);
    expect(roster.map((p) => p.id)).toEqual(['person-exec', 'person-sales-cs']);
  });

  it('returns an empty array when people is undefined (pre-roster save)', () => {
    expect(buildQBRRoster(undefined, roleLabelFor)).toEqual([]);
  });
});

/* ============================================================
   Sprint facts: bounded projection, no recompute.
   ============================================================ */

function entry(overrides: Partial<DecisionLogEntry> = {}): DecisionLogEntry {
  return {
    runId: 'run-1',
    scenarioId: 'scenario01',
    industry: 'saas',
    sprint: 1,
    committedAt: '2026-07-12T00:00:00.000Z',
    sprintGoal: 'Ship onboarding',
    backlogTitles: ['Item A'],
    releaseCard: null,
    eventResponses: [],
    rationale: null,
    outcome: null,
    ...overrides,
  };
}

describe('buildQBRSprintFacts', () => {
  it('projects each entry into the route-shaped fact fields', () => {
    const facts = buildQBRSprintFacts([
      entry({ sprint: 1, rationale: 'Betting on retention.', outcome: { summary: '1 shipped' } }),
    ]);
    expect(facts).toEqual([
      {
        sprint: 1,
        sprintGoal: 'Ship onboarding',
        backlogTitles: ['Item A'],
        releaseCard: null,
        eventResponses: [],
        rationale: 'Betting on retention.',
        outcome: { summary: '1 shipped' },
      },
    ]);
  });

  it('bounds to the most recent MAX_QBR_FACTS entries', () => {
    const entries = Array.from({ length: MAX_QBR_FACTS + 5 }, (_, i) => entry({ sprint: i + 1 }));
    const facts = buildQBRSprintFacts(entries) as { sprint: number }[];
    expect(facts).toHaveLength(MAX_QBR_FACTS);
    expect(facts[0].sprint).toBe(6); // the oldest 5 are dropped
    expect(facts[facts.length - 1].sprint).toBe(MAX_QBR_FACTS + 5);
  });

  it('returns an empty array for an empty decision log', () => {
    expect(buildQBRSprintFacts([])).toEqual([]);
  });
});

/* ============================================================
   Score dims + the whole season payload.
   ============================================================ */

describe('buildQBRScoreDims', () => {
  it('carries the 5 dimensions + total verbatim, no recompute', () => {
    const dims = buildQBRScoreDims({
      valueDelivered: 70,
      customerLoyalty: 60,
      teamHealth: 80,
      stakeholderTrust: 65,
      productIntegrity: 75,
      total: 70,
    });
    expect(dims).toEqual({
      valueDelivered: 70,
      customerLoyalty: 60,
      teamHealth: 80,
      stakeholderTrust: 65,
      productIntegrity: 75,
      total: 70,
    });
  });
});

describe('buildQBRSeasonInput', () => {
  it('assembles confidence, expectations, scoreDims, and sprintFacts into one payload', () => {
    const input = buildQBRSeasonInput(
      62,
      [{ id: 'revenue', label: 'Hit target', status: 'on-track' }],
      {
        valueDelivered: 70,
        customerLoyalty: 60,
        teamHealth: 80,
        stakeholderTrust: 65,
        productIntegrity: 75,
        total: 70,
      },
      [entry({ sprint: 1 })],
    );
    expect(input.confidence).toBe(62);
    expect(input.expectations).toEqual([{ id: 'revenue', label: 'Hit target', status: 'on-track' }]);
    expect(input.scoreDims.total).toBe(70);
    expect(input.sprintFacts).toHaveLength(1);
  });
});
