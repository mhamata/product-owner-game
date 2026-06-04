'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Calibration: how well the player predicts whether a committed sprint will
 * fully ship BEFORE the capacity roll is revealed.
 *
 * Expertise is calibrated intuition, and you build it by committing to a
 * prediction and then being shown the error, the same loop superforecasting
 * training uses. We track a lifetime hit rate across every sprint and run, so
 * the number is a running read on the player's judgment rather than a per-game
 * score. It deliberately persists across runs (key below), like a skill stat.
 *
 * Flow: the Preview step records a `pending` call for the current sprint; the
 * Outcome step resolves it against reality, which folds it into the lifetime
 * totals and clears it. Keeping the call in the store (not React state) means it
 * survives the commit + execute round trip and a hard refresh mid-sprint.
 */
interface CalibrationState {
  /** Total predictions the player has resolved. */
  predictions: number;
  /** Resolved predictions that matched what actually happened. */
  hits: number;
  /** The call made this sprint, awaiting its outcome. Cleared once resolved. */
  pending: { iteration: number; allShip: boolean } | null;
  hasHydrated: boolean;
}

interface CalibrationActions {
  /** Make or change the call for a given sprint, before the roll. */
  predict: (iteration: number, allShip: boolean) => void;
  /** Resolve the pending call against reality, folding it into the totals. */
  resolve: (actualAllShip: boolean) => void;
  /** Lifetime hit rate as a 0-100 percentage, or null before any prediction. */
  accuracy: () => number | null;
  reset: () => void;
  _setHydrated: () => void;
}

export type CalibrationStore = CalibrationState & CalibrationActions;

export const useCalibrationStore = create<CalibrationStore>()(
  persist(
    (set, get) => ({
      predictions: 0,
      hits: 0,
      pending: null,
      hasHydrated: false,

      predict: (iteration, allShip) => set({ pending: { iteration, allShip } }),

      resolve: (actualAllShip) =>
        set((s) => {
          if (!s.pending) return s;
          return {
            predictions: s.predictions + 1,
            hits: s.hits + (s.pending.allShip === actualAllShip ? 1 : 0),
            pending: null,
          };
        }),

      accuracy: () => {
        const { predictions, hits } = get();
        return predictions === 0 ? null : Math.round((hits / predictions) * 100);
      },

      reset: () => set({ predictions: 0, hits: 0, pending: null }),
      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-calibration-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ predictions: s.predictions, hits: s.hits, pending: s.pending }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
