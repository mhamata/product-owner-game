'use client';

import { useEffect, useRef } from 'react';
import { ProgressRing } from '../ProgressRing';
import {
  ArrowRightIcon,
  CheckIcon,
  FlameIcon,
  StarIcon,
} from '../Icon';

interface CompletionOverlayProps {
  skillTitle: string;
  /** Mastered count AFTER this skill, e.g. 4. */
  masteredCount: number;
  totalSkills: number;
  streak: number;
  /** Title of the next skill, or null if this was the last. */
  nextSkillTitle: string | null;
  nextSkillIndex: number | null;
  onContinue: () => void;
}

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * Restrained "Skill mastered" celebration, matching the mockup's `.complete`
 * overlay. Modal dialog: focus moves to the continue button on open, ESC and
 * backdrop click both dismiss, and focus is trapped to the single action.
 */
export function CompletionOverlay({
  skillTitle,
  masteredCount,
  totalSkills,
  streak,
  nextSkillTitle,
  nextSkillIndex,
  onContinue,
}: CompletionOverlayProps) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onContinue();
      // Trap focus on the only actionable control.
      if (e.key === 'Tab') {
        e.preventDefault();
        continueRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onContinue]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completeTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinue();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-panel/75 p-6 backdrop-blur-[3px]"
    >
      <div className="w-full max-w-[420px] rounded-[14px] border border-line bg-paper px-7 pb-[26px] pt-[30px] text-center shadow-console-lg">
        <div className="relative mx-auto h-24 w-24">
          <ProgressRing
            value={1}
            size={96}
            strokeWidth={6}
            colorClass="text-good"
            animate
          />
          <div className="absolute inset-0 flex items-center justify-center text-good">
            <CheckIcon size={34} />
          </div>
        </div>

        <span className="mono mx-auto mt-[18px] inline-flex items-center gap-1.5 rounded-full border border-good-line bg-good-050 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-good">
          <CheckIcon size={13} />
          Skill Mastered
        </span>

        <h3
          id="completeTitle"
          className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-ink"
        >
          {skillTitle}
        </h3>

        <div className="mx-auto mt-4 grid max-w-[280px] gap-2 text-left">
          <div className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
            <StarIcon size={16} className="flex-none text-accent" />
            <span>
              <b className="font-semibold text-ink">+1</b> mastery
            </span>
            <span className="mono ml-auto text-[11px] uppercase tracking-[0.06em] text-faint">
              {padIndex(masteredCount)} / {padIndex(totalSkills)}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
            <FlameIcon size={16} className="flex-none text-flame" />
            <span>
              Consistency streak <b className="font-semibold text-ink">kept</b>
            </span>
            <span className="mono ml-auto text-[11px] uppercase tracking-[0.06em] text-faint">
              {streak} days
            </span>
          </div>
          {nextSkillTitle && (
            <div className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
              <ArrowRightIcon size={16} className="flex-none text-good" />
              <span>
                Next up <b className="font-semibold text-ink">{nextSkillTitle}</b>
              </span>
              {nextSkillIndex !== null && (
                <span className="mono ml-auto text-[11px] uppercase tracking-[0.06em] text-faint">
                  Skill {padIndex(nextSkillIndex)}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          ref={continueRef}
          type="button"
          onClick={onContinue}
          className="mono mt-[22px] w-full rounded-console border-0 bg-accent py-[13px] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-[background,transform] duration-150 hover:bg-accent-700 active:translate-y-px"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
