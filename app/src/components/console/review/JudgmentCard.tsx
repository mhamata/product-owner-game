'use client';

import type { ReactNode } from 'react';
import type { ResolvedScenario } from '@/curriculum/judgment';
import { JUDGMENT_COMPETENCY_LABEL } from '@/curriculum/judgment';
import { cn } from '@/lib/cn';
import { CheckIcon, ScaleIcon, XIcon } from '../Icon';

/**
 * One judgment scenario as a reviewable card, `--px-*`-tokened (W4-I restyle
 * per praxis-learn-mockup.html's jcard) so it renders correctly on BOTH the
 * dark-capable `/review` deck and the `/standup` warm-up, which already
 * embeds this component inside its own `--px-*` page (see StandupView.tsx) —
 * before this restyle the card was still hard-coded to the light-only
 * `--color-*` Console scale, a real light-card-on-dark-page mismatch there.
 *
 * Two phases, controlled by `locked`:
 *  - picking:  the situation + an accessible radio group of options. The learner
 *              selects, then the parent grades.
 *  - locked:   the chosen option and the best-judgment option are marked (green
 *              for the best call, red only if the learner's pick was not it), and
 *              the principle + "why" are revealed so the card teaches regardless
 *              of whether the learner got it right.
 *
 * `topSlot` is additive and optional (used by `/review`'s `ReviewView` to
 * inject provenance chips above the situation); omitting it — as
 * `/standup`'s warm-up does — renders the plain card exactly as before.
 */
export function JudgmentCard({
  scenario,
  answer,
  locked,
  onAnswer,
  topSlot,
}: {
  scenario: ResolvedScenario;
  /** The option id the learner has selected, if any. */
  answer: string | undefined;
  /** Once true, the answer is revealed and the radios are read-only. */
  locked: boolean;
  /** Select an option (no-op once locked). */
  onAnswer: (optionId: string) => void;
  /** Optional content (e.g. provenance chips) rendered above the eyebrow row. */
  topSlot?: ReactNode;
}) {
  const groupName = `judgment-${scenario.id}`;
  const promptId = `${groupName}-prompt`;
  const pickedBest = answer === scenario.bestOptionId;

  return (
    <div className="rounded-[16px] border border-[var(--px-line)] bg-[var(--px-card)] p-[16px_18px]">
      {topSlot}

      {/* competency eyebrow + title */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-[var(--px-accent)]">
          <ScaleIcon size={12} />
          {JUDGMENT_COMPETENCY_LABEL[scenario.competency]}
        </span>
      </div>

      <h2
        id={promptId}
        className="mt-3 text-[18px] font-bold leading-[1.3] tracking-[-0.015em] text-[var(--px-ink)] max-[560px]:text-[16.5px]"
      >
        {scenario.title}
      </h2>

      {/* the situation */}
      <p className="mt-2.5 text-[13.5px] leading-[1.6] text-[var(--px-body)]">
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
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-[12px] border px-3 py-2.5 text-[13.5px] leading-[1.5] transition-[border-color,background] duration-150',
                  isBest
                    ? 'border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_10%,transparent)] text-[var(--px-ink)]'
                    : isWrongPick
                      ? 'border-[var(--px-crit)] bg-[color-mix(in_srgb,var(--px-crit)_10%,transparent)] text-[var(--px-ink)]'
                      : selected
                        ? 'border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] text-[var(--px-ink)]'
                        : 'border-[var(--px-line)] bg-[var(--px-card)] text-[var(--px-body)] hover:border-[var(--px-line-strong)]',
                  locked ? 'cursor-default' : '',
                )}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={opt.id}
                  checked={selected}
                  disabled={locked}
                  onChange={() => onAnswer(opt.id)}
                  className="mt-0.5 h-4 w-4 flex-none accent-[var(--px-accent)]"
                />
                <span className="flex-auto">{opt.label}</span>
                {isBest && (
                  <span className="mono inline-flex flex-none items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-[var(--px-good)]">
                    <CheckIcon size={12} />
                    Best call
                  </span>
                )}
                {isWrongPick && (
                  <span className="mono inline-flex flex-none items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-[var(--px-crit)]">
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
          className="motion-safe:animate-[stampIn_200ms_cubic-bezier(0.2,1.4,0.4,1)_forwards] mt-4 rounded-[12px] border border-dashed border-[var(--px-line)] bg-[var(--px-raised)] p-[14px_16px]"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[var(--px-on-accent)]"
              style={{ background: pickedBest ? 'var(--px-good)' : 'var(--px-accent)' }}
            >
              {pickedBest ? <CheckIcon size={13} /> : <ScaleIcon size={13} />}
            </span>
            <span
              className={cn(
                'mono text-[12px] font-semibold uppercase tracking-[0.06em]',
                pickedBest ? 'text-[var(--px-good)]' : 'text-[var(--px-accent)]',
              )}
            >
              {pickedBest ? 'You made the best call' : 'The best-judgment call'}
            </span>
          </div>
          {scenario.principle && (
            <p className="mono mt-2.5 text-[11px] uppercase tracking-[0.06em] text-[var(--px-dimmer)]">
              Principle · {scenario.principle}
            </p>
          )}
          <p className="mt-1.5 text-[13.5px] leading-[1.6] text-[var(--px-dim)]">
            {scenario.why}
          </p>
        </div>
      )}
    </div>
  );
}
