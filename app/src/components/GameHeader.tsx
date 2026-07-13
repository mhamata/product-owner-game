'use client';
/**
 * SUPERSEDED: part of the legacy GameView simulation, kept (not deleted) per
 * the repo's no-silent-deletion rule. This is the old simulation's top bar.
 * No route imports this anymore; the Guided Flow sim under
 * src/components/console/sim/ is the live capstone. Safe to remove once the
 * old flow is confirmed retired.
 */

import Link from 'next/link';
import { useState } from 'react';
import type { GameState, Scenario } from '@/engine/types';
import type { CapacityRange } from '@/engine/capacity';
import { cn } from '@/lib/cn';
import { MethodReferenceModal } from './MethodReferenceModal';

const phaseLabel: Record<GameState['phase'], string> = {
  planning: 'Planning',
  committed: 'Committed',
  executing: 'Executing',
  review: 'Review',
  complete: 'Complete',
  // Sim 2.0 W2-C added a 'fired' terminal phase to GameState — see
  // engine/types.ts. This legacy/superseded header (see docblock above) just
  // needs the Record to stay exhaustive; no other change.
  fired: 'Fired',
};

export function GameHeader({
  state,
  scenario,
  capacityRange,
  committed,
}: {
  state: GameState;
  scenario: Scenario;
  capacityRange: CapacityRange;
  committed: number;
}) {
  const [methodsOpen, setMethodsOpen] = useState(false);
  const fillPct = Math.min(
    100,
    (committed / Math.max(capacityRange.upper, 1)) * 100,
  );
  const zone =
    committed <= capacityRange.lower
      ? 'safe'
      : committed <= capacityRange.expected
      ? 'expected'
      : committed <= capacityRange.upper
      ? 'stretch'
      : 'over';

  return (
    <header className="border-b bg-white">
      <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Home
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{scenario.name}</h1>
          <p className="text-xs text-gray-500">
            Iteration {state.iterationNumber} / {state.totalIterations} ·{' '}
            <span className="font-medium text-gray-700">{phaseLabel[state.phase]}</span>
          </p>
        </div>
        <button
          onClick={() => setMethodsOpen(true)}
          className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
          title="Browse PM methods (M)"
        >
          📚 Methods
        </button>
        <div className="flex gap-4 text-xs">
          <Stat label="Morale" value={`${state.team.morale}/10`} />
          <Stat
            label="Tech debt"
            value={`${state.tech.techDebt}`}
            tone={
              state.tech.techDebt >= 70
                ? 'bad'
                : state.tech.techDebt >= 50
                ? 'warn'
                : 'good'
            }
          />
          <Stat
            label="Revenue"
            value={`$${state.economy.revenue.toLocaleString()}`}
          />
        </div>
      </div>

      {methodsOpen && <MethodReferenceModal onClose={() => setMethodsOpen(false)} />}

      <div className="px-4 pb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>
            Committed: <strong>{committed}</strong> pts
          </span>
          <span>
            Capacity: <strong>{capacityRange.lower}</strong>-
            <strong>{capacityRange.upper}</strong> (expected {capacityRange.expected})
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              zone === 'safe' && 'bg-green-400',
              zone === 'expected' && 'bg-blue-500',
              zone === 'stretch' && 'bg-amber-500',
              zone === 'over' && 'bg-red-500',
            )}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  tone = 'good',
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  return (
    <div className="leading-tight text-right">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div
        className={cn(
          'font-semibold',
          tone === 'good' && 'text-gray-900',
          tone === 'warn' && 'text-amber-700',
          tone === 'bad' && 'text-red-700',
        )}
      >
        {value}
      </div>
    </div>
  );
}
