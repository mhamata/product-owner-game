import { describe, it, expect } from 'vitest';
import { planSync } from '../planner';
import { encodeEnvelope, type SyncEnvelope } from '../envelope';

/**
 * The planner is the heart of the two-way sync: it decides, per key, whether to
 * pull, push, or remove-local. It is pure over two Maps, so every branch — the
 * first-sign-in migration, both single-sided cases, the server-wins conflict,
 * and both tombstone cases — is pinned here rather than through the executor.
 */

/** A non-tombstone envelope wrapping a value. */
function val(value: unknown): SyncEnvelope {
  return encodeEnvelope(JSON.stringify(value));
}

/** A tombstone envelope (a cleared key). */
function tombstone(): SyncEnvelope {
  return encodeEnvelope(null);
}

describe('planSync — first sign-in migration', () => {
  it('pushes every local key when the server has no rows at all', () => {
    const local = new Map([
      ['praxis-learn-v2', '{"a":1}'],
      ['praxis-review-v1', '{"b":2}'],
    ]);
    const plan = planSync(local, new Map());
    expect(plan.actions).toEqual([
      { key: 'praxis-learn-v2', op: 'push' },
      { key: 'praxis-review-v1', op: 'push' },
    ]);
  });

  it('plans nothing when both sides are empty', () => {
    expect(planSync(new Map(), new Map()).actions).toEqual([]);
  });
});

describe('planSync — single-sided keys', () => {
  it('pulls a key that exists only on the server', () => {
    const server = new Map([['praxis-learn-v2', val({ a: 1 })]]);
    // A non-empty server with a second, unrelated key keeps us off the migration
    // path, so the server-only key is a genuine pull.
    server.set('praxis-review-v1', val({ b: 2 }));
    const local = new Map([['praxis-review-v1', '{"b":2}']]);
    const plan = planSync(local, server);
    expect(plan.actions).toContainEqual({ key: 'praxis-learn-v2', op: 'pull' });
  });

  it('pushes a key that exists only locally when the server is non-empty', () => {
    const server = new Map([['praxis-review-v1', val({ b: 2 })]]);
    const local = new Map([
      ['praxis-review-v1', '{"b":2}'],
      ['praxis-learn-v2', '{"a":1}'],
    ]);
    const plan = planSync(local, server);
    expect(plan.actions).toContainEqual({ key: 'praxis-learn-v2', op: 'push' });
  });
});

describe('planSync — server wins on conflict', () => {
  it('pulls when a non-tombstone key exists on both sides', () => {
    const server = new Map([['praxis-learn-v2', val({ a: 99 })]]);
    const local = new Map([['praxis-learn-v2', '{"a":1}']]);
    const plan = planSync(local, server);
    expect(plan.actions).toEqual([{ key: 'praxis-learn-v2', op: 'pull' }]);
  });
});

describe('planSync — tombstones', () => {
  it('removes the local key when the server holds a tombstone and the key is present', () => {
    const server = new Map([['praxis-learn-v2', tombstone()]]);
    const local = new Map([['praxis-learn-v2', '{"a":1}']]);
    const plan = planSync(local, server);
    expect(plan.actions).toEqual([{ key: 'praxis-learn-v2', op: 'remove-local' }]);
  });

  it('does nothing when the server tombstone matches an absent local key', () => {
    // A second server key keeps us off the migration path; the tombstoned key has
    // no local copy, so there is nothing to remove and nothing to pull.
    const server = new Map([
      ['praxis-learn-v2', tombstone()],
      ['praxis-review-v1', val({ b: 2 })],
    ]);
    const local = new Map([['praxis-review-v1', '{"b":2}']]);
    const plan = planSync(local, server);
    expect(plan.actions).not.toContainEqual({ key: 'praxis-learn-v2', op: 'remove-local' });
    expect(plan.actions.some((a) => a.key === 'praxis-learn-v2')).toBe(false);
  });
});
