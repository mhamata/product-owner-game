'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Competency } from '@/curriculum/types';

/**
 * Evidence the player has shown a competency by performing in the simulator,
 * kept separate from lesson/drill mastery on purpose.
 *
 * Competency coverage on the progress page is derived from mastered SKILLS, and
 * doing a sim well must not silently certify a level the player never studied.
 * So a run's competency read lands here, as its own band on the progress page:
 * "you have shown this in the sim", distinct from "you have mastered the skills".
 * We keep the best score seen per competency, so the band reflects a player's
 * ceiling, and the merge is idempotent (re-recording the same run is a no-op).
 */
interface SimEvidenceState {
  /** Best 0-100 score the player has reached per competency, across all runs. */
  scores: Partial<Record<Competency, number>>;
  hasHydrated: boolean;
}

interface SimEvidenceActions {
  /** Fold one finished run's per-competency read into the best-seen scores. */
  recordRun: (runScores: Partial<Record<Competency, number>>) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export type SimEvidenceStore = SimEvidenceState & SimEvidenceActions;

export const useSimEvidenceStore = create<SimEvidenceStore>()(
  persist(
    (set) => ({
      scores: {},
      hasHydrated: false,

      recordRun: (runScores) =>
        set((s) => {
          const next = { ...s.scores };
          for (const [comp, value] of Object.entries(runScores) as Array<[Competency, number]>) {
            next[comp] = Math.max(next[comp] ?? 0, value);
          }
          return { scores: next };
        }),

      reset: () => set({ scores: {} }),
      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-sim-evidence-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ scores: s.scores }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
