/**
 * Judgment-deck registry.
 *
 * Collects the authored scenarios, guards their ids for uniqueness, and exposes
 * the small lookup surface the review store and view need. Adding a scenario is
 * one line in `scenarios.ts`; this file keeps the access patterns in one place.
 */
import { INDUSTRIES, INDUSTRY_NOUNS, type IndustryId } from '@/curriculum/industries';
import type { IndustryContext } from '@/curriculum/lessons/types';
import { JUDGMENT_SCENARIOS } from './scenarios';
import type { JudgmentScenario } from './types';

export { JUDGMENT_SCENARIOS } from './scenarios';
export {
  JUDGMENT_COMPETENCY_LABEL,
  resolveScenario,
  type JudgmentScenario,
  type JudgmentOption,
  type JudgmentCompetency,
  type ResolvedScenario,
} from './types';

/**
 * Fail loudly at module load if two scenarios share an id. The scheduler keys a
 * learner's history by scenario id, so a duplicate would silently merge two
 * cards' progress. Cheap check, catches a nasty class of authoring bug.
 */
const seen = new Set<string>();
for (const s of JUDGMENT_SCENARIOS) {
  if (seen.has(s.id)) {
    throw new Error(`Duplicate judgment scenario id: "${s.id}"`);
  }
  seen.add(s.id);
}

/** Every scenario id in deck order. The scheduler's notion of "the full deck". */
export const ALL_SCENARIO_IDS: string[] = JUDGMENT_SCENARIOS.map((s) => s.id);

/** Total number of scenarios in the deck. */
export const TOTAL_SCENARIOS = JUDGMENT_SCENARIOS.length;

const SCENARIO_BY_ID = new Map<string, JudgmentScenario>(
  JUDGMENT_SCENARIOS.map((s) => [s.id, s]),
);

/** Look up a scenario by id, or `undefined` if it is not in the deck. */
export function getScenario(id: string): JudgmentScenario | undefined {
  return SCENARIO_BY_ID.get(id);
}

/**
 * Build the tiny industry context a scenario resolves against. Mirrors the
 * concept lesson's `industryContext` so flavoured judgment content and flavoured
 * lesson content see exactly the same nouns for a given industry.
 */
export function judgmentIndustryContext(id: IndustryId): IndustryContext {
  const label = INDUSTRIES.find((i) => i.id === id)?.label ?? id;
  const nouns = INDUSTRY_NOUNS[id];
  return { id, label, product: nouns.product, user: nouns.user };
}
