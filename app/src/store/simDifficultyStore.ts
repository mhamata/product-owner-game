'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Hardest tier a scenario can ratchet to. Tier 0 is the authored baseline. */
export const MAX_DIFFICULTY_TIER = 3;

/**
 * Adaptive difficulty: each scenario remembers the hardest tier the player has
 * earned by acing it. Acing a run unlocks the next tier, so a replay tightens
 * the squeeze (less capacity, more variance) and stays in the player's zone of
 * proximal development instead of going stale.
 *
 * The tier is keyed per scenario and persists across runs. The bump is
 * expressed as `max(current, playedTier + 1)`, which is idempotent: recording
 * the same finished run twice (a re-render, dev StrictMode) cannot over-ratchet.
 */
interface SimDifficultyState {
  /** scenarioId -> earned difficulty tier (0 = baseline). */
  tiers: Record<string, number>;
  hasHydrated: boolean;
}

interface SimDifficultyActions {
  tierFor: (scenarioId: string) => number;
  /** Unlock the next tier if the run (played at `playedTier`) was aced. */
  recordResult: (scenarioId: string, playedTier: number, aced: boolean) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export type SimDifficultyStore = SimDifficultyState & SimDifficultyActions;

export const useSimDifficultyStore = create<SimDifficultyStore>()(
  persist(
    (set, get) => ({
      tiers: {},
      hasHydrated: false,

      tierFor: (scenarioId) => get().tiers[scenarioId] ?? 0,

      recordResult: (scenarioId, playedTier, aced) =>
        set((s) => {
          if (!aced) return s;
          const unlocked = Math.min(MAX_DIFFICULTY_TIER, playedTier + 1);
          const current = s.tiers[scenarioId] ?? 0;
          if (unlocked <= current) return s;
          return { tiers: { ...s.tiers, [scenarioId]: unlocked } };
        }),

      reset: () => set({ tiers: {} }),
      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-sim-difficulty-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tiers: s.tiers }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
