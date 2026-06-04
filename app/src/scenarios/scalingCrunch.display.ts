import type { IndustryId } from '@/curriculum/industries';

/**
 * Scaling Crunch (Senior): DISPLAY LAYER (per industry).
 *
 * Every entry here is human-readable copy ONLY. It is merged onto the shared
 * structural core (`./scalingCrunch.structure`) by `./assemble`, keyed by the
 * structural id. Because the structure (ids, efforts, effects, magic ids) is
 * identical across industries, swapping the display pack changes the story
 * without touching game balance.
 *
 * The key unions below are derived from the structural ids, so the compiler
 * forces every pack to cover every PBI, customer, stakeholder, event, and
 * option. A missing or misspelled id is a build error.
 *
 * Mapping discipline (so personas stay coherent across industries):
 *   - nadia:  the marquee enterprise account, biggest LTV, wants the heavy
 *             enterprise table-stakes (SSO, audit, permissions).
 *   - theo:   power user with a public voice; cares about the API and speed.
 *   - omar:   mainstream high-volume customer; cares about the core experience.
 *   - bea:    your loud advocate; refers others, watches whether you keep your word.
 *   - pilar:  second enterprise account, compliance-minded, hates downtime.
 *   - sage:   newer mainstream customer riding the growth wave.
 *   - vance:  the revenue-first exec (the "ship the deal" push, managing-up).
 *   - rhea:   the platform/eng leader (the "invest in the foundation" push).
 *   - the tech PBIs (refactor-core, observability, automated-tests, rate-limits,
 *     scaling-fix) always read as infra/platform plumbing, never customer features.
 *
 * Delta copy uses plain text and a leading hyphen for negatives (e.g. "morale -2")
 * to keep the voice clean. No em dashes, no en dashes anywhere.
 */

// ---- structural id unions (mirror ./scalingCrunch.structure) ----------------

export type CustomerId = 'nadia' | 'theo' | 'omar' | 'bea' | 'pilar' | 'sage';
export type StakeholderId = 'vance' | 'rhea';

export type PbiId =
  // initial backlog
  | 'enterprise-sso'
  | 'bulk-api'
  | 'audit-logs'
  | 'advanced-permissions'
  | 'data-residency'
  | 'realtime-sync'
  | 'mobile-revamp'
  | 'self-serve-billing'
  | 'usage-analytics'
  | 'white-label'
  | 'referral-engine'
  | 'sla-dashboard'
  | 'refactor-core'
  | 'observability'
  | 'automated-tests'
  // discovery pool
  | 'discovery-webhooks'
  | 'discovery-saml-scim'
  | 'discovery-region-eu'
  | 'discovery-team-dashboards'
  | 'discovery-rate-limits'
  // event-injected
  | 'event-scaling-fix'
  | 'event-priority-connector';

export type EventId =
  | 'platform-outage'
  | 'viral-spike'
  | 'vendor-meltdown'
  | 'exec-feature-now'
  | 'key-hire'
  | 'reliability-ultimatum'
  | 'tech-debt-bites';

/** Option ids per event (used to force full coverage per event). */
export interface EventOptionIds {
  'platform-outage': 'war-room' | 'hotfix-move-on' | 'downplay';
  'viral-spike': 'ride-it' | 'throttle-signups';
  'vendor-meltdown': 'absorb-it' | 'swap-vendor' | 'wait-and-see';
  'exec-feature-now': 'drop-everything' | 'next-sprint' | 'push-back';
  'key-hire': 'make-the-hire' | 'hold-the-budget';
  'reliability-ultimatum': 'commit-to-fix' | 'offer-credits' | 'hold-the-line';
  'tech-debt-bites': 'pay-it-down' | 'work-around-it';
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

/** One industry's complete copy for the Scaling Crunch, keyed by structural id. */
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
// SaaS: Hubflow, the B2B team-collaboration tool, now mid-scale-up.
// ============================================================================
const saas: ScenarioDisplay = {
  name: 'The Scaling Crunch: Hubflow',
  summary:
    'Senior PM for Hubflow, a B2B collaboration tool that just caught fire. Two enterprise deals, a loud power user, and a wave of new teams all want different things, and you have six sprints. Hit a high revenue target by sequencing the biggest bets, while reliability is shaky and the codebase groans under the new load.',
  customers: {
    nadia: 'Nadia (VP IT, marquee enterprise account)',
    theo: 'Theo (Staff Engineer, power user with a blog)',
    omar: 'Omar (Team Lead, high-volume daily user)',
    bea: 'Bea (Community Champion, refers everyone)',
    pilar: 'Pilar (Security Lead, second enterprise account)',
    sage: 'Sage (Startup Ops, new from the growth wave)',
  },
  stakeholders: {
    vance: { name: 'Vance (VP of Sales)', role: 'Revenue' },
    rhea: { name: 'Rhea (VP of Engineering)', role: 'Platform & Reliability' },
  },
  pbi: {
    'enterprise-sso': 'Enterprise SSO & SAML',
    'bulk-api': 'Public Bulk API & Webhooks',
    'audit-logs': 'Admin Audit Logs & Exports',
    'advanced-permissions': 'Advanced Roles & Permissions',
    'data-residency': 'Regional Data Residency',
    'realtime-sync': 'Real-Time Sync Engine',
    'mobile-revamp': 'Mobile App Rebuild',
    'self-serve-billing': 'Self-Serve Plans & Billing',
    'usage-analytics': 'Workspace Usage Analytics',
    'white-label': 'White-Label Workspaces',
    'referral-engine': 'In-App Referral Program',
    'sla-dashboard': 'Status Page & SLA Dashboard',
    'refactor-core': 'Core Platform Refactor',
    observability: 'Observability & Alerting',
    'automated-tests': 'Automated Test Suite',
    'discovery-webhooks': 'Outbound Webhook Events',
    'discovery-saml-scim': 'SCIM User Provisioning',
    'discovery-region-eu': 'EU Region Hosting',
    'discovery-team-dashboards': 'Team Dashboards',
    'discovery-rate-limits': 'API Rate Limiting',
    'event-scaling-fix': 'Emergency Scaling Fix',
    'event-priority-connector': 'Priority Salesforce Connector',
  },
  events: {
    'platform-outage': {
      narrative:
        'A traffic spike tips the cluster over and Hubflow is down for two hours during business hours. Nadia and Pilar both felt it. The team warned you the foundation was thin.',
      options: {
        'war-room': {
          label: 'Run a war room, post an honest incident report',
          visibleConsequence: 'morale -2, Nadia and Pilar -2, Theo -1, Engineering trust +1, small debt.',
        },
        'hotfix-move-on': {
          label: 'Hotfix it and get back to the roadmap',
          visibleConsequence: 'morale -3, Nadia and Pilar -3, Omar -2, tech debt +15.',
        },
        downplay: {
          label: 'Downplay it to customers',
          visibleConsequence: 'Nadia and Pilar -4, Theo -3, Engineering trust -3.',
        },
      },
    },
    'viral-spike': {
      narrative:
        'A post about Hubflow goes viral and signups 5x overnight. The product is buckling at the seams but the demand is real.',
      options: {
        'ride-it': {
          label: 'Ride the wave, patch as you go',
          visibleConsequence: 'Sage +2, Omar +1, tech debt +8. Emergency Scaling Fix added to the backlog.',
        },
        'throttle-signups': {
          label: 'Throttle signups to protect reliability',
          visibleConsequence: 'Sage -1, morale +1.',
        },
      },
    },
    'vendor-meltdown': {
      narrative:
        'Your search vendor has a bad week of outages and latency. It is dragging core features down with it.',
      options: {
        'absorb-it': {
          label: 'Absorb it, glue in retries for now',
          visibleConsequence: 'tech debt +10, morale -1.',
        },
        'swap-vendor': {
          label: 'Spike a migration to a new vendor',
          visibleConsequence: 'capacity -2 this sprint, Engineering trust +1.',
        },
        'wait-and-see': {
          label: 'Wait for them to fix it',
          visibleConsequence: 'Theo -2.',
        },
      },
    },
    'exec-feature-now': {
      narrative:
        'Vance has a seven-figure deal hinging on a Salesforce connector "by next sprint." It is not on your roadmap and the team is already over capacity.',
      options: {
        'drop-everything': {
          label: 'Drop everything and commit to it',
          visibleConsequence: 'Sales trust +2, morale -2, tech debt +8. Priority Connector added (effort unknown).',
        },
        'next-sprint': {
          label: 'Commit, but slot it next sprint',
          visibleConsequence: 'Sales trust -1.',
        },
        'push-back': {
          label: 'Push back with the tradeoff in writing',
          visibleConsequence: 'Sales trust -2, morale +1.',
        },
      },
    },
    'key-hire': {
      narrative:
        'A strong senior engineer you courted is ready to sign. They will help a lot in a month, but ramping them costs the team now.',
      options: {
        'make-the-hire': {
          label: 'Make the hire',
          visibleConsequence: 'headcount +1, capacity -1 this sprint (ramp cost).',
        },
        'hold-the-budget': {
          label: 'Hold the budget for now',
          visibleConsequence: 'morale -1.',
        },
      },
    },
    'reliability-ultimatum': {
      narrative:
        'Pilar has had it with the wobble: "Show me a reliability plan or we do not renew." Her account is large.',
      options: {
        'commit-to-fix': {
          label: 'Commit to a reliability plan and show the work',
          visibleConsequence: 'Pilar +2, Engineering trust +1.',
        },
        'offer-credits': {
          label: 'Offer service credits to buy time',
          visibleConsequence: 'Pilar +1, revenue -300.',
        },
        'hold-the-line': {
          label: 'Hold the line, promise nothing',
          visibleConsequence: 'Pilar -3.',
        },
      },
    },
    'tech-debt-bites': {
      narrative:
        'A change that should have taken a day takes four. The shortcuts you took to ship are now taxing every sprint.',
      options: {
        'pay-it-down': {
          label: 'Pause to pay down the worst of it',
          visibleConsequence: 'tech debt -10, capacity -1 this sprint.',
        },
        'work-around-it': {
          label: 'Work around it and keep shipping',
          visibleConsequence: 'capacity -2 this sprint, morale -1.',
        },
      },
    },
  },
};

// ============================================================================
// Fintech: Ledgerline, a B2B expense-management / spend platform, scaling up.
// ============================================================================
const fintech: ScenarioDisplay = {
  name: 'The Scaling Crunch: Ledgerline',
  summary:
    'Senior PM for Ledgerline, a B2B expense and corporate-card platform that just caught fire. Two enterprise finance teams, a loud power user, and a wave of new companies all want different things, and you have six sprints. Hit a high revenue target by sequencing the biggest bets, while reliability is shaky and the codebase groans under the new load.',
  customers: {
    nadia: 'Nadia (VP Finance, marquee enterprise account)',
    theo: 'Theo (Senior Controller, power user with a blog)',
    omar: 'Omar (Finance Manager, high-volume daily user)',
    bea: 'Bea (Community Champion, refers everyone)',
    pilar: 'Pilar (Head of Risk, second enterprise account)',
    sage: 'Sage (Startup Ops, new from the growth wave)',
  },
  stakeholders: {
    vance: { name: 'Vance (VP of Sales)', role: 'Revenue' },
    rhea: { name: 'Rhea (VP of Engineering)', role: 'Platform & Reliability' },
  },
  pbi: {
    'enterprise-sso': 'Enterprise SSO & SAML',
    'bulk-api': 'Public Reporting API & Webhooks',
    'audit-logs': 'Audit Trails & Spend Exports',
    'advanced-permissions': 'Approval Roles & Spend Controls',
    'data-residency': 'Regional Data Residency',
    'realtime-sync': 'Real-Time Ledger Sync',
    'mobile-revamp': 'Mobile Receipt App Rebuild',
    'self-serve-billing': 'Self-Serve Plans & Billing',
    'usage-analytics': 'Spend Analytics Dashboards',
    'white-label': 'White-Label Card Program',
    'referral-engine': 'In-App Referral Program',
    'sla-dashboard': 'Status Page & SLA Dashboard',
    'refactor-core': 'Core Ledger Refactor',
    observability: 'Observability & Alerting',
    'automated-tests': 'Automated Test Suite',
    'discovery-webhooks': 'Outbound Webhook Events',
    'discovery-saml-scim': 'SCIM User Provisioning',
    'discovery-region-eu': 'EU Region Hosting',
    'discovery-team-dashboards': 'Department Spend Dashboards',
    'discovery-rate-limits': 'API Rate Limiting',
    'event-scaling-fix': 'Emergency Scaling Fix',
    'event-priority-connector': 'Priority NetSuite Connector',
  },
  events: {
    'platform-outage': {
      narrative:
        'A traffic spike tips the cluster over and card transactions fail for two hours mid-day. Nadia and Pilar both felt it. The team warned you the foundation was thin.',
      options: {
        'war-room': {
          label: 'Run a war room, post an honest incident report',
          visibleConsequence: 'morale -2, Nadia and Pilar -2, Theo -1, Engineering trust +1, small debt.',
        },
        'hotfix-move-on': {
          label: 'Hotfix it and get back to the roadmap',
          visibleConsequence: 'morale -3, Nadia and Pilar -3, Omar -2, tech debt +15.',
        },
        downplay: {
          label: 'Downplay it to customers',
          visibleConsequence: 'Nadia and Pilar -4, Theo -3, Engineering trust -3.',
        },
      },
    },
    'viral-spike': {
      narrative:
        'A finance influencer posts about Ledgerline and signups 5x overnight. The platform is buckling at the seams but the demand is real.',
      options: {
        'ride-it': {
          label: 'Ride the wave, patch as you go',
          visibleConsequence: 'Sage +2, Omar +1, tech debt +8. Emergency Scaling Fix added to the backlog.',
        },
        'throttle-signups': {
          label: 'Throttle signups to protect reliability',
          visibleConsequence: 'Sage -1, morale +1.',
        },
      },
    },
    'vendor-meltdown': {
      narrative:
        'Your bank-data vendor has a bad week of outages and latency. It is dragging transaction sync down with it.',
      options: {
        'absorb-it': {
          label: 'Absorb it, glue in retries for now',
          visibleConsequence: 'tech debt +10, morale -1.',
        },
        'swap-vendor': {
          label: 'Spike a migration to a new vendor',
          visibleConsequence: 'capacity -2 this sprint, Engineering trust +1.',
        },
        'wait-and-see': {
          label: 'Wait for them to fix it',
          visibleConsequence: 'Theo -2.',
        },
      },
    },
    'exec-feature-now': {
      narrative:
        'Vance has a seven-figure deal hinging on a NetSuite connector "by next sprint." It is not on your roadmap and the team is already over capacity.',
      options: {
        'drop-everything': {
          label: 'Drop everything and commit to it',
          visibleConsequence: 'Sales trust +2, morale -2, tech debt +8. Priority Connector added (effort unknown).',
        },
        'next-sprint': {
          label: 'Commit, but slot it next sprint',
          visibleConsequence: 'Sales trust -1.',
        },
        'push-back': {
          label: 'Push back with the tradeoff in writing',
          visibleConsequence: 'Sales trust -2, morale +1.',
        },
      },
    },
    'key-hire': {
      narrative:
        'A strong senior engineer you courted is ready to sign. They will help a lot in a month, but ramping them costs the team now.',
      options: {
        'make-the-hire': {
          label: 'Make the hire',
          visibleConsequence: 'headcount +1, capacity -1 this sprint (ramp cost).',
        },
        'hold-the-budget': {
          label: 'Hold the budget for now',
          visibleConsequence: 'morale -1.',
        },
      },
    },
    'reliability-ultimatum': {
      narrative:
        'Pilar has had it with the wobble: "Show me a reliability plan or we do not renew." Her account is large.',
      options: {
        'commit-to-fix': {
          label: 'Commit to a reliability plan and show the work',
          visibleConsequence: 'Pilar +2, Engineering trust +1.',
        },
        'offer-credits': {
          label: 'Offer fee credits to buy time',
          visibleConsequence: 'Pilar +1, revenue -300.',
        },
        'hold-the-line': {
          label: 'Hold the line, promise nothing',
          visibleConsequence: 'Pilar -3.',
        },
      },
    },
    'tech-debt-bites': {
      narrative:
        'A change that should have taken a day takes four. The shortcuts you took to ship are now taxing every sprint.',
      options: {
        'pay-it-down': {
          label: 'Pause to pay down the worst of it',
          visibleConsequence: 'tech debt -10, capacity -1 this sprint.',
        },
        'work-around-it': {
          label: 'Work around it and keep shipping',
          visibleConsequence: 'capacity -2 this sprint, morale -1.',
        },
      },
    },
  },
};

// ============================================================================
// Marketplace: Stallweave, a two-sided marketplace, scaling up.
// ============================================================================
const marketplace: ScenarioDisplay = {
  name: 'The Scaling Crunch: Stallweave',
  summary:
    'Senior PM for Stallweave, a two-sided marketplace that just caught fire. Two large sellers, a loud power seller, and a wave of new merchants all want different things, and you have six sprints. Hit a high GMV target by sequencing the biggest bets, while reliability is shaky and the codebase groans under the new load.',
  customers: {
    nadia: 'Nadia (Head of Marketplace, marquee brand seller)',
    theo: 'Theo (Power Seller, posts teardowns)',
    omar: 'Omar (Mid-Volume Seller, daily user)',
    bea: 'Bea (Seller Community Champion, refers everyone)',
    pilar: 'Pilar (Ops Lead, second large seller)',
    sage: 'Sage (New Merchant, from the growth wave)',
  },
  stakeholders: {
    vance: { name: 'Vance (VP of Sales)', role: 'Revenue' },
    rhea: { name: 'Rhea (VP of Engineering)', role: 'Platform & Reliability' },
  },
  pbi: {
    'enterprise-sso': 'Seller SSO & SAML',
    'bulk-api': 'Public Catalog API & Webhooks',
    'audit-logs': 'Seller Audit Logs & Exports',
    'advanced-permissions': 'Storefront Roles & Permissions',
    'data-residency': 'Regional Data Residency',
    'realtime-sync': 'Real-Time Inventory Sync',
    'mobile-revamp': 'Seller Mobile App Rebuild',
    'self-serve-billing': 'Self-Serve Plans & Payouts',
    'usage-analytics': 'Seller Sales Analytics',
    'white-label': 'White-Label Storefronts',
    'referral-engine': 'Refer-a-Seller Program',
    'sla-dashboard': 'Status Page & SLA Dashboard',
    'refactor-core': 'Core Platform Refactor',
    observability: 'Observability & Alerting',
    'automated-tests': 'Automated Test Suite',
    'discovery-webhooks': 'Outbound Webhook Events',
    'discovery-saml-scim': 'SCIM User Provisioning',
    'discovery-region-eu': 'EU Region Hosting',
    'discovery-team-dashboards': 'Seller Team Dashboards',
    'discovery-rate-limits': 'API Rate Limiting',
    'event-scaling-fix': 'Emergency Scaling Fix',
    'event-priority-connector': 'Priority Shopify Connector',
  },
  events: {
    'platform-outage': {
      narrative:
        'A traffic spike tips the cluster over and checkout fails for two hours during peak shopping. Nadia and Pilar both lost sales. The team warned you the foundation was thin.',
      options: {
        'war-room': {
          label: 'Run a war room, post an honest incident report',
          visibleConsequence: 'morale -2, Nadia and Pilar -2, Theo -1, Engineering trust +1, small debt.',
        },
        'hotfix-move-on': {
          label: 'Hotfix it and get back to the roadmap',
          visibleConsequence: 'morale -3, Nadia and Pilar -3, Omar -2, tech debt +15.',
        },
        downplay: {
          label: 'Downplay it to sellers',
          visibleConsequence: 'Nadia and Pilar -4, Theo -3, Engineering trust -3.',
        },
      },
    },
    'viral-spike': {
      narrative:
        'A Stallweave shop goes viral and buyer traffic 5x overnight. The platform is buckling at the seams but the demand is real.',
      options: {
        'ride-it': {
          label: 'Ride the wave, patch as you go',
          visibleConsequence: 'Sage +2, Omar +1, tech debt +8. Emergency Scaling Fix added to the backlog.',
        },
        'throttle-signups': {
          label: 'Throttle new seller signups to protect reliability',
          visibleConsequence: 'Sage -1, morale +1.',
        },
      },
    },
    'vendor-meltdown': {
      narrative:
        'Your payments vendor has a bad week of outages and latency. It is dragging checkout down with it.',
      options: {
        'absorb-it': {
          label: 'Absorb it, glue in retries for now',
          visibleConsequence: 'tech debt +10, morale -1.',
        },
        'swap-vendor': {
          label: 'Spike a migration to a new vendor',
          visibleConsequence: 'capacity -2 this sprint, Engineering trust +1.',
        },
        'wait-and-see': {
          label: 'Wait for them to fix it',
          visibleConsequence: 'Theo -2.',
        },
      },
    },
    'exec-feature-now': {
      narrative:
        'Vance has a major brand deal hinging on a Shopify connector "by next sprint." It is not on your roadmap and the team is already over capacity.',
      options: {
        'drop-everything': {
          label: 'Drop everything and commit to it',
          visibleConsequence: 'Sales trust +2, morale -2, tech debt +8. Priority Connector added (effort unknown).',
        },
        'next-sprint': {
          label: 'Commit, but slot it next sprint',
          visibleConsequence: 'Sales trust -1.',
        },
        'push-back': {
          label: 'Push back with the tradeoff in writing',
          visibleConsequence: 'Sales trust -2, morale +1.',
        },
      },
    },
    'key-hire': {
      narrative:
        'A strong senior engineer you courted is ready to sign. They will help a lot in a month, but ramping them costs the team now.',
      options: {
        'make-the-hire': {
          label: 'Make the hire',
          visibleConsequence: 'headcount +1, capacity -1 this sprint (ramp cost).',
        },
        'hold-the-budget': {
          label: 'Hold the budget for now',
          visibleConsequence: 'morale -1.',
        },
      },
    },
    'reliability-ultimatum': {
      narrative:
        'Pilar has had it with the wobble: "Show me a reliability plan or we move our storefront elsewhere." Her shop drives a lot of volume.',
      options: {
        'commit-to-fix': {
          label: 'Commit to a reliability plan and show the work',
          visibleConsequence: 'Pilar +2, Engineering trust +1.',
        },
        'offer-credits': {
          label: 'Offer fee credits to buy time',
          visibleConsequence: 'Pilar +1, revenue -300.',
        },
        'hold-the-line': {
          label: 'Hold the line, promise nothing',
          visibleConsequence: 'Pilar -3.',
        },
      },
    },
    'tech-debt-bites': {
      narrative:
        'A change that should have taken a day takes four. The shortcuts you took to ship are now taxing every sprint.',
      options: {
        'pay-it-down': {
          label: 'Pause to pay down the worst of it',
          visibleConsequence: 'tech debt -10, capacity -1 this sprint.',
        },
        'work-around-it': {
          label: 'Work around it and keep shipping',
          visibleConsequence: 'capacity -2 this sprint, morale -1.',
        },
      },
    },
  },
};

// ============================================================================
// Consumer: Trailmark, a consumer habit / journaling app, scaling up.
// ============================================================================
const consumer: ScenarioDisplay = {
  name: 'The Scaling Crunch: Trailmark',
  summary:
    'Senior PM for Trailmark, a consumer habit and journaling app that just caught fire. Two big creator partners, a loud power user, and a wave of new members all want different things, and you have six sprints. Hit a high revenue target by sequencing the biggest bets, while reliability is shaky and the codebase groans under the new load.',
  customers: {
    nadia: 'Nadia (Brand Partner, marquee creator deal)',
    theo: 'Theo (Power User, daily streak-keeper who blogs)',
    omar: 'Omar (Engaged Member, high-volume daily user)',
    bea: 'Bea (Community Champion, refers everyone)',
    pilar: 'Pilar (Wellness Org Lead, second big partner)',
    sage: 'Sage (New Signup, from the growth wave)',
  },
  stakeholders: {
    vance: { name: 'Vance (VP of Growth)', role: 'Revenue' },
    rhea: { name: 'Rhea (VP of Engineering)', role: 'Platform & Reliability' },
  },
  pbi: {
    'enterprise-sso': 'Social Login & SSO',
    'bulk-api': 'Public Data Export API & Webhooks',
    'audit-logs': 'Account Activity Log & Exports',
    'advanced-permissions': 'Family Sharing Roles & Controls',
    'data-residency': 'Regional Data Residency',
    'realtime-sync': 'Real-Time Cross-Device Sync',
    'mobile-revamp': 'Mobile App Rebuild',
    'self-serve-billing': 'Self-Serve Plans & Billing',
    'usage-analytics': 'Personal Progress Insights',
    'white-label': 'White-Label Partner App',
    'referral-engine': 'Refer-a-Friend Program',
    'sla-dashboard': 'Status Page & Uptime Dashboard',
    'refactor-core': 'Core App Refactor',
    observability: 'Observability & Alerting',
    'automated-tests': 'Automated Test Suite',
    'discovery-webhooks': 'Outbound Webhook Events',
    'discovery-saml-scim': 'Org User Provisioning',
    'discovery-region-eu': 'EU Region Hosting',
    'discovery-team-dashboards': 'Group Progress Dashboards',
    'discovery-rate-limits': 'API Rate Limiting',
    'event-scaling-fix': 'Emergency Scaling Fix',
    'event-priority-connector': 'Priority Apple Health Connector',
  },
  events: {
    'platform-outage': {
      narrative:
        'A traffic spike tips the cluster over and the app is down for two hours during the evening check-in rush. Nadia and Pilar both heard from their communities. The team warned you the foundation was thin.',
      options: {
        'war-room': {
          label: 'Run a war room, post an honest status update',
          visibleConsequence: 'morale -2, Nadia and Pilar -2, Theo -1, Engineering trust +1, small debt.',
        },
        'hotfix-move-on': {
          label: 'Hotfix it and get back to the roadmap',
          visibleConsequence: 'morale -3, Nadia and Pilar -3, Omar -2, tech debt +15.',
        },
        downplay: {
          label: 'Downplay it to users',
          visibleConsequence: 'Nadia and Pilar -4, Theo -3, Engineering trust -3.',
        },
      },
    },
    'viral-spike': {
      narrative:
        'A Trailmark routine goes viral on TikTok and signups 5x overnight. The app is buckling at the seams but the demand is real.',
      options: {
        'ride-it': {
          label: 'Ride the wave, patch as you go',
          visibleConsequence: 'Sage +2, Omar +1, tech debt +8. Emergency Scaling Fix added to the backlog.',
        },
        'throttle-signups': {
          label: 'Throttle signups to protect reliability',
          visibleConsequence: 'Sage -1, morale +1.',
        },
      },
    },
    'vendor-meltdown': {
      narrative:
        'Your push-notification vendor has a bad week of outages and latency. Reminders are arriving late or not at all.',
      options: {
        'absorb-it': {
          label: 'Absorb it, glue in retries for now',
          visibleConsequence: 'tech debt +10, morale -1.',
        },
        'swap-vendor': {
          label: 'Spike a migration to a new vendor',
          visibleConsequence: 'capacity -2 this sprint, Engineering trust +1.',
        },
        'wait-and-see': {
          label: 'Wait for them to fix it',
          visibleConsequence: 'Theo -2.',
        },
      },
    },
    'exec-feature-now': {
      narrative:
        'Vance has a big creator partnership hinging on an Apple Health connector "by next sprint." It is not on your roadmap and the team is already over capacity.',
      options: {
        'drop-everything': {
          label: 'Drop everything and commit to it',
          visibleConsequence: 'Growth trust +2, morale -2, tech debt +8. Priority Connector added (effort unknown).',
        },
        'next-sprint': {
          label: 'Commit, but slot it next sprint',
          visibleConsequence: 'Growth trust -1.',
        },
        'push-back': {
          label: 'Push back with the tradeoff in writing',
          visibleConsequence: 'Growth trust -2, morale +1.',
        },
      },
    },
    'key-hire': {
      narrative:
        'A strong senior engineer you courted is ready to sign. They will help a lot in a month, but ramping them costs the team now.',
      options: {
        'make-the-hire': {
          label: 'Make the hire',
          visibleConsequence: 'headcount +1, capacity -1 this sprint (ramp cost).',
        },
        'hold-the-budget': {
          label: 'Hold the budget for now',
          visibleConsequence: 'morale -1.',
        },
      },
    },
    'reliability-ultimatum': {
      narrative:
        'Pilar has had it with the wobble: "My org promotes you to members. Show me a reliability plan or we pull the partnership." It is a big audience.',
      options: {
        'commit-to-fix': {
          label: 'Commit to a reliability plan and show the work',
          visibleConsequence: 'Pilar +2, Engineering trust +1.',
        },
        'offer-credits': {
          label: 'Offer free months to buy time',
          visibleConsequence: 'Pilar +1, revenue -300.',
        },
        'hold-the-line': {
          label: 'Hold the line, promise nothing',
          visibleConsequence: 'Pilar -3.',
        },
      },
    },
    'tech-debt-bites': {
      narrative:
        'A change that should have taken a day takes four. The shortcuts you took to ship are now taxing every sprint.',
      options: {
        'pay-it-down': {
          label: 'Pause to pay down the worst of it',
          visibleConsequence: 'tech debt -10, capacity -1 this sprint.',
        },
        'work-around-it': {
          label: 'Work around it and keep shipping',
          visibleConsequence: 'capacity -2 this sprint, morale -1.',
        },
      },
    },
  },
};

// ============================================================================
// Healthcare: Carechart, a clinic-facing healthtech platform, scaling up.
// ============================================================================
const healthcare: ScenarioDisplay = {
  name: 'The Scaling Crunch: Carechart',
  summary:
    'Senior PM for Carechart, a healthtech platform for outpatient clinics that just caught fire. Two large clinic groups, a loud lead physician, and a wave of new practices all want different things, and you have six sprints. Hit a high revenue target by sequencing the biggest bets, while reliability is shaky and the codebase groans under the new load.',
  customers: {
    nadia: 'Nadia (VP Operations, marquee clinic group)',
    theo: 'Theo (Lead Physician, power user who blogs)',
    omar: 'Omar (Practice Manager, high-volume daily user)',
    bea: 'Bea (Clinic Community Champion, refers everyone)',
    pilar: 'Pilar (Compliance Director, second clinic group)',
    sage: 'Sage (Solo Practice, new from the growth wave)',
  },
  stakeholders: {
    vance: { name: 'Vance (VP of Sales)', role: 'Revenue' },
    rhea: { name: 'Rhea (VP of Engineering)', role: 'Platform & Reliability' },
  },
  pbi: {
    'enterprise-sso': 'Enterprise SSO & SAML',
    'bulk-api': 'Public FHIR API & Webhooks',
    'audit-logs': 'HIPAA Audit Logs & Exports',
    'advanced-permissions': 'Staff Roles & Access Controls',
    'data-residency': 'Regional Data Residency',
    'realtime-sync': 'Real-Time Schedule Sync',
    'mobile-revamp': 'Patient Mobile App Rebuild',
    'self-serve-billing': 'Self-Serve Plans & Billing',
    'usage-analytics': 'Patient-Flow Analytics',
    'white-label': 'White-Label Clinic Portal',
    'referral-engine': 'Refer-a-Clinic Program',
    'sla-dashboard': 'Status Page & SLA Dashboard',
    'refactor-core': 'Core Platform Refactor',
    observability: 'Observability & Alerting',
    'automated-tests': 'Automated Test Suite',
    'discovery-webhooks': 'Outbound Webhook Events',
    'discovery-saml-scim': 'SCIM User Provisioning',
    'discovery-region-eu': 'EU Region Hosting',
    'discovery-team-dashboards': 'Clinic Team Dashboards',
    'discovery-rate-limits': 'API Rate Limiting',
    'event-scaling-fix': 'Emergency Scaling Fix',
    'event-priority-connector': 'Priority Epic Connector',
  },
  events: {
    'platform-outage': {
      narrative:
        'A traffic spike tips the cluster over and scheduling is down for two hours during morning intake. Nadia and Pilar both had clinics stuck. The team warned you the foundation was thin.',
      options: {
        'war-room': {
          label: 'Run a war room, post an honest incident report',
          visibleConsequence: 'morale -2, Nadia and Pilar -2, Theo -1, Engineering trust +1, small debt.',
        },
        'hotfix-move-on': {
          label: 'Hotfix it and get back to the roadmap',
          visibleConsequence: 'morale -3, Nadia and Pilar -3, Omar -2, tech debt +15.',
        },
        downplay: {
          label: 'Downplay it to clinics',
          visibleConsequence: 'Nadia and Pilar -4, Theo -3, Engineering trust -3.',
        },
      },
    },
    'viral-spike': {
      narrative:
        'A medical association recommends Carechart and new clinic signups 5x overnight. The platform is buckling at the seams but the demand is real.',
      options: {
        'ride-it': {
          label: 'Ride the wave, patch as you go',
          visibleConsequence: 'Sage +2, Omar +1, tech debt +8. Emergency Scaling Fix added to the backlog.',
        },
        'throttle-signups': {
          label: 'Throttle new clinic signups to protect reliability',
          visibleConsequence: 'Sage -1, morale +1.',
        },
      },
    },
    'vendor-meltdown': {
      narrative:
        'Your EHR-integration vendor has a bad week of outages and latency. Patient records are syncing late.',
      options: {
        'absorb-it': {
          label: 'Absorb it, glue in retries for now',
          visibleConsequence: 'tech debt +10, morale -1.',
        },
        'swap-vendor': {
          label: 'Spike a migration to a new vendor',
          visibleConsequence: 'capacity -2 this sprint, Engineering trust +1.',
        },
        'wait-and-see': {
          label: 'Wait for them to fix it',
          visibleConsequence: 'Theo -2.',
        },
      },
    },
    'exec-feature-now': {
      narrative:
        'Vance has a multi-clinic deal hinging on an Epic connector "by next sprint." It is not on your roadmap and the team is already over capacity.',
      options: {
        'drop-everything': {
          label: 'Drop everything and commit to it',
          visibleConsequence: 'Sales trust +2, morale -2, tech debt +8. Priority Connector added (effort unknown).',
        },
        'next-sprint': {
          label: 'Commit, but slot it next sprint',
          visibleConsequence: 'Sales trust -1.',
        },
        'push-back': {
          label: 'Push back with the tradeoff in writing',
          visibleConsequence: 'Sales trust -2, morale +1.',
        },
      },
    },
    'key-hire': {
      narrative:
        'A strong senior engineer you courted is ready to sign. They will help a lot in a month, but ramping them costs the team now.',
      options: {
        'make-the-hire': {
          label: 'Make the hire',
          visibleConsequence: 'headcount +1, capacity -1 this sprint (ramp cost).',
        },
        'hold-the-budget': {
          label: 'Hold the budget for now',
          visibleConsequence: 'morale -1.',
        },
      },
    },
    'reliability-ultimatum': {
      narrative:
        'Pilar has had it with the wobble: "We cannot run clinics on a system that drops. Show me a reliability plan or we do not renew." Her group is large.',
      options: {
        'commit-to-fix': {
          label: 'Commit to a reliability plan and show the work',
          visibleConsequence: 'Pilar +2, Engineering trust +1.',
        },
        'offer-credits': {
          label: 'Offer service credits to buy time',
          visibleConsequence: 'Pilar +1, revenue -300.',
        },
        'hold-the-line': {
          label: 'Hold the line, promise nothing',
          visibleConsequence: 'Pilar -3.',
        },
      },
    },
    'tech-debt-bites': {
      narrative:
        'A change that should have taken a day takes four. The shortcuts you took to ship are now taxing every sprint.',
      options: {
        'pay-it-down': {
          label: 'Pause to pay down the worst of it',
          visibleConsequence: 'tech debt -10, capacity -1 this sprint.',
        },
        'work-around-it': {
          label: 'Work around it and keep shipping',
          visibleConsequence: 'capacity -2 this sprint, morale -1.',
        },
      },
    },
  },
};

/** All five display packs, keyed by industry id. */
export const SCALING_CRUNCH_DISPLAY: Record<IndustryId, ScenarioDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};
