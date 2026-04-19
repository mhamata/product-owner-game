import type { Action, GameState, PBI, Scenario } from './types';
import { resolveIteration } from './execution';
import { applyEventEffects, findOption } from './events';
import { runDiscovery } from './discovery';

export function createGame(scenario: Scenario, seed: string): GameState {
  const customers: Record<string, GameState['customers'][string]> = {};
  for (const c of scenario.customers) customers[c.id] = { ...c };
  const stakeholders: Record<string, GameState['stakeholders'][string]> = {};
  for (const s of scenario.stakeholders) stakeholders[s.id] = { ...s };

  return {
    scenarioId: scenario.id,
    totalIterations: scenario.totalIterations,
    iterationNumber: 1,
    seed,
    phase: 'planning',
    productBacklog: scenario.initialBacklog.map((p) => ({
      ...p,
      source: p.source ?? 'initial',
      discoveredInIteration: p.discoveredInIteration ?? null,
    })),
    iterationBacklog: [],
    releaseCardPosition: null,
    sprintGoal: null,
    customers,
    stakeholders,
    team: { ...scenario.team },
    tech: { ...scenario.tech, investmentsDone: [...scenario.tech.investmentsDone] },
    economy: { ...scenario.economy },
    eventLog: [],
    activePatterns: [],
    lastOutcome: null,
    pendingEvents: [],
    newlyDiscoveredIds: [],
  };
}

function collectPriorDoneIds(state: GameState): Set<string> {
  // Everything not currently in productBacklog or iterationBacklog counts as shipped/lost.
  // Simpler: we derive from event log of shipped items. For MVP we track via a trivial
  // sentinel — PBIs removed from both backlogs after resolveIteration via appending to
  // an internal list. We infer by scanning state's prior done events (MVP: look at
  // lastOutcome history is lost; we recompute from the scenario-initial backlog minus
  // current backlogs).
  const inBacklogs = new Set<string>([
    ...state.productBacklog.map((p) => p.id),
    ...state.iterationBacklog.map((p) => p.id),
  ]);
  // Caller passes scenario initial ids minus these; handled in step() using Scenario.
  return inBacklogs;
}

export function step(state: GameState, action: Action, scenario: Scenario): GameState {
  switch (action.type) {
    case 'add-to-iteration': {
      if (state.phase !== 'planning') return state;
      const pbi = state.productBacklog.find((p) => p.id === action.pbiId);
      if (!pbi) return state;
      return {
        ...state,
        productBacklog: state.productBacklog.filter((p) => p.id !== action.pbiId),
        iterationBacklog: [...state.iterationBacklog, pbi],
      };
    }
    case 'remove-from-iteration': {
      if (state.phase !== 'planning') return state;
      const pbi = state.iterationBacklog.find((p) => p.id === action.pbiId);
      if (!pbi) return state;
      return {
        ...state,
        iterationBacklog: state.iterationBacklog.filter((p) => p.id !== action.pbiId),
        productBacklog: [pbi, ...state.productBacklog],
      };
    }
    case 'reorder-iteration': {
      if (state.phase !== 'planning') return state;
      const list = [...state.iterationBacklog];
      const [moved] = list.splice(action.fromIndex, 1);
      list.splice(action.toIndex, 0, moved);
      return { ...state, iterationBacklog: list };
    }
    case 'place-release-card': {
      if (state.phase !== 'planning') return state;
      // Remove any prior release-card from iteration backlog
      const withoutCard = state.iterationBacklog.filter((p) => p.kind !== 'release-card');
      if (action.index === null) {
        return { ...state, iterationBacklog: withoutCard, releaseCardPosition: null };
      }
      const card: PBI = {
        id: 'release-card',
        title: 'Release 🚀',
        kind: 'release-card',
        effort: state.tech.releaseCost,
        effortRevealed: state.tech.releaseCost,
        value: 0,
        satisfies: [],
        requires: [],
      };
      const idx = Math.max(0, Math.min(action.index, withoutCard.length));
      const list = [...withoutCard];
      list.splice(idx, 0, card);
      return { ...state, iterationBacklog: list, releaseCardPosition: idx };
    }
    case 'set-sprint-goal':
      return { ...state, sprintGoal: action.goal };
    case 'commit-iteration': {
      if (state.phase !== 'planning') return state;
      return { ...state, phase: 'committed' };
    }
    case 'execute-iteration': {
      if (state.phase !== 'committed') return state;
      const priorDoneIds = derivePriorDone(state, scenario);
      const { next } = resolveIteration(state, scenario, priorDoneIds);
      return next;
    }
    case 'advance-iteration': {
      if (state.phase !== 'review') return state;
      const next = state.iterationNumber + 1;
      if (next > state.totalIterations) {
        return { ...state, phase: 'complete' };
      }
      const advanced: GameState = {
        ...state,
        iterationNumber: next,
        phase: 'planning',
        sprintGoal: null,
        pendingEvents: [],
        newlyDiscoveredIds: [],
      };
      // Discovery: reveal new PBI(s) for this iteration.
      const { newBacklog, newlyDiscoveredIds } = runDiscovery(advanced, scenario);
      return {
        ...advanced,
        productBacklog: newBacklog,
        newlyDiscoveredIds,
      };
    }
    case 'respond-to-event': {
      const card = scenario.eventDeck.find((e) => e.id === action.eventId);
      if (!card) return state;
      const option = findOption(card, action.optionId);
      if (!option) return state;
      const afterEffects = applyEventEffects(state, option.effects);
      const log = [
        ...afterEffects.eventLog,
        {
          iteration: state.iterationNumber,
          eventId: card.id,
          optionId: option.id,
          narrative: card.narrative,
          summary: option.visibleConsequence,
        },
      ];
      const pending = afterEffects.pendingEvents.filter((id) => id !== card.id);
      const addedIds = option.effects
        .filter((e): e is Extract<typeof e, { kind: 'add-pbi' }> => e.kind === 'add-pbi')
        .map((e) => e.pbi.id);
      return {
        ...afterEffects,
        eventLog: log,
        pendingEvents: pending,
        newlyDiscoveredIds: [...state.newlyDiscoveredIds, ...addedIds],
      };
    }
  }
  return state;
}

function derivePriorDone(state: GameState, scenario: Scenario): Set<string> {
  const inBacklogs = new Set<string>([
    ...state.productBacklog.map((p) => p.id),
    ...state.iterationBacklog.map((p) => p.id),
  ]);
  const done = new Set<string>();
  for (const p of scenario.initialBacklog) {
    if (!inBacklogs.has(p.id)) done.add(p.id);
  }
  return done;
}
