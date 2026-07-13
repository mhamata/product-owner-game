'use client';

import { useState } from 'react';
import type { Skill } from '@/curriculum/types';
import {
  gradeSizing,
  TSHIRT_SIZES,
  type SizingDrill,
  type TShirtSize,
} from '@/curriculum/drills';
import { LessonFrame, type DrillResult, type LessonPhase } from './LessonFrame';
import { DrillCardStack, type DrillStackItem } from './DrillCardStack';

/**
 * Console lesson body for T-shirt estimation: a W4-I card-stack — one story
 * per screen, picking a size reveals THAT story's own verdict stamp +
 * one-line "why" immediately (see `DrillCardStack`). Once every story has a
 * size, CHECK grades the whole set (unchanged `gradeSizing` call) and the
 * block-summary card takes over.
 */
export function SizingLesson({
  skill,
  drill,
  scenarioTag,
}: {
  skill: Skill;
  drill: SizingDrill;
  scenarioTag: string;
}) {
  const [guesses, setGuesses] = useState<Record<string, TShirtSize | undefined>>(
    {},
  );

  const allSized = drill.stories.every((s) => guesses[s.id]);

  function grade(): DrillResult {
    const { correct, total, score, allCorrect } = gradeSizing(drill, guesses);
    const misses = drill.stories.filter((s) => guesses[s.id] !== s.correct);

    return {
      correct: allCorrect,
      score,
      tally: { correct, total },
      headline: allCorrect ? 'All sized right!' : `${correct} / ${total} correct`,
      explanation: allCorrect ? (
        <>{drill.insight}</>
      ) : (
        <>
          {correct} of {total} sized correctly. {drill.insight}
        </>
      ),
      detail:
        misses.length > 0 ? (
          <ul className="grid gap-2">
            {misses.map((s) => (
              <li key={s.id}>
                <b className="font-semibold text-[var(--px-ink)]">{s.title}</b> →{' '}
                <span className="text-[var(--px-good)]">{s.correct}</span>. {s.why}
              </li>
            ))}
          </ul>
        ) : undefined,
    };
  }

  const stackItems: DrillStackItem<TShirtSize>[] = drill.stories.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    choices: TSHIRT_SIZES.map((size) => ({ key: size, label: size })),
    correct: s.correct,
    why: s.why,
  }));

  return (
    <LessonFrame
      skill={skill}
      scenarioTag={scenarioTag}
      heading={drill.prompt}
      canCheck={allSized}
      onCheck={grade}
    >
      {(phase: LessonPhase) => {
        const locked = phase !== 'answer';
        return (
          <>
            <p className="mono mt-3 text-[12px] leading-[1.6] text-[var(--px-dimmer)]">
              {drill.legend}
            </p>

            {locked ? (
              // checked/complete: the stack has already served its purpose
              // (every story was sized + individually revealed); show the
              // final size grid so "Explain my answer" has rows to point at.
              <div className="mt-[18px] grid gap-2.5">
                {drill.stories.map((story) => {
                  const ans = guesses[story.id];
                  const itemCorrect = ans === story.correct;
                  return (
                    <div
                      key={story.id}
                      className={[
                        'rounded-[12px] border p-[12px_14px] text-[13.5px]',
                        itemCorrect
                          ? 'border-[var(--px-good)] text-[var(--px-ink)]'
                          : 'border-[var(--px-crit)] text-[var(--px-ink)]',
                      ].join(' ')}
                    >
                      {story.title} → <b>{ans ?? '—'}</b>
                    </div>
                  );
                })}
              </div>
            ) : (
              <DrillCardStack
                items={stackItems}
                values={guesses}
                onAnswer={(id, size) => setGuesses((prev) => ({ ...prev, [id]: size }))}
                ariaLabel="Size each story, one at a time"
              />
            )}
          </>
        );
      }}
    </LessonFrame>
  );
}
