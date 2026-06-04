import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These tests pin the two cost guarantees on the public roleplay endpoint that
 * cannot be proven by the pure helpers alone, because they live in the route's
 * use of SERVER-side state:
 *
 *  1. The turn cap is enforced from a SERVER-tracked reply count, so a crafted
 *     client that posts a fresh, short `messages` array every request cannot
 *     reset the count and loop the paid `reply` action without bound.
 *  2. The global usage ceiling short-circuits with a calm "at capacity" 200 and
 *     does NOT call the model once the process-wide budget is spent.
 *
 * The Anthropic SDK is mocked so no real model call (or spend) ever happens; we
 * assert on how many times the mocked `create` was invoked.
 */

// A high global ceiling for this file so it never interferes with the turn-cap
// test; the global-ceiling test drives the counter up programmatically instead.
process.env.PRAXIS_GLOBAL_LLM_CALLS_PER_DAY = '1000';
// A key must be present, or the route takes its graceful no-key path before the
// guards we are testing.
process.env.ANTHROPIC_API_KEY = 'test-key-not-used-network-is-mocked';

/** The canned in-character line the mocked model "returns" for a reply. */
const MOCK_REPLY_TEXT = 'In character reply.';

/** Spy we can assert call counts against; reset per test. */
const createSpy = vi.fn(async () => ({
  // These tests only exercise the `reply` action, whose path returns the model's
  // text verbatim, so a plain text block is what we want here.
  content: [{ type: 'text', text: MOCK_REPLY_TEXT }],
}));

vi.mock('@anthropic-ai/sdk', () => {
  // Mock the default export: `new Anthropic({apiKey}).messages.create(...)`. The
  // constructor takes options in real life; we ignore them here.
  class MockAnthropic {
    messages = { create: createSpy };
  }
  return { default: MockAnthropic };
});

// Imported after the env + mock are set up so the route binds to them.
import { POST } from '../route';
import {
  checkGlobalBudget,
  recordModelCall,
  _resetRateLimitState,
} from '@/lib/rateLimit';
import { MAX_LEARNER_TURNS, type RoleplayMessage } from '@/curriculum/roleplay/types';

const SESSION = 'turn-cap-session';
const SKILL = 'roleplay-defend-roadmap';

/** A minimal valid `reply` body with exactly one learner turn in its array. */
function freshReplyBody(messages: RoleplayMessage[]) {
  return {
    action: 'reply' as const,
    skillId: SKILL,
    persona: 'You are a skeptical VP.',
    characterName: 'VP of Product',
    messages,
  };
}

/** Build a POST Request that carries the same per-session header every time. */
function replyRequest(messages: RoleplayMessage[], session = SESSION): Request {
  return new Request('http://localhost/api/roleplay', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-praxis-session': session,
    },
    body: JSON.stringify(freshReplyBody(messages)),
  });
}

beforeEach(() => {
  _resetRateLimitState();
  createSpy.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('roleplay turn cap is server-authoritative (defeats a reset-array client)', () => {
  it('caps total paid replies for one session even when the client always sends a fresh 1-turn array', async () => {
    // The attack: each request resets the transcript to a single learner turn, so
    // the client-array pre-check ALWAYS reports "1 turn, allowed". Only the
    // server-tracked count can stop the loop.
    const oneTurnArray: RoleplayMessage[] = [
      { role: 'character', text: 'opening' },
      { role: 'learner', text: 'my pitch' },
    ];

    // The first MAX_LEARNER_TURNS calls are granted (and each hits the model).
    for (let i = 0; i < MAX_LEARNER_TURNS; i += 1) {
      const res = await POST(replyRequest(oneTurnArray));
      expect(res.status).toBe(200);
      const body = (await res.json()) as { reply?: string };
      expect(body.reply).toBe(MOCK_REPLY_TEXT);
    }
    expect(createSpy).toHaveBeenCalledTimes(MAX_LEARNER_TURNS);

    // The very next identical request is refused with 409, despite the array
    // still showing only one learner turn. This is the guarantee.
    const blocked = await POST(replyRequest(oneTurnArray));
    expect(blocked.status).toBe(409);
    const blockedBody = (await blocked.json()) as {
      turnLimitReached?: boolean;
      cap?: number;
    };
    expect(blockedBody.turnLimitReached).toBe(true);
    expect(blockedBody.cap).toBe(MAX_LEARNER_TURNS);

    // Crucially, the refused request did NOT spend another model call.
    expect(createSpy).toHaveBeenCalledTimes(MAX_LEARNER_TURNS);
  });

  it('gives a different session its own independent turn budget', async () => {
    const oneTurnArray: RoleplayMessage[] = [
      { role: 'character', text: 'opening' },
      { role: 'learner', text: 'my pitch' },
    ];
    // Exhaust session A.
    for (let i = 0; i < MAX_LEARNER_TURNS; i += 1) {
      await POST(replyRequest(oneTurnArray, 'session-A'));
    }
    expect((await POST(replyRequest(oneTurnArray, 'session-A'))).status).toBe(409);

    // A genuinely separate session is unaffected and can still reply.
    const other = await POST(replyRequest(oneTurnArray, 'session-B'));
    expect(other.status).toBe(200);
  });
});

describe('global ceiling returns a calm unavailable past the cap, with no model call', () => {
  it('answers 200 { unavailable, reason: "at capacity" } and does not call the model', async () => {
    // Drive the shared global counter up to its ceiling directly (faster and
    // independent of which route spent the calls).
    const { ceiling } = checkGlobalBudget();
    for (let i = 0; i < ceiling; i += 1) recordModelCall();
    expect(checkGlobalBudget().allowed).toBe(false);

    const validReply: RoleplayMessage[] = [
      { role: 'character', text: 'opening' },
      { role: 'learner', text: 'my pitch' },
    ];
    const res = await POST(replyRequest(validReply));

    // Calm, non-error shape the UI already handles.
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      unavailable?: boolean;
      reason?: string;
    };
    expect(body.unavailable).toBe(true);
    expect(body.reason).toBe('at capacity');

    // The hard guarantee: at capacity, the model is never called.
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('still serves replies normally while under the ceiling', async () => {
    // Sanity counterpart: with budget available, the same request hits the model.
    const validReply: RoleplayMessage[] = [
      { role: 'character', text: 'opening' },
      { role: 'learner', text: 'my pitch' },
    ];
    const res = await POST(replyRequest(validReply));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reply?: string };
    expect(body.reply).toBe(MOCK_REPLY_TEXT);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });
});
