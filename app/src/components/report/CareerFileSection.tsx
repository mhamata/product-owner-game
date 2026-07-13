'use client';

import { useMemo, useState } from 'react';
import type { DecisionLogEntry, InterviewStoryRecord } from '@/store/decisionLogStore';
import { useDecisionLogStore } from '@/store/decisionLogStore';
import { getScenarioForIndustry } from '@/scenarios';
import { INDUSTRIES, DEFAULT_INDUSTRY, isIndustryId } from '@/curriculum/industries';
import { UnavailableOrError } from '@/components/console/lesson/verdictUi';
import { useInterviewAmmo, type DraftedStory } from './useInterviewAmmo';
import { ReportSection } from './ReportSection';
import { LayersIcon, MessageIcon, RocketIcon, StarIcon } from '@/components/console/Icon';

/**
 * CAREER FILE (Slice: wedge-adjacent, design-sim-2.0.md §2.4 "Evidence Engine").
 *
 * A DERIVED-ONLY rendering of the player's decision log (`decisionLogStore`):
 * every sprint they committed, grouped by run, exactly as the sim recorded it
 * — no invented numbers, no reconstructed narrative. This is a SEPARATE data
 * source from the graded interview/artifact sections above it on `/report`
 * (that data comes from `readinessReport.ts`'s localStorage assembly); the
 * decision log lives in its own zustand store, already sync-allowlisted
 * end-to-end (`praxis-decision-log-v1`).
 *
 * Per run, a "Draft interview stories" button posts the run's entries to
 * `/api/interview-ammo` and renders the mentor-drafted STAR stories it comes
 * back with — persisted into the same store (`interviewStories`) so a draft
 * survives navigation without re-spending a model call.
 */

/** One run's decision-log entries, grouped and given a display-ready identity. */
interface CareerFileRun {
  runId: string;
  scenarioId: string;
  scenarioTitle: string;
  industryLabel: string | null;
  entries: DecisionLogEntry[];
}

/**
 * PURE: group flat entries into runs (newest run first, sprints in commit
 * order within a run), resolving the scenario title from the run's own
 * industry so it reads exactly as the player saw it in-sim.
 */
function groupRuns(entries: DecisionLogEntry[]): CareerFileRun[] {
  const byRun = new Map<string, DecisionLogEntry[]>();
  for (const entry of entries) {
    const list = byRun.get(entry.runId);
    if (list) list.push(entry);
    else byRun.set(entry.runId, [entry]);
  }

  const runs: CareerFileRun[] = [];
  for (const [runId, list] of byRun) {
    const sorted = [...list].sort((a, b) => a.sprint - b.sprint);
    const first = sorted[0];
    const industry = first.industry && isIndustryId(first.industry) ? first.industry : DEFAULT_INDUSTRY;
    const scenario = getScenarioForIndustry(first.scenarioId, industry);
    runs.push({
      runId,
      scenarioId: first.scenarioId,
      scenarioTitle: scenario?.name ?? first.scenarioId,
      industryLabel: first.industry
        ? INDUSTRIES.find((i) => i.id === first.industry)?.label ?? first.industry
        : null,
      entries: sorted,
    });
  }

  // Newest run first, by its most recent sprint's commit time.
  runs.sort((a, b) => {
    const aTime = a.entries[a.entries.length - 1]?.committedAt ?? '';
    const bTime = b.entries[b.entries.length - 1]?.committedAt ?? '';
    return bTime.localeCompare(aTime);
  });
  return runs;
}

export function CareerFileSection() {
  const hasHydrated = useDecisionLogStore((s) => s.hasHydrated);
  const entries = useDecisionLogStore((s) => s.entries);
  const interviewStories = useDecisionLogStore((s) => s.interviewStories);
  const setInterviewStories = useDecisionLogStore((s) => s.setInterviewStories);

  const runs = useMemo(() => (hasHydrated ? groupRuns(entries) : []), [hasHydrated, entries]);

  // The store's own hydration flag (distinct from the page-level `useHydrated`
  // mount gate above it): reads of `entries` are only meaningful once the
  // persisted store has actually rehydrated from localStorage.
  if (!hasHydrated) {
    return (
      <section className="mt-11 print:mt-8">
        <p className="mono text-[12px] uppercase tracking-[0.1em] text-faint">
          Loading your Career File…
        </p>
      </section>
    );
  }

  return (
    <ReportSection
      title="Career File"
      icon={<LayersIcon size={13} />}
      count={runs.length}
      emptyLabel="No sim runs logged yet."
      emptyHref="/play"
      emptyCta="Run a sim"
    >
      {runs.map((run) => (
        <CareerFileRunCard
          key={run.runId}
          run={run}
          stories={interviewStories[run.runId] ?? []}
          onStoriesDrafted={(stories) => setInterviewStories(run.runId, stories)}
        />
      ))}
    </ReportSection>
  );
}

/* ------------------------------------------------------------------
   ONE RUN: header (scenario, industry, sprint count) + every sprint row +
   the drafted STAR stories (if any) + the drafting control.
   ------------------------------------------------------------------ */
function CareerFileRunCard({
  run,
  stories,
  onStoriesDrafted,
}: {
  run: CareerFileRun;
  stories: InterviewStoryRecord[];
  onStoriesDrafted: (stories: InterviewStoryRecord[]) => void;
}) {
  const { drafting, draftStories } = useInterviewAmmo();
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDraft() {
    setUnavailable(null);
    setError(null);
    const result = await draftStories(run.runId, run.scenarioTitle, run.entries);
    if (result.kind === 'stories') {
      const draftedAt = new Date().toISOString();
      onStoriesDrafted(result.stories.map((s: DraftedStory) => ({ ...s, draftedAt })));
    } else if (result.kind === 'unavailable') {
      setUnavailable(result.message);
    } else {
      setError(result.message);
    }
  }

  return (
    <article className="rounded-console-lg border border-line bg-paper p-[18px_20px] break-inside-avoid print:border-line">
      {/* header: scenario identity + industry + sprint count */}
      <header className="flex flex-wrap items-center gap-2 border-b border-dashed border-line pb-3.5">
        {run.industryLabel && (
          <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-line bg-panel-2 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate print:bg-transparent">
            {run.industryLabel}
          </span>
        )}
        <span className="mono ml-auto text-[10.5px] uppercase tracking-[0.1em] text-faint tnum">
          {run.entries.length} {run.entries.length === 1 ? 'sprint' : 'sprints'} logged
        </span>
        <h3 className="mt-1 w-full text-[17px] font-bold leading-[1.3] tracking-[-0.01em] text-ink">
          {run.scenarioTitle}
        </h3>
      </header>

      {/* every sprint, exactly as the decision log recorded it */}
      <div className="mt-3.5 grid gap-3">
        {run.entries.map((entry) => (
          <SprintRow key={`${entry.runId}-${entry.sprint}`} entry={entry} />
        ))}
      </div>

      {/* drafted interview stories (persisted) */}
      {stories.length > 0 && (
        <section className="mt-4 border-t border-dashed border-line pt-3.5">
          <div className="mono mb-2.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-mute">
            <StarIcon size={12} />
            Interview stories · drafted from this run
          </div>
          <div className="grid gap-3">
            {stories.map((story, i) => (
              <StarCard key={i} story={story} />
            ))}
          </div>
        </section>
      )}

      {/* the drafting control + its calm unavailable / error states */}
      <div className="mt-4 border-t border-dashed border-line pt-3.5 print:hidden">
        <button
          type="button"
          onClick={handleDraft}
          disabled={drafting}
          className="mono inline-flex items-center gap-1.5 rounded-console border border-line bg-panel px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <StarIcon size={13} />
          {drafting ? 'Drafting…' : stories.length > 0 ? 'Redraft interview stories' : 'Draft interview stories'}
        </button>

        {unavailable && (
          <div className="mt-3 rounded-console-lg border border-line bg-panel p-[14px_16px]">
            <UnavailableOrError
              tone="warn"
              title="Drafting unavailable"
              body={unavailable}
              note="Your Career File is saved. You can try drafting again later."
            />
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-console-lg border border-line bg-panel p-[14px_16px]">
            <UnavailableOrError tone="bad" title="Draft failed" body={error} note="You can try again." />
          </div>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------
   ONE SPRINT ROW: goal, committed titles, release, event responses, the
   rationale (visually distinct — it's the one human-authored line), outcome.
   ------------------------------------------------------------------ */
function SprintRow({ entry }: { entry: DecisionLogEntry }) {
  return (
    <div className="rounded-console border border-line bg-panel p-[12px_14px] print:bg-transparent">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono tnum inline-flex items-center gap-1 rounded-console-sm border border-line bg-paper px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-mute print:bg-transparent">
          Sprint {entry.sprint}
        </span>
        {entry.sprintGoal && <span className="text-[13px] font-semibold text-ink">{entry.sprintGoal}</span>}
      </div>

      {entry.backlogTitles.length > 0 && (
        <p className="mt-1.5 text-[12.5px] leading-[1.5] text-slate">
          <span className="text-mute">Committed:</span> {entry.backlogTitles.join(', ')}
        </p>
      )}

      {entry.releaseCard && (
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] leading-[1.5] text-slate">
          <RocketIcon size={12} className="flex-none text-mute" />
          <span>
            <span className="text-mute">Release:</span> {entry.releaseCard}
          </span>
        </p>
      )}

      {entry.eventResponses.length > 0 && (
        <div className="mt-1.5 grid gap-1">
          {entry.eventResponses.map((response, i) => (
            <p key={i} className="text-[12.5px] leading-[1.5] text-slate">
              <span className="text-mute">Event:</span> &ldquo;{response.event}&rdquo;{' '}
              <span className="text-mute">→ Chose:</span> &ldquo;{response.choice}&rdquo;
            </p>
          ))}
        </div>
      )}

      {/* the rationale: visually distinct, because it's the human voice, not
          an engine-computed fact */}
      {entry.rationale && (
        <div className="mt-2 flex items-start gap-1.5 border-l-2 border-accent-100 pl-2.5">
          <MessageIcon size={12} className="mt-0.5 flex-none text-accent" />
          <p className="text-[12.5px] italic leading-[1.5] text-ink-2">&ldquo;{entry.rationale}&rdquo;</p>
        </div>
      )}

      {entry.outcome && (
        <p className="mt-2 border-t border-dashed border-line-2 pt-1.5 text-[12px] font-semibold text-ink">
          {entry.outcome.summary}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   ONE STAR CARD: the mentor-drafted story, labeled and sourced.
   ------------------------------------------------------------------ */
function StarCard({ story }: { story: InterviewStoryRecord }) {
  return (
    <div className="rounded-console border border-line bg-panel p-[14px_16px] print:bg-transparent">
      <h4 className="text-[13.5px] font-bold leading-[1.3] text-ink">{story.title}</h4>
      <div className="mt-2 grid gap-1.5">
        <StarField label="Situation" text={story.situation} />
        <StarField label="Task" text={story.task} />
        <StarField label="Action" text={story.action} />
        <StarField label="Result" text={story.result} />
      </div>
      {story.sprints.length > 0 && (
        <p className="mono mt-2 text-[10px] uppercase tracking-[0.1em] text-faint">
          from sprint{story.sprints.length > 1 ? 's' : ''} {story.sprints.join(', ')}
        </p>
      )}
    </div>
  );
}

function StarField({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <p className="text-[12.5px] leading-[1.55] text-slate">
      <span className="mono mr-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-mute">
        {label}
      </span>
      {text}
    </p>
  );
}
