import type { ScenarioStructure } from './structure';

/**
 * Scenario: THE TURNAROUND, STRUCTURAL CORE (industry-neutral).
 *
 * Associate rung. The player inherits a neglected product: tech debt is high,
 * reliability is low, morale is in the floor, capacity is small and swings
 * wildly, and two of the four customers are one bad sprint from leaving. The
 * lesson is triage. You cannot out-ship the rot, and you cannot polish the
 * engine while the customers walk. You have to pay down enough foundation to
 * buy capacity back, keep the two at-risk accounts alive, and rebuild the trust
 * of a stakeholder who got burned by the last PM, all inside six iterations.
 *
 * This file owns every load-bearing value the engine consumes: ids, efforts,
 * values, satisfies/requires wiring, productIds, PBI/event kinds, all event
 * effects, triggers, weights, and every team/tech/economy number, plus
 * totalIterations and targetRevenue. None of it is industry-specific. The SAME
 * structure powers all five home industries, so game balance is provably
 * identical across them. Only human-readable copy varies, and that lives in
 * `./turnaround.display`.
 *
 * MAGIC IDS, referenced by string in the engine, so they must never change:
 *   - `refactor-core`    (engine/techDebt.ts pays down 30 debt)
 *   - `automated-tests`  (engine/techDebt.ts pays 10 debt; capacity.ts cuts variance 1)
 *   - `observability`    (engine/techDebt.ts pays 5 debt; capacity.ts cuts variance 1)
 *   - `dod-check`        (engine/techDebt.ts: a Definition-of-Done gate in `requires`,
 *                         shipping customer work without it adds 5 debt)
 * All four appear here, because foundation work is the whole point of this rung.
 *
 * The scenario `id` is `turnaround`: it is the route id and scenario-registry
 * key referenced by ./ladder (SIM_LADDER) and ./index, so it must not change.
 */

/** The structural id this scenario assembles to. Load-bearing FK; do not change. */
export const TURNAROUND_ID = 'turnaround';

export const turnaroundStructure: ScenarioStructure = {
  id: TURNAROUND_ID,
  totalIterations: 6,
  targetRevenue: 3800,

  customers: [
    // Two accounts at the door: disengaged, unhappy, fading from neglect.
    {
      id: 'maya',
      archetype: 'mainstream',
      engagementState: 'disengaged',
      happiness: 2,
      ltv: 1400,
      lastFullRelease: null,
      consecutivePartial: 2,
      consecutiveNothing: 0,
    },
    {
      id: 'darren',
      archetype: 'power-user',
      engagementState: 'disengaged',
      happiness: 3,
      ltv: 1800,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 1,
    },
    // The steady one. Still here, still patient, do not take it for granted.
    {
      id: 'priya',
      archetype: 'enterprise',
      engagementState: 'active',
      happiness: 5,
      ltv: 2600,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'noah',
      archetype: 'mainstream',
      engagementState: 'interested',
      happiness: 4,
      ltv: 900,
      lastFullRelease: null,
      consecutivePartial: 1,
      consecutiveNothing: 0,
    },
  ],

  stakeholders: [
    // Burned by the previous PM. Wants a quick, visible win before trusting you.
    { id: 'hq', trust: 3, lastInteraction: 0 },
    // Neutral. Will reward steady delivery, will sour if you ship junk.
    { id: 'ciro', trust: 6, lastInteraction: 0 },
  ],

  team: {
    morale: 3,
    headcount: 5,
    onboarding: 0,
    sickOrVacation: 0,
    burnoutFlag: false,
  },

  tech: {
    releaseCost: 3,
    capacityBaseline: 12,
    capacityVariance: 4,
    techDebt: 70,
    reliability: 3,
    cycleTime: 1.2,
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
    // ---- Foundation paydown. The lever that buys capacity back. ----
    {
      id: 'refactor-core',
      kind: 'tech',
      effort: 12,
      effortRevealed: 12,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'refactor-core',
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
    {
      id: 'observability',
      kind: 'tech',
      effort: 5,
      effortRevealed: 5,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'observability',
    },
    // A quality gate. Bundle it into a customer release to dodge the +5 debt
    // hit shipping features otherwise carries. Gated via `requires: dod-check`.
    {
      id: 'dod-check',
      kind: 'tech',
      effort: 3,
      effortRevealed: 3,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'dod-check',
    },
    // ---- Customer features. Real ids in `satisfies`, no industry words. ----
    {
      id: 'stability-fixes',
      kind: 'customer',
      effort: 4,
      effortRevealed: 4,
      value: 450,
      satisfies: ['maya', 'darren'],
      requires: [],
      productId: 'stability-fixes',
    },
    {
      id: 'quick-win',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 300,
      satisfies: ['maya'],
      requires: [],
      productId: 'quick-win',
    },
    {
      id: 'power-tools',
      kind: 'customer',
      effort: 8,
      effortRevealed: 8,
      value: 700,
      satisfies: ['darren'],
      requires: [],
      productId: 'power-tools',
    },
    {
      id: 'enterprise-controls',
      kind: 'customer',
      effort: 14,
      effortRevealed: null,
      effortUncertain: true,
      value: 1200,
      satisfies: ['priya'],
      requires: ['dod-check'],
      productId: 'enterprise-controls',
    },
    {
      id: 'reporting',
      kind: 'customer',
      effort: 7,
      effortRevealed: 7,
      value: 600,
      satisfies: ['priya', 'darren'],
      requires: [],
      productId: 'reporting',
    },
    {
      id: 'onboarding-flow',
      kind: 'customer',
      effort: 5,
      effortRevealed: 5,
      value: 500,
      satisfies: ['noah', 'maya'],
      requires: [],
      productId: 'onboarding-flow',
    },
    {
      id: 'integration',
      kind: 'customer',
      effort: 9,
      effortRevealed: null,
      effortUncertain: true,
      value: 650,
      satisfies: ['priya', 'noah'],
      requires: [],
      productId: 'integration',
    },
    {
      id: 'polish-pass',
      kind: 'customer',
      effort: 4,
      effortRevealed: 4,
      value: 350,
      satisfies: ['noah'],
      requires: [],
      productId: 'polish-pass',
    },
  ],

  discoveryPool: [
    {
      id: 'discovery-bulk-actions',
      kind: 'customer',
      effort: 5,
      effortRevealed: 5,
      value: 400,
      satisfies: ['darren'],
      requires: [],
      productId: 'discovery-bulk-actions',
    },
    {
      id: 'discovery-saved-views',
      kind: 'customer',
      effort: 4,
      effortRevealed: 4,
      value: 350,
      satisfies: ['priya', 'maya'],
      requires: [],
      productId: 'discovery-saved-views',
    },
    {
      id: 'discovery-mobile-access',
      kind: 'customer',
      effort: 7,
      effortRevealed: 7,
      value: 500,
      satisfies: ['noah', 'maya'],
      requires: [],
      productId: 'discovery-mobile-access',
    },
    {
      id: 'discovery-audit-log',
      kind: 'customer',
      effort: 6,
      effortRevealed: 6,
      value: 450,
      satisfies: ['priya'],
      requires: [],
      productId: 'discovery-audit-log',
    },
    {
      id: 'discovery-perf-budget',
      kind: 'tech',
      effort: 4,
      effortRevealed: 4,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'discovery-perf-budget',
    },
  ],

  eventDeck: [
    // FORCED at iteration 2: the burned stakeholder wants proof, now. The trap
    // is spending your thin capacity on a shiny demo instead of the foundation.
    {
      id: 'hq-demands-win',
      category: 'stakeholder',
      baseWeight: 0,
      trigger: 'forced',
      forcedAtIteration: 2,
      options: [
        {
          id: 'ship-the-demo',
          effects: [
            { kind: 'trust', stakeholderId: 'hq', delta: 3 },
            { kind: 'tech-debt', delta: 10 },
            { kind: 'morale', delta: -2 },
            {
              kind: 'add-pbi',
              pbi: {
                id: 'event-flashy-demo',
                kind: 'customer',
                effort: 8,
                effortRevealed: null,
                effortUncertain: true,
                value: 300,
                satisfies: ['maya'],
                requires: [],
                productId: 'event-flashy-demo',
              },
            },
          ],
        },
        {
          id: 'show-the-plan',
          effects: [
            { kind: 'trust', stakeholderId: 'hq', delta: 1 },
            { kind: 'add-pattern', tag: 'expectation-setting' },
          ],
        },
        {
          id: 'push-back',
          effects: [
            { kind: 'trust', stakeholderId: 'hq', delta: -2 },
            { kind: 'morale', delta: 1 },
          ],
        },
      ],
    },
    // An engineer is ready to walk over the debt. Weighted: fires at most once.
    {
      id: 'engineer-threatens-quit',
      category: 'team',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'commit-to-paydown',
          effects: [
            { kind: 'morale', delta: 3 },
            { kind: 'add-pattern', tag: 'tech-debt-triage' },
          ],
        },
        {
          id: 'small-raise',
          effects: [
            { kind: 'morale', delta: 1 },
          ],
        },
        {
          id: 'let-them-stew',
          effects: [
            { kind: 'morale', delta: -2 },
            { kind: 'headcount', delta: -1 },
          ],
        },
      ],
    },
    // A churning account escalates. Weighted.
    {
      id: 'maya-escalates',
      category: 'customer',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'call-and-commit',
          effects: [
            { kind: 'happiness', customerId: 'maya', delta: 2 },
          ],
        },
        {
          id: 'send-credit',
          effects: [
            { kind: 'happiness', customerId: 'maya', delta: 1 },
            { kind: 'revenue', delta: -150 },
          ],
        },
        {
          id: 'no-response',
          effects: [
            { kind: 'happiness', customerId: 'maya', delta: -3 },
          ],
        },
      ],
    },
    // An outage, the price of low reliability and high debt. Weighted.
    {
      id: 'reliability-outage',
      category: 'tech',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          id: 'all-hands-fix',
          effects: [
            { kind: 'tech-debt', delta: -5 },
            { kind: 'capacity-baseline', delta: -2 },
            { kind: 'happiness', customerId: 'darren', delta: -1 },
          ],
        },
        {
          id: 'hotfix-and-move-on',
          effects: [
            { kind: 'happiness', customerId: 'darren', delta: -2 },
            { kind: 'happiness', customerId: 'priya', delta: -1 },
            { kind: 'tech-debt', delta: 5 },
          ],
        },
        {
          id: 'blame-the-vendor',
          effects: [
            { kind: 'trust', stakeholderId: 'ciro', delta: -2 },
            { kind: 'happiness', customerId: 'priya', delta: -2 },
          ],
        },
      ],
    },
    // A trust moment with the neutral stakeholder. Weighted.
    {
      id: 'leadership-trust-check',
      category: 'stakeholder',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          id: 'honest-status',
          effects: [
            { kind: 'trust', stakeholderId: 'ciro', delta: 2 },
          ],
        },
        {
          id: 'spin-it',
          effects: [
            { kind: 'trust', stakeholderId: 'ciro', delta: -1 },
            { kind: 'trust', stakeholderId: 'hq', delta: 1 },
          ],
        },
      ],
    },
    // The other fading account goes public with the frustration. Weighted.
    {
      id: 'darren-goes-public',
      category: 'customer',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          id: 'own-it-publicly',
          effects: [
            { kind: 'happiness', customerId: 'darren', delta: 1 },
            { kind: 'happiness', customerId: 'noah', delta: 1 },
          ],
        },
        {
          id: 'reach-out-quietly',
          effects: [
            { kind: 'happiness', customerId: 'darren', delta: 2 },
            { kind: 'morale', delta: -1 },
          ],
        },
        {
          id: 'ignore-the-post',
          effects: [
            { kind: 'happiness', customerId: 'darren', delta: -2 },
            { kind: 'happiness', customerId: 'noah', delta: -1 },
          ],
        },
      ],
    },
  ],
};
