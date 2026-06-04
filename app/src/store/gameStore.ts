'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Action, GameState, Scenario } from '@/engine/types';
import type { IndustryId } from '@/curriculum/industries';
import { createGame, step } from '@/engine/step';
import { getScenario } from '@/scenarios';

interface GameStore {
  state: GameState | null;
  scenarioId: string | null;
  /**
   * The home industry the active game was assembled for. Persisted so the
   * runner can tell when the player switched industries and a rebuild is due.
   */
  industry: IndustryId | null;
  /**
   * The exact assembled scenario the active game runs against. TRANSIENT (not
   * persisted; it is rebuildable from id + industry and would bloat storage).
   * After a hard refresh this is null until `newGame` runs again; `dispatch`
   * falls back to the default-industry registry, which is structurally
   * identical, so the engine still resolves correctly.
   */
  activeScenario: Scenario | null;
  /**
   * Start a fresh game. Pass the already-assembled `scenario` (so the engine
   * runs against the exact same object the UI renders, including the right
   * per-industry event-injected PBI titles); falls back to the registry by id
   * when omitted. `industry` records which theme this game belongs to.
   */
  newGame: (scenarioId: string, opts?: { scenario?: Scenario; industry?: IndustryId; seed?: string }) => void;
  dispatch: (action: Action) => void;
  abandon: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      scenarioId: null,
      industry: null,
      activeScenario: null,
      newGame: (scenarioId, opts) => {
        const scenario = opts?.scenario ?? getScenario(scenarioId);
        if (!scenario) return;
        const s = createGame(scenario, opts?.seed ?? `${Date.now()}`);
        set({
          state: s,
          scenarioId,
          industry: opts?.industry ?? null,
          activeScenario: scenario,
        });
      },
      dispatch: (action) => {
        const { state, scenarioId, activeScenario } = get();
        if (!state || !scenarioId) return;
        // Prefer the assembled scenario this game started with; after a refresh
        // (transient field lost) fall back to the registry by id.
        const scenario = activeScenario ?? getScenario(scenarioId);
        if (!scenario) return;
        const next = step(state, action, scenario);
        set({ state: next });
      },
      abandon: () => set({ state: null, scenarioId: null, industry: null, activeScenario: null }),
    }),
    {
      name: 'praxis-game-v1',
      storage: createJSONStorage(() => localStorage),
      // Persist only the engine state + which scenario/industry it belongs to.
      // The assembled scenario object is transient (rebuildable) and omitted.
      partialize: (s) => ({
        state: s.state,
        scenarioId: s.scenarioId,
        industry: s.industry,
      }),
    },
  ),
);
