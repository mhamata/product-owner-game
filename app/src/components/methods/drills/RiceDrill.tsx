'use client';

import { useMemo, useState } from 'react';
import { rankRows, resolveRiceDrill } from '@/curriculum/drills';
import { useActiveIndustry } from '@/store/industryStore';

/**
 * Library RICE drill. Content + scoring come from the shared drill engine
 * (src/curriculum/drills) so /methods and /learn stay in sync. The content is
 * industry-aware: it resolves for the learner's home industry (hydration-safe;
 * SaaS until the store rehydrates). The reach/impact/confidence/effort numbers
 * — and the correct ranking — are shared structure, so only the feature names
 * change. This surface keeps the "enter your scores → reveal" study model; the
 * graded Console loop lives at /learn/rice.
 */
export function RiceDrill() {
  const industry = useActiveIndustry();
  const riceDrill = useMemo(() => resolveRiceDrill(industry), [industry]);
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  const ranked = rankRows(riceDrill);

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] text-slate">{riceDrill.prompt}</p>
      <p className="mono text-[12px] text-mute">Formula · {riceDrill.formula}</p>

      <div className="space-y-3">
        {riceDrill.rows.map((r) => (
          <div
            key={r.id}
            className="rounded-console border border-line bg-paper p-3"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <h4 className="text-[14px] font-semibold text-ink">{r.name}</h4>
              <div className="flex items-center gap-2 text-[12px]">
                <label htmlFor={`rice-${r.id}`} className="text-mute">
                  Your score
                </label>
                <input
                  id={`rice-${r.id}`}
                  type="number"
                  step="0.1"
                  className="tnum w-20 rounded-console-sm border border-line px-2 py-1 text-right text-ink focus:border-accent focus:outline-none disabled:bg-panel"
                  value={guesses[r.id] ?? ''}
                  onChange={(e) =>
                    setGuesses({ ...guesses, [r.id]: e.target.value })
                  }
                  disabled={revealed}
                />
              </div>
            </div>
            <p className="text-[12px] text-slate">{r.context}</p>
            <div className="mono mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-mute sm:grid-cols-4">
              <span>
                Reach <b className="font-semibold text-ink-2">{r.factors.reach.toLocaleString()}</b>
              </span>
              <span>
                Impact <b className="font-semibold text-ink-2">{r.factors.impact}</b>
              </span>
              <span>
                Conf <b className="font-semibold text-ink-2">{Math.round(r.factors.confidence * 100)}%</b>
              </span>
              <span>
                Effort <b className="font-semibold text-ink-2">{r.factors.effort} pm</b>
              </span>
            </div>
            {revealed && (
              <div className="mono mt-2 rounded-console-sm bg-accent-050 p-2 text-[12.5px] text-ink-2">
                ({r.factors.reach} × {r.factors.impact} × {r.factors.confidence}) /{' '}
                {r.factors.effort} ={' '}
                <b className="font-semibold text-accent">
                  {riceDrill.score(r).toFixed(1)}
                </b>
              </div>
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
          Reveal scores
        </button>
      ) : (
        <div className="rounded-console border border-line bg-paper p-3">
          <h4 className="mb-2 text-[13.5px] font-semibold text-ink">
            Correct ranking
          </h4>
          <ol className="list-decimal space-y-1 pl-5 text-[13.5px] text-ink-2">
            {ranked.map((r) => (
              <li key={r.id}>
                <b className="font-semibold text-ink">{r.name}</b> — RICE{' '}
                {riceDrill.score(r).toFixed(1)}
              </li>
            ))}
          </ol>
          <div className="mt-3 rounded-console-sm border border-line bg-panel p-2.5 text-[12px] text-slate">
            <b className="font-semibold text-ink">Senior PM insight:</b>{' '}
            {riceDrill.insight}
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
