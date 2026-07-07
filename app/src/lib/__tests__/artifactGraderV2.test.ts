import { describe, it, expect } from 'vitest';
import {
  splitIntoBlocks,
  normalizeVerdictV2,
  MAX_ANNOTATIONS,
  type AnnotationSeverity,
  type RubricCriterionInput,
} from '../artifactGraderV2';

/**
 * The V2 grader's two pure surfaces carry all the correctness that is not the
 * model's: `splitIntoBlocks` decides the numbering the model and the UI both
 * anchor to, and `normalizeVerdictV2` is the trust boundary that turns loose
 * model JSON into a shape the UI can render without defensive checks everywhere.
 * Both are pinned here.
 */

const RUBRIC: RubricCriterionInput[] = [
  { id: 'clarity', label: 'Problem clarity', descriptor: 'The problem is specific.' },
  { id: 'metrics', label: 'Metrics', descriptor: 'Success is measurable.' },
];

describe('splitIntoBlocks', () => {
  it('returns no blocks for an empty submission', () => {
    expect(splitIntoBlocks('')).toEqual([]);
    expect(splitIntoBlocks('   \n\n  ')).toEqual([]);
  });

  it('treats a single paragraph as one block', () => {
    const blocks = splitIntoBlocks('This is one paragraph with no breaks.');
    expect(blocks).toEqual([{ index: 1, text: 'This is one paragraph with no breaks.' }]);
  });

  it('splits paragraphs on blank-line boundaries and numbers 1-based', () => {
    const blocks = splitIntoBlocks('First para.\n\nSecond para.\n\nThird para.');
    expect(blocks).toEqual([
      { index: 1, text: 'First para.' },
      { index: 2, text: 'Second para.' },
      { index: 3, text: 'Third para.' },
    ]);
  });

  it('collapses multiple blank lines into a single boundary', () => {
    const blocks = splitIntoBlocks('First.\n\n\n\nSecond.');
    expect(blocks.map((b) => b.text)).toEqual(['First.', 'Second.']);
    expect(blocks.map((b) => b.index)).toEqual([1, 2]);
  });

  it('treats whitespace-only lines between paragraphs as a boundary', () => {
    const blocks = splitIntoBlocks('First.\n   \nSecond.');
    expect(blocks.map((b) => b.text)).toEqual(['First.', 'Second.']);
  });

  it('makes each "## header" its own block, kept verbatim', () => {
    const submission = '## Problem\nThe problem body.\n\n## Solution\nThe solution body.';
    const blocks = splitIntoBlocks(submission);
    expect(blocks).toEqual([
      { index: 1, text: '## Problem' },
      { index: 2, text: 'The problem body.' },
      { index: 3, text: '## Solution' },
      { index: 4, text: 'The solution body.' },
    ]);
  });

  it('peels a leading header off a header-glued-to-body paragraph', () => {
    // composeSubmission emits "## Label\nbody" with no blank line between them.
    const blocks = splitIntoBlocks('## Label\nbody text here');
    expect(blocks).toEqual([
      { index: 1, text: '## Label' },
      { index: 2, text: 'body text here' },
    ]);
  });

  it('handles a header with no body beneath it', () => {
    const blocks = splitIntoBlocks('## Empty Section\n\n## Next\nbody');
    expect(blocks).toEqual([
      { index: 1, text: '## Empty Section' },
      { index: 2, text: '## Next' },
      { index: 3, text: 'body' },
    ]);
  });

  it('normalises CRLF newlines so pasted docs do not create phantom blocks', () => {
    const blocks = splitIntoBlocks('First.\r\n\r\nSecond.');
    expect(blocks.map((b) => b.text)).toEqual(['First.', 'Second.']);
  });

  it('preserves interior single newlines within a paragraph', () => {
    const blocks = splitIntoBlocks('- item one\n- item two\n- item three');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].text).toBe('- item one\n- item two\n- item three');
  });
});

/** A minimal valid parsed verdict, spread-and-overridden per test. */
function baseParsed(): Record<string, unknown> {
  return {
    criteria: [
      { id: 'clarity', label: 'Problem clarity', score: 2, comment: 'Decent.' },
      { id: 'metrics', label: 'Metrics', score: 3, comment: 'Strong.' },
    ],
    annotations: [
      { block: 1, severity: 'major', comment: 'Vague problem.', rewriteSuggestion: 'Be specific.' },
      { block: 2, severity: 'praise', comment: 'Great metric.' },
    ],
    topFix: 'Sharpen the problem statement.',
    strengths: ['Clear metric.'],
    gaps: ['Vague problem.'],
    overall: 'Solid start.',
    overallScore: 83,
    passed: true,
  };
}

describe('normalizeVerdictV2', () => {
  it('passes a well-formed verdict through with types intact', () => {
    const v = normalizeVerdictV2(baseParsed(), RUBRIC, 3);
    expect(v.criteria).toHaveLength(2);
    expect(v.annotations).toHaveLength(2);
    expect(v.topFix).toBe('Sharpen the problem statement.');
    expect(v.overallScore).toBe(83);
    expect(v.passed).toBe(true);
    expect(v.delta).toBeUndefined();
  });

  it('clamps criterion scores to the 0-3 band', () => {
    const parsed = baseParsed();
    parsed.criteria = [
      { id: 'clarity', label: 'X', score: 9, comment: '' },
      { id: 'metrics', label: 'Y', score: -4, comment: '' },
      { id: 'z', label: 'Z', score: 2.6, comment: '' },
    ];
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.criteria.map((c) => c.score)).toEqual([3, 0, 3]);
  });

  it('clamps annotation block refs into the real block range', () => {
    const parsed = baseParsed();
    parsed.annotations = [
      { block: 99, severity: 'major', comment: 'Too high.' },
      { block: 0, severity: 'minor', comment: 'Too low.' },
      { block: 2, severity: 'praise', comment: 'In range.' },
    ];
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.annotations.map((a) => a.block)).toEqual([3, 1, 2]);
  });

  it('caps annotations at MAX_ANNOTATIONS, preserving order', () => {
    const parsed = baseParsed();
    parsed.annotations = Array.from({ length: MAX_ANNOTATIONS + 5 }, (_, i) => ({
      block: 1,
      severity: 'minor' as AnnotationSeverity,
      comment: `note ${i}`,
    }));
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.annotations).toHaveLength(MAX_ANNOTATIONS);
    expect(v.annotations[0].comment).toBe('note 0');
    expect(v.annotations[MAX_ANNOTATIONS - 1].comment).toBe(`note ${MAX_ANNOTATIONS - 1}`);
  });

  it('drops annotations with an invalid severity', () => {
    const parsed = baseParsed();
    parsed.annotations = [
      { block: 1, severity: 'critical', comment: 'Bad severity.' },
      { block: 1, severity: 'major', comment: 'Good severity.' },
      { block: 1, severity: 42, comment: 'Non-string severity.' },
    ];
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.annotations).toHaveLength(1);
    expect(v.annotations[0].severity).toBe('major');
  });

  it('drops annotations with no comment or an unparseable block', () => {
    const parsed = baseParsed();
    parsed.annotations = [
      { block: 1, severity: 'major', comment: '   ' },
      { block: 'not-a-number', severity: 'major', comment: 'No block.' },
      { block: 2, severity: 'minor', comment: 'Kept.' },
    ];
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.annotations).toHaveLength(1);
    expect(v.annotations[0].comment).toBe('Kept.');
  });

  it('drops all annotations when there are no blocks to anchor to', () => {
    const parsed = baseParsed();
    const v = normalizeVerdictV2(parsed, RUBRIC, 0);
    expect(v.annotations).toEqual([]);
  });

  it('omits rewriteSuggestion when it is empty or missing', () => {
    const parsed = baseParsed();
    parsed.annotations = [
      { block: 1, severity: 'major', comment: 'A.', rewriteSuggestion: '  ' },
      { block: 1, severity: 'minor', comment: 'B.' },
    ];
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.annotations[0].rewriteSuggestion).toBeUndefined();
    expect(v.annotations[1].rewriteSuggestion).toBeUndefined();
  });

  it('recomputes overallScore from bands when the model value is out of range', () => {
    const parsed = baseParsed();
    parsed.overallScore = 250; // out of range → recompute from bands
    // bands 2 + 3 = 5 of 6 max → round(5/6*100) = 83
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.overallScore).toBe(83);
  });

  it('derives passed from the score when the model omits it', () => {
    const parsed = baseParsed();
    delete parsed.passed;
    parsed.overallScore = 55;
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.passed).toBe(false);
  });

  it('tolerates a missing delta (returns undefined)', () => {
    const v = normalizeVerdictV2(baseParsed(), RUBRIC, 3);
    expect(v.delta).toBeUndefined();
  });

  it('coerces a present delta', () => {
    const parsed = baseParsed();
    parsed.delta = {
      addressed: ['Sharpened the problem.', 42],
      ignored: ['Still no baseline.'],
      regressions: [],
      scoreChangeExplanation: 'Up 12 points for a clearer problem.',
    };
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.delta).toBeDefined();
    expect(v.delta!.addressed).toEqual(['Sharpened the problem.']); // non-strings filtered
    expect(v.delta!.ignored).toEqual(['Still no baseline.']);
    expect(v.delta!.regressions).toEqual([]);
    expect(v.delta!.scoreChangeExplanation).toContain('Up 12');
  });

  it('treats an entirely empty delta object as absent', () => {
    const parsed = baseParsed();
    parsed.delta = { addressed: [], ignored: [], regressions: [], scoreChangeExplanation: '' };
    const v = normalizeVerdictV2(parsed, RUBRIC, 3);
    expect(v.delta).toBeUndefined();
  });

  it('tolerates entirely missing arrays and fields', () => {
    const v = normalizeVerdictV2({}, RUBRIC, 3);
    expect(v.criteria).toEqual([]);
    expect(v.annotations).toEqual([]);
    expect(v.strengths).toEqual([]);
    expect(v.gaps).toEqual([]);
    expect(v.topFix).toBe('');
    expect(v.overall).toBe('');
    expect(v.overallScore).toBe(0);
    expect(v.passed).toBe(false);
    expect(v.delta).toBeUndefined();
  });
});
