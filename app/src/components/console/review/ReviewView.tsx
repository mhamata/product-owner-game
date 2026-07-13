'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ALL_SCENARIO_IDS,
  TOTAL_SCENARIOS,
  getScenario,
  judgmentIndustryContext,
  resolveScenario,
} from '@/curriculum/judgment';
import { INDUSTRIES } from '@/curriculum/industries';
import { useActiveIndustry } from '@/store/industryStore';
import { useLearnStore } from '@/store/learnStore';
import {
  boxShelf,
  dayDiff,
  describeBoxMove,
  scheduleNext,
  todayISO,
  useReviewStore,
  type BoxMove,
  type ReviewResult,
} from '@/store/reviewStore';
import { deriveProvenance } from '@/lib/reviewProvenance';
import { Topbar } from '../Topbar';
import { JudgmentCard } from './JudgmentCard';
import { LeitnerShelf } from './LeitnerShelf';
import {
  BuildingIcon,
  CheckIcon,
  ChevronRightIcon,
  FlameIcon,
  RestartIcon,
  ScaleIcon,
  XIcon,
} from '../Icon';

/** One card's phase in the review loop. */
type Phase = 'picking' | 'revealed';

/** skillId -> label for an industry, e.g. "Fintech". */
function industryLabel(id: string): string {
  return INDUSTRIES.find((i) => i.id === id)?.label ?? id;
}

/**
 * Format a yyyy-mm-dd day as a friendly, relative line for the caught-up state,
 * e.g. "tomorrow", "in 3 days", or "Mon, Jun 9". No em dashes, plain language.
 */
function describeNextDue(day: string, fromDay: string = todayISO()): string {
  const diff = dayDiff(fromDay, day);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 6) return `in ${diff} days`;
  const date = new Date(`${day}T00:00:00`);
  const label = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `on ${label}`;
}

/**
 * The judgment-deck review screen (W4-I restyle: `--px-*`-tokened per
 * praxis-learn-mockup.html, plus the Leitner shelf, provenance chips, and
 * real box-movement feedback the mockup's design notes describe — see
 * globals.css's "SCOPE DECISION" comment on `--px-*` being the opt-in system
 * this screen now joins).
 *
 * Renders the next due card, lets the learner pick, reveals the best-judgment
 * answer + why, schedules the next review by the result, and advances. When the
 * queue is empty it shows a calm "all caught up" state with the next due day.
 *
 * HYDRATION: like the rest of the persisted Console, the screen waits for the
 * review store to rehydrate before reading it, so the server and first client
 * paint render the same neutral loading state and never mismatch.
 *
 * SESSION QUEUE: the due list AND each card's provenance are SNAPSHOTTED once
 * on hydration. Reviewing a card reschedules it (a wrong answer makes it due
 * again today, and any review clears its `resurfaced` flag), but we do not
 * want the live "due today" selector — or a card's provenance chip —
 * reshuffling under the learner's feet mid-session, so we walk a fixed
 * snapshot of both. A wrong card simply comes back the next time they open
 * the deck.
 */
export function ReviewView() {
  const industry = useActiveIndustry();
  const streak = useLearnStore((s) => s.streak);
  const hasHydrated = useReviewStore((s) => s.hasHydrated);
  const schedules = useReviewStore((s) => s.schedules);
  const review = useReviewStore((s) => s.review);
  const dueToday = useReviewStore((s) => s.dueToday);
  const nextDueDay = useReviewStore((s) => s.nextDueDay);

  // The fixed queue of ids to walk this session, captured on hydration —
  // alongside a snapshot of which of those cards were resurfaced (see the
  // SESSION QUEUE doc above).
  const [queue, setQueue] = useState<string[] | null>(null);
  const [resurfacedMeta, setResurfacedMeta] = useState<Record<string, boolean>>({});
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<Phase>('picking');
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const [boxMove, setBoxMove] = useState<BoxMove | null>(null);
  // How many cards were due when the session started, for the progress rail.
  const [sessionTotal, setSessionTotal] = useState(0);
  // How many the learner judged correctly this session, for the done summary.
  const [correctCount, setCorrectCount] = useState(0);

  // Snapshot the due queue + provenance exactly once, the moment the store is ready.
  useEffect(() => {
    if (!hasHydrated || queue !== null) return;
    const due = dueToday();
    setQueue(due);
    setSessionTotal(due.length);
    const snapshotSchedules = useReviewStore.getState().schedules;
    const meta: Record<string, boolean> = {};
    for (const id of due) meta[id] = !!snapshotSchedules[id]?.resurfaced;
    setResurfacedMeta(meta);
  }, [hasHydrated, queue, dueToday]);

  const currentId = queue && cursor < queue.length ? queue[cursor] : undefined;
  const provenance = useMemo(
    () => (currentId ? deriveProvenance(resurfacedMeta[currentId], industry) : null),
    [currentId, resurfacedMeta, industry],
  );
  const ctx = useMemo(
    () => judgmentIndustryContext(provenance?.renderedIndustry ?? industry),
    [provenance, industry],
  );

  const scenario = useMemo(() => {
    if (!currentId) return undefined;
    const raw = getScenario(currentId);
    return raw ? resolveScenario(raw, ctx) : undefined;
  }, [currentId, ctx]);

  const shelf = useMemo(() => boxShelf(schedules, ALL_SCENARIO_IDS), [schedules]);

  // ---- loading (pre-hydration): a stable, neutral frame ----
  if (!hasHydrated || queue === null) {
    return (
      <>
        <Topbar context="review" right={<HomeLink />} />
        <main className="flex-auto bg-[var(--px-ground)]">
          <div className="mx-auto max-w-[720px] px-6 py-16">
            <p className="mono text-center text-[12px] uppercase tracking-[0.08em] text-[var(--px-dimmer)]">
              Loading your deck...
            </p>
          </div>
        </main>
      </>
    );
  }

  const done = !scenario;

  // ---- caught up: nothing due ----
  if (done) {
    const next = nextDueDay();
    const reviewedAny = sessionTotal > 0;
    return (
      <>
        <Topbar context="review" right={<HomeLink />} />
        <main className="flex-auto bg-[var(--px-ground)]">
          <div className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-16 text-center">
            <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--px-good)_12%,transparent)] text-[var(--px-good)]">
              <CheckIcon size={26} />
            </span>
            <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-[var(--px-ink)]">
              All caught up
            </h1>
            <p className="mt-2.5 max-w-[42ch] text-[15px] leading-[1.6] text-[var(--px-body)]">
              {reviewedAny
                ? `You reviewed ${sessionTotal} ${sessionTotal === 1 ? 'call' : 'calls'} and got ${correctCount} right. Judgment sticks when you space the practice, so the deck will bring these back over time.`
                : 'No judgment calls are due right now. The deck rehearses your decisions on a forgetting-curve schedule, so cards come back just as you would start to forget them.'}
            </p>

            <div className="mono mt-5 flex flex-wrap items-center justify-center gap-2 text-[12px] tracking-[0.02em] text-[var(--px-dim)]">
              <span className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--px-line)] bg-[var(--px-card)] px-3.5 py-2">
                <ScaleIcon size={14} className="text-[var(--px-accent)]" />
                {next
                  ? `Next review due ${describeNextDue(next)}`
                  : 'Come back any time to start the deck'}
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--px-line)] bg-[var(--px-card)] px-3.5 py-2">
                  <FlameIcon size={14} className="text-[var(--px-warn)]" />
                  Streak safe · {streak} {streak === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>

            <div className="mt-7 w-full max-w-[360px]">
              <p className="mono mb-2 text-[10.5px] uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
                Your shelf
              </p>
              <LeitnerShelf shelf={shelf} />
            </div>

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

  // ---- reviewing a card ----
  const progressPct =
    sessionTotal === 0
      ? 100
      : Math.round((cursor / sessionTotal) * 100);
  const pickedBest = phase === 'revealed' && picked === scenario.bestOptionId;

  function handlePrimary() {
    if (phase === 'picking') {
      if (!picked || !scenario) return;
      const result: ReviewResult =
        picked === scenario.bestOptionId ? 'correct' : 'wrong';
      // Compute the real box move BEFORE the store mutates, using the exact
      // same pure scheduler the store itself calls, so the feedback line
      // never drifts from what actually gets persisted.
      const prior = useReviewStore.getState().schedules[scenario.id];
      const next = scheduleNext(prior, result);
      setBoxMove(describeBoxMove(prior ? prior.box : null, next));
      review(scenario.id, result);
      if (result === 'correct') setCorrectCount((n) => n + 1);
      setPhase('revealed');
      return;
    }
    // revealed -> advance to the next card
    setCursor((c) => c + 1);
    setPhase('picking');
    setPicked(undefined);
    setBoxMove(null);
  }

  const primaryDisabled = phase === 'picking' && !picked;
  const isLastCard = cursor >= sessionTotal - 1;

  const chips =
    provenance && (provenance.fromRun || provenance.showSkinChip) ? (
      <div className="mb-3 flex flex-wrap gap-1.5">
        {provenance.fromRun && (
          <span className="mono inline-flex items-center gap-1 rounded-full border border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--px-accent)]">
            <RestartIcon size={11} />
            From your run
          </span>
        )}
        {provenance.showSkinChip && (
          <span className="mono inline-flex items-center gap-1 rounded-full border border-[var(--px-line-strong)] bg-[var(--px-raised)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--px-dim)]">
            <BuildingIcon size={11} />
            Same skill · {industryLabel(provenance.renderedIndustry)} skin
          </span>
        )}
      </div>
    ) : null;

  return (
    <>
      <Topbar context="review" right={<HomeLink />} />

      <main className="flex-auto bg-[var(--px-ground)]">
        <div className="mx-auto max-w-[720px] px-6">
          {/* progress rail: how far through today's due queue */}
          <div className="sticky top-[49px] z-10 flex items-center gap-4 bg-[var(--px-ground)] py-[18px] pb-4 max-[560px]:top-[45px]">
            <div className="h-[7px] flex-auto overflow-hidden rounded-full bg-[var(--px-line)]">
              <div
                className="h-full rounded-full bg-[var(--px-accent)] transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mono tnum whitespace-nowrap text-[11px] text-[var(--px-dim)]">
              {Math.min(cursor + 1, sessionTotal)} / {sessionTotal} due
            </span>
          </div>

          <div className="pb-[200px] pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono rounded-[8px] border border-[var(--px-line)] bg-[var(--px-raised)] px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-[var(--px-dim)]">
                Judgment deck
              </span>
              <span className="mono text-[11px] text-[var(--px-dimmer)]">
                {TOTAL_SCENARIOS} calls, spaced over time
              </span>
            </div>

            <p className="mt-3 text-[14.5px] leading-[1.6] text-[var(--px-body)]">
              Read the situation, pick the call you would make, then see the
              best-judgment answer and why.
            </p>

            <div className="mt-5">
              <JudgmentCard
                key={scenario.id}
                scenario={scenario}
                answer={picked}
                locked={phase === 'revealed'}
                onAnswer={(id) => setPicked(id)}
                topSlot={chips}
              />
            </div>
          </div>
        </div>

        {/* fixed dock: feedback strip (after reveal) + primary button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[720px] px-6 pb-5">
            {phase === 'revealed' && (
              <div
                role="status"
                aria-live="polite"
                className={[
                  'pointer-events-auto mb-3 flex items-center gap-2.5 rounded-[14px] border p-[12px_16px] shadow-[0_10px_28px_rgba(0,0,0,0.15)]',
                  pickedBest
                    ? 'border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_10%,transparent)]'
                    : 'border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)]',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-[var(--px-on-accent)]',
                    pickedBest ? 'bg-[var(--px-good)]' : 'bg-[var(--px-accent)]',
                  ].join(' ')}
                >
                  {pickedBest ? <CheckIcon size={15} /> : <ScaleIcon size={15} />}
                </span>
                <span className="mono tnum text-[12.5px] leading-[1.4] text-[var(--px-body)]">
                  {boxMove ? boxMove.message : 'Rescheduled'}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={primaryDisabled}
              onClick={handlePrimary}
              className={[
                'mono pointer-events-auto inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px',
                primaryDisabled
                  ? 'cursor-not-allowed bg-[var(--px-line)] text-[var(--px-dimmer)] shadow-none'
                  : 'bg-[var(--px-accent)] text-[var(--px-on-accent)]',
              ].join(' ')}
            >
              {phase === 'picking' ? (
                'Reveal the call'
              ) : (
                <>
                  {isLastCard ? 'Finish review' : 'Next call'}
                  <ChevronRightIcon size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * The Topbar's close affordance for the review screen: back to the map.
 * Deliberately kept on the Console's `--color-*` tokens (NOT `--px-*`): the
 * shared `Topbar` itself stays on the light Console scale everywhere in the
 * app (see `Topbar.tsx` — no `--px-*` reads there), the same precedent
 * `StandupView.tsx` already established for a `--px-*`-opted-in body under
 * an unchanged light nav bar. Only the review screen's `<main>` opts in.
 */
function HomeLink() {
  return (
    <Link
      href="/"
      aria-label="Close review and return to the map"
      className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
    >
      <XIcon size={16} />
    </Link>
  );
}
