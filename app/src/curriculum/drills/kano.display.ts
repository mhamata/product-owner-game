import type { IndustryId } from '@/curriculum/industries';
import type { ClassificationDrill } from './types';
import { kanoStructure, type KanoCategory, type KanoItemId } from './kano';

/**
 * Kano drill: DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY. The four categories and the correct category per
 * item live in `./kano` and never change. Mirrors
 * `@/scenarios/scenario01.display`.
 *
 * Structural slots (fixed `correct` category, pick a believable item per one):
 *   • `login`          → Basic: expected; missing = anger, present = unnoticed.
 *   • `load-speed`     → Performance: more is better, continuously compared.
 *   • `ai-suggestions` → Delighter: unexpected; great execution earns word of mouth.
 *   • `theme-color`    → Indifferent: almost nobody cares.
 *   • `dark-mode`      → Basic: the textbook category-drift example (kept stable
 *                        across industries because the insight names it).
 *   • `uptime`         → Performance: more nines = more satisfaction.
 *
 * Keys derive from the structural item ids → the compiler forces full coverage.
 */

export interface KanoItemDisplay {
  name: string;
  why: string;
}

export interface KanoDisplay {
  scenario: string;
  prompt: string;
  items: Record<KanoItemId, KanoItemDisplay>;
  insight: string;
}

// The dark-mode item is the canonical "category drift" teaching example and the
// insight calls it out by name; its copy is intentionally identical in every
// pack so the lesson lands the same way regardless of industry.
const DARK_MODE: KanoItemDisplay = {
  name: 'Dark mode',
  why: 'A classic category drift: Delighter (2016) → Performance → now Basic; its absence triggers complaints.',
};

const KANO_INSIGHT =
  'Dark mode is the textbook "category drift" example: Delighters decay into Basics over time. Re-survey periodically; yesterday’s wow is today’s table stakes.';

// ============================================================================
// SaaS: original content, ported verbatim from the legacy kanoDrill.
// ============================================================================
const saas: KanoDisplay = {
  scenario: 'SaaS · mainstream segment',
  prompt:
    'For a mainstream SaaS audience today, classify each feature on the Kano model.',
  items: {
    login: {
      name: 'Secure login with MFA',
      why: 'Expected. Missing = angry users and failed security reviews. Present = nobody notices.',
    },
    'load-speed': {
      name: 'Page load speed',
      why: 'More is better. Users continuously compare apps on responsiveness.',
    },
    'ai-suggestions': {
      name: 'AI-generated content suggestions',
      why: 'Most users don’t expect it; when it’s good it creates genuine surprise and word of mouth.',
    },
    'theme-color': {
      name: 'Custom accent-color picker',
      why: 'Almost nobody cares. Engineering effort with little impact on either axis.',
    },
    'dark-mode': DARK_MODE,
    uptime: {
      name: 'Reliable uptime / SLA',
      why: 'More nines = more satisfaction for serious customers. Scales with the number.',
    },
  },
  insight: KANO_INSIGHT,
};

// ============================================================================
// Fintech: generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: KanoDisplay = {
  scenario: 'Fintech · mainstream segment',
  prompt:
    'For a mainstream finance-team audience today, classify each feature on the Kano model.',
  items: {
    login: {
      name: 'Secure login with MFA',
      why: 'Expected. Missing = angry users and failed compliance reviews. Present = nobody notices.',
    },
    'load-speed': {
      name: 'Report load speed',
      why: 'More is better. Finance teams continuously compare tools on responsiveness.',
    },
    'ai-suggestions': {
      name: 'AI-suggested expense categories',
      why: 'Most users don’t expect it; when it’s good it creates genuine surprise and word of mouth.',
    },
    'theme-color': {
      name: 'Custom accent-color picker',
      why: 'Almost nobody cares. Engineering effort with little impact on either axis.',
    },
    'dark-mode': DARK_MODE,
    uptime: {
      name: 'Reliable uptime / SLA',
      why: 'More nines = more satisfaction for serious customers. Scales with the number.',
    },
  },
  insight: KANO_INSIGHT,
};

// ============================================================================
// Marketplace: two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: KanoDisplay = {
  scenario: 'Marketplace · mainstream segment',
  prompt:
    'For a mainstream seller audience today, classify each feature on the Kano model.',
  items: {
    login: {
      name: 'Secure login with MFA',
      why: 'Expected. Missing = angry sellers and failed trust reviews. Present = nobody notices.',
    },
    'load-speed': {
      name: 'Search & listing load speed',
      why: 'More is better. Buyers and sellers continuously compare on responsiveness.',
    },
    'ai-suggestions': {
      name: 'AI-generated listing descriptions',
      why: 'Most sellers don’t expect it; when it’s good it creates genuine surprise and word of mouth.',
    },
    'theme-color': {
      name: 'Custom storefront accent-color picker',
      why: 'Almost nobody cares. Engineering effort with little impact on either axis.',
    },
    'dark-mode': DARK_MODE,
    uptime: {
      name: 'Reliable uptime / SLA',
      why: 'More nines = more satisfaction for high-volume sellers. Scales with the number.',
    },
  },
  insight: KANO_INSIGHT,
};

// ============================================================================
// Consumer: habit-tracking / journaling app.
// ============================================================================
const consumer: KanoDisplay = {
  scenario: 'Consumer · mainstream segment',
  prompt:
    'For a mainstream consumer audience today, classify each feature on the Kano model.',
  items: {
    login: {
      name: 'Secure login with MFA',
      why: 'Expected. Missing = angry users and trust concerns. Present = nobody notices.',
    },
    'load-speed': {
      name: 'App launch speed',
      why: 'More is better. Users continuously compare apps on responsiveness.',
    },
    'ai-suggestions': {
      name: 'AI-generated habit insights',
      why: 'Most users don’t expect it; when it’s good it creates genuine surprise and word of mouth.',
    },
    'theme-color': {
      name: 'Custom accent-color picker',
      why: 'Almost nobody cares. Engineering effort with little impact on either axis.',
    },
    'dark-mode': DARK_MODE,
    uptime: {
      name: 'Reliable sync / uptime',
      why: 'More reliability = more satisfaction for daily users. Scales with the number.',
    },
  },
  insight: KANO_INSIGHT,
};

// ============================================================================
// Healthcare: clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: KanoDisplay = {
  scenario: 'Healthcare · mainstream segment',
  prompt:
    'For a mainstream clinic audience today, classify each feature on the Kano model.',
  items: {
    login: {
      name: 'Secure login with MFA',
      why: 'Expected. Missing = angry staff and failed HIPAA reviews. Present = nobody notices.',
    },
    'load-speed': {
      name: 'Chart load speed',
      why: 'More is better. Clinicians continuously compare tools on responsiveness.',
    },
    'ai-suggestions': {
      name: 'AI-drafted visit summaries',
      why: 'Most clinicians don’t expect it; when it’s good it creates genuine surprise and word of mouth.',
    },
    'theme-color': {
      name: 'Custom accent-color picker',
      why: 'Almost nobody cares. Engineering effort with little impact on either axis.',
    },
    'dark-mode': DARK_MODE,
    uptime: {
      name: 'Reliable uptime / SLA',
      why: 'More nines = more satisfaction for busy clinics. Scales with the number.',
    },
  },
  insight: KANO_INSIGHT,
};

/** All five Kano display packs, keyed by industry id. */
export const KANO_DISPLAY: Record<IndustryId, KanoDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the Kano drill for a given home industry: the shared categories +
 * answer key with the industry's item strings merged on by id. The correct
 * category per item is unchanged.
 */
export function resolveKanoDrill(
  industry: IndustryId,
): ClassificationDrill<KanoCategory> {
  const display = KANO_DISPLAY[industry];
  return {
    scenario: display.scenario,
    prompt: display.prompt,
    buckets: kanoStructure.buckets,
    items: kanoStructure.items.map((item) => {
      const d = display.items[item.id as KanoItemId];
      return { id: item.id, correct: item.correct, name: d.name, why: d.why };
    }),
    insight: display.insight,
  };
}
