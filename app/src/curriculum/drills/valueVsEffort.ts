/**
 * Value-vs-Effort drill — STRUCTURAL CORE (industry-neutral).
 *
 * The "Value vs Effort" lesson asks the learner to pick the best QUICK WIN
 * (high value, low effort) from three features. This file owns the answer key:
 * the per-feature {value, effort} labels (which determine the correct pick), the
 * option ids, and `CORRECT_OPTION_ID`. It carries NO human-readable feature
 * copy — the feature names and option labels live in `./valueVsEffort.display`,
 * one pack per home industry, merged on by `resolveValueVsEffortDrill`.
 *
 * The drill content used to be inlined in
 * `components/console/lesson/ValueVsEffortLesson.tsx`; it now follows the same
 * structural/display split as every other drill so the lesson can re-skin per
 * industry without ever changing which feature is the quick win.
 *
 * Structural slots (fixed value/effort — the answer never moves):
 *   • `A` → HIGH value, LOW effort  → the quick win, the CORRECT pick.
 *   • `B` → HIGH value, HIGH effort → a "big bet".
 *   • `C` → LOW value,  LOW effort  → "maybe later".
 *   • `ALL` → the "ship all three" distractor option (no row).
 */

export type ValueLevel = 'high' | 'low';

/** Structural feature row ids (also the display tags shown in the table). */
export type ValueVsEffortRowId = 'A' | 'B' | 'C';

/** Structural option ids: the three features plus the "ship all" distractor. */
export type ValueVsEffortOptionId = ValueVsEffortRowId | 'ALL';

/** One feature row's answer-bearing data: its value & effort levels. */
export interface StructuralValueVsEffortRow {
  /** Stable id; also rendered as the row tag (A/B/C). */
  id: ValueVsEffortRowId;
  value: ValueLevel;
  effort: ValueLevel;
}

/** One selectable option's structural data (id + the chip key label). */
export interface StructuralValueVsEffortOption {
  id: ValueVsEffortOptionId;
  /** Display key shown in the option chip ("A", "B", "C", "∑"). */
  keyLabel: string;
}

export interface ValueVsEffortStructure {
  rows: StructuralValueVsEffortRow[];
  options: StructuralValueVsEffortOption[];
  /** The single correct option id (the high-value / low-effort quick win). */
  correctOptionId: ValueVsEffortOptionId;
}

export const valueVsEffortStructure: ValueVsEffortStructure = {
  rows: [
    { id: 'A', value: 'high', effort: 'low' },
    { id: 'B', value: 'high', effort: 'high' },
    { id: 'C', value: 'low', effort: 'low' },
  ],
  options: [
    { id: 'A', keyLabel: 'A' },
    { id: 'B', keyLabel: 'B' },
    { id: 'C', keyLabel: 'C' },
    { id: 'ALL', keyLabel: '∑' },
  ],
  correctOptionId: 'A',
};
