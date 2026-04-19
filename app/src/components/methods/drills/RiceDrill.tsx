'use client';

import { useState } from 'react';

interface Row {
  id: string;
  name: string;
  context: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
}

const SCENARIOS: Row[] = [
  {
    id: 'tfsa',
    name: 'TFSA Account Support',
    context: '15,000 Canadian users/qtr want this · table-stakes feature · survey data is solid',
    reach: 15000,
    impact: 3,
    confidence: 0.8,
    effort: 12,
  },
  {
    id: 'fractional',
    name: 'Fractional Shares',
    context: '8,000 young investors/qtr · strong signal but mostly from Reddit, not user research',
    reach: 8000,
    impact: 2,
    confidence: 0.5,
    effort: 6,
  },
  {
    id: 'level2',
    name: 'Level 2 Data',
    context: '3,000 active traders/qtr · burns $180K/qtr in market-data fees',
    reach: 3000,
    impact: 2,
    confidence: 0.8,
    effort: 4,
  },
];

export function RiceDrill() {
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  function rice(r: Row) {
    return (r.reach * r.impact * r.confidence) / r.effort;
  }

  const correctRanking = [...SCENARIOS].sort((a, b) => rice(b) - rice(a));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Three Moomoo Canada features. Calculate the RICE score for each, then rank them 1-3.
      </p>
      <div className="space-y-3">
        {SCENARIOS.map((r) => (
          <div key={r.id} className="bg-white p-3 rounded border">
            <div className="flex items-center justify-between mb-1 gap-3">
              <h4 className="font-semibold text-sm">{r.name}</h4>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-gray-600">Your score:</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-20 px-2 py-1 border rounded text-right"
                  value={guesses[r.id] ?? ''}
                  onChange={(e) => setGuesses({ ...guesses, [r.id]: e.target.value })}
                  disabled={revealed}
                />
              </div>
            </div>
            <p className="text-xs text-gray-600">{r.context}</p>
            <div className="mt-2 text-xs grid grid-cols-4 gap-2 text-gray-700">
              <span>Reach: <strong>{r.reach.toLocaleString()}</strong></span>
              <span>Impact: <strong>{r.impact}</strong></span>
              <span>Conf: <strong>{r.confidence * 100}%</strong></span>
              <span>Effort: <strong>{r.effort} pm</strong></span>
            </div>
            {revealed && (
              <div className="mt-2 text-sm font-mono bg-blue-50 p-2 rounded">
                RICE = ({r.reach} × {r.impact} × {r.confidence}) / {r.effort} ={' '}
                <strong>{rice(r).toFixed(1)}</strong>
              </div>
            )}
          </div>
        ))}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reveal scores
        </button>
      ) : (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-sm mb-2">Correct ranking</h4>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            {correctRanking.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong> — RICE {rice(r).toFixed(1)}
              </li>
            ))}
          </ol>
          <div className="mt-3 text-xs text-gray-700 bg-amber-50 border border-amber-200 p-2 rounded">
            <strong>Senior PM insight:</strong> Fractional shares has the worst confidence (0.5) —
            this is the factor most teams inflate to rescue pet features. Notice how halving it
            drops the score dramatically. In the interview, discuss confidence explicitly.
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
