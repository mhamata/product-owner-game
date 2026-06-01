'use client';

import { useState } from 'react';
import { fiveWhysDrill } from '@/curriculum/drills';

/**
 * Library 5-Whys drill. The symptom, canonical chain, and insight come from the
 * shared de-specialized engine. This surface keeps the open-ended "write your
 * own whys → compare with canonical" study model; the deterministic graded
 * variant (order surface → root) lives in the Console loop at
 * /learn/problem-framing.
 */
export function FiveWhysDrill() {
  const canonical = fiveWhysDrill.steps;
  const [answers, setAnswers] = useState<string[]>(() =>
    canonical.map(() => ''),
  );
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-console border border-bad-line bg-bad-050 p-3">
        <div className="mono mb-1 text-[10.5px] uppercase tracking-[0.12em] text-bad">
          Symptom to investigate
        </div>
        <p className="text-[13.5px] text-ink">{fiveWhysDrill.symptom}</p>
      </div>
      <p className="text-[13.5px] text-slate">
        Ask <em>why</em> five times, each time going deeper than the surface
        cause. Stop only when you reach an organizational or systemic root.
      </p>
      <div className="space-y-2">
        {answers.map((a, i) => (
          <div
            key={i}
            className="rounded-console border border-line bg-paper p-3"
          >
            <label
              htmlFor={`why-${i}`}
              className="mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mute"
            >
              Why #{i + 1}
            </label>
            <textarea
              id={`why-${i}`}
              rows={2}
              disabled={revealed}
              value={a}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
              className="mt-1 w-full rounded-console-sm border border-line px-2 py-1 text-[13.5px] text-ink focus:border-accent focus:outline-none disabled:bg-panel"
              placeholder={
                i === 0
                  ? 'Why did the symptom happen?'
                  : 'Why did the previous cause happen?'
              }
            />
            {revealed && (
              <div className="mt-2 rounded-console-sm bg-panel p-2 text-[12px] text-slate">
                <div className="font-semibold text-ink">Canonical</div>
                <p>{canonical[i].text}</p>
                <p className="mt-1 italic text-mute">{canonical[i].layer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          disabled={answers.some((a) => a.trim().length < 5)}
          className="mono w-full rounded-console bg-accent py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-faint"
        >
          Compare with canonical answer
        </button>
      ) : (
        <div className="rounded-console border border-line bg-paper p-3">
          <p className="text-[13px] text-slate">{fiveWhysDrill.insight}</p>
          <button
            type="button"
            onClick={() => {
              setAnswers(canonical.map(() => ''));
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
