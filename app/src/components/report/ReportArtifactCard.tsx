'use client';

import type { ArtifactEntry } from '@/lib/readinessReport';
import { Verdict } from '@/components/console/lesson/verdictUi';
import {
  AnnotatedSubmission,
  ScoreTrajectory,
  TopFixCallout,
} from '@/components/console/lesson/verdictV2Ui';
import { FileIcon } from '@/components/console/Icon';

/**
 * One graded artifact skill, rendered for the readiness report.
 *
 * Header: the resolved artifact title + a version count. Body: the score
 * trajectory (v1 → v2 → …), then the LATEST verdict — its topFix callout, the
 * per-criterion 0–3 bands, and strengths/gaps — REUSED verbatim from the shared
 * `Verdict` + V2 verdict pieces so the report speaks the same visual language as
 * the live grade. Then the latest submission as the attached work sample:
 * numbered blocks with the inline annotations pinned to them (`AnnotatedSubmission`).
 *
 * `break-inside-avoid` keeps a card off a printed page break.
 */
export function ReportArtifactCard({
  entry,
  title,
}: {
  entry: ArtifactEntry;
  title: string;
}) {
  const { latestVerdict, latestVersion } = entry;
  const versionCount = entry.history.versions.length;

  return (
    <article className="rounded-console-lg border border-line bg-paper p-[18px_20px] break-inside-avoid print:border-line">
      {/* header: identity + how many versions were submitted */}
      <header className="border-b border-dashed border-line pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-line bg-panel-2 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate print:bg-transparent">
            <FileIcon size={12} />
            Artifact
          </span>
          <span className="mono ml-auto text-[10.5px] uppercase tracking-[0.1em] text-faint tnum">
            {versionCount} {versionCount === 1 ? 'version' : 'versions'}
          </span>
        </div>
        <h3 className="mt-2.5 text-[17px] font-bold leading-[1.3] tracking-[-0.01em] text-ink">
          {title}
        </h3>
      </header>

      {/* the score trajectory (only shows when there are 2+ versions) */}
      {versionCount >= 2 && (
        <div className="mt-3.5">
          <ScoreTrajectory history={entry.history} />
        </div>
      )}

      {/* the latest verdict, reused from the live grade */}
      {latestVerdict ? (
        <div className="mt-4">
          <TopFixCallout topFix={latestVerdict.topFix} />
          <Verdict verdict={latestVerdict} passed={latestVerdict.passed} />
        </div>
      ) : (
        <p className="mt-4 text-[13px] leading-[1.6] text-slate">
          The latest submission came back without a parseable grade, so no verdict is
          shown. The draft is attached below for the record.
        </p>
      )}

      {/* the attached work sample: the latest draft, marked up */}
      <section className="mt-4 border-t border-dashed border-line pt-3.5">
        <div className="mono mb-2.5 text-[10px] uppercase tracking-[0.12em] text-mute">
          Latest submission · work sample
        </div>
        <AnnotatedSubmission
          submission={latestVersion.submission}
          annotations={latestVerdict?.annotations ?? []}
        />
      </section>
    </article>
  );
}
