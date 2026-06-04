import type { Scenario } from '@/engine/types';
import { DEFAULT_INDUSTRY, type IndustryId } from '@/curriculum/industries';
import { scenario01Structure } from './scenario01.structure';
import { SCENARIO_01_DISPLAY } from './scenario01.display';
import { assembleScenario } from './assemble';

/**
 * Assemble the capstone scenario (01) for a given home industry.
 *
 * The structural core (`scenario01Structure`) is industry-neutral: same ids,
 * efforts, effects, magic ids, and balance for every industry. `assembleScenario`
 * deep-merges the chosen industry's DISPLAY pack (titles, names, narratives,
 * option copy) onto that core, keyed by structural id, and returns a complete
 * `Scenario` the engine consumes unchanged. Two industries therefore produce
 * structurally identical games for the same seed and the same player choices.
 *
 * The assembled `id` stays `01-canadian-launch` (the structural FK), so
 * `/play/01-canadian-launch`, the methods `relatedScenarios` link, and the
 * page-level 404 guard all keep resolving.
 */
export function buildScenario(industry: IndustryId = DEFAULT_INDUSTRY): Scenario {
  return assembleScenario(scenario01Structure, SCENARIO_01_DISPLAY[industry]);
}
