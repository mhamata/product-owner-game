import { describe, it, expect } from 'vitest';
import {
  gradeClassification,
  gradeRanking,
  gradeSequencing,
  gradeSizing,
  rankRows,
  resolveRiceDrill,
  resolveWsjfDrill,
  resolveMoscowDrill,
  resolveKanoDrill,
  resolveTshirtDrill,
  resolveFiveWhysDrill,
  resolveValueVsEffortDrill,
  resolveJtbdDrill,
  resolveMomTestDrill,
  resolvePreMortemDrill,
  resolvePrFaqDrill,
  riceDrill,
  wsjfDrill,
  kanoDrill,
  moscowDrill,
  tshirtDrill,
  fiveWhysDrill,
} from '..';
import { INDUSTRIES, type IndustryId } from '@/curriculum/industries';

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
  const ALL: IndustryId[] = INDUSTRIES.map((i) => i.id);

  it('contains no finance/brokerage-specific content in any drill (every industry)', () => {
    const banned = /TFSA|Moomoo|CIRO|DTCC|RRSP|brokerage|fractional shares/i;
    // Resolve every drill for every industry — the fintech pack in particular
    // must stay generic expense-management, never the old brokerage content.
    const blob = JSON.stringify(
      ALL.flatMap((ind) => [
        resolveRiceDrill(ind),
        resolveWsjfDrill(ind),
        resolveKanoDrill(ind),
        resolveMoscowDrill(ind),
        resolveTshirtDrill(ind),
        resolveFiveWhysDrill(ind),
        resolveValueVsEffortDrill(ind),
      ]),
    );
    expect(banned.test(blob)).toBe(false);
  });
});

/**
 * The safety guarantee: switching the home industry re-skins a drill's COPY but
 * never moves the graded answer. These tests resolve every drill for all five
 * industries and assert the answer-bearing structure — and the grade of the
 * canonical attempt — is byte-for-byte identical across them.
 */
describe('industry invariance (graded answer is identical across industries)', () => {
  const ALL: IndustryId[] = INDUSTRIES.map((i) => i.id);

  it('RICE: factor numbers and the correct ranking never change', () => {
    const baseline = rankRows(resolveRiceDrill('saas')).map((r) => r.id);
    for (const ind of ALL) {
      const drill = resolveRiceDrill(ind);
      // Same factor numbers per row id.
      for (const row of drill.rows) {
        const saasRow = resolveRiceDrill('saas').rows.find((r) => r.id === row.id)!;
        expect(row.factors).toEqual(saasRow.factors);
      }
      // Same canonical ranking.
      expect(rankRows(drill).map((r) => r.id)).toEqual(baseline);
    }
  });

  it('WSJF: factor numbers and the correct ranking never change', () => {
    const baseline = rankRows(resolveWsjfDrill('saas')).map((r) => r.id);
    for (const ind of ALL) {
      const drill = resolveWsjfDrill(ind);
      for (const row of drill.rows) {
        const saasRow = resolveWsjfDrill('saas').rows.find((r) => r.id === row.id)!;
        expect(row.factors).toEqual(saasRow.factors);
      }
      expect(rankRows(drill).map((r) => r.id)).toEqual(baseline);
      // The teaching point — the rewrite ranks last — holds in every industry.
      expect(rankRows(drill).at(-1)?.id).toBe('rewrite');
    }
  });

  it('MoSCoW: the correct bucket per item never changes', () => {
    const baseline = Object.fromEntries(
      resolveMoscowDrill('saas').items.map((it) => [it.id, it.correct]),
    );
    for (const ind of ALL) {
      const drill = resolveMoscowDrill(ind);
      const map = Object.fromEntries(drill.items.map((it) => [it.id, it.correct]));
      expect(map).toEqual(baseline);
      // The canonical answer grades as fully correct.
      const perfect = Object.fromEntries(drill.items.map((it) => [it.id, it.correct]));
      expect(gradeClassification(drill, perfect).allCorrect).toBe(true);
    }
  });

  it('Kano: the correct category per item never changes', () => {
    const baseline = Object.fromEntries(
      resolveKanoDrill('saas').items.map((it) => [it.id, it.correct]),
    );
    for (const ind of ALL) {
      const drill = resolveKanoDrill(ind);
      const map = Object.fromEntries(drill.items.map((it) => [it.id, it.correct]));
      expect(map).toEqual(baseline);
      const perfect = Object.fromEntries(drill.items.map((it) => [it.id, it.correct]));
      expect(gradeClassification(drill, perfect).allCorrect).toBe(true);
    }
  });

  it('T-shirt: the correct size per story never changes', () => {
    const baseline = Object.fromEntries(
      resolveTshirtDrill('saas').stories.map((s) => [s.id, s.correct]),
    );
    for (const ind of ALL) {
      const drill = resolveTshirtDrill(ind);
      const map = Object.fromEntries(drill.stories.map((s) => [s.id, s.correct]));
      expect(map).toEqual(baseline);
      const perfect = Object.fromEntries(drill.stories.map((s) => [s.id, s.correct]));
      expect(gradeSizing(drill, perfect).allCorrect).toBe(true);
    }
  });

  it('5-Whys: the canonical surface-to-root order never changes', () => {
    const baseline = resolveFiveWhysDrill('saas').steps.map((s) => s.id);
    for (const ind of ALL) {
      const drill = resolveFiveWhysDrill(ind);
      expect(drill.steps.map((s) => s.id)).toEqual(baseline);
      const order = drill.steps.map((s) => s.id);
      expect(gradeSequencing(drill, order).allCorrect).toBe(true);
    }
  });

  it('Value-vs-Effort: the quick-win slot and correct option never change', () => {
    const baseline = resolveValueVsEffortDrill('saas');
    for (const ind of ALL) {
      const drill = resolveValueVsEffortDrill(ind);
      expect(drill.correctOptionId).toBe(baseline.correctOptionId);
      // The correct option must be a real row that is HIGH value + LOW effort.
      const quickWin = drill.rows.find((r) => r.tag === drill.correctOptionId);
      expect(quickWin).toBeDefined();
      expect(quickWin?.value).toBe('high');
      expect(quickWin?.effort).toBe('low');
      // Per-row value/effort labels match SaaS exactly.
      for (const row of drill.rows) {
        const saasRow = baseline.rows.find((r) => r.tag === row.tag)!;
        expect({ value: row.value, effort: row.effort }).toEqual({
          value: saasRow.value,
          effort: saasRow.effort,
        });
      }
    }
  });

  it('free-text drills keep the same drillId (rubric) + field keys across industries', () => {
    // The graded rubric is selected server-side by drillId, so resolving any
    // industry must not change the drillId or the field keys the answer is
    // composed from — only the visible copy and the persona context change.
    const resolvers = [
      { resolve: resolveJtbdDrill, drillId: 'jtbd' as const },
      { resolve: resolveMomTestDrill, drillId: 'mom-test' as const },
      { resolve: resolvePreMortemDrill, drillId: 'pre-mortem' as const },
      { resolve: resolvePrFaqDrill, drillId: 'pr-faq' as const },
    ];
    for (const { resolve, drillId } of resolvers) {
      const baselineKeys = resolve('saas').fields.map((f) => f.key);
      for (const ind of ALL) {
        const drill = resolve(ind);
        expect(drill.drillId).toBe(drillId);
        expect(drill.fields.map((f) => f.key)).toEqual(baselineKeys);
      }
    }
  });
});
