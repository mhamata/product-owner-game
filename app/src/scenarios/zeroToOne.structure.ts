import type { ScenarioStructure } from './structure';

/**
 * Zero to One: STRUCTURAL CORE (industry-neutral).
 *
 * This file owns every load-bearing value the engine consumes: ids, efforts,
 * values, `satisfies`/`requires` wiring, `productId`s, PBI/event `kind`s, all
 * event `effect`s, triggers, weights, and every team/tech/economy number, plus
 * `totalIterations` and `targetRevenue`. None of it is industry-specific. The
 * SAME structure powers all five home industries, so game balance is provably
 * identical across them. Only human-readable copy varies, and that lives in
 * `./zeroToOne.display`.
 *
 * MAGIC IDS, referenced by string in the engine, so they must never change:
 *   • `automated-tests`   (engine/techDebt.ts pays down debt; capacity.ts cuts variance)
 *   • `refactor-core`, `observability`, `dod-check`, `dev-team-training-bundle`,
 *     `framework-upgrade-bundle` are also engine-recognised. None appear here,
 *     but the contract holds: any tech id added later that matches one of these
 *     gains its engine effect. Of the recognised set, only `automated-tests`
 *     is present in this scenario.
 *
 * Design intent: a brand-new product with almost no validated backlog. The
 * lesson is discovery. The discovery pool is large and mostly effort-uncertain,
 * so the player must ship small bets, read engagement plus revealed effort, and
 * concentrate on what works before the runway runs out.
 */

/** The structural id this scenario assembles to. Load-bearing FK; do not change. */
export const ZERO_TO_ONE_ID = 'zero-to-one';

export const zeroToOneStructure: ScenarioStructure = {
  id: ZERO_TO_ONE_ID,
  totalIterations: 6,
  targetRevenue: 2500,

  customers: [
    {
      id: 'nadia',
      archetype: 'innovator',
      engagementState: 'interested',
      happiness: 4,
      ltv: 600,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'theo',
      archetype: 'innovator',
      engagementState: 'dormant',
      happiness: 4,
      ltv: 250,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
  ],

  stakeholders: [
    { id: 'founder', trust: 6, lastInteraction: 0 },
    { id: 'backer', trust: 6, lastInteraction: 0 },
  ],

  team: {
    morale: 6,
    headcount: 4,
    onboarding: 0,
    sickOrVacation: 0,
    burnoutFlag: false,
  },

  tech: {
    releaseCost: 2,
    capacityBaseline: 10,
    capacityVariance: 3,
    techDebt: 20,
    reliability: 6,
    cycleTime: 1.0,
    investmentsDone: [],
    lastTechInvestmentIter: null,
  },

  economy: {
    revenue: 0,
    interestAccrued: 0,
    budgetRemaining: 120_000,
    interestRate: 0,
  },

  initialBacklog: [
    {
      id: 'landing-signup',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 300,
      satisfies: ['nadia', 'theo'],
      requires: [],
      productId: 'landing-signup',
    },
    {
      id: 'core-loop',
      kind: 'customer',
      effort: 6,
      effortRevealed: 6,
      value: 500,
      satisfies: ['nadia'],
      requires: [],
      productId: 'core-loop',
    },
    {
      id: 'manual-onboarding',
      kind: 'customer',
      effort: 4,
      effortRevealed: 4,
      value: 350,
      satisfies: ['theo'],
      requires: [],
      productId: 'manual-onboarding',
    },
    {
      id: 'pricing-page',
      kind: 'customer',
      effort: 5,
      effortRevealed: null,
      effortUncertain: true,
      value: 450,
      satisfies: ['nadia', 'theo'],
      requires: [],
      productId: 'pricing-page',
    },
    {
      id: 'automated-tests',
      kind: 'tech',
      effort: 4,
      effortRevealed: 4,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'automated-tests',
    },
  ],

  discoveryPool: [
    {
      id: 'discovery-referral-invite',
      kind: 'customer',
      effort: 3,
      effortRevealed: null,
      effortUncertain: true,
      value: 500,
      satisfies: ['nadia', 'theo'],
      requires: [],
      productId: 'discovery-referral-invite',
    },
    {
      id: 'discovery-power-workflow',
      kind: 'customer',
      effort: 8,
      effortRevealed: null,
      effortUncertain: true,
      value: 600,
      satisfies: ['nadia'],
      requires: [],
      productId: 'discovery-power-workflow',
    },
    {
      id: 'discovery-mobile-quickstart',
      kind: 'customer',
      effort: 6,
      effortRevealed: null,
      effortUncertain: true,
      value: 250,
      satisfies: ['theo'],
      requires: [],
      productId: 'discovery-mobile-quickstart',
    },
    {
      id: 'discovery-templates',
      kind: 'customer',
      effort: 4,
      effortRevealed: null,
      effortUncertain: true,
      value: 400,
      satisfies: ['nadia', 'theo'],
      requires: [],
      productId: 'discovery-templates',
    },
    {
      id: 'discovery-integrations',
      kind: 'customer',
      effort: 9,
      effortRevealed: null,
      effortUncertain: true,
      value: 300,
      satisfies: ['nadia'],
      requires: [],
      productId: 'discovery-integrations',
    },
    {
      id: 'discovery-activation-nudge',
      kind: 'customer',
      effort: 2,
      effortRevealed: null,
      effortUncertain: true,
      value: 350,
      satisfies: ['theo'],
      requires: [],
      productId: 'discovery-activation-nudge',
    },
    {
      id: 'discovery-dashboard',
      kind: 'customer',
      effort: 7,
      effortRevealed: null,
      effortUncertain: true,
      value: 200,
      satisfies: ['nadia', 'theo'],
      requires: [],
      productId: 'discovery-dashboard',
    },
    {
      id: 'discovery-export',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 200,
      satisfies: ['nadia'],
      requires: [],
      productId: 'discovery-export',
    },
    {
      id: 'discovery-instrumentation',
      kind: 'tech',
      effort: 4,
      effortRevealed: 4,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'discovery-instrumentation',
    },
  ],

  eventDeck: [
    {
      id: 'segment-signal',
      category: 'strategic',
      baseWeight: 0,
      trigger: 'forced',
      forcedAtIteration: 3,
      options: [
        {
          id: 'chase-segment',
          effects: [
            { kind: 'trust', stakeholderId: 'founder', delta: 1 },
            { kind: 'morale', delta: -1 },
            {
              kind: 'add-pbi',
              pbi: {
                id: 'event-segment-bet',
                kind: 'customer',
                effort: 6,
                effortRevealed: null,
                effortUncertain: true,
                value: 700,
                satisfies: ['theo'],
                requires: [],
                productId: 'event-segment-bet',
              },
            },
          ],
        },
        {
          id: 'interview-first',
          effects: [{ kind: 'add-pattern', tag: 'discovery-interview' }],
        },
        {
          id: 'stay-focused',
          effects: [
            { kind: 'trust', stakeholderId: 'founder', delta: -1 },
            { kind: 'morale', delta: 1 },
          ],
        },
      ],
    },
    {
      id: 'competitor-launch',
      category: 'market',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'differentiate',
          effects: [
            { kind: 'morale', delta: 1 },
            { kind: 'add-pattern', tag: 'positioning' },
          ],
        },
        {
          id: 'price-match',
          effects: [{ kind: 'revenue', delta: -200 }],
        },
        {
          id: 'ignore-noise',
          effects: [{ kind: 'happiness', customerId: 'nadia', delta: -1 }],
        },
      ],
    },
    {
      id: 'nadia-loves-it',
      category: 'customer',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'amplify',
          effects: [
            { kind: 'happiness', customerId: 'nadia', delta: 2 },
            { kind: 'happiness', customerId: 'theo', delta: 1 },
          ],
        },
        {
          id: 'gather-quotes',
          effects: [{ kind: 'happiness', customerId: 'nadia', delta: 1 }],
        },
        {
          id: 'move-on',
          effects: [{ kind: 'happiness', customerId: 'nadia', delta: -1 }],
        },
      ],
    },
    {
      id: 'runway-check',
      category: 'stakeholder',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          id: 'trim-burn',
          effects: [
            { kind: 'trust', stakeholderId: 'backer', delta: 2 },
            { kind: 'capacity-baseline', delta: -1 },
          ],
        },
        {
          id: 'show-traction',
          effects: [{ kind: 'trust', stakeholderId: 'backer', delta: 1 }],
        },
        {
          id: 'spend-anyway',
          effects: [
            { kind: 'trust', stakeholderId: 'backer', delta: -2 },
            { kind: 'morale', delta: 1 },
          ],
        },
      ],
    },
    {
      id: 'odd-usage',
      category: 'customer',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          id: 'dig-in',
          effects: [
            { kind: 'add-pattern', tag: 'unexpected-use-case' },
            { kind: 'happiness', customerId: 'theo', delta: 1 },
          ],
        },
        {
          id: 'note-it',
          effects: [{ kind: 'add-pattern', tag: 'usage-anomaly' }],
        },
        {
          id: 'dismiss',
          effects: [{ kind: 'happiness', customerId: 'theo', delta: -1 }],
        },
      ],
    },
    {
      id: 'founder-pep',
      category: 'team',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          id: 'rally',
          effects: [{ kind: 'morale', delta: 2 }],
        },
        {
          id: 'quiet-thanks',
          effects: [{ kind: 'morale', delta: 1 }],
        },
        {
          id: 'skip-it',
          effects: [{ kind: 'morale', delta: -1 }],
        },
      ],
    },
  ],
};
