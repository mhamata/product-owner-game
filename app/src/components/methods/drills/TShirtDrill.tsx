'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  gradeSizing,
  resolveTshirtDrill,
  TSHIRT_SIZES,
  type TShirtSize,
} from '@/curriculum/drills';
import { useActiveIndustry } from '@/store/industryStore';

/**
 * Library T-shirt sizing drill. Grading + the size legend come from the shared
 * engine; the story copy is industry-aware (resolves for the home industry,
 * SaaS until the store rehydrates). The correct size per story is shared
 * structure. Only the story titles change. The graded Console loop lives at
 * /learn/estimation.
 */
export function TShirtDrill() {
  const industry = useActiveIndustry();
  const tshirtDrill = useMemo(() => resolveTshirtDrill(industry), [industry]);
  const [guesses, setGuesses] = useState<Record<string, TShirtSize | undefined>>(
    {},
  );
  const [revealed, setRevealed] = useState(false);

  const { correct, total } = gradeSizing(tshirtDrill, guesses);
  const allAssigned = tshirtDrill.stories.every((st) => guesses[st.id]);

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] text-slate">{tshirtDrill.prompt}</p>
      <p className="mono text-[12px] text-mute">{tshirtDrill.legend}</p>

      <div className="space-y-3">
        {tshirtDrill.stories.map((st) => {
          const ans = guesses[st.id];
          const isRight = revealed && ans === st.correct;
          const isWrong = revealed && ans != null && !isRight;
          return (
            <div
              key={st.id}
              className={cn(
                'rounded-console border bg-paper p-3',
                revealed && isRight && 'border-good',
                revealed && isWrong && 'border-bad',
                !revealed && 'border-line',
              )}
            >
              <h4 className="text-[14px] font-semibold text-ink">{st.title}</h4>
              <p className="mt-0.5 text-[12px] text-slate">{st.description}</p>
              <div className="mt-2 flex gap-1">
                {TSHIRT_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={ans === s}
                    disabled={revealed}
                    onClick={() => setGuesses({ ...guesses, [st.id]: s })}
                    className={cn(
                      'mono rounded-console-sm border px-3 py-1 text-[12px] font-semibold',
                      ans === s
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-paper text-slate hover:border-faint',
                      revealed && ans !== s && 'opacity-40',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {revealed && (
                <div className="mt-2 text-[12px] text-slate">
                  <b className="font-semibold text-good">{st.correct}:</b>{' '}
                  {st.why}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!revealed ? (
        <button
          type="button"
          disabled={!allAssigned}
          onClick={() => setRevealed(true)}
          className="mono w-full rounded-console bg-accent py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-faint"
        >
          Reveal
        </button>
      ) : (
        <div className="rounded-console border border-line bg-paper p-3">
          <div className="tnum text-[17px] font-semibold text-ink">
            Score: {correct} / {total}
          </div>
          <p className="mt-1 text-[13px] text-slate">{tshirtDrill.insight}</p>
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
