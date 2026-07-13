'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { InterviewCase } from '@/curriculum/interview';
import { Topbar } from '@/components/console/Topbar';
import { useHydrated } from '@/components/console/sim/useHydrated';
import { useAuthStore } from '@/store/authStore';
import { useActiveIndustry } from '@/store/industryStore';
import { getArtifactContent, resolveArtifact } from '@/curriculum/artifacts';
import type { IndustryContext } from '@/curriculum/lessons/types';
import {
  INDUSTRIES,
  INDUSTRY_NOUNS,
  type IndustryId,
} from '@/curriculum/industries';
import { ScoreTrajectory } from '@/components/console/lesson/verdictV2Ui';
import {
  assembleReport,
  browserStorage,
  type ArtifactEntry,
  type InterviewEntry,
} from '@/lib/readinessReport';
import { ReportInterviewCard } from './ReportInterviewCard';
import { ReportArtifactCard } from './ReportArtifactCard';
import { ReportSection } from './ReportSection';
import { CareerFileSection } from './CareerFileSection';
import {
  ArrowRightIcon,
  CapIcon,
  CheckIcon,
  FileIcon,
  InfoIcon,
  UsersIcon,
} from '@/components/console/Icon';

/**
 * THE READINESS REPORT (Slice C): the shareable / printable credential.
 *
 * It aggregates the AI-graded work a learner has actually produced — scored mock
 * interviews and graded artifacts — into one inspectable record they can print
 * to PDF and attach to an application. The honest framing runs through the whole
 * page: the credential is the WORK, not a manufactured "readiness score". So the
 * summary strip shows earned counts and bands, every section attaches the real
 * work sample (numbered transcript turns, marked-up drafts), and the header says
 * plainly this is a practice record, not a certification.
 *
 * COMPOSITION + SECURITY
 * ----------------------
 * Client component (it reads the learner's graded history from localStorage,
 * hydration-gated so the first paint matches the server). The interview case
 * METADATA is passed in from the server page as `PublicReportCase[]` — the full
 * `InterviewCase` carries the hidden `brief`, which must never reach the client,
 * so this component never imports the interview registry.
 *
 * PRINT
 * -----
 * The screen version lives in the Console design system. `@media print` via
 * Tailwind `print:` variants hides the chrome (Topbar, buttons), keeps each
 * scorecard / artifact card off a page break (`break-inside-avoid`), and renders
 * black-on-white. The "Download as PDF" button simply calls `window.print()`.
 */

/**
 * The candidate-visible slice of an interview case the report renders. Derived
 * from the same `Omit<InterviewCase, 'brief'>` public pattern the session route
 * uses; the report only needs the identity + scored dimensions, so we pick that
 * subset explicitly (the brief, opening, and setup never cross to the client).
 */
export type PublicReportCase = Pick<
  InterviewCase,
  'id' | 'kind' | 'title' | 'interviewerName' | 'durationMin' | 'dimensions'
>;

/** Build the small industry context an authored artifact resolves against. */
function industryContext(id: IndustryId): IndustryContext {
  const label = INDUSTRIES.find((i) => i.id === id)?.label ?? id;
  const nouns = INDUSTRY_NOUNS[id];
  return { id, label, product: nouns.product, user: nouns.user };
}

export function ReadinessReport({ publicCases }: { publicCases: PublicReportCase[] }) {
  // Gate the localStorage read on hydration so the server + first client paint
  // agree (the empty shell), then the assembled report once mounted.
  const hydrated = useHydrated();
  // The active home industry, SSR-safe (default until the store rehydrates), used
  // to resolve artifact titles exactly as the artifact lesson does.
  const industry = useActiveIndustry();
  // The signed-in email, when available — omitted when signed out / unconfigured.
  const email = useAuthStore((s) => (s.status === 'signed-in' ? s.user?.email ?? null : null));

  // Index the public cases by id so the interview cards can resolve metadata.
  const caseById = useMemo(() => {
    const map = new Map<string, PublicReportCase>();
    for (const c of publicCases) map.set(c.id, c);
    return map;
  }, [publicCases]);

  // Assemble the report from localStorage, but only after hydration — before
  // that the storage read is skipped so the first paint is the empty shell.
  const report = useMemo(
    () => assembleReport(hydrated ? browserStorage() : null),
    [hydrated],
  );

  const ctx = useMemo(() => industryContext(industry), [industry]);
  const generatedOn = useMemo(() => formatDate(new Date()), []);

  return (
    <>
      {/* chrome: hidden in print so the PDF is just the credential */}
      <div className="print:hidden">
        <Topbar
          right={
            <div className="flex items-center gap-2">
              <Link
                href="/progress"
                className="mono inline-flex items-center gap-1.5 rounded-console border border-line bg-paper px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
              >
                <CapIcon size={13} />
                Progress
              </Link>
              <PrintButton />
            </div>
          }
        />
      </div>

      <main className="flex-auto print:block">
        <div className="mx-auto max-w-[880px] px-6 pb-20 print:max-w-none print:px-0 print:pb-0">
          <ReportHeader email={email} generatedOn={generatedOn} />

          {/* Before hydration: a neutral placeholder line so the shell is not a
              flash of "nothing graded" that then pops into content. */}
          {!hydrated ? (
            <p className="mono mt-8 text-[12px] uppercase tracking-[0.1em] text-faint">
              Loading your record…
            </p>
          ) : (
            <>
              {report.isEmpty ? (
                <EmptyReport />
              ) : (
                <>
                  <SummaryStrip report={report} />

                  <ReportSection
                    title="Mock interviews"
                    icon={<UsersIcon size={13} />}
                    count={report.interviews.length}
                    emptyLabel="No scored interviews yet."
                    emptyHref="/interview"
                    emptyCta="Sit a mock interview"
                  >
                    {report.interviews.map((entry) => (
                      <InterviewCardOrFallback
                        key={entry.caseId}
                        entry={entry}
                        publicCase={caseById.get(entry.caseId)}
                      />
                    ))}
                  </ReportSection>

                  <ReportSection
                    title="Graded artifacts"
                    icon={<FileIcon size={13} />}
                    count={report.artifacts.length}
                    emptyLabel="No graded artifacts yet."
                    emptyHref="/"
                    emptyCta="Practise an artifact"
                  >
                    {report.artifacts.map((entry) => (
                      <ArtifactCardOrFallback key={entry.skillId} entry={entry} ctx={ctx} />
                    ))}
                  </ReportSection>
                </>
              )}

              {/* Career File (design-sim-2.0.md §2.4): a SEPARATE data source
                  (the client-only decision log, not the interview/artifact
                  history above), so it renders — and has its own empty state —
                  regardless of whether the sections above have anything. */}
              <CareerFileSection />
            </>
          )}
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------
   HEADER: title, generation date, signed-in email, and the honesty line.
   ------------------------------------------------------------------ */
function ReportHeader({
  email,
  generatedOn,
}: {
  email: string | null;
  generatedOn: string;
}) {
  return (
    <header className="border-b-2 border-line pb-6 pt-9 print:pt-4">
      <p className="eyebrow print:text-slate">Praxis · practice record</p>
      <h1 className="mt-2.5 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink max-[560px]:text-[25px]">
        Praxis Readiness Report
      </h1>

      <div className="mono mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-faint">
        <span className="tnum">Generated {generatedOn}</span>
        {email && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-1 w-1 rounded-full bg-faint" />
            {email}
          </span>
        )}
      </div>

      {/* The honesty line: what this is, and — plainly — what it is not. */}
      <div className="mt-4 flex gap-2 rounded-console border border-line bg-panel p-[12px_14px] print:border-line print:bg-transparent">
        <InfoIcon size={14} className="mt-0.5 flex-none text-slate" />
        <p className="text-[12.5px] leading-[1.6] text-slate">
          Every result here is rubric-based AI grading on a 0–3 band scale, with the
          work samples attached for inspection. This is a practice record, not a
          certification.
        </p>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------
   SUMMARY STRIP: derived counts + the best earned interview band. No composite
   "rating" — only numbers that were earned.
   ------------------------------------------------------------------ */
function SummaryStrip({ report }: { report: ReturnType<typeof assembleReport> }) {
  const { summary } = report;
  return (
    <section
      aria-label="Summary"
      className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4 print:grid-cols-4"
    >
      <SummaryStat label="Interviews scored" value={summary.interviewsScored} />
      <SummaryStat label="Artifacts graded" value={summary.artifactsGraded} />
      <SummaryStat
        label="Artifacts passed"
        value={summary.artifactsPassed}
        icon={summary.artifactsPassed > 0 ? <CheckIcon size={13} className="text-good" /> : undefined}
      />
      <SummaryStat
        label="Best interview"
        value={summary.bestInterviewBand ? titleCase(summary.bestInterviewBand) : '—'}
        wide={summary.bestInterviewBand !== null}
      />
    </section>
  );
}

function SummaryStat({
  label,
  value,
  icon,
  wide,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="rounded-console-lg border border-line bg-paper p-[13px_15px] break-inside-avoid print:border-line">
      <div className="mono text-[10px] uppercase leading-tight tracking-[0.12em] text-mute">
        {label}
      </div>
      <div
        className={`mt-1 inline-flex items-center gap-1.5 font-semibold text-ink ${
          wide ? 'text-[15px]' : 'mono tnum text-[22px]'
        }`}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}

/**
 * An interview card, or a minimal fallback if the case metadata is missing (e.g.
 * a scored save whose case was later removed from the registry). The fallback
 * still attests to the grade rather than dropping it silently.
 */
function InterviewCardOrFallback({
  entry,
  publicCase,
}: {
  entry: InterviewEntry;
  publicCase: PublicReportCase | undefined;
}) {
  if (!publicCase) {
    return (
      <div className="rounded-console-lg border border-line bg-paper p-[16px_18px] break-inside-avoid">
        <div className="mono text-[11px] uppercase tracking-[0.1em] text-mute">
          Interview · {entry.caseId}
        </div>
        <p className="mt-1.5 text-[13px] text-slate">
          This case is no longer in the catalog, so its details are unavailable — the
          scored result is kept for the record.
        </p>
      </div>
    );
  }
  return <ReportInterviewCard entry={entry} publicCase={publicCase} />;
}

/** An artifact card, or a fallback if the artifact content is missing. */
function ArtifactCardOrFallback({
  entry,
  ctx,
}: {
  entry: ArtifactEntry;
  ctx: IndustryContext;
}) {
  const content = getArtifactContent(entry.skillId);
  if (!content) {
    return (
      <div className="rounded-console-lg border border-line bg-paper p-[16px_18px] break-inside-avoid">
        <div className="mono text-[11px] uppercase tracking-[0.1em] text-mute">
          Artifact · {entry.skillId}
        </div>
        <p className="mt-1.5 text-[13px] text-slate">
          This artifact is no longer in the catalog, so its details are unavailable —
          the graded result is kept for the record.
        </p>
        {entry.trajectory.length >= 2 && (
          <div className="mt-2.5">
            <ScoreTrajectory history={entry.history} />
          </div>
        )}
      </div>
    );
  }
  const resolved = resolveArtifact(content, ctx);
  return <ReportArtifactCard entry={entry} title={resolved.title} />;
}

/* ------------------------------------------------------------------
   EMPTY STATE: nothing graded at all. Calm, points at where to earn results.
   ------------------------------------------------------------------ */
function EmptyReport() {
  return (
    <section className="mt-9 rounded-console-lg border border-line bg-paper p-[26px_24px] text-center break-inside-avoid">
      <span className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full border border-line bg-panel text-slate">
        <FileIcon size={28} />
      </span>
      <h2 className="mt-4 text-[18px] font-bold tracking-[-0.01em] text-ink">
        Nothing graded yet
      </h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-[13.5px] leading-[1.6] text-slate">
        This report fills in as you do graded work. Sit a mock interview to earn a
        committee scorecard, or write an artifact to get rubric feedback — both are
        attached here as inspectable work samples.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5 print:hidden">
        <Link
          href="/interview"
          className="mono inline-flex items-center gap-2 rounded-console border-0 bg-accent px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white shadow-console-md transition-[background,transform] duration-150 hover:bg-accent-700 active:translate-y-px"
        >
          <UsersIcon size={14} />
          Sit a mock interview
        </Link>
        <Link
          href="/"
          className="mono inline-flex items-center gap-2 rounded-console border border-line bg-paper px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink active:translate-y-px"
        >
          Find an artifact
          <ArrowRightIcon size={13} />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   PRINT BUTTON: triggers the browser's print-to-PDF. Hidden in print itself.
   ------------------------------------------------------------------ */
function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mono inline-flex items-center gap-1.5 rounded-console border-0 bg-accent px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-white shadow-console-md transition-[background,transform] duration-150 hover:bg-accent-700 active:translate-y-px"
    >
      <FileIcon size={13} />
      Download as PDF
    </button>
  );
}

/* ------------------------------------------------------------------
   SHARED FORMATTING HELPERS.
   ------------------------------------------------------------------ */

/** Title-case a lowercase band label, e.g. "lean hire" -> "Lean hire". */
function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A stable, locale-independent date string for the header, e.g. "7 Jul 2026". */
function formatDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
