import type { IndustryId } from '@/curriculum/industries';
import {
  valueVsEffortStructure,
  type ValueLevel,
  type ValueVsEffortOptionId,
  type ValueVsEffortRowId,
} from './valueVsEffort';

/**
 * Value-vs-Effort drill: DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY: the scenario tag, the feature NAME per row, and the
 * option label per option. The value/effort levels and the correct option id
 * live in `./valueVsEffort` and never change. Mirrors
 * `@/scenarios/scenario01.display`.
 *
 * Per the fixed structure, each pack must make:
 *   • `A` a believable HIGH-value / LOW-effort QUICK WIN (the correct pick),
 *   • `B` a believable HIGH-value / HIGH-effort big bet,
 *   • `C` a believable LOW-value / LOW-effort nicety,
 *   • `ALL` the "ship all three" label.
 *
 * Keys derive from the structural ids → the compiler forces full coverage.
 */

export interface ValueVsEffortDisplay {
  /** Industry tag shown in the lesson eyebrow, e.g. "SaaS". */
  scenario: string;
  /** Feature name per row id. */
  rows: Record<ValueVsEffortRowId, string>;
  /** Option label per option id. */
  options: Record<ValueVsEffortOptionId, string>;
}

// "Ship all three" is industry-neutral; kept identical across packs.
const SHIP_ALL = 'Ship all three';

// ============================================================================
// SaaS: original content, ported verbatim from ValueVsEffortLesson.tsx.
// ============================================================================
const saas: ValueVsEffortDisplay = {
  scenario: 'SaaS',
  rows: {
    A: 'Onboarding checklist',
    B: 'Custom dashboards',
    C: 'Dark mode',
  },
  options: {
    A: 'Onboarding checklist',
    B: 'Custom dashboards',
    C: 'Dark mode',
    ALL: SHIP_ALL,
  },
};

// ============================================================================
// Fintech: generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: ValueVsEffortDisplay = {
  scenario: 'Fintech',
  rows: {
    A: 'Receipt email-forwarding',
    B: 'Custom spend dashboards',
    C: 'Dark mode',
  },
  options: {
    A: 'Receipt email-forwarding',
    B: 'Custom spend dashboards',
    C: 'Dark mode',
    ALL: SHIP_ALL,
  },
};

// ============================================================================
// Marketplace: two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: ValueVsEffortDisplay = {
  scenario: 'Marketplace',
  rows: {
    A: 'One-tap relist',
    B: 'Custom storefront builder',
    C: 'Dark mode',
  },
  options: {
    A: 'One-tap relist',
    B: 'Custom storefront builder',
    C: 'Dark mode',
    ALL: SHIP_ALL,
  },
};

// ============================================================================
// Consumer: habit-tracking / journaling app.
// ============================================================================
const consumer: ValueVsEffortDisplay = {
  scenario: 'Consumer',
  rows: {
    A: 'Streak reminders',
    B: 'Custom insights dashboard',
    C: 'Dark mode',
  },
  options: {
    A: 'Streak reminders',
    B: 'Custom insights dashboard',
    C: 'Dark mode',
    ALL: SHIP_ALL,
  },
};

// ============================================================================
// Healthcare: clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: ValueVsEffortDisplay = {
  scenario: 'Healthcare',
  rows: {
    A: 'Online intake form',
    B: 'Custom clinic dashboards',
    C: 'Dark mode',
  },
  options: {
    A: 'Online intake form',
    B: 'Custom clinic dashboards',
    C: 'Dark mode',
    ALL: SHIP_ALL,
  },
};

/** All five Value-vs-Effort display packs, keyed by industry id. */
export const VALUE_VS_EFFORT_DISPLAY: Record<IndustryId, ValueVsEffortDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/** A resolved Value-vs-Effort feature row (structure + display merged). */
export interface ResolvedValueVsEffortRow {
  /** Row tag shown in the table (A/B/C). */
  tag: ValueVsEffortRowId;
  feature: string;
  value: ValueLevel;
  effort: ValueLevel;
}

/** A resolved selectable option (structure + display merged). */
export interface ResolvedValueVsEffortOption {
  id: ValueVsEffortOptionId;
  keyLabel: string;
  label: string;
}

/** The fully resolved drill the lesson component renders. */
export interface ResolvedValueVsEffortDrill {
  scenario: string;
  rows: ResolvedValueVsEffortRow[];
  options: ResolvedValueVsEffortOption[];
  correctOptionId: ValueVsEffortOptionId;
}

/**
 * Assemble the Value-vs-Effort drill for a given home industry: the shared
 * value/effort answer key with the industry's feature names + option labels
 * merged on by id. The correct option (the high-value / low-effort quick win)
 * is unchanged.
 */
export function resolveValueVsEffortDrill(
  industry: IndustryId,
): ResolvedValueVsEffortDrill {
  const display = VALUE_VS_EFFORT_DISPLAY[industry];
  return {
    scenario: display.scenario,
    rows: valueVsEffortStructure.rows.map((row) => ({
      tag: row.id,
      feature: display.rows[row.id],
      value: row.value,
      effort: row.effort,
    })),
    options: valueVsEffortStructure.options.map((opt) => ({
      id: opt.id,
      keyLabel: opt.keyLabel,
      label: display.options[opt.id],
    })),
    correctOptionId: valueVsEffortStructure.correctOptionId,
  };
}
