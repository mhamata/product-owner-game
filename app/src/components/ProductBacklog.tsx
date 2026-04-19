'use client';

import type { Action, GameState } from '@/engine/types';
import { PBICard } from './PBICard';

export function ProductBacklog({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (a: Action) => void;
}) {
  const canAdd = state.phase === 'planning';
  return (
    <section className="flex flex-col min-h-0 bg-gray-50 rounded-lg border">
      <header className="px-3 py-2 border-b bg-white rounded-t-lg flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Product Backlog</h2>
          {state.newlyDiscoveredIds.length > 0 && (
            <p className="text-[10px] text-amber-700 font-medium">
              {state.newlyDiscoveredIds.length} new item
              {state.newlyDiscoveredIds.length > 1 ? 's' : ''} this iter
            </p>
          )}
        </div>
        <span className="text-xs text-gray-500">{state.productBacklog.length} items</span>
      </header>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.productBacklog.length === 0 ? (
          <p className="text-xs text-gray-500 italic">All items moved to iteration.</p>
        ) : (
          state.productBacklog.map((pbi) => (
            <PBICard
              key={pbi.id}
              pbi={pbi}
              onClick={() => dispatch({ type: 'add-to-iteration', pbiId: pbi.id })}
              actionLabel="Add →"
              disabled={!canAdd}
              isNew={state.newlyDiscoveredIds.includes(pbi.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
