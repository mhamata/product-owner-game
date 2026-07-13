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
      tally: { correct, total },
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
              <b className="font-semibold text-[var(--px-ink)]">
                Why #{i + 1}: {s.text}
              </b>
              <span className="block text-[var(--px-dim)]">{s.layer}</span>
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
            <div className="mt-[18px] rounded-[14px] border border-[var(--px-crit)] bg-[color-mix(in_srgb,var(--px-crit)_10%,transparent)] p-[14px_16px]">
              <div className="mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--px-crit)]">
                Symptom to investigate
              </div>
              <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--px-ink)]">
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
                      'rounded-[14px] border bg-[var(--px-card)] p-[13px_15px] transition-[border-color,box-shadow] duration-150',
                      inPlace
                        ? 'border-[var(--px-good)] shadow-[0_0_0_1px_var(--px-good)_inset]'
                        : outOfPlace
                          ? 'border-[var(--px-crit)] shadow-[0_0_0_1px_var(--px-crit)_inset]'
                          : 'border-[var(--px-line)]',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-none flex-col items-center gap-1">
                        <span className="mono whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--px-dimmer)]">
                          Why {i + 1}
                        </span>
                        {!locked && (
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              aria-label={`Move cause up`}
                              disabled={i === 0}
                              onClick={() => move(i, -1)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-[8px] border border-[var(--px-line)] bg-[var(--px-raised)] text-[var(--px-dim)] transition-colors hover:border-[var(--px-line-strong)] hover:text-[var(--px-ink)] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <TriangleUpIcon size={13} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Move cause down`}
                              disabled={i === order.length - 1}
                              onClick={() => move(i, 1)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-[8px] border border-[var(--px-line)] bg-[var(--px-raised)] text-[var(--px-dim)] transition-colors hover:border-[var(--px-line-strong)] hover:text-[var(--px-ink)] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <TriangleDownIcon size={13} />
                            </button>
                          </div>
                        )}
                        {locked &&
                          (inPlace ? (
                            <span
                              role="status"
                              className="motion-safe:animate-[stampIn_180ms_cubic-bezier(0.2,1.4,0.4,1)_forwards] inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--px-good)] text-[var(--px-good)]"
                            >
                              <CheckIcon size={12} />
                            </span>
                          ) : (
                            <span
                              role="status"
                              className="motion-safe:animate-[stampIn_180ms_cubic-bezier(0.2,1.4,0.4,1)_forwards] inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--px-crit)] text-[var(--px-crit)]"
                            >
                              <XIcon size={12} />
                            </span>
                          ))}
                      </div>

                      <div className="min-w-0 flex-auto">
                        <p className="text-[14px] leading-[1.5] text-[var(--px-ink)]">
                          {step.text}
                        </p>
                        {locked && (
                          <p className="mono mt-1.5 text-[11.5px] text-[var(--px-dimmer)]">
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
