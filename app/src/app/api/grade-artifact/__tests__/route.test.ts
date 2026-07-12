import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Slice D follow-up 2 (docs/PHASE1.md): once `PRAXIS_AUTH_MODE=required`
 * resolves a signed-in user, the route must call `reconcileBudgetOnLapse`
 * before it reaches the budget gate — and a reconciliation failure must
 * degrade soft (console.warn + continue) rather than fail the request, since
 * the stored budget tier still gates spend either way.
 *
 * The grading core (`gradeArtifact`) is mocked so this file never depends on
 * the real Anthropic response shape; `@/lib/budget` is mocked so no real
 * Supabase RPC call happens for the reserve/settle step.
 */

process.env.PRAXIS_AUTH_MODE = 'required';
process.env.ANTHROPIC_API_KEY = 'test-key-not-used-network-is-mocked';
process.env.PRAXIS_GLOBAL_LLM_CALLS_PER_DAY = '1000';

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

/** The grading core mocked; `buildUserContent` and the constants stay real. */
const gradeArtifactSpy = vi.fn(async () => ({
  verdict: {
    criteria: [],
    strengths: [],
    gaps: [],
    overall: 'fine',
    overallScore: 80,
    passed: true,
  },
  raw: '{}',
  usage: { inputTokens: 10, outputTokens: 10 },
}));
vi.mock('@/lib/artifactGrader', async () => {
  const actual = await vi.importActual<typeof import('@/lib/artifactGrader')>('@/lib/artifactGrader');
  return { ...actual, gradeArtifact: (...args: Parameters<typeof gradeArtifactSpy>) => gradeArtifactSpy(...args) };
});

import { POST } from '../route';
import { _resetRateLimitState } from '@/lib/rateLimit';

function gradeRequest(): Request {
  return new Request('http://localhost/api/grade-artifact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      skillId: 'skill-1',
      artifactTitle: 'One-page PRD',
      brief: 'Write a PRD.',
      rubric: [{ id: 'clarity', label: 'Clarity', descriptor: 'Is it clear?' }],
      submission: 'My PRD submission.',
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
  gradeArtifactSpy.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('grade-artifact route: entitlement reconciliation', () => {
  it('calls reconcileBudgetOnLapse with the signed-in user id right after identity resolves', async () => {
    const res = await POST(gradeRequest());
    expect(res.status).toBe(200);
    expect(reconcileSpy).toHaveBeenCalledWith('user-1');
    expect(reconcileSpy).toHaveBeenCalledTimes(1);
  });

  it('still grades normally when the entitlement is lapsed (budget tier alone gates spend)', async () => {
    reconcileSpy.mockResolvedValueOnce({ entitled: false });
    const res = await POST(gradeRequest());
    expect(res.status).toBe(200);
    expect(gradeArtifactSpy).toHaveBeenCalledTimes(1);
  });

  it('degrades soft and still serves the request when reconciliation rejects', async () => {
    reconcileSpy.mockRejectedValueOnce(new Error('supabase down'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const res = await POST(gradeRequest());

    expect(res.status).toBe(200);
    const body = (await res.json()) as { verdict?: unknown };
    expect(body.verdict).toBeTruthy();
    expect(gradeArtifactSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('does not call reconcileBudgetOnLapse when there is no signed-in user (401 path)', async () => {
    mockUser = null;
    const res = await POST(gradeRequest());
    expect(res.status).toBe(401);
    expect(reconcileSpy).not.toHaveBeenCalled();
  });
});
