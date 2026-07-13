import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * `emitExerciseEvent` is called from deep inside lesson/review/artifact/
 * interview components, so its "never breaks the caller" behavior is
 * load-bearing. These drive the real module against stubbed
 * `@/lib/supabase/client` and `@/store/authStore` modules (the module
 * memoizes an in-memory queue + debounce timer, so each test resets modules
 * and re-imports, mirroring `authHeaders.test.ts`'s pattern).
 */

let insertMock: ReturnType<typeof vi.fn>;
let fromMock: ReturnType<typeof vi.fn>;
let clientResult: { from: typeof fromMock } | null;
let authState: { status: string; user: { id: string } | null };
/** When true, `browserClient()` throws synchronously instead of returning. */
let clientThrows = false;

vi.mock('@/lib/supabase/client', () => ({
  browserClient: () => {
    if (clientThrows) throw new Error('boom');
    return clientResult;
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: { getState: () => authState },
}));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  insertMock = vi.fn().mockResolvedValue({ error: null });
  fromMock = vi.fn(() => ({ insert: insertMock }));
  clientResult = { from: fromMock };
  clientThrows = false;
  authState = { status: 'signed-in', user: { id: 'user-1' } };
  // @ts-expect-error — minimal window stub so the SSR check passes.
  globalThis.window = {};
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  // @ts-expect-error — clean up the jsdom-free window stub between tests.
  delete globalThis.window;
});

describe('emitExerciseEvent — degrade behavior', () => {
  it('is a silent no-op on the server (no window)', async () => {
    // @ts-expect-error — simulate SSR.
    delete globalThis.window;
    const { emitExerciseEvent } = await import('../exerciseEvents');
    expect(() => emitExerciseEvent({ kind: 'drill', score: 1 })).not.toThrow();
    await vi.advanceTimersByTimeAsync(5000);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('is a silent no-op when unconfigured (browserClient null, signed out)', async () => {
    clientResult = null;
    authState = { status: 'unconfigured', user: null };
    const { emitExerciseEvent } = await import('../exerciseEvents');
    emitExerciseEvent({ kind: 'drill', score: 1 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('is a silent no-op when signed out (configured but no session)', async () => {
    authState = { status: 'signed-out', user: null };
    const { emitExerciseEvent } = await import('../exerciseEvents');
    emitExerciseEvent({ kind: 'judgment_card', score: 0 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('never throws when the insert rejects', async () => {
    insertMock.mockRejectedValue(new Error('network down'));
    const { emitExerciseEvent } = await import('../exerciseEvents');
    expect(() => emitExerciseEvent({ kind: 'drill', score: 1 })).not.toThrow();
    await expect(vi.advanceTimersByTimeAsync(5000)).resolves.not.toThrow();
  });

  it('never throws — and never leaves an unhandled rejection — when browserClient() throws at flush time', async () => {
    clientThrows = true;
    const { emitExerciseEvent } = await import('../exerciseEvents');
    expect(() => emitExerciseEvent({ kind: 'drill', score: 1 })).not.toThrow();
    // The debounced flush runs detached inside a setTimeout; this asserts it
    // never rejects unhandled even though browserClient() throws synchronously.
    await expect(vi.advanceTimersByTimeAsync(5000)).resolves.not.toThrow();
  });
});

describe('emitExerciseEvent — batching', () => {
  it('does not insert immediately; waits for the debounce window', async () => {
    const { emitExerciseEvent } = await import('../exerciseEvents');
    emitExerciseEvent({ kind: 'drill', skillId: 'rice', score: 1 });
    expect(fromMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1999);
    expect(fromMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2);
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it('collapses a burst of events into a single insert call carrying every row', async () => {
    const { emitExerciseEvent } = await import('../exerciseEvents');
    emitExerciseEvent({ kind: 'drill', skillId: 'kano-moscow', score: 1 });
    await vi.advanceTimersByTimeAsync(500);
    emitExerciseEvent({ kind: 'drill', skillId: 'estimation', score: 0 });
    await vi.advanceTimersByTimeAsync(500);
    emitExerciseEvent({ kind: 'drill', skillId: 'problem-framing', score: 1 });

    // Each call re-armed the debounce, so nothing has flushed yet.
    await vi.advanceTimersByTimeAsync(1999);
    expect(fromMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
    const rows = insertMock.mock.calls[0][0] as Array<{ skill_id: string | null }>;
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.skill_id)).toEqual(['kano-moscow', 'estimation', 'problem-framing']);
  });

  it('stamps every row with the signed-in user_id at flush time', async () => {
    authState = { status: 'signed-in', user: { id: 'user-42' } };
    const { emitExerciseEvent } = await import('../exerciseEvents');
    emitExerciseEvent({ kind: 'drill', skillId: 'rice', score: 1 });
    await vi.advanceTimersByTimeAsync(2000);
    const rows = insertMock.mock.calls[0][0] as Array<{ user_id: string }>;
    expect(rows[0].user_id).toBe('user-42');
  });

  it('starts a fresh queue after each flush (no duplicate re-send)', async () => {
    const { emitExerciseEvent } = await import('../exerciseEvents');
    emitExerciseEvent({ kind: 'drill', skillId: 'rice', score: 1 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(insertMock).toHaveBeenCalledTimes(1);

    emitExerciseEvent({ kind: 'drill', skillId: 'cost-of-delay', score: 1 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(insertMock).toHaveBeenCalledTimes(2);
    const secondBatch = insertMock.mock.calls[1][0] as Array<{ skill_id: string | null }>;
    expect(secondBatch).toHaveLength(1);
    expect(secondBatch[0].skill_id).toBe('cost-of-delay');
  });
});

describe('emitExerciseEvent — payload-privacy shape per instrumented kind', () => {
  async function flushOne(input: Parameters<typeof import('../exerciseEvents').emitExerciseEvent>[0]) {
    const { emitExerciseEvent } = await import('../exerciseEvents');
    emitExerciseEvent(input);
    await vi.advanceTimersByTimeAsync(2000);
    return insertMock.mock.calls[0][0][0] as {
      kind: string;
      competency: string | null;
      skill_id: string | null;
      score: number | null;
      payload: Record<string, unknown>;
    };
  }

  it('drill (LessonFrame-style completion): skillId + competency, score normalized 0/1, small tally payload', async () => {
    const row = await flushOne({
      kind: 'drill',
      skillId: 'kano-moscow',
      competency: 'feature-spec',
      score: 0.75,
      payload: { skillId: 'kano-moscow', correct: false, tally: { correct: 3, total: 4 } },
    });
    expect(row.kind).toBe('drill');
    expect(row.skill_id).toBe('kano-moscow');
    expect(row.competency).toBe('feature-spec');
    expect(row.score).toBeGreaterThanOrEqual(0);
    expect(row.score).toBeLessThanOrEqual(1);
    expect(row.payload).toEqual({ skillId: 'kano-moscow', correct: false, tally: { correct: 3, total: 4 } });
    // Privacy: no free-text field ever rides along.
    expect(JSON.stringify(row.payload)).not.toMatch(/situation|submission|transcript|answer/i);
  });

  it('judgment_card (review-deck answer): score 0/1, payload marks scenario + resulting box', async () => {
    const row = await flushOne({
      kind: 'judgment_card',
      competency: 'prioritization',
      score: 1,
      payload: { scenarioId: 'prioritization-loud-customer', box: 2, resurfaced: false },
    });
    expect(row.kind).toBe('judgment_card');
    expect(row.skill_id).toBeNull(); // judgment scenarios are not skill-scoped
    expect([0, 1]).toContain(row.score);
    expect(Object.keys(row.payload).sort()).toEqual(['box', 'resurfaced', 'scenarioId'].sort());
  });

  it('artifact (v2 grade received): score = overallScore/100, payload {skillId, version, passed} only', async () => {
    const overallScore = 82;
    const row = await flushOne({
      kind: 'artifact',
      skillId: 'prd-artifact',
      competency: 'feature-spec',
      score: overallScore / 100,
      payload: { skillId: 'prd-artifact', version: 2, passed: true },
    });
    expect(row.kind).toBe('artifact');
    expect(row.score).toBeCloseTo(0.82);
    expect(Object.keys(row.payload).sort()).toEqual(['passed', 'skillId', 'version'].sort());
    // Privacy: never the graded submission text.
    expect(row.payload).not.toHaveProperty('submission');
    expect(row.payload).not.toHaveProperty('brief');
  });

  it('interview (scorecard received): score = overallScore/100, payload {caseId, recommendation} only, no skill/competency', async () => {
    const overallScore = 65;
    const row = await flushOne({
      kind: 'interview',
      score: overallScore / 100,
      payload: { caseId: 'ps-renter-maintenance', recommendation: 'lean-hire' },
    });
    expect(row.kind).toBe('interview');
    expect(row.skill_id).toBeNull();
    expect(row.competency).toBeNull();
    expect(row.score).toBeCloseTo(0.65);
    expect(Object.keys(row.payload).sort()).toEqual(['caseId', 'recommendation'].sort());
    expect(row.payload).not.toHaveProperty('transcript');
  });

  it('omits score entirely as null when the caller does not supply one', async () => {
    const row = await flushOne({ kind: 'drill', skillId: 'rice' });
    expect(row.score).toBeNull();
  });
});
