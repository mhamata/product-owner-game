'use client';
/**
 * SUPERSEDED: part of the legacy GameView simulation, kept (not deleted) per
 * the repo's no-silent-deletion rule. This is the old end-game panel, replaced by sim/SimEndPanel.tsx (Console-styled).
 * No route imports this anymore; the Guided Flow sim under
 * src/components/console/sim/ is the live capstone. Safe to remove once the
 * old flow is confirmed retired.
 */

import Link from 'next/link';
import { useState } from 'react';
import type { GameState, Scenario } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { useGameStore } from '@/store/gameStore';

export function EndGamePanel({
  state,
  scenario,
  score,
}: {
  state: GameState;
  scenario: Scenario;
  score: GameScore;
}) {
  const { newGame } = useGameStore();
  const [retro, setRetro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateRetro() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/retro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, scenarioId: scenario.id, score }),
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setRetro(data.retro);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Game Complete</h1>
          <p className="text-gray-600 mt-1">
            {scenario.name} · {state.totalIterations} iterations
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ScoreTile label="Value Delivered" value={score.valueDelivered} />
          <ScoreTile label="Customer Loyalty" value={score.customerLoyalty} />
          <ScoreTile label="Team Health" value={score.teamHealth} />
          <ScoreTile label="Stakeholder Trust" value={score.stakeholderTrust} />
          <ScoreTile label="Product Integrity" value={score.productIntegrity} />
        </section>

        <section className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm text-blue-900 font-medium">Total Score</div>
          <div className="text-4xl font-bold text-blue-900">{score.total.toFixed(1)}</div>
          <div className="text-xs text-blue-900 mt-1">
            Revenue delivered: ${state.economy.revenue.toLocaleString()} / ${scenario.targetRevenue.toLocaleString()}
          </div>
        </section>

        <section className="p-4 bg-white border rounded">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">AI Retrospective</h2>
            {!retro && (
              <button
                onClick={generateRetro}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Generating…' : 'Generate'}
              </button>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
              Failed: {error}
            </p>
          )}
          {retro ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{retro}</div>
          ) : !loading ? (
            <p className="text-sm text-gray-500">
              Requires <code className="bg-gray-100 px-1">ANTHROPIC_API_KEY</code> in{' '}
              <code className="bg-gray-100 px-1">.env.local</code>.
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Decision Log</h2>
          <ul className="space-y-1 text-sm">
            {state.eventLog.map((e, i) => (
              <li key={i} className="border-l-2 border-gray-300 pl-3 py-1">
                <div className="text-xs text-gray-500">Iter {e.iteration} · {e.eventId}</div>
                <div className="text-gray-800">{e.summary}</div>
              </li>
            ))}
            {state.eventLog.length === 0 && (
              <li className="text-gray-500 italic text-sm">No decisions logged.</li>
            )}
          </ul>
        </section>

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => newGame(scenario.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Play again
          </button>
          <Link href="/" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 70 ? 'bg-green-50 border-green-200 text-green-900' :
    value >= 40 ? 'bg-amber-50 border-amber-200 text-amber-900' :
    'bg-red-50 border-red-200 text-red-900';
  return (
    <div className={`p-3 border rounded ${tone}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-xl font-bold">{value.toFixed(0)}</div>
    </div>
  );
}
