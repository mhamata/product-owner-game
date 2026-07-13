import { describe, it, expect } from 'vitest';
import {
  strengthOf,
  isRusty,
  isMasteredRecord,
  effectivePracticedAt,
  averageCompetencyDecay,
  daysSince,
  DECAY_GRACE_DAYS,
  DECAY_SPAN_DAYS,
  DECAY_FULL_STRENGTH,
  DECAY_FLOOR_STRENGTH,
  RUSTY_THRESHOLD,
  type DecayRecord,
} from '../masteryDecay';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 6, 12); // 2026-07-12, matches the session's "today"

function daysAgo(n: number): number {
  return NOW - n * DAY;
}

describe('isMasteredRecord', () => {
  it('is false for an unmastered skill', () => {
    expect(isMasteredRecord({ mastery: 0.6 })).toBe(false);
  });
  it('is true once mastery hits the threshold', () => {
    expect(isMasteredRecord({ mastery: 1 })).toBe(true);
  });
  it('is false for an undefined record (never attempted)', () => {
    expect(isMasteredRecord(undefined)).toBe(false);
  });
});

describe('effectivePracticedAt', () => {
  it('prefers lastPracticedAt over masteredAt', () => {
    const r: DecayRecord = { mastery: 1, lastPracticedAt: 100, masteredAt: 50 };
    expect(effectivePracticedAt(r)).toBe(100);
  });
  it('falls back to masteredAt when lastPracticedAt is missing (pre-migration state)', () => {
    const r: DecayRecord = { mastery: 1, masteredAt: 50 };
    expect(effectivePracticedAt(r)).toBe(50);
  });
  it('is undefined when neither timestamp exists', () => {
    expect(effectivePracticedAt({ mastery: 1 })).toBeUndefined();
  });
});

describe('strengthOf — decay curve', () => {
  it('is 0 for an unmastered skill regardless of timing', () => {
    expect(strengthOf({ mastery: 0.5, lastPracticedAt: daysAgo(0) }, NOW)).toBe(0);
  });

  it('is full strength inside the grace window', () => {
    expect(strengthOf({ mastery: 1, lastPracticedAt: daysAgo(0) }, NOW)).toBe(DECAY_FULL_STRENGTH);
    expect(strengthOf({ mastery: 1, lastPracticedAt: daysAgo(DECAY_GRACE_DAYS) }, NOW)).toBe(
      DECAY_FULL_STRENGTH,
    );
  });

  it('decays linearly partway through the decay span', () => {
    // Halfway through the 35-day decay span: 100 -> 40 at the midpoint = 70.
    const halfway = DECAY_GRACE_DAYS + DECAY_SPAN_DAYS / 2;
    expect(strengthOf({ mastery: 1, lastPracticedAt: daysAgo(halfway) }, NOW)).toBe(70);
  });

  it('floors at the decay floor and never goes lower', () => {
    expect(
      strengthOf({ mastery: 1, lastPracticedAt: daysAgo(DECAY_GRACE_DAYS + DECAY_SPAN_DAYS) }, NOW),
    ).toBe(DECAY_FLOOR_STRENGTH);
    expect(strengthOf({ mastery: 1, lastPracticedAt: daysAgo(365) }, NOW)).toBe(DECAY_FLOOR_STRENGTH);
  });

  it('treats a mastered skill with no timing evidence as stale-unknown (floor, not full)', () => {
    expect(strengthOf({ mastery: 1 }, NOW)).toBe(DECAY_FLOOR_STRENGTH);
  });

  it('falls back to masteredAt for pre-migration persisted state', () => {
    expect(strengthOf({ mastery: 1, masteredAt: daysAgo(0) }, NOW)).toBe(DECAY_FULL_STRENGTH);
    expect(
      strengthOf({ mastery: 1, masteredAt: daysAgo(DECAY_GRACE_DAYS + DECAY_SPAN_DAYS) }, NOW),
    ).toBe(DECAY_FLOOR_STRENGTH);
  });
});

describe('isRusty', () => {
  it('is false for an unmastered skill', () => {
    expect(isRusty({ mastery: 0.4, lastPracticedAt: daysAgo(365) }, NOW)).toBe(false);
  });

  it('is false for a fresh mastered skill', () => {
    expect(isRusty({ mastery: 1, lastPracticedAt: daysAgo(1) }, NOW)).toBe(false);
  });

  it('is true once strength decays under the rusty threshold', () => {
    // Find a days-ago value whose strength is just under RUSTY_THRESHOLD.
    const days = DECAY_GRACE_DAYS + DECAY_SPAN_DAYS * 0.9;
    const r: DecayRecord = { mastery: 1, lastPracticedAt: daysAgo(days) };
    expect(strengthOf(r, NOW)).toBeLessThan(RUSTY_THRESHOLD);
    expect(isRusty(r, NOW)).toBe(true);
  });

  it('the "never re-locks" invariant: rusty status never changes mastery itself', () => {
    const r: DecayRecord = { mastery: 1, lastPracticedAt: daysAgo(365) };
    expect(isRusty(r, NOW)).toBe(true);
    // isMasteredRecord — the only thing gating logic elsewhere may read —
    // is completely untouched by how rusty the skill is.
    expect(isMasteredRecord(r)).toBe(true);
    expect(r.mastery).toBe(1);
  });
});

describe('daysSince', () => {
  it('is never negative even if "from" is after "now"', () => {
    expect(daysSince(NOW + DAY, NOW)).toBe(0);
  });
});

describe('averageCompetencyDecay', () => {
  it('returns 1 (no discount) when nothing in the competency is mastered yet', () => {
    const records: DecayRecord[] = [{ mastery: 0.3 }, { mastery: 0 }];
    expect(averageCompetencyDecay(records, NOW)).toBe(1);
  });

  it('averages strength across mastered skills only, ignoring unmastered ones', () => {
    const records: DecayRecord[] = [
      { mastery: 1, lastPracticedAt: daysAgo(0) }, // 100
      { mastery: 1, lastPracticedAt: daysAgo(DECAY_GRACE_DAYS + DECAY_SPAN_DAYS) }, // 40
      { mastery: 0.2 }, // not mastered, excluded
    ];
    // (100 + 40) / 2 = 70 -> 0.7
    expect(averageCompetencyDecay(records, NOW)).toBeCloseTo(0.7);
  });

  it('returns 1 for an empty competency', () => {
    expect(averageCompetencyDecay([], NOW)).toBe(1);
  });
});
