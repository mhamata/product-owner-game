import type { IndustryId } from '@/curriculum/industries';
import type { ClassificationDrill } from './types';
import {
  moscowStructure,
  type MoscowBucket,
  type MoscowItemId,
} from './moscow';

/**
 * MoSCoW drill: DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY. The four buckets and the correct bucket per item
 * live in `./moscow` and never change. Mirrors `@/scenarios/scenario01.display`.
 *
 * Structural slots (fixed `correct` bucket, pick a believable item for each):
 *   • `auth`          → Must: without sign-in/access nobody can use it.
 *   • `gdpr`          → Must: a legal/regulatory non-negotiable for launch.
 *   • `notifications` → Should: drives engagement, but ships as a fast-follow.
 *   • `activity-feed` → Could: nice differentiation, not required for v1.
 *   • `native-mobile` → Won't: explicitly out, responsive web covers launch.
 *   • `dark-mode`     → Should: classic Could→Should drift; absence gets noted.
 *   • `chat-support`  → Could: would help, but email support is acceptable.
 *   • `public-api`    → Won't: not a launch concern; out to keep focus.
 *
 * Keys derive from the structural item ids, so the compiler forces full
 * coverage of every pack.
 */

/** One item's display copy (no answer-bearing fields). */
export interface MoscowItemDisplay {
  name: string;
  why: string;
}

export interface MoscowDisplay {
  scenario: string;
  prompt: string;
  items: Record<MoscowItemId, MoscowItemDisplay>;
  insight: string;
}

// ============================================================================
// SaaS: original content, ported verbatim from the legacy moscowDrill.
// ============================================================================
const saas: MoscowDisplay = {
  scenario: 'SaaS · v1 launch scope',
  prompt:
    'You’re scoping the v1 launch of a team-collaboration app. Sort each feature into a MoSCoW bucket.',
  items: {
    auth: {
      name: 'Email + password authentication',
      why: 'Nobody can use the product without an account. "Must" means the release fails without it.',
    },
    gdpr: {
      name: 'GDPR data-export & delete',
      why: 'Legal non-negotiable for launching in the EU. Shipping without it = compliance failure.',
    },
    notifications: {
      name: 'In-app notifications',
      why: 'Important for engagement, but the product works at launch without it. Fast-follow.',
    },
    'activity-feed': {
      name: 'Team activity feed',
      why: 'Nice differentiation, but not required for v1. Could ship in a later release.',
    },
    'native-mobile': {
      name: 'Native mobile apps',
      why: "Explicitly out of scope for v1. Responsive web covers launch. Name it Won't so it stops resurfacing.",
    },
    'dark-mode': {
      name: 'Dark mode',
      why: 'Used to be a Could; now a Should. Its absence gets called out in reviews.',
    },
    'chat-support': {
      name: 'In-app live chat support',
      why: 'Would help activation, but email support is acceptable for launch.',
    },
    'public-api': {
      name: 'Public REST API',
      why: 'Not a launch concern. Explicitly out of scope to keep the team focused.',
    },
  },
  insight:
    'The common mistake is putting everything in Must. A healthy MoSCoW keeps Must to a handful of items (roughly 60% of capacity) so there’s room to absorb surprises.',
};

// ============================================================================
// Fintech: generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: MoscowDisplay = {
  scenario: 'Fintech · v1 launch scope',
  prompt:
    'You’re scoping the v1 launch of an expense-management app. Sort each feature into a MoSCoW bucket.',
  items: {
    auth: {
      name: 'Email + password authentication',
      why: 'Nobody can use the product without an account. "Must" means the release fails without it.',
    },
    gdpr: {
      name: 'SOC 2 access controls & audit trail',
      why: 'A compliance non-negotiable before any finance team will adopt. Shipping without it = launch blocked.',
    },
    notifications: {
      name: 'In-app spend alerts',
      why: 'Important for engagement, but the product works at launch without it. Fast-follow.',
    },
    'activity-feed': {
      name: 'Team expense activity feed',
      why: 'Nice differentiation, but not required for v1. Could ship in a later release.',
    },
    'native-mobile': {
      name: 'Native mobile receipt-capture apps',
      why: "Explicitly out of scope for v1. Responsive web covers launch. Name it Won't so it stops resurfacing.",
    },
    'dark-mode': {
      name: 'Dark mode',
      why: 'Used to be a Could; now a Should. Its absence gets called out in reviews.',
    },
    'chat-support': {
      name: 'In-app live chat support',
      why: 'Would help activation, but email support is acceptable for launch.',
    },
    'public-api': {
      name: 'Public reporting API',
      why: 'Not a launch concern. Explicitly out of scope to keep the team focused.',
    },
  },
  insight:
    'The common mistake is putting everything in Must. A healthy MoSCoW keeps Must to a handful of items (roughly 60% of capacity) so there’s room to absorb surprises.',
};

// ============================================================================
// Marketplace: two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: MoscowDisplay = {
  scenario: 'Marketplace · v1 launch scope',
  prompt:
    'You’re scoping the v1 launch of a seller marketplace. Sort each feature into a MoSCoW bucket.',
  items: {
    auth: {
      name: 'Seller + buyer authentication',
      why: 'Nobody can transact without an account. "Must" means the release fails without it.',
    },
    gdpr: {
      name: 'GDPR data-export & delete',
      why: 'Legal non-negotiable for launching in the EU. Shipping without it = compliance failure.',
    },
    notifications: {
      name: 'In-app order notifications',
      why: 'Important for engagement, but the product works at launch without it. Fast-follow.',
    },
    'activity-feed': {
      name: 'Buyer reviews feed',
      why: 'Nice differentiation, but not required for v1. Could ship in a later release.',
    },
    'native-mobile': {
      name: 'Native mobile seller apps',
      why: "Explicitly out of scope for v1. Responsive web covers launch. Name it Won't so it stops resurfacing.",
    },
    'dark-mode': {
      name: 'Dark mode',
      why: 'Used to be a Could; now a Should. Its absence gets called out in reviews.',
    },
    'chat-support': {
      name: 'In-app buyer-seller chat support',
      why: 'Would help activation, but email support is acceptable for launch.',
    },
    'public-api': {
      name: 'Public catalog API',
      why: 'Not a launch concern. Explicitly out of scope to keep the team focused.',
    },
  },
  insight:
    'The common mistake is putting everything in Must. A healthy MoSCoW keeps Must to a handful of items (roughly 60% of capacity) so there’s room to absorb surprises.',
};

// ============================================================================
// Consumer: habit-tracking / journaling app.
// ============================================================================
const consumer: MoscowDisplay = {
  scenario: 'Consumer · v1 launch scope',
  prompt:
    'You’re scoping the v1 launch of a habit-tracking app. Sort each feature into a MoSCoW bucket.',
  items: {
    auth: {
      name: 'Email + password sign-up',
      why: 'Nobody can save progress without an account. "Must" means the release fails without it.',
    },
    gdpr: {
      name: 'GDPR data-export & delete',
      why: 'Legal non-negotiable for launching in the EU. Shipping without it = compliance failure.',
    },
    notifications: {
      name: 'Habit reminder notifications',
      why: 'Important for engagement, but the product works at launch without it. Fast-follow.',
    },
    'activity-feed': {
      name: 'Friends activity feed',
      why: 'Nice differentiation, but not required for v1. Could ship in a later release.',
    },
    'native-mobile': {
      name: 'Native smartwatch app',
      why: "Explicitly out of scope for v1. The phone app covers launch. Name it Won't so it stops resurfacing.",
    },
    'dark-mode': {
      name: 'Dark mode',
      why: 'Used to be a Could; now a Should. Its absence gets called out in reviews.',
    },
    'chat-support': {
      name: 'In-app live chat support',
      why: 'Would help activation, but email support is acceptable for launch.',
    },
    'public-api': {
      name: 'Public data-export API',
      why: 'Not a launch concern. Explicitly out of scope to keep the team focused.',
    },
  },
  insight:
    'The common mistake is putting everything in Must. A healthy MoSCoW keeps Must to a handful of items (roughly 60% of capacity) so there’s room to absorb surprises.',
};

// ============================================================================
// Healthcare: clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: MoscowDisplay = {
  scenario: 'Healthcare · v1 launch scope',
  prompt:
    'You’re scoping the v1 launch of a clinic intake app. Sort each feature into a MoSCoW bucket.',
  items: {
    auth: {
      name: 'Staff authentication',
      why: 'No clinician can use the product without an account. "Must" means the release fails without it.',
    },
    gdpr: {
      name: 'HIPAA access controls & audit log',
      why: 'A legal non-negotiable for handling patient data. Shipping without it = compliance failure.',
    },
    notifications: {
      name: 'Appointment reminder notifications',
      why: 'Important for engagement, but the product works at launch without it. Fast-follow.',
    },
    'activity-feed': {
      name: 'Care-team notes feed',
      why: 'Nice differentiation, but not required for v1. Could ship in a later release.',
    },
    'native-mobile': {
      name: 'Native patient mobile apps',
      why: "Explicitly out of scope for v1. Responsive web covers launch. Name it Won't so it stops resurfacing.",
    },
    'dark-mode': {
      name: 'Dark mode',
      why: 'Used to be a Could; now a Should. Its absence gets called out in reviews.',
    },
    'chat-support': {
      name: 'In-app live chat support',
      why: 'Would help activation, but email support is acceptable for launch.',
    },
    'public-api': {
      name: 'Public FHIR API',
      why: 'Not a launch concern. Explicitly out of scope to keep the team focused.',
    },
  },
  insight:
    'The common mistake is putting everything in Must. A healthy MoSCoW keeps Must to a handful of items (roughly 60% of capacity) so there’s room to absorb surprises.',
};

/** All five MoSCoW display packs, keyed by industry id. */
export const MOSCOW_DISPLAY: Record<IndustryId, MoscowDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the MoSCoW drill for a given home industry: the shared buckets +
 * answer key with the industry's item strings merged on by id. The correct
 * bucket per item is unchanged.
 */
export function resolveMoscowDrill(
  industry: IndustryId,
): ClassificationDrill<MoscowBucket> {
  const display = MOSCOW_DISPLAY[industry];
  return {
    scenario: display.scenario,
    prompt: display.prompt,
    buckets: moscowStructure.buckets,
    items: moscowStructure.items.map((item) => {
      const d = display.items[item.id as MoscowItemId];
      return { id: item.id, correct: item.correct, name: d.name, why: d.why };
    }),
    insight: display.insight,
  };
}
