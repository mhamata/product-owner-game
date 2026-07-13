import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Guardrail-stack coverage for `/api/interview-ammo`, mirroring the interview
 * and grade-artifact route test files: entitlement reconciliation runs right
 * after identity resolves and degrades soft on failure; the no-key, at-
 * capacity, and allowance-denied paths all return a calm 200 `unavailable`
 * WITHOUT calling the model; a model failure settles the reservation back to
 * zero. This file additionally pins the server-side normalization contract
 * (§2.4's "no invented facts" rule): an invented sprint number is dropped, the
 * story list is capped at 3, and a story missing its result is dropped.
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
    stories: [
      {
        title: 'Chose retention over a one-off sales ask',
        situation: 'Sales asked for a custom integration mid-sprint.',
        task: 'Decide whether to chase the deal or protect the roadmap.',
        action: 'Pushed back and explained the retention bet already in flight.',
        result: 'Shipped the retention work; churn held to plan.',
        sprints: [1],
      },
    ],
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

function baseEntry(overrides: Record<string, unknown> = {}) {
  return {
    runId: 'scenario01::seed-1',
    scenarioId: 'scenario01',
    industry: 'saas',
    sprint: 1,
    committedAt: '2026-07-12T00:00:00.000Z',
    sprintGoal: 'Reduce churn',
    backlogTitles: ['Onboarding v2'],
    releaseCard: null,
    eventResponses: [{ event: 'Sales wants a custom integration', choice: 'Push back' }],
    rationale: 'Retention compounds more than one-off asks.',
    outcome: { summary: '1 item shipped' },
    ...overrides,
  };
}

function ammoRequest(overrides: Record<string, unknown> = {}): Request {
  return new Request('http://localhost/api/interview-ammo', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      runId: 'scenario01::seed-1',
      scenarioTitle: 'Canadian Launch',
      entries: [baseEntry()],
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

describe('interview-ammo route: request validation', () => {
  it('rejects an empty entries array with 400', async () => {
    const res = await POST(ammoRequest({ entries: [] }));
    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects more than 20 entries with 400', async () => {
    const many = Array.from({ length: 21 }, (_, i) => baseEntry({ sprint: i + 1 }));
    const res = await POST(ammoRequest({ entries: many }));
    expect(res.status).toBe(400);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects a missing runId with 400', async () => {
    const res = await POST(ammoRequest({ runId: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid JSON with 400', async () => {
    const req = new Request('http://localhost/api/interview-ammo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('interview-ammo route: entitlement reconciliation + identity', () => {
  it('calls reconcileBudgetOnLapse with the signed-in user id right after identity resolves', async () => {
    const res = await POST(ammoRequest());
    expect(res.status).toBe(200);
    expect(reconcileSpy).toHaveBeenCalledWith('user-1');
    expect(reconcileSpy).toHaveBeenCalledTimes(1);
  });

  it('still drafts normally when the entitlement is lapsed (budget tier alone gates spend)', async () => {
    reconcileSpy.mockResolvedValueOnce({ entitled: false });
    const res = await POST(ammoRequest());
    expect(res.status).toBe(200);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('degrades soft and still serves the request when reconciliation rejects', async () => {
    reconcileSpy.mockRejectedValueOnce(new Error('supabase down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const res = await POST(ammoRequest());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { stories?: unknown };
    expect(body.stories).toBeTruthy();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns 401 when there is no signed-in user, and never reserves budget', async () => {
    mockUser = null;
    const res = await POST(ammoRequest());
    expect(res.status).toBe(401);
    expect(reconcileSpy).not.toHaveBeenCalled();
    expect(reserveBudgetSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe('interview-ammo route: graceful degradation', () => {
  it('returns a calm 200 unavailable when ANTHROPIC_API_KEY is unset, without calling the model', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await POST(ammoRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { unavailable?: boolean };
    expect(body.unavailable).toBe(true);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('returns the allowance message when reserveBudget denies, without calling the model', async () => {
    reserveBudgetSpy.mockResolvedValueOnce(false);
    const res = await POST(ammoRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { unavailable?: boolean; reason?: string };
    expect(body.unavailable).toBe(true);
    expect(body.reason).toBe('allowance');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('settles the reservation to zero when the model call fails', async () => {
    createSpy.mockRejectedValueOnce(new Error('network down'));
    const res = await POST(ammoRequest());
    expect(res.status).toBe(500);
    expect(settleBudgetSpy).toHaveBeenCalledWith('user-1', 1, 0);
  });
});

describe('interview-ammo route: normalization', () => {
  it('drops sprint numbers not present in the submitted entries (invented sprint 99)', async () => {
    createSpy.mockResolvedValueOnce(
      textResponse({
        stories: [
          {
            title: 'T',
            situation: 'S',
            task: 'Ta',
            action: 'A',
            result: 'R',
            sprints: [1, 99],
          },
        ],
      }),
    );
    const res = await POST(ammoRequest());
    const body = (await res.json()) as { stories: { sprints: number[] }[] };
    expect(body.stories[0].sprints).toEqual([1]);
  });

  it('caps the returned story list at 3', async () => {
    const stories = Array.from({ length: 5 }, (_, i) => ({
      title: `Story ${i}`,
      situation: 'S',
      task: 'Ta',
      action: 'A',
      result: 'R',
      sprints: [1],
    }));
    createSpy.mockResolvedValueOnce(textResponse({ stories }));
    const res = await POST(ammoRequest());
    const body = (await res.json()) as { stories: unknown[] };
    expect(body.stories).toHaveLength(3);
  });

  it('drops a story with an empty result, keeping the rest', async () => {
    createSpy.mockResolvedValueOnce(
      textResponse({
        stories: [
          { title: 'Good', situation: 'S', task: 'Ta', action: 'A', result: 'R', sprints: [1] },
          { title: 'Bad', situation: 'S', task: 'Ta', action: 'A', result: '', sprints: [1] },
        ],
      }),
    );
    const res = await POST(ammoRequest());
    const body = (await res.json()) as { stories: { title: string }[] };
    expect(body.stories).toHaveLength(1);
    expect(body.stories[0].title).toBe('Good');
  });

  it('drops a story with an empty action, keeping the rest', async () => {
    createSpy.mockResolvedValueOnce(
      textResponse({
        stories: [
          { title: 'Good', situation: 'S', task: 'Ta', action: 'A', result: 'R', sprints: [1] },
          { title: 'Bad', situation: 'S', task: 'Ta', action: '', result: 'R', sprints: [1] },
        ],
      }),
    );
    const res = await POST(ammoRequest());
    const body = (await res.json()) as { stories: { title: string }[] };
    expect(body.stories).toHaveLength(1);
    expect(body.stories[0].title).toBe('Good');
  });

  it('returns stories: null (still HTTP 200) on unparseable JSON', async () => {
    createSpy.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json at all' }],
      usage: { input_tokens: 10, output_tokens: 10 },
    });
    const res = await POST(ammoRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { stories: unknown; raw: string };
    expect(body.stories).toBeNull();
    expect(body.raw).toBe('not json at all');
  });
});
