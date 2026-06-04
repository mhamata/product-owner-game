import Anthropic from '@anthropic-ai/sdk';
import {
  checkRateLimit,
  clientKeyFromRequest,
  rateLimitedResponse,
} from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
// Pin nodejs so the in-memory rate limiter keeps a persistent window (see
// src/lib/rateLimit.ts). This is the default, made explicit on purpose.
export const runtime = 'nodejs';

// Cap the public grading endpoint: ~10 drill grades per 10 minutes per client.
// No public LLM endpoint is left uncapped.
const RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

interface GradeRequest {
  drill: 'jtbd' | 'mom-test' | 'pre-mortem' | 'pr-faq';
  input: string;
  context?: Record<string, unknown>;
}

const RUBRICS: Record<GradeRequest['drill'], string> = {
  jtbd: `You are a senior PM grading a Jobs-to-be-Done statement.
Format: "When [situation], I want to [motivation], so I can [expected outcome]."

GRADING CRITERIA:
- SITUATION: concrete (has specific context/trigger), not generic ("when I use the app")
- MOTIVATION: describes the job being hired for, not the feature or solution
- OUTCOME: what the user gains, not what the product does

Common failure modes:
- Writing the feature as the motivation ("I want a dark-mode toggle")
- Abstract situation ("when I'm using the app")
- Tautological outcome ("so I can use dark mode")

Return JSON: { "score": 0-10, "strengths": [...], "issues": [...], "rewrite": "a better version", "interview_angle": "how to pitch this in a PM interview" }. No prose outside JSON.`,
  'mom-test': `You are a senior PM grading a user-research interview question against The Mom Test (Rob Fitzpatrick).

The Mom Test rule: ask about the customer's life and past behavior, never pitch your idea or ask hypotheticals about the future.

GRADING CRITERIA:
- PAST BEHAVIOR: asks about something the person actually did, not what they would/might do
- SPECIFIC: anchored to a concrete recent instance ("the last time…"), not a general habit
- NON-LEADING: doesn't telegraph the desired answer or pitch a solution
- BAD signals to penalize: hypotheticals ("would you…"), compliments-bait ("do you like…"), pricing speculation ("would you pay…")

Return JSON: { "score": 0-10, "strengths": [...], "issues": [...], "rewrite": "a stronger Mom-Test version of the question", "interview_angle": "how to talk about this discovery skill in a PM interview" }. No prose outside JSON.`,
  'pre-mortem': `You are a senior PM evaluating a pre-mortem exercise. The user was asked to name ways a project could fail.

GRADING CRITERIA:
- Coverage breadth: technical, organizational, market, stakeholder, regulatory
- Specificity: named risks are better than vague ones
- Leading indicators: did they identify anything they could monitor?
- Ownership: did any failure mode imply a specific owner?

Return JSON: { "score": 0-10, "coverage_strengths": [...], "coverage_gaps": [...], "missing_categories": [...], "interview_angle": "..." }. No prose outside JSON.`,
  'pr-faq': `You are a senior PM grading an Amazon-style PR-FAQ opener (press release portion only, not full FAQ).

GRADING CRITERIA:
- HEADLINE: is it a customer benefit, not a feature name?
- SUBTITLE: who is this for, specifically?
- SUMMARY: frames the problem in customer's voice, not company voice?
- Avoids jargon, buzzwords, and vague claims
- Would a journalist care about this? Would a customer understand it?

Return JSON: { "score": 0-10, "strengths": [...], "issues": [...], "rewrite_headline": "...", "interview_angle": "..." }. No prose outside JSON.`,
};

export async function POST(request: Request) {
  // Rate limit before any work or spend.
  const limit = checkRateLimit(clientKeyFromRequest(request, 'grade'), RATE_LIMIT);
  if (!limit.allowed) return rateLimitedResponse(limit);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY not set. Add it to .env.local to enable drill grading.' },
      { status: 500 },
    );
  }

  let body: GradeRequest;
  try {
    body = (await request.json()) as GradeRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rubric = RUBRICS[body.drill];
  if (!rubric) return Response.json({ error: 'Unknown drill' }, { status: 400 });

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: rubric,
      messages: [
        {
          role: 'user',
          content: `INPUT TO GRADE:\n\n${body.input}${
            body.context ? `\n\nCONTEXT:\n${JSON.stringify(body.context, null, 2)}` : ''
          }`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Extract JSON (Claude sometimes wraps in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ raw: text, parsed: null });
    }
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return Response.json({ parsed, raw: text });
    } catch {
      return Response.json({ raw: text, parsed: null });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json({ error: `Grading failed: ${msg}` }, { status: 500 });
  }
}
