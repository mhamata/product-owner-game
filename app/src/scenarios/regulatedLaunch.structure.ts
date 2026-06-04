import type { ScenarioStructure } from './structure';

/**
 * The Regulated Launch: STRUCTURAL CORE (industry-neutral). Staff rung, hardest.
 *
 * This file owns every load-bearing value the engine consumes: ids, efforts,
 * values, `satisfies`/`requires` wiring, `productId`s, PBI/event `kind`s, all
 * event `effect`s, triggers, weights, and every team/tech/economy number, plus
 * `totalIterations` and `targetRevenue`. None of it is industry-specific. The
 * SAME structure powers all five home industries, so game balance is provably
 * identical across them. Only human-readable copy varies, and that lives in
 * `./regulatedLaunch.display`.
 *
 * MAGIC IDS, referenced by string in the engine, so they must never change:
 *   • `automated-tests`   (engine/techDebt.ts pays down debt; capacity.ts cuts variance)
 *   • `dod-check`         (engine/techDebt.ts: a Definition-of-Done gate in `requires`,
 *                          bundle it into a customer release to dodge the +5 debt hit)
 *   • `refactor-core`, `observability`, `dev-team-training-bundle`,
 *     `framework-upgrade-bundle` are also engine-recognised. Of that set, only
 *     `automated-tests` and `dod-check` appear here.
 *
 * Design intent (the squeeze that makes this the Staff rung):
 *   A launch under a watchful regulator with a hard external date. Three
 *   regulatory items carry HIGH effort and ZERO direct customer value, yet they
 *   are what keeps the regulator's trust intact and what carries you through the
 *   forced review. They compete for the SAME capacity as the customer features
 *   that earn the revenue target. The forced `compliance-review` at iteration 5
 *   is the hard deadline: face it prepared and trust climbs, face it having cut
 *   corners and trust craters while debt spikes. A forced `regulator-warning` at
 *   iteration 2 is the early shot across the bow. `requires` is NOT a hard gate,
 *   so regulatory work cannot literally block a feature: the pressure is pure
 *   opportunity cost on capacity plus the regulator's trust plus the audit.
 *
 *   No single line dominates. Skip the regulatory work to chase revenue and the
 *   regulator's trust collapses and the review punishes you. Pour everything into
 *   compliance and you miss the revenue target and starve customer happiness.
 *   Balanced sequencing, with the compliance items landed before iteration 5,
 *   is what wins.
 *
 * The scenario `id` stays `regulated-launch`: it is the route id and the ladder
 * registry key (see ./ladder, Staff rung), so it must not change.
 */

/** The structural id this scenario assembles to. Load-bearing FK; do not change. */
export const REGULATED_LAUNCH_ID = 'regulated-launch';

export const regulatedLaunchStructure: ScenarioStructure = {
  id: REGULATED_LAUNCH_ID,
  totalIterations: 7,
  targetRevenue: 6000,

  customers: [
    {
      id: 'maya',
      archetype: 'mainstream',
      engagementState: 'active',
      happiness: 5,
      ltv: 1400,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'darren',
      archetype: 'power-user',
      engagementState: 'active',
      happiness: 4,
      ltv: 2600,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'priya',
      archetype: 'enterprise',
      engagementState: 'interested',
      happiness: 4,
      ltv: 3800,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
    {
      id: 'theo',
      archetype: 'innovator',
      engagementState: 'dormant',
      happiness: 4,
      ltv: 700,
      lastFullRelease: null,
      consecutivePartial: 0,
      consecutiveNothing: 0,
    },
  ],

  stakeholders: [
    // The relationship you must protect. Starts guarded; the whole scenario is
    // a referendum on whether you keep it.
    { id: 'regulator', trust: 6, lastInteraction: 0 },
    // Pushes the launch date. Wants revenue now.
    { id: 'exec', trust: 6, lastInteraction: 0 },
    // Engineering reality check.
    { id: 'tech-lead', trust: 7, lastInteraction: 0 },
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
    capacityVariance: 4,
    techDebt: 40,
    reliability: 5,
    cycleTime: 1.0,
    investmentsDone: [],
    lastTechInvestmentIter: null,
  },

  economy: {
    revenue: 0,
    interestAccrued: 0,
    budgetRemaining: 600_000,
    interestRate: 0,
  },

  initialBacklog: [
    // ---- Regulatory items. HIGH effort, ZERO direct customer value. They buy
    // the regulator's trust and carry you through the forced review. They do
    // not satisfy any customer, so every point spent here is a point not earning
    // revenue. `requires` is not a hard gate, so they cannot block a feature;
    // the cost is capacity plus trust. ----
    {
      id: 'audit-trail',
      kind: 'regulatory',
      effort: 9,
      effortRevealed: 9,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'audit-trail',
    },
    {
      id: 'access-controls',
      kind: 'regulatory',
      effort: 8,
      effortRevealed: 8,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'access-controls',
    },
    {
      id: 'incident-process',
      kind: 'regulatory',
      effort: 7,
      effortRevealed: null,
      effortUncertain: true,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'incident-process',
    },

    // ---- Quality plumbing. `dod-check` is the gated quality item: bundle it
    // into a customer release (via that release's `requires`) to dodge the +5
    // debt hit. `automated-tests` pays debt down and steadies capacity. ----
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

    // ---- Customer features. These earn the revenue. Their value sums well past
    // the 6000 target, so the target is reachable only if you do NOT sink all
    // capacity into the regulatory pile. ----
    {
      id: 'core-launch',
      kind: 'customer',
      effort: 10,
      effortRevealed: 10,
      value: 1100,
      satisfies: ['maya', 'priya'],
      requires: [],
      productId: 'core-launch',
    },
    {
      id: 'enterprise-tier',
      kind: 'customer',
      effort: 14,
      effortRevealed: null,
      effortUncertain: true,
      value: 1400,
      // Gated on the DoD check: the marquee enterprise sale ships clean or not
      // at all. `requires` is advisory in the engine, but bundling dod-check
      // here is how the player avoids the debt penalty on this big release.
      satisfies: ['priya'],
      requires: ['dod-check'],
      productId: 'enterprise-tier',
    },
    {
      id: 'power-workflow',
      kind: 'customer',
      effort: 8,
      effortRevealed: 8,
      value: 900,
      satisfies: ['darren'],
      requires: [],
      productId: 'power-workflow',
    },
    {
      id: 'self-serve-signup',
      kind: 'customer',
      effort: 6,
      effortRevealed: 6,
      value: 700,
      satisfies: ['maya', 'theo'],
      requires: [],
      productId: 'self-serve-signup',
    },
    {
      id: 'reporting-suite',
      kind: 'customer',
      effort: 7,
      effortRevealed: 7,
      value: 750,
      satisfies: ['priya', 'darren'],
      requires: [],
      productId: 'reporting-suite',
    },
    {
      id: 'quick-win',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 350,
      satisfies: ['maya'],
      requires: [],
      productId: 'quick-win',
    },
    {
      id: 'integrations',
      kind: 'customer',
      effort: 9,
      effortRevealed: null,
      effortUncertain: true,
      value: 800,
      satisfies: ['darren', 'theo'],
      requires: [],
      productId: 'integrations',
    },
    {
      id: 'onboarding-flow',
      kind: 'customer',
      effort: 5,
      effortRevealed: 5,
      value: 550,
      satisfies: ['maya', 'theo'],
      requires: [],
      productId: 'onboarding-flow',
    },
  ],

  discoveryPool: [
    {
      id: 'discovery-consent-flow',
      kind: 'regulatory',
      effort: 5,
      effortRevealed: 5,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'discovery-consent-flow',
    },
    {
      id: 'discovery-priya-controls',
      kind: 'customer',
      effort: 6,
      effortRevealed: 6,
      value: 650,
      satisfies: ['priya'],
      requires: [],
      productId: 'discovery-priya-controls',
    },
    {
      id: 'discovery-darren-api',
      kind: 'customer',
      effort: 4,
      effortRevealed: null,
      effortUncertain: true,
      value: 450,
      satisfies: ['darren'],
      requires: [],
      productId: 'discovery-darren-api',
    },
    {
      id: 'discovery-activation-nudge',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 300,
      satisfies: ['theo'],
      requires: [],
      productId: 'discovery-activation-nudge',
    },
    {
      id: 'discovery-observability',
      kind: 'tech',
      effort: 4,
      effortRevealed: 4,
      value: 0,
      satisfies: [],
      requires: [],
      productId: 'discovery-observability',
    },
  ],

  eventDeck: [
    // ---- FORCED: the early warning shot. Iteration 2. The regulator flags a
    // gap before the real review. How you answer sets the tone. ----
    {
      id: 'regulator-warning',
      category: 'regulatory',
      baseWeight: 0,
      trigger: 'forced',
      forcedAtIteration: 2,
      options: [
        {
          // Take the finding seriously, commit to the work now.
          id: 'commit-fix',
          effects: [
            { kind: 'trust', stakeholderId: 'regulator', delta: 2 },
            { kind: 'capacity-baseline', delta: -1 },
          ],
        },
        {
          // Acknowledge but defer behind the launch. Trust slips.
          id: 'defer-fix',
          effects: [{ kind: 'trust', stakeholderId: 'regulator', delta: -2 }],
        },
        {
          // Argue the finding is out of scope. Reads as evasive.
          id: 'push-back',
          effects: [
            { kind: 'trust', stakeholderId: 'regulator', delta: -3 },
            { kind: 'tech-debt', delta: 5 },
          ],
        },
      ],
    },

    // ---- FORCED: the hard deadline. Iteration 5. The compliance review. Pick
    // honestly based on whether the regulatory work is actually done. Effects
    // are fixed per option: the prepared path rewards trust, the cut-corners
    // path craters it and spikes debt. ----
    {
      id: 'compliance-review',
      category: 'regulatory',
      baseWeight: 0,
      trigger: 'forced',
      forcedAtIteration: 5,
      options: [
        {
          // Walk them through the controls you shipped. The honest move when the
          // work is done.
          id: 'present-prepared',
          effects: [
            { kind: 'trust', stakeholderId: 'regulator', delta: 3 },
            { kind: 'morale', delta: 1 },
          ],
        },
        {
          // Cut corners and hope they do not look closely. Punishing if the work
          // was skipped.
          id: 'cut-corners',
          effects: [
            { kind: 'trust', stakeholderId: 'regulator', delta: -4 },
            { kind: 'tech-debt', delta: 15 },
            { kind: 'add-pattern', tag: 'hidden-deficiency' },
          ],
        },
        {
          // Ask for more time to close the remaining gaps. Buys partial credit,
          // costs the launch date with the exec.
          id: 'ask-extension',
          effects: [
            { kind: 'trust', stakeholderId: 'regulator', delta: 1 },
            { kind: 'trust', stakeholderId: 'exec', delta: -2 },
          ],
        },
      ],
    },

    // ---- WEIGHTED pool. Only one fires per sprint, no repeats. Sized to about
    // five so the deck does not run dry across seven iterations. ----

    // The regulator raises a fresh concern about the launch scope.
    {
      id: 'regulator-concern',
      category: 'regulatory',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          // Scope the risky piece down to satisfy the concern.
          id: 'scope-down',
          effects: [
            { kind: 'trust', stakeholderId: 'regulator', delta: 2 },
            { kind: 'happiness', customerId: 'theo', delta: -1 },
          ],
        },
        {
          // Pause for a control review before shipping.
          id: 'control-review',
          effects: [{ kind: 'capacity-baseline', delta: -2 }],
        },
        {
          // Ship it as-is and absorb the risk.
          id: 'ship-as-is',
          effects: [
            { kind: 'trust', stakeholderId: 'regulator', delta: -3 },
            { kind: 'tech-debt', delta: 10 },
          ],
        },
      ],
    },

    // The exec pushes to skip a control to protect the launch date.
    {
      id: 'exec-skip-control',
      category: 'stakeholder',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          // Hold the line: the control stays, the date moves if it must.
          id: 'hold-line',
          effects: [
            { kind: 'trust', stakeholderId: 'regulator', delta: 1 },
            { kind: 'trust', stakeholderId: 'exec', delta: -1 },
          ],
        },
        {
          // Find a narrower control that satisfies both. Costs a little capacity.
          id: 'negotiate-scope',
          effects: [
            { kind: 'trust', stakeholderId: 'exec', delta: 1 },
            { kind: 'capacity-baseline', delta: -1 },
          ],
        },
        {
          // Skip the control to hit the date. Pleases the exec, endangers the rest.
          id: 'skip-it',
          effects: [
            { kind: 'trust', stakeholderId: 'exec', delta: 2 },
            { kind: 'trust', stakeholderId: 'regulator', delta: -2 },
            { kind: 'tech-debt', delta: 10 },
          ],
        },
      ],
    },

    // A major customer escalates: their deal hinges on a feature, not paperwork.
    {
      id: 'priya-escalation',
      category: 'customer',
      baseWeight: 3,
      trigger: 'weighted',
      options: [
        {
          // Commit to the enterprise tier on a date she can plan around.
          id: 'commit-date',
          effects: [{ kind: 'happiness', customerId: 'priya', delta: 2 }],
        },
        {
          // Offer a stopgap to hold her over.
          id: 'stopgap',
          effects: [{ kind: 'happiness', customerId: 'priya', delta: 1 }],
        },
        {
          // Tell her compliance comes first this quarter.
          id: 'defer-her',
          effects: [{ kind: 'happiness', customerId: 'priya', delta: -3 }],
        },
      ],
    },

    // The team is strained by the compliance push on top of the roadmap.
    {
      id: 'team-strain',
      category: 'team',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          // Cut the iteration's scope to protect the team.
          id: 'cut-scope',
          effects: [
            { kind: 'morale', delta: 2 },
            { kind: 'capacity-baseline', delta: -1 },
          ],
        },
        {
          // Bring in a contractor to share the load.
          id: 'add-help',
          effects: [{ kind: 'headcount', delta: 1 }],
        },
        {
          // Push through. Morale takes the hit.
          id: 'push-through',
          effects: [{ kind: 'morale', delta: -2 }],
        },
      ],
    },

    // The tech lead warns that debt is making the compliance work fragile.
    {
      id: 'tech-lead-warning',
      category: 'tech',
      baseWeight: 2,
      trigger: 'weighted',
      options: [
        {
          // Carve out a hardening pass before the review.
          id: 'harden-now',
          effects: [
            { kind: 'tech-debt', delta: -10 },
            { kind: 'trust', stakeholderId: 'tech-lead', delta: 1 },
          ],
        },
        {
          // Patch the worst of it and keep moving.
          id: 'patch-it',
          effects: [{ kind: 'tech-debt', delta: 5 }],
        },
        {
          // Wave it off and keep the velocity.
          id: 'defer-hardening',
          effects: [
            { kind: 'trust', stakeholderId: 'tech-lead', delta: -2 },
            { kind: 'tech-debt', delta: 5 },
          ],
        },
      ],
    },
  ],
};
