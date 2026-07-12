import Anthropic from '@anthropic-ai/sdk';
import {
  checkRateLimit,
  checkGlobalBudget,
  clientKeyFromRequest,
  rateLimitedResponse,
  recordModelCall,
} from '@/lib/rateLimit';
import {
  gradeArtifact,
  buildUserContent,
  GRADER_MODEL,
  MAX_OUTPUT_TOKENS,
  type ArtifactGradeRequest,
} from '@/lib/artifactGrader';
import {
  gradeArtifactV2,
  buildUserContentV2,
  GRADER_MODEL_V2,
  MAX_OUTPUT_TOKENS as MAX_OUTPUT_TOKENS_V2,
  type PreviousVerdictSummary,
} from '@/lib/artifactGraderV2';
import { authMode, getUserFromRequest } from '@/lib/supabase/server';
import { actualCallCents, estimateCallCents, logUsage, reserveBudget, settleBudget } from '@/lib/budget';
import { reconcileBudgetOnLapse } from '@/lib/entitlements';

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
 * TWO GRADING VERSIONS, ONE GUARDRAIL STACK:
 *  - V1 (`@/lib/artifactGrader`) — the whole-submission rubric grade, shared
 *    with the Phase-0 calibration harness (`scripts/calibrate.ts`) so the
 *    calibration study and production grade identically. Requests without
 *    `v: 2` take this path, byte-for-byte unchanged.
 *  - V2 (`@/lib/artifactGraderV2`) — adds block-anchored inline annotations
 *    and the revise-and-resubmit delta. Same rubric bands; richer feedback.
 *
 * This route owns only the guardrails around them:
 *  1. GLOBAL CEILING. Before any spend, the route consults the process-wide
 *     model-call ceiling (src/lib/rateLimit.ts). Once it is reached we return a
 *     calm 200 { unavailable, reason: 'at capacity' } and do NOT call the model.
 *     This is the hard cost cap: it holds even when an attacker rotates the
 *     session token and IP per request, which the per-client limit cannot stop.
 *  2. RATE LIMIT + PER-CALL COST CAP. A public, unauthenticated POST that calls a
 *     paid model must be capped. We sliding-window limit per client (session token
 *     or IP) and use a cheap model (Haiku) with a bounded max_tokens, so the worst
 *     case spend per caller per window is small and predictable.
 *  3. GRACEFUL DEGRADATION. Production runs with no ANTHROPIC_API_KEY today, and
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
   Cap configuration. ~10 submissions per 10 minutes per client; the per-call
   token ceilings live with the grading cores in @/lib/artifactGrader{,V2}.
   ------------------------------------------------------------------ */
const RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

// Re-export the request/verdict types under their historical names so existing
// importers of this route's contract keep compiling.
export type { RubricCriterionInput, ArtifactVerdict, CriterionVerdict } from '@/lib/artifactGrader';
export type { ArtifactVerdictV2 } from '@/lib/artifactGraderV2';

/** The route's request body: the V1 contract plus the optional V2 fields. */
interface GradeRouteRequest extends ArtifactGradeRequest {
  /**
   * Grading version. Unset (or anything but 2) => the EXACT V1 path, untouched,
   * so the Phase-0 calibration study is unaffected. `2` => inline annotations +
   * revise-and-resubmit via `artifactGraderV2`.
   */
  v?: 2;
  /** V2 revision only: the submission the previous verdict graded. */
  previousSubmission?: string;
  /** V2 revision only: the criteria + annotations from the previous grade. */
  previousVerdict?: PreviousVerdictSummary;
}

export async function POST(request: Request) {
  // 1) Rate limit first: reject over-cap callers before any parsing or spend.
  const key = clientKeyFromRequest(request, 'grade-artifact');
  const limit = checkRateLimit(key, RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit);

  let body: GradeRouteRequest;
  try {
    body = (await request.json()) as GradeRouteRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.submission?.trim()) {
    return Response.json({ error: 'Submission is empty' }, { status: 400 });
  }
  if (!Array.isArray(body.rubric) || body.rubric.length === 0) {
    return Response.json({ error: 'A rubric is required to grade' }, { status: 400 });
  }

  const isV2 = body.v === 2;

  // 2) Identity (Phase-0 substrate). Default 'off' preserves today's anonymous
  //    behavior exactly; with PRAXIS_AUTH_MODE=required the caller must present
  //    a valid Supabase JWT. (The budget reserve happens later, immediately
  //    before the spend, so early exits below can never leak a reservation.)
  let userId: string | null = null;
  if (authMode() === 'required') {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Sign in to use AI grading.' }, { status: 401 });
    }
    userId = user.id;
    // Lazy expiry->downgrade reconciliation (docs/PHASE1.md slice D): a lapsed
    // entitlement drops the budget tier back to free before the gate below
    // enforces spend. Best-effort — an unavailable reconciliation must not
    // block grading; the stored tier still gates spend either way.
    try {
      await reconcileBudgetOnLapse(userId);
    } catch (e) {
      console.warn('reconcileBudgetOnLapse failed, continuing with existing budget tier:', e);
    }
  }

  // 3) Graceful degradation: no key, no spend. Return a calm 200 the UI can show
  //    while preserving the learner's writing (mirrors how the drills degrade).
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      unavailable: true,
      message:
        'Live grading is off in this environment. Your draft is saved below. Set ANTHROPIC_API_KEY to get rubric feedback from Claude.',
    });
  }

  // 4) Global ceiling: the hard cost cap. Even with a key and the per-client limit
  //    passed, refuse once the process has spent its global model-call budget so
  //    no amount of client-key/IP rotation can run up the bill. Same calm 200
  //    `unavailable` shape the UI already handles, and NO model call.
  const budget = checkGlobalBudget();
  if (!budget.allowed) {
    return Response.json({
      unavailable: true,
      reason: 'at capacity',
      message: 'Live grading is at capacity right now. Your draft is saved below. Please try again later.',
    });
  }

  // 5) Per-user budget gate, last thing before the spend: reserve worst-case
  //    cost atomically (the Postgres function is race-safe), settle the real
  //    cost after the call — including settling back to zero on failure.
  const model = isV2 ? GRADER_MODEL_V2 : GRADER_MODEL;
  const maxOutputTokens = isV2 ? MAX_OUTPUT_TOKENS_V2 : MAX_OUTPUT_TOKENS;
  const inputChars = isV2 ? buildUserContentV2(body).content.length : buildUserContent(body).length;
  let reservedCents = 0;
  if (userId) {
    reservedCents = estimateCallCents(model, inputChars, maxOutputTokens);
    const allowed = await reserveBudget(userId, reservedCents);
    if (!allowed) {
      return Response.json({
        unavailable: true,
        reason: 'allowance',
        message:
          'You have used this month’s AI grading allowance. Drills and review stay open; grading resets on the 1st.',
      });
    }
  }

  const client = new Anthropic({ apiKey });
  try {
    // Count the call against the global ceiling at the moment we spend.
    recordModelCall();

    if (isV2) {
      const { verdict, raw, usage } = await gradeArtifactV2(client, body);
      if (userId) {
        const actual = actualCallCents(model, usage?.input_tokens ?? 0, usage?.output_tokens ?? 0);
        await settleBudget(userId, reservedCents, actual);
        await logUsage({
          userId,
          route: 'grade-artifact:v2',
          model,
          inputTokens: usage?.input_tokens ?? 0,
          outputTokens: usage?.output_tokens ?? 0,
          estimatedCents: actual,
        });
      }
      return Response.json({ verdict, raw, v: 2 });
    }

    const { verdict, raw, usage } = await gradeArtifact(client, body);
    if (userId) {
      const actual = actualCallCents(model, usage.inputTokens, usage.outputTokens);
      await settleBudget(userId, reservedCents, actual);
      await logUsage({
        userId,
        route: 'grade-artifact',
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCents: actual,
      });
    }
    return Response.json({ verdict, raw });
  } catch (e) {
    // The model call failed: give the reservation back before reporting.
    if (userId && reservedCents > 0) {
      try {
        await settleBudget(userId, reservedCents, 0);
      } catch {
        // Settlement is best-effort on the failure path; the monthly rollover
        // self-heals any leaked reservation at the period boundary.
      }
    }
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json({ error: `Grading failed: ${msg}` }, { status: 500 });
  }
}
