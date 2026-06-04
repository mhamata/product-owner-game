/**
 * Shared, framework-free drill definitions for the deterministic (client-graded)
 * skills. ONE source of truth for both surfaces that mount a drill:
 *
 *  - the Console lesson loop at /learn/[skillId] (graded check → feedback → mastery)
 *  - the /methods library drill (reveal-all → score)
 *
 * Keeping the content + grading here means de-specialization happens once and
 * both routes stay in sync. All content is industry-generic (SaaS/tech), never
 * finance-specific. Grading is pure (no React) so it can be unit-tested and
 * reused by either interaction model.
 */

/* ------------------------------------------------------------------
   Classification drills (MoSCoW, Kano): sort each item into a bucket.
   ------------------------------------------------------------------ */

/** One selectable bucket/category in a classification drill. */
export interface DrillBucket<K extends string> {
  key: K;
  /** Short label shown on the choice control. */
  label: string;
  /** One-line description of what the bucket means. */
  description: string;
}

/** One item the learner classifies into a bucket. */
export interface ClassificationItem<K extends string> {
  id: string;
  name: string;
  /** The single correct bucket for this item. */
  correct: K;
  /** Why this is the right bucket; shown in feedback. */
  why: string;
}

export interface ClassificationDrill<K extends string> {
  /** One-line generic scenario framing shown above the prompt. */
  scenario: string;
  /** The question the learner answers. */
  prompt: string;
  buckets: DrillBucket<K>[];
  items: ClassificationItem<K>[];
  /** Closing insight shown once graded (the "senior PM" takeaway). */
  insight: string;
}

/** Grade a classification attempt: assignments keyed by item id. */
export function gradeClassification<K extends string>(
  drill: ClassificationDrill<K>,
  assignments: Record<string, K | undefined>,
): { correct: number; total: number; score: number; allCorrect: boolean } {
  const total = drill.items.length;
  const correct = drill.items.reduce(
    (n, item) => n + (assignments[item.id] === item.correct ? 1 : 0),
    0,
  );
  return {
    correct,
    total,
    score: total > 0 ? correct / total : 0,
    allCorrect: correct === total,
  };
}

/* ------------------------------------------------------------------
   Score-and-rank drills (RICE, WSJF): compute a numeric score per row
   from given factors, then rank. The learner orders the rows.
   ------------------------------------------------------------------ */

/** One row in a score-and-rank drill, with its raw factors + reasoning. */
export interface ScoreRow {
  id: string;
  name: string;
  /** One-line generic context for the row. */
  context: string;
  /** Raw input factors keyed by factor id (e.g. reach, impact…). */
  factors: Record<string, number>;
  /** Why this row lands where it does; shown in feedback. */
  reasoning: string;
}

/** Metadata for one factor column (label + how to render it). */
export interface ScoreFactor {
  key: string;
  label: string;
  /** 'int' | 'percent' (0..1 shown as %) | 'months'. Display only. */
  format: 'int' | 'percent' | 'months';
}

export interface ScoreRankDrill {
  scenario: string;
  prompt: string;
  /** Human-readable formula, e.g. "(Reach × Impact × Confidence) / Effort". */
  formula: string;
  factors: ScoreFactor[];
  rows: ScoreRow[];
  /** Pure scoring function: higher = higher priority. */
  score: (row: ScoreRow) => number;
  insight: string;
}

/** The rows sorted highest-score-first: the canonical correct ranking. */
export function rankRows(drill: ScoreRankDrill): ScoreRow[] {
  return [...drill.rows].sort((a, b) => drill.score(b) - drill.score(a));
}

/**
 * Grade a ranking attempt. `ordering` is the learner's row ids, best-first.
 * Score is the fraction of rows placed in their canonical rank position
 * (ties on the computed score count as correct for either slot).
 */
export function gradeRanking(
  drill: ScoreRankDrill,
  ordering: string[],
): { correct: number; total: number; score: number; allCorrect: boolean } {
  const canonical = rankRows(drill);
  const total = canonical.length;
  let correct = 0;
  for (let i = 0; i < ordering.length && i < total; i += 1) {
    const placed = drill.rows.find((r) => r.id === ordering[i]);
    if (!placed) continue;
    // Correct if the canonical row at this slot has the same score (handles ties).
    if (drill.score(placed) === drill.score(canonical[i])) correct += 1;
  }
  return {
    correct,
    total,
    score: total > 0 ? correct / total : 0,
    allCorrect: correct === total,
  };
}

/* ------------------------------------------------------------------
   Estimation drill (T-shirt sizing): pick a size for each story.
   Same grading shape as classification, but typed to the size scale.
   ------------------------------------------------------------------ */

export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export const TSHIRT_SIZES: TShirtSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export interface SizingStory {
  id: string;
  title: string;
  description: string;
  correct: TShirtSize;
  why: string;
}

export interface SizingDrill {
  scenario: string;
  prompt: string;
  /** The legend explaining what each size means in calendar terms. */
  legend: string;
  stories: SizingStory[];
  insight: string;
}

export function gradeSizing(
  drill: SizingDrill,
  guesses: Record<string, TShirtSize | undefined>,
): { correct: number; total: number; score: number; allCorrect: boolean } {
  const total = drill.stories.length;
  const correct = drill.stories.reduce(
    (n, s) => n + (guesses[s.id] === s.correct ? 1 : 0),
    0,
  );
  return {
    correct,
    total,
    score: total > 0 ? correct / total : 0,
    allCorrect: correct === total,
  };
}

/* ------------------------------------------------------------------
   Sequencing drill (5-Whys): order the causes from surface → root.
   Deterministic variant of the free-text original, so it fits the
   graded Console loop without an LLM.
   ------------------------------------------------------------------ */

export interface CauseStep {
  id: string;
  /** The cause statement. */
  text: string;
  /** Which layer this cause sits at; shown after grading. */
  layer: string;
}

export interface SequencingDrill {
  scenario: string;
  symptom: string;
  prompt: string;
  /** Causes in CANONICAL order (surface-first → root-last). */
  steps: CauseStep[];
  insight: string;
}

/** Grade a sequencing attempt: fraction of steps in the right position. */
export function gradeSequencing(
  drill: SequencingDrill,
  ordering: string[],
): { correct: number; total: number; score: number; allCorrect: boolean } {
  const total = drill.steps.length;
  let correct = 0;
  for (let i = 0; i < ordering.length && i < total; i += 1) {
    if (ordering[i] === drill.steps[i].id) correct += 1;
  }
  return {
    correct,
    total,
    score: total > 0 ? correct / total : 0,
    allCorrect: correct === total,
  };
}

/* ------------------------------------------------------------------
   Free-text drills (JTBD, User Interviews/Mom Test, Pre-Mortem, PR-FAQ):
   the learner writes prose, which an LLM grades via /api/grade. Unlike the
   deterministic drills above there is no canonical answer; grading is the
   model's structured rubric verdict. The data here is still React-free
   (strings + pure compose/validate fns) so the same definition drives the
   Console lesson; the network call lives in the lesson component.
   ------------------------------------------------------------------ */

/** The grade-route drill keys. Must match `/api/grade` and `useLLMGrade`. */
export type FreeTextDrillId = 'jtbd' | 'mom-test' | 'pre-mortem' | 'pr-faq';

/** One labelled input the learner fills in. */
export interface FreeTextField {
  /** Stable key used in the values map + compose/validate fns. */
  key: string;
  /** Visible label, e.g. "When… (situation)". */
  label: string;
  placeholder: string;
  /** Single-line input vs multi-line textarea (default). */
  multiline?: boolean;
  /** Rows for a textarea (ignored when single-line). */
  rows?: number;
}

/** Values keyed by field key: the live state of the form. */
export type FreeTextValues = Record<string, string>;

export interface FreeTextDrill {
  /** Grade-route key: selects the rubric server-side. */
  drillId: FreeTextDrillId;
  /** One-line generic scenario framing, e.g. "SaaS · discovery". */
  scenario: string;
  /** The lesson question/heading. */
  prompt: string;
  /** Title of the brief/assignment card shown above the inputs. */
  briefTitle: string;
  /** The brief/assignment/persona prose. */
  brief: string;
  /** The fields the learner fills in (one or many). */
  fields: FreeTextField[];
  /** Build the string sent to the grader from the field values. */
  composeInput: (values: FreeTextValues) => string;
  /** Optional context object passed alongside the input to the grader. */
  buildContext?: (values: FreeTextValues) => Record<string, unknown>;
  /**
   * Optional live preview of the composed answer (e.g. the JTBD sentence),
   * shown above the submit control. Returns plain text.
   */
  preview?: (values: FreeTextValues) => string;
  /** True once the answer is substantial enough to submit for grading. */
  isReady: (values: FreeTextValues) => boolean;
}
