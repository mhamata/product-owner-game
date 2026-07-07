'use client';

import type { HiringBand } from '@/curriculum/interview';
import { ProgressRing } from '@/components/console/ProgressRing';
import { VerdictList } from '@/components/console/lesson/verdictUi';
import {
  CheckIcon,
  CircleIcon,
  InfoIcon,
  UsersIcon,
} from '@/components/console/Icon';
import type { InterviewScorecard } from './useInterview';

/**
 * The hiring-committee scorecard renderer for the interview modality.
 *
 * The roleplay/artifact `Verdict` renders a 0-3 rubric with "Excellent / Solid /
 * Needs work / Missing" bands. An interview scorecard is a different animal — it
 * speaks the language a real committee uses: the four HIRING BANDS as the
 * headline verdict, per-dimension band chips, a committee paragraph, and
 * evidence anchored to NUMBERED candidate turns. So this is its own component,
 * but it reuses the shared visual language deliberately (the same ProgressRing,
 * the same VerdictList for strengths/gaps, the same paired colour-plus-word rule)
 * so it sits inside the Console design system rather than beside it.
 *
 * Semantic colour is ALWAYS paired with the band WORD, never colour alone, so the
 * scorecard reads without relying on hue.
 */

/**
 * The four hiring bands map onto the same three-tone semantic palette the rest of
 * the app uses (good / warn / bad), so a "lean hire" reads green like a pass and a
 * "lean no" reads amber like "needs work". `strong hire` and `lean hire` are both
 * green (the candidate advances); `lean no` is amber (borderline); `no-hire
 * signal` is red.
 */
const BAND_TONE: Record<HiringBand, 'good' | 'warn' | 'bad'> = {
  'strong hire': 'good',
  'lean hire': 'good',
  'lean no': 'warn',
  'no-hire signal': 'bad',
};

const TONE_TEXT: Record<'good' | 'warn' | 'bad', string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
};
const TONE_DOT: Record<'good' | 'warn' | 'bad', string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
};
/** Band-chip surface: tinted border + fill matching the tone, for the pill. */
const TONE_CHIP: Record<'good' | 'warn' | 'bad', string> = {
  good: 'border-good-line bg-good-050 text-good',
  warn: 'border-warn-line bg-warn-050 text-warn',
  bad: 'border-bad-line bg-bad-050 text-bad',
};

/** Title-case a hiring band for the headline, e.g. "strong hire" -> "Strong hire". */
function titleCaseBand(band: HiringBand): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}

export function Scorecard({
  scorecard,
  onEvidenceClick,
}: {
  scorecard: InterviewScorecard;
  /**
   * Called with a candidate turn number when an evidence chip is clicked, so the
   * parent can scroll to and highlight that turn in the transcript above.
   */
  onEvidenceClick: (turn: number) => void;
}) {
  const overallTone = BAND_TONE[scorecard.recommendation];
  const ringTone = TONE_TEXT[overallTone];

  return (
    <>
      {/* headline: the overall recommendation as the committee's verdict */}
      <div className="flex items-center gap-3">
        <div className="relative h-[46px] w-[46px] flex-none">
          <ProgressRing
            value={Math.max(0, Math.min(1, scorecard.overallScore / 100))}
            size={46}
            strokeWidth={4}
            colorClass={ringTone}
            animate
          />
          <span className="mono tnum absolute inset-0 flex items-center justify-center text-[12px] font-bold text-ink">
            {scorecard.overallScore}
          </span>
        </div>
        <div>
          <div
            className={`mono inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] ${ringTone}`}
          >
            <UsersIcon size={15} />
            {titleCaseBand(scorecard.recommendation)}
          </div>
          <div className="text-[12.5px] text-slate">
            Hiring-committee recommendation · {scorecard.overallScore} / 100
          </div>
        </div>
      </div>

      {/* per-dimension bands, each with a coloured band chip + evidence chips */}
      <ul className="mt-3.5 grid gap-2.5">
        {scorecard.dimensions.map((d) => {
          const tone = BAND_TONE[d.band];
          return (
            <li
              key={d.id}
              className="border-t border-dashed border-line pt-2.5 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  aria-hidden
                  className={`h-2 w-2 flex-none rounded-full ${TONE_DOT[tone]}`}
                />
                <span className="text-[13px] font-semibold text-ink">{d.label}</span>
                <span
                  className={`mono ml-auto flex-none rounded-console-sm border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] ${TONE_CHIP[tone]}`}
                >
                  {d.band} · {d.score}/3
                </span>
              </div>
              {d.comment && (
                <p className="mt-1 pl-4 text-[13px] leading-[1.55] text-ink-2">{d.comment}</p>
              )}
              {d.evidenceTurns.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-4">
                  <span className="mono text-[9.5px] uppercase tracking-[0.1em] text-mute">
                    Evidence
                  </span>
                  {d.evidenceTurns.map((turn) => (
                    <EvidenceChip key={turn} turn={turn} onClick={onEvidenceClick} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* strengths + gaps, reusing the shared list styling */}
      <div className="mt-3.5 grid gap-3 border-t border-dashed border-line pt-3 sm:grid-cols-2">
        <VerdictList
          tone="good"
          title="Strengths"
          items={scorecard.strengths}
          icon={<CheckIcon size={13} />}
        />
        <VerdictList
          tone="warn"
          title="Gaps to close"
          items={scorecard.gaps}
          icon={<CircleIcon size={11} />}
        />
      </div>

      {/* the committee paragraph: would this candidate advance, and what's debated */}
      {scorecard.committee && (
        <div className="mt-3 flex gap-2 border-t border-dashed border-line pt-3">
          <InfoIcon size={14} className="mt-0.5 flex-none text-slate" />
          <div>
            <div className="mono text-[9.5px] uppercase tracking-[0.1em] text-mute">
              The committee
            </div>
            <p className="mt-0.5 text-[13px] leading-[1.6] text-ink-2">{scorecard.committee}</p>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * One clickable evidence chip. Clicking it jumps the transcript to candidate turn
 * [n] and highlights it, so feedback points at the exact moment, not a vibe.
 */
function EvidenceChip({
  turn,
  onClick,
}: {
  turn: number;
  onClick: (turn: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(turn)}
      aria-label={`Jump to candidate turn ${turn} in the transcript`}
      className="mono tnum inline-flex items-center rounded-console-sm border border-accent-100 bg-accent-050 px-1.5 py-0.5 text-[10.5px] font-semibold text-accent transition-colors duration-150 hover:bg-accent-100 active:translate-y-px"
    >
      [{turn}]
    </button>
  );
}
