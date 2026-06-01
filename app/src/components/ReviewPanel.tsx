'use client';
/**
 * SUPERSEDED — part of the legacy GameView simulation, kept (not deleted) per
 * the repo's no-silent-deletion rule. This is the old simulation's review panel — replaced by the Ship/Outcome steps.
 * No route imports this anymore; the Guided Flow sim under
 * src/components/console/sim/ is the live capstone. Safe to remove once the
 * old flow is confirmed retired.
 */

import type { Action, GameState, Scenario } from '@/engine/types';
import { cn } from '@/lib/cn';

export function ReviewPanel({
  state,
  scenario,
  dispatch,
}: {
  state: GameState;
  scenario: Scenario;
  dispatch: (a: Action) => void;
}) {
  const o = state.lastOutcome;
  if (!o) {
    return (
      <section className="flex flex-col min-h-0 bg-white rounded-lg border p-4">
        <p className="text-sm text-gray-500">No outcome yet.</p>
      </section>
    );
  }

  const hasPendingEvents = state.pendingEvents.length > 0;

  return (
    <section className="flex flex-col min-h-0 bg-white rounded-lg border">
      <header className="px-3 py-2 border-b">
        <h2 className="text-sm font-semibold">Iteration {o.iteration} — Review</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Metric
            label="Velocity"
            value={`${o.capacityRolled} pts`}
            sub={`range ${o.capacityRange.lower}–${o.capacityRange.upper}`}
          />
          <Metric
            label="Shipped"
            value={`${o.done.length} items`}
            sub={`${o.notDone.length} returned`}
          />
          <Metric
            label="Revenue"
            value={`+$${o.revenueEarned.toLocaleString()}`}
            tone={o.revenueEarned > 0 ? 'good' : undefined}
          />
          <Metric
            label="Tech debt"
            value={`${o.techDebtDelta >= 0 ? '+' : ''}${o.techDebtDelta}`}
            tone={o.techDebtDelta > 0 ? 'bad' : 'good'}
          />
        </div>

        {o.releasedProducts.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="text-xs font-semibold text-green-900 mb-1">🚀 Released</div>
            <div className="text-sm">{o.releasedProducts.join(', ')}</div>
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Done</h3>
          {o.done.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Nothing shipped.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {o.done.map((p, i) => (
                <li key={i} className="flex justify-between border-b border-gray-100 pb-0.5">
                  <span>{p.title}</span>
                  <span className="text-gray-500">{p.effortRevealed ?? p.effort} pts</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {o.notDone.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Not Done</h3>
            <ul className="space-y-1 text-xs">
              {o.notDone.map((p, i) => (
                <li key={i} className="flex justify-between border-b border-gray-100 pb-0.5 text-gray-600">
                  <span>{p.title}</span>
                  <span>{p.effortRevealed ?? p.effort} pts →backlog</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Object.entries(o.happinessDeltas).some(([, d]) => d !== 0) && (
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
              Customer Reaction
            </h3>
            <ul className="text-xs space-y-0.5">
              {Object.entries(o.happinessDeltas)
                .filter(([, d]) => d !== 0)
                .map(([id, d]) => (
                  <li key={id} className="flex justify-between">
                    <span>{state.customers[id]?.name ?? id}</span>
                    <span
                      className={cn(
                        'font-medium',
                        d > 0 ? 'text-green-700' : 'text-red-700',
                      )}
                    >
                      {d > 0 ? '+' : ''}
                      {d}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {hasPendingEvents && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
            ⚡ {state.pendingEvents.length} event
            {state.pendingEvents.length > 1 ? 's' : ''} pending — respond before advancing.
          </div>
        )}
      </div>

      <footer className="border-t p-3 bg-gray-50">
        <button
          onClick={() => dispatch({ type: 'advance-iteration' })}
          disabled={hasPendingEvents}
          className="w-full py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.iterationNumber >= scenario.totalIterations
            ? 'Finish Game →'
            : 'Next Iteration →'}
        </button>
      </footer>
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <div className="p-2 bg-gray-50 rounded border">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div
        className={cn(
          'text-sm font-semibold',
          tone === 'good' && 'text-green-700',
          tone === 'bad' && 'text-red-700',
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-gray-500">{sub}</div>}
    </div>
  );
}
