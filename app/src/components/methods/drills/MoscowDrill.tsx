'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  gradeClassification,
  resolveMoscowDrill,
  type MoscowBucket,
} from '@/curriculum/drills';
import { useActiveIndustry } from '@/store/industryStore';

/**
 * Library MoSCoW drill. Buckets + grading come from the shared engine; the item
 * copy is industry-aware (resolves for the home industry, SaaS until the store
 * rehydrates). The correct bucket per item is shared structure. Only the
 * feature names change. The graded Console loop lives at /learn/kano-moscow.
 */
export function MoscowDrill() {
  const industry = useActiveIndustry();
  const moscowDrill = useMemo(() => resolveMoscowDrill(industry), [industry]);
  const [assignments, setAssignments] = useState<
    Record<string, MoscowBucket | undefined>
  >({});
  const [revealed, setRevealed] = useState(false);

  const { correct, total } = gradeClassification(moscowDrill, assignments);
  const allAssigned = moscowDrill.items.every((it) => assignments[it.id]);

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] text-slate">{moscowDrill.prompt}</p>

      <div className="grid grid-cols-2 gap-2 text-[11.5px] md:grid-cols-4">
        {moscowDrill.buckets.map((b) => (
          <div
            key={b.key}
            className="rounded-console border border-line bg-panel p-2"
          >
            <div className="font-semibold text-ink">{b.label}</div>
            <div className="text-mute">{b.description}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {moscowDrill.items.map((it) => {
          const ans = assignments[it.id];
          const isRight = revealed && ans === it.correct;
          const isWrong = revealed && ans != null && !isRight;
          return (
            <div
              key={it.id}
              className={cn(
                'flex items-center gap-3 rounded-console border bg-paper p-2.5',
                revealed && isRight && 'border-good',
                revealed && isWrong && 'border-bad',
                !revealed && 'border-line',
              )}
            >
              <div className="flex-1 text-[13.5px] font-medium text-ink">
                {it.name}
              </div>
              <div className="flex gap-1">
                {moscowDrill.buckets.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    aria-pressed={ans === b.key}
                    aria-label={b.label}
                    disabled={revealed}
                    onClick={() =>
                      setAssignments({ ...assignments, [it.id]: b.key })
                    }
                    className={cn(
                      'mono h-8 w-8 rounded-console-sm border text-[12px] font-semibold',
                      ans === b.key
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-paper text-slate hover:border-faint',
                      revealed && ans !== b.key && 'opacity-40',
                    )}
                  >
                    {b.key}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {revealed && (
        <div className="space-y-2 pt-1">
          {moscowDrill.items
            .filter((it) => assignments[it.id] !== it.correct)
            .map((it) => (
              <div
                key={it.id}
                className="rounded-console-sm border border-line bg-panel p-2 text-[12px] text-slate"
              >
                <b className="font-semibold text-ink">{it.name}</b> → correct:{' '}
                <b className="font-semibold text-good">{it.correct}</b>. {it.why}
              </div>
            ))}
        </div>
      )}

      {!revealed ? (
        <button
          type="button"
          disabled={!allAssigned}
          onClick={() => setRevealed(true)}
          className="mono w-full rounded-console bg-accent py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-faint"
        >
          Reveal answers
        </button>
      ) : (
        <div className="rounded-console border border-line bg-paper p-3">
          <div className="tnum text-[17px] font-semibold text-ink">
            Score: {correct} / {total}
          </div>
          <p className="mt-1 text-[13px] text-slate">{moscowDrill.insight}</p>
          <button
            type="button"
            onClick={() => {
              setAssignments({});
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
