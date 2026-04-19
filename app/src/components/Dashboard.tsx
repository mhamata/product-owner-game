'use client';

import type { GameState } from '@/engine/types';
import { cn } from '@/lib/cn';

function happinessLabel(h: number): string {
  if (h >= 8) return '🤩';
  if (h >= 6) return '🙂';
  if (h >= 4) return '😐';
  if (h >= 2) return '😟';
  return '😡';
}

function engagementColor(state: string): string {
  switch (state) {
    case 'champion':
    case 'advocate':
      return 'text-emerald-700';
    case 'active':
      return 'text-blue-700';
    case 'interested':
      return 'text-indigo-600';
    case 'dormant':
      return 'text-gray-500';
    case 'disengaged':
      return 'text-amber-700';
    case 'churned':
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
}

export function Dashboard({ state }: { state: GameState }) {
  return (
    <section className="flex flex-col min-h-0 bg-white rounded-lg border overflow-hidden">
      <header className="px-3 py-2 border-b">
        <h2 className="text-sm font-semibold">Dashboard</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
        <div>
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2">
            Customers
          </h3>
          <ul className="space-y-1.5">
            {Object.values(state.customers).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border-b border-gray-100 pb-1"
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className={cn('text-[10px] uppercase', engagementColor(c.engagementState))}>
                    {c.engagementState}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-lg leading-none">{happinessLabel(c.happiness)}</div>
                  <div className="text-[10px] text-gray-500">{c.happiness}/10</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2">
            Stakeholders
          </h3>
          <ul className="space-y-1.5">
            {Object.values(state.stakeholders).map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-xs">{s.name}</div>
                  <div className="text-[10px] text-gray-500">{s.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">{s.trust}/10</div>
                  <div className="text-[10px] text-gray-500">trust</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2">
            Team
          </h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <span className="text-gray-600">Headcount</span>
            <span className="text-right font-medium">{state.team.headcount}</span>
            <span className="text-gray-600">Morale</span>
            <span className="text-right font-medium">{state.team.morale}/10</span>
            <span className="text-gray-600">Onboarding</span>
            <span className="text-right font-medium">{state.team.onboarding}</span>
            {state.team.burnoutFlag && (
              <span className="col-span-2 text-red-600 font-medium">⚠ Burnout risk</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2">
            Platform
          </h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <span className="text-gray-600">Tech debt</span>
            <span className="text-right font-medium">{state.tech.techDebt}/100</span>
            <span className="text-gray-600">Release cost</span>
            <span className="text-right font-medium">{state.tech.releaseCost} pts</span>
            <span className="text-gray-600">Reliability</span>
            <span className="text-right font-medium">{state.tech.reliability}/10</span>
            {state.tech.investmentsDone.length > 0 && (
              <div className="col-span-2 text-[10px] text-emerald-700 mt-1">
                ✓ {state.tech.investmentsDone.join(', ')}
              </div>
            )}
          </div>
        </div>

        {state.eventLog.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-2">
              Recent Events
            </h3>
            <ul className="space-y-1.5 text-xs">
              {state.eventLog.slice(-5).reverse().map((e, i) => (
                <li key={i} className="border-l-2 border-gray-300 pl-2">
                  <div className="text-[10px] text-gray-500">Iter {e.iteration}</div>
                  <div className="text-gray-700 line-clamp-2">{e.summary}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
