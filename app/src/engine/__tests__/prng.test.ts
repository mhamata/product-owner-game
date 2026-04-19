import { describe, it, expect } from 'vitest';
import { createPRNG, iterationPRNG } from '../prng';

describe('prng', () => {
  it('is deterministic for same seed', () => {
    const a = createPRNG('abc');
    const b = createPRNG('abc');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('differs across seeds', () => {
    const a = createPRNG('abc');
    const b = createPRNG('def');
    expect(a()).not.toBe(b());
  });

  it('output in [0,1)', () => {
    const r = createPRNG('x');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('iterationPRNG differs per iteration but stable per seed', () => {
    const a = iterationPRNG('s', 1);
    const b = iterationPRNG('s', 1);
    const c = iterationPRNG('s', 2);
    expect(a()).toBe(b());
    expect(a()).not.toBe(c());
  });
});
