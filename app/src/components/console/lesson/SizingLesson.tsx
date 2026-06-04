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
import { CheckIcon, XIcon } from '../Icon';

/**
 * Console lesson body for T-shirt estimation. The learner picks a size for each
 * story; CHECK grades all at once and reveals the correct size + rationale for
 * any miss. Size pills are keyboard-operable toggle buttons (aria-pressed).
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
                <b className="font-semibold text-ink">{s.title}</b> →{' '}
                <span className="text-good">{s.correct}</span>. {s.why}
              </li>
            ))}
          </ul>
        ) : undefined,
    };
  }

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
            <p className="mono mt-3 text-[12px] leading-[1.6] text-mute">
              {drill.legend}
            </p>

            <div className="mt-[18px] grid gap-2.5">
              {drill.stories.map((story) => {
                const ans = guesses[story.id];
                const itemCorrect = locked && ans === story.correct;
                const itemWrong = locked && ans != null && ans !== story.correct;

                return (
                  <div
                    key={story.id}
                    className={[
                      'rounded-console-lg border bg-paper p-[14px_15px] transition-[border-color,box-shadow] duration-150',
                      itemCorrect
                        ? 'border-good shadow-[0_0_0_1px_var(--color-good)_inset]'
                        : itemWrong
                          ? 'border-bad shadow-[0_0_0_1px_var(--color-bad)_inset]'
                          : 'border-line',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-2">
                      {locked &&
                        (itemCorrect ? (
                          <CheckIcon
                            size={15}
                            className="mt-0.5 flex-none text-good"
                          />
                        ) : (
                          <XIcon size={15} className="mt-0.5 flex-none text-bad" />
                        ))}
                      <div>
                        <h3 className="text-[14.5px] font-semibold text-ink">
                          {story.title}
                        </h3>
                        <p className="mt-0.5 text-[12.5px] leading-[1.5] text-slate">
                          {story.description}
                        </p>
                      </div>
                    </div>

                    <div
                      role="group"
                      aria-label={`Size: ${story.title}`}
                      className="mt-2.5 flex flex-wrap gap-1.5"
                    >
                      {TSHIRT_SIZES.map((size) => {
                        const pressed = ans === size;
                        const revealCorrectSize = locked && size === story.correct;
                        return (
                          <button
                            key={size}
                            type="button"
                            aria-pressed={pressed}
                            disabled={locked}
                            onClick={() =>
                              setGuesses((prev) => ({ ...prev, [story.id]: size }))
                            }
                            className={[
                              'mono rounded-console-sm border px-3 py-1.5 text-[12px] font-semibold transition-[border-color,background,color] duration-150 disabled:cursor-default',
                              revealCorrectSize
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
                            {size}
                          </button>
                        );
                      })}
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
