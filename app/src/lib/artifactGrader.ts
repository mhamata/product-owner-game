import type Anthropic from '@anthropic-ai/sdk';

/**
 * THE ARTIFACT GRADING CORE, shared verbatim by two callers:
 *
 *   1. `/api/grade-artifact` — the live route the lesson UI posts to.
 *   2. `scripts/calibrate.ts` — the Phase-0 calibration harness that measures
 *      grader-vs-human-panel agreement on the golden set.
 *
 * It moved here FROM the route so the calibration study grades with the exact
 * prompt, model, caps, and normalization the product uses. If the study and
 * the product ever grade differently, the study is measuring nothing — so any
 * change to this file invalidates prior calibration results and must re-run
 * `npm run calibrate` (the golden-set regression suite) before deploy.
 */

/* ------------------------------------------------------------------
   Cap configuration. A tight token ceiling so a single graded call stays
   cheap on Haiku.
   ------------------------------------------------------------------ */
export const MAX_OUTPUT_TOKENS = 900;
/** Hard cap on submission size so a giant paste cannot inflate input cost. */
export const MAX_SUBMISSION_CHARS = 8000;
/**
 * Hard cap on the TOTAL assembled user content (brief + rubric descriptors +
 * grader instructions + submission + the labels that frame them). The
 * submission alone is already clamped, but the brief, rubric, and grader
 * instructions come from the client too, so a crafted body could pad them to
 * inflate input tokens past the intended per-call cap even with a small
 * submission. Clamping the assembled whole closes that. The ceiling sits well
 * above any authored artifact (legitimate content uses a small fraction of it),
 * so only an abusive body is ever truncated. ~12k chars is roughly 3k input
 * tokens: bounded and cheap on Haiku.
 */
export const MAX_USER_CONTENT_CHARS = 12000;
export const GRADER_MODEL = 'claude-haiku-4-5-20251001';

/** One rubric criterion the model scores against, with its own level guide. */
export interface RubricCriterionInput {
  /** Stable id echoed back in the per-criterion result. */
  id: string;
  /** Short human label, e.g. "Problem clarity". */
  label: string;
  /** What a strong answer on this criterion looks like. */
  descriptor: string;
}

export interface ArtifactGradeRequest {
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
  /** The learner's submission (assembled prose). */
  submission: string;
}

/** Per-criterion verdict shape we ask the model to return. */
export interface CriterionVerdict {
  id: string;
  label: string;
  /** 0-3 band: 0 missing, 1 weak, 2 solid, 3 excellent. */
  score: number;
  comment: string;
}

/** The structured verdict the lesson renders. */
export interface ArtifactVerdict {
  criteria: CriterionVerdict[];
  strengths: string[];
  gaps: string[];
  overall: string;
  /** 0-100 rollup the UI turns into a pass/keep-going state. */
  overallScore: number;
  passed: boolean;
}

/**
 * The fixed grading contract, sent as the system prompt. The variable rubric
 * and submission go in the user turn so the system prompt stays cacheable and
 * the model treats the rubric as data to grade against, not instructions to
 * follow.
 */
export const SYSTEM_PROMPT = `You are a senior product leader grading a trainee PM's written deliverable for a portfolio review.

You will receive: the deliverable title, the scenario brief the trainee was given, a RUBRIC (a list of criteria, each with an id, a label, and a descriptor of what "strong" looks like), optional extra grader instructions, and the trainee's SUBMISSION.

Grade ONLY against the rubric. For each criterion, score the submission on this band:
- 0 = missing or off-track
- 1 = attempted but weak
- 2 = solid, meets the bar
- 3 = excellent, exceeds the bar

Rules:
- Judge what is written, not what you imagine they meant. Reward specificity; penalize vague, generic, or buzzword answers.
- Keep every comment to one or two sentences, concrete and actionable. Name the fix, not just the flaw.
- Do not invent facts that are not in the brief or submission.
- Be constructive and specific. Never shame.

Return ONLY a JSON object, no prose around it, in exactly this shape:
{
  "criteria": [{ "id": "<criterion id>", "label": "<criterion label>", "score": 0-3, "comment": "<one to two sentences>" }],
  "strengths": ["<two to three concrete strengths>"],
  "gaps": ["<two to three concrete, prioritized gaps>"],
  "overall": "<two to three sentence verdict>",
  "overallScore": 0-100,
  "passed": <true if the work meets the bar overall, else false>
}
Compute overallScore as the sum of criterion scores divided by the maximum possible (criteria count times 3), times 100, rounded to a whole number. Set passed to true when overallScore is at least 70.`;

/** Build the user-turn content from the (variable) rubric + submission. */
export function buildUserContent(body: ArtifactGradeRequest): string {
  const rubricLines = body.rubric
    .map((c, i) => `${i + 1}. [id: ${c.id}] ${c.label}: ${c.descriptor}`)
    .join('\n');

  const submission = body.submission.slice(0, MAX_SUBMISSION_CHARS);

  const assembled = [
    `DELIVERABLE: ${body.artifactTitle}`,
    '',
    'SCENARIO BRIEF:',
    body.brief,
    '',
    'RUBRIC (score each criterion 0-3 against its descriptor):',
    rubricLines,
    body.graderInstructions ? `\nADDITIONAL GRADER INSTRUCTIONS:\n${body.graderInstructions}` : '',
    '',
    'TRAINEE SUBMISSION:',
    submission,
  ].join('\n');

  // Defensive final cap on the whole assembled user turn: the brief, rubric, and
  // grader instructions are client-supplied too, so bound the total so a padded
  // request body cannot push input tokens past the per-call cost cap.
  return assembled.slice(0, MAX_USER_CONTENT_CHARS);
}

/** Coerce the model's loose JSON into the typed verdict, clamping scores. */
export function normalizeVerdict(
  parsed: Record<string, unknown>,
  rubric: RubricCriterionInput[],
): ArtifactVerdict {
  const byId = new Map(rubric.map((c) => [c.id, c]));
  const rawCriteria = Array.isArray(parsed.criteria) ? parsed.criteria : [];

  const criteria: CriterionVerdict[] = rawCriteria.map((raw) => {
    const c = (raw ?? {}) as Record<string, unknown>;
    const id = typeof c.id === 'string' ? c.id : '';
    const label = typeof c.label === 'string' ? c.label : (byId.get(id)?.label ?? id);
    const score = clampBand(c.score);
    const comment = typeof c.comment === 'string' ? c.comment : '';
    return { id, label, score, comment };
  });

  const strengths = toStringArray(parsed.strengths);
  const gaps = toStringArray(parsed.gaps);
  const overall = typeof parsed.overall === 'string' ? parsed.overall : '';

  // Prefer the model's rollup, but recompute from the bands if it is missing or
  // out of range, so the UI always has a trustworthy 0-100.
  const computed = criteria.length
    ? Math.round((criteria.reduce((s, c) => s + c.score, 0) / (criteria.length * 3)) * 100)
    : 0;
  const modelScore = typeof parsed.overallScore === 'number' ? parsed.overallScore : NaN;
  const overallScore =
    Number.isFinite(modelScore) && modelScore >= 0 && modelScore <= 100
      ? Math.round(modelScore)
      : computed;

  const passed = typeof parsed.passed === 'boolean' ? parsed.passed : overallScore >= 70;

  return { criteria, strengths, gaps, overall, overallScore, passed };
}

function clampBand(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

/**
 * Pull the JSON verdict out of a raw model reply. Claude occasionally wraps
 * JSON in prose or a code fence, so we extract the outermost object before
 * parsing; a null verdict means the caller should surface a soft retry.
 */
export function extractVerdict(
  text: string,
  rubric: RubricCriterionInput[],
): ArtifactVerdict | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return normalizeVerdict(parsed, rubric);
  } catch {
    return null;
  }
}

/** Real token usage of a graded call, for budget settlement + the audit log. */
export interface GradeUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * One graded call, end to end: build the prompt, call the model, extract the
 * verdict. The caller owns everything around it (rate limits, budgets, error
 * shaping) — this function owns only the grading contract.
 */
export async function gradeArtifact(
  client: Anthropic,
  input: ArtifactGradeRequest,
): Promise<{ verdict: ArtifactVerdict | null; raw: string; usage: GradeUsage }> {
  const response = await client.messages.create({
    model: GRADER_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserContent(input) }],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const usage: GradeUsage = {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  };

  return { verdict: extractVerdict(raw, input.rubric), raw, usage };
}
