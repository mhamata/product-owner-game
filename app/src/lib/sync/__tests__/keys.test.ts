import { describe, it, expect } from 'vitest';
import { isSyncedKey, EXACT_SYNC_KEYS, SYNC_KEY_PREFIXES } from '../keys';

/**
 * The allowlist is the trust boundary for what leaves the browser. These pin that
 * every exact store key matches, every prefix family matches on any id, and that
 * unrelated localStorage keys are never synced.
 */

describe('isSyncedKey — exact store keys', () => {
  it('matches each of the eight persisted Zustand keys', () => {
    for (const key of EXACT_SYNC_KEYS) {
      expect(isSyncedKey(key)).toBe(true);
    }
  });
});

describe('isSyncedKey — prefix families', () => {
  it('matches a concrete key under each raw-family prefix', () => {
    expect(isSyncedKey('praxis:artifact-v2:prd-artifact')).toBe(true);
    expect(isSyncedKey('praxis:interview:case-123')).toBe(true);
  });

  it('matches the bare prefix and any id after it', () => {
    for (const prefix of SYNC_KEY_PREFIXES) {
      expect(isSyncedKey(`${prefix}anything`)).toBe(true);
    }
  });
});

describe('isSyncedKey — everything else', () => {
  it('does not sync unrelated keys', () => {
    expect(isSyncedKey('some-other-key')).toBe(false);
    expect(isSyncedKey('praxis-unknown-v9')).toBe(false);
    expect(isSyncedKey('praxis:artifact-v1:old')).toBe(false); // wrong version prefix
    expect(isSyncedKey('')).toBe(false);
  });
});
