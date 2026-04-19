'use client';

import { useState } from 'react';
import type { Action, GameState } from '@/engine/types';
import type { CapacityRange } from '@/engine/capacity';
import { PBICard } from './PBICard';

export function IterationBacklog({
  state,
  dispatch,
  capacityRange,
  committed,
}: {
  state: GameState;
  dispatch: (a: Action) => void;
  capacityRange: CapacityRange;
  committed: number;
}) {
  const [sprintGoal, setSprintGoal] = useState(state.sprintGoal ?? '');
  const hasReleaseCard = state.iterationBacklog.some((p) => p.kind === 'release-card');
  const canEdit = state.phase === 'planning';

  return (
    <section className="flex flex-col min-h-0 bg-white rounded-lg border">
      <header className="px-3 py-2 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold">Iteration {state.iterationNumber} — Plan</h2>
        <span className="text-xs text-gray-500">
          {state.iterationBacklog.length} items · {committed} pts
        </span>
      </header>

      <div className="p-3 border-b bg-gray-50">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Sprint Goal
        </label>
        <textarea
          disabled={!canEdit}
          value={sprintGoal}
          onChange={(e) => setSprintGoal(e.target.value)}
          onBlur={() => dispatch({ type: 'set-sprint-goal', goal: sprintGoal })}
          rows={2}
          placeholder="One sentence. Outcome, not output."
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.iterationBacklog.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            Add items from the Product Backlog to plan the iteration.
          </p>
        ) : (
          state.iterationBacklog.map((pbi, i) => (
            <PBICard
              key={`${pbi.id}-${i}`}
              pbi={pbi}
              onClick={() =>
                pbi.kind === 'release-card'
                  ? dispatch({ type: 'place-release-card', index: null })
                  : dispatch({ type: 'remove-from-iteration', pbiId: pbi.id })
              }
              actionLabel="← Remove"
              disabled={!canEdit}
            />
          ))
        )}
      </div>

      <footer className="border-t p-3 bg-gray-50 space-y-2">
        {canEdit && (
          <div className="flex gap-2">
            {!hasReleaseCard ? (
              <button
                onClick={() =>
                  dispatch({
                    type: 'place-release-card',
                    index: state.iterationBacklog.length,
                  })
                }
                className="flex-1 text-xs py-2 border border-green-400 text-green-700 rounded hover:bg-green-50"
              >
                + Add Release Card ({state.tech.releaseCost} pts)
              </button>
            ) : (
              <button
                onClick={() => dispatch({ type: 'place-release-card', index: null })}
                className="flex-1 text-xs py-2 border border-gray-300 text-gray-600 rounded hover:bg-gray-100"
              >
                Remove Release Card
              </button>
            )}
          </div>
        )}

        {state.phase === 'planning' && (
          <button
            onClick={() => {
              dispatch({ type: 'set-sprint-goal', goal: sprintGoal });
              dispatch({ type: 'commit-iteration' });
            }}
            disabled={state.iterationBacklog.length === 0}
            className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Commit Iteration
          </button>
        )}

        {state.phase === 'committed' && (
          <button
            onClick={() => dispatch({ type: 'execute-iteration' })}
            className="w-full py-2 bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
          >
            Execute Iteration →
          </button>
        )}

        {committed > capacityRange.upper && canEdit && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            ⚠ Over-committed. Items may not complete this sprint.
          </p>
        )}
      </footer>
    </section>
  );
}
