import type { ReactNode } from 'react';
import type { IndustryId } from '@/curriculum/industries';

/**
 * CONCEPT LESSON: the teaching modality.
 *
 * A concept lesson is a structured, *demonstrated-mastery* reading: a one-line
 * hook, the framework explained in short prose sections, one or two worked
 * examples, a handful of takeaways, and a short comprehension CHECK that must be
 * answered correctly to complete the skill. It is the counterpart to the
 * interactive drills (same Console chrome, same completion path into the learn
 * store) for skills whose substance is conceptual rather than procedural.
 *
 * INDUSTRY FLAVOUR
 * ----------------
 * Worked examples (and individual prose lines) can be authored as a function of
 * the learner's home industry so the teaching lands in the world they work in,
 * reusing the same `useActiveIndustry()` signal the drills use. Authors get a
 * small, *typed* context (the industry id plus a couple of ready-made nouns)
 * rather than having to hand-write five full copies of every example. Content
 * that doesn't benefit from flavour is just a plain string.
 */

/**
 * What an industry-aware author callback receives. Deliberately tiny: the
 * industry id, its display label, and two pre-resolved nouns so a worked example
 * can say "your marketplace" / "a checkout flow" without each lesson re-deriving
 * the mapping. Everything here is plain data, safe to compute on the client.
 */
export interface IndustryContext {
  id: IndustryId;
  /** Human label, e.g. "Marketplace". */
  label: string;
  /** A natural noun for the learner's product, e.g. "marketplace", "SaaS tool". */
  product: string;
  /** A representative end-user noun, e.g. "buyer", "patient", "subscriber". */
  user: string;
}

/** A value that is either static, or resolved from the learner's industry. */
export type Flavoured<T> = T | ((ctx: IndustryContext) => T);

/* ------------------------------------------------------------------
   CONTENT BLOCKS.
   ------------------------------------------------------------------ */

/**
 * One short teaching section: a heading plus body prose. The body is an array of
 * paragraphs (each plain text, optionally industry-flavoured). Keeping prose as
 * data (not JSX) means the content files stay reviewable and free of markup,
 * and the component owns every pixel of styling.
 */
export interface LessonSection {
  heading: string;
  body: Flavoured<string>[];
  /**
   * Optional compact bullet list rendered under the prose, handy for the
   * "what PMs do / don't" style contrasts without inventing a second block type.
   */
  bullets?: Flavoured<string>[];
}

/**
 * A worked example: a titled, concrete walk-through that applies the concept.
 * `lines` are short steps/observations; `takeaway` is the one-sentence "so what".
 * The whole example may be a function of industry so the scenario matches the
 * learner's world.
 */
export interface WorkedExample {
  title: Flavoured<string>;
  lines: Flavoured<string>[];
  takeaway?: Flavoured<string>;
}

/* ------------------------------------------------------------------
   COMPREHENSION CHECK: the mastery gate.
   ------------------------------------------------------------------ */

/** A single multiple-choice option. */
export interface ChoiceOption {
  id: string;
  label: Flavoured<string>;
}

/**
 * A multiple-choice question. `correctId` is the single right option; `why` is
 * the explanation revealed after grading (always shown, right or wrong, so the
 * check teaches, not just tests).
 */
export interface ChoiceQuestion {
  kind: 'choice';
  id: string;
  prompt: Flavoured<string>;
  options: ChoiceOption[];
  correctId: string;
  why: Flavoured<string>;
}

/**
 * A fill-in question. The learner types a short answer; it is matched
 * case-insensitively (trimmed) against `accept`. Use for crisp vocabulary
 * ("what does the 'M' in DAU/WAU/MAU stand for?"). Never use it for open prose,
 * which the LLM-graded drills already cover.
 */
export interface FillQuestion {
  kind: 'fill';
  id: string;
  prompt: Flavoured<string>;
  /** Accepted answers (case-insensitive, trimmed). First is the canonical one. */
  accept: string[];
  why: Flavoured<string>;
  /** Optional placeholder hint for the input. */
  placeholder?: string;
}

export type CheckQuestion = ChoiceQuestion | FillQuestion;

/** The end-of-lesson comprehension check: 1-3 questions, all must be correct. */
export interface ComprehensionCheck {
  /** Optional lead-in shown above the questions. */
  intro?: string;
  questions: CheckQuestion[];
}

/* ------------------------------------------------------------------
   THE LESSON.
   ------------------------------------------------------------------ */

/**
 * A full concept lesson for one skill. Authored as data and stored one-per-skill
 * under `src/curriculum/lessons/`, barrel-exported, and looked up by `skillId`.
 */
export interface ConceptLessonContent {
  /** Must match the curriculum skill id this lesson teaches. */
  skillId: string;
  /** One-line "why this matters" hook shown under the title. */
  hook: string;
  /**
   * Optional framework attribution, e.g. "Marty Cagan · INSPIRED". Rendered as a
   * small credit so the learner can trace the idea to its source.
   */
  framework?: string;
  /** The teaching body: a few short sections. */
  sections: LessonSection[];
  /** One or two concrete worked examples. */
  examples: WorkedExample[];
  /** Two to three crisp takeaways. */
  takeaways: Flavoured<string>[];
  /** The comprehension check that gates completion. */
  check: ComprehensionCheck;
}

/* ------------------------------------------------------------------
   RESOLUTION HELPERS.

   `Flavoured<T>` values are resolved once, in the component, against the live
   industry context. Centralising the resolution here keeps the component lean
   and guarantees static and dynamic content are handled identically.
   ------------------------------------------------------------------ */

/** Resolve a single flavoured value against an industry context. */
export function resolveFlavoured<T>(value: Flavoured<T>, ctx: IndustryContext): T {
  return typeof value === 'function'
    ? (value as (ctx: IndustryContext) => T)(ctx)
    : value;
}

/** Resolve an array of flavoured values. */
export function resolveFlavouredList<T>(
  values: Flavoured<T>[],
  ctx: IndustryContext,
): T[] {
  return values.map((v) => resolveFlavoured(v, ctx));
}

/**
 * A check question with every flavoured field resolved to a concrete value, so
 * the component renders plain data and the grader compares plain strings.
 */
export type ResolvedQuestion =
  | {
      kind: 'choice';
      id: string;
      prompt: ReactNode;
      options: { id: string; label: ReactNode }[];
      correctId: string;
      why: ReactNode;
    }
  | {
      kind: 'fill';
      id: string;
      prompt: ReactNode;
      accept: string[];
      why: ReactNode;
      placeholder?: string;
    };

/** Resolve one check question against the industry context. */
export function resolveQuestion(
  q: CheckQuestion,
  ctx: IndustryContext,
): ResolvedQuestion {
  if (q.kind === 'choice') {
    return {
      kind: 'choice',
      id: q.id,
      prompt: resolveFlavoured(q.prompt, ctx),
      options: q.options.map((o) => ({
        id: o.id,
        label: resolveFlavoured(o.label, ctx),
      })),
      correctId: q.correctId,
      why: resolveFlavoured(q.why, ctx),
    };
  }
  return {
    kind: 'fill',
    id: q.id,
    prompt: resolveFlavoured(q.prompt, ctx),
    accept: q.accept,
    why: resolveFlavoured(q.why, ctx),
    placeholder: q.placeholder,
  };
}

/** Normalise a typed fill answer for comparison (trim + lowercase + collapse ws). */
export function normaliseFill(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Is a typed answer accepted for a fill question? */
export function isFillCorrect(value: string, accept: string[]): boolean {
  const norm = normaliseFill(value);
  return accept.some((a) => normaliseFill(a) === norm);
}
