import type { ScoreFactor, ScoreRow } from './types';

/**
 * RICE drill — STRUCTURAL CORE (industry-neutral).
 *
 * RICE = (Reach × Impact × Confidence) / Effort. Higher = higher priority.
 *
 * This file owns every answer-bearing value: the row ids, the
 * reach/impact/confidence/effort NUMBERS, the `score` formula, and the factor
 * metadata (label + display format, which are the same maths for every
 * industry). It carries NO human-readable feature copy — that lives in
 * `./rice.display`, one pack per home industry, merged back on by
 * `resolveRiceDrill`. Because the numbers never change, the correct ranking is
 * provably identical across industries.
 *
 * The teaching point survives the per-industry re-skin: the middle row has the
 * weakest confidence (the factor teams most often inflate to rescue a pet
 * feature), so halving it tanks the score.
 */

/** The structural RICE row ids — the keys every display pack must cover. */
export type RiceRowId = 'sso' | 'templates' | 'audit-log';

/** A RICE row with its display strings (`name`, `context`, `reasoning`) removed. */
export type StructuralRiceRow = Pick<ScoreRow, 'id' | 'factors'>;

/** The industry-neutral skeleton of the RICE drill. */
export interface RiceStructure {
  formula: string;
  factors: ScoreFactor[];
  rows: StructuralRiceRow[];
  /** Pure scoring function: higher = higher priority. */
  score: (row: Pick<ScoreRow, 'factors'>) => number;
}

export const riceStructure: RiceStructure = {
  formula: '(Reach × Impact × Confidence) / Effort',
  factors: [
    { key: 'reach', label: 'Reach', format: 'int' },
    { key: 'impact', label: 'Impact', format: 'int' },
    { key: 'confidence', label: 'Confidence', format: 'percent' },
    { key: 'effort', label: 'Effort', format: 'months' },
  ],
  rows: [
    { id: 'sso', factors: { reach: 15000, impact: 3, confidence: 0.8, effort: 12 } },
    { id: 'templates', factors: { reach: 8000, impact: 2, confidence: 0.5, effort: 6 } },
    { id: 'audit-log', factors: { reach: 3000, impact: 2, confidence: 0.8, effort: 4 } },
  ],
  score: (r) =>
    (r.factors.reach * r.factors.impact * r.factors.confidence) /
    r.factors.effort,
};
