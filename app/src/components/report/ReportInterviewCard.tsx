'use client';

import { useMemo } from 'react';
import type { InterviewEntry } from '@/lib/readinessReport';
import { Scorecard } from '@/components/interview/Scorecard';
import { ClockIcon, UsersIcon } from '@/components/console/Icon';
import type { PublicReportCase } from './ReadinessReport';

/**
 * One scored mock interview, rendered for the readiness report.
 *
 * Header: the case identity (title, kind chip, interviewer, when it was graded).
 * Body: the committee scorecard — REUSED verbatim from the live session via the
 * shared `Scorecard`, with a no-op evidence callback (the report is a static
 * record, so a chip has nowhere to scroll; the [n] still reads as a pointer to
 * the numbered turn below). Then the FULL transcript as the attached work
 * sample, with each candidate turn carrying its [n] number so the scorecard's
 * evidence anchors line up.
 *
 * `break-inside-avoid` keeps a card from splitting across a printed page.
 */

/** Evidence chips have nowhere to jump in a static report; swallow the click. */
const noopEvidence = () => {};

export function ReportInterviewCard({
  entry,
  publicCase,
}: {
  entry: InterviewEntry;
  publicCase: PublicReportCase;
}) {
  // Number each candidate turn so the transcript's [n] anchors match the
  // evidence chips in the scorecard — the same numbering the live session uses.
  const candidateTurnNumbers = useMemo(() => {
    const map = new Map<number, number>();
    let n = 0;
    entry.messages.forEach((m, i) => {
      if (m.role === 'candidate') {
        n += 1;
        map.set(i, n);
      }
    });
    return map;
  }, [entry.messages]);

  const kindLabel = publicCase.kind === 'product-sense' ? 'Product sense' : 'Execution';

  return (
    <article className="rounded-console-lg border border-line bg-paper p-[18px_20px] break-inside-avoid print:border-line">
      {/* header: identity + when it was graded */}
      <header className="border-b border-dashed border-line pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent print:bg-transparent">
            <UsersIcon size={12} />
            {kindLabel}
          </span>
          <span className="mono inline-flex items-center gap-1 rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate print:bg-transparent">
            <ClockIcon size={12} />
            {publicCase.durationMin} min
          </span>
          {entry.scoredAt > 0 && (
            <span className="mono ml-auto text-[10.5px] uppercase tracking-[0.1em] text-faint tnum">
              Scored {formatDate(new Date(entry.scoredAt))}
            </span>
          )}
        </div>
        <h3 className="mt-2.5 text-[17px] font-bold leading-[1.3] tracking-[-0.01em] text-ink">
          {publicCase.title}
        </h3>
        <p className="mono mt-1 text-[11px] uppercase tracking-[0.1em] text-mute">
          Interviewer · {publicCase.interviewerName}
        </p>
      </header>

      {/* the committee scorecard (reused from the live session) */}
      <div className="mt-4">
        <Scorecard scorecard={entry.scorecard} onEvidenceClick={noopEvidence} />
      </div>

      {/* the attached work sample: the full numbered transcript */}
      {entry.messages.length > 0 && (
        <section className="mt-4 border-t border-dashed border-line pt-3.5">
          <div className="mono mb-2.5 text-[10px] uppercase tracking-[0.12em] text-mute">
            Transcript · work sample
          </div>
          <div className="grid gap-2.5">
            {entry.messages.map((m, i) => (
              <TranscriptTurn
                key={i}
                role={m.role}
                text={m.text}
                interviewerName={publicCase.interviewerName}
                turnNumber={candidateTurnNumbers.get(i)}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

/**
 * One transcript turn in the report. Interviewer and candidate are told apart by
 * a text label AND alignment/tint (never colour alone). Candidate turns carry the
 * visible [n] number the scorecard's evidence anchors reference.
 */
function TranscriptTurn({
  role,
  text,
  interviewerName,
  turnNumber,
}: {
  role: 'interviewer' | 'candidate';
  text: string;
  interviewerName: string;
  turnNumber?: number;
}) {
  const isCandidate = role === 'candidate';
  return (
    <div className={`flex ${isCandidate ? 'justify-end' : 'justify-start'} print:justify-start`}>
      <div className="max-w-[86%] print:max-w-none">
        <div
          className={`mono mb-1 flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.1em] ${
            isCandidate ? 'justify-end text-accent print:justify-start' : 'text-mute'
          }`}
        >
          {isCandidate && turnNumber && (
            <span className="tnum rounded-console-sm bg-accent-050 px-1 py-px text-accent print:bg-transparent">
              [{turnNumber}]
            </span>
          )}
          {isCandidate ? 'Candidate' : interviewerName}
        </div>
        <div
          className={[
            'rounded-console-lg px-3.5 py-2.5 text-[13px] leading-[1.6] whitespace-pre-wrap',
            isCandidate
              ? 'rounded-tr-sm border border-accent-100 bg-accent-050 text-ink print:bg-transparent'
              : 'rounded-tl-sm border border-line bg-panel text-ink-2 print:bg-transparent',
          ].join(' ')}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

/** A stable, locale-independent date string, e.g. "7 Jul 2026". */
function formatDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
