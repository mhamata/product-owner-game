import type {
  CustomerState,
  EventCard,
  EventEffect,
  EventOptionData,
  PBI,
  Scenario,
  StakeholderState,
} from '@/engine/types';
import type {
  ScenarioStructure,
  StructuralCustomer,
  StructuralEventCard,
  StructuralEventEffect,
  StructuralEventOption,
  StructuralPBI,
  StructuralStakeholder,
} from './structure';

/**
 * Display primitives shared by every ladder scenario's display pack. A scenario
 * authors its pack with STRICT id unions (so the compiler forces full coverage
 * of every PBI, customer, stakeholder, event, and option); those strict packs
 * are all assignable to the loose `ScenarioDisplayLike` below, which lets this
 * assembler stay generic across scenarios.
 */
export interface OptionDisplay {
  label: string;
  visibleConsequence: string;
}

export interface StakeholderDisplay {
  name: string;
  role: string;
}

export interface EventDisplayLike {
  narrative: string;
  options: Record<string, OptionDisplay>;
}

/** The industry-agnostic shape the assembler consumes. */
export interface ScenarioDisplayLike {
  name: string;
  summary: string;
  pbi: Record<string, string>;
  customers: Record<string, string>;
  stakeholders: Record<string, StakeholderDisplay>;
  events: Record<string, EventDisplayLike>;
}

/**
 * Merge an industry-neutral {@link ScenarioStructure} with one industry's
 * display pack into a complete {@link Scenario} the engine consumes unchanged.
 *
 * The structure owns every load-bearing value (ids, efforts, values, effects,
 * triggers, balance). The display pack owns only human-readable copy, keyed by
 * structural id. Because the structure is identical across industries, swapping
 * the display pack changes the story without touching game balance.
 */
export function assembleScenario(
  structure: ScenarioStructure,
  display: ScenarioDisplayLike,
): Scenario {
  return {
    id: structure.id,
    name: display.name,
    summary: display.summary,
    totalIterations: structure.totalIterations,
    targetRevenue: structure.targetRevenue,
    initialBacklog: structure.initialBacklog.map((p) => mergePBI(p, display)),
    discoveryPool: structure.discoveryPool.map((p) => mergePBI(p, display)),
    customers: structure.customers.map((c) => mergeCustomer(c, display)),
    stakeholders: structure.stakeholders.map((s) => mergeStakeholder(s, display)),
    team: { ...structure.team },
    tech: { ...structure.tech, investmentsDone: [...structure.tech.investmentsDone] },
    economy: { ...structure.economy },
    eventDeck: structure.eventDeck.map((e) => mergeEvent(e, display)),
  };
}

/** Re-attach the per-industry title to a structural PBI. */
function mergePBI(structural: StructuralPBI, display: ScenarioDisplayLike): PBI {
  return { ...structural, title: display.pbi[structural.id] };
}

/** Re-attach the per-industry name to a structural customer. */
function mergeCustomer(structural: StructuralCustomer, display: ScenarioDisplayLike): CustomerState {
  return { ...structural, name: display.customers[structural.id] };
}

/** Re-attach the per-industry name + role to a structural stakeholder. */
function mergeStakeholder(
  structural: StructuralStakeholder,
  display: ScenarioDisplayLike,
): StakeholderState {
  const d = display.stakeholders[structural.id];
  return { ...structural, name: d.name, role: d.role };
}

/** Re-attach narrative + per-option copy to a structural event card. */
function mergeEvent(structural: StructuralEventCard, display: ScenarioDisplayLike): EventCard {
  const eventDisplay = display.events[structural.id];
  return {
    id: structural.id,
    category: structural.category,
    baseWeight: structural.baseWeight,
    trigger: structural.trigger,
    ...(structural.forcedAtIteration !== undefined
      ? { forcedAtIteration: structural.forcedAtIteration }
      : {}),
    narrative: eventDisplay.narrative,
    options: structural.options.map((o) => mergeOption(o, eventDisplay.options, display)),
  };
}

/** Re-attach label + visibleConsequence to a structural event option. */
function mergeOption(
  structural: StructuralEventOption,
  optionDisplay: Record<string, OptionDisplay>,
  display: ScenarioDisplayLike,
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
 * Convert a structural effect to a runtime effect. The only effect carrying
 * display copy is `add-pbi` (its injected PBI needs the per-industry title);
 * every other effect kind is already runtime-shaped.
 */
function mergeEffect(structural: StructuralEventEffect, display: ScenarioDisplayLike): EventEffect {
  if (structural.kind === 'add-pbi') {
    return { kind: 'add-pbi', pbi: mergePBI(structural.pbi, display) };
  }
  return structural;
}
