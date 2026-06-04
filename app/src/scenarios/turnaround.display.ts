import type { IndustryId } from '@/curriculum/industries';

/**
 * Scenario: THE TURNAROUND, DISPLAY LAYER (per industry).
 *
 * Every entry here is human-readable copy ONLY. It is merged onto the shared
 * structural core (`./turnaround.structure`) by `./assemble`, keyed by the
 * structural id. Because the structure (ids, efforts, effects, magic ids) is
 * identical across industries, swapping the display pack changes the *story*
 * without touching game balance.
 *
 * The key unions below are derived from the structural ids, so the compiler
 * forces every pack to cover every PBI, customer, stakeholder, event, and
 * option. A missing or misspelled id is a build error.
 *
 * Mapping discipline (so personas stay coherent across industries):
 *   - maya:   mainstream admin/operator, neglected and one foot out the door
 *   - darren: power user / technical evaluator with a public voice (also fading)
 *   - priya:  enterprise anchor account, steady but watching closely
 *   - noah:   newer mainstream user, warming up, easy to lose or to win
 *   - hq:     leadership burned by the last PM, wants a fast visible win
 *   - ciro:   quality / trust stakeholder, neutral, rewards honest delivery
 *   - the tech PBIs (refactor-core, automated-tests, observability, dod-check,
 *     perf budget) always read as foundation/quality plumbing, never features.
 */

// ---- structural id unions (mirror ./turnaround.structure) -------------------

export type CustomerId = 'maya' | 'darren' | 'priya' | 'noah';
export type StakeholderId = 'hq' | 'ciro';

export type PbiId =
  // initial backlog
  | 'refactor-core'
  | 'automated-tests'
  | 'observability'
  | 'dod-check'
  | 'stability-fixes'
  | 'quick-win'
  | 'power-tools'
  | 'enterprise-controls'
  | 'reporting'
  | 'onboarding-flow'
  | 'integration'
  | 'polish-pass'
  // discovery pool
  | 'discovery-bulk-actions'
  | 'discovery-saved-views'
  | 'discovery-mobile-access'
  | 'discovery-audit-log'
  | 'discovery-perf-budget'
  // event-injected
  | 'event-flashy-demo';

export type EventId =
  | 'hq-demands-win'
  | 'engineer-threatens-quit'
  | 'maya-escalates'
  | 'reliability-outage'
  | 'leadership-trust-check'
  | 'darren-goes-public';

/** Option ids per event (used to force full coverage per event). */
export interface EventOptionIds {
  'hq-demands-win': 'ship-the-demo' | 'show-the-plan' | 'push-back';
  'engineer-threatens-quit': 'commit-to-paydown' | 'small-raise' | 'let-them-stew';
  'maya-escalates': 'call-and-commit' | 'send-credit' | 'no-response';
  'reliability-outage': 'all-hands-fix' | 'hotfix-and-move-on' | 'blame-the-vendor';
  'leadership-trust-check': 'honest-status' | 'spin-it';
  'darren-goes-public': 'own-it-publicly' | 'reach-out-quietly' | 'ignore-the-post';
}

// ---- display shapes ---------------------------------------------------------

export interface OptionDisplay {
  label: string;
  visibleConsequence: string;
}

export interface EventDisplay<E extends EventId> {
  narrative: string;
  options: Record<EventOptionIds[E], OptionDisplay>;
}

export interface StakeholderDisplay {
  name: string;
  role: string;
}

/** One industry's complete copy for The Turnaround, keyed by structural id. */
export interface ScenarioDisplay {
  name: string;
  summary: string;
  /** PBI titles, keyed by structural PBI id. */
  pbi: Record<PbiId, string>;
  /** Customer names (persona baked into the string, as the UI renders it). */
  customers: Record<CustomerId, string>;
  /** Stakeholder name + role. */
  stakeholders: Record<StakeholderId, StakeholderDisplay>;
  /** Event narrative + per-option copy. */
  events: { [E in EventId]: EventDisplay<E> };
}

// ============================================================================
// SaaS: Hubflow, the B2B team-collaboration tool, two quarters of neglect.
// ============================================================================
const saas: ScenarioDisplay = {
  name: 'The Turnaround: Hubflow',
  summary:
    'You just took over Hubflow, a B2B collaboration tool the last PM left in rough shape. The codebase is brittle, the team is demoralized, and two accounts are halfway out the door. Pay down enough foundation to ship reliably, keep the at-risk customers, and win back a leadership team that stopped believing the roadmap.',
  customers: {
    maya: 'Maya (Ops Admin, renewal at risk)',
    darren: 'Darren (Engineering Lead, power user losing patience)',
    priya: 'Priya (IT Director, enterprise anchor account)',
    noah: 'Noah (Team Lead, newer account warming up)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Product)', role: 'Leadership (burned by the last PM)' },
    ciro: { name: 'Aisha (Head of Engineering)', role: 'Delivery & Quality' },
  },
  pbi: {
    'refactor-core': 'Refactor the Core Sync Engine',
    'automated-tests': 'Automated Test Suite',
    observability: 'Logging & Monitoring (observability)',
    'dod-check': 'Definition-of-Done Quality Gate',
    'stability-fixes': 'Top Crash & Bug Fixes',
    'quick-win': 'Most-Requested Small Fix',
    'power-tools': 'Power-User Keyboard Shortcuts & Bulk Edit',
    'enterprise-controls': 'Admin Controls & Audit Permissions',
    reporting: 'Cross-Team Reporting Dashboards',
    'onboarding-flow': 'Guided Setup Wizard (first-run)',
    integration: 'Third-Party Integrations (Slack & Jira)',
    'polish-pass': 'UI Polish & Empty-State Cleanup',
    'discovery-bulk-actions': 'Bulk Actions & Batch Edit',
    'discovery-saved-views': 'Saved Views & Custom Filters',
    'discovery-mobile-access': 'Mobile App Access',
    'discovery-audit-log': 'Enterprise Audit Log',
    'discovery-perf-budget': 'Performance Budget & Load-Time Fixes',
    'event-flashy-demo': 'Splashy Dashboard Redesign (board demo)',
  },
  events: {
    'hq-demands-win': {
      narrative:
        'Wei pulls you aside: "The last PM showed me slides for a year. I need something I can demo to the board next sprint, or I stop defending this product." A flashy redesign would land, but it does nothing for the rot underneath.',
      options: {
        'ship-the-demo': {
          label: 'Build the splashy demo this sprint',
          visibleConsequence: 'Leadership +3, tech debt +10, morale -2. New demo PBI injected.',
        },
        'show-the-plan': {
          label: 'Walk Wei through the turnaround plan instead',
          visibleConsequence: 'Leadership +1. You set expectations.',
        },
        'push-back': {
          label: 'Refuse: foundation comes first, no exceptions',
          visibleConsequence: 'Leadership -2, team morale +1.',
        },
      },
    },
    'engineer-threatens-quit': {
      narrative:
        'Your strongest engineer corners you: "I have been firefighting this codebase for six months. Either we fix the debt or I am gone." She means it.',
      options: {
        'commit-to-paydown': {
          label: 'Commit to a real paydown plan, in writing',
          visibleConsequence: 'Morale +3. Team buys in.',
        },
        'small-raise': {
          label: 'Offer a small raise, keep shipping features',
          visibleConsequence: 'Morale +1. The debt stays.',
        },
        'let-them-stew': {
          label: 'Tell her to tough it out',
          visibleConsequence: 'Morale -2. Risk she walks.',
        },
      },
    },
    'maya-escalates': {
      narrative:
        'Maya escalates to her exec: "Three logins this month. It crashes, nothing we asked for shipped. We are evaluating Asana." Her renewal is weeks away.',
      options: {
        'call-and-commit': {
          label: 'Get on a call and commit to a fix date',
          visibleConsequence: 'Maya +2.',
        },
        'send-credit': {
          label: 'Send an account credit to buy time',
          visibleConsequence: 'Maya +1, revenue -150.',
        },
        'no-response': {
          label: 'Let it ride; you are heads-down',
          visibleConsequence: 'Maya -3, close to churn.',
        },
      },
    },
    'reliability-outage': {
      narrative:
        'The sync service falls over mid-week. Customers notice. This is exactly the kind of outage the missing test suite and monitoring would have caught.',
      options: {
        'all-hands-fix': {
          label: 'Pull the team to fix the root cause now',
          visibleConsequence: 'Tech debt -5, capacity -2 this sprint, Darren -1.',
        },
        'hotfix-and-move-on': {
          label: 'Slap a hotfix on it and keep moving',
          visibleConsequence: 'Darren -2, Priya -1, tech debt +5.',
        },
        'blame-the-vendor': {
          label: 'Blame the hosting vendor publicly',
          visibleConsequence: 'Quality trust -2, Priya -2.',
        },
      },
    },
    'leadership-trust-check': {
      narrative:
        'Aisha asks for a straight read on where the product really stands. How you answer sets the tone for whether engineering trusts you.',
      options: {
        'honest-status': {
          label: 'Give the honest, unvarnished status',
          visibleConsequence: 'Quality trust +2.',
        },
        'spin-it': {
          label: 'Spin it to look further along',
          visibleConsequence: 'Quality trust -1, Leadership +1.',
        },
      },
    },
    'darren-goes-public': {
      narrative:
        'Darren posts a teardown on Hacker News: "Hubflow used to be great. Now it is slow and buggy and nobody is listening." It is climbing the front page.',
      options: {
        'own-it-publicly': {
          label: 'Reply publicly, own the gaps, share the plan',
          visibleConsequence: 'Darren +1, Noah +1.',
        },
        'reach-out-quietly': {
          label: 'DM Darren, fix his top issue first',
          visibleConsequence: 'Darren +2, morale -1.',
        },
        'ignore-the-post': {
          label: 'Stay silent and hope it blows over',
          visibleConsequence: 'Darren -2, Noah -1.',
        },
      },
    },
  },
};

// ============================================================================
// Fintech: Ledgerline, a B2B expense-management platform left to rot.
// Deliberately NO brokerage / trading specifics.
// ============================================================================
const fintech: ScenarioDisplay = {
  name: 'The Turnaround: Ledgerline',
  summary:
    'You just took over Ledgerline, a B2B expense-management platform the last PM left in rough shape. The codebase is brittle, the team is demoralized, and two finance teams are halfway out the door. Pay down enough foundation to ship reliably, keep the at-risk customers, and win back a leadership team that stopped believing the roadmap.',
  customers: {
    maya: 'Maya (Finance Ops Manager, renewal at risk)',
    darren: 'Darren (Controller, power user losing patience)',
    priya: 'Priya (VP Finance, enterprise anchor account)',
    noah: 'Noah (Office Manager, newer account warming up)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Product)', role: 'Leadership (burned by the last PM)' },
    ciro: { name: 'Aisha (Head of Engineering)', role: 'Delivery & Quality' },
  },
  pbi: {
    'refactor-core': 'Refactor the Core Ledger Engine',
    'automated-tests': 'Automated Test Suite',
    observability: 'Logging & Monitoring (observability)',
    'dod-check': 'Definition-of-Done Quality Gate',
    'stability-fixes': 'Top Crash & Reconciliation Bug Fixes',
    'quick-win': 'Most-Requested Small Fix',
    'power-tools': 'Power-User Bulk Approvals & Shortcuts',
    'enterprise-controls': 'Admin Controls & Spend Permissions',
    reporting: 'Cross-Department Spend Reporting',
    'onboarding-flow': 'Guided Account Setup Wizard (first-run)',
    integration: 'Accounting Integrations (QuickBooks & Xero)',
    'polish-pass': 'UI Polish & Empty-State Cleanup',
    'discovery-bulk-actions': 'Bulk Approvals & Batch Categorize',
    'discovery-saved-views': 'Saved Views & Custom Filters',
    'discovery-mobile-access': 'Mobile Receipt-Capture Access',
    'discovery-audit-log': 'Enterprise Audit Log',
    'discovery-perf-budget': 'Performance Budget & Load-Time Fixes',
    'event-flashy-demo': 'Splashy Spend-Dashboard Redesign (board demo)',
  },
  events: {
    'hq-demands-win': {
      narrative:
        'Wei pulls you aside: "The last PM showed me slides for a year. I need something I can demo to the board next sprint, or I stop defending this product." A flashy redesign would land, but it does nothing for the rot underneath.',
      options: {
        'ship-the-demo': {
          label: 'Build the splashy demo this sprint',
          visibleConsequence: 'Leadership +3, tech debt +10, morale -2. New demo PBI injected.',
        },
        'show-the-plan': {
          label: 'Walk Wei through the turnaround plan instead',
          visibleConsequence: 'Leadership +1. You set expectations.',
        },
        'push-back': {
          label: 'Refuse: foundation comes first, no exceptions',
          visibleConsequence: 'Leadership -2, team morale +1.',
        },
      },
    },
    'engineer-threatens-quit': {
      narrative:
        'Your strongest engineer corners you: "I have been firefighting this codebase for six months. Either we fix the debt or I am gone." She means it.',
      options: {
        'commit-to-paydown': {
          label: 'Commit to a real paydown plan, in writing',
          visibleConsequence: 'Morale +3. Team buys in.',
        },
        'small-raise': {
          label: 'Offer a small raise, keep shipping features',
          visibleConsequence: 'Morale +1. The debt stays.',
        },
        'let-them-stew': {
          label: 'Tell her to tough it out',
          visibleConsequence: 'Morale -2. Risk she walks.',
        },
      },
    },
    'maya-escalates': {
      narrative:
        'Maya escalates to her exec: "Three logins this month. Reconciliation breaks, nothing we asked for shipped. We are evaluating Ramp." Her renewal is weeks away.',
      options: {
        'call-and-commit': {
          label: 'Get on a call and commit to a fix date',
          visibleConsequence: 'Maya +2.',
        },
        'send-credit': {
          label: 'Send a fee credit to buy time',
          visibleConsequence: 'Maya +1, revenue -150.',
        },
        'no-response': {
          label: 'Let it ride; you are heads-down',
          visibleConsequence: 'Maya -3, close to churn.',
        },
      },
    },
    'reliability-outage': {
      narrative:
        'The reconciliation service falls over mid-week. Customers notice. This is exactly the kind of outage the missing test suite and monitoring would have caught.',
      options: {
        'all-hands-fix': {
          label: 'Pull the team to fix the root cause now',
          visibleConsequence: 'Tech debt -5, capacity -2 this sprint, Darren -1.',
        },
        'hotfix-and-move-on': {
          label: 'Slap a hotfix on it and keep moving',
          visibleConsequence: 'Darren -2, Priya -1, tech debt +5.',
        },
        'blame-the-vendor': {
          label: 'Blame the hosting vendor publicly',
          visibleConsequence: 'Quality trust -2, Priya -2.',
        },
      },
    },
    'leadership-trust-check': {
      narrative:
        'Aisha asks for a straight read on where the product really stands. How you answer sets the tone for whether engineering trusts you.',
      options: {
        'honest-status': {
          label: 'Give the honest, unvarnished status',
          visibleConsequence: 'Quality trust +2.',
        },
        'spin-it': {
          label: 'Spin it to look further along',
          visibleConsequence: 'Quality trust -1, Leadership +1.',
        },
      },
    },
    'darren-goes-public': {
      narrative:
        'Darren posts a teardown on Hacker News: "Ledgerline used to be great. Now it is slow and the numbers do not reconcile and nobody is listening." It is climbing the front page.',
      options: {
        'own-it-publicly': {
          label: 'Reply publicly, own the gaps, share the plan',
          visibleConsequence: 'Darren +1, Noah +1.',
        },
        'reach-out-quietly': {
          label: 'DM Darren, fix his top issue first',
          visibleConsequence: 'Darren +2, morale -1.',
        },
        'ignore-the-post': {
          label: 'Stay silent and hope it blows over',
          visibleConsequence: 'Darren -2, Noah -1.',
        },
      },
    },
  },
};

// ============================================================================
// Marketplace: Stallweave, a two-sided marketplace left to rot.
// ============================================================================
const marketplace: ScenarioDisplay = {
  name: 'The Turnaround: Stallweave',
  summary:
    'You just took over Stallweave, a two-sided marketplace the last PM left in rough shape. The codebase is brittle, the team is demoralized, and two top sellers are halfway out the door. Pay down enough foundation to ship reliably, keep the at-risk sellers, and win back a leadership team that stopped believing the roadmap.',
  customers: {
    maya: 'Maya (Shop Owner, ready to leave)',
    darren: 'Darren (Power Seller, top merchant losing patience)',
    priya: 'Priya (Brand Account Manager, large-seller anchor)',
    noah: 'Noah (New Seller, warming up)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Product)', role: 'Leadership (burned by the last PM)' },
    ciro: { name: 'Aisha (Head of Engineering)', role: 'Delivery & Quality' },
  },
  pbi: {
    'refactor-core': 'Refactor the Core Listings Engine',
    'automated-tests': 'Automated Test Suite',
    observability: 'Logging & Monitoring (observability)',
    'dod-check': 'Definition-of-Done Quality Gate',
    'stability-fixes': 'Top Checkout & Listing Bug Fixes',
    'quick-win': 'Most-Requested Small Fix',
    'power-tools': 'Power-Seller Bulk Listing Tools',
    'enterprise-controls': 'Storefront Roles & Permissions',
    reporting: 'Cross-Store Sales Reporting',
    'onboarding-flow': 'Guided First-Listing Wizard (first-run)',
    integration: 'Shipping & Payments Integrations',
    'polish-pass': 'UI Polish & Empty-State Cleanup',
    'discovery-bulk-actions': 'Bulk Listing Edits & Batch Restock',
    'discovery-saved-views': 'Saved Views & Custom Filters',
    'discovery-mobile-access': 'Mobile Seller App Access',
    'discovery-audit-log': 'Large-Seller Audit Log',
    'discovery-perf-budget': 'Performance Budget & Load-Time Fixes',
    'event-flashy-demo': 'Splashy Seller-Dashboard Redesign (board demo)',
  },
  events: {
    'hq-demands-win': {
      narrative:
        'Wei pulls you aside: "The last PM showed me slides for a year. I need something I can demo to the board next sprint, or I stop defending this product." A flashy redesign would land, but it does nothing for the rot underneath.',
      options: {
        'ship-the-demo': {
          label: 'Build the splashy demo this sprint',
          visibleConsequence: 'Leadership +3, tech debt +10, morale -2. New demo PBI injected.',
        },
        'show-the-plan': {
          label: 'Walk Wei through the turnaround plan instead',
          visibleConsequence: 'Leadership +1. You set expectations.',
        },
        'push-back': {
          label: 'Refuse: foundation comes first, no exceptions',
          visibleConsequence: 'Leadership -2, team morale +1.',
        },
      },
    },
    'engineer-threatens-quit': {
      narrative:
        'Your strongest engineer corners you: "I have been firefighting this codebase for six months. Either we fix the debt or I am gone." She means it.',
      options: {
        'commit-to-paydown': {
          label: 'Commit to a real paydown plan, in writing',
          visibleConsequence: 'Morale +3. Team buys in.',
        },
        'small-raise': {
          label: 'Offer a small raise, keep shipping features',
          visibleConsequence: 'Morale +1. The debt stays.',
        },
        'let-them-stew': {
          label: 'Tell her to tough it out',
          visibleConsequence: 'Morale -2. Risk she walks.',
        },
      },
    },
    'maya-escalates': {
      narrative:
        'Maya escalates to her account rep: "Three logins this month. Checkout breaks, nothing we asked for shipped. I am moving my shop to Etsy." Her listings are already thinning out.',
      options: {
        'call-and-commit': {
          label: 'Get on a call and commit to a fix date',
          visibleConsequence: 'Maya +2.',
        },
        'send-credit': {
          label: 'Send a fee credit to buy time',
          visibleConsequence: 'Maya +1, revenue -150.',
        },
        'no-response': {
          label: 'Let it ride; you are heads-down',
          visibleConsequence: 'Maya -3, close to churn.',
        },
      },
    },
    'reliability-outage': {
      narrative:
        'Checkout falls over mid-week and orders fail. Sellers and buyers both notice. This is exactly the kind of outage the missing test suite and monitoring would have caught.',
      options: {
        'all-hands-fix': {
          label: 'Pull the team to fix the root cause now',
          visibleConsequence: 'Tech debt -5, capacity -2 this sprint, Darren -1.',
        },
        'hotfix-and-move-on': {
          label: 'Slap a hotfix on it and keep moving',
          visibleConsequence: 'Darren -2, Priya -1, tech debt +5.',
        },
        'blame-the-vendor': {
          label: 'Blame the payments vendor publicly',
          visibleConsequence: 'Quality trust -2, Priya -2.',
        },
      },
    },
    'leadership-trust-check': {
      narrative:
        'Aisha asks for a straight read on where the product really stands. How you answer sets the tone for whether engineering trusts you.',
      options: {
        'honest-status': {
          label: 'Give the honest, unvarnished status',
          visibleConsequence: 'Quality trust +2.',
        },
        'spin-it': {
          label: 'Spin it to look further along',
          visibleConsequence: 'Quality trust -1, Leadership +1.',
        },
      },
    },
    'darren-goes-public': {
      narrative:
        'Darren posts a teardown on Hacker News: "Stallweave used to be great for sellers. Now checkout is broken and nobody is listening." It is climbing the front page.',
      options: {
        'own-it-publicly': {
          label: 'Reply publicly, own the gaps, share the plan',
          visibleConsequence: 'Darren +1, Noah +1.',
        },
        'reach-out-quietly': {
          label: 'DM Darren, fix his top issue first',
          visibleConsequence: 'Darren +2, morale -1.',
        },
        'ignore-the-post': {
          label: 'Stay silent and hope it blows over',
          visibleConsequence: 'Darren -2, Noah -1.',
        },
      },
    },
  },
};

// ============================================================================
// Consumer: Trailmark, a consumer habit / journaling app left to rot.
// ============================================================================
const consumer: ScenarioDisplay = {
  name: 'The Turnaround: Trailmark',
  summary:
    'You just took over Trailmark, a consumer habit-tracking app the last PM left in rough shape. The codebase is brittle, the team is demoralized, and two loyal users are about to delete it. Pay down enough foundation to ship reliably, keep the at-risk users, and win back a leadership team that stopped believing the roadmap.',
  customers: {
    maya: 'Maya (Longtime User, about to churn)',
    darren: 'Darren (Power User, daily streak-keeper losing patience)',
    priya: 'Priya (Premium Subscriber, your most valuable cohort)',
    noah: 'Noah (New Signup, warming up)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Product)', role: 'Leadership (burned by the last PM)' },
    ciro: { name: 'Aisha (Head of Engineering)', role: 'Delivery & Quality' },
  },
  pbi: {
    'refactor-core': 'Refactor the Core Sync Engine',
    'automated-tests': 'Automated Test Suite',
    observability: 'Logging & Monitoring (observability)',
    'dod-check': 'Definition-of-Done Quality Gate',
    'stability-fixes': 'Top Crash & Streak-Loss Bug Fixes',
    'quick-win': 'Most-Requested Small Fix',
    'power-tools': 'Power-User Shortcuts & Quick Logging',
    'enterprise-controls': 'Family Sharing & Account Roles',
    reporting: 'Long-Term Progress Insights',
    'onboarding-flow': 'Guided First-Week Wizard (first-run)',
    integration: 'Health Integrations (Apple Health & Fitbit)',
    'polish-pass': 'UI Polish & Empty-State Cleanup',
    'discovery-bulk-actions': 'Bulk Habit Edits & Batch Logging',
    'discovery-saved-views': 'Saved Views & Custom Filters',
    'discovery-mobile-access': 'Offline Mobile Access',
    'discovery-audit-log': 'Personal Data History',
    'discovery-perf-budget': 'Performance Budget & Load-Time Fixes',
    'event-flashy-demo': 'Splashy Home-Screen Redesign (board demo)',
  },
  events: {
    'hq-demands-win': {
      narrative:
        'Wei pulls you aside: "The last PM showed me slides for a year. I need something I can demo to the board next sprint, or I stop defending this product." A flashy redesign would land, but it does nothing for the rot underneath.',
      options: {
        'ship-the-demo': {
          label: 'Build the splashy demo this sprint',
          visibleConsequence: 'Leadership +3, tech debt +10, morale -2. New demo PBI injected.',
        },
        'show-the-plan': {
          label: 'Walk Wei through the turnaround plan instead',
          visibleConsequence: 'Leadership +1. You set expectations.',
        },
        'push-back': {
          label: 'Refuse: foundation comes first, no exceptions',
          visibleConsequence: 'Leadership -2, team morale +1.',
        },
      },
    },
    'engineer-threatens-quit': {
      narrative:
        'Your strongest engineer corners you: "I have been firefighting this codebase for six months. Either we fix the debt or I am gone." She means it.',
      options: {
        'commit-to-paydown': {
          label: 'Commit to a real paydown plan, in writing',
          visibleConsequence: 'Morale +3. Team buys in.',
        },
        'small-raise': {
          label: 'Offer a small raise, keep shipping features',
          visibleConsequence: 'Morale +1. The debt stays.',
        },
        'let-them-stew': {
          label: 'Tell her to tough it out',
          visibleConsequence: 'Morale -2. Risk she walks.',
        },
      },
    },
    'maya-escalates': {
      narrative:
        'Maya leaves a one-star review: "Opened it three times this month. It crashes and lost my streak. Switching to Streaks." She is one tap from deleting the app.',
      options: {
        'call-and-commit': {
          label: 'Reach out and commit to a fix date',
          visibleConsequence: 'Maya +2.',
        },
        'send-credit': {
          label: 'Comp her a few months of premium',
          visibleConsequence: 'Maya +1, revenue -150.',
        },
        'no-response': {
          label: 'Let it ride; you are heads-down',
          visibleConsequence: 'Maya -3, close to churn.',
        },
      },
    },
    'reliability-outage': {
      narrative:
        'Sync falls over for a day and people lose their streaks. Users notice and they are loud about it. This is exactly the kind of outage the missing test suite and monitoring would have caught.',
      options: {
        'all-hands-fix': {
          label: 'Pull the team to fix the root cause now',
          visibleConsequence: 'Tech debt -5, capacity -2 this sprint, Darren -1.',
        },
        'hotfix-and-move-on': {
          label: 'Slap a hotfix on it and keep moving',
          visibleConsequence: 'Darren -2, Priya -1, tech debt +5.',
        },
        'blame-the-vendor': {
          label: 'Blame the cloud vendor publicly',
          visibleConsequence: 'Quality trust -2, Priya -2.',
        },
      },
    },
    'leadership-trust-check': {
      narrative:
        'Aisha asks for a straight read on where the product really stands. How you answer sets the tone for whether engineering trusts you.',
      options: {
        'honest-status': {
          label: 'Give the honest, unvarnished status',
          visibleConsequence: 'Quality trust +2.',
        },
        'spin-it': {
          label: 'Spin it to look further along',
          visibleConsequence: 'Quality trust -1, Leadership +1.',
        },
      },
    },
    'darren-goes-public': {
      narrative:
        'Darren posts a teardown on Hacker News: "Trailmark used to be the best habit app. Now it crashes and loses streaks and nobody is listening." It is climbing the front page.',
      options: {
        'own-it-publicly': {
          label: 'Reply publicly, own the gaps, share the plan',
          visibleConsequence: 'Darren +1, Noah +1.',
        },
        'reach-out-quietly': {
          label: 'DM Darren, fix his top issue first',
          visibleConsequence: 'Darren +2, morale -1.',
        },
        'ignore-the-post': {
          label: 'Stay silent and hope it blows over',
          visibleConsequence: 'Darren -2, Noah -1.',
        },
      },
    },
  },
};

// ============================================================================
// Healthcare: Carechart, a clinic-facing healthtech platform left to rot.
// ============================================================================
const healthcare: ScenarioDisplay = {
  name: 'The Turnaround: Carechart',
  summary:
    'You just took over Carechart, a healthtech platform for outpatient clinics the last PM left in rough shape. The codebase is brittle, the team is demoralized, and two clinics are halfway out the door. Pay down enough foundation to ship reliably, keep the at-risk clinics, and win back a leadership team that stopped believing the roadmap.',
  customers: {
    maya: 'Maya (Practice Manager, renewal at risk)',
    darren: 'Darren (Lead Physician, power user losing patience)',
    priya: 'Priya (Clinic Network Director, multi-site anchor account)',
    noah: 'Noah (Front-Desk Lead, newer account warming up)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Product)', role: 'Leadership (burned by the last PM)' },
    ciro: { name: 'Aisha (Head of Engineering)', role: 'Delivery & Quality' },
  },
  pbi: {
    'refactor-core': 'Refactor the Core Scheduling Engine',
    'automated-tests': 'Automated Test Suite',
    observability: 'Logging & Monitoring (observability)',
    'dod-check': 'Definition-of-Done Quality Gate',
    'stability-fixes': 'Top Crash & Intake Bug Fixes',
    'quick-win': 'Most-Requested Small Fix',
    'power-tools': 'Power-User Charting Shortcuts',
    'enterprise-controls': 'Staff Roles & Access Controls',
    reporting: 'Multi-Site Patient-Flow Reporting',
    'onboarding-flow': 'Guided Clinic Setup Wizard (first-run)',
    integration: 'EHR Integrations (Epic & Cerner)',
    'polish-pass': 'UI Polish & Empty-State Cleanup',
    'discovery-bulk-actions': 'Bulk Scheduling & Batch Intake',
    'discovery-saved-views': 'Saved Views & Custom Filters',
    'discovery-mobile-access': 'Mobile Clinic Access',
    'discovery-audit-log': 'Compliance Audit Log',
    'discovery-perf-budget': 'Performance Budget & Load-Time Fixes',
    'event-flashy-demo': 'Splashy Scheduling-Dashboard Redesign (board demo)',
  },
  events: {
    'hq-demands-win': {
      narrative:
        'Wei pulls you aside: "The last PM showed me slides for a year. I need something I can demo to the board next sprint, or I stop defending this product." A flashy redesign would land, but it does nothing for the rot underneath.',
      options: {
        'ship-the-demo': {
          label: 'Build the splashy demo this sprint',
          visibleConsequence: 'Leadership +3, tech debt +10, morale -2. New demo PBI injected.',
        },
        'show-the-plan': {
          label: 'Walk Wei through the turnaround plan instead',
          visibleConsequence: 'Leadership +1. You set expectations.',
        },
        'push-back': {
          label: 'Refuse: foundation comes first, no exceptions',
          visibleConsequence: 'Leadership -2, team morale +1.',
        },
      },
    },
    'engineer-threatens-quit': {
      narrative:
        'Your strongest engineer corners you: "I have been firefighting this codebase for six months. Either we fix the debt or I am gone." She means it.',
      options: {
        'commit-to-paydown': {
          label: 'Commit to a real paydown plan, in writing',
          visibleConsequence: 'Morale +3. Team buys in.',
        },
        'small-raise': {
          label: 'Offer a small raise, keep shipping features',
          visibleConsequence: 'Morale +1. The debt stays.',
        },
        'let-them-stew': {
          label: 'Tell her to tough it out',
          visibleConsequence: 'Morale -2. Risk she walks.',
        },
      },
    },
    'maya-escalates': {
      narrative:
        'Maya escalates to her clinic director: "Three logins this month. Intake crashes, nothing we asked for shipped. We are evaluating SimplePractice." Her renewal is weeks away.',
      options: {
        'call-and-commit': {
          label: 'Get on a call and commit to a fix date',
          visibleConsequence: 'Maya +2.',
        },
        'send-credit': {
          label: 'Send a service credit to buy time',
          visibleConsequence: 'Maya +1, revenue -150.',
        },
        'no-response': {
          label: 'Let it ride; you are heads-down',
          visibleConsequence: 'Maya -3, close to churn.',
        },
      },
    },
    'reliability-outage': {
      narrative:
        'The scheduling service falls over mid-week and clinics cannot book patients. They notice fast. This is exactly the kind of outage the missing test suite and monitoring would have caught.',
      options: {
        'all-hands-fix': {
          label: 'Pull the team to fix the root cause now',
          visibleConsequence: 'Tech debt -5, capacity -2 this sprint, Darren -1.',
        },
        'hotfix-and-move-on': {
          label: 'Slap a hotfix on it and keep moving',
          visibleConsequence: 'Darren -2, Priya -1, tech debt +5.',
        },
        'blame-the-vendor': {
          label: 'Blame the hosting vendor publicly',
          visibleConsequence: 'Quality trust -2, Priya -2.',
        },
      },
    },
    'leadership-trust-check': {
      narrative:
        'Aisha asks for a straight read on where the product really stands. How you answer sets the tone for whether engineering trusts you.',
      options: {
        'honest-status': {
          label: 'Give the honest, unvarnished status',
          visibleConsequence: 'Quality trust +2.',
        },
        'spin-it': {
          label: 'Spin it to look further along',
          visibleConsequence: 'Quality trust -1, Leadership +1.',
        },
      },
    },
    'darren-goes-public': {
      narrative:
        'Darren posts a teardown on Hacker News: "Carechart used to run our clinic well. Now intake crashes and nobody is listening." It is climbing the front page.',
      options: {
        'own-it-publicly': {
          label: 'Reply publicly, own the gaps, share the plan',
          visibleConsequence: 'Darren +1, Noah +1.',
        },
        'reach-out-quietly': {
          label: 'DM Darren, fix his top issue first',
          visibleConsequence: 'Darren +2, morale -1.',
        },
        'ignore-the-post': {
          label: 'Stay silent and hope it blows over',
          visibleConsequence: 'Darren -2, Noah -1.',
        },
      },
    },
  },
};

/** All five display packs, keyed by industry id. */
export const TURNAROUND_DISPLAY: Record<IndustryId, ScenarioDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};
