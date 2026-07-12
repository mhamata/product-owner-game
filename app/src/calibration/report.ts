import type { ArtifactVerdictV2 } from '@/lib/artifactGraderV2';
import {
  evaluateGates,
  graderVsRaters,
  interRaterPairs,
  median,
  meanOf,
  scorerFromRuns,
  type GateResult,
  type PairReport,
  type CalibrationGates,
  DEFAULT_GATES,
} from './agreement';
import type { GraderVersion } from './cliOptions';
import type { GoldenArtifactType, GoldenItem, GraderRun } from './types';

/**
 * Report assembly for a calibration run: one JSON object (machine-readable,
 * stored alongside CI history) and one markdown rendering (human-readable,
 * the thing you actually paste into a decision doc).
 */

export interface TypeSection {
  type: GoldenArtifactType;
  itemCount: number;
  graderPairs: PairReport[];
  raterPairs: PairReport[];
  gates: GateResult[];
}

export interface CalibrationReport {
  generatedAt: string;
  /**
   * Which grading contract produced this report. `v1` is the FROZEN Phase-0
   * calibration contract; `v2` targets `gradeArtifactV2`. Always present so a
   * v2 report can never be mistaken for the frozen v1 baseline.
   */
  graderVersion: GraderVersion;
  provenance: 'synthetic-seed' | 'panel' | 'mixed';
  itemCount: number;
  runCount: number;
  raterIds: string[];
  perType: TypeSection[];
  overallGates: GateResult[];
  /** Per-item detail rows for the appendix table. */
  items: ItemRow[];
  /**
   * Full v2 verdicts (one per graded run: annotations, topFix, delta),
   * present only when `graderVersion` is `v2`. The agreement math above only
   * ever uses the 0-3 criterion bands from these verdicts; this array exists
   * purely so annotation quality stays inspectable later.
   */
  v2Verdicts?: Array<{ itemId: string; verdict: ArtifactVerdictV2 }>;
}

export interface ItemRow {
  id: string;
  type: GoldenArtifactType;
  targetBand: string;
  /** Per-criterion "panel median / grader" pairs, in rubric order. */
  scores: Array<{ criterionId: string; panelMedian: number; grader: number }>;
  panelPass: boolean;
  graderPass: boolean;
}

export function buildReport(
  items: GoldenItem[],
  runs: GraderRun[],
  gates: CalibrationGates = DEFAULT_GATES,
  graderVersion: GraderVersion = 'v1',
): CalibrationReport {
  const grader = scorerFromRuns(runs);
  const provenances = new Set(items.map((i) => i.provenance));
  const provenance =
    provenances.size > 1 ? 'mixed' : ((items[0]?.provenance ?? 'synthetic-seed') as CalibrationReport['provenance']);

  const types = [...new Set(items.map((i) => i.artifactSkillId))] as GoldenArtifactType[];
  const perType: TypeSection[] = types.map((type) => {
    const subset = items.filter((i) => i.artifactSkillId === type);
    const graderPairs = graderVsRaters(subset, grader);
    const raterPairs = interRaterPairs(subset);
    return {
      type,
      itemCount: subset.length,
      graderPairs,
      raterPairs,
      gates: evaluateGates(graderPairs, raterPairs, gates),
    };
  });

  const allGraderPairs = graderVsRaters(items, grader);
  const allRaterPairs = interRaterPairs(items);

  const itemRows: ItemRow[] = items.map((item) => {
    const graderScores = grader.scores.get(item.id) ?? {};
    const criterionIds = Object.keys(item.raters[0]?.criteria ?? {});
    return {
      id: item.id,
      type: item.artifactSkillId,
      targetBand: item.targetBand,
      scores: criterionIds.map((criterionId) => ({
        criterionId,
        panelMedian: median(
          item.raters.map((r) => r.criteria[criterionId]).filter((v) => v !== undefined),
        ),
        grader: graderScores[criterionId] ?? NaN,
      })),
      panelPass: item.raters.filter((r) => r.pass).length * 2 >= item.raters.length,
      graderPass: grader.pass.get(item.id) ?? false,
    };
  });

  const v2Verdicts =
    graderVersion === 'v2'
      ? runs
          .filter((r): r is GraderRun & { verdictV2: ArtifactVerdictV2 } => r.verdictV2 !== undefined)
          .map((r) => ({ itemId: r.itemId, verdict: r.verdictV2 }))
      : undefined;

  return {
    generatedAt: new Date().toISOString(),
    graderVersion,
    provenance,
    itemCount: items.length,
    runCount: runs.length,
    raterIds: [...new Set(items.flatMap((i) => i.raters.map((r) => r.raterId)))].sort(),
    perType,
    overallGates: evaluateGates(allGraderPairs, allRaterPairs, gates),
    items: itemRows,
    ...(v2Verdicts ? { v2Verdicts } : {}),
  };
}

/* ------------------------------------------------------------------
   Markdown rendering.
   ------------------------------------------------------------------ */

export function renderMarkdown(report: CalibrationReport): string {
  const lines: string[] = [];
  lines.push('# Grader calibration report');
  lines.push('');
  lines.push(
    report.graderVersion === 'v2'
      ? '**Grader: V2** — targets `gradeArtifactV2` (block-anchored annotations + revision delta). ' +
          'Agreement math below uses only the 0-3 criterion bands; full per-item annotations/topFix/delta ' +
          'are in `v2Verdicts` in the accompanying report.json.'
      : '**Grader: V1** — the FROZEN Phase-0 calibration contract (`artifactGrader.ts`).',
  );
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Items: ${report.itemCount} · Grader runs: ${report.runCount} · Raters: ${report.raterIds.join(', ')}`);
  lines.push('');

  if (report.provenance !== 'panel') {
    lines.push(
      '> **⚠️ PROVENANCE: ' +
        report.provenance.toUpperCase() +
        '.** Reference scores include synthetic seed raters, not (only) the paid senior-PM panel. ' +
        'This run exercises the harness and tracks grader drift; it is NOT the Phase-0 go/no-go evidence. ' +
        'The gate decision requires `provenance: panel` scores.',
    );
    lines.push('');
  }

  lines.push('## Go/no-go gates (all items pooled)');
  lines.push('');
  lines.push(renderGateTable(report.overallGates));
  lines.push('');

  for (const section of report.perType) {
    lines.push(`## ${section.type} (${section.itemCount} items)`);
    lines.push('');
    lines.push('### Grader vs raters');
    lines.push(renderPairTable(section.graderPairs));
    if (section.raterPairs.length > 0) {
      lines.push('### Rater vs rater (human ceiling)');
      lines.push(renderPairTable(section.raterPairs));
    }
    lines.push('### Gates');
    lines.push(renderGateTable(section.gates));
    lines.push('');
  }

  lines.push('## Per-item detail');
  lines.push('');
  lines.push('| Item | Band | Criterion scores (panel median → grader) | Pass (panel → grader) |');
  lines.push('|---|---|---|---|');
  for (const row of report.items) {
    const scores = row.scores
      .map((s) => `${s.criterionId}: ${fmtNum(s.panelMedian)}→${fmtNum(s.grader)}`)
      .join(' · ');
    lines.push(
      `| ${row.id} | ${row.targetBand} | ${scores} | ${passMark(row.panelPass)} → ${passMark(row.graderPass)} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function renderPairTable(pairs: PairReport[]): string {
  const lines: string[] = [];
  lines.push('| Pair | n | Exact | Adjacent | MAE | QWK | Pass agr. | Pass κ |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const p of pairs) {
    lines.push(
      `| ${p.a} ↔ ${p.b} | ${p.criteria.n} | ${fmtNum(p.criteria.exact)} | ${fmtNum(p.criteria.adjacent)} | ${fmtNum(p.criteria.mae)} | ${fmtNullable(p.criteria.qwk)} | ${fmtNum(p.pass.agreement)} | ${fmtNullable(p.pass.kappa)} |`,
    );
  }
  const qwkMean = meanOf(pairs.map((p) => p.criteria.qwk));
  if (pairs.length > 1 && qwkMean !== null) {
    lines.push(`| **mean** | | | | | **${qwkMean.toFixed(3)}** | | |`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderGateTable(gates: GateResult[]): string {
  const lines: string[] = [];
  lines.push('| Gate | Target | Actual | Verdict |');
  lines.push('|---|---|---|---|');
  for (const g of gates) {
    const verdict = g.passed === null ? '—' : g.passed ? '✅ pass' : '❌ fail';
    lines.push(`| ${g.gate} | ${g.target} | ${g.actual} | ${verdict} |`);
  }
  return lines.join('\n');
}

function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return 'n/a';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function fmtNullable(v: number | null): string {
  return v === null ? 'n/a' : v.toFixed(3);
}

function passMark(pass: boolean): string {
  return pass ? 'pass' : 'fail';
}
