'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { masterableSkills, allCompetencyCoverage } from '@/curriculum/data';
import { COMPETENCIES, type Competency } from '@/curriculum/types';
import {
  getScenario,
  judgmentIndustryContext,
  resolveScenario,
} from '@/curriculum/judgment';
import { useActiveIndustry } from '@/store/industryStore';
import { MASTERY_THRESHOLD, useLearnStore } from '@/store/learnStore';
import { useReviewStore, todayISO, type ReviewResult } from '@/store/reviewStore';
import { useSimEvidenceStore } from '@/store/simEvidenceStore';
import { useGameStore } from '@/store/gameStore';
import { useStandupStore } from '@/store/standupStore';
import { rolledDayProgress, deriveActsState, type ActStatus } from '@/lib/standupActs';
import {
  chooseWorkloadBlock,
  buildMentorLine,
  type WorkloadBlock,
} from '@/lib/scheduler';
import { averageCompetencyDecay } from '@/lib/masteryDecay';
import { SIM_LADDER } from '@/scenarios/ladder';
import { Topbar } from '../Topbar';
import { JudgmentCard } from '../review/JudgmentCard';
import { CheckIcon, ChevronRightIcon } from '../Icon';

/** How many due judgment cards Act 1 pulls in, per the design-doc mockup. */
const WARMUP_SIZE = 2;

/**
 * The Standup home: the daily three-act loop (Warm-up -> Workload -> Standup)
 * described in design-sim-2.0.md §3 and mocked in praxis-learn-mockup.html.
 * SELF-STUDY RULING (2026-07-16, Mike): all three acts are always fully
 * actionable — 'now' just highlights the recommended next one (the rail's
 * suggestion), it is never a requirement. The whole screen styles itself off
 * the `--px-*` Sim 2.0 tokens (see globals.css) rather than the Console's
 * `--color-*` scale, since this is the first surface to opt into the new
 * theme layer.
 */
export function StandupView() {
  const industry = useActiveIndustry();

  // ---- stores ----
  const learnHydrated = useLearnStore((s) => s.hasHydrated);
  const streak = useLearnStore((s) => s.streak);
  const isMastered = useLearnStore((s) => s.isMastered);
  const progress = useLearnStore((s) => s.progress);
  // Never call `s.masteredIds()` inside a zustand selector: it builds a fresh
  // Set on every store read, so useSyncExternalStore sees a changed snapshot
  // each render and loops ("getServerSnapshot should be cached" — crashed this
  // page). Subscribe to the stable `progress` reference and derive instead.
  const masteredIds = useMemo(
    () =>
      new Set(
        Object.keys(progress).filter(
          (id) => (progress[id]?.mastery ?? 0) >= MASTERY_THRESHOLD,
        ),
      ),
    [progress],
  );

  const reviewHydrated = useReviewStore((s) => s.hasHydrated);
  const dueToday = useReviewStore((s) => s.dueToday);
  const dueCount = useReviewStore((s) => s.dueCount);
  const review = useReviewStore((s) => s.review);

  const simHydrated = useSimEvidenceStore((s) => s.hasHydrated);
  const simScores = useSimEvidenceStore((s) => s.scores);

  const gameState = useGameStore((s) => s.state);
  const gameScenarioId = useGameStore((s) => s.scenarioId);

  const standupHydrated = useStandupStore((s) => s.hasHydrated);
  const standupProgressRaw = useStandupStore((s) => s.progress);
  const completeStandup = useStandupStore((s) => s.completeStandup);
  const standupProgress = useMemo(
    () => rolledDayProgress(standupProgressRaw, todayISO()),
    [standupProgressRaw],
  );

  const hasHydrated = learnHydrated && reviewHydrated && simHydrated && standupHydrated;

  // ---- Act 1: Warm-up — a fixed session snapshot, same pattern as /review's
  // ReviewView, so answering a card never reshuffles the queue mid-session.
  //
  // Snapshotted by ADJUSTING STATE DURING RENDER (React's documented pattern
  // for "derive once when an external condition first becomes true"), not an
  // effect: `didSnapshotWarmup` is the guard, so this branch runs exactly once
  // per mount, the moment `hasHydrated` flips true, with no extra commit/paint
  // round-trip the way an effect-based snapshot would need. ----
  const [warmupQueue, setWarmupQueue] = useState<string[] | null>(null);
  const [didSnapshotWarmup, setDidSnapshotWarmup] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<'picking' | 'revealed'>('picking');
  const [picked, setPicked] = useState<string | undefined>(undefined);

  if (hasHydrated && !didSnapshotWarmup) {
    setDidSnapshotWarmup(true);
    setWarmupQueue(dueToday().slice(0, WARMUP_SIZE));
  }

  const warmupComplete =
    warmupQueue !== null && (warmupQueue.length === 0 || cursor >= warmupQueue.length);

  const ctx = useMemo(() => judgmentIndustryContext(industry), [industry]);
  const currentCardId =
    warmupQueue && cursor < warmupQueue.length ? warmupQueue[cursor] : undefined;
  const currentScenario = useMemo(() => {
    if (!currentCardId) return undefined;
    const raw = getScenario(currentCardId);
    return raw ? resolveScenario(raw, ctx) : undefined;
  }, [currentCardId, ctx]);

  function handleWarmupPrimary() {
    if (!currentScenario) return;
    if (phase === 'picking') {
      if (!picked) return;
      const result: ReviewResult = picked === currentScenario.bestOptionId ? 'correct' : 'wrong';
      review(currentScenario.id, result);
      setPhase('revealed');
      return;
    }
    setCursor((c) => c + 1);
    setPhase('picking');
    setPicked(undefined);
  }

  // ---- Act 2: Workload — the scheduler's ONE chosen block, snapshotted once
  // per day-visit (same "adjust state during render" pattern as the warm-up
  // queue above) so mastering it mid-session doesn't make the scheduler pick
  // a different block out from under the learner. ----
  const [block, setBlock] = useState<WorkloadBlock | null | undefined>(undefined);
  const [didSnapshotBlock, setDidSnapshotBlock] = useState(false);

  if (hasHydrated && !didSnapshotBlock) {
    setDidSnapshotBlock(true);
    const coverageByCompetency = allCompetencyCoverage(masteredIds);
    const candidates = (Object.keys(COMPETENCIES) as Competency[]).map((c) => {
      // W4-H: fold decay into the scheduler's weakest-competency pick — a
      // competency whose mastered skills have gone rusty should resurface
      // even though its boolean coverage still reads "fully mastered".
      // Averaged across this competency's mastered ready skills only (see
      // masteryDecay.ts's averageCompetencyDecay); 1 (no discount) if none
      // are mastered yet, so the coverage term alone still carries the gap.
      const decayRecords = masterableSkills
        .filter((s) => s.competency === c)
        .map((s) => progress[s.id] ?? { mastery: 0, attempts: 0 });
      return {
        competency: c,
        coverage: coverageByCompetency[c],
        simScore: simScores[c],
        decayFactor: averageCompetencyDecay(decayRecords),
      };
    });
    setBlock(
      chooseWorkloadBlock({
        candidates,
        skills: masterableSkills,
        masteredIds,
        competencyLabel: (c) => COMPETENCIES[c].label,
      }),
    );
  }

  // No block available at all reads as "nothing left to assign today", which
  // must not stall the loop — treat it as already complete.
  const workloadComplete = block === null ? true : block ? isMastered(block.skillId) : false;

  // ---- Act 3: Standup — reads gameStore for a mid-flight run. ----
  const runMidFlight = gameState !== null && gameScenarioId !== null;
  const tutorialRung = SIM_LADDER[0];
  const standupHref = runMidFlight ? `/play/${gameScenarioId}` : `/play/${tutorialRung.scenarioId}`;
  const sprintNumber = gameState?.iterationNumber ?? null;

  // ---- gating + mentor line ----
  const acts = deriveActsState({
    warmupComplete,
    workloadComplete,
    standupComplete: standupProgress.standupComplete,
  });

  const mentorLine = buildMentorLine({
    dueCount: hasHydrated ? dueCount() : 0,
    streak: hasHydrated ? streak : 0,
    weakestCompetencyLabel: block?.competencyLabel ?? null,
  });

  // ---- loading (pre-hydration): stable, neutral frame ----
  if (!hasHydrated) {
    return (
      <>
        <Topbar context="standup" />
        <main className="flex-auto bg-[var(--px-ground)]">
          <div className="mx-auto max-w-[520px] px-5 py-16">
            <p className="mono text-center text-[12px] uppercase tracking-[0.08em] text-[var(--px-dimmer)]">
              Loading your standup...
            </p>
          </div>
        </main>
      </>
    );
  }

  // ---- today's loop already finished: a calm, done-for-the-day state ----
  if (standupProgress.standupComplete) {
    return (
      <>
        <Topbar context="standup" />
        <main className="flex-auto bg-[var(--px-ground)]">
          <div className="mx-auto flex max-w-[520px] flex-col items-center px-5 py-20 text-center">
            <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--px-good)]/12 text-[var(--px-good)]">
              <CheckIcon size={26} />
            </span>
            <h1 className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-[var(--px-ink)]">
              Today&apos;s standup is done
            </h1>
            <p className="mt-2.5 max-w-[42ch] text-[14.5px] leading-[1.6] text-[var(--px-body)]">
              Nice work. Come back tomorrow for the next one — your warm-up
              deck and workload block reset fresh each day.
            </p>
            <Link
              href="/"
              className="mono mt-7 inline-flex items-center gap-2 rounded-console bg-[var(--px-accent)] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--px-on-accent)] no-underline"
            >
              Back to the map
              <ChevronRightIcon size={15} />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar context="standup" />
      <main className="flex-auto bg-[var(--px-ground)]">
        <div className="mx-auto max-w-[520px] px-5 py-6 pb-16">
          {/* mentor line */}
          <div className="rounded-[14px] border border-[var(--px-line)] bg-[var(--px-card)] p-[14px_16px]">
            <span className="mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--px-accent)]">
              Your mentor
            </span>
            <p className="mt-1.5 text-[13.5px] leading-[1.5] text-[var(--px-body)]">
              {mentorLine}
            </p>
          </div>

          {/* acts progress rail */}
          <div className="mt-3 flex gap-1.5">
            {(
              [
                ['warmup', 'Warm-up'],
                ['workload', 'Workload'],
                ['standup', 'Standup'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex flex-1 flex-col gap-1">
                <div
                  className={[
                    'h-1 rounded-full',
                    acts[key] === 'done'
                      ? 'bg-[var(--px-good)]'
                      : acts[key] === 'now'
                        ? 'bg-[var(--px-accent)]'
                        : 'bg-[var(--px-line)]',
                  ].join(' ')}
                />
                <span
                  className={[
                    'text-[10px] font-semibold tracking-[0.04em]',
                    acts[key] === 'now'
                      ? 'text-[var(--px-accent)]'
                      : acts[key] === 'done'
                        ? 'text-[var(--px-dim)]'
                        : 'text-[var(--px-dimmer)]',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Act 1: Warm-up */}
          <ActEyebrow>Act 1 · Warm-up</ActEyebrow>
          {warmupQueue === null ? null : warmupQueue.length === 0 ? (
            <CalmLine>
              Deck&apos;s clear — nothing due right now.
            </CalmLine>
          ) : warmupComplete ? (
            <CalmLine>
              <b className="text-[var(--px-good)]">Warm-up done</b> — your
              misses joined the review deck; they&apos;ll come back in a
              different industry skin.
            </CalmLine>
          ) : currentScenario ? (
            <div>
              <p className="mono mb-2 text-[11px] uppercase tracking-[0.08em] text-[var(--px-dimmer)]">
                Card {cursor + 1} of {warmupQueue.length}
              </p>
              <JudgmentCard
                key={currentScenario.id}
                scenario={currentScenario}
                answer={picked}
                locked={phase === 'revealed'}
                onAnswer={(id) => setPicked(id)}
              />
              <button
                type="button"
                disabled={phase === 'picking' && !picked}
                onClick={handleWarmupPrimary}
                className={[
                  'mono mt-3 inline-flex w-full items-center justify-center gap-2 rounded-console px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.08em]',
                  phase === 'picking' && !picked
                    ? 'cursor-not-allowed bg-[var(--px-line)] text-[var(--px-dimmer)]'
                    : 'bg-[var(--px-accent)] text-[var(--px-on-accent)]',
                ].join(' ')}
              >
                {phase === 'picking' ? 'Reveal the call' : 'Next'}
              </button>
            </div>
          ) : null}

          {/* Act 2: Workload */}
          <ActEyebrow>Act 2 · Workload</ActEyebrow>
          <WorkloadCard status={acts.workload} block={block} mastered={workloadComplete} />

          {/* Act 3: Standup */}
          <ActEyebrow>Act 3 · Your standup</ActEyebrow>
          <StandupCard
            status={acts.standup}
            runMidFlight={runMidFlight}
            sprintNumber={sprintNumber}
            href={standupHref}
            onOpen={completeStandup}
          />
        </div>
      </main>
    </>
  );
}

function ActEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mono mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
      {children}
    </p>
  );
}

function CalmLine({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[var(--px-line)] bg-[var(--px-card)] p-[11px_13px] text-[12.5px] leading-[1.5] text-[var(--px-dim)]">
      {children}
    </div>
  );
}

function WorkloadCard({
  status,
  block,
  mastered,
}: {
  status: ActStatus;
  block: WorkloadBlock | null | undefined;
  mastered: boolean;
}) {
  if (block === undefined) return null;

  if (block === null) {
    return (
      <CalmLine>
        You&apos;ve mastered every live competency — nothing to assign
        today.
      </CalmLine>
    );
  }

  return (
    <div
      className={[
        'rounded-[14px] border bg-[var(--px-card)] p-[14px]',
        status === 'now' ? 'border-[var(--px-accent)]' : 'border-[var(--px-line)]',
      ].join(' ')}
    >
      <span className="mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--px-accent)]">
        Chosen by your scheduler
      </span>
      <h4 className="mt-1.5 text-[15px] font-bold text-[var(--px-ink)]">
        {block.skillTitle}
      </h4>
      <p className="mono mb-3 mt-1 text-[11px] text-[var(--px-dim)]">
        Targets {block.competencyLabel}
      </p>
      <p className="mb-3 border-l-2 border-[var(--px-accent)] pl-2.5 text-[11.5px] leading-[1.45] text-[var(--px-body)]">
        {block.whyLine}
      </p>
      {mastered ? (
        <div className="mono flex items-center justify-center gap-2 rounded-console bg-[var(--px-good)]/12 px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--px-good)]">
          <CheckIcon size={14} />
          Block complete
        </div>
      ) : (
        <Link
          href={`/learn/${block.skillId}`}
          className="mono flex items-center justify-center gap-2 rounded-console bg-[var(--px-accent)] px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--px-on-accent)] no-underline"
        >
          Start block
        </Link>
      )}
    </div>
  );
}

function StandupCard({
  status,
  runMidFlight,
  sprintNumber,
  href,
  onOpen,
}: {
  status: ActStatus;
  runMidFlight: boolean;
  sprintNumber: number | null;
  href: string;
  onOpen: () => void;
}) {
  const title = runMidFlight
    ? `Sprint ${sprintNumber} — results waiting`
    : 'Start your first run';

  return (
    <div
      className={[
        'rounded-[14px] border bg-[var(--px-card)] p-[14px]',
        status === 'now' ? 'border-[var(--px-accent)]' : 'border-[var(--px-line)]',
      ].join(' ')}
    >
      <span className="mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--px-accent)]">
        Relay · your simulation
      </span>
      <h4 className="mt-1.5 text-[15px] font-bold text-[var(--px-ink)]">{title}</h4>
      <p className="mb-3 mt-1 text-[11.5px] text-[var(--px-dim)]">
        {runMidFlight
          ? 'The sprint you committed has resolved.'
          : "You haven't started a simulation run yet."}
      </p>
      <Link
        href={href}
        onClick={onOpen}
        className="mono flex items-center justify-center gap-2 rounded-console bg-[var(--px-accent)] px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--px-on-accent)] no-underline"
      >
        {runMidFlight ? 'Open your standup' : 'Start your first run'}
        <ChevronRightIcon size={15} />
      </Link>
    </div>
  );
}
