'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Tracks which just-in-time sim coachmarks the learner has dismissed, so a tip
 * never nags twice. Persisted to localStorage. The "replay tutorial" affordance
 * calls `replayTutorial()` to clear them and re-arm the first-sprint coaching.
 */
interface CoachState {
  dismissed: Record<string, boolean>;
  hasHydrated: boolean;
  dismiss: (id: string) => void;
  isDismissed: (id: string) => boolean;
  replayTutorial: () => void;
  _setHydrated: () => void;
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => ({
      dismissed: {},
      hasHydrated: false,
      dismiss: (id) => set((s) => ({ dismissed: { ...s.dismissed, [id]: true } })),
      isDismissed: (id) => !!get().dismissed[id],
      replayTutorial: () => set({ dismissed: {} }),
      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-coach-v1',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
);
