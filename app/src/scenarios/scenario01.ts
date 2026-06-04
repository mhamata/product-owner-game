import type { Scenario } from '@/engine/types';
import { buildScenario } from './buildScenario';
import { DEFAULT_INDUSTRY } from '@/curriculum/industries';

// Scenario 01 — The Q3 Expansion. A generic, multi-industry PM capstone.
//
// The scenario is now ASSEMBLED from two halves (see ./scenario01.structure and
// ./scenario01.display): an industry-neutral structural core + a per-industry
// display pack. `buildScenario(industry)` deep-merges them. The runtime sim
// builds the scenario for the player's chosen home industry; this module exports
// the DEFAULT-industry assembly (SaaS / "Hubflow", the original theme) so the
// scenario registry, the `/play/01-canadian-launch` route guard, and the methods
// `relatedScenarios` foreign key all keep resolving by the structural id.
//
// NOTE: the scenario `id` stays '01-canadian-launch' — it is a foreign key
// referenced by methods/data.ts (relatedScenarios) and the home page link.
// All PBI/customer/stakeholder/product ids are likewise load-bearing engine
// wiring (see ./scenario01.structure) and must not change; only human-readable
// copy is themed per industry in ./scenario01.display.

export const scenario01: Scenario = buildScenario(DEFAULT_INDUSTRY);
