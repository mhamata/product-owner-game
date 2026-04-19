// PRAXIS engine types. Serializable (no Set/Map).

export type Phase = 'planning' | 'committed' | 'executing' | 'review' | 'complete';

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
  // 'initial' | 'discovery' | 'event' — source tag for UI and analytics.
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

  eventLog: EventRecord[];
  activePatterns: PatternTag[];

  // Snapshot for review screen — set each time resolveIteration runs
  lastOutcome: IterationOutcome | null;

  // Pending events to be surfaced in review (rules-based)
  pendingEvents: string[];

  // IDs of PBIs added to the backlog at the start of the current iteration.
  // Reset each time the player advances. UI badges these as NEW.
  newlyDiscoveredIds: string[];
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
  | { kind: 'add-pbi'; pbi: PBI };

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
  | { type: 'commit-iteration' }
  | { type: 'execute-iteration' }
  | { type: 'advance-iteration' }
  | { type: 'respond-to-event'; eventId: string; optionId: string };
