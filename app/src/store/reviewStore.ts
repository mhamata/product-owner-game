'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ALL_SCENARIO_IDS } from '@/curriculum/judgment';

/**
 * SPACED-REPETITION SCHEDULER for the judgment deck.
 *
 * Model: a Leitner box system (an SM-2-lite). Each card sits in a box 0..N; the
 * box maps to a review interval in days. A correct answer PROMOTES the card to
 * the next box (a longer interval, so you see it less often as it sticks); a
 * wrong answer RESETS it to box 0 (due again the same day, so you rehearse it
 * until it holds). This is the classic forgetting-curve schedule: easy cards
 * fall away, shaky cards keep coming back.
 *
 * Why boxes and not full SM-2: SM-2's per-card ease factors are overkill for a
 * binary right/wrong judgment call and would surface as fiddly tuning with no
 * learner benefit here. Fixed, well-spaced intervals are simple, sound, and
 * predictable, which matters for a deck a person dips into daily.
 *
 * Date handling mirrors `learnStore`: everything is a local `yyyy-mm-dd` day
 * string, so "due today" means due on or before the learner's local calendar
 * day, with no timezone or millisecond drift.
 *
 * Persistence + hydration also mirror the learn/industry stores: persisted to
 * localStorage, with a transient `hasHydrated` flag so the UI renders a stable
 * default on the server and first client paint and never mismatches.
 */

/**
 * Review-interval ladder, in DAYS, indexed by box. Box 0 is "due today" (a fresh
 * or just-missed card); each step out roughly follows a forgetting curve. The
 * last box is the ceiling: a card that keeps being answered correctly stays at
 * the longest interval rather than drifting to never.
 */
export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 35] as const;

/** Highest box index (the longest-interval ceiling). */
export const MAX_BOX = BOX_INTERVALS_DAYS.length - 1;

/** The outcome of reviewing a card. */
export type ReviewResult = 'correct' | 'wrong';

/**
 * Per-card scheduling state.
 *
 * `box` is the Leitner box (0..MAX_BOX). `due` is the local `yyyy-mm-dd` day the
 * card is next due (due when `due <= today`). `lastResult` and `lastReviewedDay`
 * are kept for display and for a future per-card history view; they do not
 * affect scheduling beyond what `box`/`due` already encode.
 */
export interface CardSchedule {
  box: number;
  due: string; // yyyy-mm-dd, local day
  lastResult: ReviewResult;
  lastReviewedDay: string; // yyyy-mm-dd, local day
  /**
   * True when this card's due date was most recently pulled forward by
   * `resurface()` (a sim event/run surfaced it) rather than reached through
   * normal Leitner scheduling. Additive + optional (W4-I): old persisted
   * schedules simply lack the field and read as `undefined`/falsy, so no
   * migration is needed. `scheduleNext()` always builds a brand-new schedule
   * object from scratch and never copies this field forward, so reviewing a
   * resurfaced card (right or wrong) naturally clears the flag on its next
   * review — a one-shot "why is this due right now" signal, not a permanent
   * tag. The Review deck reads it to show the "⟲ From your run" provenance
   * chip and to pick a varied industry skin (see `@/lib/reviewProvenance`).
   */
  resurfaced?: boolean;
}

/** Local day marker (yyyy-mm-dd), identical to learnStore's `today()`. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole-day difference between two yyyy-mm-dd markers (toISO - fromISO). */
export function dayDiff(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Add `days` whole days to a yyyy-mm-dd marker, returning a yyyy-mm-dd marker. */
export function addDays(fromISO: string, days: number): string {
  const t = new Date(`${fromISO}T00:00:00`).getTime() + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Clamp a box index into the valid 0..MAX_BOX range. */
function clampBox(box: number): number {
  if (box < 0) return 0;
  if (box > MAX_BOX) return MAX_BOX;
  return box;
}

/**
 * PURE scheduling step: given a card's current schedule (or `undefined` for a
 * brand-new card), the result, and today's day, return the card's next
 * schedule. Pure so it is trivially testable in isolation, and so the store
 * action is a thin wrapper over it.
 *
 *  - correct: promote one box (capped at MAX_BOX); next due = today + interval.
 *  - wrong:   reset to box 0; next due = today (rehearse again this session/day).
 */
export function scheduleNext(
  current: CardSchedule | undefined,
  result: ReviewResult,
  day: string = todayISO(),
): CardSchedule {
  const currentBox = current?.box ?? 0;
  const nextBox =
    result === 'correct' ? clampBox(currentBox + 1) : 0;
  const due = addDays(day, BOX_INTERVALS_DAYS[nextBox]);
  return {
    box: nextBox,
    due,
    lastResult: result,
    lastReviewedDay: day,
  };
}

/**
 * Is a card due on `day`? A card with a schedule is due when its `due` marker is
 * on or before `day`. A card with NO schedule (never reviewed) is always due:
 * new cards enter the queue immediately. Centralised so the store and any caller
 * agree on exactly one definition of "due".
 */
export function isDue(
  schedule: CardSchedule | undefined,
  day: string = todayISO(),
): boolean {
  if (!schedule) return true;
  return dayDiff(day, schedule.due) <= 0;
}

/**
 * The ids that are due on `day`, in deck order, from a full schedule map over
 * the known deck. New (unseen) cards are included. Pure helper so "what is due"
 * has one implementation shared by the store selectors and the tests.
 */
export function dueIdsFrom(
  schedules: Record<string, CardSchedule>,
  allIds: readonly string[],
  day: string = todayISO(),
): string[] {
  return allIds.filter((id) => isDue(schedules[id], day));
}

/**
 * The next local day a card is due, across the whole deck, or `null` if the deck
 * is empty. Used by the "all caught up" state to say when to come back. Only
 * considers cards that HAVE a schedule (unseen cards are due now, so if any
 * existed the caller would not be caught up).
 */
export function nextDueDayFrom(
  schedules: Record<string, CardSchedule>,
  allIds: readonly string[],
): string | null {
  let soonest: string | null = null;
  for (const id of allIds) {
    const s = schedules[id];
    if (!s) continue;
    if (soonest === null || s.due < soonest) soonest = s.due;
  }
  return soonest;
}

/** One row of the Leitner shelf: a box, its interval, and real counts. */
export interface ShelfRow {
  /** 0-based internal box index (matches `CardSchedule.box`). */
  box: number;
  /** The box's review interval, in days (mirrors `BOX_INTERVALS_DAYS[box]`). */
  intervalDays: number;
  /** How many deck cards currently sit in this box. */
  total: number;
  /** Of those, how many are due today. */
  due: number;
}

/** The whole shelf: one row per box, plus never-reviewed cards (always due). */
export interface ReviewShelf {
  rows: ShelfRow[];
  /** Cards with no schedule yet — due immediately, not yet assigned a box. */
  unseen: number;
}

/**
 * PURE: the Leitner shelf view — real per-box counts + due counts, straight
 * from the schedule map. No fabricated buckets: a box with zero cards in it
 * still gets a row (so the shelf always shows the full 6-box ladder), but its
 * counts are honestly zero.
 */
export function boxShelf(
  schedules: Record<string, CardSchedule>,
  allIds: readonly string[],
  day: string = todayISO(),
): ReviewShelf {
  const rows: ShelfRow[] = BOX_INTERVALS_DAYS.map((intervalDays, box) => ({
    box,
    intervalDays,
    total: 0,
    due: 0,
  }));
  let unseen = 0;
  for (const id of allIds) {
    const s = schedules[id];
    if (!s) {
      unseen += 1;
      continue;
    }
    const row = rows[s.box];
    row.total += 1;
    if (isDue(s, day)) row.due += 1;
  }
  return { rows, unseen };
}

/** The result of one review, in terms a learner reads as "what just happened". */
export interface BoxMove {
  /** The box the card was in before this review, or `null` for a brand-new card. */
  fromBox: number | null;
  /** The box the card landed in after this review. */
  toBox: number;
  /** The new box's interval, in days. */
  intervalDays: number;
  /** A ready-to-render line, e.g. "Box 3 → Box 4 · next seen in 7 days". */
  message: string;
}

/**
 * PURE: describe a box move in the same 1-indexed language a learner reads
 * ("Box 1" through "Box 6"), from the card's box BEFORE this review (or
 * `null` if it had never been scheduled) and its freshly-computed schedule
 * AFTER (typically the output of `scheduleNext`). No store access — callers
 * pass in real before/after values so this stays trivially testable.
 */
export function describeBoxMove(
  prevBox: number | null,
  next: CardSchedule,
): BoxMove {
  const intervalDays = BOX_INTERVALS_DAYS[next.box];
  const fromLabel = prevBox === null ? 'New card' : `Box ${prevBox + 1}`;
  const toLabel = `Box ${next.box + 1}`;
  const whenLabel =
    intervalDays === 0
      ? 'today'
      : intervalDays === 1
        ? 'in 1 day'
        : `in ${intervalDays} days`;
  return {
    fromBox: prevBox,
    toBox: next.box,
    intervalDays,
    message: `${fromLabel} → ${toLabel} · next seen ${whenLabel}`,
  };
}

interface ReviewState {
  /** scenarioId -> schedule. Absent = never reviewed (due now). */
  schedules: Record<string, CardSchedule>;
  /** Set true once persisted state has rehydrated (avoids SSR mismatch). */
  hasHydrated: boolean;
}

interface ReviewActions {
  /** Record a review outcome for a card and reschedule it. */
  review: (scenarioId: string, result: ReviewResult) => void;
  /**
   * Pull the given cards to the front of the deck (due today), e.g. when the
   * simulator surfaces a weakness. Only moves cards already scheduled out; an
   * unseen card is due already, so it is left untouched.
   */
  resurface: (ids: string[]) => void;
  /** Ids due today, in deck order (includes never-seen cards). */
  dueToday: () => string[];
  /** Count of cards due today. The Topbar badge reads this. */
  dueCount: () => number;
  /** The next day (yyyy-mm-dd) any reviewed card comes due, or null. */
  nextDueDay: () => string | null;
  /** Read one card's schedule, or undefined if never reviewed. */
  getSchedule: (scenarioId: string) => CardSchedule | undefined;
  /** Reset all review history (dev/testing aid). */
  resetReviews: () => void;
  _setHydrated: () => void;
}

export type ReviewStore = ReviewState & ReviewActions;

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      schedules: {},
      hasHydrated: false,

      review: (scenarioId, result) => {
        set((s) => {
          const next = scheduleNext(s.schedules[scenarioId], result);
          return { schedules: { ...s.schedules, [scenarioId]: next } };
        });
      },

      resurface: (ids) => {
        set((s) => {
          const day = todayISO();
          const next = { ...s.schedules };
          for (const id of ids) {
            const cur = next[id];
            // Only pull a card that was scheduled out; an unseen card is due now.
            if (cur && dayDiff(day, cur.due) > 0) {
              next[id] = { ...cur, due: day, resurfaced: true };
            }
          }
          return { schedules: next };
        });
      },

      dueToday: () => dueIdsFrom(get().schedules, ALL_SCENARIO_IDS),

      dueCount: () => dueIdsFrom(get().schedules, ALL_SCENARIO_IDS).length,

      nextDueDay: () => nextDueDayFrom(get().schedules, ALL_SCENARIO_IDS),

      getSchedule: (scenarioId) => get().schedules[scenarioId],

      resetReviews: () => set({ schedules: {} }),

      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-review-v1',
      storage: createJSONStorage(() => localStorage),
      // Only the real schedule map is persisted; the hydration flag is transient.
      partialize: (s) => ({ schedules: s.schedules }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
