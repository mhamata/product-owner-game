import type { ScenarioStructure } from './structure';

/**
 * Scaling Crunch (Senior): STRUCTURAL CORE (industry-neutral).
 *
 * This file owns every load-bearing value the engine consumes: ids, efforts,
 * values, `satisfies` wiring, `productId`s, PBI/event `kind`s, all event
 * `effect`s, triggers, weights, and every team/tech/economy number, plus
 * `totalIterations` and `targetRevenue`. None of it is industry-specific. The
 * SAME structure powers all five home industries, so game balance is provably
 * identical across them. Only human-readable copy varies, and that lives in
 * `./scalingCrunch.display`.
 *
 * The lesson: the product has traction and demand now outruns the team. You
 * cannot do everything in six sprints, so you sequence the few highest-value
 * items and time the platform investment. Reliability starts low and tech debt
 * climbs under load, so a feature-only line invites the outage and churn; an
 * infra-only line misses the high revenue target.
 *
 * MAGIC IDS, referenced by string in the engine, so they must never change:
 *   - `refactor-core`     (engine/techDebt.ts pays down 30 debt on release)
 *   - `automated-tests`   (engine/techDebt.ts pays 10 debt; capacity.ts cuts variance by 1)
 *   - `observability`     (engine/techDebt.ts pays 5 debt; capacity.ts cuts variance by 1)
 * All three appear in this backlog as the platform investment fork. Their value
 * is 0 (no direct revenue), but they buy down debt and tighten the capacity
 * roll, which is how the platform line pays off.
 *
 * The scenario `id` stays `scaling-crunch`: it is the ladder rung key in
 * `./ladder` (Senior altitude) and the route/registry key in `./index`.
 */

/** The structural id this scenario assembles to. Load-bearing FK; do not change. */
export const SCALING_CRUNCH_ID = 'scaling-crunch';

export const scalingCrunchStructure: ScenarioStructure = {
  id: SCALING_CRUNCH_ID,
  totalIterations: 6,
  targetRevenue: 7000,

  customers: [
    {
      id: 'nadia',
      archetype: 'enterprise',
      engagementState: 'active',
      happiness: 6,
      ltv: 4200,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'theo',
      archetype: 'power-user',
      engagementState: 'advocate',
      happiness: 6,
      ltv: 1800,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'omar',
      archetype: 'mainstream',
      engagementState: 'active',
      happiness: 5,
      ltv: 900,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'bea',
      archetype: 'power-user',
      engagementState: 'advocate',
      happiness: 7,
      ltv: 1200,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'pilar',
      archetype: 'enterprise',
      engagementState: 'active',
      happiness: 5,
      ltv: 3800,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'sage',
      archetype: 'mainstream',
      engagementState: 'active',
      happiness: 5,
      ltv: 800,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
  ],

  stakeholders: [
    { id: 'vance', trust: 7, lastInteraction: 0 },
    { id: 'rhea', trust: 6, lastInteraction: 0 },
  ],

  team: {
    morale: 5,
    headcount: 7,
    onboarding: 0,
    sickOrVacation: 0,
    burnoutFlag: false,
  },

  tech: {
    releaseCost: 4,
    capacityBaseline: 16,
    capacityVariance: 3,
    techDebt: 55,
    reliability: 5,
    cycleTime: 1.1,
    investmentsDone: [],
    lastTechInvestmentIter: null,
  },

  economy: {
    revenue: 0,
    interestAccrued: 0,
    budgetRemaining: 500_000,
    interestRate: 0,
  },

  // LARGE backlog. Total effort far exceeds six sprints of capacity (about 96),
  // so you cannot ship it all. Many items are both high value and high effort,
  // which is the squeeze: the few biggest bets are also the slowest to land.
  initialBacklog: [
    {
      id: 'enterprise-sso',
      kind: 'customer',
      effort: 12,
      effortRevealed: null,
      effortUncertain: true,
      value: 1400,
      satisfies: ['nadia', 'pilar'],
      requires: [],
      productId: 'enterprise-sso',
    },
    {
      id: 'bulk-api',
      kind: 'customer',
      effort: 14,
      effortRevealed: 14,
      value: 1300,
      satisfies: ['theo', 'nadia'],
      requires: [],
      productId: 'bulk-api',
    },
    {
      id: 'audit-logs',
      kind: 'customer',
      effort: 10,
      effortRevealed: 10,
      value: 1100,
      satisfies: ['pilar', 'nadia'],
      requires: [],
      productId: 'audit-logs',
    },
    {
      id: 'advanced-permissions',
      kind: 'customer',
      effort: 11,
      effortRevealed: 11,
      value: 1000,
      satisfies: ['nadia', 'pilar'],
      requires: [],
      productId: 'advanced-permissions',
    },
    {
      id: 'data-residency',
      kind: 'customer',
      effort: 13,
      effortRevealed: null,
      effortUncertain: true,
      value: 1200,
      satisfies: ['pilar'],
      requires: [],
      productId: 'data-residency',
    },
    {
      id: 'realtime-sync',
      kind: 'customer',
      effort: 12,
      effortRevealed: 12,
      value: 900,
      satisfies: ['theo', 'omar'],
      requires: [],
      productId: 'realtime-sync',
    },
    {
      id: 'mobile-revamp',
      kind: 'customer',
      effort: 10,
      effortRevealed: 10,
      value: 800,
      satisfies: ['omar', 'sage'],
      requires: [],
      productId: 'mobile-revamp',
    },
    {
      id: 'self-serve-billing',
      kind: 'customer',
      effort: 8,
      effortRevealed: 8,
      value: 700,
      satisfies: ['sage', 'omar'],
      requires: [],
      productId: 'self-serve-billing',
    },
    {
      id: 'usage-analytics',
      kind: 'customer',
      effort: 9,
      effortRevealed: 9,
      value: 750,
      satisfies: ['theo', 'bea'],
      requires: [],
      productId: 'usage-analytics',
    },
    {
      id: 'white-label',
      kind: 'customer',
      effort: 11,
      effortRevealed: null,
      effortUncertain: true,
      value: 950,
      satisfies: ['nadia'],
      requires: [],
      productId: 'white-label',
    },
    {
      id: 'referral-engine',
      kind: 'customer',
      effort: 6,
      effortRevealed: 6,
      value: 650,
      satisfies: ['bea', 'sage'],
      requires: [],
      productId: 'referral-engine',
    },
    {
      id: 'sla-dashboard',
      kind: 'customer',
      effort: 7,
      effortRevealed: 7,
      value: 600,
      satisfies: ['pilar', 'bea'],
      requires: [],
      productId: 'sla-dashboard',
    },
    // Platform investment fork. Value 0 (no direct revenue), but engine-recognized
    // ids buy down tech debt and tighten the capacity roll. Time these well and
    // the back half of the game gets faster and steadier; skip them and debt
    // climbs into the outage.
    {
      id: 'refactor-core',
      kind: 'tech',
      effort: 14,
      effortRevealed: 14,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'refactor-core',
    },
    {
      id: 'observability',
      kind: 'tech',
      effort: 8,
      effortRevealed: 8,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'observability',
    },
    {
      id: 'automated-tests',
      kind: 'tech',
      effort: 6,
      effortRevealed: 6,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'automated-tests',
    },
  ],

  // More demand arrives over time. Mid effort, so each new item still competes
  // for the same scarce capacity rather than being a free win.
  discoveryPool: [
    {
      id: 'discovery-webhooks',
      kind: 'customer',
      effort: 5,
      effortRevealed: 5,
      value: 400,
      satisfies: ['theo'],
      requires: [],
      productId: 'discovery-webhooks',
    },
    {
      id: 'discovery-saml-scim',
      kind: 'customer',
      effort: 7,
      effortRevealed: 7,
      value: 500,
      satisfies: ['nadia', 'pilar'],
      requires: [],
      productId: 'discovery-saml-scim',
    },
    {
      id: 'discovery-region-eu',
      kind: 'customer',
      effort: 6,
      effortRevealed: 6,
      value: 450,
      satisfies: ['pilar'],
      requires: [],
      productId: 'discovery-region-eu',
    },
    {
      id: 'discovery-team-dashboards',
      kind: 'customer',
      effort: 5,
      effortRevealed: 5,
      value: 400,
      satisfies: ['omar', 'bea'],
      requires: [],
      productId: 'discovery-team-dashboards',
    },
    {
      id: 'discovery-rate-limits',
      kind: 'tech',
      effort: 5,
      effortRevealed: 5,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'discovery-rate-limits',
    },
  ],

  // Seven cards. ONE forced outage around the midpoint (iteration 3), driven by
  // the low reliability and high debt you started with. The other six are
  // weighted; the engine fires at most one per sprint with no repeats, so across
  // six sprints you see roughly six of them. They keep the squeeze live: more
  // load, vendor pain, an exec who wants revenue now, a hire with ramp cost, an
  // enterprise threatening to leave, and debt that bites.
  eventDeck: [
    {
      id: 'platform-outage',
      category: 'tech',
      baseWeight: 0,
      trigger: 'forced',
      forcedAtIteration: 3,
      options: [
        {
          id: 'war-room',
          effects: [
            { kind: 'morale', delta: -2 },
            { kind: 'happiness', customerId: 'nadia', delta: -2 },
            { kind: 'happiness', customerId: 'pilar', delta: -2 },
            { kind: 'happiness', customerId: 'theo', delta: -1 },
            { kind: 'trust', stakeholderId: 'rhea', delta: 1 },
            { kind: 'tech-debt', delta: 5 },
          ],
        },
        {
          id: 'hotfix-move-on',
          effects: [
            { kind: 'morale', delta: -3 },
            { kind: 'happiness', customerId: 'nadia', delta: -3 },
            { kind: 'happiness', customerId: 'pilar', delta: -3 },
            { kind: 'happiness', customerId: 'omar', delta: -2 },
            { kind: 'tech-debt', delta: 15 },
          ],
        },
        {
          id: 'downplay',
          effects: [
            { kind: 'happiness', customerId: 'nadia', delta: -4 },
            { kind: 'happiness', customerId: 'pilar', delta: -4 },
            { kind: 'happiness', customerId: 'theo', delta: -3 },
            { kind: 'trust', stakeholderId: 'rhea', delta: -3 },
          ],
        },
      ],
    },
    {
      id: 'viral-spike',
      category: 'market',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'ride-it',
          effects: [
            { kind: 'happiness', customerId: 'sage', delta: 2 },
            { kind: 'happiness', customerId: 'omar', delta: 1 },
            { kind: 'tech-debt', delta: 8 },
            {
              kind: 'add-pbi',
              pbi: {
                id: 'event-scaling-fix',
                kind: 'tech',
                effort: 9,
                effortRevealed: 9,
                value: 0,
                satisfies: [],
                requires: [],
                productId: 'event-scaling-fix',
              },
            },
          ],
        },
        {
          id: 'throttle-signups',
          effects: [
            { kind: 'happiness', customerId: 'sage', delta: -1 },
            { kind: 'morale', delta: 1 },
          ],
        },
      ],
    },
    {
      id: 'vendor-meltdown',
      category: 'vendor',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'absorb-it',
          effects: [
            { kind: 'tech-debt', delta: 10 },
            { kind: 'morale', delta: -1 },
          ],
        },
        {
          id: 'swap-vendor',
          effects: [
            { kind: 'capacity-baseline', delta: -2 },
            { kind: 'trust', stakeholderId: 'rhea', delta: 1 },
          ],
        },
        {
          id: 'wait-and-see',
          effects: [{ kind: 'happiness', customerId: 'theo', delta: -2 }],
        },
      ],
    },
    {
      id: 'exec-feature-now',
      category: 'stakeholder',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'drop-everything',
          effects: [
            { kind: 'trust', stakeholderId: 'vance', delta: 2 },
            { kind: 'morale', delta: -2 },
            { kind: 'tech-debt', delta: 8 },
            {
              kind: 'add-pbi',
              pbi: {
                id: 'event-priority-connector',
                kind: 'customer',
                effort: 9,
                effortRevealed: null,
                effortUncertain: true,
                value: 700,
                satisfies: ['nadia'],
                requires: [],
                productId: 'event-priority-connector',
              },
            },
          ],
        },
        {
          id: 'next-sprint',
          effects: [{ kind: 'trust', stakeholderId: 'vance', delta: -1 }],
        },
        {
          id: 'push-back',
          effects: [
            { kind: 'trust', stakeholderId: 'vance', delta: -2 },
            { kind: 'morale', delta: 1 },
          ],
        },
      ],
    },
    {
      id: 'key-hire',
      category: 'team',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          id: 'make-the-hire',
          effects: [
            { kind: 'headcount', delta: 1 },
            { kind: 'capacity-baseline', delta: -1 },
          ],
        },
        {
          id: 'hold-the-budget',
          effects: [{ kind: 'morale', delta: -1 }],
        },
      ],
    },
    {
      id: 'reliability-ultimatum',
      category: 'customer',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          id: 'commit-to-fix',
          effects: [
            { kind: 'happiness', customerId: 'pilar', delta: 2 },
            { kind: 'trust', stakeholderId: 'rhea', delta: 1 },
          ],
        },
        {
          id: 'offer-credits',
          effects: [
            { kind: 'happiness', customerId: 'pilar', delta: 1 },
            { kind: 'revenue', delta: -300 },
          ],
        },
        {
          id: 'hold-the-line',
          effects: [{ kind: 'happiness', customerId: 'pilar', delta: -3 }],
        },
      ],
    },
    {
      id: 'tech-debt-bites',
      category: 'tech',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          id: 'pay-it-down',
          effects: [
            { kind: 'tech-debt', delta: -10 },
            { kind: 'capacity-baseline', delta: -1 },
          ],
        },
        {
          id: 'work-around-it',
          effects: [
            { kind: 'capacity-baseline', delta: -2 },
            { kind: 'morale', delta: -1 },
          ],
        },
      ],
    },
  ],
};
