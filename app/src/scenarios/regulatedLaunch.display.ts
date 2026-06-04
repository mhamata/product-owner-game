import type { IndustryId } from '@/curriculum/industries';

/**
 * The Regulated Launch: DISPLAY LAYER (per industry). Staff rung, hardest.
 *
 * Every entry here is human-readable copy ONLY. It is merged onto the shared
 * structural core (`./regulatedLaunch.structure`) by the assembler, keyed by the
 * structural id. Because the structure (ids, efforts, effects, magic ids) is
 * identical across industries, swapping the display pack changes the *story*
 * without touching game balance.
 *
 * The key unions below are derived from the structural ids, so the compiler
 * forces every pack to cover every PBI, customer, stakeholder, event, and
 * option. A missing or misspelled id is a build error.
 *
 * Mapping discipline (so personas stay coherent across industries):
 *   • maya:       mainstream operator/admin, the everyday adopter
 *   • darren:     power user / technical evaluator with a public voice
 *   • priya:      enterprise buyer, the marquee deal that needs controls
 *   • theo:       innovator / early trialer, appetite for the new
 *   • regulator:  the watchdog whose trust you must protect (the whole game)
 *   • exec:       internal leader pushing the launch date and the revenue
 *   • tech-lead:  engineering reality check on debt and fragility
 *   • the regulatory PBIs (audit-trail, access-controls, incident-process,
 *     discovery-consent-flow) always read as the controls the regulator demands,
 *     never as customer features. The five industry regulators (security/data
 *     auditor, financial regulator, trust and safety regulator, privacy
 *     regulator, health-data regulator) reskin the SAME items.
 *   • the tech PBIs (dod-check, automated-tests, observability) always read as
 *     quality plumbing, never customer features.
 */

// ---- structural id unions (mirror ./regulatedLaunch.structure) --------------

export type CustomerId = 'maya' | 'darren' | 'priya' | 'theo';
export type StakeholderId = 'regulator' | 'exec' | 'tech-lead';

export type PbiId =
  // initial backlog: regulatory
  | 'audit-trail'
  | 'access-controls'
  | 'incident-process'
  // initial backlog: quality plumbing
  | 'dod-check'
  | 'automated-tests'
  // initial backlog: customer features
  | 'core-launch'
  | 'enterprise-tier'
  | 'power-workflow'
  | 'self-serve-signup'
  | 'reporting-suite'
  | 'quick-win'
  | 'integrations'
  | 'onboarding-flow'
  // discovery pool
  | 'discovery-consent-flow'
  | 'discovery-priya-controls'
  | 'discovery-darren-api'
  | 'discovery-activation-nudge'
  | 'discovery-observability';

export type EventId =
  | 'regulator-warning'
  | 'compliance-review'
  | 'regulator-concern'
  | 'exec-skip-control'
  | 'priya-escalation'
  | 'team-strain'
  | 'tech-lead-warning';

/** Option ids per event (used to force full coverage per event). */
export interface EventOptionIds {
  'regulator-warning': 'commit-fix' | 'defer-fix' | 'push-back';
  'compliance-review': 'present-prepared' | 'cut-corners' | 'ask-extension';
  'regulator-concern': 'scope-down' | 'control-review' | 'ship-as-is';
  'exec-skip-control': 'hold-line' | 'negotiate-scope' | 'skip-it';
  'priya-escalation': 'commit-date' | 'stopgap' | 'defer-her';
  'team-strain': 'cut-scope' | 'add-help' | 'push-through';
  'tech-lead-warning': 'harden-now' | 'patch-it' | 'defer-hardening';
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

/** One industry's complete copy for the regulated launch, keyed by structural id. */
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
// SaaS: Hubflow ships an enterprise launch under a security and data-protection
// audit (SOC 2 style controls), generic.
// ============================================================================
const saas: ScenarioDisplay = {
  name: 'The Regulated Launch: Hubflow',
  summary:
    'Staff PM for Hubflow, taking the enterprise launch live while a security and data-protection audit runs in parallel. A hard external date looms. Hit the revenue target, pass the review, and keep the auditor on your side. Speed and scrutiny pull against each other for the same team.',
  customers: {
    maya: 'Maya (Ops Admin, rolling it out to her team)',
    darren: 'Darren (Engineering Lead, power user with a public voice)',
    priya: 'Priya (Enterprise Buyer, the deal that needs controls)',
    theo: 'Theo (New Trialer, early-adopter appetite)',
  },
  stakeholders: {
    regulator: { name: 'The security auditor', role: 'Security & Data-Protection Audit' },
    exec: { name: 'Wei (VP of Growth)', role: 'Leadership (pushing the date)' },
    'tech-lead': { name: 'Max (Tech Lead)', role: 'Engineering' },
  },
  pbi: {
    'audit-trail': 'Tamper-Evident Audit Logging (control)',
    'access-controls': 'Least-Privilege Access Controls (control)',
    'incident-process': 'Incident Response Runbook & Drill (control)',
    'dod-check': 'Definition-of-Done Security Checklist',
    'automated-tests': 'Automated Test Suite',
    'core-launch': 'Core Enterprise Launch Package',
    'enterprise-tier': 'Enterprise Tier (SSO, admin console, SLA)',
    'power-workflow': 'Advanced Workflow Builder',
    'self-serve-signup': 'Self-Serve Team Signup',
    'reporting-suite': 'Reporting & Analytics Suite',
    'quick-win': 'Saved Views & Quick Filters',
    integrations: 'Integrations (Slack & Jira)',
    'onboarding-flow': 'Guided Setup Wizard (first-run)',
    'discovery-consent-flow': 'Data Processing Consent Flow (control)',
    'discovery-priya-controls': 'Granular Admin Permission Controls',
    'discovery-darren-api': 'Public REST API & Webhooks',
    'discovery-activation-nudge': 'Activation Nudges (first-week)',
    'discovery-observability': 'Observability & Audit Dashboards',
  },
  events: {
    'regulator-warning': {
      narrative:
        'The auditor sends an early finding: your access model grants standing admin rights too broadly. It is a warning, not a verdict, but it sets the tone for the review.',
      options: {
        'commit-fix': {
          label: 'Commit to the access fix this sprint',
          visibleConsequence: 'Auditor trust +2. Capacity baseline −1.',
        },
        'defer-fix': {
          label: 'Acknowledge, defer behind the launch',
          visibleConsequence: 'Auditor trust −2.',
        },
        'push-back': {
          label: 'Argue it is out of scope for now',
          visibleConsequence: 'Auditor trust −3. Tech debt +5.',
        },
      },
    },
    'compliance-review': {
      narrative:
        'Review day. The auditor sits down to assess your controls against the launch. Answer honestly: this lands well only if the control work is actually done.',
      options: {
        'present-prepared': {
          label: 'Walk them through the controls you shipped',
          visibleConsequence: 'Auditor trust +3, morale +1. The honest move if the work is done.',
        },
        'cut-corners': {
          label: 'Gloss over the gaps and hope',
          visibleConsequence: 'Auditor trust −4, tech debt +15. Brutal if you skipped the work.',
        },
        'ask-extension': {
          label: 'Ask for time to close the gaps',
          visibleConsequence: 'Auditor trust +1, but Wei trust −2 over the slipped date.',
        },
      },
    },
    'regulator-concern': {
      narrative:
        'The auditor flags a piece of the launch scope as risky for customer data. They want it addressed before it ships.',
      options: {
        'scope-down': {
          label: 'Scope the risky piece down',
          visibleConsequence: 'Auditor trust +2. Theo disappointed.',
        },
        'control-review': {
          label: 'Pause for a control review first',
          visibleConsequence: 'Capacity baseline −2.',
        },
        'ship-as-is': {
          label: 'Ship it as-is, absorb the risk',
          visibleConsequence: 'Auditor trust −3. Tech debt +10.',
        },
      },
    },
    'exec-skip-control': {
      narrative:
        'Wei pulls you aside: "The access control work can wait. Hit the launch date, we close the quarter on it."',
      options: {
        'hold-line': {
          label: 'Hold the line, move the date if needed',
          visibleConsequence: 'Auditor trust +1. Wei trust −1.',
        },
        'negotiate-scope': {
          label: 'Find a narrower control that fits',
          visibleConsequence: 'Wei trust +1. Capacity baseline −1.',
        },
        'skip-it': {
          label: 'Skip the control to hit the date',
          visibleConsequence: 'Wei trust +2. Auditor trust −2. Tech debt +10.',
        },
      },
    },
    'priya-escalation': {
      narrative:
        'Priya escalates: "My rollout is blocked on the enterprise tier. I do not care about your audit timeline, I need a date I can plan around."',
      options: {
        'commit-date': {
          label: 'Commit to a firm enterprise-tier date',
          visibleConsequence: 'Priya happiness +2.',
        },
        stopgap: {
          label: 'Offer a stopgap to hold her over',
          visibleConsequence: 'Priya happiness +1.',
        },
        'defer-her': {
          label: 'Tell her compliance comes first',
          visibleConsequence: 'Priya happiness −3.',
        },
      },
    },
    'team-strain': {
      narrative:
        'The team is stretched thin running the control work on top of the roadmap. People are quietly grinding.',
      options: {
        'cut-scope': {
          label: 'Cut this iteration to protect them',
          visibleConsequence: 'Morale +2. Capacity baseline −1.',
        },
        'add-help': {
          label: 'Bring in a contractor',
          visibleConsequence: 'Headcount +1.',
        },
        'push-through': {
          label: 'Push through to the date',
          visibleConsequence: 'Morale −2.',
        },
      },
    },
    'tech-lead-warning': {
      narrative:
        'Max warns you: "Debt is making the control work fragile. If we keep stacking on this foundation, the review finds cracks."',
      options: {
        'harden-now': {
          label: 'Carve out a hardening pass',
          visibleConsequence: 'Tech debt −10. Max trust +1.',
        },
        'patch-it': {
          label: 'Patch the worst and keep moving',
          visibleConsequence: 'Tech debt +5.',
        },
        'defer-hardening': {
          label: 'Wave it off, keep the velocity',
          visibleConsequence: 'Max trust −2. Tech debt +5.',
        },
      },
    },
  },
};

// ============================================================================
// Fintech: Ledgerline launches under a financial conduct regulator (generic, no
// real agency named). Expense-management / spend platform. No trading specifics.
// ============================================================================
const fintech: ScenarioDisplay = {
  name: 'The Regulated Launch: Ledgerline',
  summary:
    'Staff PM for Ledgerline, a corporate-spend platform, launching a new tier while the financial regulator reviews your controls. A hard external date looms. Hit the revenue target, pass the review, and keep the regulator on your side. Speed and scrutiny pull against each other for the same team.',
  customers: {
    maya: 'Maya (Finance Ops Manager, everyday operator)',
    darren: 'Darren (Controller, power user with a public voice)',
    priya: 'Priya (Enterprise Buyer, the deal that needs controls)',
    theo: 'Theo (Startup Founder, early-adopter appetite)',
  },
  stakeholders: {
    regulator: { name: 'The financial regulator', role: 'Financial Conduct Oversight' },
    exec: { name: 'Wei (VP of Growth)', role: 'Leadership (pushing the date)' },
    'tech-lead': { name: 'Max (Tech Lead)', role: 'Engineering' },
  },
  pbi: {
    'audit-trail': 'Immutable Transaction Audit Log (control)',
    'access-controls': 'Segregation-of-Duties Access Controls (control)',
    'incident-process': 'Incident & Breach Response Runbook (control)',
    'dod-check': 'Definition-of-Done Compliance Checklist',
    'automated-tests': 'Automated Test Suite',
    'core-launch': 'Core Spend-Platform Launch Package',
    'enterprise-tier': 'Enterprise Tier (SSO, admin console, SLA)',
    'power-workflow': 'Advanced Approval Workflow Builder',
    'self-serve-signup': 'Self-Serve Account Signup',
    'reporting-suite': 'Spend Reporting & Analytics Suite',
    'quick-win': 'Saved Views & Quick Filters',
    integrations: 'Accounting Integrations (QuickBooks & Xero)',
    'onboarding-flow': 'Guided Account Setup Wizard (first-run)',
    'discovery-consent-flow': 'Customer Disclosure & Consent Flow (control)',
    'discovery-priya-controls': 'Granular Spend Limit Controls',
    'discovery-darren-api': 'Public Reporting API & Webhooks',
    'discovery-activation-nudge': 'Activation Nudges (first-week)',
    'discovery-observability': 'Observability & Audit Dashboards',
  },
  events: {
    'regulator-warning': {
      narrative:
        'The financial regulator sends an early finding: your controls do not cleanly separate who can approve a payment from who can release it. A warning, not a verdict, but it sets the tone.',
      options: {
        'commit-fix': {
          label: 'Commit to the separation-of-duties fix this sprint',
          visibleConsequence: 'Regulator trust +2. Capacity baseline −1.',
        },
        'defer-fix': {
          label: 'Acknowledge, defer behind the launch',
          visibleConsequence: 'Regulator trust −2.',
        },
        'push-back': {
          label: 'Argue it is out of scope for now',
          visibleConsequence: 'Regulator trust −3. Tech debt +5.',
        },
      },
    },
    'compliance-review': {
      narrative:
        'Review day. The regulator sits down to assess your controls against the launch. Answer honestly: this lands well only if the control work is actually done.',
      options: {
        'present-prepared': {
          label: 'Walk them through the controls you shipped',
          visibleConsequence: 'Regulator trust +3, morale +1. The honest move if the work is done.',
        },
        'cut-corners': {
          label: 'Gloss over the gaps and hope',
          visibleConsequence: 'Regulator trust −4, tech debt +15. Brutal if you skipped the work.',
        },
        'ask-extension': {
          label: 'Ask for time to close the gaps',
          visibleConsequence: 'Regulator trust +1, but Wei trust −2 over the slipped date.',
        },
      },
    },
    'regulator-concern': {
      narrative:
        'The regulator flags a piece of the launch scope as risky for customer money. They want it addressed before it ships.',
      options: {
        'scope-down': {
          label: 'Scope the risky piece down',
          visibleConsequence: 'Regulator trust +2. Theo disappointed.',
        },
        'control-review': {
          label: 'Pause for a control review first',
          visibleConsequence: 'Capacity baseline −2.',
        },
        'ship-as-is': {
          label: 'Ship it as-is, absorb the risk',
          visibleConsequence: 'Regulator trust −3. Tech debt +10.',
        },
      },
    },
    'exec-skip-control': {
      narrative:
        'Wei pulls you aside: "The controls work can wait. Hit the launch date, we close the quarter on it."',
      options: {
        'hold-line': {
          label: 'Hold the line, move the date if needed',
          visibleConsequence: 'Regulator trust +1. Wei trust −1.',
        },
        'negotiate-scope': {
          label: 'Find a narrower control that fits',
          visibleConsequence: 'Wei trust +1. Capacity baseline −1.',
        },
        'skip-it': {
          label: 'Skip the control to hit the date',
          visibleConsequence: 'Wei trust +2. Regulator trust −2. Tech debt +10.',
        },
      },
    },
    'priya-escalation': {
      narrative:
        'Priya escalates: "My rollout is blocked on the enterprise tier. I do not care about your review timeline, I need a date I can plan around."',
      options: {
        'commit-date': {
          label: 'Commit to a firm enterprise-tier date',
          visibleConsequence: 'Priya happiness +2.',
        },
        stopgap: {
          label: 'Offer a stopgap to hold her over',
          visibleConsequence: 'Priya happiness +1.',
        },
        'defer-her': {
          label: 'Tell her compliance comes first',
          visibleConsequence: 'Priya happiness −3.',
        },
      },
    },
    'team-strain': {
      narrative:
        'The team is stretched thin running the control work on top of the roadmap. People are quietly grinding.',
      options: {
        'cut-scope': {
          label: 'Cut this iteration to protect them',
          visibleConsequence: 'Morale +2. Capacity baseline −1.',
        },
        'add-help': {
          label: 'Bring in a contractor',
          visibleConsequence: 'Headcount +1.',
        },
        'push-through': {
          label: 'Push through to the date',
          visibleConsequence: 'Morale −2.',
        },
      },
    },
    'tech-lead-warning': {
      narrative:
        'Max warns you: "Debt is making the control work fragile. If we keep stacking on this foundation, the review finds cracks."',
      options: {
        'harden-now': {
          label: 'Carve out a hardening pass',
          visibleConsequence: 'Tech debt −10. Max trust +1.',
        },
        'patch-it': {
          label: 'Patch the worst and keep moving',
          visibleConsequence: 'Tech debt +5.',
        },
        'defer-hardening': {
          label: 'Wave it off, keep the velocity',
          visibleConsequence: 'Max trust −2. Tech debt +5.',
        },
      },
    },
  },
};

// ============================================================================
// Marketplace: Stallweave launches under a trust, safety, and consumer-protection
// regulator. Two-sided marketplace connecting sellers and buyers.
// ============================================================================
const marketplace: ScenarioDisplay = {
  name: 'The Regulated Launch: Stallweave',
  summary:
    'Staff PM for Stallweave, a two-sided marketplace, launching a new seller program while a trust, safety, and consumer-protection regulator reviews you. A hard external date looms. Hit the GMV target, pass the review, and keep the regulator on your side. Speed and scrutiny pull against each other for the same team.',
  customers: {
    maya: 'Maya (Shop Owner, everyday seller)',
    darren: 'Darren (Power Seller, top-volume merchant with a public voice)',
    priya: 'Priya (Enterprise Brand, the deal that needs controls)',
    theo: 'Theo (New Buyer, early-adopter appetite)',
  },
  stakeholders: {
    regulator: { name: 'The consumer-protection regulator', role: 'Trust, Safety & Consumer Protection' },
    exec: { name: 'Wei (VP of Growth)', role: 'Leadership (pushing the date)' },
    'tech-lead': { name: 'Max (Tech Lead)', role: 'Engineering' },
  },
  pbi: {
    'audit-trail': 'Dispute & Transaction Audit Trail (control)',
    'access-controls': 'Seller Verification & Access Controls (control)',
    'incident-process': 'Fraud & Safety Incident Runbook (control)',
    'dod-check': 'Definition-of-Done Safety Checklist',
    'automated-tests': 'Automated Test Suite',
    'core-launch': 'Core Seller-Program Launch Package',
    'enterprise-tier': 'Brand Storefront Tier (SSO, admin, SLA)',
    'power-workflow': 'Advanced Listing & Promotion Builder',
    'self-serve-signup': 'Self-Serve Seller Signup',
    'reporting-suite': 'Sales Reporting & Analytics Suite',
    'quick-win': 'Saved Views & Quick Filters',
    integrations: 'Shipping & Payments Integrations',
    'onboarding-flow': 'Guided First-Listing Wizard (first-run)',
    'discovery-consent-flow': 'Buyer Consent & Disclosure Flow (control)',
    'discovery-priya-controls': 'Granular Storefront Permission Controls',
    'discovery-darren-api': 'Public Catalog API & Webhooks',
    'discovery-activation-nudge': 'Activation Nudges (first-week)',
    'discovery-observability': 'Observability & Audit Dashboards',
  },
  events: {
    'regulator-warning': {
      narrative:
        'The regulator sends an early finding: sellers can go live without enough identity verification, which puts buyers at risk. A warning, not a verdict, but it sets the tone.',
      options: {
        'commit-fix': {
          label: 'Commit to the seller-verification fix this sprint',
          visibleConsequence: 'Regulator trust +2. Capacity baseline −1.',
        },
        'defer-fix': {
          label: 'Acknowledge, defer behind the launch',
          visibleConsequence: 'Regulator trust −2.',
        },
        'push-back': {
          label: 'Argue it is out of scope for now',
          visibleConsequence: 'Regulator trust −3. Tech debt +5.',
        },
      },
    },
    'compliance-review': {
      narrative:
        'Review day. The regulator sits down to assess your safeguards against the launch. Answer honestly: this lands well only if the safeguard work is actually done.',
      options: {
        'present-prepared': {
          label: 'Walk them through the safeguards you shipped',
          visibleConsequence: 'Regulator trust +3, morale +1. The honest move if the work is done.',
        },
        'cut-corners': {
          label: 'Gloss over the gaps and hope',
          visibleConsequence: 'Regulator trust −4, tech debt +15. Brutal if you skipped the work.',
        },
        'ask-extension': {
          label: 'Ask for time to close the gaps',
          visibleConsequence: 'Regulator trust +1, but Wei trust −2 over the slipped date.',
        },
      },
    },
    'regulator-concern': {
      narrative:
        'The regulator flags a piece of the launch scope as risky for buyers. They want it addressed before it ships.',
      options: {
        'scope-down': {
          label: 'Scope the risky piece down',
          visibleConsequence: 'Regulator trust +2. Theo disappointed.',
        },
        'control-review': {
          label: 'Pause for a safety review first',
          visibleConsequence: 'Capacity baseline −2.',
        },
        'ship-as-is': {
          label: 'Ship it as-is, absorb the risk',
          visibleConsequence: 'Regulator trust −3. Tech debt +10.',
        },
      },
    },
    'exec-skip-control': {
      narrative:
        'Wei pulls you aside: "The verification work can wait. Hit the launch date, we close the quarter on it."',
      options: {
        'hold-line': {
          label: 'Hold the line, move the date if needed',
          visibleConsequence: 'Regulator trust +1. Wei trust −1.',
        },
        'negotiate-scope': {
          label: 'Find a narrower safeguard that fits',
          visibleConsequence: 'Wei trust +1. Capacity baseline −1.',
        },
        'skip-it': {
          label: 'Skip the safeguard to hit the date',
          visibleConsequence: 'Wei trust +2. Regulator trust −2. Tech debt +10.',
        },
      },
    },
    'priya-escalation': {
      narrative:
        'Priya escalates: "My brand launch is blocked on the storefront tier. I do not care about your review timeline, I need a date I can plan around."',
      options: {
        'commit-date': {
          label: 'Commit to a firm storefront-tier date',
          visibleConsequence: 'Priya happiness +2.',
        },
        stopgap: {
          label: 'Offer a stopgap to hold her over',
          visibleConsequence: 'Priya happiness +1.',
        },
        'defer-her': {
          label: 'Tell her trust and safety comes first',
          visibleConsequence: 'Priya happiness −3.',
        },
      },
    },
    'team-strain': {
      narrative:
        'The team is stretched thin running the safeguard work on top of the roadmap. People are quietly grinding.',
      options: {
        'cut-scope': {
          label: 'Cut this iteration to protect them',
          visibleConsequence: 'Morale +2. Capacity baseline −1.',
        },
        'add-help': {
          label: 'Bring in a contractor',
          visibleConsequence: 'Headcount +1.',
        },
        'push-through': {
          label: 'Push through to the date',
          visibleConsequence: 'Morale −2.',
        },
      },
    },
    'tech-lead-warning': {
      narrative:
        'Max warns you: "Debt is making the safeguard work fragile. If we keep stacking on this foundation, the review finds cracks."',
      options: {
        'harden-now': {
          label: 'Carve out a hardening pass',
          visibleConsequence: 'Tech debt −10. Max trust +1.',
        },
        'patch-it': {
          label: 'Patch the worst and keep moving',
          visibleConsequence: 'Tech debt +5.',
        },
        'defer-hardening': {
          label: 'Wave it off, keep the velocity',
          visibleConsequence: 'Max trust −2. Tech debt +5.',
        },
      },
    },
  },
};

// ============================================================================
// Consumer: Trailmark launches premium under a privacy regulator (data-protection
// and consent style), generic. Consumer habit / journaling app.
// ============================================================================
const consumer: ScenarioDisplay = {
  name: 'The Regulated Launch: Trailmark',
  summary:
    'Staff PM for Trailmark, a consumer habit app, launching premium while a privacy regulator reviews how you handle personal data. A hard external date looms. Hit the revenue target, pass the review, and keep the regulator on your side. Speed and scrutiny pull against each other for the same team.',
  customers: {
    maya: 'Maya (Casual User, everyday adopter)',
    darren: 'Darren (Power User, daily streak-keeper with a public voice)',
    priya: 'Priya (Enterprise Wellness Buyer, the deal that needs controls)',
    theo: 'Theo (New Signup, early-adopter appetite)',
  },
  stakeholders: {
    regulator: { name: 'The privacy regulator', role: 'Data Protection & Consent' },
    exec: { name: 'Wei (VP of Growth)', role: 'Leadership (pushing the date)' },
    'tech-lead': { name: 'Max (Tech Lead)', role: 'Engineering' },
  },
  pbi: {
    'audit-trail': 'Personal-Data Access Audit Log (control)',
    'access-controls': 'Data Minimization & Access Controls (control)',
    'incident-process': 'Data Breach Response Runbook (control)',
    'dod-check': 'Definition-of-Done Privacy Checklist',
    'automated-tests': 'Automated Test Suite',
    'core-launch': 'Core Premium Launch Package',
    'enterprise-tier': 'Wellness Team Tier (SSO, admin, SLA)',
    'power-workflow': 'Advanced Habit Automation Builder',
    'self-serve-signup': 'Self-Serve Signup',
    'reporting-suite': 'Progress Reporting & Insights Suite',
    'quick-win': 'Saved Views & Quick Filters',
    integrations: 'Health Integrations (Apple Health & Fitbit)',
    'onboarding-flow': 'Guided First-Week Wizard (first-run)',
    'discovery-consent-flow': 'Granular Consent & Opt-Out Flow (control)',
    'discovery-priya-controls': 'Granular Team Permission Controls',
    'discovery-darren-api': 'Public Data Export API & Webhooks',
    'discovery-activation-nudge': 'Activation Nudges (first-week)',
    'discovery-observability': 'Observability & Audit Dashboards',
  },
  events: {
    'regulator-warning': {
      narrative:
        'The privacy regulator sends an early finding: you collect more personal data than the feature needs, with consent buried in the fine print. A warning, not a verdict, but it sets the tone.',
      options: {
        'commit-fix': {
          label: 'Commit to the data-minimization fix this sprint',
          visibleConsequence: 'Regulator trust +2. Capacity baseline −1.',
        },
        'defer-fix': {
          label: 'Acknowledge, defer behind the launch',
          visibleConsequence: 'Regulator trust −2.',
        },
        'push-back': {
          label: 'Argue it is out of scope for now',
          visibleConsequence: 'Regulator trust −3. Tech debt +5.',
        },
      },
    },
    'compliance-review': {
      narrative:
        'Review day. The privacy regulator sits down to assess how you handle personal data against the launch. Answer honestly: this lands well only if the privacy work is actually done.',
      options: {
        'present-prepared': {
          label: 'Walk them through the controls you shipped',
          visibleConsequence: 'Regulator trust +3, morale +1. The honest move if the work is done.',
        },
        'cut-corners': {
          label: 'Gloss over the gaps and hope',
          visibleConsequence: 'Regulator trust −4, tech debt +15. Brutal if you skipped the work.',
        },
        'ask-extension': {
          label: 'Ask for time to close the gaps',
          visibleConsequence: 'Regulator trust +1, but Wei trust −2 over the slipped date.',
        },
      },
    },
    'regulator-concern': {
      narrative:
        'The privacy regulator flags a piece of the launch scope as risky for user data. They want it addressed before it ships.',
      options: {
        'scope-down': {
          label: 'Scope the risky piece down',
          visibleConsequence: 'Regulator trust +2. Theo disappointed.',
        },
        'control-review': {
          label: 'Pause for a privacy review first',
          visibleConsequence: 'Capacity baseline −2.',
        },
        'ship-as-is': {
          label: 'Ship it as-is, absorb the risk',
          visibleConsequence: 'Regulator trust −3. Tech debt +10.',
        },
      },
    },
    'exec-skip-control': {
      narrative:
        'Wei pulls you aside: "The consent work can wait. Hit the launch date, we close the quarter on it."',
      options: {
        'hold-line': {
          label: 'Hold the line, move the date if needed',
          visibleConsequence: 'Regulator trust +1. Wei trust −1.',
        },
        'negotiate-scope': {
          label: 'Find a narrower control that fits',
          visibleConsequence: 'Wei trust +1. Capacity baseline −1.',
        },
        'skip-it': {
          label: 'Skip the consent control to hit the date',
          visibleConsequence: 'Wei trust +2. Regulator trust −2. Tech debt +10.',
        },
      },
    },
    'priya-escalation': {
      narrative:
        'Priya escalates: "My wellness rollout is blocked on the team tier. I do not care about your review timeline, I need a date I can plan around."',
      options: {
        'commit-date': {
          label: 'Commit to a firm team-tier date',
          visibleConsequence: 'Priya happiness +2.',
        },
        stopgap: {
          label: 'Offer a stopgap to hold her over',
          visibleConsequence: 'Priya happiness +1.',
        },
        'defer-her': {
          label: 'Tell her privacy comes first',
          visibleConsequence: 'Priya happiness −3.',
        },
      },
    },
    'team-strain': {
      narrative:
        'The team is stretched thin running the privacy work on top of the roadmap. People are quietly grinding.',
      options: {
        'cut-scope': {
          label: 'Cut this iteration to protect them',
          visibleConsequence: 'Morale +2. Capacity baseline −1.',
        },
        'add-help': {
          label: 'Bring in a contractor',
          visibleConsequence: 'Headcount +1.',
        },
        'push-through': {
          label: 'Push through to the date',
          visibleConsequence: 'Morale −2.',
        },
      },
    },
    'tech-lead-warning': {
      narrative:
        'Max warns you: "Debt is making the privacy work fragile. If we keep stacking on this foundation, the review finds cracks."',
      options: {
        'harden-now': {
          label: 'Carve out a hardening pass',
          visibleConsequence: 'Tech debt −10. Max trust +1.',
        },
        'patch-it': {
          label: 'Patch the worst and keep moving',
          visibleConsequence: 'Tech debt +5.',
        },
        'defer-hardening': {
          label: 'Wave it off, keep the velocity',
          visibleConsequence: 'Max trust −2. Tech debt +5.',
        },
      },
    },
  },
};

// ============================================================================
// Healthcare: Carechart launches under a health-data and clinical-safety
// regulator (patient-data protection), generic. Clinic-facing healthtech.
// ============================================================================
const healthcare: ScenarioDisplay = {
  name: 'The Regulated Launch: Carechart',
  summary:
    'Staff PM for Carechart, a clinic platform, launching a multi-clinic rollout while a health-data and clinical-safety regulator reviews you. A hard external date looms. Hit the revenue target, pass the review, and keep the regulator on your side. Speed and scrutiny pull against each other for the same team.',
  customers: {
    maya: 'Maya (Practice Manager, everyday operator)',
    darren: 'Darren (Lead Physician, power user with a public voice)',
    priya: 'Priya (Hospital Group Buyer, the deal that needs controls)',
    theo: 'Theo (Solo-Practice Owner, early-adopter appetite)',
  },
  stakeholders: {
    regulator: { name: 'The health-data regulator', role: 'Patient-Data Protection & Clinical Safety' },
    exec: { name: 'Wei (VP of Growth)', role: 'Leadership (pushing the date)' },
    'tech-lead': { name: 'Max (Tech Lead)', role: 'Engineering' },
  },
  pbi: {
    'audit-trail': 'Patient-Record Access Audit Log (control)',
    'access-controls': 'Role-Based Patient-Data Access Controls (control)',
    'incident-process': 'Patient-Data Breach Response Runbook (control)',
    'dod-check': 'Definition-of-Done Safety Checklist',
    'automated-tests': 'Automated Test Suite',
    'core-launch': 'Core Multi-Clinic Launch Package',
    'enterprise-tier': 'Hospital Group Tier (SSO, admin, SLA)',
    'power-workflow': 'Advanced Intake Workflow Builder',
    'self-serve-signup': 'Self-Serve Clinic Signup',
    'reporting-suite': 'Patient-Flow Reporting & Insights Suite',
    'quick-win': 'Saved Views & Quick Filters',
    integrations: 'EHR Integrations (Epic & Cerner)',
    'onboarding-flow': 'Guided Clinic Setup Wizard (first-run)',
    'discovery-consent-flow': 'Patient Consent & Disclosure Flow (control)',
    'discovery-priya-controls': 'Granular Staff Permission Controls',
    'discovery-darren-api': 'Public FHIR API & Webhooks',
    'discovery-activation-nudge': 'Activation Nudges (first-week)',
    'discovery-observability': 'Observability & Audit Dashboards',
  },
  events: {
    'regulator-warning': {
      narrative:
        'The health-data regulator sends an early finding: too many staff roles can read full patient records they do not need. A warning, not a verdict, but it sets the tone.',
      options: {
        'commit-fix': {
          label: 'Commit to the patient-data access fix this sprint',
          visibleConsequence: 'Regulator trust +2. Capacity baseline −1.',
        },
        'defer-fix': {
          label: 'Acknowledge, defer behind the launch',
          visibleConsequence: 'Regulator trust −2.',
        },
        'push-back': {
          label: 'Argue it is out of scope for now',
          visibleConsequence: 'Regulator trust −3. Tech debt +5.',
        },
      },
    },
    'compliance-review': {
      narrative:
        'Review day. The regulator sits down to assess your patient-data safeguards against the launch. Answer honestly: this lands well only if the safeguard work is actually done.',
      options: {
        'present-prepared': {
          label: 'Walk them through the safeguards you shipped',
          visibleConsequence: 'Regulator trust +3, morale +1. The honest move if the work is done.',
        },
        'cut-corners': {
          label: 'Gloss over the gaps and hope',
          visibleConsequence: 'Regulator trust −4, tech debt +15. Brutal if you skipped the work.',
        },
        'ask-extension': {
          label: 'Ask for time to close the gaps',
          visibleConsequence: 'Regulator trust +1, but Wei trust −2 over the slipped date.',
        },
      },
    },
    'regulator-concern': {
      narrative:
        'The regulator flags a piece of the launch scope as risky for patient data. They want it addressed before it ships.',
      options: {
        'scope-down': {
          label: 'Scope the risky piece down',
          visibleConsequence: 'Regulator trust +2. Theo disappointed.',
        },
        'control-review': {
          label: 'Pause for a safety review first',
          visibleConsequence: 'Capacity baseline −2.',
        },
        'ship-as-is': {
          label: 'Ship it as-is, absorb the risk',
          visibleConsequence: 'Regulator trust −3. Tech debt +10.',
        },
      },
    },
    'exec-skip-control': {
      narrative:
        'Wei pulls you aside: "The access control work can wait. Hit the launch date, we close the quarter on it."',
      options: {
        'hold-line': {
          label: 'Hold the line, move the date if needed',
          visibleConsequence: 'Regulator trust +1. Wei trust −1.',
        },
        'negotiate-scope': {
          label: 'Find a narrower safeguard that fits',
          visibleConsequence: 'Wei trust +1. Capacity baseline −1.',
        },
        'skip-it': {
          label: 'Skip the safeguard to hit the date',
          visibleConsequence: 'Wei trust +2. Regulator trust −2. Tech debt +10.',
        },
      },
    },
    'priya-escalation': {
      narrative:
        'Priya escalates: "My hospital group rollout is blocked on the group tier. I do not care about your review timeline, I need a date I can plan around."',
      options: {
        'commit-date': {
          label: 'Commit to a firm group-tier date',
          visibleConsequence: 'Priya happiness +2.',
        },
        stopgap: {
          label: 'Offer a stopgap to hold her over',
          visibleConsequence: 'Priya happiness +1.',
        },
        'defer-her': {
          label: 'Tell her patient safety comes first',
          visibleConsequence: 'Priya happiness −3.',
        },
      },
    },
    'team-strain': {
      narrative:
        'The team is stretched thin running the safeguard work on top of the roadmap. People are quietly grinding.',
      options: {
        'cut-scope': {
          label: 'Cut this iteration to protect them',
          visibleConsequence: 'Morale +2. Capacity baseline −1.',
        },
        'add-help': {
          label: 'Bring in a contractor',
          visibleConsequence: 'Headcount +1.',
        },
        'push-through': {
          label: 'Push through to the date',
          visibleConsequence: 'Morale −2.',
        },
      },
    },
    'tech-lead-warning': {
      narrative:
        'Max warns you: "Debt is making the safeguard work fragile. If we keep stacking on this foundation, the review finds cracks."',
      options: {
        'harden-now': {
          label: 'Carve out a hardening pass',
          visibleConsequence: 'Tech debt −10. Max trust +1.',
        },
        'patch-it': {
          label: 'Patch the worst and keep moving',
          visibleConsequence: 'Tech debt +5.',
        },
        'defer-hardening': {
          label: 'Wave it off, keep the velocity',
          visibleConsequence: 'Max trust −2. Tech debt +5.',
        },
      },
    },
  },
};

/** All five display packs, keyed by industry id. */
export const REGULATED_LAUNCH_DISPLAY: Record<IndustryId, ScenarioDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};
