import type { IndustryId } from '@/curriculum/industries';
import {
  type Flavoured,
  type IndustryContext,
  resolveFlavoured,
  resolveFlavouredList,
} from '@/curriculum/lessons/types';

/**
 * ARTIFACT MODALITY: the "write a real PM deliverable, get rubric feedback" loop.
 *
 * This is the knowledge center's differentiator. Where a drill checks one move
 * and a concept lesson checks comprehension, an artifact asks the learner to
 * produce the actual thing a PM ships (a one-page PRD, a strategy memo, an
 * experiment plan) and grades it against a RUBRIC the learner can see while
 * writing. The rubric is the bar; showing it up front is the point.
 *
 * AUTHORING MODEL
 * ---------------
 * Content is plain data (no JSX), authored one file per artifact under
 * `src/curriculum/artifacts/` and barrel-exported by `skillId`, exactly like the
 * concept lessons. Industry flavour reuses the lessons' `Flavoured<T>` + ctx
 * pattern: a brief line can be a function of the learner's home industry so the
 * scenario lands in their world, without hand-writing five copies of every
 * brief. The RUBRIC and grader instructions are deliberately industry-NEUTRAL:
 * the bar for a good PRD does not change because the product is a marketplace,
 * and keeping grading identical across industries keeps scores comparable.
 *
 * GRADING CONTRACT
 * ----------------
 * `rubric` criteria map 1:1 onto the `/api/grade-artifact` rubric input, so the
 * same descriptors the learner reads are the descriptors the model scores
 * against (rubric-aligned prompting). The component composes the learner's
 * fields into one submission string and posts it with the resolved brief +
 * rubric. There is no client-side answer key; the verdict is the model's.
 */

/* ------------------------------------------------------------------
   RUBRIC.
   ------------------------------------------------------------------ */

/**
 * One rubric criterion. `descriptor` is the single most important field: it is
 * both shown to the learner ("here's the bar") and handed to the grader ("score
 * against this"). Write it as what a STRONG answer looks like, concretely.
 */
export interface RubricCriterion {
  /** Stable id, unique within the artifact; echoed back in the verdict. */
  id: string;
  /** Short label, e.g. "Problem clarity". */
  label: string;
  /** What a strong answer on this criterion looks like (the bar). */
  descriptor: string;
}

/* ------------------------------------------------------------------
   INPUT SHAPE.

   An artifact is filled in through one or more labelled fields. A single
   freeform field is the common case (one long deliverable); multiple fields
   structure longer artifacts (e.g. a PRD with problem / solution / metrics
   sections) so the learner is scaffolded toward the rubric.
   ------------------------------------------------------------------ */

/** One labelled writing field. */
export interface ArtifactField {
  /** Stable key used in the values map + composition. */
  key: string;
  /** Visible label, may be industry-flavoured. */
  label: Flavoured<string>;
  /** Placeholder/hint, may be industry-flavoured. */
  placeholder: Flavoured<string>;
  /** Suggested textarea rows (all artifact fields are multiline prose). */
  rows?: number;
  /** Optional one-line helper under the label. */
  hint?: Flavoured<string>;
}

/** Live values keyed by field key: the form state. */
export type ArtifactValues = Record<string, string>;

/* ------------------------------------------------------------------
   THE ARTIFACT.
   ------------------------------------------------------------------ */

export interface ArtifactContent {
  /** Must match the curriculum skill id this artifact practises. */
  skillId: string;
  /** The deliverable's name, e.g. "One-page PRD". */
  title: string;
  /** One-line "why this matters" hook shown under the title. */
  hook: string;
  /** Optional framework attribution, e.g. "Amazon Working Backwards". */
  framework?: string;
  /** Short scenario tag for the unit chip row, e.g. "SaaS · spec". Flavoured. */
  scenarioTag: Flavoured<string>;
  /**
   * The scenario brief: the situation the learner is writing into. Authored as
   * paragraphs so it renders cleanly; each line may be industry-flavoured.
   */
  brief: Flavoured<string>[];
  /** Crisp list of what to produce (the deliverable's required parts). */
  whatToProduce: Flavoured<string>[];
  /** The writing fields the learner fills in (one freeform, or a few). */
  fields: ArtifactField[];
  /** The rubric: the bar, shown to the learner AND used by the grader. */
  rubric: RubricCriterion[];
  /**
   * Extra, artifact-specific instructions for the grader (industry-neutral),
   * e.g. "Penalize solution-first PRDs that skip the problem." Optional.
   */
  graderInstructions?: string;
}

/* ------------------------------------------------------------------
   RESOLUTION.

   Resolve the authored (possibly flavoured) content against the learner's
   industry once, in the component, so the rest of the UI and the grader payload
   deal in plain strings.
   ------------------------------------------------------------------ */

/** An artifact with every flavoured field resolved to a concrete string. */
export interface ResolvedArtifact {
  skillId: string;
  title: string;
  hook: string;
  framework?: string;
  scenarioTag: string;
  brief: string[];
  whatToProduce: string[];
  fields: {
    key: string;
    label: string;
    placeholder: string;
    rows: number;
    hint?: string;
  }[];
  rubric: RubricCriterion[];
  graderInstructions?: string;
}

/** Resolve one artifact's flavoured content against an industry context. */
export function resolveArtifact(
  content: ArtifactContent,
  ctx: IndustryContext,
): ResolvedArtifact {
  return {
    skillId: content.skillId,
    title: content.title,
    hook: content.hook,
    framework: content.framework,
    scenarioTag: resolveFlavoured(content.scenarioTag, ctx),
    brief: resolveFlavouredList(content.brief, ctx),
    whatToProduce: resolveFlavouredList(content.whatToProduce, ctx),
    fields: content.fields.map((f) => ({
      key: f.key,
      label: resolveFlavoured(f.label, ctx),
      placeholder: resolveFlavoured(f.placeholder, ctx),
      rows: f.rows ?? 6,
      hint: f.hint ? resolveFlavoured(f.hint, ctx) : undefined,
    })),
    // Rubric + grader instructions are industry-neutral by design.
    rubric: content.rubric,
    graderInstructions: content.graderInstructions,
  };
}

/**
 * Compose the learner's field values into the single submission string sent to
 * the grader. For a one-field artifact this is just the text; for a multi-field
 * artifact each section is labelled so the model can see the structure.
 */
export function composeSubmission(
  resolved: ResolvedArtifact,
  values: ArtifactValues,
): string {
  if (resolved.fields.length === 1) {
    return (values[resolved.fields[0].key] ?? '').trim();
  }
  return resolved.fields
    .map((f) => {
      const body = (values[f.key] ?? '').trim();
      return `## ${f.label}\n${body}`;
    })
    .join('\n\n');
}

/**
 * Is the submission substantial enough to grade? We gate on a minimum amount of
 * real writing across all fields (not just any keystroke) so the Submit button
 * stays disabled until there is something worth a graded call. This both
 * protects the spend cap and stops the learner wasting an attempt on a stub.
 */
export const MIN_SUBMISSION_CHARS = 80;

export function isSubmittable(
  resolved: ResolvedArtifact,
  values: ArtifactValues,
): boolean {
  // Every field must have some content, and the whole thing must clear the bar.
  const allFilled = resolved.fields.every(
    (f) => (values[f.key] ?? '').trim().length > 0,
  );
  if (!allFilled) return false;
  const total = composeSubmission(resolved, values).replace(/\s+/g, ' ').trim();
  return total.length >= MIN_SUBMISSION_CHARS;
}

/** Re-export the industry id for authors importing from this module. */
export type { IndustryId };
