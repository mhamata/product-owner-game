'use client';

import { useState } from 'react';

interface Row {
  id: string;
  name: string;
  value: number;
  timeCriticality: number;
  riskReduction: number;
  size: number;
  reasoning: string;
}

const ITEMS: Row[] = [
  {
    id: 'ciro-audit',
    name: 'CIRO Audit Prep (Trade Surveillance)',
    value: 8,
    timeCriticality: 13,
    riskReduction: 8,
    size: 13,
    reasoning: 'Hard Q3 deadline. Audit fail = regulatory action. Cost-of-delay is steep.',
  },
  {
    id: 'break-dashboard',
    name: 'Settlement Break Dashboard',
    value: 8,
    timeCriticality: 3,
    riskReduction: 3,
    size: 8,
    reasoning: 'High daily value but no deadline urgency. Small size means it ranks well.',
  },
  {
    id: 'collateral-opt',
    name: 'Auto Collateral Optimizer',
    value: 5,
    timeCriticality: 2,
    riskReduction: 2,
    size: 8,
    reasoning: 'Nice financial savings but no regulatory pressure. Low time criticality.',
  },
  {
    id: 'event-driven-rewrite',
    name: 'Event-Driven Architecture Rewrite',
    value: 13,
    timeCriticality: 2,
    riskReduction: 5,
    size: 21,
    reasoning: 'Huge long-term value but multi-quarter size kills the ratio.',
  },
];

export function WsjfDrill() {
  const [revealed, setRevealed] = useState(false);
  const [guesses, setGuesses] = useState<Record<string, number | null>>({});

  const wsjf = (r: Row) => (r.value + r.timeCriticality + r.riskReduction) / r.size;
  const ranked = [...ITEMS].sort((a, b) => wsjf(b) - wsjf(a));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Score each item. WSJF = (Value + Time Criticality + Risk Reduction) / Size. Fibonacci
        scale: 1, 2, 3, 5, 8, 13.
      </p>
      <div className="space-y-3">
        {ITEMS.map((r) => (
          <div key={r.id} className="bg-white p-3 rounded border">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-sm">{r.name}</h4>
              <div className="text-xs flex items-center gap-2">
                <label className="text-gray-600">Your WSJF:</label>
                <input
                  type="number"
                  step="0.01"
                  value={guesses[r.id] ?? ''}
                  disabled={revealed}
                  onChange={(e) =>
                    setGuesses({ ...guesses, [r.id]: parseFloat(e.target.value) || null })
                  }
                  className="w-20 px-2 py-1 border rounded text-right"
                />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-gray-700">
              <span>Value: <strong>{r.value}</strong></span>
              <span>Time: <strong>{r.timeCriticality}</strong></span>
              <span>Risk: <strong>{r.riskReduction}</strong></span>
              <span>Size: <strong>{r.size}</strong></span>
            </div>
            {revealed && (
              <div className="mt-2 text-sm bg-blue-50 p-2 rounded font-mono">
                ({r.value} + {r.timeCriticality} + {r.riskReduction}) / {r.size} ={' '}
                <strong>{wsjf(r).toFixed(2)}</strong>
              </div>
            )}
            {revealed && (
              <p className="text-xs text-gray-600 mt-1">{r.reasoning}</p>
            )}
          </div>
        ))}
      </div>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reveal WSJF scores
        </button>
      ) : (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-sm mb-2">Correct ranking</h4>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            {ranked.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong> — WSJF {wsjf(r).toFixed(2)}
              </li>
            ))}
          </ol>
          <div className="mt-3 text-xs text-gray-700 bg-amber-50 border border-amber-200 p-2 rounded">
            <strong>Key insight:</strong> The event-driven rewrite has the highest raw value (13)
            but its enormous size (21) tanks the ratio. WSJF\'s gift is revealing that small-but-urgent
            work beats large-but-transformative when horizon is short.
          </div>
          <button
            onClick={() => {
              setGuesses({});
              setRevealed(false);
            }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
