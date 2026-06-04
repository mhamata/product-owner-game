import type { Scenario } from '@/engine/types';
import { DEFAULT_INDUSTRY, type IndustryId } from '@/curriculum/industries';
import { scenario01 } from './scenario01';
import { buildScenario } from './buildScenario';
import { assembleScenario } from './assemble';
import { SCENARIO_01_ID } from './scenario01.structure';
import { TURNAROUND_ID, turnaroundStructure } from './turnaround.structure';
import { TURNAROUND_DISPLAY } from './turnaround.display';
import { ZERO_TO_ONE_ID, zeroToOneStructure } from './zeroToOne.structure';
import { ZERO_TO_ONE_DISPLAY } from './zeroToOne.display';
import { SCALING_CRUNCH_ID, scalingCrunchStructure } from './scalingCrunch.structure';
import { SCALING_CRUNCH_DISPLAY } from './scalingCrunch.display';
import { REGULATED_LAUNCH_ID, regulatedLaunchStructure } from './regulatedLaunch.structure';
import { REGULATED_LAUNCH_DISPLAY } from './regulatedLaunch.display';

// scenario02 ('02-clearing-pipeline', the old finance-only "clearing pipeline")
// has been de-specialized into the ladder's industry-generic 'regulated-launch'
// rung below. The legacy file is left in place but is no longer registered, so
// /play/02-clearing-pipeline 404s, same as before.

/**
 * The scenario registry: scenarioId -> per-industry builder. This is the single
 * source of which simulations exist. A builder assembles a scenario for the
 * player's home industry from its structural core + display pack (see
 * ./assemble). Adding a ladder scenario means: author its structure + display,
 * register its builder here, and add its rung in ./ladder.
 */
const builders: Record<string, (industry: IndustryId) => Scenario> = {
  [SCENARIO_01_ID]: buildScenario,
  [TURNAROUND_ID]: (industry) => assembleScenario(turnaroundStructure, TURNAROUND_DISPLAY[industry]),
  [ZERO_TO_ONE_ID]: (industry) => assembleScenario(zeroToOneStructure, ZERO_TO_ONE_DISPLAY[industry]),
  [SCALING_CRUNCH_ID]: (industry) =>
    assembleScenario(scalingCrunchStructure, SCALING_CRUNCH_DISPLAY[industry]),
  [REGULATED_LAUNCH_ID]: (industry) =>
    assembleScenario(regulatedLaunchStructure, REGULATED_LAUNCH_DISPLAY[industry]),
};

/** Every registered scenario id (the sims that actually resolve and play). */
export const registeredScenarioIds: string[] = Object.keys(builders);

/** True if a scenario id has a registered builder, so its route resolves. */
export function isScenarioRegistered(id: string): boolean {
  return id in builders;
}

/**
 * Resolve a scenario by id at the DEFAULT industry. Used by the route-level 404
 * guard and any industry-agnostic lookup (e.g. methods cross-references).
 * Unknown ids return null so the route 404s.
 */
export function getScenario(id: string): Scenario | null {
  const build = builders[id];
  return build ? build(DEFAULT_INDUSTRY) : null;
}

/**
 * Resolve a scenario for a specific home industry. Returns the per-industry
 * assembly for any registered scenario; unknown ids return null (so the route
 * guard still 404s). The returned `id` is always the structural id.
 */
export function getScenarioForIndustry(id: string, industry: IndustryId): Scenario | null {
  const build = builders[id];
  return build ? build(industry) : null;
}

export { scenario01, buildScenario };
