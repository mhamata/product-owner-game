// PRAXIS engine types. Serializable (no Set/Map).

// 'fired' (Sim 2.0 W2-C, design-sim-2.0.md §2.3) is the season's fail state.
// It is additive: every pre-existing phase is untouched, and 'fired' is
// reachable from exactly one place — step.ts's 'advance-iteration' case,
// gated on `state.phase === 'review'` (same gate 'complete' already uses).
// Once a game reaches 'fired' it is terminal: step() no-ops on it, mirroring
// 'complete'. See board.ts for the confidence/firing-floor logic.
export type Phase = 'planning' | 'committed' | 'executing' | 'review' | 'complete' | 'fired';

export type PBIKind = 'customer' | 'tech' | 'regulatory' | 'release-card';

export interface PBI {
  id: string;
  title: string;
  kind: PBIKind;
  effort: number;
  effortUncertain?: boolean;
  effortRevealed: number | null;
  value: number;
  satisfies: string[];
  requires: string[];
  bundleWith?: string[];
  productId?: string;
  // Iteration in which this PBI first entered the backlog. Null for initial.
  discoveredInIteration?: number | null;
  // 'initial' | 'discovery' | 'event': source tag for UI and analytics.
  source?: 'initial' | 'discovery' | 'event';
}

export type CustomerArchetype =
  | 'innovator'
  | 'mainstream'
  | 'enterprise'
  | 'skeptic'
  | 'power-user'
  | 'lurker';

export type EngagementState =
  | 'dormant'
  | 'interested'
  | 'active'
  | 'advocate'
  | 'champion'
  | 'disengaged'
  | 'churned';

export interface CustomerState {
  id: string;
  name: string;
  archetype: CustomerArchetype;
  engagementState: EngagementState;
  happiness: number;
  ltv: number;
  lastFullRelease: number | null;
  consecutivePartial: number;
  consecutiveNothing: number;
}

export interface StakeholderState {
  id: string;
  name: string;
  role: string;
  trust: number;
  lastInteraction: number;
}

// ---------------------------------------------------------------------------
// People roster (Sim 2.0 W1-A, design-sim-2.0.md §2.1). Net-new per-entity
// state, deliberately NOT merged into StakeholderState: `stakeholders` is a
// scenario-authored, variable-cardinality (1-3 entries), scenario-specific-id
// cast (e.g. `hq`/`ciro`) that carries a 0-10 trust scale for narrative
// stakeholder beats. The People roster is a *generic, always-5-role* cast
// (eng lead / design / data / sales & CS / CEO-board) that must exist
// identically across all 5 scenarios x 5 industries, on a 0-100 trust scale,
// with mood/agenda/memory the stakeholder shape has no room for. Cloning the
// Record<id, State> + trust pattern (as the design doc's own "engine reality"
// note directs) rather than extending StakeholderState avoids bolting a
// second, incompatible scale and an inconsistent id/role vocabulary onto an
// existing type that other engine code and every scenario file already
// depends on.
// ---------------------------------------------------------------------------

/** The five canonical People roster roles (design doc §2.1's named list). */
export type PersonRole = 'eng-lead' | 'design' | 'data' | 'sales-cs' | 'exec';

/** Coarse emotional read on a person, driven by recent trust swings. */
export type PersonMood = 'steady' | 'strained' | 'energized';

/** One remembered beat ("consequence flag"), capped/FIFO — see people.ts. */
export interface PersonMemoryEntry {
  sprint: number;
  note: string;
}

export interface PersonState {
  id: string;
  name: string;
  role: PersonRole;
  /** 0-100 (distinct scale from StakeholderState.trust's 0-10). */
  trust: number;
  mood: PersonMood;
  /** One-line display text: what this person currently wants. */
  agenda: string;
  /** Capped, oldest-first, FIFO array — see people.ts PERSON_MEMORY_CAP. */
  memory: PersonMemoryEntry[];
}

// ---------------------------------------------------------------------------
// Board confidence + season structure (Sim 2.0 W2-C, design-sim-2.0.md §2.3).
// Net-new, optional state — see GameState.board below for the backward-compat
// contract. Lives alongside people.ts's roster as the run's other new
// "always exists, deterministic from scenario+seed" per-run construct.
// ---------------------------------------------------------------------------

export type BoardExpectationStatus = 'on-track' | 'at-risk' | 'off-track';

/** One of the 3 deterministic season expectations — see board.ts. */
export interface BoardExpectation {
  id: string;
  label: string;
  status: BoardExpectationStatus;
}

export interface BoardState {
  /** 0-100, clamped. See board.ts's deriveConfidenceDelta for the rule table. */
  confidence: number;
  expectations: BoardExpectation[];
  /** Set only once, the sprint the run was fired at (board.ts's FIRING_FLOOR). */
  firedAtSprint?: number;
}

export interface TeamState {
  morale: number;
  headcount: number;
  onboarding: number;
  sickOrVacation: number;
  burnoutFlag: boolean;
}

export interface TechState {
  releaseCost: number;
  capacityBaseline: number;
  capacityVariance: number;
  techDebt: number;
  reliability: number;
  cycleTime: number;
  investmentsDone: string[];
  lastTechInvestmentIter: number | null;
}

export interface EconomyState {
  revenue: number;
  interestAccrued: number;
  budgetRemaining: number;
  interestRate: number;
}

export interface EventRecord {
  iteration: number;
  eventId: string;
  optionId: string | null;
  narrative: string;
  summary: string;
  // Which roster person "sent" this — card.senderId if authored, else derived
  // from category via people.ts's deriveSenderIdForEvent. Optional: absent on
  // event log entries recorded before this field existed, or when no roster
  // person could be resolved (e.g. `people` missing/empty).
  personId?: string;
}

export interface PatternTag {
  tag: string;
  iteration: number;
  confidence: number;
  evidence: string;
}

export interface GameState {
  scenarioId: string;
  totalIterations: number;
  iterationNumber: number;
  seed: string;
  phase: Phase;

  productBacklog: PBI[];
  iterationBacklog: PBI[];
  releaseCardPosition: number | null;
  sprintGoal: string | null;

  customers: Record<string, CustomerState>;
  stakeholders: Record<string, StakeholderState>;
  team: TeamState;
  tech: TechState;
  economy: EconomyState;

  // Optional so old persisted snapshots (pre Sim-2.0 W1-A) keep loading without
  // migration: absence means "not generated yet," not "empty roster." step()
  // lazily backfills it from `generatePeopleRoster(scenario.id, seed)` the
  // first time it processes any action against a state missing it; any other
  // reader should treat `undefined` the same way (fall back to `{}` / null
  // lookups) rather than assume it is always present. See people.ts.
  people?: Record<string, PersonState>;

  // Optional so old persisted snapshots (pre Sim-2.0 W2-C) keep loading without
  // migration: absence means "not generated yet." step()/board.ts's
  // ensureBoard lazily backfill it the same way people.ts's roster is
  // backfilled — same-scenario+seed always reproduces the same starting
  // confidence/expectations. See board.ts.
  board?: BoardState;

  eventLog: EventRecord[];
  activePatterns: PatternTag[];

  // Snapshot for review screen, set each time resolveIteration runs
  lastOutcome: IterationOutcome | null;

  // Pending events to be surfaced in review (rules-based)
  pendingEvents: string[];

  // IDs of PBIs added to the backlog at the start of the current iteration.
  // Reset each time the player advances. UI badges these as NEW.
  newlyDiscoveredIds: string[];

  // PM methods the player claimed to have used on decisions. Surfaced in
  // the AI retrospective as "you invoked RICE here, interview angle: ..."
  methodTags: MethodTag[];
}

export interface MethodTag {
  iteration: number;
  context: 'commit-iteration' | 'event-response';
  contextId: string; // sprint goal text for commit, eventId for event
  methodId: string;
}

export interface IterationOutcome {
  iteration: number;
  capacityRolled: number;
  capacityRange: { lower: number; expected: number; upper: number };
  done: PBI[];
  notDone: PBI[];
  releasedProducts: string[];
  revenueEarned: number;
  techDebtDelta: number;
  moraleDelta: number;
  happinessDeltas: Record<string, number>;
  firedEvents: string[];
}

export interface EventOptionData {
  id: string;
  label: string;
  visibleConsequence: string;
  // Pure patch describing effects (no closures, so JSON-safe).
  effects: EventEffect[];
}

export type EventEffect =
  | { kind: 'morale'; delta: number }
  | { kind: 'tech-debt'; delta: number }
  | { kind: 'trust'; stakeholderId: string; delta: number }
  | { kind: 'happiness'; customerId: string; delta: number }
  | { kind: 'revenue'; delta: number }
  | { kind: 'capacity-baseline'; delta: number }
  | { kind: 'headcount'; delta: number }
  | { kind: 'add-pattern'; tag: string }
  | { kind: 'add-pbi'; pbi: PBI }
  // Trust delta attributed to one roster person (0-100 scale — distinct effect
  // from `trust`, which targets the 0-10-scale `stakeholders` record). Applied
  // by events.ts's applyEventEffects with clamping; a big enough swing appends
  // a PersonMemoryEntry (see people.ts PERSON_MEMORY_TRUST_THRESHOLD).
  | { kind: 'person-trust'; personId: string; delta: number }
  // Direct board-confidence move from a scenario event (on top of the
  // per-sprint rule table in board.ts's deriveConfidenceDelta). Applied by
  // events.ts's applyEventEffects with clamping; a no-op if `state.board`
  // isn't present (mirrors `person-trust`'s undefined-safe handling).
  | { kind: 'board-confidence'; delta: number };

export interface EventCard {
  id: string;
  category:
    | 'stakeholder'
    | 'team'
    | 'customer'
    | 'vendor'
    | 'market'
    | 'tech'
    | 'strategic'
    | 'regulatory';
  baseWeight: number;
  trigger: 'random' | 'forced' | 'weighted' | 'state-gated';
  forcedAtIteration?: number;
  narrative: string;
  options: EventOptionData[];
  // Optional: names the roster person this card narratively comes "from," for
  // the W2-D inbox UI. Existing/unauthored cards omit it; people.ts's
  // deriveSenderIdForEvent falls back to a category → role derivation so every
  // card still resolves to *a* sender.
  senderId?: string;
}

export interface Scenario {
  id: string;
  name: string;
  summary: string;
  totalIterations: number;
  targetRevenue: number;
  initialBacklog: PBI[];
  // Optional pool of items discoverable over the course of the game.
  // At the start of each iteration (except the first) the engine reveals 1
  // item from this pool, selected via seeded PRNG.
  discoveryPool?: PBI[];
  customers: CustomerState[];
  stakeholders: StakeholderState[];
  team: TeamState;
  tech: TechState;
  economy: EconomyState;
  eventDeck: EventCard[];
}

export type Action =
  | { type: 'add-to-iteration'; pbiId: string }
  | { type: 'remove-from-iteration'; pbiId: string }
  | { type: 'reorder-iteration'; fromIndex: number; toIndex: number }
  | { type: 'place-release-card'; index: number | null }
  | { type: 'set-sprint-goal'; goal: string }
  | { type: 'commit-iteration'; methodId?: string }
  | { type: 'execute-iteration' }
  | { type: 'advance-iteration' }
  | { type: 'respond-to-event'; eventId: string; optionId: string; methodId?: string };
