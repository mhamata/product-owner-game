import { describe, expect, it } from 'vitest';
import { GOLDEN_SET, validateGoldenSet } from '../goldenSet';
import { interRaterPairs } from '../agreement';

describe('golden set integrity', () => {
  it('is structurally sound (ids, rubric keys, bands, industries)', () => {
    expect(validateGoldenSet()).toEqual([]);
  });

  it('has 30 items: 10 per artifact type', () => {
    expect(GOLDEN_SET).toHaveLength(30);
    for (const type of ['prd-artifact', 'experiment-plan', 'strategy-memo'] as const) {
      expect(GOLDEN_SET.filter((i) => i.artifactSkillId === type)).toHaveLength(10);
    }
  });

  it('every item carries both seed raters until panel scores land', () => {
    for (const item of GOLDEN_SET) {
      const ids = item.raters.map((r) => r.raterId).sort();
      expect(ids).toEqual(['seed-author', 'seed-blind']);
      expect(item.provenance).toBe('synthetic-seed');
    }
  });

  it('spans the quality range within every artifact type', () => {
    // The study needs spread: if all items cluster in one band, agreement
    // statistics are degenerate. Author-rater criterion totals (0-12) must
    // span at least 6 points within each type.
    for (const type of ['prd-artifact', 'experiment-plan', 'strategy-memo'] as const) {
      const totals = GOLDEN_SET.filter((i) => i.artifactSkillId === type).map((item) => {
        const author = item.raters.find((r) => r.raterId === 'seed-author')!;
        return Object.values(author.criteria).reduce((s: number, v) => s + v, 0);
      });
      const spread = Math.max(...totals) - Math.min(...totals);
      expect(spread).toBeGreaterThanOrEqual(6);
    }
  });

  it('covers every quality band per type', () => {
    for (const type of ['prd-artifact', 'experiment-plan', 'strategy-memo'] as const) {
      const bands = new Set(GOLDEN_SET.filter((i) => i.artifactSkillId === type).map((i) => i.targetBand));
      expect(bands).toEqual(new Set(['excellent', 'solid', 'weak', 'poor']));
    }
  });

  it('the two seed raters broadly agree (sanity on the seed itself)', () => {
    // If author and blind scores diverge wildly, the seed set is too noisy to
    // exercise the harness meaningfully. Adjacent agreement >= 0.8 pooled.
    const pairs = interRaterPairs(GOLDEN_SET);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].criteria.adjacent).toBeGreaterThanOrEqual(0.8);
  });
});
