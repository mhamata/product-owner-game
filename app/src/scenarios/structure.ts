// Shared structural (industry-neutral) scenario types.
//
// The engine consumes a fully-merged `Scenario` (see engine/types). These
// `Structural*` types are that same shape with all human-readable copy removed,
// so ONE industry-neutral core can drive every home industry. `assembleScenario`
// re-attaches the per-industry display strings, keyed by structural id.
//
// Every ladder scenario shares these types: its `*.structure.ts` exports a
// `ScenarioStructure`, its `*.display.ts` exports one pack per industry, and the
// assembler merges them. Because only copy differs between industries, two
// industries produce structurally identical games (same balance, same seed,
// same outcomes).

import type {
  CustomerState,
  EconomyState,
  EventEffect,
  PBI,
  StakeholderState,
  TeamState,
  TechState,
} from '@/engine/types';

/** A PBI with its display string (`title`) removed. Everything left is structural. */
export type StructuralPBI = Omit<PBI, 'title'>;

/** A customer with its display string (`name`) removed. */
export type StructuralCustomer = Omit<CustomerState, 'name'>;

/** A stakeholder with its display strings (`name`, `role`) removed. */
export type StructuralStakeholder = Omit<StakeholderState, 'name' | 'role'>;

/** An EventEffect where `add-pbi` carries a title-less structural PBI. */
export type StructuralEventEffect =
  | Exclude<EventEffect, { kind: 'add-pbi' }>
  | { kind: 'add-pbi'; pbi: StructuralPBI };

/**
 * An event option without its display strings. `effects` is fully structural,
 * including any `add-pbi` whose injected PBI is a {@link StructuralPBI} (its
 * title is attached per industry).
 */
export interface StructuralEventOption {
  id: string;
  effects: StructuralEventEffect[];
}

/** An event card without its display strings (`narrative`, option labels). */
export interface StructuralEventCard {
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
  options: StructuralEventOption[];
}

/** The complete industry-neutral skeleton of one scenario. */
export interface ScenarioStructure {
  id: string;
  totalIterations: number;
  targetRevenue: number;
  initialBacklog: StructuralPBI[];
  discoveryPool: StructuralPBI[];
  customers: StructuralCustomer[];
  stakeholders: StructuralStakeholder[];
  team: TeamState;
  tech: TechState;
  economy: EconomyState;
  eventDeck: StructuralEventCard[];
}
