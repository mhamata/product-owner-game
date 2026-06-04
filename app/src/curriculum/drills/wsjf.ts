import type { ScoreFactor, ScoreRow } from './types';

/**
 * Cost of Delay → WSJF drill: STRUCTURAL CORE (industry-neutral).
 *
 * WSJF = (Value + Time Criticality + Risk Reduction) / Job Size.
 * Factors use the Fibonacci scale (1,2,3,5,8,13,21). Higher = do sooner.
 *
 * This file owns every answer-bearing value: the row ids, the four Fibonacci
 * factor NUMBERS per row, the `score` formula, and the factor metadata. It
 * carries NO human-readable copy; that lives in `./wsjf.display`, one pack per
 * home industry, merged on by `resolveWsjfDrill`. The numbers (and therefore
 * the correct ranking) are identical for every industry.
 *
 * Teaching point preserved across the re-skin: the big platform rewrite has the
 * highest raw value but its enormous size kills the ratio. Small-but-urgent
 * beats large-but-transformative on a short horizon.
 */

/** The structural WSJF row ids: the keys every display pack must cover. */
export type WsjfRowId = 'compliance' | 'dashboard' | 'cost-optimizer' | 'rewrite';

/** A WSJF row with its display strings removed. */
export type StructuralWsjfRow = Pick<ScoreRow, 'id' | 'factors'>;

/** The industry-neutral skeleton of the WSJF drill. */
export interface WsjfStructure {
  formula: string;
  factors: ScoreFactor[];
  rows: StructuralWsjfRow[];
  score: (row: Pick<ScoreRow, 'factors'>) => number;
}

export const wsjfStructure: WsjfStructure = {
  formula: '(Value + Time Criticality + Risk Reduction) / Job Size',
  factors: [
    { key: 'value', label: 'Value', format: 'int' },
    { key: 'time', label: 'Time crit.', format: 'int' },
    { key: 'risk', label: 'Risk red.', format: 'int' },
    { key: 'size', label: 'Job Size', format: 'int' },
  ],
  rows: [
    { id: 'compliance', factors: { value: 8, time: 13, risk: 8, size: 13 } },
    { id: 'dashboard', factors: { value: 8, time: 3, risk: 3, size: 8 } },
    { id: 'cost-optimizer', factors: { value: 5, time: 2, risk: 2, size: 8 } },
    { id: 'rewrite', factors: { value: 13, time: 2, risk: 5, size: 21 } },
  ],
  score: (r) =>
    (r.factors.value + r.factors.time + r.factors.risk) / r.factors.size,
};
