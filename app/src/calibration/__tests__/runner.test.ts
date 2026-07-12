import { describe, expect, it, vi } from 'vitest';

/**
 * `gradeGoldenItemV2` grades a golden-set item with `gradeArtifactV2` (the
 * grading contract the paid wedge ships once it cuts over — docs/PHASE1.md
 * Decisions) and must map its verdict into the SAME agreement-input shape as
 * the frozen v1 path: per-criterion 0-3 bands + pass + overallScore. The
 * V2-only fields (annotations, topFix, delta) must never leak into that
 * mapping, but the full verdict is kept on `verdictV2` so annotation quality
 * stays inspectable in the report later.
 *
 * The Anthropic SDK is mocked so no real model call happens; the spy is
 * declared before `vi.mock` and referenced via closure (vitest hoists
 * `vi.mock` above other statements, but the factory itself only runs when the
 * mocked module is imported, by which time the closed-over spy is assigned).
 */

const mockedV2Json = {
  criteria: [
    { id: 'problem-clarity', label: 'Problem clarity', score: 3, comment: 'Sharp and specific.' },
    { id: 'solution-specificity', label: 'Solution specificity', score: 2, comment: 'Reasonably concrete.' },
    { id: 'measurable-success', label: 'Measurable success', score: 1, comment: 'Missing a guardrail.' },
    { id: 'scope-discipline', label: 'Scope discipline', score: 0, comment: 'No cuts named.' },
    // A hallucinated id the rubric does not know: must be dropped, exactly like v1.
    { id: 'not-a-real-criterion', label: 'Bogus', score: 3, comment: 'Should never appear.' },
  ],
  annotations: [
    { block: 1, severity: 'praise', comment: 'Strong opening paragraph.' },
    { block: 1, severity: 'major', comment: 'Needs a named guardrail metric.', rewriteSuggestion: 'Add a counter-metric.' },
  ],
  topFix: 'Add a guardrail metric to the success section.',
  strengths: ['Clear problem framing'],
  gaps: ['Scope section has no explicit cuts'],
  overall: 'Good problem framing; success metrics and scope need more rigor.',
  overallScore: 65,
  passed: false,
};

const createSpy = vi.fn(async () => ({
  content: [{ type: 'text', text: JSON.stringify(mockedV2Json) }],
  usage: { input_tokens: 100, output_tokens: 50 },
}));

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: createSpy };
  }
  return { default: MockAnthropic };
});

// Imported after the mock is set up so the runner binds to the mocked SDK.
import Anthropic from '@anthropic-ai/sdk';
import { gradeGoldenItemV2 } from '../runner';
import { GOLDEN_SET } from '../goldenSet';

const PRD_ITEM = GOLDEN_SET.find((i) => i.id === 'prd-01')!;

describe('gradeGoldenItemV2', () => {
  it('maps the V2 verdict into the same agreement-input shape as v1: criteria + pass + overallScore', async () => {
    const client = new Anthropic({ apiKey: 'test-key-not-used-network-is-mocked' });
    const run = await gradeGoldenItemV2(client, PRD_ITEM);

    expect(run.itemId).toBe('prd-01');
    expect(run.criteria).toEqual({
      'problem-clarity': 3,
      'solution-specificity': 2,
      'measurable-success': 1,
      'scope-discipline': 0,
    });
    expect(run.pass).toBe(false);
    expect(run.overallScore).toBe(65);
  });

  it('drops a hallucinated criterion id, exactly like the v1 mapping', async () => {
    const client = new Anthropic({ apiKey: 'test-key-not-used-network-is-mocked' });
    const run = await gradeGoldenItemV2(client, PRD_ITEM);

    expect(run.criteria).not.toHaveProperty('not-a-real-criterion');
    expect(Object.keys(run.criteria).sort()).toEqual(
      ['measurable-success', 'problem-clarity', 'scope-discipline', 'solution-specificity'].sort(),
    );
  });

  it('attaches the full V2 verdict on verdictV2 for later annotation-quality inspection', async () => {
    const client = new Anthropic({ apiKey: 'test-key-not-used-network-is-mocked' });
    const run = await gradeGoldenItemV2(client, PRD_ITEM);

    expect(run.verdictV2).toBeDefined();
    expect(run.verdictV2?.annotations).toHaveLength(2);
    expect(run.verdictV2?.topFix).toBe('Add a guardrail metric to the success section.');
    expect(run.verdictV2?.delta).toBeUndefined();
  });

  it('never lets annotations, topFix, or delta leak into the agreement-input criteria map', async () => {
    const client = new Anthropic({ apiKey: 'test-key-not-used-network-is-mocked' });
    const run = await gradeGoldenItemV2(client, PRD_ITEM);

    const criteriaValues = Object.values(run.criteria);
    expect(criteriaValues.every((v) => typeof v === 'number' && v >= 0 && v <= 3)).toBe(true);
    expect(run.criteria).not.toHaveProperty('annotations');
    expect(run.criteria).not.toHaveProperty('topFix');
  });
});
