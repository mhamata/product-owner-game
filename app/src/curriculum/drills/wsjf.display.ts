import type { IndustryId } from '@/curriculum/industries';
import type { ScoreRankDrill } from './types';
import { wsjfStructure, type WsjfRowId } from './wsjf';

/**
 * WSJF drill — DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY; the Fibonacci NUMBERS and the `score` formula (and
 * therefore the correct ranking) live in `./wsjf` and never change. See
 * `@/scenarios/scenario01.display` for the pattern this mirrors.
 *
 * Structural slots (fixed by the numbers, do not drift):
 *   • `compliance`     — ranks #1: a hard-deadline item (time criticality 13).
 *                        Pick an industry compliance/deadline obligation.
 *   • `dashboard`      — ranks #2: high everyday value, no deadline, modest size.
 *   • `cost-optimizer` — ranks #3: soft value, no urgency — always loses to a
 *                        deadline.
 *   • `rewrite`        — ranks LAST despite the highest raw value: an enormous
 *                        (size 21) multi-quarter platform effort.
 *
 * Keys derive from the structural row ids, so the compiler forces full coverage.
 */

export interface WsjfRowDisplay {
  name: string;
  context: string;
  reasoning: string;
}

export interface WsjfDisplay {
  scenario: string;
  prompt: string;
  rows: Record<WsjfRowId, WsjfRowDisplay>;
  insight: string;
}

// ============================================================================
// SaaS — original content, ported verbatim from the legacy wsjfDrill.
// ============================================================================
const saas: WsjfDisplay = {
  scenario: 'SaaS · quarterly planning',
  prompt:
    'Cost of Delay made concrete. Score each item with WSJF, then rank them by what to do first.',
  rows: {
    compliance: {
      name: 'SOC 2 evidence automation',
      context:
        'Hard audit date this quarter · slipping it risks losing enterprise deals in the pipeline',
      reasoning:
        'A fixed deadline drives time criticality sky-high. Even at a sizeable 13, the ratio wins — urgency carries it.',
    },
    dashboard: {
      name: 'Usage analytics dashboard',
      context:
        'High everyday value for customers · but no deadline pressure and a modest build',
      reasoning:
        'Genuinely valuable, but with no clock running its time criticality is low. Still ranks well thanks to a small size.',
    },
    'cost-optimizer': {
      name: 'Cloud cost optimizer',
      context:
        'Saves infra spend · nice to have, but no external pressure to ship it now',
      reasoning:
        'Soft value, no urgency — the kind of work that always loses to anything with a deadline.',
    },
    rewrite: {
      name: 'Event-driven platform rewrite',
      context:
        'Huge long-term payoff · but a multi-quarter effort with no near-term forcing function',
      reasoning:
        'Highest raw value of the four — and it still ranks last. The enormous size (21) crushes the ratio.',
    },
  },
  insight:
    'WSJF’s gift is that the platform rewrite — the most valuable item — ranks last once you divide by size. Small-but-urgent beats large-but-transformative when the horizon is short.',
};

// ============================================================================
// Fintech — generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: WsjfDisplay = {
  scenario: 'Fintech · quarterly planning',
  prompt:
    'Cost of Delay made concrete. Score each item with WSJF, then rank them by what to do first.',
  rows: {
    compliance: {
      name: 'SOC 2 evidence automation',
      context:
        'Hard audit date this quarter · slipping it risks losing enterprise deals in the pipeline',
      reasoning:
        'A fixed deadline drives time criticality sky-high. Even at a sizeable 13, the ratio wins — urgency carries it.',
    },
    dashboard: {
      name: 'Real-time spend dashboard',
      context:
        'High everyday value for finance teams · but no deadline pressure and a modest build',
      reasoning:
        'Genuinely valuable, but with no clock running its time criticality is low. Still ranks well thanks to a small size.',
    },
    'cost-optimizer': {
      name: 'Cloud cost optimizer',
      context:
        'Saves infra spend · nice to have, but no external pressure to ship it now',
      reasoning:
        'Soft value, no urgency — the kind of work that always loses to anything with a deadline.',
    },
    rewrite: {
      name: 'Event-driven ledger rewrite',
      context:
        'Huge long-term payoff · but a multi-quarter effort with no near-term forcing function',
      reasoning:
        'Highest raw value of the four — and it still ranks last. The enormous size (21) crushes the ratio.',
    },
  },
  insight:
    'WSJF’s gift is that the ledger rewrite — the most valuable item — ranks last once you divide by size. Small-but-urgent beats large-but-transformative when the horizon is short.',
};

// ============================================================================
// Marketplace — two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: WsjfDisplay = {
  scenario: 'Marketplace · quarterly planning',
  prompt:
    'Cost of Delay made concrete. Score each item with WSJF, then rank them by what to do first.',
  rows: {
    compliance: {
      name: 'Seller tax-reporting (1099) automation',
      context:
        'Hard regulatory filing date this quarter · slipping it risks fines and seller churn',
      reasoning:
        'A fixed deadline drives time criticality sky-high. Even at a sizeable 13, the ratio wins — urgency carries it.',
    },
    dashboard: {
      name: 'Seller sales dashboard',
      context:
        'High everyday value for merchants · but no deadline pressure and a modest build',
      reasoning:
        'Genuinely valuable, but with no clock running its time criticality is low. Still ranks well thanks to a small size.',
    },
    'cost-optimizer': {
      name: 'Cloud cost optimizer',
      context:
        'Saves infra spend · nice to have, but no external pressure to ship it now',
      reasoning:
        'Soft value, no urgency — the kind of work that always loses to anything with a deadline.',
    },
    rewrite: {
      name: 'Event-driven search & catalog rewrite',
      context:
        'Huge long-term payoff · but a multi-quarter effort with no near-term forcing function',
      reasoning:
        'Highest raw value of the four — and it still ranks last. The enormous size (21) crushes the ratio.',
    },
  },
  insight:
    'WSJF’s gift is that the search & catalog rewrite — the most valuable item — ranks last once you divide by size. Small-but-urgent beats large-but-transformative when the horizon is short.',
};

// ============================================================================
// Consumer — habit-tracking / journaling app.
// ============================================================================
const consumer: WsjfDisplay = {
  scenario: 'Consumer · quarterly planning',
  prompt:
    'Cost of Delay made concrete. Score each item with WSJF, then rank them by what to do first.',
  rows: {
    compliance: {
      name: 'App Store privacy-label compliance',
      context:
        'Hard platform deadline this quarter · miss it and the app gets pulled from the store',
      reasoning:
        'A fixed deadline drives time criticality sky-high. Even at a sizeable 13, the ratio wins — urgency carries it.',
    },
    dashboard: {
      name: 'Personal progress insights',
      context:
        'High everyday value for users · but no deadline pressure and a modest build',
      reasoning:
        'Genuinely valuable, but with no clock running its time criticality is low. Still ranks well thanks to a small size.',
    },
    'cost-optimizer': {
      name: 'Cloud cost optimizer',
      context:
        'Saves infra spend · nice to have, but no external pressure to ship it now',
      reasoning:
        'Soft value, no urgency — the kind of work that always loses to anything with a deadline.',
    },
    rewrite: {
      name: 'Offline-first sync rewrite',
      context:
        'Huge long-term payoff · but a multi-quarter effort with no near-term forcing function',
      reasoning:
        'Highest raw value of the four — and it still ranks last. The enormous size (21) crushes the ratio.',
    },
  },
  insight:
    'WSJF’s gift is that the offline-first sync rewrite — the most valuable item — ranks last once you divide by size. Small-but-urgent beats large-but-transformative when the horizon is short.',
};

// ============================================================================
// Healthcare — clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: WsjfDisplay = {
  scenario: 'Healthcare · quarterly planning',
  prompt:
    'Cost of Delay made concrete. Score each item with WSJF, then rank them by what to do first.',
  rows: {
    compliance: {
      name: 'HIPAA audit-evidence automation',
      context:
        'Hard audit date this quarter · slipping it risks losing multi-clinic deals in the pipeline',
      reasoning:
        'A fixed deadline drives time criticality sky-high. Even at a sizeable 13, the ratio wins — urgency carries it.',
    },
    dashboard: {
      name: 'Patient-flow dashboard',
      context:
        'High everyday value for clinics · but no deadline pressure and a modest build',
      reasoning:
        'Genuinely valuable, but with no clock running its time criticality is low. Still ranks well thanks to a small size.',
    },
    'cost-optimizer': {
      name: 'Cloud cost optimizer',
      context:
        'Saves infra spend · nice to have, but no external pressure to ship it now',
      reasoning:
        'Soft value, no urgency — the kind of work that always loses to anything with a deadline.',
    },
    rewrite: {
      name: 'Event-driven scheduling rewrite',
      context:
        'Huge long-term payoff · but a multi-quarter effort with no near-term forcing function',
      reasoning:
        'Highest raw value of the four — and it still ranks last. The enormous size (21) crushes the ratio.',
    },
  },
  insight:
    'WSJF’s gift is that the scheduling rewrite — the most valuable item — ranks last once you divide by size. Small-but-urgent beats large-but-transformative when the horizon is short.',
};

/** All five WSJF display packs, keyed by industry id. */
export const WSJF_DISPLAY: Record<IndustryId, WsjfDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the WSJF drill for a given home industry: the shared structure with
 * the industry's strings merged on by row id. The numbers — and the correct
 * ranking — are unchanged.
 */
export function resolveWsjfDrill(industry: IndustryId): ScoreRankDrill {
  const display = WSJF_DISPLAY[industry];
  return {
    scenario: display.scenario,
    prompt: display.prompt,
    formula: wsjfStructure.formula,
    factors: wsjfStructure.factors,
    rows: wsjfStructure.rows.map((row) => {
      const d = display.rows[row.id as WsjfRowId];
      return {
        id: row.id,
        factors: row.factors,
        name: d.name,
        context: d.context,
        reasoning: d.reasoning,
      };
    }),
    score: wsjfStructure.score,
    insight: display.insight,
  };
}
