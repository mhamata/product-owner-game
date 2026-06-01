import { describe, it, expect } from 'vitest';
import {
  gradeClassification,
  gradeRanking,
  gradeSequencing,
  gradeSizing,
  rankRows,
} from '../types';
import { riceDrill } from '../rice';
import { wsjfDrill } from '../wsjf';
import { kanoDrill } from '../kano';
import { moscowDrill } from '../moscow';
import { tshirtDrill } from '../tshirt';
import { fiveWhysDrill } from '../fiveWhys';

/**
 * The drill engine is the graded heart of every Console lesson. These tests
 * pin the behavior the lesson loop depends on: a fully-correct attempt reports
 * `correct: true`, a wrong attempt does not, and the canonical rankings are the
 * ones the lessons reveal.
 */

describe('classification grading', () => {
  it('returns allCorrect when every Kano item is in its right bucket', () => {
    const perfect = Object.fromEntries(
      kanoDrill.items.map((it) => [it.id, it.correct]),
    );
    const result = gradeClassification(kanoDrill, perfect);
    expect(result.allCorrect).toBe(true);
    expect(result.correct).toBe(kanoDrill.items.length);
    expect(result.score).toBe(1);
  });

  it('is not allCorrect when one MoSCoW item is misfiled', () => {
    const assignments = Object.fromEntries(
      moscowDrill.items.map((it) => [it.id, it.correct]),
    );
    // Flip the first item to a deliberately wrong bucket.
    const first = moscowDrill.items[0];
    assignments[first.id] = first.correct === 'M' ? 'W' : 'M';

    const result = gradeClassification(moscowDrill, assignments);
    expect(result.allCorrect).toBe(false);
    expect(result.correct).toBe(moscowDrill.items.length - 1);
  });

  it('treats an unanswered item as incorrect', () => {
    const result = gradeClassification(kanoDrill, {});
    expect(result.correct).toBe(0);
    expect(result.allCorrect).toBe(false);
  });
});

describe('score-and-rank grading', () => {
  it('ranks RICE rows highest-score-first', () => {
    const ranked = rankRows(riceDrill);
    for (let i = 1; i < ranked.length; i += 1) {
      expect(riceDrill.score(ranked[i - 1])).toBeGreaterThanOrEqual(
        riceDrill.score(ranked[i]),
      );
    }
  });

  it('scores the canonical RICE ordering as perfect', () => {
    const order = rankRows(riceDrill).map((r) => r.id);
    const result = gradeRanking(riceDrill, order);
    expect(result.allCorrect).toBe(true);
    expect(result.score).toBe(1);
  });

  it('ranks the WSJF platform rewrite last despite its top raw value', () => {
    const ranked = rankRows(wsjfDrill);
    expect(ranked[ranked.length - 1].id).toBe('rewrite');
  });

  it('penalises a reversed WSJF ordering', () => {
    const reversed = rankRows(wsjfDrill)
      .map((r) => r.id)
      .reverse();
    const result = gradeRanking(wsjfDrill, reversed);
    expect(result.allCorrect).toBe(false);
  });
});

describe('sizing grading', () => {
  it('marks the canonical T-shirt sizes as fully correct', () => {
    const guesses = Object.fromEntries(
      tshirtDrill.stories.map((s) => [s.id, s.correct]),
    );
    const result = gradeSizing(tshirtDrill, guesses);
    expect(result.allCorrect).toBe(true);
  });
});

describe('sequencing grading', () => {
  it('marks the canonical surface-to-root order as fully correct', () => {
    const order = fiveWhysDrill.steps.map((s) => s.id);
    const result = gradeSequencing(fiveWhysDrill, order);
    expect(result.allCorrect).toBe(true);
    expect(result.score).toBe(1);
  });

  it('is not fully correct when two causes are swapped', () => {
    const order = fiveWhysDrill.steps.map((s) => s.id);
    [order[0], order[1]] = [order[1], order[0]];
    const result = gradeSequencing(fiveWhysDrill, order);
    expect(result.allCorrect).toBe(false);
  });
});

describe('de-specialization', () => {
  it('contains no finance/brokerage-specific content in any drill', () => {
    const banned = /TFSA|Moomoo|CIRO|DTCC|RRSP|brokerage|fractional shares/i;
    const blob = JSON.stringify([
      riceDrill,
      wsjfDrill,
      kanoDrill,
      moscowDrill,
      tshirtDrill,
      fiveWhysDrill,
    ]);
    expect(banned.test(blob)).toBe(false);
  });
});
