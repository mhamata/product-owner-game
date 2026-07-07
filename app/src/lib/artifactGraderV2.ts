import type Anthropic from '@anthropic-ai/sdk';

/**
 * One rubric criterion the model scores against, with its own level guide.
 * Mirrors the V1 `RubricCriterionInput` shape (defined in the grade-artifact
 * route) so the same rubric the learner reads is the rubric V2 scores against.
 * Declared here (not imported from the route) to keep the dependency direction
 * clean — the route imports this lib, never the reverse.
 */
export interface RubricCriterionInput {
  /** Stable id echoed back in the per-criterion result. */
  id: string;
  /** Short human label, e.g. "Problem clarity". */
  label: string;
  /** What a strong answer on this criterion looks like. */
  descriptor: string;
}

/**
 * GRADING V2: inline annotations + revise-and-resubmit.
 *
 * V1 (`artifactGrader.ts`) grades the whole submission against a rubric and
 * returns per-criterion bands plus a strengths/gaps/overall roll-up. V2 keeps
 * that contract byte-for-byte in spirit and adds two things a real portfolio
 * review has that a score sheet does not:
 *
 *  1. BLOCK-ANCHORED ANNOTATIONS. We number the learner's submission into blocks
 *     server-side (`splitIntoBlocks`) and render them numbered in the user turn
 *     ("[1] ...", "[2] ..."). The model attaches its most consequential notes to
 *     specific block numbers, so feedback lands on the exact sentence that earned
 *     it — the difference between "your metrics are vague" and a red flag pinned
 *     to the line that is vague, with a concrete rewrite.
 *
 *  2. A REVISION LOOP. When the learner resubmits, the previous submission and
 *     the previous verdict travel with the new draft. The model grades the new
 *     version on its own merits, then reports the DELTA — which prior notes were
 *     addressed, which were ignored, and what regressed — so the second read
 *     teaches "here is what your edit actually changed", not just a fresh score.
 *
 * V1 IS UNTOUCHED. This module is additive: `artifactGrader.ts` is frozen because
 * the Phase-0 calibration study depends on it byte-for-byte. The route selects V2
 * only when the client sends `v: 2`; `v` unset is the exact V1 path.
 *
 * The system prompt is fixed (cacheable) and the variable rubric + numbered
 * submission + optional previous-attempt context go in the user turn, exactly
 * like V1, so the model treats the rubric and blocks as data to grade, not
 * instructions to follow.
 */

/* ------------------------------------------------------------------
   CAPS. Mirror V1's clamps so a padded body cannot inflate input cost, with a
   little more headroom because the V2 user turn also carries the numbered
   blocks and, on a revision, the previous submission + verdict summary.
   ------------------------------------------------------------------ */

/** Hard cap on one submission (current or previous) before it enters the turn. */
export const MAX_SUBMISSION_CHARS = 8000;
/**
 * Hard cap on the TOTAL assembled user turn. Higher than V1's 12k because a
 * revision turn carries the previous submission and the previous grade summary
 * on top of the current numbered submission; still bounded so a crafted body
 * cannot push input tokens past the intended per-call cost cap.
 */
export const MAX_USER_CONTENT_CHARS = 20000;
/** V2 asks for more (annotations + optional rewrites + delta), so a wider ceiling. */
export const MAX_OUTPUT_TOKENS = 1400;
/** The model may attach at most this many annotations; enforced in prompt AND code. */
export const MAX_ANNOTATIONS = 8;

export const GRADER_MODEL_V2 = 'claude-haiku-4-5-20251001';

/** Severity of a single block-anchored annotation. */
export type AnnotationSeverity = 'major' | 'minor' | 'praise';

const SEVERITIES: readonly AnnotationSeverity[] = ['major', 'minor', 'praise'];

/* ------------------------------------------------------------------
   BLOCKS. We number the submission ourselves so the block indices the model
   references are ours, not the model's guess — the UI renders the exact same
   numbering, so an annotation on block 3 always lands on the block the learner
   sees labelled [3].
   ------------------------------------------------------------------ */

/** One numbered block of the submission (1-based index + its text). */
export interface SubmissionBlock {
  /** 1-based index, matching the "[n]" label rendered in the user turn + UI. */
  index: number;
  /** The block's text (a section header line, or a paragraph). */
  text: string;
}

/**
 * Split a composed submission into numbered blocks.
 *
 * Multi-field submissions use `## <label>` section headers (see
 * `composeSubmission`), and prose within a field is separated by blank lines.
 * We split on BOTH so each section header and each paragraph becomes its own
 * addressable block, which is the granularity an inline annotation wants.
 *
 * Rules:
 *  - A `## <label>` line is its own block (kept verbatim, including the `##`), so
 *    the model can annotate a whole section by its heading.
 *  - Runs of one or more blank lines separate paragraphs; each non-empty
 *    paragraph is one block.
 *  - Interior whitespace inside a paragraph (single newlines, e.g. a manual list)
 *    is preserved; only the block's outer whitespace is trimmed.
 *  - Empty input yields no blocks.
 *
 * Pure + exported so the numbering is unit-testable and identical on both sides.
 */
export function splitIntoBlocks(submission: string): SubmissionBlock[] {
  const blocks: SubmissionBlock[] = [];
  let index = 0;

  // Normalise newlines so \r\n from a pasted doc does not create phantom blocks.
  const normalised = submission.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split on blank-line boundaries (one or more lines that are empty/whitespace).
  const paragraphs = normalised.split(/\n[ \t]*\n+/);

  for (const rawParagraph of paragraphs) {
    // A paragraph may still contain leading `## header` lines glued to prose when
    // an author writes "## Label\nbody" with no blank line between (which is
    // exactly what composeSubmission produces). Peel any leading header lines off
    // as their own blocks, then keep the remaining body as one block.
    const lines = rawParagraph.split('\n');
    let bodyStart = 0;

    while (bodyStart < lines.length && /^\s*##\s+/.test(lines[bodyStart])) {
      const header = lines[bodyStart].trim();
      if (header.length > 0) {
        index += 1;
        blocks.push({ index, text: header });
      }
      bodyStart += 1;
    }

    const body = lines.slice(bodyStart).join('\n').trim();
    if (body.length > 0) {
      index += 1;
      blocks.push({ index, text: body });
    }
  }

  return blocks;
}

/** Render numbered blocks for the user turn: "[1] ...\n\n[2] ...". */
function renderBlocks(blocks: SubmissionBlock[]): string {
  return blocks.map((b) => `[${b.index}] ${b.text}`).join('\n\n');
}

/* ------------------------------------------------------------------
   VERDICT SHAPE.
   ------------------------------------------------------------------ */

/** Per-criterion verdict band (identical contract to V1). */
export interface CriterionVerdictV2 {
  id: string;
  label: string;
  /** 0-3 band: 0 missing, 1 weak, 2 solid, 3 excellent. */
  score: number;
  comment: string;
}

/** One block-anchored inline annotation. */
export interface Annotation {
  /** 1-based block index this note is anchored to (clamped to the real range). */
  block: number;
  /** major = must fix, minor = polish, praise = a move done well. */
  severity: AnnotationSeverity;
  /** One or two sentences: name the issue (or the strength), concretely. */
  comment: string;
  /** Optional concrete rewrite, present only where a rewrite teaches the move. */
  rewriteSuggestion?: string;
}

/**
 * The delta view, present only on a revision. Summaries reference the previous
 * annotations (by their gist or block), so the UI can show "you addressed these,
 * you ignored these, these regressed" without re-deriving it client-side.
 */
export interface RevisionDelta {
  /** Prior notes this revision resolved. */
  addressed: string[];
  /** Prior notes this revision left unaddressed. */
  ignored: string[];
  /** New problems this revision introduced that were not there before. */
  regressions: string[];
  /** One or two sentences explaining the score change (up, down, or flat). */
  scoreChangeExplanation: string;
}

/** The full V2 verdict the lesson renders. */
export interface ArtifactVerdictV2 {
  criteria: CriterionVerdictV2[];
  annotations: Annotation[];
  /** The single highest-leverage fix, called out above everything else. */
  topFix: string;
  strengths: string[];
  gaps: string[];
  overall: string;
  /** 0-100 rollup the UI turns into a pass/keep-going state. */
  overallScore: number;
  passed: boolean;
  /** Present only when this was a revision (previous attempt was supplied). */
  delta?: RevisionDelta;
}

/* ------------------------------------------------------------------
   INPUT.
   ------------------------------------------------------------------ */

/** A previous verdict summary carried into a revision (only the parts we replay). */
export interface PreviousVerdictSummary {
  criteria: CriterionVerdictV2[];
  annotations: Annotation[];
  overallScore?: number;
}

/** Input to `gradeArtifactV2`. Mirrors V1's request plus the revision context. */
export interface ArtifactGradeV2Input {
  /** Skill id, for logging/debugging only (grading is rubric-driven). */
  skillId: string;
  /** Title of the deliverable, e.g. "One-page PRD". */
  artifactTitle: string;
  /** The scenario brief the learner was given, for grading context. */
  brief: string;
  /** The rubric the learner saw: the bar each criterion is scored against. */
  rubric: RubricCriterionInput[];
  /** Extra grader instructions specific to this artifact. */
  graderInstructions?: string;
  /** The learner's current submission (assembled prose). */
  submission: string;
  /** Present on a revision: the submission the previous verdict graded. */
  previousSubmission?: string;
  /** Present on a revision: the criteria + annotations from the previous grade. */
  previousVerdict?: PreviousVerdictSummary;
}

/* ------------------------------------------------------------------
   SYSTEM PROMPT. Fixed + cacheable. Same 0-3 rubric grading as V1 PLUS the
   annotation + revision contract.
   ------------------------------------------------------------------ */

export const SYSTEM_PROMPT_V2 = `You are a senior product leader grading a trainee PM's written deliverable for a portfolio review, and marking it up inline the way a mentor marks up a draft.

You will receive: the deliverable title, the scenario brief, a RUBRIC (criteria, each with an id, a label, and a descriptor of what "strong" looks like), optional extra grader instructions, and the trainee's SUBMISSION rendered as NUMBERED BLOCKS in the form "[1] ...", "[2] ...". On a revision you will ALSO receive the PREVIOUS GRADE and the PREVIOUS SUBMISSION.

Grade ONLY against the rubric. For each criterion, score the submission on this band:
- 0 = missing or off-track
- 1 = attempted but weak
- 2 = solid, meets the bar
- 3 = excellent, exceeds the bar

Then add INLINE ANNOTATIONS anchored to the block numbers you were given:
- Reference the block numbers from the "[n]" labels. Every annotation MUST cite a real block number that appears in the submission.
- Annotate the MOST CONSEQUENTIAL blocks, not every flaw. Maximum 8 annotations total.
- Each annotation has a severity: "major" (a real problem that costs points), "minor" (polish worth making), or "praise" (a move done genuinely well). Include AT LEAST ONE "praise".
- Add a "rewriteSuggestion" ONLY where a concrete rewrite teaches the move — show the better sentence, do not rewrite the whole block. Omit it otherwise.
- Keep every comment to one or two sentences, concrete and actionable. Name the fix, not just the flaw.

Also return "topFix": the single highest-leverage change the trainee should make first, in one sentence.

Rules:
- Judge what is written, not what you imagine they meant. Reward specificity; penalize vague, generic, or buzzword answers.
- Do not invent facts that are not in the brief or submission.
- Be constructive and specific. Never shame.

Return ONLY a JSON object, no prose around it, in exactly this shape:
{
  "criteria": [{ "id": "<criterion id>", "label": "<criterion label>", "score": 0-3, "comment": "<one to two sentences>" }],
  "annotations": [{ "block": <block number>, "severity": "major"|"minor"|"praise", "comment": "<one to two sentences>", "rewriteSuggestion": "<optional concrete rewrite>" }],
  "topFix": "<one sentence: the first thing to fix>",
  "strengths": ["<two to three concrete strengths>"],
  "gaps": ["<two to three concrete, prioritized gaps>"],
  "overall": "<two to three sentence verdict>",
  "overallScore": 0-100,
  "passed": <true if the work meets the bar overall, else false>
}
Compute overallScore as the sum of criterion scores divided by the maximum possible (criteria count times 3), times 100, rounded to a whole number. Set passed to true when overallScore is at least 70.

REVISION MODE (only when a PREVIOUS GRADE and PREVIOUS SUBMISSION are provided):
Grade the NEW version entirely on its own merits first (do not inflate the score just because it is a second attempt). Then assess the DELTA against the previous attempt and add a "delta" field to your JSON:
{
  "delta": {
    "addressed": ["<previous notes this revision resolved>"],
    "ignored": ["<previous notes this revision left unaddressed>"],
    "regressions": ["<new problems this revision introduced>"],
    "scoreChangeExplanation": "<one or two sentences on why the score moved up, down, or held>"
  }
}
Reference previous notes by their gist or block. Omit the "delta" field entirely when no previous attempt was provided.`;

/* ------------------------------------------------------------------
   USER TURN. Variable rubric + numbered submission + optional previous attempt.
   ------------------------------------------------------------------ */

/** Summarise the previous verdict for replay in the revision turn. */
function renderPreviousVerdict(prev: PreviousVerdictSummary): string {
  const criteriaLines = prev.criteria
    .map((c) => `- ${c.label} [${c.id}]: ${c.score}/3 — ${c.comment}`)
    .join('\n');
  const annotationLines = prev.annotations
    .map((a) => `- block ${a.block} (${a.severity}): ${a.comment}`)
    .join('\n');

  return [
    prev.overallScore !== undefined ? `Previous overall score: ${prev.overallScore}/100` : '',
    'Previous per-criterion scores:',
    criteriaLines || '(none)',
    '',
    'Previous inline annotations:',
    annotationLines || '(none)',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * Build the user-turn content from the (variable) rubric + numbered submission,
 * plus the previous attempt when this is a revision. Returns both the assembled
 * string and the blocks it numbered, so the caller can clamp annotation block
 * refs to the real range without re-splitting.
 */
export function buildUserContentV2(input: ArtifactGradeV2Input): {
  content: string;
  blocks: SubmissionBlock[];
} {
  const rubricLines = input.rubric
    .map((c, i) => `${i + 1}. [id: ${c.id}] ${c.label}: ${c.descriptor}`)
    .join('\n');

  const submission = input.submission.slice(0, MAX_SUBMISSION_CHARS);
  const blocks = splitIntoBlocks(submission);
  const numbered = renderBlocks(blocks);

  const isRevision = Boolean(input.previousSubmission && input.previousVerdict);

  const parts: string[] = [
    `DELIVERABLE: ${input.artifactTitle}`,
    '',
    'SCENARIO BRIEF:',
    input.brief,
    '',
    'RUBRIC (score each criterion 0-3 against its descriptor):',
    rubricLines,
    input.graderInstructions ? `\nADDITIONAL GRADER INSTRUCTIONS:\n${input.graderInstructions}` : '',
  ];

  if (isRevision && input.previousVerdict && input.previousSubmission) {
    parts.push(
      '',
      'PREVIOUS GRADE (the trainee is revising after this feedback):',
      renderPreviousVerdict(input.previousVerdict),
      '',
      'PREVIOUS SUBMISSION:',
      input.previousSubmission.slice(0, MAX_SUBMISSION_CHARS),
    );
  }

  parts.push(
    '',
    isRevision
      ? 'NEW SUBMISSION (numbered blocks — grade this on its own merits, then assess the delta):'
      : 'TRAINEE SUBMISSION (numbered blocks — anchor annotations to these numbers):',
    numbered,
  );

  // Defensive final cap on the whole assembled user turn, matching V1's rationale.
  const content = parts.join('\n').slice(0, MAX_USER_CONTENT_CHARS);
  return { content, blocks };
}

/* ------------------------------------------------------------------
   NORMALIZE. Coerce the model's loose JSON into the typed verdict.
   ------------------------------------------------------------------ */

function clampBand(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

function isSeverity(value: unknown): value is AnnotationSeverity {
  return typeof value === 'string' && (SEVERITIES as readonly string[]).includes(value);
}

/**
 * Coerce loose model JSON into a typed `ArtifactVerdictV2`.
 *
 *  - Criterion scores clamp to 0-3 (missing → 0).
 *  - Annotation block refs clamp into the real block range [1, blockCount];
 *    annotations with an unparseable block or an invalid severity are dropped.
 *  - Annotations are capped at MAX_ANNOTATIONS (extras dropped, order preserved).
 *  - `delta` is tolerated missing (returned undefined) and coerced when present.
 *  - overallScore prefers the model's value in range, else recomputes from bands.
 */
export function normalizeVerdictV2(
  parsed: Record<string, unknown>,
  rubric: RubricCriterionInput[],
  blockCount: number,
): ArtifactVerdictV2 {
  const byId = new Map(rubric.map((c) => [c.id, c]));

  const rawCriteria = Array.isArray(parsed.criteria) ? parsed.criteria : [];
  const criteria: CriterionVerdictV2[] = rawCriteria.map((raw) => {
    const c = (raw ?? {}) as Record<string, unknown>;
    const id = typeof c.id === 'string' ? c.id : '';
    const label = typeof c.label === 'string' ? c.label : (byId.get(id)?.label ?? id);
    const score = clampBand(c.score);
    const comment = typeof c.comment === 'string' ? c.comment : '';
    return { id, label, score, comment };
  });

  const annotations = normalizeAnnotations(parsed.annotations, blockCount);

  const topFix = typeof parsed.topFix === 'string' ? parsed.topFix : '';
  const strengths = toStringArray(parsed.strengths);
  const gaps = toStringArray(parsed.gaps);
  const overall = typeof parsed.overall === 'string' ? parsed.overall : '';

  const computed = criteria.length
    ? Math.round((criteria.reduce((s, c) => s + c.score, 0) / (criteria.length * 3)) * 100)
    : 0;
  const modelScore = typeof parsed.overallScore === 'number' ? parsed.overallScore : NaN;
  const overallScore =
    Number.isFinite(modelScore) && modelScore >= 0 && modelScore <= 100
      ? Math.round(modelScore)
      : computed;

  const passed = typeof parsed.passed === 'boolean' ? parsed.passed : overallScore >= 70;

  const delta = normalizeDelta(parsed.delta);

  const verdict: ArtifactVerdictV2 = {
    criteria,
    annotations,
    topFix,
    strengths,
    gaps,
    overall,
    overallScore,
    passed,
  };
  if (delta) verdict.delta = delta;
  return verdict;
}

/** Coerce, filter, clamp, and cap the annotations array. */
function normalizeAnnotations(value: unknown, blockCount: number): Annotation[] {
  if (!Array.isArray(value)) return [];
  const out: Annotation[] = [];

  for (const raw of value) {
    if (out.length >= MAX_ANNOTATIONS) break; // cap at MAX_ANNOTATIONS, order preserved
    const a = (raw ?? {}) as Record<string, unknown>;

    // Block must be a finite number and clamp into the real range. If there are
    // no blocks at all, there is nothing to anchor to, so drop the annotation.
    const blockNum = typeof a.block === 'number' ? a.block : Number(a.block);
    if (!Number.isFinite(blockNum) || blockCount < 1) continue;
    const block = Math.max(1, Math.min(blockCount, Math.round(blockNum)));

    if (!isSeverity(a.severity)) continue; // invalid severities dropped
    const comment = typeof a.comment === 'string' ? a.comment.trim() : '';
    if (comment.length === 0) continue; // an annotation with no comment teaches nothing

    const annotation: Annotation = { block, severity: a.severity, comment };
    if (typeof a.rewriteSuggestion === 'string' && a.rewriteSuggestion.trim().length > 0) {
      annotation.rewriteSuggestion = a.rewriteSuggestion.trim();
    }
    out.push(annotation);
  }

  return out;
}

/** Coerce the optional delta; return undefined when absent or unusable. */
function normalizeDelta(value: unknown): RevisionDelta | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const d = value as Record<string, unknown>;

  const addressed = toStringArray(d.addressed);
  const ignored = toStringArray(d.ignored);
  const regressions = toStringArray(d.regressions);
  const scoreChangeExplanation =
    typeof d.scoreChangeExplanation === 'string' ? d.scoreChangeExplanation : '';

  // If the delta object is entirely empty, treat it as absent so the UI does not
  // render a hollow delta panel.
  if (
    addressed.length === 0 &&
    ignored.length === 0 &&
    regressions.length === 0 &&
    scoreChangeExplanation.length === 0
  ) {
    return undefined;
  }

  return { addressed, ignored, regressions, scoreChangeExplanation };
}

/* ------------------------------------------------------------------
   GRADE. Mirrors V1's `gradeArtifact`: takes a client, returns
   { verdict, raw, usage }. The route owns all guardrails; this just spends.
   ------------------------------------------------------------------ */

export interface GradeArtifactV2Result {
  /** The normalized verdict, or null when the model reply was not parseable JSON. */
  verdict: ArtifactVerdictV2 | null;
  /** The raw model text, always returned so the route can log/debug. */
  raw: string;
  /** Token usage from the model call, for cost accounting. */
  usage: Anthropic.Usage | null;
}

/**
 * Grade one artifact submission with V2 (annotations + optional revision delta).
 * Assumes all guardrails (rate limit, key, global ceiling) already passed and
 * that the caller has already counted the spend against the global ceiling.
 */
export async function gradeArtifactV2(
  client: Anthropic,
  input: ArtifactGradeV2Input,
): Promise<GradeArtifactV2Result> {
  const { content, blocks } = buildUserContentV2(input);

  const response = await client.messages.create({
    model: GRADER_MODEL_V2,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT_V2,
    messages: [{ role: 'user', content }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Claude occasionally wraps JSON in prose or a code fence; extract the object.
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { verdict: null, raw: text, usage: response.usage ?? null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const verdict = normalizeVerdictV2(parsed, input.rubric, blocks.length);
    return { verdict, raw: text, usage: response.usage ?? null };
  } catch {
    return { verdict: null, raw: text, usage: response.usage ?? null };
  }
}
