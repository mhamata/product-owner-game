import type { IndustryId } from '@/curriculum/industries';
import type { ScoreRankDrill } from './types';
import { riceStructure, type RiceRowId } from './rice';

/**
 * RICE drill — DISPLAY LAYER (per industry).
 *
 * Mirrors the capstone's structural/display split (see
 * `@/scenarios/scenario01.display`): every string here is human-readable copy
 * ONLY. The answer-bearing structure — the reach/impact/confidence/effort
 * NUMBERS, the `score` formula, and therefore the correct ranking — lives in
 * `./rice` and is IDENTICAL for every industry. Swapping the display pack
 * renames the features without touching which one wins.
 *
 * Structural slots (fixed by the numbers in `riceStructure`, do not drift):
 *   • `sso`       — RICE ≈ 3000: high reach + high confidence, heaviest effort.
 *                   The #1 pick. Pick a believable "table-stakes, broad-reach"
 *                   feature in each industry.
 *   • `templates` — RICE ≈ 1333: the 0.5-confidence trap (loud-but-unvalidated).
 *                   The #2 pick. Pick something with a vocal-minority pull.
 *   • `audit-log` — RICE ≈ 1200: small reach, high confidence, low effort.
 *                   The #3 pick. Pick a narrow, well-scoped, low-risk feature.
 *
 * The keys below are derived from the structural row ids, so the compiler forces
 * every pack to cover every row. A missing or misspelled id is a build error.
 */

/** Per-row display copy (no answer-bearing fields). */
export interface RiceRowDisplay {
  name: string;
  context: string;
  reasoning: string;
}

/** One industry's complete RICE copy, keyed by structural row id. */
export interface RiceDisplay {
  scenario: string;
  prompt: string;
  rows: Record<RiceRowId, RiceRowDisplay>;
  insight: string;
}

// ============================================================================
// SaaS — the original content, ported verbatim from the legacy riceDrill.
// ============================================================================
const saas: RiceDisplay = {
  scenario: 'SaaS · product backlog',
  prompt:
    'Three candidate features for next quarter. Score each with RICE, then rank them 1–3.',
  rows: {
    sso: {
      name: 'Single sign-on (SSO)',
      context:
        '15,000 seats/qtr ask for it · table-stakes for enterprise deals · backed by solid sales + survey data',
      reasoning:
        'High reach and high confidence carry it despite the heaviest effort — the strongest overall bet.',
    },
    templates: {
      name: 'Shareable templates',
      context:
        '8,000 users/qtr · strong signal, but mostly from a loud forum thread rather than research',
      reasoning:
        'The weakest confidence (0.5) is the tell — halving it would tank the score. This is the factor teams inflate to rescue a pet feature.',
    },
    'audit-log': {
      name: 'Audit log export',
      context:
        '3,000 admins/qtr · unblocks security reviews · well-understood scope',
      reasoning:
        'Small reach, but high confidence and low effort make it a respectable, low-risk pick.',
    },
  },
  insight:
    'Confidence is the lever to defend out loud. Shareable templates looks tempting, but its 0.5 confidence is doing the damage — say so explicitly rather than quietly rounding it up.',
};

// ============================================================================
// Fintech — generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: RiceDisplay = {
  scenario: 'Fintech · product backlog',
  prompt:
    'Three candidate features for next quarter. Score each with RICE, then rank them 1–3.',
  rows: {
    sso: {
      name: 'Single sign-on (SSO)',
      context:
        '15,000 seats/qtr ask for it · table-stakes for finance-team rollouts · backed by solid sales + survey data',
      reasoning:
        'High reach and high confidence carry it despite the heaviest effort — the strongest overall bet.',
    },
    templates: {
      name: 'Shareable expense-policy templates',
      context:
        '8,000 users/qtr · strong signal, but mostly from a loud forum thread rather than research',
      reasoning:
        'The weakest confidence (0.5) is the tell — halving it would tank the score. This is the factor teams inflate to rescue a pet feature.',
    },
    'audit-log': {
      name: 'Audit log export',
      context:
        '3,000 admins/qtr · unblocks compliance reviews · well-understood scope',
      reasoning:
        'Small reach, but high confidence and low effort make it a respectable, low-risk pick.',
    },
  },
  insight:
    'Confidence is the lever to defend out loud. Shareable expense-policy templates looks tempting, but its 0.5 confidence is doing the damage — say so explicitly rather than quietly rounding it up.',
};

// ============================================================================
// Marketplace — two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: RiceDisplay = {
  scenario: 'Marketplace · product backlog',
  prompt:
    'Three candidate features for next quarter. Score each with RICE, then rank them 1–3.',
  rows: {
    sso: {
      name: 'Seller single sign-on (SSO)',
      context:
        '15,000 sellers/qtr ask for it · table-stakes for onboarding larger merchants · backed by solid sales + survey data',
      reasoning:
        'High reach and high confidence carry it despite the heaviest effort — the strongest overall bet.',
    },
    templates: {
      name: 'Shareable listing templates',
      context:
        '8,000 sellers/qtr · strong signal, but mostly from a loud forum thread rather than research',
      reasoning:
        'The weakest confidence (0.5) is the tell — halving it would tank the score. This is the factor teams inflate to rescue a pet feature.',
    },
    'audit-log': {
      name: 'Payout & order export',
      context:
        '3,000 power sellers/qtr · unblocks their bookkeeping · well-understood scope',
      reasoning:
        'Small reach, but high confidence and low effort make it a respectable, low-risk pick.',
    },
  },
  insight:
    'Confidence is the lever to defend out loud. Shareable listing templates looks tempting, but its 0.5 confidence is doing the damage — say so explicitly rather than quietly rounding it up.',
};

// ============================================================================
// Consumer — habit-tracking / journaling app.
// ============================================================================
const consumer: RiceDisplay = {
  scenario: 'Consumer · product backlog',
  prompt:
    'Three candidate features for next quarter. Score each with RICE, then rank them 1–3.',
  rows: {
    sso: {
      name: 'Social login (Apple / Google)',
      context:
        '15,000 signups/qtr would use it · removes the biggest first-run drop-off · backed by solid funnel + survey data',
      reasoning:
        'High reach and high confidence carry it despite the heaviest effort — the strongest overall bet.',
    },
    templates: {
      name: 'Shareable goal templates',
      context:
        '8,000 users/qtr · strong signal, but mostly from a loud forum thread rather than research',
      reasoning:
        'The weakest confidence (0.5) is the tell — halving it would tank the score. This is the factor teams inflate to rescue a pet feature.',
    },
    'audit-log': {
      name: 'Personal data export',
      context:
        '3,000 power users/qtr · unblocks privacy & portability requests · well-understood scope',
      reasoning:
        'Small reach, but high confidence and low effort make it a respectable, low-risk pick.',
    },
  },
  insight:
    'Confidence is the lever to defend out loud. Shareable goal templates looks tempting, but its 0.5 confidence is doing the damage — say so explicitly rather than quietly rounding it up.',
};

// ============================================================================
// Healthcare — clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: RiceDisplay = {
  scenario: 'Healthcare · product backlog',
  prompt:
    'Three candidate features for next quarter. Score each with RICE, then rank them 1–3.',
  rows: {
    sso: {
      name: 'Single sign-on (SSO)',
      context:
        '15,000 staff seats/qtr ask for it · table-stakes for multi-clinic rollouts · backed by solid sales + survey data',
      reasoning:
        'High reach and high confidence carry it despite the heaviest effort — the strongest overall bet.',
    },
    templates: {
      name: 'Shareable intake-form templates',
      context:
        '8,000 staff/qtr · strong signal, but mostly from a loud forum thread rather than research',
      reasoning:
        'The weakest confidence (0.5) is the tell — halving it would tank the score. This is the factor teams inflate to rescue a pet feature.',
    },
    'audit-log': {
      name: 'Audit log export',
      context:
        '3,000 admins/qtr · unblocks HIPAA security reviews · well-understood scope',
      reasoning:
        'Small reach, but high confidence and low effort make it a respectable, low-risk pick.',
    },
  },
  insight:
    'Confidence is the lever to defend out loud. Shareable intake-form templates looks tempting, but its 0.5 confidence is doing the damage — say so explicitly rather than quietly rounding it up.',
};

/** All five RICE display packs, keyed by industry id. */
export const RICE_DISPLAY: Record<IndustryId, RiceDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the RICE drill for a given home industry: the shared answer-bearing
 * structure (`riceStructure`) with the industry's display strings merged on by
 * row id. The numbers — and therefore the correct ranking — are unchanged.
 */
export function resolveRiceDrill(industry: IndustryId): ScoreRankDrill {
  const display = RICE_DISPLAY[industry];
  return {
    scenario: display.scenario,
    prompt: display.prompt,
    formula: riceStructure.formula,
    factors: riceStructure.factors,
    rows: riceStructure.rows.map((row) => {
      const d = display.rows[row.id as RiceRowId];
      return {
        id: row.id,
        factors: row.factors,
        name: d.name,
        context: d.context,
        reasoning: d.reasoning,
      };
    }),
    score: riceStructure.score,
    insight: display.insight,
  };
}
