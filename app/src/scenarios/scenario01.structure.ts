import type {
  CustomerState,
  EventEffect,
  PBI,
  StakeholderState,
  EconomyState,
  TeamState,
  TechState,
} from '@/engine/types';

/**
 * Scenario 01 — STRUCTURAL CORE (industry-neutral).
 *
 * This file owns every load-bearing value the engine consumes: ids, efforts,
 * values, `satisfies`/`requires` wiring, `productId`s, PBI/event `kind`s, all
 * event `effect`s, triggers, weights, and every team/tech/economy number, plus
 * `totalIterations` and `targetRevenue`. None of it is industry-specific — the
 * SAME structure powers all five home industries, so game balance is provably
 * identical across them. Only human-readable copy varies, and that lives in
 * `./scenario01.display`.
 *
 * MAGIC IDS — referenced by string in the engine, so they must never change:
 *   • `automated-tests`   (engine/techDebt.ts pays down debt; capacity.ts cuts variance)
 *   • `dod-check`         (engine/techDebt.ts: a Definition-of-Done gate in `requires`)
 *   • `refactor-core`, `observability`, `dev-team-training-bundle`,
 *     `framework-upgrade-bundle` are also engine-recognised — none appear here,
 *     but the contract holds: any tech id added later that matches one of these
 *     gains its engine effect. Of the recognised set, only `automated-tests`
 *     is present in this scenario.
 *
 * The scenario `id` stays `01-canadian-launch`: it is a foreign key referenced
 * by methods/data.ts (`relatedScenarios`) and the home-page capstone link.
 */

/** The structural id this scenario assembles to. Load-bearing FK — do not change. */
export const SCENARIO_01_ID = '01-canadian-launch';

/**
 * A PBI with its display string (`title`) removed. Everything that remains is
 * structural. `buildScenario` re-attaches the per-industry title.
 */
export type StructuralPBI = Omit<PBI, 'title'>;

/** A customer with its display string (`name`) removed. */
export type StructuralCustomer = Omit<CustomerState, 'name'>;

/** A stakeholder with its display strings (`name`, `role`) removed. */
export type StructuralStakeholder = Omit<StakeholderState, 'name' | 'role'>;

/**
 * An event option without its display strings. `effects` is fully structural —
 * including any `add-pbi` whose PBI is a {@link StructuralPBI} (title attached
 * per industry).
 */
export interface StructuralEventOption {
  id: string;
  /** Effects, but any `add-pbi` carries a title-less structural PBI. */
  effects: StructuralEventEffect[];
}

/** An EventEffect where `add-pbi` carries a title-less structural PBI. */
export type StructuralEventEffect =
  | Exclude<EventEffect, { kind: 'add-pbi' }>
  | { kind: 'add-pbi'; pbi: StructuralPBI };

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

/** The complete industry-neutral skeleton of scenario 01. */
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

export const scenario01Structure: ScenarioStructure = {
  id: SCENARIO_01_ID,
  totalIterations: 6,
  targetRevenue: 5000,

  customers: [
    {
      id: 'maya',
      archetype: 'mainstream',
      engagementState: 'interested',
      happiness: 5,
      ltv: 850,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'darren',
      archetype: 'power-user',
      engagementState: 'active',
      happiness: 4,
      ltv: 3200,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'priya',
      archetype: 'innovator',
      engagementState: 'dormant',
      happiness: 4,
      ltv: 400,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
  ],

  stakeholders: [
    { id: 'hq', trust: 6, lastInteraction: 0 },
    { id: 'ciro', trust: 8, lastInteraction: 0 },
  ],

  team: {
    morale: 5,
    headcount: 6,
    onboarding: 0,
    sickOrVacation: 0,
    burnoutFlag: false,
  },

  tech: {
    releaseCost: 3,
    capacityBaseline: 15,
    capacityVariance: 3,
    techDebt: 35,
    reliability: 6,
    cycleTime: 1.0,
    investmentsDone: [],
    lastTechInvestmentIter: null,
  },

  economy: {
    revenue: 0,
    interestAccrued: 0,
    budgetRemaining: 500_000,
    interestRate: 0,
  },

  initialBacklog: [
    {
      id: 'tfsa',
      kind: 'customer',
      effort: 10,
      effortRevealed: 10,
      value: 1000,
      satisfies: ['maya', 'priya'],
      requires: [],
      productId: 'tfsa',
    },
    {
      id: 'rrsp',
      kind: 'customer',
      effort: 12,
      effortRevealed: 12,
      value: 700,
      satisfies: ['maya'],
      requires: [],
      productId: 'rrsp',
    },
    {
      id: 'fractional-shares',
      kind: 'customer',
      effort: 6,
      effortRevealed: 6,
      value: 600,
      satisfies: ['priya'],
      requires: [],
      productId: 'fractional-shares',
    },
    {
      id: 'level2-data',
      kind: 'customer',
      effort: 4,
      effortRevealed: 4,
      value: 500,
      satisfies: ['darren'],
      requires: [],
      productId: 'level2-data',
    },
    {
      id: 'us-options',
      kind: 'customer',
      effort: 14,
      effortRevealed: null,
      effortUncertain: true,
      value: 1200,
      satisfies: ['darren'],
      requires: [],
      productId: 'us-options',
    },
    {
      id: 'social-feed',
      kind: 'customer',
      effort: 8,
      effortRevealed: 8,
      value: 400,
      satisfies: ['priya'],
      requires: [],
      productId: 'social-feed',
    },
    {
      id: 'premarket-hours',
      kind: 'customer',
      effort: 7,
      effortRevealed: 7,
      value: 400,
      satisfies: ['darren'],
      requires: [],
      productId: 'premarket-hours',
    },
    {
      id: 'cad-priority',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 250,
      satisfies: ['maya', 'priya'],
      requires: [],
      productId: 'cad-priority',
    },
    {
      id: 'onboarding-flow',
      kind: 'customer',
      effort: 5,
      effortRevealed: 5,
      value: 500,
      satisfies: ['maya', 'priya'],
      requires: [],
      productId: 'onboarding-flow',
    },
    {
      id: 'referral',
      kind: 'customer',
      effort: 5,
      effortRevealed: 5,
      value: 600,
      satisfies: ['maya', 'darren', 'priya'],
      requires: [],
      productId: 'referral',
    },
    {
      id: 'feature-flags',
      kind: 'tech',
      effort: 4,
      effortRevealed: 4,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'feature-flags',
    },
    {
      id: 'kyc-rebuild',
      kind: 'tech',
      effort: 8,
      effortRevealed: 8,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'kyc-rebuild',
    },
    {
      id: 'automated-tests',
      kind: 'tech',
      effort: 5,
      effortRevealed: 5,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'automated-tests',
    },
  ],

  discoveryPool: [
    {
      id: 'discovery-push-notifications',
      kind: 'customer',
      effort: 2,
      effortRevealed: 2,
      value: 200,
      satisfies: ['darren'],
      requires: [],
      productId: 'discovery-push-notifications',
    },
    {
      id: 'discovery-tax-export',
      kind: 'customer',
      effort: 6,
      effortRevealed: 6,
      value: 350,
      satisfies: ['maya', 'darren'],
      requires: [],
      productId: 'discovery-tax-export',
    },
    {
      id: 'discovery-education-center',
      kind: 'customer',
      effort: 4,
      effortRevealed: 4,
      value: 300,
      satisfies: ['maya', 'priya'],
      requires: [],
      productId: 'discovery-education-center',
    },
    {
      id: 'discovery-auto-invest',
      kind: 'customer',
      effort: 7,
      effortRevealed: 7,
      value: 450,
      satisfies: ['maya', 'priya'],
      requires: [],
      productId: 'discovery-auto-invest',
    },
    {
      id: 'discovery-market-data-cost',
      kind: 'tech',
      effort: 5,
      effortRevealed: 5,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'discovery-market-data-cost',
    },
  ],

  eventDeck: [
    {
      id: 'wei-crypto-demand',
      category: 'stakeholder',
      baseWeight: 0,
      trigger: 'forced',
      forcedAtIteration: 2,
      options: [
        {
          id: 'accept',
          effects: [
            { kind: 'trust', stakeholderId: 'hq', delta: 2 },
            { kind: 'morale', delta: -3 },
            { kind: 'tech-debt', delta: 10 },
            {
              kind: 'add-pbi',
              pbi: {
                id: 'event-crypto-tab',
                kind: 'regulatory',
                effort: 14,
                effortRevealed: null,
                effortUncertain: true,
                value: 400,
                satisfies: ['priya'],
                requires: [],
                productId: 'event-crypto-tab',
              },
            },
          ],
        },
        {
          id: 'trade-off',
          effects: [{ kind: 'trust', stakeholderId: 'hq', delta: -1 }],
        },
        {
          id: 'defer',
          effects: [
            { kind: 'trust', stakeholderId: 'hq', delta: -2 },
            { kind: 'morale', delta: 2 },
          ],
        },
      ],
    },
    {
      id: 'ciro-social-warning',
      category: 'regulatory',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'scope-down',
          effects: [
            { kind: 'trust', stakeholderId: 'ciro', delta: 2 },
            { kind: 'happiness', customerId: 'priya', delta: -1 },
          ],
        },
        {
          id: 'compliance-review',
          effects: [{ kind: 'capacity-baseline', delta: -2 }],
        },
        {
          id: 'ship-anyway',
          effects: [
            { kind: 'trust', stakeholderId: 'ciro', delta: -3 },
            { kind: 'tech-debt', delta: 10 },
          ],
        },
      ],
    },
    {
      id: 'qa-quits',
      category: 'team',
      baseWeight: 2,
      trigger: 'random',
      options: [
        {
          id: 'lighten-load',
          effects: [
            { kind: 'morale', delta: 2 },
            { kind: 'capacity-baseline', delta: -1 },
          ],
        },
        {
          id: 'promote',
          effects: [{ kind: 'morale', delta: 3 }],
        },
        {
          id: 'ignore',
          effects: [{ kind: 'morale', delta: -2 }],
        },
      ],
    },
    {
      id: 'maya-churn-risk',
      category: 'customer',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'commit-tfsa',
          effects: [{ kind: 'happiness', customerId: 'maya', delta: 2 }],
        },
        {
          id: 'retention-campaign',
          effects: [{ kind: 'happiness', customerId: 'maya', delta: 1 }],
        },
        {
          id: 'nothing',
          effects: [{ kind: 'happiness', customerId: 'maya', delta: -3 }],
        },
      ],
    },
    {
      id: 'darren-reddit',
      category: 'customer',
      baseWeight: 2,
      trigger: 'random',
      options: [
        {
          id: 'engage',
          effects: [
            { kind: 'happiness', customerId: 'darren', delta: 1 },
            { kind: 'happiness', customerId: 'priya', delta: 1 },
          ],
        },
        {
          id: 'deflect',
          effects: [{ kind: 'happiness', customerId: 'darren', delta: -1 }],
        },
      ],
    },
  ],
};
