'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import {
  gradeClassification,
  kanoDrill,
  type KanoCategory,
} from '@/curriculum/drills';

/**
 * Library Kano drill. Items + categories + grading come from the shared
 * de-specialized engine; the graded Console loop lives at /learn/kano-moscow.
 */
export function KanoDrill() {
  const [assignments, setAssignments] = useState<
    Record<string, KanoCategory | undefined>
  >({});
  const [revealed, setRevealed] = useState(false);

  const { correct, total } = gradeClassification(kanoDrill, assignments);
  const allAssigned = kanoDrill.items.every((it) => assignments[it.id]);

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] text-slate">{kanoDrill.prompt}</p>

      <div className="grid grid-cols-2 gap-2 text-[11.5px] md:grid-cols-4">
        {kanoDrill.buckets.map((c) => (
          <div
            key={c.key}
            className="rounded-console border border-line bg-panel p-2"
          >
            <div className="font-semibold text-ink">{c.label}</div>
            <div className="text-mute">{c.description}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {kanoDrill.items.map((it) => {
          const ans = assignments[it.id];
          const isRight = revealed && ans === it.correct;
          const isWrong = revealed && ans != null && !isRight;
          return (
            <div
              key={it.id}
              className={cn(
                'rounded-console border bg-paper p-2.5',
                revealed && isRight && 'border-good',
                revealed && isWrong && 'border-bad',
                !revealed && 'border-line',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13.5px] font-medium text-ink">
                  {it.name}
                </div>
                <div className="flex flex-wrap gap-1">
                  {kanoDrill.buckets.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={ans === c.key}
                      disabled={revealed}
                      onClick={() =>
                        setAssignments({ ...assignments, [it.id]: c.key })
                      }
                      className={cn(
                        'mono rounded-console-sm border px-2 py-1 text-[10.5px] font-semibold',
                        ans === c.key
                          ? 'border-accent bg-accent text-white'
                          : 'border-line bg-paper text-slate hover:border-faint',
                        revealed && ans !== c.key && 'opacity-40',
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {revealed && (
                <div className="mt-1.5 text-[12px] text-slate">
                  <b className="font-semibold text-good">{it.correct}:</b>{' '}
                  {it.why}
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
          <p className="mt-1 text-[13px] text-slate">{kanoDrill.insight}</p>
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
