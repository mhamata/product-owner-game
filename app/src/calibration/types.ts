import type { IndustryId } from '@/curriculum/industries';
import type { ArtifactVerdictV2 } from '@/lib/artifactGraderV2';

/**
 * CALIBRATION HARNESS: the Phase-0 go/no-go gate.
 *
 * The riskiest assumption in the whole product is that AI grading feels
 * credibly senior. This module measures it: a GOLDEN SET of artifact
 * submissions with reference scores from human raters, an agreement suite
 * (grader-vs-panel and rater-vs-rater), and a CLI runner that grades the set
 * and reports whether the grader is within the human panel's own spread.
 *
 * PROVENANCE MATTERS. Seed items ship with `provenance: 'synthetic-seed'` —
 * they were authored and scored by models to make the harness runnable on day
 * one. The study is only REAL once items carry `provenance: 'panel'` scores
 * from paid senior-PM raters. The CLI report says loudly which one it ran on.
 */

/** The three artifact rubrics the calibration study targets. */
export type GoldenArtifactType = 'prd-artifact' | 'experiment-plan' | 'strategy-memo';

/** Authoring target for a seed item: the quality the writer aimed for. */
export type QualityBand = 'excellent' | 'solid' | 'weak' | 'poor';

/** One criterion score on the same 0-3 band the live grader uses. */
export type CriterionBand = 0 | 1 | 2 | 3;

/** One rater's scores for one golden item. */
export interface RaterScores {
  /** Stable rater id, e.g. 'seed-author', 'seed-blind', 'panel-a'. */
  raterId: string;
  /** Criterion id -> 0-3 band. Keys must match the artifact's rubric ids. */
  criteria: Record<string, CriterionBand>;
  /** Would this rater pass the submission overall? */
  pass: boolean;
  /** Optional one-line rationale (kept for audit, never sent to the grader). */
  notes?: string;
}

/** One golden-set item: a submission plus its reference scores. */
export interface GoldenItem {
  /** Stable id, e.g. 'prd-03'. */
  id: string;
  artifactSkillId: GoldenArtifactType;
  /** Which industry flavour the brief was resolved with when authoring. */
  industry: IndustryId;
  /** The quality band the author was aiming for (seed items only). */
  targetBand: QualityBand;
  /**
   * The full composed submission, exactly as `composeSubmission` would build
   * it (multi-field artifacts use `## <field label>` section headers).
   */
  submission: string;
  /** Reference scores; >= 1 rater. Consensus is the per-criterion median. */
  raters: RaterScores[];
  /** 'synthetic-seed' until real panel scores replace the seed raters. */
  provenance: 'synthetic-seed' | 'panel';
  notes?: string;
}

/** The grader's verdict for one golden item (one run). */
export interface GraderRun {
  itemId: string;
  /** Criterion id -> 0-3 band as returned by the grader. */
  criteria: Record<string, CriterionBand>;
  pass: boolean;
  overallScore: number;
  /**
   * Present only when this run was graded with `--grader v2`: the full
   * annotations/topFix/delta verdict, kept for annotation-quality inspection.
   * Never populated on the v1 path — v1's `GraderRun` shape (and therefore any
   * serialization of it) is unchanged.
   */
  verdictV2?: ArtifactVerdictV2;
}
