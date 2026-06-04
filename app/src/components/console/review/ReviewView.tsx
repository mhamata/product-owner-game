'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  TOTAL_SCENARIOS,
  getScenario,
  judgmentIndustryContext,
  resolveScenario,
} from '@/curriculum/judgment';
import { useActiveIndustry } from '@/store/industryStore';
import {
  dayDiff,
  todayISO,
  useReviewStore,
  type ReviewResult,
} from '@/store/reviewStore';
import { Topbar } from '../Topbar';
import { JudgmentCard } from './JudgmentCard';
import {
  CheckIcon,
  ChevronRightIcon,
  ScaleIcon,
  XIcon,
} from '../Icon';

/** One card's phase in the review loop. */
type Phase = 'picking' | 'revealed';

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
 * The judgment-deck review screen.
 *
 * Renders the next due card, lets the learner pick, reveals the best-judgment
 * answer + why, schedules the next review by the result, and advances. When the
 * queue is empty it shows a calm "all caught up" state with the next due day.
 *
 * HYDRATION: like the rest of the persisted Console, the screen waits for the
 * review store to rehydrate before reading it, so the server and first client
 * paint render the same neutral loading state and never mismatch.
 *
 * SESSION QUEUE: the due list is SNAPSHOTTED once on hydration. Reviewing a card
 * reschedules it (a wrong answer makes it due again today), but we do not want
 * the live "due today" selector to reshuffle the queue under the learner's feet
 * mid-session, so we walk a fixed snapshot. A wrong card simply comes back the
 * next time they open the deck.
 */
export function ReviewView() {
  const industry = useActiveIndustry();
  const hasHydrated = useReviewStore((s) => s.hasHydrated);
  const review = useReviewStore((s) => s.review);
  const dueToday = useReviewStore((s) => s.dueToday);
  const nextDueDay = useReviewStore((s) => s.nextDueDay);

  // The fixed queue of ids to walk this session, captured on hydration.
  const [queue, setQueue] = useState<string[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<Phase>('picking');
  const [picked, setPicked] = useState<string | undefined>(undefined);
  // How many cards were due when the session started, for the progress rail.
  const [sessionTotal, setSessionTotal] = useState(0);
  // How many the learner judged correctly this session, for the done summary.
  const [correctCount, setCorrectCount] = useState(0);

  // Snapshot the due queue exactly once, the moment the store is ready.
  useEffect(() => {
    if (!hasHydrated || queue !== null) return;
    const due = dueToday();
    setQueue(due);
    setSessionTotal(due.length);
  }, [hasHydrated, queue, dueToday]);

  const ctx = useMemo(() => judgmentIndustryContext(industry), [industry]);

  const currentId = queue && cursor < queue.length ? queue[cursor] : undefined;
  const scenario = useMemo(() => {
    if (!currentId) return undefined;
    const raw = getScenario(currentId);
    return raw ? resolveScenario(raw, ctx) : undefined;
  }, [currentId, ctx]);

  // ---- loading (pre-hydration): a stable, neutral frame ----
  if (!hasHydrated || queue === null) {
    return (
      <>
        <Topbar context="review" right={<HomeLink />} />
        <main className="flex-auto">
          <div className="mx-auto max-w-[720px] px-6 py-16">
            <p className="mono text-center text-[12px] uppercase tracking-[0.08em] text-faint">
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
        <main className="flex-auto">
          <div className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-20 text-center">
            <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-good-050 text-good">
              <CheckIcon size={26} />
            </span>
            <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-ink">
              All caught up
            </h1>
            <p className="mt-2.5 max-w-[42ch] text-[15px] leading-[1.6] text-ink-2">
              {reviewedAny
                ? `You reviewed ${sessionTotal} ${sessionTotal === 1 ? 'call' : 'calls'} and got ${correctCount} right. Judgment sticks when you space the practice, so the deck will bring these back over time.`
                : 'No judgment calls are due right now. The deck rehearses your decisions on a forgetting-curve schedule, so cards come back just as you would start to forget them.'}
            </p>
            <p className="mono mt-5 inline-flex items-center gap-2 rounded-console border border-line bg-paper px-3.5 py-2 text-[12px] tracking-[0.02em] text-slate">
              <ScaleIcon size={14} className="text-accent" />
              {next
                ? `Next review due ${describeNextDue(next)}`
                : 'Come back any time to start the deck'}
            </p>
            <Link
              href="/"
              className="mono mt-7 inline-flex items-center gap-2 rounded-console bg-accent px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white no-underline transition-[background] duration-150 hover:bg-accent-700"
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
      review(scenario.id, result);
      if (result === 'correct') setCorrectCount((n) => n + 1);
      setPhase('revealed');
      return;
    }
    // revealed -> advance to the next card
    setCursor((c) => c + 1);
    setPhase('picking');
    setPicked(undefined);
  }

  const primaryDisabled = phase === 'picking' && !picked;
  const isLastCard = cursor >= sessionTotal - 1;

  return (
    <>
      <Topbar context="review" right={<HomeLink />} />

      <main className="flex-auto">
        <div className="mx-auto max-w-[720px] px-6">
          {/* progress rail: how far through today's due queue */}
          <div className="sticky top-[49px] z-10 flex items-center gap-4 bg-background py-[18px] pb-4 max-[560px]:top-[45px]">
            <div className="h-[7px] flex-auto overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mono tnum whitespace-nowrap text-[11px] text-slate">
              {Math.min(cursor + 1, sessionTotal)} / {sessionTotal} due
            </span>
          </div>

          <div className="pb-[200px] pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono rounded-console-sm border border-line bg-panel-2 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-mute">
                Judgment deck
              </span>
              <span className="mono text-[11px] text-faint">
                {TOTAL_SCENARIOS} calls, spaced over time
              </span>
            </div>

            <p className="mt-3 text-[14.5px] leading-[1.6] text-ink-2">
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
                  'pointer-events-auto mb-3 flex items-center gap-2.5 rounded-console-lg border p-[12px_16px] shadow-console-lg',
                  pickedBest
                    ? 'border-good-line bg-good-050'
                    : 'border-accent-100 bg-accent-050',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-white',
                    pickedBest ? 'bg-good' : 'bg-accent',
                  ].join(' ')}
                >
                  {pickedBest ? <CheckIcon size={15} /> : <ScaleIcon size={15} />}
                </span>
                <span className="text-[13.5px] leading-[1.5] text-ink-2">
                  {pickedBest
                    ? 'Nice call. This one moves further out before you see it again.'
                    : 'Worth rehearsing. This one comes back soon so the judgment sticks.'}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={primaryDisabled}
              onClick={handlePrimary}
              className={[
                'mono pointer-events-auto inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px',
                primaryDisabled
                  ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none'
                  : 'bg-accent text-white hover:bg-accent-700',
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

/** The Topbar's close affordance for the review screen: back to the map. */
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
