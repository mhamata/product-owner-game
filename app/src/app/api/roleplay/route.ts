import Anthropic from '@anthropic-ai/sdk';
import {
  checkRateLimit,
  checkGlobalBudget,
  clientKeyFromRequest,
  countReply,
  rateLimitedResponse,
  recordModelCall,
  recordReply,
} from '@/lib/rateLimit';
import {
  type RoleplayMessage,
  canReply,
  MAX_LEARNER_TURNS,
  MAX_MESSAGE_CHARS,
} from '@/curriculum/roleplay/types';

/**
 * AI roleplay endpoint: the "influence without authority" modality.
 *
 * A learner argues a position with an in-character AI counterpart (a skeptical
 * VP, a protective eng lead, an angry enterprise customer, a persistent peer) who
 * pushes back, then has the whole conversation graded against a visible rubric.
 * One route serves two actions:
 *  - `reply`: the character responds in character to the conversation so far.
 *  - `score`: grade the transcript against the scenario rubric (per-criterion
 *    band + overall pass/keep-going), exactly like the artifact grader.
 *
 * GUARDRAILS (in priority order). A public, unauthenticated POST that calls a
 * paid model must not be able to run up the bill, so the cost ceilings here are
 * non-negotiable and all server-enforced:
 *  1. GLOBAL CEILING. Before any spend, the route consults the process-wide
 *     model-call ceiling (src/lib/rateLimit.ts). Once it is reached the route
 *     returns a calm 200 { unavailable, reason: 'at capacity' } and does NOT call
 *     the model. This is the hard cost cap: it holds even when an attacker rotates
 *     the session token and IP on every request, which the per-client limits
 *     cannot stop on their own.
 *  2. RATE LIMIT. Sliding-window limit per client (session token or IP) on BOTH
 *     actions, sharing the project's one limiter. Slows a single identity.
 *  3. TURN CAP (server-tracked). The `reply` action refuses once a client+session
 *     has spent MAX_LEARNER_TURNS replies (HTTP 409). The authoritative count is
 *     kept SERVER-SIDE (countReply / recordReply), so it cannot be reset by a
 *     crafted client that posts a fresh, short `messages` array every request: a
 *     given session can only ever buy a fixed number of character replies no
 *     matter what transcript it sends. The client-array check (`canReply`) is
 *     kept only as a fast pre-check.
 *  4. TOKEN + INPUT CAP. Cheap model (Haiku), bounded max_tokens per action, each
 *     message clamped, the forwarded transcript bounded, and the whole assembled
 *     prompt clamped, so worst-case spend per call is small and predictable.
 *  5. GRACEFUL DEGRADATION. With no ANTHROPIC_API_KEY we return a calm, NON-error
 *     "unavailable" payload (HTTP 200) so the lesson shows a fallback and keeps
 *     the learner's conversation, exactly like /api/grade-artifact.
 */

export const dynamic = 'force-dynamic';
// In-memory rate-limit state requires a long-lived runtime. nodejs is the
// default; we pin it so an accidental edge switch cannot silently make the
// limiter per-invocation (and therefore useless), the same as the other LLM
// routes.
export const runtime = 'nodejs';

/* ------------------------------------------------------------------
   Cap configuration.

   The roleplay loop is chatty (several `reply` calls per session), so the rate
   window is a bit roomier than the once-per-action graders, but the TURN CAP is
   the real bound on a single session's spend: at most MAX_LEARNER_TURNS replies
   plus one score. Both actions share this per-client window.
   ------------------------------------------------------------------ */
const RATE_LIMIT = { limit: 40, windowMs: 10 * 60 * 1000 };

/** A character reply is short, so a tight output ceiling keeps each call cheap. */
const REPLY_MAX_TOKENS = 320;
/** The scored verdict is structured JSON across several criteria; modest ceiling. */
const SCORE_MAX_TOKENS = 900;

/**
 * How many of the most recent transcript messages we forward to the model. The
 * turn cap already bounds a well-behaved client to a short conversation, but a
 * crafted body could send a huge `messages` array, so we defensively keep only
 * the last N turns. N comfortably covers a full capped session (MAX_LEARNER_TURNS
 * learner turns interleaved with character turns) plus the opening line.
 */
const MAX_FORWARDED_MESSAGES = MAX_LEARNER_TURNS * 2 + 2;

/** Defensive cap on the authored persona/rubric text we trust from the client. */
const MAX_PERSONA_CHARS = 4000;
/**
 * Final clamp on the TOTAL assembled user content for the score action (the
 * transcript plus the rubric framing). Every per-part input is already clamped;
 * this bounds the whole so a padded body cannot push input tokens past the cost
 * cap. ~16k chars is roughly 4k input tokens: bounded and cheap on Haiku.
 */
const MAX_USER_CONTENT_CHARS = 16000;

const ROLEPLAY_MODEL = 'claude-haiku-4-5-20251001';

/* ------------------------------------------------------------------
   Request shapes.
   ------------------------------------------------------------------ */

/** One rubric criterion the score action grades the whole conversation against. */
interface RoleplayCriterionInput {
  id: string;
  label: string;
  descriptor: string;
}

/** Shared fields both actions send. */
interface BaseRequest {
  /** Skill id, for logging/debugging only (behavior is driven by the payload). */
  skillId: string;
  /** The conversation so far, oldest first (includes the character's opening). */
  messages: RoleplayMessage[];
}

/** `reply`: ask the character for its next in-character line. */
interface ReplyRequest extends BaseRequest {
  action: 'reply';
  /** The persona contract: who the character is and how they argue. */
  persona: string;
  /** Short label of who the learner is talking to, for the persona framing. */
  characterName: string;
}

/** `score`: grade the finished conversation against the rubric. */
interface ScoreRequest extends BaseRequest {
  action: 'score';
  /** Short scenario title, for grader context. */
  scenarioTitle: string;
  /** The learner's goal in the conversation, for grader context. */
  goal: string;
  /** The rubric the learner saw: the bar each criterion is scored against. */
  rubric: RoleplayCriterionInput[];
}

type RoleplayRequest = ReplyRequest | ScoreRequest;

/* ------------------------------------------------------------------
   Score verdict shape (mirrors the artifact grader's contract so the client
   can render both with one mental model).
   ------------------------------------------------------------------ */

interface CriterionVerdict {
  id: string;
  label: string;
  /** 0-3 band: 0 missing, 1 weak, 2 solid, 3 excellent. */
  score: number;
  comment: string;
}

interface RoleplayVerdict {
  criteria: CriterionVerdict[];
  strengths: string[];
  gaps: string[];
  overall: string;
  /** 0-100 rollup the UI turns into a pass/keep-going state. */
  overallScore: number;
  passed: boolean;
}

/* ------------------------------------------------------------------
   Prompts. The fixed contract is the system prompt; the variable persona /
   rubric / transcript go in the user turn so the model treats them as data.
   ------------------------------------------------------------------ */

const REPLY_SYSTEM_PROMPT = `You are playing a character in a training roleplay for product managers. The learner is practising how to influence someone without authority over them.

You will be given:
- A PERSONA describing exactly who you are, what you want, how you argue, and how you can (and cannot) be won over.
- The CONVERSATION so far. Lines marked "Them:" are the learner (the PM). Lines marked "You:" are your own previous lines as the character.

Rules:
- Stay completely in character. Speak only as the character would speak, in the first person.
- Push back like the real person would. Do not fold instantly, and do not be a cartoon villain. Reward good arguments by moving, in character, toward agreement; stay unconvinced by hand-waving, flattery, or pressure with no substance.
- Reply with ONLY the character's next spoken lines. No narration, no stage directions, no labels, no meta commentary, no mention of being an AI or of grading. Keep it to two to five sentences.`;

const SCORE_SYSTEM_PROMPT = `You are a senior product leader debriefing a trainee PM on a roleplay they just finished. The roleplay practised influencing someone without authority.

You will receive: the scenario title, the learner's GOAL, a RUBRIC (criteria, each with an id, a label, and a descriptor of what "strong" looks like), and the full CONVERSATION. In the transcript, lines marked "PM:" are the learner; lines marked "Character:" are the counterpart they were trying to influence.

Grade ONLY the PM's contribution, against the rubric. For each criterion, score on this band:
- 0 = missing or counterproductive
- 1 = attempted but weak
- 2 = solid, meets the bar
- 3 = excellent, exceeds the bar

Rules:
- Judge what the PM actually said, not what you imagine they meant. Reward a clear position, real evidence, genuine engagement with the other side's concerns, and a relationship-preserving tone. Penalize caving, vagueness, bluster, and dismissiveness.
- Keep every comment to one or two sentences, concrete and actionable. Name the fix, not just the flaw.
- Be constructive and specific. Never shame.

Return ONLY a JSON object, no prose around it, in exactly this shape:
{
  "criteria": [{ "id": "<criterion id>", "label": "<criterion label>", "score": 0-3, "comment": "<one to two sentences>" }],
  "strengths": ["<two to three concrete strengths>"],
  "gaps": ["<two to three concrete, prioritized gaps>"],
  "overall": "<two to three sentence verdict>",
  "overallScore": 0-100,
  "passed": <true if the PM met the bar overall, else false>
}
Compute overallScore as the sum of criterion scores divided by the maximum possible (criteria count times 3), times 100, rounded to a whole number. Set passed to true when overallScore is at least 70.`;

/* ------------------------------------------------------------------
   Helpers.
   ------------------------------------------------------------------ */

/** Trim a transcript to the last N turns and clamp each message's length. */
function boundedTranscript(messages: RoleplayMessage[]): RoleplayMessage[] {
  const recent = messages.slice(-MAX_FORWARDED_MESSAGES);
  return recent.map((m) => ({
    role: m.role,
    text: String(m.text ?? '').slice(0, MAX_MESSAGE_CHARS),
  }));
}

/** Render a transcript for the `reply` turn, from the character's POV. */
function renderReplyTranscript(messages: RoleplayMessage[]): string {
  return messages
    .map((m) => (m.role === 'learner' ? `Them: ${m.text}` : `You: ${m.text}`))
    .join('\n');
}

/** Render a transcript for the `score` turn, labelled for the grader. */
function renderScoreTranscript(messages: RoleplayMessage[]): string {
  return messages
    .map((m) => (m.role === 'learner' ? `PM: ${m.text}` : `Character: ${m.text}`))
    .join('\n');
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

/** Coerce the model's loose JSON into the typed verdict, clamping scores. */
function normalizeVerdict(
  parsed: Record<string, unknown>,
  rubric: RoleplayCriterionInput[],
): RoleplayVerdict {
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

/* ------------------------------------------------------------------
   Handler.
   ------------------------------------------------------------------ */

export async function POST(request: Request) {
  // 1) Rate limit first: reject over-cap callers before any parsing or spend.
  const key = clientKeyFromRequest(request, 'roleplay');
  const limit = checkRateLimit(key, RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit);

  let body: RoleplayRequest;
  try {
    body = (await request.json()) as RoleplayRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body?.action !== 'reply' && body?.action !== 'score') {
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: 'A conversation is required' }, { status: 400 });
  }

  // 2) Turn cap (reply only), BEFORE the no-key check and any model call. The
  //    SERVER-tracked count is authoritative: we bind it to this client+session
  //    AND this scenario (skillId), so a fresh scenario gets its own budget while
  //    a single session cannot reset its count by reshaping the transcript it
  //    posts. The client-array `canReply` is only a fast pre-check; the server
  //    counter below is what actually enforces the cap. 409 (a state conflict)
  //    rather than 429 so the client can distinguish "you are out of turns, wrap
  //    up" from "you are going too fast".
  const replyKey = `${key}:reply:${String(body.skillId ?? '').slice(0, 120)}`;
  if (body.action === 'reply') {
    // Fast pre-check: a well-behaved client's own transcript already shows the cap
    // is reached, so we can refuse without trusting it as the source of truth.
    const preCheck = canReply(body.messages);
    // Authoritative check: how many replies has the SERVER actually granted this
    // client+session+scenario? Once that hits the cap, refuse no matter what the
    // client array claims. This is what defeats a reset-array client.
    const serverGranted = countReply(replyKey);
    if (!preCheck.allowed || serverGranted >= MAX_LEARNER_TURNS) {
      return Response.json(
        {
          error: 'Turn limit reached for this roleplay. Wrap up and get scored.',
          turnLimitReached: true,
          cap: MAX_LEARNER_TURNS,
        },
        { status: 409 },
      );
    }
  }

  // 3) Graceful degradation: no key, no spend. Return a calm 200 the UI can show
  //    while preserving the learner's conversation (mirrors grade-artifact).
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      unavailable: true,
      message:
        'Live roleplay is off in this environment. Your conversation is saved. Set ANTHROPIC_API_KEY to talk with the character and get scored by Claude.',
    });
  }

  // 4) Global ceiling: the hard cost cap. Even with a key set and the per-client
  //    limits passed, refuse once the process has spent its global model-call
  //    budget for the window. Calm 200 with the same `unavailable` shape as the
  //    no-key path so the UI already handles it, and crucially NO model call.
  const budget = checkGlobalBudget();
  if (!budget.allowed) {
    return Response.json({
      unavailable: true,
      reason: 'at capacity',
      message:
        'Live roleplay is at capacity right now. Your conversation is saved. Please try again later.',
    });
  }

  const transcript = boundedTranscript(body.messages);
  const client = new Anthropic({ apiKey });

  if (body.action === 'reply') {
    const persona = String(body.persona ?? '').slice(0, MAX_PERSONA_CHARS);
    const characterName = String(body.characterName ?? 'the character').slice(0, 120);
    const userContent = [
      `PERSONA (you are ${characterName}):`,
      persona,
      '',
      'CONVERSATION so far:',
      renderReplyTranscript(transcript),
      '',
      'Reply with only your next lines, in character.',
    ]
      .join('\n')
      .slice(0, MAX_USER_CONTENT_CHARS);

    try {
      // Count the call against the global ceiling at the moment we spend, so even
      // a request that later errors still counts toward the hard cost cap.
      recordModelCall();
      const response = await client.messages.create({
        model: ROLEPLAY_MODEL,
        max_tokens: REPLY_MAX_TOKENS,
        system: REPLY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      });
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
      if (!text) {
        return Response.json({ error: 'The character did not respond. Please try again.' }, { status: 502 });
      }
      // Charge this client+session+scenario one turn ONLY on a confirmed reply, so
      // a learner is never burned a turn for a failed generation. This is the
      // server-authoritative count the turn cap above reads.
      recordReply(replyKey);
      return Response.json({ reply: text });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return Response.json({ error: `Roleplay reply failed: ${msg}` }, { status: 500 });
    }
  }

  // action === 'score'
  if (!Array.isArray(body.rubric) || body.rubric.length === 0) {
    return Response.json({ error: 'A rubric is required to score' }, { status: 400 });
  }

  const rubricLines = body.rubric
    .map((c, i) => `${i + 1}. [id: ${c.id}] ${c.label}: ${c.descriptor}`)
    .join('\n');

  const userContent = [
    `SCENARIO: ${String(body.scenarioTitle ?? '').slice(0, 200)}`,
    '',
    `PM'S GOAL: ${String(body.goal ?? '').slice(0, 600)}`,
    '',
    'RUBRIC (score each criterion 0-3 against its descriptor):',
    rubricLines,
    '',
    'CONVERSATION (grade only the PM lines):',
    renderScoreTranscript(transcript),
  ]
    .join('\n')
    .slice(0, MAX_USER_CONTENT_CHARS);

  try {
    // Count the score call against the global ceiling at the moment we spend.
    recordModelCall();
    const response = await client.messages.create({
      model: ROLEPLAY_MODEL,
      max_tokens: SCORE_MAX_TOKENS,
      system: SCORE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
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
    return Response.json({ error: `Roleplay scoring failed: ${msg}` }, { status: 500 });
  }
}
