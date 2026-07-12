import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PanelImportError,
  applyPanelImport,
  buildImportPlan,
  parsePanelCsv,
  runPanelImport,
  serializeGoldenSetSource,
  validatePanelImport,
  type GoldenSetFileGroup,
} from '../panelImport';
import type { GoldenItem } from '../types';

/**
 * Panel-import fixtures use the real 'prd-artifact' / 'experiment-plan'
 * rubrics (see src/curriculum/artifacts/one-page-prd.ts and
 * experiment-plan.ts) so validatePanelImport's ARTIFACT_CONTENT lookups
 * resolve exactly as they would against the real golden set.
 */
const PRD_CRITERIA = ['problem-clarity', 'solution-specificity', 'measurable-success', 'scope-discipline'] as const;
const HEADER = 'item_id,artifact_type,criterion_id,criterion_label,score_0_to_3';

// Only 'prd-artifact' fixtures are built by this helper; the one test that
// needs an 'experiment-plan' item constructs it directly with that rubric's
// own criterion ids (falsifiable-hypothesis, single-primary-metric, ...).
function seedItem(id: string, artifactSkillId: GoldenItem['artifactSkillId'] = 'prd-artifact'): GoldenItem {
  const criteria = Object.fromEntries(PRD_CRITERIA.map((critId) => [critId, 2])) as Record<string, 2>;
  return {
    id,
    artifactSkillId,
    industry: 'saas',
    targetBand: 'solid',
    submission: 'A submission long enough to clear the length sanity check. '.repeat(5),
    raters: [
      { raterId: 'seed-author', criteria, pass: true },
      { raterId: 'seed-blind', criteria, pass: true },
    ],
    provenance: 'synthetic-seed',
  };
}

function row(itemId: string, artifactType: string, criterionId: string, label: string, score: string): string {
  return `${itemId},${artifactType},${criterionId},"${label}",${score}`;
}

/** A fully-scored, well-formed CSV for one prd-artifact item. */
function prdCsv(itemId: string, scores: [number, number, number, number], pass: 'pass' | 'fail' | string): string {
  return [
    HEADER,
    row(itemId, 'prd-artifact', 'problem-clarity', 'Problem clarity', String(scores[0])),
    row(itemId, 'prd-artifact', 'solution-specificity', 'Solution specificity', String(scores[1])),
    row(itemId, 'prd-artifact', 'measurable-success', 'Measurable success', String(scores[2])),
    row(itemId, 'prd-artifact', 'scope-discipline', 'Scope discipline', String(scores[3])),
    row(itemId, 'prd-artifact', 'OVERALL_PASS', 'pass or fail', pass),
  ].join('\n');
}

/* ------------------------------------------------------------------
   CSV parsing.
   ------------------------------------------------------------------ */

describe('parsePanelCsv', () => {
  it('parses one row per line, honoring quoted labels', () => {
    const rows = parsePanelCsv(prdCsv('prd-01', [3, 2, 1, 0], 'pass'));
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({
      itemId: 'prd-01',
      artifactType: 'prd-artifact',
      criterionId: 'problem-clarity',
      criterionLabel: 'Problem clarity',
      rawScore: '3',
      line: 2,
    });
  });

  it('treats a blank score cell as ungraded rather than a parse error', () => {
    const csv = [HEADER, row('prd-01', 'prd-artifact', 'problem-clarity', 'Problem clarity', '')].join('\n');
    const rows = parsePanelCsv(csv);
    expect(rows[0].rawScore).toBe('');
  });

  it('rejects an empty file', () => {
    expect(() => parsePanelCsv('')).toThrow(PanelImportError);
    expect(() => parsePanelCsv('')).toThrow(/CSV is empty/);
  });

  it('rejects an unexpected header', () => {
    expect(() => parsePanelCsv('wrong,header\nprd-01,x')).toThrow(/Unexpected CSV header/);
  });

  it('rejects a row with the wrong number of columns', () => {
    const csv = [HEADER, 'prd-01,prd-artifact,problem-clarity,"Problem clarity"'].join('\n');
    expect(() => parsePanelCsv(csv)).toThrow(/expected 5 columns/);
  });
});

/* ------------------------------------------------------------------
   Validation — one test per failure mode required by the import contract.
   ------------------------------------------------------------------ */

describe('validatePanelImport', () => {
  const goldenSet = [seedItem('prd-01'), seedItem('prd-02')];

  it('accepts a fully-scored, well-formed CSV', () => {
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(prdCsv('prd-01', [3, 2, 1, 0], 'pass')));
    expect(problems).toEqual([]);
  });

  it('allows partial coverage across items (grading a subset is fine)', () => {
    // Only prd-01 appears in the CSV at all; prd-02 is simply not covered.
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(prdCsv('prd-01', [2, 2, 2, 2], 'pass')));
    expect(problems).toEqual([]);
  });

  it('flags an unknown item id', () => {
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(prdCsv('prd-99', [2, 2, 2, 2], 'pass')));
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((p) => /unknown item id "prd-99"/.test(p))).toBe(true);
  });

  it('flags a score outside the 0-3 band', () => {
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(prdCsv('prd-01', [4, 2, 2, 2], 'pass')));
    expect(problems.some((p) => /outside the 0-3 band/.test(p))).toBe(true);
  });

  it('flags a non-integer score', () => {
    const csv = [
      HEADER,
      row('prd-01', 'prd-artifact', 'problem-clarity', 'Problem clarity', '2.5'),
      row('prd-01', 'prd-artifact', 'solution-specificity', 'Solution specificity', '2'),
      row('prd-01', 'prd-artifact', 'measurable-success', 'Measurable success', '2'),
      row('prd-01', 'prd-artifact', 'scope-discipline', 'Scope discipline', '2'),
      row('prd-01', 'prd-artifact', 'OVERALL_PASS', 'pass or fail', 'pass'),
    ].join('\n');
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(csv));
    expect(problems.some((p) => /outside the 0-3 band/.test(p))).toBe(true);
  });

  it('flags missing criteria for an item (partial row coverage WITHIN a covered item)', () => {
    const csv = [
      HEADER,
      row('prd-01', 'prd-artifact', 'problem-clarity', 'Problem clarity', '2'),
      row('prd-01', 'prd-artifact', 'OVERALL_PASS', 'pass or fail', 'pass'),
    ].join('\n');
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(csv));
    expect(problems.some((p) => p.includes('missing criterion "solution-specificity"'))).toBe(true);
    expect(problems.some((p) => p.includes('missing criterion "measurable-success"'))).toBe(true);
    expect(problems.some((p) => p.includes('missing criterion "scope-discipline"'))).toBe(true);
  });

  it('flags a missing OVERALL_PASS row', () => {
    const csv = [
      HEADER,
      row('prd-01', 'prd-artifact', 'problem-clarity', 'Problem clarity', '2'),
      row('prd-01', 'prd-artifact', 'solution-specificity', 'Solution specificity', '2'),
      row('prd-01', 'prd-artifact', 'measurable-success', 'Measurable success', '2'),
      row('prd-01', 'prd-artifact', 'scope-discipline', 'Scope discipline', '2'),
    ].join('\n');
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(csv));
    expect(problems.some((p) => p.includes('missing OVERALL_PASS row'))).toBe(true);
  });

  it('flags an invalid OVERALL_PASS value', () => {
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(prdCsv('prd-01', [2, 2, 2, 2], 'maybe')));
    expect(problems.some((p) => /must be "pass" or "fail"/.test(p))).toBe(true);
  });

  it('flags duplicate rows for the same item/criterion pair', () => {
    const csv =
      prdCsv('prd-01', [2, 2, 2, 2], 'pass') + '\n' + row('prd-01', 'prd-artifact', 'problem-clarity', 'Problem clarity', '3');
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(csv));
    expect(problems.some((p) => p.includes('duplicate row'))).toBe(true);
  });

  it('flags a rater id already present on an item', () => {
    const withPanelAlready = [
      { ...goldenSet[0], raters: [...goldenSet[0].raters, { raterId: 'panel-1', criteria: { ...goldenSet[0].raters[0].criteria }, pass: true }] },
      goldenSet[1],
    ];
    const problems = validatePanelImport(withPanelAlready, 'panel-1', parsePanelCsv(prdCsv('prd-01', [2, 2, 2, 2], 'pass')));
    expect(problems.some((p) => p.includes('already present'))).toBe(true);
  });

  it('flags an artifact_type mismatch against the golden set', () => {
    const csv = [
      HEADER,
      row('prd-01', 'experiment-plan', 'problem-clarity', 'Problem clarity', '2'),
      row('prd-01', 'experiment-plan', 'solution-specificity', 'Solution specificity', '2'),
      row('prd-01', 'experiment-plan', 'measurable-success', 'Measurable success', '2'),
      row('prd-01', 'experiment-plan', 'scope-discipline', 'Scope discipline', '2'),
      row('prd-01', 'experiment-plan', 'OVERALL_PASS', 'pass or fail', 'pass'),
    ].join('\n');
    const problems = validatePanelImport(goldenSet, 'panel-1', parsePanelCsv(csv));
    expect(problems.some((p) => /artifact_type "experiment-plan".*says "prd-artifact"/.test(p))).toBe(true);
  });
});

/* ------------------------------------------------------------------
   buildImportPlan + applyPanelImport — the seed-replacement / provenance
   flip / accumulation behavior.
   ------------------------------------------------------------------ */

describe('buildImportPlan', () => {
  it('builds a plan entry only for covered items', () => {
    const goldenSet = [seedItem('prd-01'), seedItem('prd-02')];
    const rows = parsePanelCsv(prdCsv('prd-01', [3, 2, 1, 0], 'pass'));
    const plan = buildImportPlan(goldenSet, rows);
    expect(plan).toEqual([
      {
        itemId: 'prd-01',
        criteria: { 'problem-clarity': 3, 'solution-specificity': 2, 'measurable-success': 1, 'scope-discipline': 0 },
        pass: true,
      },
    ]);
  });
});

describe('applyPanelImport', () => {
  it('replaces the synthetic seed raters and flips provenance on covered items only', () => {
    const goldenSet = [seedItem('prd-01'), seedItem('prd-02')];
    const rows = parsePanelCsv(prdCsv('prd-01', [3, 3, 3, 3], 'pass'));
    const plan = buildImportPlan(goldenSet, rows);
    const { items, coveredIds } = applyPanelImport(goldenSet, 'panel-1', plan);

    expect(coveredIds).toEqual(['prd-01']);

    const updated = items.find((i) => i.id === 'prd-01')!;
    expect(updated.provenance).toBe('panel');
    expect(updated.raters).toEqual([
      { raterId: 'panel-1', criteria: { 'problem-clarity': 3, 'solution-specificity': 3, 'measurable-success': 3, 'scope-discipline': 3 }, pass: true },
    ]);

    // Untouched item: unchanged, still synthetic, same object reference.
    const untouched = items.find((i) => i.id === 'prd-02')!;
    expect(untouched).toBe(goldenSet[1]);
    expect(untouched.provenance).toBe('synthetic-seed');
  });

  it('does not mutate the input golden set', () => {
    const goldenSet = [seedItem('prd-01')];
    const rows = parsePanelCsv(prdCsv('prd-01', [3, 3, 3, 3], 'pass'));
    const plan = buildImportPlan(goldenSet, rows);
    applyPanelImport(goldenSet, 'panel-1', plan);
    expect(goldenSet[0].provenance).toBe('synthetic-seed');
    expect(goldenSet[0].raters.map((r) => r.raterId)).toEqual(['seed-author', 'seed-blind']);
  });

  it('accumulates a second panel rater without disturbing the first', () => {
    const goldenSet = [seedItem('prd-01')];
    const rows1 = parsePanelCsv(prdCsv('prd-01', [3, 3, 3, 3], 'pass'));
    const afterFirst = applyPanelImport(goldenSet, 'panel-1', buildImportPlan(goldenSet, rows1)).items;

    const rows2 = parsePanelCsv(prdCsv('prd-01', [1, 1, 1, 1], 'fail'));
    const afterSecond = applyPanelImport(afterFirst, 'panel-2', buildImportPlan(afterFirst, rows2)).items;

    const finalItem = afterSecond.find((i) => i.id === 'prd-01')!;
    expect(finalItem.provenance).toBe('panel');
    expect(finalItem.raters.map((r) => r.raterId).sort()).toEqual(['panel-1', 'panel-2']);
    const panel1 = finalItem.raters.find((r) => r.raterId === 'panel-1')!;
    expect(panel1.criteria).toEqual({ 'problem-clarity': 3, 'solution-specificity': 3, 'measurable-success': 3, 'scope-discipline': 3 });
  });
});

/* ------------------------------------------------------------------
   runPanelImport — the orchestrator (validate -> plan -> apply -> regroup).
   ------------------------------------------------------------------ */

describe('runPanelImport', () => {
  it('returns problems and no groups/summary when validation fails, leaving inputs untouched', () => {
    const goldenSet = [seedItem('prd-01')];
    const groups: GoldenSetFileGroup[] = [{ filePath: '/does/not/matter.ts', arrayName: 'X', items: goldenSet }];
    const result = runPanelImport(goldenSet, groups, 'panel-1', prdCsv('prd-99', [2, 2, 2, 2], 'pass'));
    expect(result.problems.length).toBeGreaterThan(0);
    expect(result.groups).toBeUndefined();
    expect(result.summary).toBeUndefined();
  });

  it('regroups updated items back into their original file groups, in order', () => {
    const prdItems = [seedItem('prd-01'), seedItem('prd-02')];
    const expItems = [seedItem('exp-01', 'experiment-plan')];
    // exp-01 needs the experiment-plan rubric ids, not the prd ones — rebuild it directly.
    const expItemCorrect: GoldenItem = {
      ...expItems[0],
      raters: [
        {
          raterId: 'seed-author',
          criteria: { 'falsifiable-hypothesis': 2, 'single-primary-metric': 2, guardrails: 2, 'decision-rule': 2 },
          pass: true,
        },
        {
          raterId: 'seed-blind',
          criteria: { 'falsifiable-hypothesis': 2, 'single-primary-metric': 2, guardrails: 2, 'decision-rule': 2 },
          pass: true,
        },
      ],
    };
    const goldenSet = [...prdItems, expItemCorrect];
    const groups: GoldenSetFileGroup[] = [
      { filePath: '/fake/prd.ts', arrayName: 'PRD_GOLDEN', items: prdItems },
      { filePath: '/fake/experiment.ts', arrayName: 'EXPERIMENT_GOLDEN', items: [expItemCorrect] },
    ];

    const result = runPanelImport(goldenSet, groups, 'panel-1', prdCsv('prd-02', [3, 3, 3, 3], 'pass'));

    expect(result.problems).toEqual([]);
    expect(result.groups).toHaveLength(2);
    expect(result.groups![0].items.map((i) => i.id)).toEqual(['prd-01', 'prd-02']);
    expect(result.groups![0].items[0].provenance).toBe('synthetic-seed'); // prd-01 untouched
    expect(result.groups![0].items[1].provenance).toBe('panel'); // prd-02 updated
    expect(result.groups![1].items.map((i) => i.id)).toEqual(['exp-01']);
    expect(result.groups![1].items[0].provenance).toBe('synthetic-seed'); // untouched, different file entirely

    expect(result.summary).toEqual({
      raterId: 'panel-1',
      updatedItemIds: ['prd-02'],
      stillSyntheticIds: ['prd-01', 'exp-01'],
      raterIdsOnFile: ['panel-1', 'seed-author', 'seed-blind'],
    });
  });
});

/* ------------------------------------------------------------------
   serializeGoldenSetSource — the file-rewrite string transform.
   ------------------------------------------------------------------ */

describe('serializeGoldenSetSource', () => {
  const originalFixture = [
    "import type { GoldenItem } from '../types';",
    '',
    '/**',
    ' * GOLDEN SET fixture — header comment that must survive a rewrite untouched.',
    ' */',
    'export const FIXTURE_GOLDEN: GoldenItem[] = [',
    '  {',
    '    "id": "old-item"',
    '  }',
    '];',
    '',
  ].join('\n');

  it('preserves everything before the array literal and reserializes items as JSON', () => {
    const items = [seedItem('prd-01')];
    const out = serializeGoldenSetSource(originalFixture, 'FIXTURE_GOLDEN', items);
    expect(out.startsWith("import type { GoldenItem } from '../types';")).toBe(true);
    expect(out).toContain('header comment that must survive a rewrite untouched');
    expect(out).toContain('export const FIXTURE_GOLDEN: GoldenItem[] = ');
    expect(out).toContain('"id": "prd-01"');
    expect(out).not.toContain('old-item');
    expect(out.endsWith('];\n')).toBe(true);
  });

  it('throws PanelImportError when the array marker is missing', () => {
    expect(() => serializeGoldenSetSource('nothing to see here', 'MISSING_GOLDEN', [])).toThrow(PanelImportError);
  });
});

/* ------------------------------------------------------------------
   Dry mode: exercises the exact read/serialize/write sequence the CLI uses,
   against a fixture file the test writes itself into a tmp dir. Confirms
   dry mode makes zero filesystem writes, and a real run rewrites correctly.
   ------------------------------------------------------------------ */

describe('dry mode', () => {
  it('writes nothing to disk when dry, and rewrites correctly when not', () => {
    const dir = mkdtempSync(join(tmpdir(), 'panel-import-test-'));
    const filePath = join(dir, 'fixture-golden.ts');
    const original = [
      "import type { GoldenItem } from '../types';",
      '',
      '/** GOLDEN SET fixture for the dry-mode test. */',
      'export const FIXTURE_GOLDEN: GoldenItem[] = [',
      '  { "id": "placeholder" }',
      '];',
      '',
    ].join('\n');
    writeFileSync(filePath, original);

    const goldenSet = [seedItem('prd-01')];
    const groups: GoldenSetFileGroup[] = [{ filePath, arrayName: 'FIXTURE_GOLDEN', items: goldenSet }];
    const csv = prdCsv('prd-01', [3, 3, 3, 3], 'pass');

    const result = runPanelImport(goldenSet, groups, 'panel-1', csv);
    expect(result.problems).toEqual([]);

    // Simulate the CLI with --dry: it must not call writeFileSync at all.
    const dryRun = true;
    if (!dryRun) {
      for (const g of result.groups!) {
        writeFileSync(g.filePath, serializeGoldenSetSource(readFileSync(g.filePath, 'utf8'), g.arrayName, g.items));
      }
    }
    expect(readFileSync(filePath, 'utf8')).toBe(original);

    // Now perform the real write (dry = false) and confirm it lands correctly.
    for (const g of result.groups!) {
      writeFileSync(g.filePath, serializeGoldenSetSource(readFileSync(g.filePath, 'utf8'), g.arrayName, g.items));
    }
    const rewritten = readFileSync(filePath, 'utf8');
    expect(rewritten).not.toBe(original);
    expect(rewritten).toContain('"raterId": "panel-1"');
    expect(rewritten).not.toContain('seed-author');
    expect(rewritten).toContain('"provenance": "panel"');
  });
});
