import { describe, expect, it } from 'vitest';
import {
  binaryAgreement,
  evaluateGates,
  median,
  meanOf,
  ordinalAgreement,
  quadraticWeightedKappa,
  scorerFromRuns,
  DEFAULT_GATES,
  type PairReport,
} from '../agreement';
import type { GraderRun } from '../types';

describe('median', () => {
  it('returns the middle value for an odd-length list', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('returns the mean of the middle pair for an even-length list', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns NaN for an empty list', () => {
    expect(Number.isNaN(median([]))).toBe(true);
  });
});

describe('quadraticWeightedKappa', () => {
  it('is 1 for perfect agreement with spread categories', () => {
    expect(quadraticWeightedKappa([0, 1, 2, 3], [0, 1, 2, 3])).toBe(1);
  });

  it('is -1 for maximal disagreement at the band extremes', () => {
    expect(quadraticWeightedKappa([0, 3], [3, 0])).toBe(-1);
  });

  it('is null when both raters use one identical category (degenerate)', () => {
    expect(quadraticWeightedKappa([2, 2, 2], [2, 2, 2])).toBeNull();
  });

  it('penalizes two-band misses more than one-band misses', () => {
    const oneOff = quadraticWeightedKappa([0, 1, 2, 3, 0, 1, 2, 3], [1, 2, 3, 3, 0, 1, 2, 3]);
    const twoOff = quadraticWeightedKappa([0, 1, 2, 3, 0, 1, 2, 3], [2, 3, 0, 1, 0, 1, 2, 3]);
    expect(oneOff).not.toBeNull();
    expect(twoOff).not.toBeNull();
    expect(oneOff!).toBeGreaterThan(twoOff!);
  });
});

describe('ordinalAgreement', () => {
  it('counts exact, adjacent, and mean absolute error', () => {
    // diffs: 0, 1, 2, 0 -> exact 2/4, adjacent 3/4, mae 0.75
    const result = ordinalAgreement([0, 1, 3, 2], [0, 2, 1, 2]);
    expect(result.n).toBe(4);
    expect(result.exact).toBe(0.5);
    expect(result.adjacent).toBe(0.75);
    expect(result.mae).toBe(0.75);
  });

  it('throws on mismatched vector lengths', () => {
    expect(() => ordinalAgreement([1], [1, 2])).toThrow();
  });
});

describe('binaryAgreement', () => {
  it('computes raw agreement and kappa of 0 for independent raters', () => {
    const result = binaryAgreement([true, true, false, false], [true, false, true, false]);
    expect(result.agreement).toBe(0.5);
    expect(result.kappa).toBe(0);
  });

  it('is kappa 1 for perfect agreement with both classes present', () => {
    const result = binaryAgreement([true, false], [true, false]);
    expect(result.kappa).toBe(1);
  });

  it('is null kappa when agreement is guaranteed by constant marginals', () => {
    const result = binaryAgreement([true, true], [true, true]);
    expect(result.kappa).toBeNull();
    expect(result.agreement).toBe(1);
  });
});

describe('scorerFromRuns', () => {
  it('takes the per-criterion median across repeated runs and majority pass', () => {
    const runs: GraderRun[] = [
      { itemId: 'x', criteria: { a: 1, b: 3 }, pass: true, overallScore: 60 },
      { itemId: 'x', criteria: { a: 2, b: 3 }, pass: false, overallScore: 70 },
      { itemId: 'x', criteria: { a: 3, b: 3 }, pass: true, overallScore: 80 },
    ];
    const scorer = scorerFromRuns(runs);
    expect(scorer.scores.get('x')).toEqual({ a: 2, b: 3 });
    expect(scorer.pass.get('x')).toBe(true);
  });
});

describe('evaluateGates', () => {
  const pair = (qwk: number, adjacent: number, passAgreement: number): PairReport => ({
    a: 'grader',
    b: 'rater',
    criteria: { n: 40, exact: 0.6, adjacent, mae: 0.4, qwk },
    pass: { n: 10, agreement: passAgreement, kappa: 0.7 },
  });

  it('passes all evaluable gates on strong agreement', () => {
    const gates = evaluateGates([pair(0.75, 0.95, 0.9)], [pair(0.8, 0.97, 0.95)], DEFAULT_GATES);
    for (const g of gates) expect(g.passed).toBe(true);
  });

  it('fails the QWK gate when the grader is far below the panel ceiling', () => {
    const gates = evaluateGates([pair(0.62, 0.95, 0.9)], [pair(0.85, 0.97, 0.95)], DEFAULT_GATES);
    const gapGate = gates.find((g) => g.gate.includes('gap'));
    expect(gapGate?.passed).toBe(false);
  });

  it('marks the panel-ceiling gate unevaluable with a single rater', () => {
    const gates = evaluateGates([pair(0.7, 0.95, 0.9)], [], DEFAULT_GATES);
    const gapGate = gates.find((g) => g.gate.includes('gap'));
    expect(gapGate?.passed).toBeNull();
  });
});

describe('meanOf', () => {
  it('ignores nulls and returns null when nothing is usable', () => {
    expect(meanOf([0.5, null, 0.7])).toBeCloseTo(0.6);
    expect(meanOf([null, null])).toBeNull();
  });
});
