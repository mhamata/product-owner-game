'use client';

import type { ResolvedQuestion } from '@/curriculum/lessons/types';
import { CheckIcon, XIcon } from '../Icon';

/**
 * One comprehension question, shared by the concept lesson's end-of-lesson check
 * and the test-out placement challenge so both render the SAME accessible UI
 * (one styling system, never a parallel one).
 *
 * Choice questions render as an accessible radio group (native radios, fully
 * keyboard-operable); fill questions render a text input. After grading
 * (`locked`), the correct answer + "why" are revealed and correctness is shown
 * with colour AND an icon AND text, never colour alone.
 *
 * `showWhy` lets a caller suppress the per-question explanation. The lesson check
 * always teaches (shows it); the placement challenge keeps the rationale to avoid
 * turning a quick test-out into a wall of prose, while still revealing the
 * correct answer + right/wrong state.
 */
export function CheckQuestionCard({
  question,
  index,
  total,
  answer,
  locked,
  correct,
  onAnswer,
  showWhy = true,
  groupId,
}: {
  question: ResolvedQuestion;
  index: number;
  total: number;
  answer: string | undefined;
  locked: boolean;
  correct: boolean;
  onAnswer: (value: string) => void;
  showWhy?: boolean;
  /**
   * Stable, page-unique id for this question's radio group + input. Defaults to
   * the question id, which is unique within a single lesson check. The placement
   * challenge MUST pass its composite uid here: it draws each skill's `q1`, so
   * bare ids collide and the native radios would behave as one mutually-exclusive
   * group across questions. The composite uid keeps each question independent.
   */
  groupId?: string;
}) {
  const groupName = `q-${groupId ?? question.id}`;
  const promptId = `${groupName}-prompt`;

  return (
    <div
      className={[
        'rounded-console-lg border bg-paper p-[16px_18px] transition-[border-color] duration-150',
        locked
          ? correct
            ? 'border-good shadow-[0_0_0_1px_var(--color-good)_inset]'
            : 'border-bad shadow-[0_0_0_1px_var(--color-bad)_inset]'
          : 'border-line',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <span className="mono mt-px text-[11px] text-faint">
          {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </span>
        <p id={promptId} className="text-[14.5px] font-medium leading-[1.5] text-ink">
          {question.prompt}
        </p>
        {locked && (
          <span className="ml-auto flex-none">
            {correct ? (
              <CheckIcon size={17} className="text-good" />
            ) : (
              <XIcon size={17} className="text-bad" />
            )}
          </span>
        )}
      </div>

      {question.kind === 'choice' ? (
        <fieldset className="mt-3" aria-describedby={promptId}>
          <legend className="sr-only">{`Question ${index + 1} options`}</legend>
          <div className="grid gap-2">
            {question.options.map((opt) => {
              const selected = answer === opt.id;
              const isCorrectOpt = locked && opt.id === question.correctId;
              const isWrongPick = locked && selected && opt.id !== question.correctId;
              return (
                <label
                  key={opt.id}
                  className={[
                    'flex cursor-pointer items-start gap-2.5 rounded-console border px-3 py-2.5 text-[14px] leading-[1.5] transition-[border-color,background] duration-150',
                    isCorrectOpt
                      ? 'border-good bg-good-050 text-ink'
                      : isWrongPick
                        ? 'border-bad bg-bad-050 text-ink'
                        : selected
                          ? 'border-accent bg-accent-050 text-ink'
                          : 'border-line bg-paper text-ink-2 hover:border-faint',
                    locked ? 'cursor-default' : '',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={opt.id}
                    checked={selected}
                    disabled={locked}
                    onChange={() => onAnswer(opt.id)}
                    className="mt-0.5 h-4 w-4 flex-none accent-accent"
                  />
                  <span className="flex-auto">{opt.label}</span>
                  {isCorrectOpt && (
                    <span className="mono flex-none text-[10px] uppercase tracking-[0.08em] text-good">
                      Correct
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <div className="mt-3">
          <label htmlFor={groupName} className="sr-only">
            {`Answer for question ${index + 1}`}
          </label>
          <input
            id={groupName}
            type="text"
            value={answer ?? ''}
            disabled={locked}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={question.placeholder ?? 'Type your answer'}
            aria-describedby={promptId}
            className="w-full rounded-console border border-line bg-paper px-3 py-2.5 text-[14px] leading-[1.5] text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-050)] disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-slate"
          />
          {locked && !correct && (
            <p className="mt-2 text-[13px] leading-[1.5] text-ink-2">
              <span className="font-semibold text-good">Answer: </span>
              {question.accept[0]}
            </p>
          )}
        </div>
      )}

      {showWhy && locked && (
        <p className="mt-3 border-t border-dashed border-line pt-2.5 text-[13px] leading-[1.6] text-slate">
          {question.why}
        </p>
      )}
    </div>
  );
}
