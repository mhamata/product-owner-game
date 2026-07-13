'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState } from '@/engine/types';

/**
 * METRICS HISTORY: per-sprint numeric snapshots, the sparkline source for the
 * Product tab (Sim 2.0 W3-E, design-sim-2.0.md §3 / praxis-sim2-mockup.html's
 * Product screen).
 *
 * WHY THIS STORE EXISTS (read this before touching engine/ to "fix" it):
 * `GameState` (engine/types.ts) carries only the CURRENT value of every
 * metric — `economy.revenue`, `team.morale`, `tech.techDebt`,
 * `tech.reliability`, `board.confidence` — plus a single `lastOutcome`
 * that gets overwritten every sprint. There is no per-sprint history array
 * anywhere in engine state, so a metric tile's sparkline cannot be derived
 * from a snapshot of GameState alone. Per the W3-E ledger instruction ("if
 * per-metric history isn't stored, derive what you can from the engine's
 * event/iteration log; document what was derivable and what wasn't"): the
 * event log (`state.eventLog`) carries narrative/summary STRINGS, not
 * numeric deltas, so it cannot reconstruct a numeric series either. The only
 * honest option that invents no data is to start RECORDING real snapshots as
 * the run plays, exactly like `decisionLogStore` already does for decisions.
 *
 * Consequence (documented, not hidden): a run's sparklines only cover
 * sprints played AFTER this slice shipped. A save resumed mid-run shows a
 * shorter line, not a fabricated backfill — this is a correctness choice,
 * not an oversight.
 *
 * `tech.reliability` is captured too, but per engine/types.ts + every
 * scenario's structural file, nothing in engine/ ever mutates it after
 * `createGame` — it is static scenario config, not a live signal. Its
 * sparkline will always be flat; the Product screen labels it accordingly
 * rather than implying movement that never happens.
 */

export interface MetricsSnapshot {
  /** 1-based sprint number the values were read at; 0 = pre-season baseline (captured at createGame). */
  sprint: number;
  revenue: number;
  /** 0-10 scale (TeamState.morale). */
  morale: number;
  /** 0-100 scale, clamped by engine/techDebt.ts. */
  techDebt: number;
  /** 0-10 scale; static per scenario — see file header. */
  reliability: number;
  /** 0-100, or null when `state.board` isn't present (very old persisted saves). */
  boardConfidence: number | null;
}

export type MetricKey = 'revenue' | 'morale' | 'techDebt' | 'reliability' | 'boardConfidence';

/** Total snapshots kept across every run, oldest-first eviction — mirrors decisionLogStore's MAX_ENTRIES contract. */
export const MAX_SNAPSHOTS = 2000;

/** PURE: read the current values straight off GameState. No invention, no math beyond field access. */
export function deriveMetricSnapshot(state: GameState): MetricsSnapshot {
  return {
    sprint: state.iterationNumber,
    revenue: state.economy.revenue,
    morale: state.team.morale,
    techDebt: state.tech.techDebt,
    reliability: state.tech.reliability,
    boardConfidence: state.board?.confidence ?? null,
  };
}

interface RunHistoryEntry {
  runId: string;
  snapshot: MetricsSnapshot;
}

/**
 * PURE: upsert one run's sprint snapshot (replace-if-present so a re-render
 * or a re-mount of the effect that calls this is always safe to repeat),
 * capped at MAX_SNAPSHOTS via oldest-first eviction.
 */
export function recordSnapshotPure(
  history: RunHistoryEntry[],
  runId: string,
  snapshot: MetricsSnapshot,
): RunHistoryEntry[] {
  const idx = history.findIndex((h) => h.runId === runId && h.snapshot.sprint === snapshot.sprint);
  let next: RunHistoryEntry[];
  if (idx === -1) {
    next = [...history, { runId, snapshot }];
  } else {
    next = [...history];
    next[idx] = { runId, snapshot };
  }
  return next.length > MAX_SNAPSHOTS ? next.slice(next.length - MAX_SNAPSHOTS) : next;
}

/** PURE: every snapshot for a run, sprint-ascending. */
export function selectHistoryForRun(history: RunHistoryEntry[], runId: string): MetricsSnapshot[] {
  return history
    .filter((h) => h.runId === runId)
    .map((h) => h.snapshot)
    .sort((a, b) => a.sprint - b.sprint);
}

/** PURE: drop every snapshot belonging to a run (mirrors decisionLogStore.clearRun). */
export function clearRunHistoryPure(history: RunHistoryEntry[], runId: string): RunHistoryEntry[] {
  return history.filter((h) => h.runId !== runId);
}

interface MetricsHistoryState {
  history: RunHistoryEntry[];
  hasHydrated: boolean;
}

interface MetricsHistoryActions {
  recordSnapshot: (runId: string, snapshot: MetricsSnapshot) => void;
  historyForRun: (runId: string) => MetricsSnapshot[];
  clearRun: (runId: string) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export type MetricsHistoryStore = MetricsHistoryState & MetricsHistoryActions;

export const useMetricsHistoryStore = create<MetricsHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      hasHydrated: false,

      recordSnapshot: (runId, snapshot) =>
        set((s) => ({ history: recordSnapshotPure(s.history, runId, snapshot) })),

      historyForRun: (runId) => selectHistoryForRun(get().history, runId),

      clearRun: (runId) => set((s) => ({ history: clearRunHistoryPure(s.history, runId) })),

      reset: () => set({ history: [] }),
      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-metrics-history-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ history: s.history }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
