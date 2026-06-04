import type { Scenario } from '@/engine/types';
import type { IndustryId } from '@/curriculum/industries';
import { scenario01 } from './scenario01';
import { buildScenario } from './buildScenario';
import { SCENARIO_01_ID } from './scenario01.structure';

// scenario02 ('02-clearing-pipeline') is intentionally NOT imported or exported
// here: it is 100% finance/Moomoo content and is excluded from the app until it
// is de-specialized. Leaving it out of this map is what makes its
// /play/02-clearing-pipeline route 404. The file is kept in place — see the
// header comment in ./scenario02.ts. Do not re-add it without genericizing it.

export const scenarios: Record<string, Scenario> = {
  [scenario01.id]: scenario01,
};

/**
 * Resolve a scenario by id. Returns the DEFAULT-industry assembly. This is the
 * registry used for the route-level 404 guard and any industry-agnostic lookup
 * (e.g. methods cross-references) — unknown/removed ids return null so they 404.
 */
export function getScenario(id: string): Scenario | null {
  return scenarios[id] ?? null;
}

/**
 * Resolve a scenario for a specific home industry. For the capstone
 * ('01-canadian-launch') this returns the per-industry assembly; for any other
 * known id it falls back to the registry; unknown ids return null (so the route
 * guard still 404s). The returned `id` is always the structural id.
 */
export function getScenarioForIndustry(id: string, industry: IndustryId): Scenario | null {
  if (id === SCENARIO_01_ID) return buildScenario(industry);
  return getScenario(id);
}

export { scenario01, buildScenario };
