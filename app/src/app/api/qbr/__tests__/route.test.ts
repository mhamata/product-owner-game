import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Guardrail-stack coverage for `/api/qbr`, mirroring interview-ammo's own test
 * file byte-for-byte in structure: entitlement reconciliation runs right
 * after identity resolves and degrades soft on failure; the no-key, at-
 * capacity, and allowance-denied paths all return a calm 200 `unavailable`
 * WITHOUT calling the model; a model failure settles the reservation back to
 * zero. This file additionally pins the server-side normalization contract:
 * an invented (not-in-roster) speaker id is dropped, the turn list is capped
 * at 12, and a turn with empty text is dropped.
 *
 * The Anthropic SDK is mocked so no real model call happens; `@/lib/budget` is
 * mocked so no real Supabase RPC call happens for the reserve/settle step.
 */

process.env.PRAXIS_AUTH_MODE = 'required';
process.env.ANTHROPIC_API_KEY = 'test-key-not-used-network-is-mocked';
process.env.PRAXIS_GLOBAL_LLM_CALLS_PER_DAY = '1000';

function textResponse(payload: unknown, usage = { input_tokens: 10, output_tokens: 10 }) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    usage,
  };
}

const createSpy = vi.fn(async () =>
  textResponse({
    turns: [
      { speakerId: 'person-exec', text: 'Confidence held, but barely.' },
      { speakerId: 'person-eng-lead', text: 'We paid down debt instead of chasing the sales ask.' },
      { speakerId: 'person-sales-cs', text: 'Churn stayed flat, which the board should take as a win.' },
    ],
    closingLine: 'The committee reads this as a season that held the line.',
  }),
);
vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: createSpy };
  }
  return { default: MockAnthropic };
});

/** The user the mocked `getUserFromRequest` resolves; null exercises the 401 path. */
let mockUser: { id: string } | null = { id: 'user-1' };
vi.mock('@/lib/supabase/server', () => ({
  authMode: () => 'required' as const,
  getUserFromRequest: async () => mockUser,
}));

/** `reconcileBudgetOnLapse` spy. Tests flip between resolving and rejecting. */
const reconcileSpy = vi.fn<(userId: string) => Promise<{ entitled: boolean }>>(async () => ({
  entitled: true,
}));
vi.mock('@/lib/entitlements', () => ({
  reconcileBudgetOnLapse: (userId: string) => reconcileSpy(userId),
}));

/** Budget gate fully mocked: `reserveBudgetSpy` defaults to allow, no real Supabase RPC. */
const reserveBudgetSpy = vi.fn<(userId: string, cents: number) => Promise<boolean>>(async () => true);
const settleBudgetSpy = vi.fn<(userId: string, reserved: number, actual: number) => Promise<void>>(
  async () => undefined,
);
const logUsageSpy = vi.fn<(entry: unknown) => Promise<void>>(async () => undefined);
vi.mock('@/lib/budget', () => ({
  estimateCallCents: () => 1,
  actualCallCents: () => 1,
  reserveBudget: (userId: string, cents: number) => reserveBudgetSpy(userId, cents),
  settleBudget: (userId: string, reserved: number, actual: number) => settleBudgetSpy(userId, reserved, actual),
  logUsage: (entry: unknown) => logUsageSpy(entry),
}));

import { POST } from '../route';
import { _resetRateLimitState } from '@/lib/rateLimit';

const ROSTER = [
  { id: 'person-exec', name: 'Diane Okafor', roleLabel: 'CEO / Board Rep' },
  { id: 'person-eng-lead', name: 'Sanjay Lindqvist', roleLabel: 'Engineering Lead' },
  { id: 'person-sales-cs', name: 'Carlos Petrova', roleLabel: 'Sales & Customer Success' },
];

function baseFact(overrides: Record<string, unknown> = {}) {
  return {
    sprint: 1,
    sprintGoal: 'Reduce churn',
    backlogTitles: ['Onboarding v2'],
    releaseCard: null,
    eventResponses: [{ event: 'Sales wants a custom integration', choice: 'Push back' }],
    rationale: 'Retention compounds more than one-off asks.',
    outcome: { summary: '1 item shipped' },
    ...overrides,
  };
}

function qbrRequest(overrides: Record<string, unknown> = {}): Request {
  return new Request('http://localhost/api/qbr', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      runId: 'scenario01::seed-1',
      scenarioTitle: 'Canadian Launch',
      roster: ROSTER,
      season: {
        confidence: 62,
        expectations: [
          { id: 'revenue', label: 'Hit $50000 in revenue this season', status: 'on-track' },
          { id: 'customers', label: 'Keep customers happy and engaged', status: 'at-risk' },
          { id: 'product', label: 'Keep tech debt under control', status: 'on-track' },
        ],
        scoreDims: {
          valueDelivered: 70,
          customerLoyalty: 60,
          teamHealth: 80,
          stakeholderTrust: 65,
          productIntegrity: 75,
          total: 70,
        },
        sprintFacts: [baseFact()],
      },
      ...overrides,
    }),
  });
}

beforeEach(() => {
  _resetRateLimitState();
  mockUser = { id: 'user-1' };
  reconcileSpy.mockClear();
  reconcileSpy.mockResolvedValue({ entitled: true });
  reserveBudgetSpy.mockClear();
  reserveBudgetSpy.mockResolvedValue(true);
  settleBudgetSpy.mockClear();
  logUsageSpy.mockClear();
  createSpy.mockClear();
  process.env.ANTHROPIC_API_KEY = 'test-key-not-used-network-is-mocked';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('qbr route: request validation', () => {
  it('rejects an empty sprintFacts array with 400', async () => {
    const res = await POST(qbrRequest({ season: { confidence: 62, expectations: [], scoreDims: {}, sprintFacts: [] } }));
    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects more than 20 sprint facts with 400', async () => {
    const many = Array.from({ length: 21 }, (_, i) => baseFact({ sprint: i + 1 }));
    const res = await POST(
      qbrRequest({
        season: { confidence: 62, expectations: [], scoreDims: {}, sprintFacts: many },
      }),
    );
    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects a missing runId with 400', async () => {
    const res = await POST(qbrRequest({ runId: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects an empty roster with 400', async () => {
    const res = await POST(qbrRequest({ roster: [] }));
    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON with 400', async () => {
    const req = new Request('http://localhost/api/qbr', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('qbr route: entitlement reconciliation + identity', () => {
  it('calls reconcileBudgetOnLapse with the signed-in user id right after identity resolves', async () => {
    const res = await POST(qbrRequest());
    expect(res.status).toBe(200);
    expect(reconcileSpy).toHaveBeenCalledWith('user-1');
    expect(reconcileSpy).toHaveBeenCalledTimes(1);
  });

  it('still convenes normally when the entitlement is lapsed (budget tier alone gates spend)', async () => {
    reconcileSpy.mockResolvedValueOnce({ entitled: false });
    const res = await POST(qbrRequest());
    expect(res.status).toBe(200);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('degrades soft and still serves the request when reconciliation rejects', async () => {
    reconcileSpy.mockRejectedValueOnce(new Error('supabase down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const res = await POST(qbrRequest());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { meeting?: unknown };
    expect(body.meeting).toBeTruthy();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns 401 when there is no signed-in user, and never reserves budget', async () => {
    mockUser = null;
    const res = await POST(qbrRequest());
    expect(res.status).toBe(401);
    expect(reconcileSpy).not.toHaveBeenCalled();
    expect(reserveBudgetSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe('qbr route: graceful degradation', () => {
  it('returns a calm 200 unavailable when ANTHROPIC_API_KEY is unset, without calling the model', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await POST(qbrRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { unavailable?: boolean };
    expect(body.unavailable).toBe(true);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('returns the allowance message when reserveBudget denies, without calling the model', async () => {
    reserveBudgetSpy.mockResolvedValueOnce(false);
    const res = await POST(qbrRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { unavailable?: boolean; reason?: string };
    expect(body.unavailable).toBe(true);
    expect(body.reason).toBe('allowance');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('settles the reservation to zero when the model call fails', async () => {
    createSpy.mockRejectedValueOnce(new Error('network down'));
    const res = await POST(qbrRequest());
    expect(res.status).toBe(500);
    expect(settleBudgetSpy).toHaveBeenCalledWith('user-1', 1, 0);
  });

  it('returns a calm 200 unavailable (not raw provider JSON) when the key is rejected with 401, after settling to zero', async () => {
    createSpy.mockRejectedValueOnce(Object.assign(new Error('invalid x-api-key'), { status: 401 }));
    const res = await POST(qbrRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { unavailable?: boolean; reason?: string; error?: string };
    expect(body.unavailable).toBe(true);
    expect(body.reason).toBe('misconfigured');
    expect(body.error).toBeUndefined();
    expect(settleBudgetSpy).toHaveBeenCalledWith('user-1', 1, 0);
  });
});

describe('qbr route: normalization', () => {
  it('drops a turn whose speakerId is not in the submitted roster (invented 4th speaker)', async () => {
    createSpy.mockResolvedValueOnce(
      textResponse({
        turns: [
          { speakerId: 'person-exec', text: 'Real roster member.' },
          { speakerId: 'person-cfo-ghost', text: 'Invented speaker not in the roster.' },
        ],
        closingLine: 'Verdict line.',
      }),
    );
    const res = await POST(qbrRequest());
    const body = (await res.json()) as { meeting: { turns: { speakerId: string }[] } };
    expect(body.meeting.turns).toHaveLength(1);
    expect(body.meeting.turns[0].speakerId).toBe('person-exec');
  });

  it('caps the returned turn list at 12', async () => {
    const turns = Array.from({ length: 20 }, (_, i) => ({
      speakerId: i % 2 === 0 ? 'person-exec' : 'person-eng-lead',
      text: `Turn ${i}`,
    }));
    createSpy.mockResolvedValueOnce(textResponse({ turns, closingLine: 'Verdict.' }));
    const res = await POST(qbrRequest());
    const body = (await res.json()) as { meeting: { turns: unknown[] } };
    expect(body.meeting.turns).toHaveLength(12);
  });

  it('drops a turn with empty text, keeping the rest', async () => {
    createSpy.mockResolvedValueOnce(
      textResponse({
        turns: [
          { speakerId: 'person-exec', text: 'Has real content.' },
          { speakerId: 'person-eng-lead', text: '' },
        ],
        closingLine: 'Verdict.',
      }),
    );
    const res = await POST(qbrRequest());
    const body = (await res.json()) as { meeting: { turns: { text: string }[] } };
    expect(body.meeting.turns).toHaveLength(1);
    expect(body.meeting.turns[0].text).toBe('Has real content.');
  });

  it('returns meeting: null (still HTTP 200) when every turn has an invalid speaker', async () => {
    createSpy.mockResolvedValueOnce(
      textResponse({
        turns: [{ speakerId: 'person-ghost', text: 'Not in the roster.' }],
        closingLine: 'Verdict.',
      }),
    );
    const res = await POST(qbrRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { meeting: unknown };
    expect(body.meeting).toBeNull();
  });

  it('returns meeting: null (still HTTP 200) on unparseable JSON', async () => {
    createSpy.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json at all' }],
      usage: { input_tokens: 10, output_tokens: 10 },
    });
    const res = await POST(qbrRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { meeting: unknown; raw: string };
    expect(body.meeting).toBeNull();
    expect(body.raw).toBe('not json at all');
  });

  it('clamps the roster to at most 5 entries (defensive bound)', async () => {
    const bigRoster = Array.from({ length: 8 }, (_, i) => ({
      id: `person-${i}`,
      name: `Person ${i}`,
      roleLabel: 'Team',
    }));
    createSpy.mockResolvedValueOnce(
      textResponse({
        turns: [{ speakerId: 'person-5', text: 'Should be dropped — beyond the 5-person cap.' }],
        closingLine: 'Verdict.',
      }),
    );
    const res = await POST(qbrRequest({ roster: bigRoster }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { meeting: { turns: unknown[] } | null };
    // person-5 is the 6th entry (index 5), beyond MAX_ROSTER (5) so it never
    // becomes a valid speaker id — the turn attributed to it is dropped.
    expect(body.meeting).toBeNull();
  });
});
