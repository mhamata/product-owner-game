import type { Action, GameState, PBI, Scenario } from './types';
import { resolveIteration } from './execution';
import { applyEventEffects, findOption } from './events';
import { runDiscovery } from './discovery';
import { deriveSenderIdForEvent, generatePeopleRoster } from './people';
import { ensureBoard, FIRING_FLOOR } from './board';

// `industry` is an optional plain string (not the UI's `IndustryId`) so the
// engine stays dependency-free of `@/curriculum` — see people.ts. Existing
// 2-arg call sites (e.g. store/gameStore.ts) keep compiling unchanged and get
// the industry-neutral roster.
export function createGame(scenario: Scenario, seed: string, industry?: string): GameState {
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
    people: generatePeopleRoster(scenario.id, seed, industry),
    board: ensureBoard(undefined, scenario),
    team: { ...scenario.team },
    tech: { ...scenario.tech, investmentsDone: [...scenario.tech.investmentsDone] },
    economy: { ...scenario.economy },
    eventLog: [],
    activePatterns: [],
    lastOutcome: null,
    pendingEvents: [],
    newlyDiscoveredIds: [],
    methodTags: [],
  };
}

function collectPriorDoneIds(state: GameState): Set<string> {
  // Everything not currently in productBacklog or iterationBacklog counts as shipped/lost.
  // Simpler: we derive from event log of shipped items. For MVP we track via a trivial
  // sentinel. PBIs removed from both backlogs after resolveIteration via appending to
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
  // Backward-compat lazy backfill: a persisted GameState from before W1-A
  // won't have `people`. Rather than requiring a migration step, every
  // action self-heals it here before doing anything else, so every case
  // below (and resolveIteration/applyEventEffects, which receive this same
  // `state`) always sees a populated roster. Deterministic: re-derives the
  // exact roster createGame would have produced for this scenario+seed.
  if (!state.people) {
    state = { ...state, people: generatePeopleRoster(scenario.id, state.seed) };
  }
  // Same lazy-backfill contract as `people` above, for a pre-W2-C snapshot
  // that has no `board` yet. See types.ts's GameState.board comment.
  if (!state.board) {
    state = { ...state, board: ensureBoard(undefined, scenario) };
  }
  // 'fired' is terminal, same as 'complete': every action is a no-op once a
  // run has been fired. See types.ts's Phase comment.
  if (state.phase === 'fired') return state;
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
      const methodTags = action.methodId
        ? [
            ...state.methodTags,
            {
              iteration: state.iterationNumber,
              context: 'commit-iteration' as const,
              contextId: state.sprintGoal ?? `iter-${state.iterationNumber}`,
              methodId: action.methodId,
            },
          ]
        : state.methodTags;
      return { ...state, phase: 'committed', methodTags };
    }
    case 'execute-iteration': {
      if (state.phase !== 'committed') return state;
      const priorDoneIds = derivePriorDone(state, scenario);
      const { next } = resolveIteration(state, scenario, priorDoneIds);
      return next;
    }
    case 'advance-iteration': {
      if (state.phase !== 'review') return state;
      // Fail state (design-sim-2.0.md §2.3): a review that lands below the
      // firing floor ends the run right here, even on the season's final
      // sprint (fired takes priority over 'complete'). This is the ONLY
      // place `phase` becomes 'fired' — reachable exclusively from 'review'.
      // A story beat, not a punishment: the engine just records the fact.
      if (state.board && state.board.confidence < FIRING_FLOOR) {
        return {
          ...state,
          phase: 'fired',
          board: { ...state.board, firedAtSprint: state.iterationNumber },
        };
      }
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
      const senderId = deriveSenderIdForEvent(card, afterEffects.people);
      const log = [
        ...afterEffects.eventLog,
        {
          iteration: state.iterationNumber,
          eventId: card.id,
          optionId: option.id,
          narrative: card.narrative,
          summary: option.visibleConsequence,
          ...(senderId ? { personId: senderId } : {}),
        },
      ];
      const pending = afterEffects.pendingEvents.filter((id) => id !== card.id);
      const addedIds = option.effects
        .filter((e): e is Extract<typeof e, { kind: 'add-pbi' }> => e.kind === 'add-pbi')
        .map((e) => e.pbi.id);
      const methodTags = action.methodId
        ? [
            ...afterEffects.methodTags,
            {
              iteration: state.iterationNumber,
              context: 'event-response' as const,
              contextId: card.id,
              methodId: action.methodId,
            },
          ]
        : afterEffects.methodTags;
      return {
        ...afterEffects,
        eventLog: log,
        pendingEvents: pending,
        newlyDiscoveredIds: [...state.newlyDiscoveredIds, ...addedIds],
        methodTags,
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
