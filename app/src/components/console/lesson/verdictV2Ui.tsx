'use client';

import type { ReactNode } from 'react';
import type {
  Annotation,
  ArtifactVerdictV2,
} from '@/lib/artifactGraderV2';
import {
  annotationsByBlock,
  scoreTrajectory,
  severityMeta,
  type AnnotationTone,
  type StoredVersion,
  type VersionHistory,
} from '@/lib/artifactVersionsV2';
import { splitIntoBlocks } from '@/lib/artifactGraderV2';
import { Verdict } from './verdictUi';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleIcon,
  InfoIcon,
  SparkleIcon,
  TrendingUpIcon,
} from '../Icon';

/**
 * V2 verdict rendering: the shared rubric `Verdict` (score ring + criterion
 * bands + strengths/gaps/overall) PLUS the three things V2 adds — the topFix
 * callout, the inline annotations anchored to numbered blocks, and (on a
 * revision) the delta view with the score trajectory.
 *
 * All colour is paired with an icon AND a word, never colour alone, matching the
 * rest of the verdict UI. Tone tokens come from `severityMeta` so the mapping is
 * unit-tested, not re-decided here.
 */

const TONE_TEXT: Record<AnnotationTone, string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
};
// Semantic state surfaces reuse the design system's -line borders and -050
// tints (the same pairing the accent chips use), so the annotation cards sit in
// the Console palette rather than inventing new opacity values.
const TONE_BORDER: Record<AnnotationTone, string> = {
  good: 'border-good-line',
  warn: 'border-warn-line',
  bad: 'border-bad-line',
};
const TONE_BG: Record<AnnotationTone, string> = {
  good: 'bg-good-050',
  warn: 'bg-warn-050',
  bad: 'bg-bad-050',
};
const TONE_DOT: Record<AnnotationTone, string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
};

function toneIcon(tone: AnnotationTone): ReactNode {
  if (tone === 'good') return <SparkleIcon size={13} />;
  if (tone === 'warn') return <CircleIcon size={11} />;
  return <AlertTriangleIcon size={13} />;
}

/* ------------------------------------------------------------------
   TOP FIX. The single highest-leverage change, called out above everything.
   ------------------------------------------------------------------ */
export function TopFixCallout({ topFix }: { topFix: string }) {
  if (!topFix) return null;
  return (
    <div className="mb-3.5 flex gap-2.5 rounded-console border border-accent-100 bg-accent-050 p-[12px_14px]">
      <TrendingUpIcon size={16} className="mt-0.5 flex-none text-accent" />
      <div>
        <div className="mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-accent">
          Fix this first
        </div>
        <p className="mt-1 text-[13.5px] leading-[1.55] text-ink-2">{topFix}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   ONE INLINE ANNOTATION CARD. Severity-coloured, with an optional rewrite.
   ------------------------------------------------------------------ */
function AnnotationCard({ annotation }: { annotation: Annotation }) {
  const meta = severityMeta(annotation.severity);
  return (
    <div
      className={`rounded-console border ${TONE_BORDER[meta.tone]} ${TONE_BG[meta.tone]} p-[10px_12px]`}
    >
      <div
        className={`mono flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${TONE_TEXT[meta.tone]}`}
      >
        {toneIcon(meta.tone)}
        {meta.label}
      </div>
      <p className="mt-1 text-[13px] leading-[1.55] text-ink-2">{annotation.comment}</p>
      {annotation.rewriteSuggestion && (
        <div className="mt-2 rounded-console-sm border border-dashed border-line bg-paper p-[8px_10px]">
          <div className="mono text-[9.5px] uppercase tracking-[0.1em] text-mute">
            Try instead
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-ink">
            {annotation.rewriteSuggestion}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   THE ANNOTATED SUBMISSION. The submission re-rendered as numbered blocks, with
   each block's annotations pinned directly beneath it. Blocks are numbered by
   the SAME `splitIntoBlocks` the server used, so an annotation on block 3 lands
   on the block shown as [3].
   ------------------------------------------------------------------ */
export function AnnotatedSubmission({
  submission,
  annotations,
}: {
  submission: string;
  annotations: Annotation[];
}) {
  const blocks = splitIntoBlocks(submission);
  const byBlock = annotationsByBlock(annotations);
  if (blocks.length === 0) return null;

  return (
    <div className="grid gap-2.5">
      <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
        Your draft, marked up
      </div>
      <ol className="grid gap-2.5">
        {blocks.map((block) => {
          const notes = byBlock.get(block.index) ?? [];
          const isHeader = /^\s*##\s+/.test(block.text);
          const headerText = isHeader ? block.text.replace(/^\s*##\s+/, '') : block.text;
          return (
            <li key={block.index} className="rounded-console border border-line bg-paper">
              <div className="flex gap-2.5 p-[11px_13px]">
                <span className="mono tnum mt-[1px] flex h-5 w-5 flex-none items-center justify-center rounded-full bg-panel-2 text-[10.5px] font-semibold text-slate">
                  {block.index}
                </span>
                <p
                  className={
                    isHeader
                      ? 'text-[13px] font-semibold uppercase tracking-[0.04em] text-ink'
                      : 'whitespace-pre-wrap text-[13.5px] leading-[1.6] text-ink-2'
                  }
                >
                  {headerText}
                </p>
              </div>
              {notes.length > 0 && (
                <div className="grid gap-2 border-t border-dashed border-line p-[10px_13px]">
                  {notes.map((a, i) => (
                    <AnnotationCard key={i} annotation={a} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------
   THE DELTA VIEW. Only on a revision: addressed (green) / ignored (amber) /
   regressions (red) + the score trajectory (v1 → v2 → ...).
   ------------------------------------------------------------------ */
function DeltaList({
  tone,
  title,
  items,
  icon,
}: {
  tone: AnnotationTone;
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

/** The v1 → v2 → ... score trajectory chips. */
export function ScoreTrajectory({ history }: { history: VersionHistory }) {
  const scores = scoreTrajectory(history);
  if (scores.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
        Trajectory
      </span>
      {scores.map((score, i) => {
        const prev = i > 0 ? scores[i - 1] : null;
        const delta = prev != null && score != null ? score - prev : null;
        const tone: AnnotationTone =
          delta == null ? 'warn' : delta > 0 ? 'good' : delta < 0 ? 'bad' : 'warn';
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && <ArrowRightIcon size={12} className="text-faint" />}
            <span
              className={`mono tnum inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                i === scores.length - 1
                  ? `${TONE_BORDER[tone]} ${TONE_TEXT[tone]}`
                  : 'border-line text-slate'
              }`}
            >
              v{i + 1}
              <span className="text-ink">{score ?? '—'}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function DeltaView({
  verdict,
  history,
}: {
  verdict: ArtifactVerdictV2;
  history: VersionHistory;
}) {
  const delta = verdict.delta;
  if (!delta) return null;

  return (
    <div className="mt-3.5 rounded-console-lg border border-line bg-panel p-[13px_15px]">
      <div className="flex items-center gap-2">
        <TrendingUpIcon size={15} className="flex-none text-accent" />
        <span className="mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">
          What your revision changed
        </span>
      </div>

      <div className="mt-2.5">
        <ScoreTrajectory history={history} />
      </div>

      {delta.scoreChangeExplanation && (
        <p className="mt-2.5 text-[13px] leading-[1.55] text-ink-2">
          {delta.scoreChangeExplanation}
        </p>
      )}

      <div className="mt-3 grid gap-3 border-t border-dashed border-line pt-3">
        <DeltaList
          tone="good"
          title="Addressed"
          items={delta.addressed}
          icon={<CheckIcon size={13} />}
        />
        <DeltaList
          tone="warn"
          title="Still open"
          items={delta.ignored}
          icon={<CircleIcon size={11} />}
        />
        <DeltaList
          tone="bad"
          title="Regressions"
          items={delta.regressions}
          icon={<AlertTriangleIcon size={13} />}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   THE FULL V2 VERDICT. topFix + shared rubric verdict + delta + annotations.
   The annotated submission is rendered separately (below the dock) because it
   is tall; this is the compact dock summary.
   ------------------------------------------------------------------ */
export function VerdictV2({
  verdict,
  passed,
  history,
}: {
  verdict: ArtifactVerdictV2;
  passed: boolean;
  history: VersionHistory;
}) {
  return (
    <>
      <TopFixCallout topFix={verdict.topFix} />
      <Verdict verdict={verdict} passed={passed} />
      <DeltaView verdict={verdict} history={history} />
      {verdict.annotations.length > 0 && (
        <div className="mt-3 flex gap-2 border-t border-dashed border-line pt-3 text-[12.5px] text-slate">
          <InfoIcon size={14} className="mt-0.5 flex-none text-slate" />
          <span>
            {verdict.annotations.length} inline{' '}
            {verdict.annotations.length === 1 ? 'note is' : 'notes are'} pinned to your
            draft above.
          </span>
        </div>
      )}
    </>
  );
}

/** Re-export for callers that render a single stored version's markup. */
export type { StoredVersion };
