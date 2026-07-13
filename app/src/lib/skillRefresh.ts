import { INDUSTRIES, type IndustryId } from '@/curriculum/industries';
import { JUDGMENT_SCENARIOS, type JudgmentCompetency, type JudgmentScenario } from '@/curriculum/judgment';
import type { Competency } from '@/curriculum/types';

/**
 * THE 90-SECOND REFRESH (design-sim-2.0.md §2.5): a rusty (decayed, still
 * mastered) skill offers a maintenance rep — two judgment cards for that
 * skill's competency, in a DIFFERENT industry skin than the learner's current
 * one (spacing + variation, per the design ruling). Completing it calls
 * `learnStore.recordMaintenanceRep(skillId)`, which restamps `lastPracticedAt`
 * and resets the decay clock to full strength (see masteryDecay.ts).
 *
 * This module is the pure "which two cards, in which industry" selection
 * logic; the judgment deck's own review machinery (JudgmentCard,
 * resolveScenario, reviewStore.review — same Leitner scheduling a normal
 * review-deck session uses) renders and scores them.
 *
 * COMPETENCY BRIDGE: the curriculum's 17-competency spine (`Competency`, e.g.
 * `data-fluency`) and the judgment deck's own 8-bucket vocabulary
 * (`JudgmentCompetency`, e.g. `metrics`) are two independent taxonomies (see
 * curriculum/judgment/types.ts's own doc comment: the deck groups by "kind of
 * decision", deliberately not the full curriculum spine). There is no
 * existing mapping between them, so a maintenance rep for a curriculum skill
 * needs a best-fit bridge to know which judgment bucket to pull from. The
 * table below is that bridge: a defensible, documented best-fit, not a
 * precise 1:1 (none exists) — every curriculum competency maps to the
 * judgment bucket that most resembles the kind of call it trains.
 */
export const COMPETENCY_TO_JUDGMENT: Record<Competency, JudgmentCompetency> = {
  // execution
  'feature-spec': 'scope-quality',
  delivery: 'ship-polish',
  quality: 'ship-polish',
  // insight
  'data-fluency': 'metrics',
  'voice-of-customer': 'discovery-delivery',
  ux: 'scope-quality',
  // strategy
  'business-outcome': 'prioritization',
  'vision-roadmap': 'prioritization',
  'strategic-impact': 'prioritization',
  // influence
  'stakeholder-mgmt': 'stakeholder-influence',
  'team-leadership': 'stakeholder-influence',
  'managing-up': 'stakeholder-influence',
  // cross-cutting
  business: 'build-buy',
  technical: 'build-buy',
  design: 'scope-quality',
  communication: 'stakeholder-influence',
  ethics: 'ethics',
};

/** The judgment-deck bucket a curriculum competency's refresh should draw from. */
export function judgmentCompetencyFor(competency: Competency): JudgmentCompetency {
  return COMPETENCY_TO_JUDGMENT[competency];
}

/**
 * The industry to run a refresh in: the NEXT one after the learner's current
 * home industry, cyclically. Deterministic (no randomness, matching every
 * other scheduling module in this codebase) while still guaranteeing a
 * different skin than "last time" on every call.
 */
export function pickRefreshIndustry(current: IndustryId): IndustryId {
  const i = INDUSTRIES.findIndex((ind) => ind.id === current);
  const next = INDUSTRIES[(i + 1) % INDUSTRIES.length];
  return next.id;
}

/**
 * Up to `count` judgment scenarios tagged with the given bucket, in stable
 * authored order. Returns fewer than `count` if the bucket doesn't have that
 * many (every bucket has at least 2 today per scenarios.ts's coverage
 * comment, but this stays defensive rather than assuming it).
 */
export function pickMaintenanceScenarios(
  judgmentCompetency: JudgmentCompetency,
  count = 2,
  pool: readonly JudgmentScenario[] = JUDGMENT_SCENARIOS,
): JudgmentScenario[] {
  return pool.filter((s) => s.competency === judgmentCompetency).slice(0, count);
}

/** End-to-end: the refresh session for a curriculum skill's competency + the learner's current industry. */
export function buildRefreshSession(
  competency: Competency,
  currentIndustry: IndustryId,
): { industry: IndustryId; scenarios: JudgmentScenario[] } {
  return {
    industry: pickRefreshIndustry(currentIndustry),
    scenarios: pickMaintenanceScenarios(judgmentCompetencyFor(competency)),
  };
}
