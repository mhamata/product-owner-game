import { ARTIFACT_CONTENT } from '@/curriculum/artifacts';
import type { CriterionBand, GoldenItem, RaterScores } from './types';

/**
 * PANEL IMPORT: turn one panelist's scored `scores.csv` — the sheet
 * `scripts/export-panel-workbook.ts` hands out, described in
 * `docs/calibration/panel-guide.md` — into golden-set mutations.
 *
 * Column format (must match `export-panel-workbook.ts` byte for byte):
 *   item_id,artifact_type,criterion_id,criterion_label,score_0_to_3
 * One row per (item, criterion), plus one `OVERALL_PASS` row per item whose
 * score column holds "pass" or "fail" instead of a 0-3 band. A blank score
 * means the panelist hasn't graded that row yet — partial coverage (a subset
 * of items) is expected and fine; partial coverage of ONE item's criteria is
 * not (see `validatePanelImport`).
 *
 * SEED REPLACEMENT: `agreement.ts`'s go/no-go gates measure the grader
 * against the panel, and the panel against itself (`DEFAULT_GATES.
 * maxQwkGapVsPanel`) — that inter-rater ceiling is the whole benchmark, so it
 * must never be diluted by the synthetic `seed-author`/`seed-blind` scores
 * that exist only to make the harness runnable pre-panel. The first panel
 * score on an item therefore REPLACES the seed raters outright rather than
 * adding to them (git history keeps the seed scores if anyone ever needs
 * them); a second, third, ... panel rater on an already-`panel` item
 * accumulates normally, since by then no seed raters remain to remove.
 *
 * Everything in this module is pure (no filesystem access) so it is testable
 * against plain in-memory golden-set fixtures. `scripts/panel-import.ts` is
 * the thin CLI wrapper that reads the CSV, calls `runPanelImport`, and — only
 * when validation is clean and `--dry` was not passed — rewrites the
 * `src/calibration/goldenSet/*.ts` source files via `serializeGoldenSetSource`.
 */

const SEED_RATER_IDS = new Set(['seed-author', 'seed-blind']);
const EXPECTED_HEADER = 'item_id,artifact_type,criterion_id,criterion_label,score_0_to_3';
const OVERALL_PASS_ID = 'OVERALL_PASS';

export class PanelImportError extends Error {}

/* ------------------------------------------------------------------
   CSV parsing.
   ------------------------------------------------------------------ */

export interface PanelCsvRow {
  itemId: string;
  artifactType: string;
  criterionId: string;
  criterionLabel: string;
  /** Raw, untrimmed-of-case score cell: '0'..'3', 'pass'/'fail', or '' (ungraded). */
  rawScore: string;
  /** 1-based line number in the CSV, for error messages (header is line 1). */
  line: number;
}

/** Split one CSV line honoring double-quoted fields (RFC4180-lite; no embedded newlines). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

/** Parse a `scores.csv` body. Throws `PanelImportError` on structural malformation. */
export function parsePanelCsv(text: string): PanelCsvRow[] {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.length > 0);
  if (lines.length === 0) throw new PanelImportError('CSV is empty.');

  const header = lines[0].trim();
  if (header !== EXPECTED_HEADER) {
    throw new PanelImportError(`Unexpected CSV header.\n  expected: ${EXPECTED_HEADER}\n  got:      ${header}`);
  }

  const rows: PanelCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = splitCsvLine(line);
    if (fields.length !== 5) {
      throw new PanelImportError(`Line ${i + 1}: expected 5 columns, got ${fields.length}: "${line}"`);
    }
    const [itemId, artifactType, criterionId, criterionLabel, rawScore] = fields;
    rows.push({
      itemId: itemId.trim(),
      artifactType: artifactType.trim(),
      criterionId: criterionId.trim(),
      criterionLabel: criterionLabel.trim(),
      rawScore: rawScore.trim(),
      line: i + 1,
    });
  }
  return rows;
}

/* ------------------------------------------------------------------
   Validation. Every failure mode the CLI must catch before writing anything
   lives here; a clean import returns an empty array.
   ------------------------------------------------------------------ */

export function validatePanelImport(goldenSet: GoldenItem[], raterId: string, rows: PanelCsvRow[]): string[] {
  const problems: string[] = [];
  const byId = new Map(goldenSet.map((i) => [i.id, i]));

  // Duplicate rows: the same (item, criterion) pair appearing twice is a
  // structurally broken sheet regardless of whether either copy is scored.
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.itemId}::${row.criterionId}`;
    if (seen.has(key)) {
      problems.push(`line ${row.line}: duplicate row for item "${row.itemId}" criterion "${row.criterionId}"`);
    }
    seen.add(key);
  }

  // Group the scored (non-blank) rows by item, flagging unknown items as we go.
  const rowsByItem = new Map<string, PanelCsvRow[]>();
  for (const row of rows) {
    if (row.rawScore === '') continue; // not yet graded — fine, partial coverage
    const item = byId.get(row.itemId);
    if (!item) {
      problems.push(`line ${row.line}: unknown item id "${row.itemId}"`);
      continue;
    }
    if (row.artifactType !== item.artifactSkillId) {
      problems.push(
        `line ${row.line}: item "${row.itemId}" has artifact_type "${row.artifactType}", but the golden set says "${item.artifactSkillId}"`,
      );
    }
    const list = rowsByItem.get(row.itemId) ?? [];
    list.push(row);
    rowsByItem.set(row.itemId, list);
  }

  for (const [itemId, itemRows] of rowsByItem) {
    const item = byId.get(itemId)!;

    if (item.raters.some((r) => r.raterId === raterId)) {
      problems.push(`item "${itemId}": rater "${raterId}" is already present on this item`);
    }

    const rubric = ARTIFACT_CONTENT[item.artifactSkillId]?.rubric ?? [];
    const rubricIds = new Set(rubric.map((c) => c.id));
    const rowCriteria = new Set(itemRows.map((r) => r.criterionId));

    for (const id of rubricIds) {
      if (!rowCriteria.has(id)) {
        problems.push(`item "${itemId}": missing criterion "${id}" (rater "${raterId}" scored some but not all criteria for this item)`);
      }
    }
    if (!rowCriteria.has(OVERALL_PASS_ID)) {
      problems.push(`item "${itemId}": missing ${OVERALL_PASS_ID} row for rater "${raterId}"`);
    }

    for (const row of itemRows) {
      if (row.criterionId === OVERALL_PASS_ID) {
        const v = row.rawScore.toLowerCase();
        if (v !== 'pass' && v !== 'fail') {
          problems.push(`line ${row.line}: item "${itemId}" ${OVERALL_PASS_ID} must be "pass" or "fail", got "${row.rawScore}"`);
        }
        continue;
      }
      if (!rubricIds.has(row.criterionId)) {
        problems.push(`line ${row.line}: item "${itemId}" scored unknown criterion "${row.criterionId}"`);
        continue;
      }
      const n = Number(row.rawScore);
      if (!Number.isInteger(n) || n < 0 || n > 3) {
        problems.push(
          `line ${row.line}: item "${itemId}" criterion "${row.criterionId}" score "${row.rawScore}" is outside the 0-3 band`,
        );
      }
    }
  }

  return problems;
}

/* ------------------------------------------------------------------
   Building the import plan (assumes validation already passed).
   ------------------------------------------------------------------ */

export interface ImportPlanItem {
  itemId: string;
  criteria: Record<string, CriterionBand>;
  pass: boolean;
}

/** Turn validated CSV rows into one plan entry per covered item, in golden-set order. */
export function buildImportPlan(goldenSet: GoldenItem[], rows: PanelCsvRow[]): ImportPlanItem[] {
  const byId = new Map(goldenSet.map((i) => [i.id, i]));
  const rowsByItem = new Map<string, PanelCsvRow[]>();
  for (const row of rows) {
    if (row.rawScore === '') continue;
    if (!byId.has(row.itemId)) continue;
    const list = rowsByItem.get(row.itemId) ?? [];
    list.push(row);
    rowsByItem.set(row.itemId, list);
  }

  const plan: ImportPlanItem[] = [];
  for (const [itemId, itemRows] of rowsByItem) {
    const criteria: Record<string, CriterionBand> = {};
    let pass = false;
    for (const row of itemRows) {
      if (row.criterionId === OVERALL_PASS_ID) {
        pass = row.rawScore.toLowerCase() === 'pass';
      } else {
        criteria[row.criterionId] = Number(row.rawScore) as CriterionBand;
      }
    }
    plan.push({ itemId, criteria, pass });
  }

  const order = new Map(goldenSet.map((item, i) => [item.id, i]));
  plan.sort((a, b) => order.get(a.itemId)! - order.get(b.itemId)!);
  return plan;
}

/* ------------------------------------------------------------------
   Applying the plan.
   ------------------------------------------------------------------ */

export interface ApplyResult {
  /** The full golden set with covered items updated; same length/order as input. */
  items: GoldenItem[];
  /** Ids of items this rater covered, in golden-set order. */
  coveredIds: string[];
}

/**
 * Pure transform: attach `raterId`'s scores to every item in `plan`, dropping
 * that item's synthetic seed raters and flipping provenance to 'panel'.
 * Uncovered items are returned unchanged (same reference). Does not mutate
 * `goldenSet` or any item in it.
 */
export function applyPanelImport(goldenSet: GoldenItem[], raterId: string, plan: ImportPlanItem[]): ApplyResult {
  const planById = new Map(plan.map((p) => [p.itemId, p]));
  const coveredIds: string[] = [];

  const items = goldenSet.map((item) => {
    const p = planById.get(item.id);
    if (!p) return item;
    coveredIds.push(item.id);

    const newRater: RaterScores = { raterId, criteria: { ...p.criteria }, pass: p.pass };
    // Drop the synthetic seeds (first panel score on this item) but keep any
    // panel raters already present (second+ panel score on this item).
    const keptRaters = item.raters.filter((r) => !SEED_RATER_IDS.has(r.raterId));

    return {
      ...item,
      raters: [...keptRaters, newRater],
      provenance: 'panel' as const,
    };
  });

  return { items, coveredIds };
}

/* ------------------------------------------------------------------
   Orchestration: validate -> plan -> apply -> regroup, all pure. The CLI
   layer (scripts/panel-import.ts) owns the filesystem: it reads the CSV,
   calls this, and only writes files when `problems` is empty.
   ------------------------------------------------------------------ */

export interface GoldenSetFileGroup {
  /** Absolute path to the source .ts file holding this group's array literal. */
  filePath: string;
  /** The exported const name, e.g. 'PRD_GOLDEN'. */
  arrayName: string;
  /** This group's current items, in file order. Concatenating every group's
   *  items (in the order groups are passed) must reproduce `goldenSet`. */
  items: GoldenItem[];
}

export interface PanelImportSummary {
  raterId: string;
  updatedItemIds: string[];
  stillSyntheticIds: string[];
  raterIdsOnFile: string[];
}

export interface PanelImportResult {
  /** Validation problems; empty means the import is clean. */
  problems: string[];
  summary?: PanelImportSummary;
  /** Per-group updated items, only present when `problems` is empty. */
  groups?: GoldenSetFileGroup[];
}

export function runPanelImport(
  goldenSet: GoldenItem[],
  groups: GoldenSetFileGroup[],
  raterId: string,
  csvText: string,
): PanelImportResult {
  let rows: PanelCsvRow[];
  try {
    rows = parsePanelCsv(csvText);
  } catch (e) {
    return { problems: [e instanceof PanelImportError ? e.message : String(e)] };
  }

  const problems = validatePanelImport(goldenSet, raterId, rows);
  if (problems.length > 0) return { problems };

  const plan = buildImportPlan(goldenSet, rows);
  const { items: updated, coveredIds } = applyPanelImport(goldenSet, raterId, plan);

  let offset = 0;
  const newGroups: GoldenSetFileGroup[] = groups.map((g) => {
    const slice = updated.slice(offset, offset + g.items.length);
    offset += g.items.length;
    return { filePath: g.filePath, arrayName: g.arrayName, items: slice };
  });

  const stillSyntheticIds = updated.filter((i) => i.provenance === 'synthetic-seed').map((i) => i.id);
  const allRaterIds = new Set<string>();
  for (const item of updated) for (const r of item.raters) allRaterIds.add(r.raterId);

  return {
    problems: [],
    summary: {
      raterId,
      updatedItemIds: coveredIds,
      stillSyntheticIds,
      raterIdsOnFile: [...allRaterIds].sort(),
    },
    groups: newGroups,
  };
}

/* ------------------------------------------------------------------
   Rewriting a golden-set source file.
   ------------------------------------------------------------------ */

/**
 * Rewrite one golden-set source file's array literal, preserving every byte
 * up to and including `export const <arrayName>: GoldenItem[] = ` (the header
 * comment documenting seed provenance) and reserializing the array with
 * `JSON.stringify(items, null, 2)` — the same shape these files already have
 * (they were generated this way), so the resulting diff is exactly the
 * changed rater/provenance fields and nothing else.
 */
export function serializeGoldenSetSource(originalSource: string, arrayName: string, items: GoldenItem[]): string {
  const marker = `export const ${arrayName}: GoldenItem[] = `;
  const idx = originalSource.indexOf(marker);
  if (idx === -1) {
    throw new PanelImportError(`Could not find "${marker}" in the golden-set source file being rewritten.`);
  }
  const header = originalSource.slice(0, idx + marker.length);
  return `${header}${JSON.stringify(items, null, 2)};\n`;
}
