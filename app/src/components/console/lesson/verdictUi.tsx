'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ProgressRing } from '../ProgressRing';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleIcon,
  FileIcon,
  InfoIcon,
} from '../Icon';

/**
 * Shared verdict + completion UI for the AI-graded modalities.
 *
 * The artifact grader and the roleplay grader return the SAME structured verdict
 * (per-criterion 0-3 bands + strengths/gaps/overall/score/passed) and share the
 * SAME honest-completion contract (a genuine pass celebrates; a sub-pass or a
 * no-key "unavailable" path records nothing and shows a calm "not yet mastered"
 * screen). Rather than maintain two pixel-identical copies, both lessons render
 * through these shared pieces, so there is one styling system, not a parallel one.
 *
 * Semantic colour here is ALWAYS paired with an icon AND a word, never colour
 * alone, and the overlay's modal mechanics (focus to the action, ESC + backdrop
 * dismiss, focus trapped) match CompletionOverlay.
 */

const padIndex = (n: number) => String(n).padStart(2, '0');

/** A per-criterion verdict band, shared by both graders' client shapes. */
export interface CriterionVerdict {
  id: string;
  label: string;
  /** 0-3 band. */
  score: number;
  comment: string;
}

/** The structured verdict both AI-graded modalities render. */
export interface GradedVerdict {
  criteria: CriterionVerdict[];
  strengths: string[];
  gaps: string[];
  overall: string;
  /** 0-100 rollup. */
  overallScore: number;
}

/** Band metadata for a 0-3 criterion score: paired colour + word. */
function bandMeta(score: number): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (score >= 3) return { label: 'Excellent', tone: 'good' };
  if (score === 2) return { label: 'Solid', tone: 'good' };
  if (score === 1) return { label: 'Needs work', tone: 'warn' };
  return { label: 'Missing', tone: 'bad' };
}

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

/* ------------------------------------------------------------------
   The rubric verdict: overall score ring + per-criterion bands +
   strengths/gaps. `sourceLabel` names who graded it ("Rubric feedback from
   Claude"), so the same component serves both modalities verbatim.
   ------------------------------------------------------------------ */
export function Verdict({
  verdict,
  passed,
  sourceLabel = 'Rubric feedback from Claude',
}: {
  verdict: GradedVerdict;
  passed: boolean;
  sourceLabel?: string;
}) {
  const ringTone = passed ? 'text-good' : 'text-warn';
  const headlineTone = passed ? 'text-good' : 'text-warn';

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative h-[46px] w-[46px] flex-none">
          <ProgressRing
            value={Math.max(0, Math.min(1, verdict.overallScore / 100))}
            size={46}
            strokeWidth={4}
            colorClass={ringTone}
            animate
          />
          <span className="mono tnum absolute inset-0 flex items-center justify-center text-[12px] font-bold text-ink">
            {verdict.overallScore}
          </span>
        </div>
        <div>
          <div
            className={`mono inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] ${headlineTone}`}
          >
            {passed ? <CheckIcon size={15} /> : <AlertTriangleIcon size={15} />}
            {passed ? 'Meets the bar' : 'Not there yet'}
          </div>
          <div className="text-[12.5px] text-slate">
            {sourceLabel} · {verdict.overallScore} / 100
          </div>
        </div>
      </div>

      {/* per-criterion bands */}
      <ul className="mt-3.5 grid gap-2.5">
        {verdict.criteria.map((c) => {
          const meta = bandMeta(c.score);
          return (
            <li
              key={c.id}
              className="border-t border-dashed border-line pt-2.5 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`h-2 w-2 flex-none rounded-full ${TONE_DOT[meta.tone]}`}
                />
                <span className="text-[13px] font-semibold text-ink">{c.label}</span>
                <span
                  className={`mono ml-auto flex-none text-[11px] font-semibold uppercase tracking-[0.06em] ${TONE_TEXT[meta.tone]}`}
                >
                  {meta.label} · {c.score}/3
                </span>
              </div>
              {c.comment && (
                <p className="mt-1 pl-4 text-[13px] leading-[1.55] text-ink-2">{c.comment}</p>
              )}
            </li>
          );
        })}
      </ul>

      {/* strengths + gaps */}
      <div className="mt-3.5 grid gap-3 border-t border-dashed border-line pt-3 sm:grid-cols-2">
        <VerdictList
          tone="good"
          title="Strengths"
          items={verdict.strengths}
          icon={<CheckIcon size={13} />}
        />
        <VerdictList
          tone="warn"
          title="Gaps to close"
          items={verdict.gaps}
          icon={<CircleIcon size={11} />}
        />
      </div>

      {verdict.overall && (
        <div className="mt-3 flex gap-2 border-t border-dashed border-line pt-3">
          <InfoIcon size={14} className="mt-0.5 flex-none text-slate" />
          <p className="text-[13px] leading-[1.6] text-ink-2">{verdict.overall}</p>
        </div>
      )}
    </>
  );
}

/** A small titled list (strengths / gaps), colour paired with title + icon. */
export function VerdictList({
  tone,
  title,
  items,
  icon,
}: {
  tone: 'good' | 'warn';
  title: string;
  items: string[];
  icon: ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div
        className={`mono flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] ${TONE_TEXT[tone]}`}
      >
        {icon}
        {title}
      </div>
      <ul className="mt-1.5 grid gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-[1.55] text-ink-2">
            <span
              aria-hidden
              className={`mt-[7px] h-1 w-1 flex-none rounded-full ${TONE_DOT[tone]}`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The graceful "unavailable" / error card. Colour paired with icon + text. */
export function UnavailableOrError({
  tone,
  title,
  body,
  note,
}: {
  tone: 'warn' | 'bad';
  title: string;
  body: string;
  note: string;
}) {
  const chip = tone === 'bad' ? 'bg-bad' : 'bg-warn';
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-white ${chip}`}
        >
          <AlertTriangleIcon size={17} />
        </span>
        <span
          className={`mono text-[13px] font-semibold uppercase tracking-[0.06em] ${TONE_TEXT[tone]}`}
        >
          {title}
        </span>
      </div>
      <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-2">{body}</p>
      <p className="mt-2 text-[12.5px] leading-[1.55] text-slate">{note}</p>
    </>
  );
}

/** Inline spinner (CSS animation honours reduced-motion globally). */
export function Spinner() {
  return (
    <span
      aria-hidden
      className="h-[15px] w-[15px] flex-none animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

/* ------------------------------------------------------------------
   The HONEST non-mastery exit, shared by both AI-graded modalities. Shown when a
   learner moves on from a result that did not clear the bar, or when grading was
   unavailable and they continued. Nothing was recorded, so this screen makes NO
   mastery claim: no "Skill mastered" badge, no "+1", no "streak kept", and the
   count is unchanged. Mirrors CompletionOverlay's modal mechanics.
   ------------------------------------------------------------------ */
export function DraftSavedOverlay({
  skillTitle,
  masteredCount,
  totalSkills,
  onContinue,
  badgeLabel = 'Draft saved',
  body = 'This draft did not clear the bar yet, so the skill is not mastered. Your writing is kept. Come back and revise to earn it.',
}: {
  skillTitle: string;
  /** Mastered count, UNCHANGED by this attempt (nothing was recorded). */
  masteredCount: number;
  totalSkills: number;
  onContinue: () => void;
  /** Chip wording, e.g. "Draft saved" (artifact) or "Attempt saved" (roleplay). */
  badgeLabel?: string;
  /** The honest body sentence describing what was (not) recorded. */
  body?: string;
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="draftSavedTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinue();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-panel/75 p-6 backdrop-blur-[3px]"
    >
      <div className="w-full max-w-[420px] rounded-[14px] border border-line bg-paper px-7 pb-[26px] pt-[30px] text-center shadow-console-lg">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-line bg-panel text-slate">
            <FileIcon size={30} />
          </div>
        </div>

        <span className="mono mx-auto mt-[18px] inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
          <FileIcon size={13} />
          {badgeLabel}
        </span>

        <h3
          id="draftSavedTitle"
          className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-ink"
        >
          {skillTitle}
        </h3>

        <p className="mx-auto mt-2.5 max-w-[320px] text-[13.5px] leading-[1.6] text-slate">
          {body}
        </p>

        <div className="mx-auto mt-4 grid max-w-[280px] gap-2 text-left">
          <div className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
            <CircleIcon size={13} className="flex-none text-faint" />
            <span>Not yet mastered</span>
            <span className="mono ml-auto text-[11px] uppercase tracking-[0.06em] text-faint">
              {padIndex(masteredCount)} / {padIndex(totalSkills)}
            </span>
          </div>
        </div>

        <button
          ref={continueRef}
          type="button"
          onClick={onContinue}
          className="mono mt-[22px] inline-flex w-full items-center justify-center gap-2 rounded-console border-0 bg-accent py-[13px] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-[background,transform] duration-150 hover:bg-accent-700 active:translate-y-px"
        >
          Back to the path
          <ArrowRightIcon size={15} />
        </button>
      </div>
    </div>
  );
}
