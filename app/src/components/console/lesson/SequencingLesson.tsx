'use client';

import { useMemo, useState } from 'react';
import type { Skill } from '@/curriculum/types';
import {
  gradeSequencing,
  type CauseStep,
  type SequencingDrill,
} from '@/curriculum/drills';
import { LessonFrame, type DrillResult, type LessonPhase } from './LessonFrame';
import {
  CheckIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  XIcon,
} from '../Icon';

/** Deterministic shuffle (no Math.random in render) so SSR + client agree. */
function seededOrder(steps: CauseStep[]): string[] {
  // Fixed presentation order distinct from canonical: reverse, then swap the
  // middle pair. Stable across renders; keeps the puzzle non-trivial.
  const ids = steps.map((s) => s.id);
  const shuffled = [...ids].reverse();
  if (shuffled.length >= 4) {
    [shuffled[1], shuffled[2]] = [shuffled[2], shuffled[1]];
  }
  return shuffled;
}

/**
 * Console lesson body for 5-Whys as a deterministic SEQUENCING drill: order the
 * causes from surface symptom down to the organizational root. Reuses the
 * accessible up/down reorder pattern; CHECK grades against the canonical order
 * and reveals each cause's layer.
 */
export function SequencingLesson({
  skill,
  drill,
  scenarioTag,
}: {
  skill: Skill;
  drill: SequencingDrill;
  scenarioTag: string;
}) {
  const initial = useMemo(() => seededOrder(drill.steps), [drill.steps]);
  const [order, setOrder] = useState<string[]>(initial);

  const stepById = (id: string) =>
    drill.steps.find((s) => s.id === id) as CauseStep;
  const canonicalSlot = (id: string) =>
    drill.steps.findIndex((s) => s.id === id);

  function move(index: number, dir: -1 | 1) {
    setOrder((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function grade(): DrillResult {
    const { correct, total, score, allCorrect } = gradeSequencing(drill, order);
    return {
      correct: allCorrect,
      score,
      headline: allCorrect
        ? 'Surface to root. Nailed it!'
        : `${correct} / ${total} in place`,
      explanation: allCorrect ? (
        <>{drill.insight}</>
      ) : (
        <>
          {correct} of {total} causes are at the right depth. {drill.insight}
        </>
      ),
      detail: (
        <ol className="grid gap-1.5">
          {drill.steps.map((s, i) => (
            <li key={s.id}>
              <b className="font-semibold text-ink">
                Why #{i + 1}: {s.text}
              </b>
              <span className="block text-slate">{s.layer}</span>
            </li>
          ))}
        </ol>
      ),
    };
  }

  return (
    <LessonFrame
      skill={skill}
      scenarioTag={scenarioTag}
      heading={drill.prompt}
      canCheck
      onCheck={grade}
    >
      {(phase: LessonPhase) => {
        const locked = phase !== 'answer';
        return (
          <>
            {/* symptom callout */}
            <div className="mt-[18px] rounded-console-lg border border-bad-line bg-bad-050 p-[14px_16px]">
              <div className="mono text-[10.5px] uppercase tracking-[0.12em] text-bad">
                Symptom to investigate
              </div>
              <p className="mt-1.5 text-[14px] leading-[1.5] text-ink">
                {drill.symptom}
              </p>
            </div>

            <div
              role="list"
              aria-label="Order the causes from surface to root"
              className="mt-[18px] grid gap-2.5"
            >
              {order.map((id, i) => {
                const step = stepById(id);
                const inPlace = locked && canonicalSlot(id) === i;
                const outOfPlace = locked && !inPlace;

                return (
                  <div
                    key={id}
                    role="listitem"
                    className={[
                      'rounded-console border bg-paper p-[13px_15px] transition-[border-color,box-shadow] duration-150',
                      inPlace
                        ? 'border-good shadow-[0_0_0_1px_var(--color-good)_inset]'
                        : outOfPlace
                          ? 'border-bad shadow-[0_0_0_1px_var(--color-bad)_inset]'
                          : 'border-line',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-none flex-col items-center gap-1">
                        <span className="mono whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                          Why {i + 1}
                        </span>
                        {!locked && (
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              aria-label={`Move cause up`}
                              disabled={i === 0}
                              onClick={() => move(i, -1)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-console-sm border border-line bg-panel text-slate transition-colors hover:border-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <TriangleUpIcon size={13} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Move cause down`}
                              disabled={i === order.length - 1}
                              onClick={() => move(i, 1)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-console-sm border border-line bg-panel text-slate transition-colors hover:border-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <TriangleDownIcon size={13} />
                            </button>
                          </div>
                        )}
                        {locked &&
                          (inPlace ? (
                            <CheckIcon size={15} className="text-good" />
                          ) : (
                            <XIcon size={15} className="text-bad" />
                          ))}
                      </div>

                      <div className="min-w-0 flex-auto">
                        <p className="text-[14px] leading-[1.5] text-ink">
                          {step.text}
                        </p>
                        {locked && (
                          <p className="mono mt-1.5 text-[11.5px] text-mute">
                            {step.layer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      }}
    </LessonFrame>
  );
}
