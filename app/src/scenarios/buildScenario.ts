import type {
  CustomerState,
  EventCard,
  EventEffect,
  EventOptionData,
  PBI,
  Scenario,
  StakeholderState,
} from '@/engine/types';
import { DEFAULT_INDUSTRY, type IndustryId } from '@/curriculum/industries';
import {
  scenario01Structure,
  type StructuralCustomer,
  type StructuralEventCard,
  type StructuralEventEffect,
  type StructuralEventOption,
  type StructuralPBI,
  type StructuralStakeholder,
} from './scenario01.structure';
import {
  SCENARIO_01_DISPLAY,
  type EventId,
  type EventOptionIds,
  type PbiId,
  type ScenarioDisplay,
} from './scenario01.display';

/**
 * Assemble the capstone scenario for a given home industry.
 *
 * The structural core (`scenario01Structure`) is industry-neutral — same ids,
 * efforts, effects, magic ids, and balance for every industry. This function
 * deep-merges the chosen industry's DISPLAY pack (titles, names, narratives,
 * option copy) onto that core, keyed by structural id, and returns a complete,
 * type-valid `Scenario` the engine consumes unchanged.
 *
 * Because only display strings differ, two industries produce structurally
 * identical games: identical capacity rolls, events, and outcomes for the same
 * seed and the same player choices.
 *
 * The assembled `id` stays `01-canadian-launch` (the structural FK), so
 * `/play/01-canadian-launch`, the methods `relatedScenarios` link, and the
 * page-level 404 guard all keep resolving.
 */
export function buildScenario(industry: IndustryId = DEFAULT_INDUSTRY): Scenario {
  const display = SCENARIO_01_DISPLAY[industry];

  return {
    id: scenario01Structure.id,
    name: display.name,
    summary: display.summary,
    totalIterations: scenario01Structure.totalIterations,
    targetRevenue: scenario01Structure.targetRevenue,
    initialBacklog: scenario01Structure.initialBacklog.map((p) => mergePBI(p, display)),
    discoveryPool: scenario01Structure.discoveryPool.map((p) => mergePBI(p, display)),
    customers: scenario01Structure.customers.map((c) => mergeCustomer(c, display)),
    stakeholders: scenario01Structure.stakeholders.map((s) => mergeStakeholder(s, display)),
    team: { ...scenario01Structure.team },
    tech: { ...scenario01Structure.tech, investmentsDone: [...scenario01Structure.tech.investmentsDone] },
    economy: { ...scenario01Structure.economy },
    eventDeck: scenario01Structure.eventDeck.map((e) => mergeEvent(e, display)),
  };
}

/** Re-attach the per-industry title to a structural PBI. */
function mergePBI(structural: StructuralPBI, display: ScenarioDisplay): PBI {
  return { ...structural, title: display.pbi[structural.id as PbiId] };
}

/** Re-attach the per-industry name to a structural customer. */
function mergeCustomer(structural: StructuralCustomer, display: ScenarioDisplay): CustomerState {
  return { ...structural, name: display.customers[structural.id as keyof ScenarioDisplay['customers']] };
}

/** Re-attach the per-industry name + role to a structural stakeholder. */
function mergeStakeholder(structural: StructuralStakeholder, display: ScenarioDisplay): StakeholderState {
  const d = display.stakeholders[structural.id as keyof ScenarioDisplay['stakeholders']];
  return { ...structural, name: d.name, role: d.role };
}

/** Re-attach narrative + per-option copy to a structural event card. */
function mergeEvent(structural: StructuralEventCard, display: ScenarioDisplay): EventCard {
  const eventId = structural.id as EventId;
  const eventDisplay = display.events[eventId];
  return {
    id: structural.id,
    category: structural.category,
    baseWeight: structural.baseWeight,
    trigger: structural.trigger,
    ...(structural.forcedAtIteration !== undefined
      ? { forcedAtIteration: structural.forcedAtIteration }
      : {}),
    narrative: eventDisplay.narrative,
    options: structural.options.map((o) =>
      mergeOption(o, eventDisplay.options as Record<string, { label: string; visibleConsequence: string }>, display),
    ),
  };
}

/** Re-attach label + visibleConsequence to a structural event option. */
function mergeOption(
  structural: StructuralEventOption,
  optionDisplay: Record<string, { label: string; visibleConsequence: string }>,
  display: ScenarioDisplay,
): EventOptionData {
  const d = optionDisplay[structural.id];
  return {
    id: structural.id,
    label: d.label,
    visibleConsequence: d.visibleConsequence,
    effects: structural.effects.map((e) => mergeEffect(e, display)),
  };
}

/**
 * Convert a structural effect to a runtime effect. The only effect that carries
 * display copy is `add-pbi` (its injected PBI needs the per-industry title);
 * every other effect kind is already runtime-shaped.
 */
function mergeEffect(structural: StructuralEventEffect, display: ScenarioDisplay): EventEffect {
  if (structural.kind === 'add-pbi') {
    return { kind: 'add-pbi', pbi: mergePBI(structural.pbi, display) };
  }
  return structural;
}

// Compile-time guard: EventOptionIds must stay aligned with EventId. If an event
// is added to the structure without a matching option-id map, this errors.
type _EventCoverage = Record<EventId, EventOptionIds[EventId]>;
