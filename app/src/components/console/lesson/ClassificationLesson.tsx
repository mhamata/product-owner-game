'use client';

import { useState } from 'react';
import type { Skill } from '@/curriculum/types';
import {
  gradeClassification,
  type ClassificationDrill,
} from '@/curriculum/drills';
import { LessonFrame, type DrillResult, type LessonPhase } from './LessonFrame';
import { DrillCardStack, type DrillStackItem } from './DrillCardStack';

/**
 * Console lesson body for classification drills (MoSCoW, Kano): a W4-I
 * card-stack — one item per screen, picking a bucket reveals THAT item's own
 * verdict stamp + one-line "why" immediately (see `DrillCardStack`). Once
 * every item has an answer, CHECK grades the whole set (unchanged
 * `gradeClassification` call) and the block-summary card takes over.
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
      tally: { correct, total },
      headline: allCorrect ? 'All correct!' : `${correct} / ${total} correct`,
      explanation: allCorrect ? (
        <>{drill.insight}</>
      ) : (
        <>
          You placed{' '}
          <b className="font-semibold text-[var(--px-ink)]">
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
                  <b className="font-semibold text-[var(--px-ink)]">{it.name}</b> →{' '}
                  <span className="text-[var(--px-good)]">{label}</span>. {it.why}
                </li>
              );
            })}
          </ul>
        ) : undefined,
    };
  }

  const stackItems: DrillStackItem<K>[] = drill.items.map((it) => ({
    id: it.id,
    title: it.name,
    choices: drill.buckets.map((b) => ({ key: b.key, label: b.label })),
    correct: it.correct,
    why: it.why,
  }));

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
                  className="rounded-[12px] border border-[var(--px-line)] bg-[var(--px-raised)] px-3 py-2.5"
                >
                  <div className="text-[12.5px] font-semibold text-[var(--px-ink)]">
                    {b.label}
                  </div>
                  <div className="mono mt-0.5 text-[10.5px] uppercase tracking-[0.06em] text-[var(--px-dimmer)]">
                    {b.description}
                  </div>
                </div>
              ))}
            </div>

            {locked ? (
              // checked/complete: the stack has already served its purpose
              // (every item was answered + individually revealed); show the
              // final assignment grid so the "Explain my answer" detail above
              // still has visible rows to point at.
              <div className="mt-[22px] grid gap-2.5">
                {drill.items.map((it) => {
                  const ans = assignments[it.id];
                  const itemCorrect = ans === it.correct;
                  return (
                    <div
                      key={it.id}
                      className={[
                        'rounded-[12px] border p-[12px_14px] text-[13.5px]',
                        itemCorrect
                          ? 'border-[var(--px-good)] text-[var(--px-ink)]'
                          : 'border-[var(--px-crit)] text-[var(--px-ink)]',
                      ].join(' ')}
                    >
                      {it.name} →{' '}
                      <b>{drill.buckets.find((b) => b.key === ans)?.label ?? '—'}</b>
                    </div>
                  );
                })}
              </div>
            ) : (
              <DrillCardStack
                items={stackItems}
                values={assignments}
                onAnswer={assign}
                ariaLabel="Classify each item, one at a time"
              />
            )}
          </>
        );
      }}
    </LessonFrame>
  );
}
