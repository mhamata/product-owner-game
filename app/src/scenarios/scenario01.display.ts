import type { IndustryId } from '@/curriculum/industries';

/**
 * Scenario 01: DISPLAY LAYER (per industry).
 *
 * Every entry here is human-readable copy ONLY. It is merged onto the shared
 * structural core (`./scenario01.structure`) by `./buildScenario`, keyed by the
 * structural id. Because the structure (ids, efforts, effects, magic ids) is
 * identical across industries, swapping the display pack changes the *story*
 * without touching game balance.
 *
 * The key unions below are derived from the structural ids, so the compiler
 * forces every pack to cover every PBI, customer, stakeholder, event, and
 * option. A missing or misspelled id is a build error.
 *
 * Mapping discipline (so personas stay coherent across industries):
 *   • maya:    mainstream admin/operator evaluating for her team (churn risk)
 *   • darren:  power user / technical evaluator with a public voice
 *   • priya:   innovator / new trialer, early-adopter appetite
 *   • hq:      growth/leadership stakeholder (the "ship the shiny thing" push)
 *   • ciro:    security/compliance/trust stakeholder (the quality gate)
 *   • the tech PBIs (feature-flags, kyc-rebuild, automated-tests, infra cost)
 *     always read as infra/quality/security plumbing, never customer features.
 */

// ---- structural id unions (mirror ./scenario01.structure) -------------------

export type CustomerId = 'maya' | 'darren' | 'priya';
export type StakeholderId = 'hq' | 'ciro';

export type PbiId =
  // initial backlog
  | 'tfsa'
  | 'rrsp'
  | 'fractional-shares'
  | 'level2-data'
  | 'us-options'
  | 'social-feed'
  | 'premarket-hours'
  | 'cad-priority'
  | 'onboarding-flow'
  | 'referral'
  | 'feature-flags'
  | 'kyc-rebuild'
  | 'automated-tests'
  // discovery pool
  | 'discovery-push-notifications'
  | 'discovery-tax-export'
  | 'discovery-education-center'
  | 'discovery-auto-invest'
  | 'discovery-market-data-cost'
  // event-injected
  | 'event-crypto-tab';

export type EventId =
  | 'wei-crypto-demand'
  | 'ciro-social-warning'
  | 'qa-quits'
  | 'maya-churn-risk'
  | 'darren-reddit';

/** Option ids per event (used to force full coverage per event). */
export interface EventOptionIds {
  'wei-crypto-demand': 'accept' | 'trade-off' | 'defer';
  'ciro-social-warning': 'scope-down' | 'compliance-review' | 'ship-anyway';
  'qa-quits': 'lighten-load' | 'promote' | 'ignore';
  'maya-churn-risk': 'commit-tfsa' | 'retention-campaign' | 'nothing';
  'darren-reddit': 'engage' | 'deflect';
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

/** One industry's complete copy for scenario 01, keyed by structural id. */
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
// SaaS: the original Hubflow theme, ported verbatim from the legacy scenario01.
// ============================================================================
const saas: ScenarioDisplay = {
  name: 'The Q3 Expansion: Hubflow',
  summary:
    'Senior PM for Hubflow, a B2B team-collaboration SaaS. Win the enterprise upmarket push this quarter. Hit the revenue target without failing the security review or burning leadership trust.',
  customers: {
    maya: 'Maya (Ops Admin, mid-market trial)',
    darren: 'Darren (Engineering Lead, power user)',
    priya: 'Priya (New Trialer, evaluating)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Growth)', role: 'Leadership' },
    ciro: { name: 'Aisha (Head of Platform & Security)', role: 'Security & Compliance' },
  },
  pbi: {
    tfsa: 'Self-Serve Team Onboarding',
    rrsp: 'Admin Console & Role-Based Permissions',
    'fractional-shares': 'Integrations Marketplace (Slack & Jira)',
    'level2-data': 'Real-Time Analytics Dashboards',
    'us-options': 'Public REST API & Webhooks',
    'social-feed': 'Team Activity Feed & @Mentions',
    'premarket-hours': 'Mobile App (iOS & Android)',
    'cad-priority': 'Custom Workspace Branding',
    'onboarding-flow': 'Guided Setup Wizard (first-run)',
    referral: 'In-App Referral Program (credit bonus)',
    'feature-flags': 'Per-Tenant Feature Flag Infrastructure',
    'kyc-rebuild': 'SSO / SAML Authentication Rebuild',
    'automated-tests': 'Automated Test Suite',
    'discovery-push-notifications': 'Smart Notification Controls (digest & quiet hours)',
    'discovery-tax-export': 'Usage & Billing Export (CSV / invoicing)',
    'discovery-education-center': 'In-Product Help Center & Tutorials',
    'discovery-auto-invest': 'Workflow Automations (scheduled triggers)',
    'discovery-market-data-cost': 'Infrastructure Cost Optimization',
    'event-crypto-tab': 'AI Assistant (exec mandate, data-privacy review)',
  },
  events: {
    'wei-crypto-demand': {
      narrative:
        'Wei (VP Growth): "Ship an AI assistant by month-end. Every competitor is announcing one." Your team has zero ML experience and the data-privacy story is unclear.',
      options: {
        accept: {
          label: 'Accept and commit',
          visibleConsequence: 'Leadership +2, morale −3, tech debt +10. New AI-assistant PBI injected.',
        },
        'trade-off': {
          label: 'Propose trade-off in writing',
          visibleConsequence: 'AI assistant OR self-serve onboarding. Leadership trust short-term −1.',
        },
        defer: {
          label: 'Defer with a plan',
          visibleConsequence: 'Leadership trust −2, team morale +2.',
        },
      },
    },
    'ciro-social-warning': {
      narrative:
        'Aisha flags the activity feed: @mentions leak data across tenant boundaries and would fail the SOC 2 review before the enterprise deal closes.',
      options: {
        'scope-down': {
          label: 'Scope feature down; enforce tenant isolation',
          visibleConsequence: 'Security trust +2. Priya disappointed.',
        },
        'compliance-review': {
          label: 'Full security review before launch',
          visibleConsequence: 'Delay 1 iteration.',
        },
        'ship-anyway': {
          label: 'Ship anyway: "move fast"',
          visibleConsequence: 'Big compliance risk.',
        },
      },
    },
    'qa-quits': {
      narrative: 'Your QA engineer signals burnout and hints at leaving. Morale is shaky.',
      options: {
        'lighten-load': {
          label: 'Lighten load; automate tests',
          visibleConsequence: 'Velocity short-term −2, long-term +.',
        },
        promote: {
          label: 'Promote + raise',
          visibleConsequence: 'Morale +3. Budget hit.',
        },
        ignore: {
          label: 'Ignore it',
          visibleConsequence: 'Risk of quit.',
        },
      },
    },
    'maya-churn-risk': {
      narrative:
        'Maya has logged in twice in 3 weeks. Her trial survey: "No self-serve onboarding for my team, we are switching to Asana."',
      options: {
        'commit-tfsa': {
          label: 'Publicly commit to self-serve onboarding by iter 4',
          visibleConsequence: 'Mid-market buy-in.',
        },
        'retention-campaign': {
          label: 'Extend trial + discount instead',
          visibleConsequence: 'Temporary lift.',
        },
        nothing: {
          label: 'Do nothing',
          visibleConsequence: 'Maya churns.',
        },
      },
    },
    'darren-reddit': {
      narrative:
        'Darren posts a teardown on Hacker News comparing Hubflow to Linear. His verdict matters.',
      options: {
        engage: {
          label: 'PM engages publicly, acknowledges gaps',
          visibleConsequence: 'Priya interested; Darren appreciates candor.',
        },
        deflect: {
          label: 'Route to support; no comment',
          visibleConsequence: 'Opportunity missed.',
        },
      },
    },
  },
};

// ============================================================================
// Fintech: Ledgerline, a generic B2B expense-management / spend platform.
// Deliberately NO brokerage / trading / TFSA / CIRO specifics.
// ============================================================================
const fintech: ScenarioDisplay = {
  name: 'The Q3 Expansion: Ledgerline',
  summary:
    'Senior PM for Ledgerline, a B2B expense-management and corporate-card platform. Win the upmarket finance-team push this quarter. Hit the revenue target without failing the compliance review or burning leadership trust.',
  customers: {
    maya: 'Maya (Finance Ops Manager, mid-market trial)',
    darren: 'Darren (Controller, power user)',
    priya: 'Priya (Startup Founder, evaluating)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Growth)', role: 'Leadership' },
    ciro: { name: 'Aisha (Head of Risk & Compliance)', role: 'Risk & Compliance' },
  },
  pbi: {
    tfsa: 'Self-Serve Expense Policy Setup',
    rrsp: 'Approval Workflows & Spend Controls',
    'fractional-shares': 'Accounting Integrations (QuickBooks & Xero)',
    'level2-data': 'Real-Time Spend Dashboards',
    'us-options': 'Public Reporting API & Webhooks',
    'social-feed': 'Team Expense Activity & Comments',
    'premarket-hours': 'Mobile Receipt Capture App',
    'cad-priority': 'Custom Statement Branding',
    'onboarding-flow': 'Guided Account Setup Wizard (first-run)',
    referral: 'In-App Referral Program (statement credit)',
    'feature-flags': 'Per-Tenant Feature Flag Infrastructure',
    'kyc-rebuild': 'SSO / SAML Authentication Rebuild',
    'automated-tests': 'Automated Test Suite',
    'discovery-push-notifications': 'Smart Spend Alerts (limits & quiet hours)',
    'discovery-tax-export': 'Expense & Tax Export (CSV / accountant pack)',
    'discovery-education-center': 'In-Product Help Center & Tutorials',
    'discovery-auto-invest': 'Spend Automations (scheduled rules & reconciliation)',
    'discovery-market-data-cost': 'Infrastructure Cost Optimization',
    'event-crypto-tab': 'AI Expense Categorizer (exec mandate, data-privacy review)',
  },
  events: {
    'wei-crypto-demand': {
      narrative:
        'Wei (VP Growth): "Ship an AI expense categorizer by month-end. Every competitor is announcing one." Your team has zero ML experience and the data-privacy story is unclear.',
      options: {
        accept: {
          label: 'Accept and commit',
          visibleConsequence: 'Leadership +2, morale −3, tech debt +10. New AI-categorizer PBI injected.',
        },
        'trade-off': {
          label: 'Propose trade-off in writing',
          visibleConsequence: 'AI categorizer OR self-serve policy setup. Leadership trust short-term −1.',
        },
        defer: {
          label: 'Defer with a plan',
          visibleConsequence: 'Leadership trust −2, team morale +2.',
        },
      },
    },
    'ciro-social-warning': {
      narrative:
        'Aisha flags the expense activity feed: comments expose spend data across customer boundaries and would fail the SOC 2 review before the enterprise deal closes.',
      options: {
        'scope-down': {
          label: 'Scope feature down; enforce tenant isolation',
          visibleConsequence: 'Compliance trust +2. Priya disappointed.',
        },
        'compliance-review': {
          label: 'Full compliance review before launch',
          visibleConsequence: 'Delay 1 iteration.',
        },
        'ship-anyway': {
          label: 'Ship anyway: "move fast"',
          visibleConsequence: 'Big compliance risk.',
        },
      },
    },
    'qa-quits': {
      narrative: 'Your QA engineer signals burnout and hints at leaving. Morale is shaky.',
      options: {
        'lighten-load': {
          label: 'Lighten load; automate tests',
          visibleConsequence: 'Velocity short-term −2, long-term +.',
        },
        promote: {
          label: 'Promote + raise',
          visibleConsequence: 'Morale +3. Budget hit.',
        },
        ignore: {
          label: 'Ignore it',
          visibleConsequence: 'Risk of quit.',
        },
      },
    },
    'maya-churn-risk': {
      narrative:
        'Maya has logged in twice in 3 weeks. Her trial survey: "No self-serve policy setup for my team, we are switching to Ramp."',
      options: {
        'commit-tfsa': {
          label: 'Publicly commit to self-serve policy setup by iter 4',
          visibleConsequence: 'Mid-market buy-in.',
        },
        'retention-campaign': {
          label: 'Extend trial + fee waiver instead',
          visibleConsequence: 'Temporary lift.',
        },
        nothing: {
          label: 'Do nothing',
          visibleConsequence: 'Maya churns.',
        },
      },
    },
    'darren-reddit': {
      narrative:
        'Darren posts a teardown on Hacker News comparing Ledgerline to Brex. His verdict matters.',
      options: {
        engage: {
          label: 'PM engages publicly, acknowledges gaps',
          visibleConsequence: 'Priya interested; Darren appreciates candor.',
        },
        deflect: {
          label: 'Route to support; no comment',
          visibleConsequence: 'Opportunity missed.',
        },
      },
    },
  },
};

// ============================================================================
// Marketplace: Stallweave, a two-sided marketplace connecting buyers & sellers.
// ============================================================================
const marketplace: ScenarioDisplay = {
  name: 'The Q3 Expansion: Stallweave',
  summary:
    'Senior PM for Stallweave, a two-sided marketplace connecting independent sellers with buyers. Win the supply-and-demand growth push this quarter. Hit the GMV target without failing the trust & safety review or burning leadership trust.',
  customers: {
    maya: 'Maya (Shop Owner, mid-market seller)',
    darren: 'Darren (Power Seller, top-volume merchant)',
    priya: 'Priya (New Buyer, evaluating)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Growth)', role: 'Leadership' },
    ciro: { name: 'Aisha (Head of Trust & Safety)', role: 'Trust & Safety' },
  },
  pbi: {
    tfsa: 'Self-Serve Seller Onboarding',
    rrsp: 'Seller Storefront Controls & Roles',
    'fractional-shares': 'Shipping & Payments Integrations',
    'level2-data': 'Real-Time Sales Dashboards',
    'us-options': 'Public Catalog API & Webhooks',
    'social-feed': 'Buyer Reviews & Seller Replies',
    'premarket-hours': 'Mobile Seller App (iOS & Android)',
    'cad-priority': 'Custom Storefront Branding',
    'onboarding-flow': 'Guided First-Listing Wizard (first-run)',
    referral: 'Refer-a-Seller Program (fee credit)',
    'feature-flags': 'Per-Tenant Feature Flag Infrastructure',
    'kyc-rebuild': 'Seller Identity / SSO Verification Rebuild',
    'automated-tests': 'Automated Test Suite',
    'discovery-push-notifications': 'Smart Order Alerts (digest & quiet hours)',
    'discovery-tax-export': 'Payout & Tax Export (CSV / 1099-style pack)',
    'discovery-education-center': 'Seller Help Center & Tutorials',
    'discovery-auto-invest': 'Listing Automations (scheduled promotions & restock)',
    'discovery-market-data-cost': 'Infrastructure Cost Optimization',
    'event-crypto-tab': 'AI Listing Assistant (exec mandate, data-privacy review)',
  },
  events: {
    'wei-crypto-demand': {
      narrative:
        'Wei (VP Growth): "Ship an AI listing assistant by month-end. Every marketplace is announcing one." Your team has zero ML experience and the data-privacy story is unclear.',
      options: {
        accept: {
          label: 'Accept and commit',
          visibleConsequence: 'Leadership +2, morale −3, tech debt +10. New AI-assistant PBI injected.',
        },
        'trade-off': {
          label: 'Propose trade-off in writing',
          visibleConsequence: 'AI assistant OR self-serve seller onboarding. Leadership trust short-term −1.',
        },
        defer: {
          label: 'Defer with a plan',
          visibleConsequence: 'Leadership trust −2, team morale +2.',
        },
      },
    },
    'ciro-social-warning': {
      narrative:
        'Aisha flags buyer reviews: seller replies expose buyer contact details across the platform and would fail the trust & safety review before the partnership closes.',
      options: {
        'scope-down': {
          label: 'Scope feature down; mask buyer details',
          visibleConsequence: 'Trust & Safety +2. Priya disappointed.',
        },
        'compliance-review': {
          label: 'Full trust & safety review before launch',
          visibleConsequence: 'Delay 1 iteration.',
        },
        'ship-anyway': {
          label: 'Ship anyway: "move fast"',
          visibleConsequence: 'Big trust & safety risk.',
        },
      },
    },
    'qa-quits': {
      narrative: 'Your QA engineer signals burnout and hints at leaving. Morale is shaky.',
      options: {
        'lighten-load': {
          label: 'Lighten load; automate tests',
          visibleConsequence: 'Velocity short-term −2, long-term +.',
        },
        promote: {
          label: 'Promote + raise',
          visibleConsequence: 'Morale +3. Budget hit.',
        },
        ignore: {
          label: 'Ignore it',
          visibleConsequence: 'Risk of quit.',
        },
      },
    },
    'maya-churn-risk': {
      narrative:
        'Maya has listed twice in 3 weeks. Her seller survey: "No self-serve onboarding for my shop, I am moving to Etsy."',
      options: {
        'commit-tfsa': {
          label: 'Publicly commit to self-serve seller onboarding by iter 4',
          visibleConsequence: 'Mid-market seller buy-in.',
        },
        'retention-campaign': {
          label: 'Extend fee holiday + boost instead',
          visibleConsequence: 'Temporary lift.',
        },
        nothing: {
          label: 'Do nothing',
          visibleConsequence: 'Maya churns.',
        },
      },
    },
    'darren-reddit': {
      narrative:
        'Darren posts a teardown on Hacker News comparing Stallweave to Etsy. His verdict matters.',
      options: {
        engage: {
          label: 'PM engages publicly, acknowledges gaps',
          visibleConsequence: 'Priya interested; Darren appreciates candor.',
        },
        deflect: {
          label: 'Route to support; no comment',
          visibleConsequence: 'Opportunity missed.',
        },
      },
    },
  },
};

// ============================================================================
// Consumer: Trailmark, a consumer habit / journaling app.
// ============================================================================
const consumer: ScenarioDisplay = {
  name: 'The Q3 Expansion: Trailmark',
  summary:
    'Senior PM for Trailmark, a consumer habit-tracking and journaling app. Win the premium-subscription growth push this quarter. Hit the revenue target without failing the privacy review or burning leadership trust.',
  customers: {
    maya: 'Maya (Casual User, free-tier regular)',
    darren: 'Darren (Power User, daily streak-keeper)',
    priya: 'Priya (New Signup, evaluating)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Growth)', role: 'Leadership' },
    ciro: { name: 'Aisha (Head of Privacy & Trust)', role: 'Privacy & Trust' },
  },
  pbi: {
    tfsa: 'Self-Serve Onboarding & Goal Setup',
    rrsp: 'Account Settings & Family Sharing Roles',
    'fractional-shares': 'Health Integrations (Apple Health & Fitbit)',
    'level2-data': 'Real-Time Progress Insights',
    'us-options': 'Public Data Export API & Webhooks',
    'social-feed': 'Friends Activity Feed & Cheers',
    'premarket-hours': 'Native Mobile App (iOS & Android)',
    'cad-priority': 'Custom Themes & App Icons',
    'onboarding-flow': 'Guided First-Week Wizard (first-run)',
    referral: 'Refer-a-Friend Program (free month)',
    'feature-flags': 'Per-Cohort Feature Flag Infrastructure',
    'kyc-rebuild': 'Social Login / SSO Rebuild',
    'automated-tests': 'Automated Test Suite',
    'discovery-push-notifications': 'Smart Reminders (digest & quiet hours)',
    'discovery-tax-export': 'Personal Data Export (CSV / archive)',
    'discovery-education-center': 'In-App Help Center & Tutorials',
    'discovery-auto-invest': 'Habit Automations (scheduled check-ins & nudges)',
    'discovery-market-data-cost': 'Infrastructure Cost Optimization',
    'event-crypto-tab': 'AI Coach (exec mandate, data-privacy review)',
  },
  events: {
    'wei-crypto-demand': {
      narrative:
        'Wei (VP Growth): "Ship an AI coach by month-end. Every app is announcing one." Your team has zero ML experience and the data-privacy story is unclear.',
      options: {
        accept: {
          label: 'Accept and commit',
          visibleConsequence: 'Leadership +2, morale −3, tech debt +10. New AI-coach PBI injected.',
        },
        'trade-off': {
          label: 'Propose trade-off in writing',
          visibleConsequence: 'AI coach OR self-serve onboarding. Leadership trust short-term −1.',
        },
        defer: {
          label: 'Defer with a plan',
          visibleConsequence: 'Leadership trust −2, team morale +2.',
        },
      },
    },
    'ciro-social-warning': {
      narrative:
        'Aisha flags the friends feed: cheers expose private journal activity to people outside a user’s circle and would fail the privacy review before the launch push.',
      options: {
        'scope-down': {
          label: 'Scope feature down; tighten privacy defaults',
          visibleConsequence: 'Privacy trust +2. Priya disappointed.',
        },
        'compliance-review': {
          label: 'Full privacy review before launch',
          visibleConsequence: 'Delay 1 iteration.',
        },
        'ship-anyway': {
          label: 'Ship anyway: "move fast"',
          visibleConsequence: 'Big privacy risk.',
        },
      },
    },
    'qa-quits': {
      narrative: 'Your QA engineer signals burnout and hints at leaving. Morale is shaky.',
      options: {
        'lighten-load': {
          label: 'Lighten load; automate tests',
          visibleConsequence: 'Velocity short-term −2, long-term +.',
        },
        promote: {
          label: 'Promote + raise',
          visibleConsequence: 'Morale +3. Budget hit.',
        },
        ignore: {
          label: 'Ignore it',
          visibleConsequence: 'Risk of quit.',
        },
      },
    },
    'maya-churn-risk': {
      narrative:
        'Maya has opened the app twice in 3 weeks. Her survey: "Setup was confusing and I lost my streak, I am switching to Streaks."',
      options: {
        'commit-tfsa': {
          label: 'Publicly commit to self-serve onboarding by iter 4',
          visibleConsequence: 'Casual-user buy-in.',
        },
        'retention-campaign': {
          label: 'Extend free trial + bonus instead',
          visibleConsequence: 'Temporary lift.',
        },
        nothing: {
          label: 'Do nothing',
          visibleConsequence: 'Maya churns.',
        },
      },
    },
    'darren-reddit': {
      narrative:
        'Darren posts a teardown on Hacker News comparing Trailmark to Streaks. His verdict matters.',
      options: {
        engage: {
          label: 'PM engages publicly, acknowledges gaps',
          visibleConsequence: 'Priya interested; Darren appreciates candor.',
        },
        deflect: {
          label: 'Route to support; no comment',
          visibleConsequence: 'Opportunity missed.',
        },
      },
    },
  },
};

// ============================================================================
// Healthcare: Carechart, a clinic-facing healthtech (patient-intake) platform.
// ============================================================================
const healthcare: ScenarioDisplay = {
  name: 'The Q3 Expansion: Carechart',
  summary:
    'Senior PM for Carechart, a healthtech platform for outpatient clinics (patient intake & scheduling). Win the multi-clinic expansion this quarter. Hit the revenue target without failing the HIPAA compliance review or burning leadership trust.',
  customers: {
    maya: 'Maya (Practice Manager, mid-size clinic trial)',
    darren: 'Darren (Lead Physician, power user)',
    priya: 'Priya (Solo-Practice Owner, evaluating)',
  },
  stakeholders: {
    hq: { name: 'Wei (VP of Growth)', role: 'Leadership' },
    ciro: { name: 'Aisha (Head of Compliance & Security)', role: 'HIPAA Compliance & Security' },
  },
  pbi: {
    tfsa: 'Self-Serve Clinic Onboarding',
    rrsp: 'Staff Roles & Access Controls',
    'fractional-shares': 'EHR Integrations (Epic & Cerner)',
    'level2-data': 'Real-Time Patient-Flow Dashboards',
    'us-options': 'Public FHIR API & Webhooks',
    'social-feed': 'Care-Team Notes & @Mentions',
    'premarket-hours': 'Patient Mobile App (iOS & Android)',
    'cad-priority': 'Custom Clinic Branding',
    'onboarding-flow': 'Guided Clinic Setup Wizard (first-run)',
    referral: 'Refer-a-Clinic Program (service credit)',
    'feature-flags': 'Per-Tenant Feature Flag Infrastructure',
    'kyc-rebuild': 'SSO / SAML Authentication Rebuild',
    'automated-tests': 'Automated Test Suite',
    'discovery-push-notifications': 'Smart Appointment Reminders (digest & quiet hours)',
    'discovery-tax-export': 'Billing & Claims Export (CSV / clearinghouse pack)',
    'discovery-education-center': 'In-Product Help Center & Tutorials',
    'discovery-auto-invest': 'Intake Automations (scheduled reminders & follow-ups)',
    'discovery-market-data-cost': 'Infrastructure Cost Optimization',
    'event-crypto-tab': 'AI Clinical Scribe (exec mandate, data-privacy review)',
  },
  events: {
    'wei-crypto-demand': {
      narrative:
        'Wei (VP Growth): "Ship an AI clinical scribe by month-end. Every health vendor is announcing one." Your team has zero ML experience and the patient-data privacy story is unclear.',
      options: {
        accept: {
          label: 'Accept and commit',
          visibleConsequence: 'Leadership +2, morale −3, tech debt +10. New AI-scribe PBI injected.',
        },
        'trade-off': {
          label: 'Propose trade-off in writing',
          visibleConsequence: 'AI scribe OR self-serve clinic onboarding. Leadership trust short-term −1.',
        },
        defer: {
          label: 'Defer with a plan',
          visibleConsequence: 'Leadership trust −2, team morale +2.',
        },
      },
    },
    'ciro-social-warning': {
      narrative:
        'Aisha flags care-team notes: @mentions expose protected health information across clinic boundaries and would fail the HIPAA review before the multi-clinic deal closes.',
      options: {
        'scope-down': {
          label: 'Scope feature down; enforce clinic isolation',
          visibleConsequence: 'Compliance trust +2. Priya disappointed.',
        },
        'compliance-review': {
          label: 'Full HIPAA review before launch',
          visibleConsequence: 'Delay 1 iteration.',
        },
        'ship-anyway': {
          label: 'Ship anyway: "move fast"',
          visibleConsequence: 'Big compliance risk.',
        },
      },
    },
    'qa-quits': {
      narrative: 'Your QA engineer signals burnout and hints at leaving. Morale is shaky.',
      options: {
        'lighten-load': {
          label: 'Lighten load; automate tests',
          visibleConsequence: 'Velocity short-term −2, long-term +.',
        },
        promote: {
          label: 'Promote + raise',
          visibleConsequence: 'Morale +3. Budget hit.',
        },
        ignore: {
          label: 'Ignore it',
          visibleConsequence: 'Risk of quit.',
        },
      },
    },
    'maya-churn-risk': {
      narrative:
        'Maya has logged in twice in 3 weeks. Her trial survey: "No self-serve onboarding for my clinic, we are switching to SimplePractice."',
      options: {
        'commit-tfsa': {
          label: 'Publicly commit to self-serve clinic onboarding by iter 4',
          visibleConsequence: 'Mid-size clinic buy-in.',
        },
        'retention-campaign': {
          label: 'Extend trial + onboarding support instead',
          visibleConsequence: 'Temporary lift.',
        },
        nothing: {
          label: 'Do nothing',
          visibleConsequence: 'Maya churns.',
        },
      },
    },
    'darren-reddit': {
      narrative:
        'Darren posts a teardown on Hacker News comparing Carechart to SimplePractice. His verdict matters.',
      options: {
        engage: {
          label: 'PM engages publicly, acknowledges gaps',
          visibleConsequence: 'Priya interested; Darren appreciates candor.',
        },
        deflect: {
          label: 'Route to support; no comment',
          visibleConsequence: 'Opportunity missed.',
        },
      },
    },
  },
};

/** All five display packs, keyed by industry id. */
export const SCENARIO_01_DISPLAY: Record<IndustryId, ScenarioDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};
