// Sim 2.0 W5-J: pure request-shaping helpers for the multi-party QBR moment
// (design-sim-2.0.md §2.1's "quarterly boss battle" + §2.4). SeasonScreen
// composes these into the `/api/qbr` payload; kept pure/UI-framework-free so
// they're directly testable, mirroring how `season.ts` shapes the rest of
// the Season tab's derived data.

import type { GameScore } from '@/engine/score';
import type { BoardExpectation, PersonState } from '@/engine/types';
import type { DecisionLogEntry } from '@/store/decisionLogStore';
import type { QBRSeasonInput } from './useQBR';

/** The three roles the design doc names as the QBR's voices, in speaking order. */
const QBR_ROSTER_ROLES: PersonState['role'][] = ['exec', 'eng-lead', 'sales-cs'];

/** A run's whole sim history is at most a handful of sprints; mirrors the
 *  route's own MAX_FACTS so the client never sends more than the server keeps. */
export const MAX_QBR_FACTS = 20;

export interface QBRRosterPerson {
  id: string;
  name: string;
  roleLabel: string;
}

/**
 * PURE: the exact three roster people (exec chair, eng lead, sales/CS) a QBR
 * meeting speaks through, in a stable order — never the full 5-person roster.
 * A role missing from `people` (should not happen for a generated roster, but
 * `people` is optional/backfilled) is simply omitted rather than invented.
 */
export function buildQBRRoster(
  people: Record<string, PersonState> | undefined,
  roleLabelFor: (role: PersonState['role']) => string,
): QBRRosterPerson[] {
  if (!people) return [];
  const byRole = new Map<PersonState['role'], PersonState>();
  for (const person of Object.values(people)) byRole.set(person.role, person);

  const roster: QBRRosterPerson[] = [];
  for (const role of QBR_ROSTER_ROLES) {
    const person = byRole.get(role);
    if (!person) continue;
    roster.push({ id: person.id, name: person.name, roleLabel: roleLabelFor(role) });
  }
  return roster;
}

/**
 * PURE: the bounded, decision-log-shaped "sprint facts" the QBR route grounds
 * its meeting in. Takes the most RECENT `MAX_QBR_FACTS` entries (a season
 * rarely exceeds a handful of sprints, but this bounds it the same way
 * interview-ammo's request does) and reshapes them into the route's expected
 * per-fact fields — a plain projection, never a recompute of any number.
 */
export function buildQBRSprintFacts(entries: DecisionLogEntry[]): unknown[] {
  const bounded = entries.length > MAX_QBR_FACTS ? entries.slice(-MAX_QBR_FACTS) : entries;
  return bounded.map((e) => ({
    sprint: e.sprint,
    sprintGoal: e.sprintGoal,
    backlogTitles: e.backlogTitles,
    releaseCard: e.releaseCard,
    eventResponses: e.eventResponses,
    rationale: e.rationale,
    outcome: e.outcome,
  }));
}

/** PURE: the 5-dimension score, exactly as `calculateScore` computed it — no rounding/recompute here. */
export function buildQBRScoreDims(score: GameScore): QBRSeasonInput['scoreDims'] {
  return {
    valueDelivered: score.valueDelivered,
    customerLoyalty: score.customerLoyalty,
    teamHealth: score.teamHealth,
    stakeholderTrust: score.stakeholderTrust,
    productIntegrity: score.productIntegrity,
    total: score.total,
  };
}

/** PURE: assemble the whole `season` payload the route expects. */
export function buildQBRSeasonInput(
  confidence: number,
  expectations: BoardExpectation[],
  score: GameScore,
  entries: DecisionLogEntry[],
): QBRSeasonInput {
  return {
    confidence,
    expectations: expectations.map((e) => ({ id: e.id, label: e.label, status: e.status })),
    scoreDims: buildQBRScoreDims(score),
    sprintFacts: buildQBRSprintFacts(entries),
  };
}
