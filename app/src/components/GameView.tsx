'use client';
/**
 * SUPERSEDED — part of the legacy GameView simulation, kept (not deleted) per
 * the repo's no-silent-deletion rule. This is the old 3-column simulation root;
 * /play now renders the Guided Flow stepper
 * (src/components/console/sim/SimRunner.tsx) instead.
 * No route imports this anymore; the Guided Flow sim under
 * src/components/console/sim/ is the live capstone. Safe to remove once the
 * old flow is confirmed retired.
 */

import Link from 'next/link';
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getScenario } from '@/scenarios';
import { calculateCapacityRange } from '@/engine/capacity';
import { calculateScore } from '@/engine/score';
import { useHydrated } from './console/sim/useHydrated';
import { GameHeader } from './GameHeader';
import { ProductBacklog } from './ProductBacklog';
import { IterationBacklog } from './IterationBacklog';
import { Dashboard } from './Dashboard';
import { ReviewPanel } from './ReviewPanel';
import { EventModal } from './EventModal';
import { EndGamePanel } from './EndGamePanel';

export function GameView({ scenarioId }: { scenarioId: string }) {
  const { state, scenarioId: currentId, newGame, dispatch } = useGameStore();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && (!state || currentId !== scenarioId)) {
      newGame(scenarioId);
    }
  }, [hydrated, state, currentId, scenarioId, newGame]);

  if (!hydrated || !state) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return (
      <main className="flex-1 p-8">
        <p>Unknown scenario.</p>
        <Link href="/" className="text-blue-600 underline">
          Back
        </Link>
      </main>
    );
  }

  const capacityRange = calculateCapacityRange(state);
  const committed = state.iterationBacklog.reduce(
    (sum, p) => sum + (p.effortRevealed ?? p.effort),
    0,
  );
  const score = state.phase === 'complete' ? calculateScore(state, scenario) : null;

  const pendingEventId = state.pendingEvents[0] ?? null;
  const pendingEvent = pendingEventId
    ? scenario.eventDeck.find((e) => e.id === pendingEventId) ?? null
    : null;

  return (
    <main className="flex-1 flex flex-col">
      <GameHeader
        state={state}
        scenario={scenario}
        capacityRange={capacityRange}
        committed={committed}
      />

      {state.phase === 'complete' && score && (
        <EndGamePanel state={state} scenario={scenario} score={score} />
      )}

      {state.phase !== 'complete' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,360px)] gap-4 p-4">
          <div className="flex flex-col min-h-0">
            <ProductBacklog state={state} dispatch={dispatch} />
          </div>
          <div className="flex flex-col min-h-0">
            {state.phase === 'planning' || state.phase === 'committed' ? (
              <IterationBacklog
                state={state}
                dispatch={dispatch}
                capacityRange={capacityRange}
                committed={committed}
              />
            ) : (
              <ReviewPanel state={state} scenario={scenario} dispatch={dispatch} />
            )}
          </div>
          <div className="flex flex-col min-h-0">
            <Dashboard state={state} />
          </div>
        </div>
      )}

      {pendingEvent && (
        <EventModal event={pendingEvent} dispatch={dispatch} />
      )}
    </main>
  );
}
