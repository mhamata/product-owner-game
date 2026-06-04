import type { IndustryId } from '@/curriculum/industries';

/**
 * Zero to One: DISPLAY LAYER (per industry).
 *
 * Every entry here is human-readable copy ONLY. It is merged onto the shared
 * structural core (`./zeroToOne.structure`) by the assembler, keyed by the
 * structural id. Because the structure (ids, efforts, effects, magic ids) is
 * identical across industries, swapping the display pack changes the *story*
 * without touching game balance.
 *
 * The key unions below are derived from the structural ids, so the compiler
 * forces every pack to cover every PBI, customer, stakeholder, event, and
 * option. A missing or misspelled id is a build error.
 *
 * Mapping discipline (so personas stay coherent across industries):
 *   • nadia:   engaged early adopter, gives the strongest signal when activated
 *   • theo:    dormant early adopter you are trying to wake up
 *   • founder: leadership stakeholder who wants traction now
 *   • backer:  investor-style stakeholder watching the runway
 *   • the tech PBIs (automated-tests, instrumentation) always read as
 *     plumbing that lets you measure and move faster, never customer features.
 */

// ---- structural id unions (mirror ./zeroToOne.structure) --------------------

export type CustomerId = 'nadia' | 'theo';
export type StakeholderId = 'founder' | 'backer';

export type PbiId =
  // initial backlog
  | 'landing-signup'
  | 'core-loop'
  | 'manual-onboarding'
  | 'pricing-page'
  | 'automated-tests'
  // discovery pool
  | 'discovery-referral-invite'
  | 'discovery-power-workflow'
  | 'discovery-mobile-quickstart'
  | 'discovery-templates'
  | 'discovery-integrations'
  | 'discovery-activation-nudge'
  | 'discovery-dashboard'
  | 'discovery-export'
  | 'discovery-instrumentation'
  // event-injected
  | 'event-segment-bet';

export type EventId =
  | 'segment-signal'
  | 'competitor-launch'
  | 'nadia-loves-it'
  | 'runway-check'
  | 'odd-usage'
  | 'founder-pep';

/** Option ids per event (used to force full coverage per event). */
export interface EventOptionIds {
  'segment-signal': 'chase-segment' | 'interview-first' | 'stay-focused';
  'competitor-launch': 'differentiate' | 'price-match' | 'ignore-noise';
  'nadia-loves-it': 'amplify' | 'gather-quotes' | 'move-on';
  'runway-check': 'trim-burn' | 'show-traction' | 'spend-anyway';
  'odd-usage': 'dig-in' | 'note-it' | 'dismiss';
  'founder-pep': 'rally' | 'quiet-thanks' | 'skip-it';
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

/** One industry's complete copy for Zero to One, keyed by structural id. */
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
// SaaS: Driftnote, a brand-new team note-taking tool with its first users.
// ============================================================================
const saas: ScenarioDisplay = {
  name: 'Zero to One: Driftnote',
  summary:
    'Founding PM for Driftnote, a brand-new team note-taking tool. No revenue yet, a tiny team, and a runway you can count in weeks. Ship small bets, read which ones land, and find the loop that activates your first users before the money runs out.',
  customers: {
    nadia: 'Nadia (early adopter, uses it most days)',
    theo: 'Theo (signed up, has not really started)',
  },
  stakeholders: {
    founder: { name: 'Sam (Founder & CEO)', role: 'Leadership' },
    backer: { name: 'Priya (Seed Investor)', role: 'Investor' },
  },
  pbi: {
    'landing-signup': 'Landing Page & Signup Flow',
    'core-loop': 'Core Note-Taking Loop',
    'manual-onboarding': 'Hand-Held Onboarding (white-glove)',
    'pricing-page': 'Pricing Page & Paid Upgrade',
    'automated-tests': 'Automated Test Suite',
    'discovery-referral-invite': 'Invite-a-Teammate Loop',
    'discovery-power-workflow': 'Power-User Keyboard Workflow',
    'discovery-mobile-quickstart': 'Mobile Quick-Capture',
    'discovery-templates': 'Starter Note Templates',
    'discovery-integrations': 'Slack & Calendar Integrations',
    'discovery-activation-nudge': 'First-Note Activation Nudge',
    'discovery-dashboard': 'Workspace Activity Dashboard',
    'discovery-export': 'Note Export (Markdown / PDF)',
    'discovery-instrumentation': 'Product Analytics Instrumentation',
    'event-segment-bet': 'Solo-Founder Workspace (new segment bet)',
  },
  events: {
    'segment-signal': {
      narrative:
        'Three solo founders signed up this week and stuck around, a segment you never targeted. Sam wants to chase it. You only have so many sprints left.',
      options: {
        'chase-segment': {
          label: 'Chase the new segment now',
          visibleConsequence: 'Leadership +1, morale -1. New solo-founder workspace PBI injected (effort unknown).',
        },
        'interview-first': {
          label: 'Interview five of them first',
          visibleConsequence: 'No build yet. You learn before you commit.',
        },
        'stay-focused': {
          label: 'Stay on the current bet',
          visibleConsequence: 'Leadership -1, morale +1.',
        },
      },
    },
    'competitor-launch': {
      narrative:
        'A well-funded competitor launches a near-identical note tool with a splashy demo. Your early users start asking what makes you different.',
      options: {
        differentiate: {
          label: 'Sharpen your wedge and say it loud',
          visibleConsequence: 'Morale +1. Clearer positioning.',
        },
        'price-match': {
          label: 'Undercut them on price',
          visibleConsequence: 'Revenue -200. Race to the bottom.',
        },
        'ignore-noise': {
          label: 'Ignore it and keep building',
          visibleConsequence: 'Nadia gets nervous.',
        },
      },
    },
    'nadia-loves-it': {
      narrative:
        'Nadia emails you unprompted: the note loop saved her team an hour today. She is your strongest signal so far.',
      options: {
        amplify: {
          label: 'Build on what she loves and tell Theo',
          visibleConsequence: 'Nadia +2, Theo +1.',
        },
        'gather-quotes': {
          label: 'Ask her for a quote and a referral',
          visibleConsequence: 'Nadia +1.',
        },
        'move-on': {
          label: 'Thank her, move on',
          visibleConsequence: 'Nadia cools off.',
        },
      },
    },
    'runway-check': {
      narrative:
        'Priya pings you: at current burn you have a few months left. She wants to see either tighter spend or real traction by the next check-in.',
      options: {
        'trim-burn': {
          label: 'Trim burn, extend the runway',
          visibleConsequence: 'Investor +2, capacity -1.',
        },
        'show-traction': {
          label: 'Point to the early signal you have',
          visibleConsequence: 'Investor +1.',
        },
        'spend-anyway': {
          label: 'Keep spending to move faster',
          visibleConsequence: 'Investor -2, morale +1.',
        },
      },
    },
    'odd-usage': {
      narrative:
        'Your logs show people pasting long meeting transcripts into Driftnote and never editing them, not what you designed the loop for.',
      options: {
        'dig-in': {
          label: 'Talk to them; chase the real job',
          visibleConsequence: 'Pattern logged. Theo +1.',
        },
        'note-it': {
          label: 'Log it as an anomaly for later',
          visibleConsequence: 'Pattern logged.',
        },
        dismiss: {
          label: 'Dismiss it as misuse',
          visibleConsequence: 'Theo -1.',
        },
      },
    },
    'founder-pep': {
      narrative:
        'Sam gathers the small team for an end-of-week check-in. Energy is mixed and people want to know the bets are working.',
      options: {
        rally: {
          label: 'Share the wins and the plan',
          visibleConsequence: 'Morale +2.',
        },
        'quiet-thanks': {
          label: 'Thank them one on one',
          visibleConsequence: 'Morale +1.',
        },
        'skip-it': {
          label: 'Skip it, back to work',
          visibleConsequence: 'Morale -1.',
        },
      },
    },
  },
};

// ============================================================================
// Fintech: Tallybird, a brand-new personal budgeting app with its first users.
// ============================================================================
const fintech: ScenarioDisplay = {
  name: 'Zero to One: Tallybird',
  summary:
    'Founding PM for Tallybird, a brand-new personal budgeting app. No revenue yet, a tiny team, and a runway you can count in weeks. Ship small bets, read which ones land, and find the loop that activates your first users before the money runs out.',
  customers: {
    nadia: 'Nadia (early adopter, checks it most days)',
    theo: 'Theo (signed up, has not linked an account)',
  },
  stakeholders: {
    founder: { name: 'Sam (Founder & CEO)', role: 'Leadership' },
    backer: { name: 'Priya (Seed Investor)', role: 'Investor' },
  },
  pbi: {
    'landing-signup': 'Landing Page & Signup Flow',
    'core-loop': 'Core Budgeting Loop',
    'manual-onboarding': 'Hand-Held Account Linking (white-glove)',
    'pricing-page': 'Pricing Page & Paid Upgrade',
    'automated-tests': 'Automated Test Suite',
    'discovery-referral-invite': 'Invite-a-Friend Loop',
    'discovery-power-workflow': 'Power-User Rules & Categories',
    'discovery-mobile-quickstart': 'Mobile Quick-Add Expense',
    'discovery-templates': 'Starter Budget Templates',
    'discovery-integrations': 'Bank & Card Integrations',
    'discovery-activation-nudge': 'First-Budget Activation Nudge',
    'discovery-dashboard': 'Spending Overview Dashboard',
    'discovery-export': 'Transaction Export (CSV / PDF)',
    'discovery-instrumentation': 'Product Analytics Instrumentation',
    'event-segment-bet': 'Couples Shared Budget (new segment bet)',
  },
  events: {
    'segment-signal': {
      narrative:
        'Three couples signed up this week and stuck around, a segment you never targeted. Sam wants to chase it. You only have so many sprints left.',
      options: {
        'chase-segment': {
          label: 'Chase the new segment now',
          visibleConsequence: 'Leadership +1, morale -1. New shared-budget PBI injected (effort unknown).',
        },
        'interview-first': {
          label: 'Interview five of them first',
          visibleConsequence: 'No build yet. You learn before you commit.',
        },
        'stay-focused': {
          label: 'Stay on the current bet',
          visibleConsequence: 'Leadership -1, morale +1.',
        },
      },
    },
    'competitor-launch': {
      narrative:
        'A well-funded competitor launches a near-identical budgeting app with a splashy demo. Your early users start asking what makes you different.',
      options: {
        differentiate: {
          label: 'Sharpen your wedge and say it loud',
          visibleConsequence: 'Morale +1. Clearer positioning.',
        },
        'price-match': {
          label: 'Undercut them on price',
          visibleConsequence: 'Revenue -200. Race to the bottom.',
        },
        'ignore-noise': {
          label: 'Ignore it and keep building',
          visibleConsequence: 'Nadia gets nervous.',
        },
      },
    },
    'nadia-loves-it': {
      narrative:
        'Nadia emails you unprompted: the budgeting loop helped her save real money this month. She is your strongest signal so far.',
      options: {
        amplify: {
          label: 'Build on what she loves and tell Theo',
          visibleConsequence: 'Nadia +2, Theo +1.',
        },
        'gather-quotes': {
          label: 'Ask her for a quote and a referral',
          visibleConsequence: 'Nadia +1.',
        },
        'move-on': {
          label: 'Thank her, move on',
          visibleConsequence: 'Nadia cools off.',
        },
      },
    },
    'runway-check': {
      narrative:
        'Priya pings you: at current burn you have a few months left. She wants to see either tighter spend or real traction by the next check-in.',
      options: {
        'trim-burn': {
          label: 'Trim burn, extend the runway',
          visibleConsequence: 'Investor +2, capacity -1.',
        },
        'show-traction': {
          label: 'Point to the early signal you have',
          visibleConsequence: 'Investor +1.',
        },
        'spend-anyway': {
          label: 'Keep spending to move faster',
          visibleConsequence: 'Investor -2, morale +1.',
        },
      },
    },
    'odd-usage': {
      narrative:
        'Your logs show people using Tallybird to split bills with roommates and never setting a budget, not what you designed the loop for.',
      options: {
        'dig-in': {
          label: 'Talk to them; chase the real job',
          visibleConsequence: 'Pattern logged. Theo +1.',
        },
        'note-it': {
          label: 'Log it as an anomaly for later',
          visibleConsequence: 'Pattern logged.',
        },
        dismiss: {
          label: 'Dismiss it as misuse',
          visibleConsequence: 'Theo -1.',
        },
      },
    },
    'founder-pep': {
      narrative:
        'Sam gathers the small team for an end-of-week check-in. Energy is mixed and people want to know the bets are working.',
      options: {
        rally: {
          label: 'Share the wins and the plan',
          visibleConsequence: 'Morale +2.',
        },
        'quiet-thanks': {
          label: 'Thank them one on one',
          visibleConsequence: 'Morale +1.',
        },
        'skip-it': {
          label: 'Skip it, back to work',
          visibleConsequence: 'Morale -1.',
        },
      },
    },
  },
};

// ============================================================================
// Marketplace: Plotswap, a brand-new local tool-rental marketplace.
// ============================================================================
const marketplace: ScenarioDisplay = {
  name: 'Zero to One: Plotswap',
  summary:
    'Founding PM for Plotswap, a brand-new marketplace for renting tools between neighbours. No revenue yet, a tiny team, and a runway you can count in weeks. Ship small bets, read which side of the market lights up, and find the loop that gets the first rentals flowing before the money runs out.',
  customers: {
    nadia: 'Nadia (first lister, posts most weeks)',
    theo: 'Theo (signed up to borrow, has not booked)',
  },
  stakeholders: {
    founder: { name: 'Sam (Founder & CEO)', role: 'Leadership' },
    backer: { name: 'Priya (Seed Investor)', role: 'Investor' },
  },
  pbi: {
    'landing-signup': 'Landing Page & Signup Flow',
    'core-loop': 'Core List-and-Book Loop',
    'manual-onboarding': 'Hand-Held Seller Setup (white-glove)',
    'pricing-page': 'Pricing & Service-Fee Page',
    'automated-tests': 'Automated Test Suite',
    'discovery-referral-invite': 'Invite-a-Neighbour Loop',
    'discovery-power-workflow': 'Power-Lister Bulk Tools',
    'discovery-mobile-quickstart': 'Mobile Quick-List',
    'discovery-templates': 'Starter Listing Templates',
    'discovery-integrations': 'Maps & Payments Integrations',
    'discovery-activation-nudge': 'First-Booking Activation Nudge',
    'discovery-dashboard': 'Listings & Bookings Dashboard',
    'discovery-export': 'Payout Export (CSV / PDF)',
    'discovery-instrumentation': 'Product Analytics Instrumentation',
    'event-segment-bet': 'Small-Contractor Rentals (new segment bet)',
  },
  events: {
    'segment-signal': {
      narrative:
        'Three small contractors signed up this week and kept listing, a segment you never targeted. Sam wants to chase it. You only have so many sprints left.',
      options: {
        'chase-segment': {
          label: 'Chase the new segment now',
          visibleConsequence: 'Leadership +1, morale -1. New contractor-rentals PBI injected (effort unknown).',
        },
        'interview-first': {
          label: 'Interview five of them first',
          visibleConsequence: 'No build yet. You learn before you commit.',
        },
        'stay-focused': {
          label: 'Stay on the current bet',
          visibleConsequence: 'Leadership -1, morale +1.',
        },
      },
    },
    'competitor-launch': {
      narrative:
        'A well-funded competitor launches a near-identical rental marketplace with a splashy demo. Your early users start asking what makes you different.',
      options: {
        differentiate: {
          label: 'Sharpen your wedge and say it loud',
          visibleConsequence: 'Morale +1. Clearer positioning.',
        },
        'price-match': {
          label: 'Cut your service fee to compete',
          visibleConsequence: 'Revenue -200. Race to the bottom.',
        },
        'ignore-noise': {
          label: 'Ignore it and keep building',
          visibleConsequence: 'Nadia gets nervous.',
        },
      },
    },
    'nadia-loves-it': {
      narrative:
        'Nadia emails you unprompted: she rented out her ladder three times this week and made real money. She is your strongest signal so far.',
      options: {
        amplify: {
          label: 'Build on what she loves and tell Theo',
          visibleConsequence: 'Nadia +2, Theo +1.',
        },
        'gather-quotes': {
          label: 'Ask her for a quote and a referral',
          visibleConsequence: 'Nadia +1.',
        },
        'move-on': {
          label: 'Thank her, move on',
          visibleConsequence: 'Nadia cools off.',
        },
      },
    },
    'runway-check': {
      narrative:
        'Priya pings you: at current burn you have a few months left. She wants to see either tighter spend or real traction by the next check-in.',
      options: {
        'trim-burn': {
          label: 'Trim burn, extend the runway',
          visibleConsequence: 'Investor +2, capacity -1.',
        },
        'show-traction': {
          label: 'Point to the early signal you have',
          visibleConsequence: 'Investor +1.',
        },
        'spend-anyway': {
          label: 'Keep spending to move faster',
          visibleConsequence: 'Investor -2, morale +1.',
        },
      },
    },
    'odd-usage': {
      narrative:
        'Your logs show people using Plotswap to give away items for free instead of renting them, not what you designed the loop for.',
      options: {
        'dig-in': {
          label: 'Talk to them; chase the real job',
          visibleConsequence: 'Pattern logged. Theo +1.',
        },
        'note-it': {
          label: 'Log it as an anomaly for later',
          visibleConsequence: 'Pattern logged.',
        },
        dismiss: {
          label: 'Dismiss it as misuse',
          visibleConsequence: 'Theo -1.',
        },
      },
    },
    'founder-pep': {
      narrative:
        'Sam gathers the small team for an end-of-week check-in. Energy is mixed and people want to know the bets are working.',
      options: {
        rally: {
          label: 'Share the wins and the plan',
          visibleConsequence: 'Morale +2.',
        },
        'quiet-thanks': {
          label: 'Thank them one on one',
          visibleConsequence: 'Morale +1.',
        },
        'skip-it': {
          label: 'Skip it, back to work',
          visibleConsequence: 'Morale -1.',
        },
      },
    },
  },
};

// ============================================================================
// Consumer: Sprout, a brand-new plant-care reminder app with its first users.
// ============================================================================
const consumer: ScenarioDisplay = {
  name: 'Zero to One: Sprout',
  summary:
    'Founding PM for Sprout, a brand-new plant-care reminder app. No revenue yet, a tiny team, and a runway you can count in weeks. Ship small bets, read which ones land, and find the loop that turns curious downloaders into daily users before the money runs out.',
  customers: {
    nadia: 'Nadia (early adopter, opens it most days)',
    theo: 'Theo (downloaded it, has not added a plant)',
  },
  stakeholders: {
    founder: { name: 'Sam (Founder & CEO)', role: 'Leadership' },
    backer: { name: 'Priya (Seed Investor)', role: 'Investor' },
  },
  pbi: {
    'landing-signup': 'App Store Page & Signup Flow',
    'core-loop': 'Core Watering-Reminder Loop',
    'manual-onboarding': 'Hand-Held First Setup (white-glove)',
    'pricing-page': 'Paywall & Premium Upgrade',
    'automated-tests': 'Automated Test Suite',
    'discovery-referral-invite': 'Invite-a-Friend Loop',
    'discovery-power-workflow': 'Power-User Plant Library',
    'discovery-mobile-quickstart': 'Quick-Add Plant by Photo',
    'discovery-templates': 'Starter Care Schedules',
    'discovery-integrations': 'Weather & Calendar Integrations',
    'discovery-activation-nudge': 'First-Plant Activation Nudge',
    'discovery-dashboard': 'Plant Health Dashboard',
    'discovery-export': 'Plant List Export (CSV / PDF)',
    'discovery-instrumentation': 'Product Analytics Instrumentation',
    'event-segment-bet': 'Indoor-Gardener Bundle (new segment bet)',
  },
  events: {
    'segment-signal': {
      narrative:
        'Three serious indoor gardeners signed up this week and kept logging plants, a segment you never targeted. Sam wants to chase it. You only have so many sprints left.',
      options: {
        'chase-segment': {
          label: 'Chase the new segment now',
          visibleConsequence: 'Leadership +1, morale -1. New indoor-gardener PBI injected (effort unknown).',
        },
        'interview-first': {
          label: 'Interview five of them first',
          visibleConsequence: 'No build yet. You learn before you commit.',
        },
        'stay-focused': {
          label: 'Stay on the current bet',
          visibleConsequence: 'Leadership -1, morale +1.',
        },
      },
    },
    'competitor-launch': {
      narrative:
        'A well-funded competitor launches a near-identical plant-care app with a splashy demo. Your early users start asking what makes you different.',
      options: {
        differentiate: {
          label: 'Sharpen your wedge and say it loud',
          visibleConsequence: 'Morale +1. Clearer positioning.',
        },
        'price-match': {
          label: 'Undercut them on price',
          visibleConsequence: 'Revenue -200. Race to the bottom.',
        },
        'ignore-noise': {
          label: 'Ignore it and keep building',
          visibleConsequence: 'Nadia gets nervous.',
        },
      },
    },
    'nadia-loves-it': {
      narrative:
        'Nadia emails you unprompted: she has not killed a plant since she started using Sprout. She is your strongest signal so far.',
      options: {
        amplify: {
          label: 'Build on what she loves and tell Theo',
          visibleConsequence: 'Nadia +2, Theo +1.',
        },
        'gather-quotes': {
          label: 'Ask her for a quote and a referral',
          visibleConsequence: 'Nadia +1.',
        },
        'move-on': {
          label: 'Thank her, move on',
          visibleConsequence: 'Nadia cools off.',
        },
      },
    },
    'runway-check': {
      narrative:
        'Priya pings you: at current burn you have a few months left. She wants to see either tighter spend or real traction by the next check-in.',
      options: {
        'trim-burn': {
          label: 'Trim burn, extend the runway',
          visibleConsequence: 'Investor +2, capacity -1.',
        },
        'show-traction': {
          label: 'Point to the early signal you have',
          visibleConsequence: 'Investor +1.',
        },
        'spend-anyway': {
          label: 'Keep spending to move faster',
          visibleConsequence: 'Investor -2, morale +1.',
        },
      },
    },
    'odd-usage': {
      narrative:
        'Your logs show people using Sprout to track their pet feeding schedules instead of plants, not what you designed the loop for.',
      options: {
        'dig-in': {
          label: 'Talk to them; chase the real job',
          visibleConsequence: 'Pattern logged. Theo +1.',
        },
        'note-it': {
          label: 'Log it as an anomaly for later',
          visibleConsequence: 'Pattern logged.',
        },
        dismiss: {
          label: 'Dismiss it as misuse',
          visibleConsequence: 'Theo -1.',
        },
      },
    },
    'founder-pep': {
      narrative:
        'Sam gathers the small team for an end-of-week check-in. Energy is mixed and people want to know the bets are working.',
      options: {
        rally: {
          label: 'Share the wins and the plan',
          visibleConsequence: 'Morale +2.',
        },
        'quiet-thanks': {
          label: 'Thank them one on one',
          visibleConsequence: 'Morale +1.',
        },
        'skip-it': {
          label: 'Skip it, back to work',
          visibleConsequence: 'Morale -1.',
        },
      },
    },
  },
};

// ============================================================================
// Healthcare: Pulsecheck, a brand-new symptom-tracking app for clinic patients.
// ============================================================================
const healthcare: ScenarioDisplay = {
  name: 'Zero to One: Pulsecheck',
  summary:
    'Founding PM for Pulsecheck, a brand-new symptom-tracking app that one small clinic is piloting. No revenue yet, a tiny team, and a runway you can count in weeks. Ship small bets, read which ones patients actually use, and find the loop that keeps them logging before the money runs out.',
  customers: {
    nadia: 'Nadia (pilot patient, logs most days)',
    theo: 'Theo (enrolled, has not logged yet)',
  },
  stakeholders: {
    founder: { name: 'Sam (Founder & CEO)', role: 'Leadership' },
    backer: { name: 'Priya (Seed Investor)', role: 'Investor' },
  },
  pbi: {
    'landing-signup': 'Patient Signup & Consent Flow',
    'core-loop': 'Core Symptom-Logging Loop',
    'manual-onboarding': 'Hand-Held Patient Setup (white-glove)',
    'pricing-page': 'Clinic Pricing & Paid Plan',
    'automated-tests': 'Automated Test Suite',
    'discovery-referral-invite': 'Refer-a-Clinic Loop',
    'discovery-power-workflow': 'Power-User Symptom Detail',
    'discovery-mobile-quickstart': 'Mobile Quick-Log',
    'discovery-templates': 'Starter Symptom Trackers',
    'discovery-integrations': 'Calendar & Reminder Integrations',
    'discovery-activation-nudge': 'First-Log Activation Nudge',
    'discovery-dashboard': 'Patient Trend Dashboard',
    'discovery-export': 'Visit Summary Export (CSV / PDF)',
    'discovery-instrumentation': 'Product Analytics Instrumentation',
    'event-segment-bet': 'Caregiver-Logging Mode (new segment bet)',
  },
  events: {
    'segment-signal': {
      narrative:
        'Three caregivers signed up this week to log on behalf of a family member and kept at it, a segment you never targeted. Sam wants to chase it. You only have so many sprints left.',
      options: {
        'chase-segment': {
          label: 'Chase the new segment now',
          visibleConsequence: 'Leadership +1, morale -1. New caregiver-mode PBI injected (effort unknown).',
        },
        'interview-first': {
          label: 'Interview five of them first',
          visibleConsequence: 'No build yet. You learn before you commit.',
        },
        'stay-focused': {
          label: 'Stay on the current bet',
          visibleConsequence: 'Leadership -1, morale +1.',
        },
      },
    },
    'competitor-launch': {
      narrative:
        'A well-funded competitor launches a near-identical symptom tracker with a splashy demo. Your pilot patients start asking what makes you different.',
      options: {
        differentiate: {
          label: 'Sharpen your wedge and say it loud',
          visibleConsequence: 'Morale +1. Clearer positioning.',
        },
        'price-match': {
          label: 'Undercut them on clinic pricing',
          visibleConsequence: 'Revenue -200. Race to the bottom.',
        },
        'ignore-noise': {
          label: 'Ignore it and keep building',
          visibleConsequence: 'Nadia gets nervous.',
        },
      },
    },
    'nadia-loves-it': {
      narrative:
        'Nadia emails you unprompted: logging her symptoms made her last clinic visit far more useful. She is your strongest signal so far.',
      options: {
        amplify: {
          label: 'Build on what she loves and tell Theo',
          visibleConsequence: 'Nadia +2, Theo +1.',
        },
        'gather-quotes': {
          label: 'Ask her for a quote and a referral',
          visibleConsequence: 'Nadia +1.',
        },
        'move-on': {
          label: 'Thank her, move on',
          visibleConsequence: 'Nadia cools off.',
        },
      },
    },
    'runway-check': {
      narrative:
        'Priya pings you: at current burn you have a few months left. She wants to see either tighter spend or real traction by the next check-in.',
      options: {
        'trim-burn': {
          label: 'Trim burn, extend the runway',
          visibleConsequence: 'Investor +2, capacity -1.',
        },
        'show-traction': {
          label: 'Point to the early signal you have',
          visibleConsequence: 'Investor +1.',
        },
        'spend-anyway': {
          label: 'Keep spending to move faster',
          visibleConsequence: 'Investor -2, morale +1.',
        },
      },
    },
    'odd-usage': {
      narrative:
        'Your logs show patients using Pulsecheck to jot questions for their doctor instead of logging symptoms, not what you designed the loop for.',
      options: {
        'dig-in': {
          label: 'Talk to them; chase the real job',
          visibleConsequence: 'Pattern logged. Theo +1.',
        },
        'note-it': {
          label: 'Log it as an anomaly for later',
          visibleConsequence: 'Pattern logged.',
        },
        dismiss: {
          label: 'Dismiss it as misuse',
          visibleConsequence: 'Theo -1.',
        },
      },
    },
    'founder-pep': {
      narrative:
        'Sam gathers the small team for an end-of-week check-in. Energy is mixed and people want to know the bets are working.',
      options: {
        rally: {
          label: 'Share the wins and the plan',
          visibleConsequence: 'Morale +2.',
        },
        'quiet-thanks': {
          label: 'Thank them one on one',
          visibleConsequence: 'Morale +1.',
        },
        'skip-it': {
          label: 'Skip it, back to work',
          visibleConsequence: 'Morale -1.',
        },
      },
    },
  },
};

/** All five display packs, keyed by industry id. */
export const ZERO_TO_ONE_DISPLAY: Record<IndustryId, ScenarioDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};
