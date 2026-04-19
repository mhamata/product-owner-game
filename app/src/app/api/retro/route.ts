import Anthropic from '@anthropic-ai/sdk';
import type { GameState } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { getScenario } from '@/scenarios';

export const dynamic = 'force-dynamic';

interface RetroRequest {
  state: GameState;
  scenarioId: string;
  score: GameScore;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      'ANTHROPIC_API_KEY is not set. Add it to .env.local.',
      { status: 500 },
    );
  }

  let body: RetroRequest;
  try {
    body = (await request.json()) as RetroRequest;
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const scenario = getScenario(body.scenarioId);
  if (!scenario) return new Response('Unknown scenario', { status: 400 });

  const client = new Anthropic({ apiKey });

  const log = body.state.eventLog.map(
    (e) => `Iter ${e.iteration} · ${e.eventId} · chose ${e.optionId} → ${e.summary}`,
  );

  const methodsInvoked = body.state.methodTags.map(
    (t) => `Iter ${t.iteration} · ${t.context} · claimed method: ${t.methodId} (context: ${t.contextId})`,
  );

  const summary = {
    scenario: scenario.name,
    iterations: body.state.totalIterations,
    revenue: body.state.economy.revenue,
    targetRevenue: scenario.targetRevenue,
    techDebt: body.state.tech.techDebt,
    morale: body.state.team.morale,
    customers: Object.values(body.state.customers).map((c) => ({
      name: c.name,
      happiness: c.happiness,
      state: c.engagementState,
    })),
    stakeholders: Object.values(body.state.stakeholders).map((s) => ({
      name: s.name,
      trust: s.trust,
    })),
    decisions: log,
    methods_invoked: methodsInvoked,
    score: body.score,
  };

  const system = `You are a senior product manager conducting a post-game retrospective for a trainee PM rehearsing a Moomoo Senior PM interview (Brokerage Clearing & Settlement).

Generate a structured retrospective with:
1. HEADLINE — one sentence capturing this game's defining decision
2. STRENGTHS — 3 specific moments with iteration number + decision + outcome
3. GROWTH EDGES — 3 specific moments where a senior PM would have made a different call
4. ALTERNATE HISTORY — one specific "what if you had done X in iteration Y" replay
5. METHODS CLAIMED — if the player tagged methods via the in-game picker, cite them by name and evaluate whether the claim fits the decision (e.g., "You claimed RICE for commit iter 3; this fits because you were weighing multiple features — but a senior PM would have paired it with Cost of Delay given the CIRO deadline.")
6. TECHNIQUE UNLOCKED — one PM method the player demonstrated readiness for beyond what they claimed
7. INTERVIEW STORY — one STAR-formatted story from this game they could use in the Moomoo interview

Tone: constructive, specific, never shaming. Cite evidence from the decisions log. Under 700 words.`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      system,
      messages: [
        {
          role: 'user',
          content: `Game log JSON:\n\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n\n');

    return Response.json({ retro: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(`Retro generation failed: ${msg}`, { status: 500 });
  }
}
