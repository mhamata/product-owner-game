import { describe, it, expect } from 'vitest';
import {
  scheduleNext,
  isDue,
  dueIdsFrom,
  nextDueDayFrom,
  addDays,
  BOX_INTERVALS_DAYS,
  MAX_BOX,
  type CardSchedule,
} from '../reviewStore';

/**
 * The scheduler is the heart of the judgment deck: it decides what comes back
 * and when. These tests pin its contract independent of React or persistence,
 * because the whole "spaced repetition" promise rides on this math being right.
 * A fixed `DAY` keeps the assertions deterministic regardless of the wall clock.
 */
const DAY = '2026-06-04';

describe('scheduleNext', () => {
  it('promotes a brand-new card to box 1 with a one-day interval on a correct answer', () => {
    const next = scheduleNext(undefined, 'correct', DAY);
    expect(next.box).toBe(1);
    expect(next.due).toBe(addDays(DAY, BOX_INTERVALS_DAYS[1]));
    expect(next.lastResult).toBe('correct');
  });

  it('promotes one box on each correct answer, lengthening the interval', () => {
    const box1 = scheduleNext(undefined, 'correct', DAY);
    const box2 = scheduleNext(box1, 'correct', DAY);
    expect(box2.box).toBe(2);
    // The interval at box 2 is strictly longer than at box 1: it grows.
    expect(BOX_INTERVALS_DAYS[2]).toBeGreaterThan(BOX_INTERVALS_DAYS[1]);
    expect(box2.due).toBe(addDays(DAY, BOX_INTERVALS_DAYS[2]));
  });

  it('resets a card to box 0 and due today on a wrong answer', () => {
    const promoted: CardSchedule = {
      box: 4,
      due: addDays(DAY, BOX_INTERVALS_DAYS[4]),
      lastResult: 'correct',
      lastReviewedDay: DAY,
    };
    const next = scheduleNext(promoted, 'wrong', DAY);
    expect(next.box).toBe(0);
    expect(next.due).toBe(DAY); // box 0 interval is 0 days, so due the same day
    expect(next.lastResult).toBe('wrong');
  });

  it('caps promotion at the top box instead of running off the ladder', () => {
    const atCeiling: CardSchedule = {
      box: MAX_BOX,
      due: addDays(DAY, BOX_INTERVALS_DAYS[MAX_BOX]),
      lastResult: 'correct',
      lastReviewedDay: DAY,
    };
    const next = scheduleNext(atCeiling, 'correct', DAY);
    expect(next.box).toBe(MAX_BOX);
    expect(next.due).toBe(addDays(DAY, BOX_INTERVALS_DAYS[MAX_BOX]));
  });
});

describe('isDue', () => {
  it('treats a never-reviewed card as due', () => {
    expect(isDue(undefined, DAY)).toBe(true);
  });

  it('treats a card scheduled in the future as not due', () => {
    const future: CardSchedule = {
      box: 2,
      due: addDays(DAY, 3),
      lastResult: 'correct',
      lastReviewedDay: DAY,
    };
    expect(isDue(future, DAY)).toBe(false);
  });

  it('treats a card due today or overdue as due', () => {
    const dueToday: CardSchedule = {
      box: 1,
      due: DAY,
      lastResult: 'correct',
      lastReviewedDay: addDays(DAY, -1),
    };
    const overdue: CardSchedule = {
      box: 1,
      due: addDays(DAY, -5),
      lastResult: 'correct',
      lastReviewedDay: addDays(DAY, -6),
    };
    expect(isDue(dueToday, DAY)).toBe(true);
    expect(isDue(overdue, DAY)).toBe(true);
  });
});

describe('dueIdsFrom', () => {
  const allIds = ['a', 'b', 'c'];

  it('returns every card when none have been reviewed', () => {
    expect(dueIdsFrom({}, allIds, DAY)).toEqual(['a', 'b', 'c']);
  });

  it('excludes a card scheduled in the future but keeps the unseen and the overdue', () => {
    const schedules: Record<string, CardSchedule> = {
      // a: answered correctly today, now scheduled 3 days out -> not due
      a: { box: 2, due: addDays(DAY, 3), lastResult: 'correct', lastReviewedDay: DAY },
      // b: overdue -> due
      b: { box: 1, due: addDays(DAY, -2), lastResult: 'correct', lastReviewedDay: addDays(DAY, -3) },
      // c: absent -> unseen -> due
    };
    expect(dueIdsFrom(schedules, allIds, DAY)).toEqual(['b', 'c']);
  });

  it('preserves deck order in the due list', () => {
    const schedules: Record<string, CardSchedule> = {
      b: { box: 0, due: DAY, lastResult: 'wrong', lastReviewedDay: DAY },
    };
    // a (unseen), b (due today), c (unseen) -> all due, in deck order
    expect(dueIdsFrom(schedules, allIds, DAY)).toEqual(['a', 'b', 'c']);
  });
});

describe('nextDueDay', () => {
  const allIds = ['a', 'b', 'c'];

  it('is null when no card has been scheduled yet', () => {
    expect(nextDueDayFrom({}, allIds)).toBeNull();
  });

  it('returns the soonest scheduled due day across reviewed cards', () => {
    const schedules: Record<string, CardSchedule> = {
      a: { box: 3, due: addDays(DAY, 7), lastResult: 'correct', lastReviewedDay: DAY },
      b: { box: 1, due: addDays(DAY, 1), lastResult: 'correct', lastReviewedDay: DAY },
      c: { box: 2, due: addDays(DAY, 3), lastResult: 'correct', lastReviewedDay: DAY },
    };
    expect(nextDueDayFrom(schedules, allIds)).toBe(addDays(DAY, 1));
  });
});

describe('end-to-end forgetting curve', () => {
  it('rehearses a missed card soon and spaces out a learned one', () => {
    // A card answered wrong is due again the same day (box 0).
    const missed = scheduleNext(undefined, 'wrong', DAY);
    expect(isDue(missed, DAY)).toBe(true);

    // Answer it right twice; it should now be scheduled days into the future
    // and no longer due today.
    const up1 = scheduleNext(missed, 'correct', DAY);
    const up2 = scheduleNext(up1, 'correct', DAY);
    expect(up2.box).toBe(2);
    expect(isDue(up2, DAY)).toBe(false);
  });
});
