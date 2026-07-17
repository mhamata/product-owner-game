'use client';

import { useEffect, useRef } from 'react';
import type { BlockSummary } from '@/lib/blockSummary';
import { cn } from '@/lib/cn';
import { ArrowRightIcon, CheckIcon, FlameIcon, ScaleIcon, SparkleIcon } from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * BLOCK SUMMARY (W4-I, praxis-learn-mockup.html's block-summary bullet):
 * replaces the old unconditional "Skill Mastered" `CompletionOverlay` for the
 * deterministic drill loop with a card that only ever claims what actually
 * happened this attempt — an honest tally, a strength delta shown ONLY when
 * the decay model actually moved, and an unlock line ONLY the one moment a
 * skill newly crosses mastery, sourced straight from `skillUnlocks.ts`'s
 * real registry.
 *
 * `--px-*`-styled to match the rest of this slice's card-stack surfaces.
 */
export function BlockSummaryCard({
  summary,
  streak,
  nextSkillTitle,
  nextSkillIndex,
  onContinue,
}: {
  summary: BlockSummary;
  streak: number;
  nextSkillTitle: string | null;
  nextSkillIndex: number | null;
  onContinue: () => void;
}) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onContinue();
      if (e.key === 'Tab') {
        e.preventDefault();
        continueRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onContinue]);

  const {
    tally,
    masteredBefore,
    masteredAfter,
    strengthBefore,
    strengthAfter,
    strengthDelta,
    masteryPercent,
    closerLine,
  } = summary;
  const justMastered = masteredAfter && !masteredBefore;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blockSummaryTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinue();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[color-mix(in_srgb,var(--px-ground)_75%,transparent)] p-6 backdrop-blur-[3px]"
    >
      <div className="w-full max-w-[420px] rounded-[16px] border border-[var(--px-line)] bg-[var(--px-card)] px-7 pb-[26px] pt-[28px] text-center shadow-[0_24px_60px_rgba(5,10,18,0.35)]">
        <span
          className={cn(
            'mono mx-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]',
            justMastered
              ? 'border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_12%,transparent)] text-[var(--px-good)]'
              : 'border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] text-[var(--px-accent)]',
          )}
        >
          <CheckIcon size={13} />
          {justMastered ? 'Skill mastered' : masteredAfter ? 'Rust cleared' : 'Block complete'}
        </span>

        <h3 id="blockSummaryTitle" className="mt-4 text-[19px] font-bold tracking-[-0.01em] text-[var(--px-ink)]">
          {summary.skillTitle}
        </h3>

        <p className="mono tnum mt-2 text-[13px] tracking-[0.02em] text-[var(--px-body)]">
          {tally.correct} / {tally.total} correct
        </p>

        <div className="mx-auto mt-4 grid max-w-[300px] gap-2.5 text-left">
          {/* strength: real delta, or the honest fallback when it did not move */}
          <div className="flex items-center gap-2.5 text-[13.5px] leading-[1.4] text-[var(--px-body)]">
            <ScaleIcon size={16} className="flex-none text-[var(--px-accent)]" />
            {strengthDelta !== null ? (
              <span>
                Strength{' '}
                <b className="tnum font-semibold text-[var(--px-ink)]">
                  {strengthBefore}% → {strengthAfter}%
                </b>
              </span>
            ) : masteredAfter ? (
              <span>
                lastPracticed restamped · strength holds at{' '}
                <b className="tnum font-semibold text-[var(--px-ink)]">{strengthAfter}%</b>
              </span>
            ) : (
              <span>
                <b className="tnum font-semibold text-[var(--px-ink)]">{masteryPercent}%</b> to mastery
              </span>
            )}
          </div>

          {/* streak */}
          <div className="flex items-center gap-2.5 text-[13.5px] text-[var(--px-body)]">
            <FlameIcon size={16} className="flex-none text-[var(--px-warn)]" />
            <span>
              Consistency streak <b className="font-semibold text-[var(--px-ink)]">kept</b>
            </span>
            <span className="mono tnum ml-auto text-[11px] uppercase tracking-[0.06em] text-[var(--px-dimmer)]">
              {streak} days
            </span>
          </div>

          {/* the "1 block closer" line — only the moment mastery is newly earned */}
          {closerLine && (
            <div className="flex items-start gap-2.5 text-[13.5px] leading-[1.45] text-[var(--px-body)]">
              <SparkleIcon size={16} className="mt-0.5 flex-none text-[var(--px-good)]" />
              <span>
                {closerLine.kind === 'sim' ? (
                  <b className="font-semibold text-[var(--px-good)]">In the sim: </b>
                ) : (
                  <b className="font-semibold text-[var(--px-accent)]">1 block closer — </b>
                )}
                {closerLine.text}
              </span>
            </div>
          )}

          {nextSkillTitle && (
            <div className="flex items-center gap-2.5 text-[13.5px] text-[var(--px-body)]">
              <ArrowRightIcon size={16} className="flex-none text-[var(--px-good)]" />
              <span>
                Next up <b className="font-semibold text-[var(--px-ink)]">{nextSkillTitle}</b>
              </span>
              {nextSkillIndex !== null && (
                <span className="mono ml-auto text-[11px] uppercase tracking-[0.06em] text-[var(--px-dimmer)]">
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
          className="mono mt-[22px] w-full rounded-[12px] border-0 bg-[var(--px-accent)] py-[13px] text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--px-on-accent)] transition-transform duration-150 active:translate-y-px"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
