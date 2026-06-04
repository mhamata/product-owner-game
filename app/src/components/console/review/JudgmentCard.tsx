'use client';

import type { ResolvedScenario } from '@/curriculum/judgment';
import { JUDGMENT_COMPETENCY_LABEL } from '@/curriculum/judgment';
import { CheckIcon, ScaleIcon, XIcon } from '../Icon';

/**
 * One judgment scenario as a reviewable card. Styled to match the lesson's
 * `CheckQuestionCard` so the deck feels like the rest of the Console, not a
 * bolt-on: same option chrome, same "reveal correctness with colour AND icon
 * AND text" rule (never colour alone), same "why" treatment.
 *
 * Two phases, controlled by `locked`:
 *  - picking:  the situation + an accessible radio group of options. The learner
 *              selects, then the parent grades.
 *  - locked:   the chosen option and the best-judgment option are marked (green
 *              for the best call, red only if the learner's pick was not it), and
 *              the principle + "why" are revealed so the card teaches regardless
 *              of whether the learner got it right.
 */
export function JudgmentCard({
  scenario,
  answer,
  locked,
  onAnswer,
}: {
  scenario: ResolvedScenario;
  /** The option id the learner has selected, if any. */
  answer: string | undefined;
  /** Once true, the answer is revealed and the radios are read-only. */
  locked: boolean;
  /** Select an option (no-op once locked). */
  onAnswer: (optionId: string) => void;
}) {
  const groupName = `judgment-${scenario.id}`;
  const promptId = `${groupName}-prompt`;
  const pickedBest = answer === scenario.bestOptionId;

  return (
    <div className="rounded-console-lg border border-line bg-paper p-[18px_20px]">
      {/* competency eyebrow + title */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
          <ScaleIcon size={12} />
          {JUDGMENT_COMPETENCY_LABEL[scenario.competency]}
        </span>
      </div>

      <h2
        id={promptId}
        className="mt-3 text-[19px] font-bold leading-[1.3] tracking-[-0.015em] text-ink max-[560px]:text-[17px]"
      >
        {scenario.title}
      </h2>

      {/* the situation */}
      <p className="mt-2.5 text-[14.5px] leading-[1.65] text-ink-2">
        {scenario.situation}
      </p>

      {/* options as an accessible radio group */}
      <fieldset className="mt-4" aria-describedby={promptId}>
        <legend className="sr-only">Choose the best-judgment call</legend>
        <div className="grid gap-2">
          {scenario.options.map((opt) => {
            const selected = answer === opt.id;
            const isBest = locked && opt.id === scenario.bestOptionId;
            const isWrongPick =
              locked && selected && opt.id !== scenario.bestOptionId;
            return (
              <label
                key={opt.id}
                className={[
                  'flex cursor-pointer items-start gap-2.5 rounded-console border px-3 py-2.5 text-[14px] leading-[1.5] transition-[border-color,background] duration-150',
                  isBest
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
                {isBest && (
                  <span className="mono inline-flex flex-none items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-good">
                    <CheckIcon size={12} />
                    Best call
                  </span>
                )}
                {isWrongPick && (
                  <span className="mono inline-flex flex-none items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-bad">
                    <XIcon size={12} />
                    Your pick
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* reveal: principle + why, shown after the learner commits */}
      {locked && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-console border border-dashed border-line bg-panel p-[14px_16px]"
        >
          <div className="flex items-center gap-2">
            <span
              className={[
                'inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-white',
                pickedBest ? 'bg-good' : 'bg-accent',
              ].join(' ')}
            >
              {pickedBest ? <CheckIcon size={13} /> : <ScaleIcon size={13} />}
            </span>
            <span
              className={[
                'mono text-[12px] font-semibold uppercase tracking-[0.06em]',
                pickedBest ? 'text-good' : 'text-accent',
              ].join(' ')}
            >
              {pickedBest ? 'You made the best call' : 'The best-judgment call'}
            </span>
          </div>
          {scenario.principle && (
            <p className="mono mt-2.5 text-[11px] uppercase tracking-[0.06em] text-faint">
              Principle · {scenario.principle}
            </p>
          )}
          <p className="mt-1.5 text-[13.5px] leading-[1.65] text-slate">
            {scenario.why}
          </p>
        </div>
      )}
    </div>
  );
}
