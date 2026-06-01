'use client';

import { useState } from 'react';
import { rankRows, wsjfDrill } from '@/curriculum/drills';

/**
 * Library WSJF drill. Content + scoring come from the shared de-specialized
 * drill engine; the graded Console loop lives at /learn/cost-of-delay.
 */
export function WsjfDrill() {
  const [revealed, setRevealed] = useState(false);
  const [guesses, setGuesses] = useState<Record<string, string>>({});

  const ranked = rankRows(wsjfDrill);

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] text-slate">{wsjfDrill.prompt}</p>
      <p className="mono text-[12px] text-mute">
        Formula · {wsjfDrill.formula} · Fibonacci 1, 2, 3, 5, 8, 13, 21
      </p>

      <div className="space-y-3">
        {wsjfDrill.rows.map((r) => (
          <div
            key={r.id}
            className="rounded-console border border-line bg-paper p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[14px] font-semibold text-ink">{r.name}</h4>
              <div className="flex items-center gap-2 text-[12px]">
                <label htmlFor={`wsjf-${r.id}`} className="text-mute">
                  Your WSJF
                </label>
                <input
                  id={`wsjf-${r.id}`}
                  type="number"
                  step="0.01"
                  value={guesses[r.id] ?? ''}
                  disabled={revealed}
                  onChange={(e) =>
                    setGuesses({ ...guesses, [r.id]: e.target.value })
                  }
                  className="tnum w-20 rounded-console-sm border border-line px-2 py-1 text-right text-ink focus:border-accent focus:outline-none disabled:bg-panel"
                />
              </div>
            </div>
            <p className="mt-1 text-[12px] text-slate">{r.context}</p>
            <div className="mono mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-mute sm:grid-cols-4">
              <span>
                Value <b className="font-semibold text-ink-2">{r.factors.value}</b>
              </span>
              <span>
                Time <b className="font-semibold text-ink-2">{r.factors.time}</b>
              </span>
              <span>
                Risk <b className="font-semibold text-ink-2">{r.factors.risk}</b>
              </span>
              <span>
                Size <b className="font-semibold text-ink-2">{r.factors.size}</b>
              </span>
            </div>
            {revealed && (
              <>
                <div className="mono mt-2 rounded-console-sm bg-accent-050 p-2 text-[12.5px] text-ink-2">
                  ({r.factors.value} + {r.factors.time} + {r.factors.risk}) /{' '}
                  {r.factors.size} ={' '}
                  <b className="font-semibold text-accent">
                    {wsjfDrill.score(r).toFixed(2)}
                  </b>
                </div>
                <p className="mt-1.5 text-[12px] text-slate">{r.reasoning}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mono w-full rounded-console bg-accent py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-accent-700"
        >
          Reveal WSJF scores
        </button>
      ) : (
        <div className="rounded-console border border-line bg-paper p-3">
          <h4 className="mb-2 text-[13.5px] font-semibold text-ink">
            Correct ranking
          </h4>
          <ol className="list-decimal space-y-1 pl-5 text-[13.5px] text-ink-2">
            {ranked.map((r) => (
              <li key={r.id}>
                <b className="font-semibold text-ink">{r.name}</b> — WSJF{' '}
                {wsjfDrill.score(r).toFixed(2)}
              </li>
            ))}
          </ol>
          <div className="mt-3 rounded-console-sm border border-line bg-panel p-2.5 text-[12px] text-slate">
            <b className="font-semibold text-ink">Key insight:</b>{' '}
            {wsjfDrill.insight}
          </div>
          <button
            type="button"
            onClick={() => {
              setGuesses({});
              setRevealed(false);
            }}
            className="mono mt-3 text-[12px] text-accent underline underline-offset-2 hover:text-accent-700"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
