import Anthropic from '@anthropic-ai/sdk';
import {
  checkRateLimit,
  clientKeyFromRequest,
  rateLimitedResponse,
} from '@/lib/rateLimit';

/**
 * AI-graded artifact endpoint: the differentiator of the knowledge center.
 *
 * A learner writes a real PM deliverable (a one-page PRD, a strategy memo, an
 * experiment plan, etc.) and this route grades it against a RUBRIC the learner
 * could see while writing. Rubric-aligned prompting (criteria + level
 * descriptors handed to the model) gives far steadier, fairer scores than a
 * free-form "rate this", so the client sends the rubric and we score each
 * criterion against its own descriptors.
 *
 * GUARDRAILS (in priority order)
 * ------------------------------
 *  1. RATE LIMIT + COST CAP. A public, unauthenticated POST that calls a paid
 *     model must be capped. We sliding-window limit per client (session token or
 *     IP) and use a cheap model (Haiku) with a bounded max_tokens, so the worst
 *     case spend per caller per window is small and predictable.
 *  2. GRACEFUL DEGRADATION. Production runs with no ANTHROPIC_API_KEY today, and
 *     should stay free and functional. With no key we return a clear, NON-error
 *     "grading unavailable" payload (HTTP 200) so the lesson can show a calm
 *     fallback and preserve the learner's writing, exactly like /api/grade's UI.
 */

export const dynamic = 'force-dynamic';
// In-memory rate-limit state requires a long-lived runtime. nodejs is the
// default, but we pin it so an accidental edge switch cannot silently make the
// limiter per-invocation (and therefore useless).
export const runtime = 'nodejs';

/* ------------------------------------------------------------------
   Cap configuration. ~10 submissions per 10 minutes per client, and a tight
   token ceiling so a single graded call stays cheap on Haiku.
   ------------------------------------------------------------------ */
const RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };
const MAX_OUTPUT_TOKENS = 900;
/** Hard cap on submission size so a giant paste cannot inflate input cost. */
const MAX_SUBMISSION_CHARS = 8000;
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
const MAX_USER_CONTENT_CHARS = 12000;
const GRADER_MODEL = 'claude-haiku-4-5-20251001';

/** One rubric criterion the model scores against, with its own level guide. */
export interface RubricCriterionInput {
  /** Stable id echoed back in the per-criterion result. */
  id: string;
  /** Short human label, e.g. "Problem clarity". */
  label: string;
  /** What a strong answer on this criterion looks like. */
  descriptor: string;
}

interface ArtifactGradeRequest {
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
interface CriterionVerdict {
  id: string;
  label: string;
  /** 0-3 band: 0 missing, 1 weak, 2 solid, 3 excellent. */
  score: number;
  comment: string;
}

/** The structured verdict the lesson renders. */
interface ArtifactVerdict {
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
const SYSTEM_PROMPT = `You are a senior product leader grading a trainee PM's written deliverable for a portfolio review.

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
function buildUserContent(body: ArtifactGradeRequest): string {
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
function normalizeVerdict(
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

export async function POST(request: Request) {
  // 1) Rate limit first: reject over-cap callers before any parsing or spend.
  const key = clientKeyFromRequest(request, 'grade-artifact');
  const limit = checkRateLimit(key, RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit);

  let body: ArtifactGradeRequest;
  try {
    body = (await request.json()) as ArtifactGradeRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.submission?.trim()) {
    return Response.json({ error: 'Submission is empty' }, { status: 400 });
  }
  if (!Array.isArray(body.rubric) || body.rubric.length === 0) {
    return Response.json({ error: 'A rubric is required to grade' }, { status: 400 });
  }

  // 2) Graceful degradation: no key, no spend. Return a calm 200 the UI can show
  //    while preserving the learner's writing (mirrors how the drills degrade).
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      unavailable: true,
      message:
        'Live grading is off in this environment. Your draft is saved below. Set ANTHROPIC_API_KEY to get rubric feedback from Claude.',
    });
  }

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: GRADER_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserContent(body) }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Claude occasionally wraps JSON in prose or a code fence; extract the object.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ raw: text, verdict: null });
    }
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const verdict = normalizeVerdict(parsed, body.rubric);
      return Response.json({ verdict, raw: text });
    } catch {
      return Response.json({ raw: text, verdict: null });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json({ error: `Grading failed: ${msg}` }, { status: 500 });
  }
}
