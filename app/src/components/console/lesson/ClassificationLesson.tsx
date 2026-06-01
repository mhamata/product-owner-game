'use client';

import { useState } from 'react';
import type { Skill } from '@/curriculum/types';
import {
  gradeClassification,
  type ClassificationDrill,
} from '@/curriculum/drills';
import { LessonFrame, type DrillResult, type LessonPhase } from './LessonFrame';
import { CheckIcon, XIcon } from '../Icon';

/**
 * Console lesson body for classification drills (MoSCoW, Kano): the learner
 * assigns every item to a bucket, then CHECK grades all at once. Correctness is
 * revealed per item with an icon + text label (never colour alone), and the
 * feedback bar explains every miss.
 */
export function ClassificationLesson<K extends string>({
  skill,
  drill,
  scenarioTag,
}: {
  skill: Skill;
  drill: ClassificationDrill<K>;
  scenarioTag: string;
}) {
  const [assignments, setAssignments] = useState<Record<string, K | undefined>>(
    {},
  );

  const allAssigned = drill.items.every((it) => assignments[it.id]);

  function assign(itemId: string, bucket: K) {
    setAssignments((prev) => ({ ...prev, [itemId]: bucket }));
  }

  function grade(): DrillResult {
    const { correct, total, score, allCorrect } = gradeClassification(
      drill,
      assignments,
    );
    const misses = drill.items.filter((it) => assignments[it.id] !== it.correct);

    return {
      correct: allCorrect,
      score,
      headline: allCorrect ? 'All correct!' : `${correct} / ${total} correct`,
      explanation: allCorrect ? (
        <>{drill.insight}</>
      ) : (
        <>
          You placed{' '}
          <b className="font-semibold text-ink">
            {correct} of {total}
          </b>{' '}
          correctly. {drill.insight}
        </>
      ),
      detail:
        misses.length > 0 ? (
          <ul className="grid gap-2">
            {misses.map((it) => {
              const label = drill.buckets.find((b) => b.key === it.correct)?.label;
              return (
                <li key={it.id}>
                  <b className="font-semibold text-ink">{it.name}</b> →{' '}
                  <span className="text-good">{label}</span>. {it.why}
                </li>
              );
            })}
          </ul>
        ) : undefined,
    };
  }

  return (
    <LessonFrame
      skill={skill}
      scenarioTag={scenarioTag}
      heading={drill.prompt}
      canCheck={allAssigned}
      onCheck={grade}
    >
      {(phase: LessonPhase) => {
        const locked = phase !== 'answer';
        return (
          <>
            {/* bucket legend */}
            <div className="mt-[22px] grid grid-cols-2 gap-2 md:grid-cols-4">
              {drill.buckets.map((b) => (
                <div
                  key={b.key}
                  className="rounded-console border border-line bg-panel px-3 py-2.5"
                >
                  <div className="text-[12.5px] font-semibold text-ink">
                    {b.label}
                  </div>
                  <div className="mono mt-0.5 text-[10.5px] uppercase tracking-[0.06em] text-mute">
                    {b.description}
                  </div>
                </div>
              ))}
            </div>

            {/* items */}
            <div className="mt-[22px] grid gap-2.5">
              {drill.items.map((it) => {
                const ans = assignments[it.id];
                const itemCorrect = locked && ans === it.correct;
                const itemWrong = locked && ans != null && ans !== it.correct;

                return (
                  <div
                    key={it.id}
                    className={[
                      'rounded-console border bg-paper p-[13px_15px] transition-[border-color,box-shadow] duration-150',
                      itemCorrect
                        ? 'border-good shadow-[0_0_0_1px_var(--color-good)_inset]'
                        : itemWrong
                          ? 'border-bad shadow-[0_0_0_1px_var(--color-bad)_inset]'
                          : 'border-line',
                    ].join(' ')}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[14.5px] font-medium text-ink">
                        {locked &&
                          (itemCorrect ? (
                            <CheckIcon
                              size={15}
                              className="flex-none text-good"
                            />
                          ) : (
                            <XIcon size={15} className="flex-none text-bad" />
                          ))}
                        {it.name}
                      </span>

                      <div
                        role="group"
                        aria-label={`Classify: ${it.name}`}
                        className="flex flex-wrap gap-1.5"
                      >
                        {drill.buckets.map((b) => {
                          const pressed = ans === b.key;
                          const revealCorrectBucket =
                            locked && b.key === it.correct;
                          return (
                            <button
                              key={b.key}
                              type="button"
                              aria-pressed={pressed}
                              aria-label={b.label}
                              disabled={locked}
                              onClick={() => assign(it.id, b.key)}
                              className={[
                                'mono rounded-console-sm border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] transition-[border-color,background,color] duration-150 disabled:cursor-default',
                                revealCorrectBucket
                                  ? 'border-good bg-good text-white'
                                  : pressed
                                    ? itemWrong
                                      ? 'border-bad bg-bad text-white'
                                      : 'border-accent bg-accent text-white'
                                    : locked
                                      ? 'border-line bg-panel text-faint opacity-60'
                                      : 'border-line bg-panel text-slate hover:border-faint hover:text-ink',
                              ].join(' ')}
                            >
                              {b.label}
                            </button>
                          );
                        })}
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
