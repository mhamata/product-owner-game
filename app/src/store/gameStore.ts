'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Action, GameState } from '@/engine/types';
import { createGame, step } from '@/engine/step';
import { getScenario } from '@/scenarios';

interface GameStore {
  state: GameState | null;
  scenarioId: string | null;
  newGame: (scenarioId: string, seed?: string) => void;
  dispatch: (action: Action) => void;
  abandon: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      scenarioId: null,
      newGame: (scenarioId, seed) => {
        const scenario = getScenario(scenarioId);
        if (!scenario) return;
        const s = createGame(scenario, seed ?? `${Date.now()}`);
        set({ state: s, scenarioId });
      },
      dispatch: (action) => {
        const { state, scenarioId } = get();
        if (!state || !scenarioId) return;
        const scenario = getScenario(scenarioId);
        if (!scenario) return;
        const next = step(state, action, scenario);
        set({ state: next });
      },
      abandon: () => set({ state: null, scenarioId: null }),
    }),
    {
      name: 'praxis-game-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
