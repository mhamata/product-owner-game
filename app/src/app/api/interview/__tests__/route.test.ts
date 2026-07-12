import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Slice D follow-up 2 (docs/PHASE1.md): once `PRAXIS_AUTH_MODE=required`
 * resolves a signed-in user, the route must call `reconcileBudgetOnLapse`
 * before it reaches the budget gate — and a reconciliation failure must
 * degrade soft (console.warn + continue) rather than fail the interview,
 * since the stored budget tier still gates spend either way.
 *
 * The Anthropic SDK is mocked (interview calls it directly, unlike
 * grade-artifact) so no real model call happens; `@/lib/budget` is mocked so
 * no real Supabase RPC call happens for the reserve/settle step.
 */

process.env.PRAXIS_AUTH_MODE = 'required';
process.env.ANTHROPIC_API_KEY = 'test-key-not-used-network-is-mocked';
process.env.PRAXIS_GLOBAL_LLM_CALLS_PER_DAY = '1000';

const createSpy = vi.fn(async () => ({
  content: [{ type: 'text', text: 'Tell me about a time you shipped under pressure.' }],
}));
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

/** Budget gate fully mocked: always allow, no real Supabase RPC. */
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

function replyRequest(): Request {
  return new Request('http://localhost/api/interview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'reply',
      caseId: 'ps-renter-maintenance',
      messages: [{ role: 'interviewer', text: 'Tell me about the case.' }],
    }),
  });
}

beforeEach(() => {
  _resetRateLimitState();
  mockUser = { id: 'user-1' };
  reconcileSpy.mockClear();
  reconcileSpy.mockResolvedValue({ entitled: true });
  reserveBudgetSpy.mockClear();
  settleBudgetSpy.mockClear();
  logUsageSpy.mockClear();
  createSpy.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('interview route: entitlement reconciliation', () => {
  it('calls reconcileBudgetOnLapse with the signed-in user id right after identity resolves', async () => {
    const res = await POST(replyRequest());
    expect(res.status).toBe(200);
    expect(reconcileSpy).toHaveBeenCalledWith('user-1');
    expect(reconcileSpy).toHaveBeenCalledTimes(1);
  });

  it('still runs the interview normally when the entitlement is lapsed (budget tier alone gates spend)', async () => {
    reconcileSpy.mockResolvedValueOnce({ entitled: false });
    const res = await POST(replyRequest());
    expect(res.status).toBe(200);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('degrades soft and still serves the request when reconciliation rejects', async () => {
    reconcileSpy.mockRejectedValueOnce(new Error('supabase down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const res = await POST(replyRequest());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { reply?: string };
    expect(body.reply).toBeTruthy();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('does not call reconcileBudgetOnLapse when there is no signed-in user (401 path)', async () => {
    mockUser = null;
    const res = await POST(replyRequest());
    expect(res.status).toBe(401);
    expect(reconcileSpy).not.toHaveBeenCalled();
  });
});
