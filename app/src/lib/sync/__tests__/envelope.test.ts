import { describe, it, expect } from 'vitest';
import {
  encodeEnvelope,
  decodeEnvelope,
  isTombstone,
  ENVELOPE_VERSION,
} from '../envelope';

/**
 * The envelope is the on-the-wire shape of a synced key. These pin the round-trip
 * (a localStorage string survives encode→decode), the tombstone semantics (a
 * cleared key encodes to and decodes as "gone"), and the defensive handling of a
 * malformed server row.
 */

describe('encodeEnvelope', () => {
  it('parses a JSON localStorage string into the envelope value', () => {
    const env = encodeEnvelope('{"a":1}');
    expect(env).toEqual({ v: ENVELOPE_VERSION, value: { a: 1 } });
  });

  it('encodes a missing key as a tombstone', () => {
    const env = encodeEnvelope(null);
    expect(env).toEqual({ v: ENVELOPE_VERSION, value: null });
    expect(isTombstone(env)).toBe(true);
  });

  it('keeps a non-JSON string as a raw value rather than losing it', () => {
    const env = encodeEnvelope('not json');
    expect(env.value).toBe('not json');
  });
});

describe('decodeEnvelope', () => {
  it('round-trips a value back to its localStorage string', () => {
    const raw = '{"a":1,"b":[2,3]}';
    const decoded = decodeEnvelope(encodeEnvelope(raw));
    expect(decoded).toBe(JSON.stringify(JSON.parse(raw)));
  });

  it('returns null for a tombstone (meaning: remove the local key)', () => {
    expect(decodeEnvelope(encodeEnvelope(null))).toBeNull();
  });

  it('returns null for a malformed server row rather than throwing', () => {
    expect(decodeEnvelope(undefined)).toBeNull();
    expect(decodeEnvelope(42)).toBeNull();
    expect(decodeEnvelope({})).toBeNull();
  });
});

describe('isTombstone', () => {
  it('is true only for an envelope whose value is explicitly null', () => {
    expect(isTombstone({ v: 1, value: null })).toBe(true);
    expect(isTombstone({ v: 1, value: { a: 1 } })).toBe(false);
    expect(isTombstone(null)).toBe(false);
    expect(isTombstone('nope')).toBe(false);
  });
});
