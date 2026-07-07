import type { GoldenItem, GraderRun } from './types';

/**
 * AGREEMENT MATH for the calibration study.
 *
 * The question the study answers: does the AI grader score artifacts the way a
 * panel of senior PMs does — and is its disagreement with the panel within the
 * panel's own disagreement with itself? We therefore compute the same pairwise
 * statistics twice: grader-vs-each-rater, and rater-vs-rater (the human
 * ceiling). All comparisons are PAIRWISE over pooled (item x criterion)
 * observations; medians are used only for display, never for kappa, because
 * fractional medians break ordinal-category statistics.
 *
 * Metrics, per pair:
 *  - exact agreement      P(a == b)
 *  - adjacent agreement   P(|a - b| <= 1)   (the "never off by a whole band+" bar)
 *  - MAE                  mean |a - b|
 *  - QWK                  quadratic-weighted Cohen's kappa, the standard
 *                         chance-corrected statistic for ordinal grading
 */

/* ------------------------------------------------------------------
   Pairwise ordinal agreement.
   ------------------------------------------------------------------ */

export interface OrdinalAgreement {
  /** Number of paired observations. */
  n: number;
  exact: number;
  adjacent: number;
  mae: number;
  /** Quadratic-weighted kappa; null when degenerate (no variance to correct). */
  qwk: number | null;
}

/** Agreement between two aligned score vectors on the 0-3 band. */
export function ordinalAgreement(a: number[], b: number[]): OrdinalAgreement {
  if (a.length !== b.length) {
    throw new Error(`ordinalAgreement: length mismatch (${a.length} vs ${b.length})`);
  }
  const n = a.length;
  if (n === 0) return { n: 0, exact: NaN, adjacent: NaN, mae: NaN, qwk: null };

  let exact = 0;
  let adjacent = 0;
  let absSum = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(a[i] - b[i]);
    if (d === 0) exact++;
    if (d <= 1) adjacent++;
    absSum += d;
  }
  return {
    n,
    exact: exact / n,
    adjacent: adjacent / n,
    mae: absSum / n,
    qwk: quadraticWeightedKappa(a, b),
  };
}

/**
 * Quadratic-weighted Cohen's kappa for ordinal ratings in [0, maxRating].
 * Returns null when the statistic is degenerate (expected disagreement is 0,
 * i.e. both raters used a single identical category throughout).
 */
export function quadraticWeightedKappa(a: number[], b: number[], maxRating = 3): number | null {
  const k = maxRating + 1;
  const n = a.length;
  if (n === 0) return null;

  // Observed matrix + marginals.
  const observed: number[][] = Array.from({ length: k }, () => Array<number>(k).fill(0));
  const marginA = Array<number>(k).fill(0);
  const marginB = Array<number>(k).fill(0);
  for (let i = 0; i < n; i++) {
    const ra = clampToBand(a[i], maxRating);
    const rb = clampToBand(b[i], maxRating);
    observed[ra][rb]++;
    marginA[ra]++;
    marginB[rb]++;
  }

  let weightedObserved = 0;
  let weightedExpected = 0;
  const denom = (k - 1) * (k - 1);
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      const weight = ((i - j) * (i - j)) / denom;
      weightedObserved += weight * observed[i][j];
      // Expected under independence, scaled to n like the observed counts.
      weightedExpected += weight * ((marginA[i] * marginB[j]) / n);
    }
  }

  if (weightedExpected === 0) return null;
  return 1 - weightedObserved / weightedExpected;
}

function clampToBand(v: number, maxRating: number): number {
  return Math.max(0, Math.min(maxRating, Math.round(v)));
}

/* ------------------------------------------------------------------
   Binary (pass/fail) agreement.
   ------------------------------------------------------------------ */

export interface BinaryAgreement {
  n: number;
  agreement: number;
  /** Cohen's kappa; null when degenerate. */
  kappa: number | null;
}

export function binaryAgreement(a: boolean[], b: boolean[]): BinaryAgreement {
  if (a.length !== b.length) {
    throw new Error(`binaryAgreement: length mismatch (${a.length} vs ${b.length})`);
  }
  const n = a.length;
  if (n === 0) return { n: 0, agreement: NaN, kappa: null };

  let agree = 0;
  let aTrue = 0;
  let bTrue = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    if (a[i]) aTrue++;
    if (b[i]) bTrue++;
  }
  const po = agree / n;
  const pTrue = (aTrue / n) * (bTrue / n);
  const pFalse = ((n - aTrue) / n) * ((n - bTrue) / n);
  const pe = pTrue + pFalse;
  const kappa = pe === 1 ? null : (po - pe) / (1 - pe);
  return { n, agreement: po, kappa };
}

/* ------------------------------------------------------------------
   Aligning golden-set raters and grader runs into paired vectors.
   ------------------------------------------------------------------ */

/** A named scorer: a human rater or the grader, in one comparable shape. */
export interface Scorer {
  id: string;
  /** itemId -> criterionId -> 0-3. */
  scores: Map<string, Record<string, number>>;
  /** itemId -> pass verdict. */
  pass: Map<string, boolean>;
}

/** All distinct rater ids present across a set of golden items. */
export function raterIds(items: GoldenItem[]): string[] {
  const ids = new Set<string>();
  for (const item of items) for (const r of item.raters) ids.add(r.raterId);
  return [...ids].sort();
}

/** Build a Scorer view of one human rater across the items that rater scored. */
export function scorerFromRater(items: GoldenItem[], raterId: string): Scorer {
  const scores = new Map<string, Record<string, number>>();
  const pass = new Map<string, boolean>();
  for (const item of items) {
    const r = item.raters.find((x) => x.raterId === raterId);
    if (!r) continue;
    scores.set(item.id, r.criteria);
    pass.set(item.id, r.pass);
  }
  return { id: raterId, scores, pass };
}

/**
 * Build a Scorer view of the grader from its runs. With multiple runs per item
 * (variance mode), the per-criterion MEDIAN of runs is used, rounded to a band
 * — the grader's central tendency is what we calibrate, run-to-run spread is
 * reported separately.
 */
export function scorerFromRuns(runs: GraderRun[], id = 'grader'): Scorer {
  const byItem = new Map<string, GraderRun[]>();
  for (const run of runs) {
    const list = byItem.get(run.itemId) ?? [];
    list.push(run);
    byItem.set(run.itemId, list);
  }

  const scores = new Map<string, Record<string, number>>();
  const pass = new Map<string, boolean>();
  for (const [itemId, itemRuns] of byItem) {
    const criteria: Record<string, number> = {};
    for (const criterionId of Object.keys(itemRuns[0].criteria)) {
      const values = itemRuns.map((r) => r.criteria[criterionId]).filter((v) => v !== undefined);
      criteria[criterionId] = Math.round(median(values));
    }
    scores.set(itemId, criteria);
    const passVotes = itemRuns.filter((r) => r.pass).length;
    pass.set(itemId, passVotes * 2 >= itemRuns.length);
  }
  return { id, scores, pass };
}

/** Paired per-criterion vectors over every (item, criterion) both scored. */
export function alignCriteria(
  items: GoldenItem[],
  a: Scorer,
  b: Scorer,
): { a: number[]; b: number[] } {
  const va: number[] = [];
  const vb: number[] = [];
  for (const item of items) {
    const sa = a.scores.get(item.id);
    const sb = b.scores.get(item.id);
    if (!sa || !sb) continue;
    for (const criterionId of Object.keys(sa)) {
      if (sb[criterionId] === undefined) continue;
      va.push(sa[criterionId]);
      vb.push(sb[criterionId]);
    }
  }
  return { a: va, b: vb };
}

/** Paired pass verdicts over every item both scored. */
export function alignPass(items: GoldenItem[], a: Scorer, b: Scorer): { a: boolean[]; b: boolean[] } {
  const va: boolean[] = [];
  const vb: boolean[] = [];
  for (const item of items) {
    const pa = a.pass.get(item.id);
    const pb = b.pass.get(item.id);
    if (pa === undefined || pb === undefined) continue;
    va.push(pa);
    vb.push(pb);
  }
  return { a: va, b: vb };
}

/* ------------------------------------------------------------------
   Pooled comparisons: grader vs the panel, and the panel vs itself.
   ------------------------------------------------------------------ */

export interface PairReport {
  a: string;
  b: string;
  criteria: OrdinalAgreement;
  pass: BinaryAgreement;
}

/** Grader vs every rater, one PairReport per rater. */
export function graderVsRaters(items: GoldenItem[], grader: Scorer): PairReport[] {
  return raterIds(items).map((rid) => {
    const rater = scorerFromRater(items, rid);
    const c = alignCriteria(items, grader, rater);
    const p = alignPass(items, grader, rater);
    return {
      a: grader.id,
      b: rid,
      criteria: ordinalAgreement(c.a, c.b),
      pass: binaryAgreement(p.a, p.b),
    };
  });
}

/** Every rater vs every other rater: the human agreement ceiling. */
export function interRaterPairs(items: GoldenItem[]): PairReport[] {
  const ids = raterIds(items);
  const out: PairReport[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const ra = scorerFromRater(items, ids[i]);
      const rb = scorerFromRater(items, ids[j]);
      const c = alignCriteria(items, ra, rb);
      const p = alignPass(items, ra, rb);
      out.push({
        a: ids[i],
        b: ids[j],
        criteria: ordinalAgreement(c.a, c.b),
        pass: binaryAgreement(p.a, p.b),
      });
    }
  }
  return out;
}

/** Mean of a list, ignoring null/NaN entries; null when nothing usable. */
export function meanOf(values: Array<number | null>): number | null {
  const usable = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (usable.length === 0) return null;
  return usable.reduce((s, v) => s + v, 0) / usable.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/* ------------------------------------------------------------------
   The go/no-go gates.
   ------------------------------------------------------------------ */

export interface CalibrationGates {
  /** Grader-vs-rater adjacent agreement, pooled mean, must be >= this. */
  minAdjacent: number;
  /** Grader-vs-rater mean QWK must be >= this... */
  minQwk: number;
  /** ...AND within this margin below the inter-rater mean QWK (when >= 2 raters). */
  maxQwkGapVsPanel: number;
  /** Grader-vs-rater mean pass/fail raw agreement must be >= this. */
  minPassAgreement: number;
}

/**
 * Defaults chosen against grading-research norms: QWK >= 0.6 is "substantial"
 * agreement for essay scoring; adjacent >= 0.9 means the grader is almost
 * never off by two bands; and the grader must sit within 0.10 QWK of the human
 * panel's own internal agreement — the honest bar, since no grader can be
 * expected to agree with the panel more than the panel agrees with itself.
 */
export const DEFAULT_GATES: CalibrationGates = {
  minAdjacent: 0.9,
  minQwk: 0.6,
  maxQwkGapVsPanel: 0.1,
  minPassAgreement: 0.85,
};

export interface GateResult {
  gate: string;
  target: string;
  actual: string;
  passed: boolean | null; // null = not evaluable (e.g. single rater)
}

export function evaluateGates(
  graderPairs: PairReport[],
  raterPairs: PairReport[],
  gates: CalibrationGates = DEFAULT_GATES,
): GateResult[] {
  const gvAdjacent = meanOf(graderPairs.map((p) => p.criteria.adjacent));
  const gvQwk = meanOf(graderPairs.map((p) => p.criteria.qwk));
  const gvPass = meanOf(graderPairs.map((p) => p.pass.agreement));
  const irQwk = meanOf(raterPairs.map((p) => p.criteria.qwk));

  const results: GateResult[] = [
    {
      gate: 'Adjacent agreement (grader vs raters)',
      target: `>= ${gates.minAdjacent.toFixed(2)}`,
      actual: fmt(gvAdjacent),
      passed: gvAdjacent === null ? null : gvAdjacent >= gates.minAdjacent,
    },
    {
      gate: 'Quadratic-weighted kappa (grader vs raters)',
      target: `>= ${gates.minQwk.toFixed(2)}`,
      actual: fmt(gvQwk),
      passed: gvQwk === null ? null : gvQwk >= gates.minQwk,
    },
    {
      gate: 'QWK gap vs panel ceiling',
      target: `grader QWK >= panel QWK - ${gates.maxQwkGapVsPanel.toFixed(2)}`,
      actual: irQwk === null || gvQwk === null ? 'n/a (needs >= 2 raters)' : `${fmt(gvQwk)} vs panel ${fmt(irQwk)}`,
      passed: irQwk === null || gvQwk === null ? null : gvQwk >= irQwk - gates.maxQwkGapVsPanel,
    },
    {
      gate: 'Pass/fail agreement (grader vs raters)',
      target: `>= ${gates.minPassAgreement.toFixed(2)}`,
      actual: fmt(gvPass),
      passed: gvPass === null ? null : gvPass >= gates.minPassAgreement,
    },
  ];
  return results;
}

function fmt(v: number | null): string {
  return v === null || !Number.isFinite(v) ? 'n/a' : v.toFixed(3);
}
