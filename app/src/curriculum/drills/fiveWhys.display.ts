import type { IndustryId } from '@/curriculum/industries';
import type { SequencingDrill } from './types';
import { fiveWhysStructure, type FiveWhysStepId } from './fiveWhys';

/**
 * 5-Whys drill: DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY. The canonical surface-to-root ORDER lives in
 * `./fiveWhys` and is the graded answer; it never changes. Mirrors
 * `@/scenarios/scenario01.display`.
 *
 * Structural slots. Every pack's chain must descend through the SAME five
 * layers so the canonical order stays correct (and the `layer` labels are kept
 * identical across industries because they ARE the teaching point):
 *   • `s1`: Technical cause (not the root): an immediate technical trigger.
 *   • `s2`: Process gap: the change slipped through review unnoticed.
 *   • `s3`: Process cause: no automated coverage for that area.
 *   • `s4`: Organizational cause: no clear owner of that coverage.
 *   • `s5`: Root (organizational): it was launched as a side project, never
 *            staffed as an owned service. The fix is ownership + process.
 *
 * Keys derive from the structural step ids → the compiler forces full coverage.
 */

export interface CauseStepDisplay {
  /** The cause statement. */
  text: string;
  /** Which layer this cause sits at; shown after grading. */
  layer: string;
}

export interface FiveWhysDisplay {
  scenario: string;
  symptom: string;
  prompt: string;
  steps: Record<FiveWhysStepId, CauseStepDisplay>;
  insight: string;
}

// The layer labels describe DEPTH (the teaching point) and are intentionally
// identical in every pack; only the symptom and cause text are re-themed.
const LAYERS: Record<FiveWhysStepId, string> = {
  s1: 'Technical cause, not the root',
  s2: 'Process gap, getting closer',
  s3: 'Process cause',
  s4: 'Organizational cause',
  s5: 'Root: organizational. The fix is ownership + process, not a one-line patch.',
};

const PROMPT =
  'Order these five causes from the surface symptom down to the true root. Each "why" should go one level deeper than the last.';
const INSIGHT =
  'The hardest discipline is not stopping at the first human-error cause ("the reviewer missed it"). Real roots are almost always organizational or process-level: if your last why is still technical, go deeper.';

// ============================================================================
// SaaS: original content, ported verbatim from the legacy fiveWhysDrill.
// ============================================================================
const saas: FiveWhysDisplay = {
  scenario: 'SaaS · post-incident review',
  symptom: 'Checkout was down for 90 minutes on Tuesday; customers could not pay.',
  prompt: PROMPT,
  steps: {
    s1: {
      text: 'A deploy shipped a payment-service config that pointed at the wrong API endpoint.',
      layer: LAYERS.s1,
    },
    s2: {
      text: 'The bad config passed code review because no one noticed the changed value.',
      layer: LAYERS.s2,
    },
    s3: {
      text: 'There were no automated tests covering payment configuration.',
      layer: LAYERS.s3,
    },
    s4: {
      text: 'No one owns the payment integration’s test coverage.',
      layer: LAYERS.s4,
    },
    s5: {
      text: 'Payments was launched as a side project and never staffed as an owned service.',
      layer: LAYERS.s5,
    },
  },
  insight: INSIGHT,
};

// ============================================================================
// Fintech: generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: FiveWhysDisplay = {
  scenario: 'Fintech · post-incident review',
  symptom: 'Card payments failed for 90 minutes on Tuesday; customers could not transact.',
  prompt: PROMPT,
  steps: {
    s1: {
      text: 'A deploy shipped a payments-service config that pointed at the wrong processor endpoint.',
      layer: LAYERS.s1,
    },
    s2: {
      text: 'The bad config passed code review because no one noticed the changed value.',
      layer: LAYERS.s2,
    },
    s3: {
      text: 'There were no automated tests covering payments configuration.',
      layer: LAYERS.s3,
    },
    s4: {
      text: 'No one owns the payments integration’s test coverage.',
      layer: LAYERS.s4,
    },
    s5: {
      text: 'Payments was launched as a side project and never staffed as an owned service.',
      layer: LAYERS.s5,
    },
  },
  insight: INSIGHT,
};

// ============================================================================
// Marketplace: two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: FiveWhysDisplay = {
  scenario: 'Marketplace · post-incident review',
  symptom: 'Checkout was down for 90 minutes on Tuesday; buyers could not complete orders.',
  prompt: PROMPT,
  steps: {
    s1: {
      text: 'A deploy shipped a checkout-service config that pointed at the wrong payments endpoint.',
      layer: LAYERS.s1,
    },
    s2: {
      text: 'The bad config passed code review because no one noticed the changed value.',
      layer: LAYERS.s2,
    },
    s3: {
      text: 'There were no automated tests covering checkout configuration.',
      layer: LAYERS.s3,
    },
    s4: {
      text: 'No one owns the checkout flow’s test coverage.',
      layer: LAYERS.s4,
    },
    s5: {
      text: 'Checkout was launched as a side project and never staffed as an owned service.',
      layer: LAYERS.s5,
    },
  },
  insight: INSIGHT,
};

// ============================================================================
// Consumer: habit-tracking / journaling app.
// ============================================================================
const consumer: FiveWhysDisplay = {
  scenario: 'Consumer · post-incident review',
  symptom: 'Sign-in was down for 90 minutes on Tuesday; users were locked out of the app.',
  prompt: PROMPT,
  steps: {
    s1: {
      text: 'A deploy shipped an auth-service config that pointed at the wrong identity endpoint.',
      layer: LAYERS.s1,
    },
    s2: {
      text: 'The bad config passed code review because no one noticed the changed value.',
      layer: LAYERS.s2,
    },
    s3: {
      text: 'There were no automated tests covering auth configuration.',
      layer: LAYERS.s3,
    },
    s4: {
      text: 'No one owns the auth flow’s test coverage.',
      layer: LAYERS.s4,
    },
    s5: {
      text: 'Auth was launched as a side project and never staffed as an owned service.',
      layer: LAYERS.s5,
    },
  },
  insight: INSIGHT,
};

// ============================================================================
// Healthcare: clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: FiveWhysDisplay = {
  scenario: 'Healthcare · post-incident review',
  symptom: 'Online booking was down for 90 minutes on Tuesday; patients could not schedule visits.',
  prompt: PROMPT,
  steps: {
    s1: {
      text: 'A deploy shipped a scheduling-service config that pointed at the wrong calendar endpoint.',
      layer: LAYERS.s1,
    },
    s2: {
      text: 'The bad config passed code review because no one noticed the changed value.',
      layer: LAYERS.s2,
    },
    s3: {
      text: 'There were no automated tests covering scheduling configuration.',
      layer: LAYERS.s3,
    },
    s4: {
      text: 'No one owns the scheduling integration’s test coverage.',
      layer: LAYERS.s4,
    },
    s5: {
      text: 'Scheduling was launched as a side project and never staffed as an owned service.',
      layer: LAYERS.s5,
    },
  },
  insight: INSIGHT,
};

/** All five 5-Whys display packs, keyed by industry id. */
export const FIVE_WHYS_DISPLAY: Record<IndustryId, FiveWhysDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the 5-Whys drill for a given home industry: the canonical step order
 * with the industry's symptom + per-step text/layer merged on by id. The
 * ordering (the graded answer) is unchanged.
 */
export function resolveFiveWhysDrill(industry: IndustryId): SequencingDrill {
  const display = FIVE_WHYS_DISPLAY[industry];
  return {
    scenario: display.scenario,
    symptom: display.symptom,
    prompt: display.prompt,
    // Build steps IN the canonical structural order; this order is the answer.
    steps: fiveWhysStructure.order.map((id) => {
      const d = display.steps[id];
      return { id, text: d.text, layer: d.layer };
    }),
    insight: display.insight,
  };
}
