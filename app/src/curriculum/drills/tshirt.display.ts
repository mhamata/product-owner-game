import type { IndustryId } from '@/curriculum/industries';
import type { SizingDrill } from './types';
import { tshirtStructure, type TshirtStoryId } from './tshirt';

/**
 * T-shirt sizing drill — DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY. The size legend and the correct size per story live
 * in `./tshirt` and never change. Mirrors `@/scenarios/scenario01.display`.
 *
 * Structural slots (fixed `correct` size — pick a believable story per one):
 *   • `locale-toggle`    → S: small in concept but touches many surfaces (~2–3 days).
 *   • `sso`              → L: a third-party integration with several flows (~2 sprints).
 *   • `copy-fix`         → XS: a copy/string change plus a quick test (~1 day).
 *   • `billing-platform` → XXL: a multi-quarter platform — decompose before a sprint.
 *   • `activity-feed`    → M: a scoped feed with light moderation (~1 sprint).
 *
 * The `why` for each story must keep explaining ITS size honestly (e.g. the XS
 * really is a one-day change, the XXL really is multi-quarter), so the relative
 * answer stays self-evidently correct. Keys derive from the structural story
 * ids → the compiler forces full coverage.
 */

export interface SizingStoryDisplay {
  title: string;
  description: string;
  why: string;
}

export interface TshirtDisplay {
  scenario: string;
  prompt: string;
  stories: Record<TshirtStoryId, SizingStoryDisplay>;
  insight: string;
}

const PROMPT =
  'Size each story relative to the others. No absolute hours — relative effort only.';
const INSIGHT =
  'Rule of thumb: anything bigger than M should be broken down before it enters a sprint. XXL isn’t an estimate — it’s a flag that says "decompose me first."';

// ============================================================================
// SaaS — original content, ported verbatim from the legacy tshirtDrill.
// ============================================================================
const saas: TshirtDisplay = {
  scenario: 'SaaS · roadmap sizing',
  prompt: PROMPT,
  stories: {
    'locale-toggle': {
      title: 'Locale / timezone preference toggle',
      description: 'Let users set their locale so dates and times render correctly.',
      why: 'Small in concept, but it touches every date/time component. 2–3 days of careful work.',
    },
    sso: {
      title: 'Enterprise SSO (SAML)',
      description:
        'Add SAML single sign-on: identity-provider integration, just-in-time provisioning, admin config.',
      why: 'Third-party integration plus several flows and edge cases. Roughly two sprints.',
    },
    'copy-fix': {
      title: 'Fix incorrect empty-state copy',
      description: 'A dashboard empty state shows the wrong message. Update the string and test.',
      why: 'Copy change plus a quick test. About a day.',
    },
    'billing-platform': {
      title: 'Usage-based billing platform',
      description:
        'Full metering pipeline, invoicing, proration, tax handling, and a customer billing portal.',
      why: 'Multi-quarter. Break it down before any sprint commitment — metering alone is an L.',
    },
    'activity-feed': {
      title: 'Team activity feed (v1)',
      description: 'A scoped feed with posts and comments, plus basic moderation controls.',
      why: 'One sprint of focused work. Moderation adds a little scope over a plain feed.',
    },
  },
  insight: INSIGHT,
};

// ============================================================================
// Fintech — generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: TshirtDisplay = {
  scenario: 'Fintech · roadmap sizing',
  prompt: PROMPT,
  stories: {
    'locale-toggle': {
      title: 'Currency / locale preference toggle',
      description: 'Let users set their currency and locale so amounts and dates render correctly.',
      why: 'Small in concept, but it touches every amount/date component. 2–3 days of careful work.',
    },
    sso: {
      title: 'Enterprise SSO (SAML)',
      description:
        'Add SAML single sign-on: identity-provider integration, just-in-time provisioning, admin config.',
      why: 'Third-party integration plus several flows and edge cases. Roughly two sprints.',
    },
    'copy-fix': {
      title: 'Fix incorrect empty-state copy',
      description: 'An expense-report empty state shows the wrong message. Update the string and test.',
      why: 'Copy change plus a quick test. About a day.',
    },
    'billing-platform': {
      title: 'Usage-based billing platform',
      description:
        'Full metering pipeline, invoicing, proration, tax handling, and a customer billing portal.',
      why: 'Multi-quarter. Break it down before any sprint commitment — metering alone is an L.',
    },
    'activity-feed': {
      title: 'Team expense activity feed (v1)',
      description: 'A scoped feed with expense posts and comments, plus basic moderation controls.',
      why: 'One sprint of focused work. Moderation adds a little scope over a plain feed.',
    },
  },
  insight: INSIGHT,
};

// ============================================================================
// Marketplace — two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: TshirtDisplay = {
  scenario: 'Marketplace · roadmap sizing',
  prompt: PROMPT,
  stories: {
    'locale-toggle': {
      title: 'Currency / locale preference toggle',
      description: 'Let buyers set their currency and locale so prices and dates render correctly.',
      why: 'Small in concept, but it touches every price/date component. 2–3 days of careful work.',
    },
    sso: {
      title: 'Seller SSO (SAML)',
      description:
        'Add SAML single sign-on for merchant accounts: identity-provider integration, provisioning, admin config.',
      why: 'Third-party integration plus several flows and edge cases. Roughly two sprints.',
    },
    'copy-fix': {
      title: 'Fix incorrect empty-state copy',
      description: 'A seller dashboard empty state shows the wrong message. Update the string and test.',
      why: 'Copy change plus a quick test. About a day.',
    },
    'billing-platform': {
      title: 'Seller payouts platform',
      description:
        'Full payouts pipeline, fee deduction, proration, tax handling, and a seller earnings portal.',
      why: 'Multi-quarter. Break it down before any sprint commitment — the payouts pipeline alone is an L.',
    },
    'activity-feed': {
      title: 'Buyer reviews feed (v1)',
      description: 'A scoped feed with buyer reviews and seller replies, plus basic moderation controls.',
      why: 'One sprint of focused work. Moderation adds a little scope over a plain feed.',
    },
  },
  insight: INSIGHT,
};

// ============================================================================
// Consumer — habit-tracking / journaling app.
// ============================================================================
const consumer: TshirtDisplay = {
  scenario: 'Consumer · roadmap sizing',
  prompt: PROMPT,
  stories: {
    'locale-toggle': {
      title: 'Locale / timezone preference toggle',
      description: 'Let users set their locale so streak dates and times render correctly.',
      why: 'Small in concept, but it touches every date/time component. 2–3 days of careful work.',
    },
    sso: {
      title: 'Social login (Apple / Google)',
      description:
        'Add third-party sign-in: provider integration, account linking, and first-run provisioning.',
      why: 'Third-party integration plus several flows and edge cases. Roughly two sprints.',
    },
    'copy-fix': {
      title: 'Fix incorrect empty-state copy',
      description: 'A home-screen empty state shows the wrong message. Update the string and test.',
      why: 'Copy change plus a quick test. About a day.',
    },
    'billing-platform': {
      title: 'Subscription billing platform',
      description:
        'Full metering pipeline, trials, proration, tax handling, and a self-serve subscription portal.',
      why: 'Multi-quarter. Break it down before any sprint commitment — metering alone is an L.',
    },
    'activity-feed': {
      title: 'Friends activity feed (v1)',
      description: 'A scoped feed with friends’ check-ins and cheers, plus basic moderation controls.',
      why: 'One sprint of focused work. Moderation adds a little scope over a plain feed.',
    },
  },
  insight: INSIGHT,
};

// ============================================================================
// Healthcare — clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: TshirtDisplay = {
  scenario: 'Healthcare · roadmap sizing',
  prompt: PROMPT,
  stories: {
    'locale-toggle': {
      title: 'Locale / timezone preference toggle',
      description: 'Let clinics set their locale so appointment dates and times render correctly.',
      why: 'Small in concept, but it touches every date/time component. 2–3 days of careful work.',
    },
    sso: {
      title: 'Enterprise SSO (SAML)',
      description:
        'Add SAML single sign-on for clinic staff: identity-provider integration, provisioning, admin config.',
      why: 'Third-party integration plus several flows and edge cases. Roughly two sprints.',
    },
    'copy-fix': {
      title: 'Fix incorrect empty-state copy',
      description: 'A schedule empty state shows the wrong message. Update the string and test.',
      why: 'Copy change plus a quick test. About a day.',
    },
    'billing-platform': {
      title: 'Insurance claims & billing platform',
      description:
        'Full claims pipeline, clearinghouse submission, denials handling, and a patient billing portal.',
      why: 'Multi-quarter. Break it down before any sprint commitment — the claims pipeline alone is an L.',
    },
    'activity-feed': {
      title: 'Care-team notes feed (v1)',
      description: 'A scoped feed with care-team notes and comments, plus basic moderation controls.',
      why: 'One sprint of focused work. Moderation adds a little scope over a plain feed.',
    },
  },
  insight: INSIGHT,
};

/** All five T-shirt display packs, keyed by industry id. */
export const TSHIRT_DISPLAY: Record<IndustryId, TshirtDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the T-shirt sizing drill for a given home industry: the shared
 * legend + answer key with the industry's story strings merged on by id. The
 * correct size per story is unchanged.
 */
export function resolveTshirtDrill(industry: IndustryId): SizingDrill {
  const display = TSHIRT_DISPLAY[industry];
  return {
    scenario: display.scenario,
    prompt: display.prompt,
    legend: tshirtStructure.legend,
    stories: tshirtStructure.stories.map((story) => {
      const d = display.stories[story.id as TshirtStoryId];
      return {
        id: story.id,
        correct: story.correct,
        title: d.title,
        description: d.description,
        why: d.why,
      };
    }),
    insight: display.insight,
  };
}
