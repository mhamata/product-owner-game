'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { todayISO } from './reviewStore';
import { rolledDayProgress, type StandupDayProgress } from '@/lib/standupActs';

/**
 * Minimal, day-scoped progress for the /standup Act 3 gate.
 *
 * Act 1 (Warm-up) and Act 2 (Workload) completion are NOT duplicated here —
 * they are derived live from stores that already own that truth:
 *  - Warm-up: the review-store due-queue snapshot the Standup screen walks
 *    (session-local React state, same pattern as `/review`'s `ReviewView`).
 *  - Workload: `learnStore.isMastered(skillId)` for the scheduler-chosen
 *    skill — mastery IS the completion signal, no separate flag to drift out
 *    of sync with it.
 *
 * Only Act 3 needs its own record: "did the learner open today's Standup" has
 * no other home. This is deliberately the lightest possible store — one
 * boolean, one day marker — per the slice's "keep it lightweight" scope.
 *
 * NOT in `src/lib/sync/keys.ts`'s allowlist: this is a same-day UI-visited
 * flag, not learner progress worth backing up across devices.
 */
interface StandupState {
  progress: StandupDayProgress;
  hasHydrated: boolean;
}

interface StandupActions {
  /** Today's progress, rolled forward if the stored record is from a prior day. */
  today: () => StandupDayProgress;
  /** Mark today's Standup (Act 3) as opened. */
  completeStandup: () => void;
  /** Reset today's record (dev/testing aid, mirrors other stores). */
  resetToday: () => void;
  _setHydrated: () => void;
}

export type StandupStore = StandupState & StandupActions;

function freshProgress(day: string = todayISO()): StandupDayProgress {
  return { day, standupComplete: false };
}

export const useStandupStore = create<StandupStore>()(
  persist(
    (set, get) => ({
      progress: freshProgress(),
      hasHydrated: false,

      today: () => rolledDayProgress(get().progress, todayISO()),

      completeStandup: () => {
        set((s) => ({
          progress: { ...rolledDayProgress(s.progress, todayISO()), standupComplete: true },
        }));
      },

      resetToday: () => set({ progress: freshProgress() }),

      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-standup-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ progress: s.progress }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
