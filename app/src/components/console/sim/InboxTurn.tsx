'use client';

import { useState } from 'react';
import Link from 'next/link';
import type {
  Action,
  EventCard,
  EventOptionData,
  GameState,
  IterationOutcome,
  PersonState,
  ReleasePrepQuality,
  Scenario,
} from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { cn } from '@/lib/cn';
import {
  AlertTriangleIcon,
  ClockIcon,
  MessageIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  XIcon,
} from '../Icon';
import { PlanStep } from './PlanStep';
import { OutcomeStep } from './OutcomeStep';
import { DebriefStep } from './DebriefStep';
import { SimDock } from './SimDock';
import { EventBeatList } from './EventBeats';
import {
  capacityBreakdown,
  deriveEventBeats,
  summarizeEventEffects,
  type OutcomeBeat,
} from './explain';
import { projectIteration } from './projection';
import { deriveSenderIdForEvent, deriveSenderIdForPBI, roleLabel } from '@/engine/people';
import { judgmentCardIdsForEventCategory } from './competency';
import { useReviewStore } from '@/store/reviewStore';
import { useDecisionLogStore, runIdFor, deriveOutcomeSummary } from '@/store/decisionLogStore';
import { ReleasePrepSheet } from './ReleasePrepSheet';

/**
 * InboxTurn: the Sim 2.0 "Standup" presentation (design-sim-2.0.md §3, mocked
 * in praxis-sim2-mockup.html). Replaces SimRunner's linear 6-step Guided Flow
 * as THE sim experience — see the superseded-component comments on
 * PreviewStep/ShipStep/EventStep/SimStepper/SimContextRail/SimScoreboard/
 * PredictionCard/steps.ts.
 *
 * This is a PRESENTATION rebuild only: the engine's phase machine
 * (planning -> committed -> review -> [complete|fired]) is untouched. What
 * changes is how planning + events + commit are EXPERIENCED — as messages
 * from named people (state.people, W1-A) instead of a numbered stepper.
 *
 * ENGINE-TIMING NOTE (why events show up "mid-turn" rather than strictly
 * "during planning"): the engine only ever populates `pendingEvents` once
 * `execute-iteration` has run (phase 'review'), never during 'planning' —
 * see engine/step.ts. So the inbox spans BOTH phases as one continuous
 * screen: while phase is 'planning' it shows the Plan message; the instant
 * the player commits, the auto-executed sprint's resulting events (if any)
 * appear as new messages in the SAME screen, still gating the cliffhanger.
 * From the player's seat there is no visible phase seam — they just see new
 * messages arrive after they hit Commit, exactly like the mockup's toast/
 * message-arrival pattern, before "Sprint N is running" takes over.
 */
export function InboxTurn({
  state,
  scenario,
  score,
  dispatch,
  industry,
  // Sim 2.0 W3-E: how far above the viewport bottom the fixed Commit bar
  // should sit, in pixels. Default 0 preserves the exact pre-W3-E behavior
  // (flush to the viewport bottom) for any caller that doesn't pass it — the
  // only caller that does is SimTabs.tsx, which reserves this much room for
  // its tab bar underneath. Nothing else about InboxTurn changes: this is an
  // additive prop, not a fork (see SimTabs.tsx's file header).
  commitBarBottomInset = 0,
}: {
  state: GameState;
  scenario: Scenario;
  score: GameScore;
  dispatch: (a: Action) => void;
  industry: string | null;
  commitBarBottomInset?: number;
}) {
  const appendDecisionLogEntry = useDecisionLogStore((s) => s.appendEntry);
  const recordEventResponse = useDecisionLogStore((s) => s.recordEventResponse);
  const resurface = useReviewStore((s) => s.resurface);

  type SheetState = { kind: 'plan' } | { kind: 'commit' } | { kind: 'event'; eventId: string } | null;
  const [openSheet, setOpenSheet] = useState<SheetState>(null);
  const [rationale, setRationale] = useState('');
  const [snapshot, setSnapshot] = useState<{ iteration: number; state: GameState; score: GameScore } | null>(
    null,
  );
  const [justCommitted, setJustCommitted] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [reviewSubStep, setReviewSubStep] = useState<'outcome' | 'debrief'>('outcome');
  const [justChosen, setJustChosen] = useState<{ card: EventCard; option: EventOptionData } | null>(null);
  // Sim 2.0 W5-J: the optional "write the launch PRD" moment. Rendered as its
  // own full-screen sheet (not nested inside the commit sheet) so it never
  // stacks two bottom sheets — opening it closes the commit sheet, and every
  // exit path (close/skip/lock-in) reopens the commit sheet. `releasePrepScore`
  // is the locked-in grade (if any), included in this sprint's decision-log
  // entry at commit time; the engine-side nudge (set-release-prep) is
  // dispatched the moment grading is locked in, not deferred to commit.
  const [releasePrepOpen, setReleasePrepOpen] = useState(false);
  const [releasePrepScore, setReleasePrepScore] = useState<number | null>(null);

  // Reset every piece of per-turn UI state (adjust-state-during-render, same
  // pattern the old SimRunner used) the moment a fresh planning phase begins —
  // new sprint or a freshly (re)created game.
  const turnKey = state.phase === 'planning' ? `plan-${state.iterationNumber}` : '';
  const [lastTurnKey, setLastTurnKey] = useState('');
  if (turnKey && turnKey !== lastTurnKey) {
    setLastTurnKey(turnKey);
    setOpenSheet(null);
    setRationale('');
    setSnapshot(null);
    setJustCommitted(false);
    setPeeked(false);
    setReviewSubStep('outcome');
    setJustChosen(null);
    setReleasePrepOpen(false);
    setReleasePrepScore(null);
  }

  const people = state.people;
  const projection = projectIteration(state);
  const planResolved = projection.committed > 0;
  const isLastSprint = state.iterationNumber >= state.totalIterations;

  function closeSheet() {
    setOpenSheet(null);
  }

  function handleCommit() {
    // Same decisionLogStore capture, at the same moment, as PR #10 wired into
    // the old PreviewStep -> SimRunner commit path: BEFORE dispatching
    // commit-iteration, so we read the exact backlog/goal/release-card the
    // player just chose.
    setSnapshot({ iteration: state.iterationNumber, state, score });
    appendDecisionLogEntry({
      runId: runIdFor(state.scenarioId, state.seed),
      scenarioId: state.scenarioId,
      industry,
      sprint: state.iterationNumber,
      sprintGoal: state.sprintGoal,
      backlogTitles: state.iterationBacklog
        .filter((p) => p.kind !== 'release-card')
        .map((p) => p.title),
      releaseCard:
        state.releaseCardPosition !== null
          ? (state.iterationBacklog.find((p) => p.kind === 'release-card')?.title ?? 'Release')
          : null,
      rationale: rationale.trim() || null,
      // Sim 2.0 W5-J: the locked-in launch-PRD grade for this sprint, if the
      // player wrote and graded one. Absent (undefined) when the moment was
      // never offered (no release this sprint) or was skipped.
      artifactGrade: releasePrepScore ?? undefined,
    });
    dispatch({ type: 'commit-iteration' });
    setJustCommitted(true);
    setRationale('');
    setReleasePrepScore(null);
    closeSheet();
  }

  /** Locked in from ReleasePrepSheet: dispatch the bounded engine nudge NOW
   *  (still 'planning' — see engine/releasePrep.ts's phase gate) and remember
   *  the score for this sprint's decision-log entry at commit time. */
  function handleReleasePrepGraded(score: number, quality: ReleasePrepQuality) {
    dispatch({ type: 'set-release-prep', quality });
    setReleasePrepScore(score);
    setReleasePrepOpen(false);
    setOpenSheet({ kind: 'commit' });
  }

  function closeReleasePrepSheet() {
    setReleasePrepOpen(false);
    setOpenSheet({ kind: 'commit' });
  }

  function chooseEventOption(card: EventCard, option: EventOptionData) {
    dispatch({ type: 'respond-to-event', eventId: card.id, optionId: option.id });
    recordEventResponse(runIdFor(state.scenarioId, state.seed), {
      event: card.narrative,
      choice: option.label,
    });
    resurface(judgmentCardIdsForEventCategory(card.category));
    setJustChosen({ card, option });
    closeSheet();
  }

  // ---------- terminal-ish states this component must not crash on ----------
  // 'fired' (Sim 2.0 W2-C) is a terminal phase InboxTurn does not own the UI
  // for — that's SimTabs.tsx's `FiredBeat` (W3-F), which now intercepts
  // 'fired' BEFORE InboxTurn ever mounts as the Standup tab (see SimTabs.tsx's
  // file header). This branch is unreachable through that normal flow; it
  // stays only as a defensive fallback for any caller that renders InboxTurn
  // directly (e.g. a future test), so a fired run never looks broken even
  // then — routed into the same two places the real beat offers.
  if (state.phase === 'fired') {
    return (
      <main className="flex-auto bg-[var(--px-ground)]">
        <div className="mx-auto flex max-w-[480px] flex-col items-center px-5 py-20 text-center">
          <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--px-crit)]/12 text-[var(--px-crit)]">
            <AlertTriangleIcon size={24} />
          </span>
          <h1 className="mt-5 text-[20px] font-bold tracking-[-0.02em] text-[var(--px-ink)]">
            The board pulled the plug at Sprint {state.iterationNumber}
          </h1>
          <p className="mt-2.5 max-w-[42ch] text-[13.5px] leading-[1.6] text-[var(--px-body)]">
            Board confidence hit the firing floor. Your run and its Career File entries are preserved —
            check the Season tab for your offers, matched to what this record proves.
          </p>
          <Link
            href="/report"
            className="mono mt-4 rounded-[10px] border border-[var(--px-line-strong)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--px-accent)]"
          >
            View your Career File
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-auto bg-[var(--px-ground)] pb-28">
      <div className="mx-auto max-w-[480px] px-4 pt-4">
        <AppHead scenario={scenario} state={state} />

        {/* "Previously on" is only true during planning, when lastOutcome is
            the PREVIOUS sprint. During review it is the sprint the cliffhanger
            below is deliberately withholding — rendering it here would spoil
            the reveal the peek button owns. */}
        {state.phase === 'planning' && state.lastOutcome && (
          <RecapCard scenario={scenario} outcome={state.lastOutcome} />
        )}

        {justChosen && (
          <EventChoiceToast
            option={justChosen.option}
            scenario={scenario}
            onDismiss={() => setJustChosen(null)}
          />
        )}

        {state.phase === 'committed' && (
          <div className="mt-4 rounded-[14px] border border-[var(--px-line)] bg-[var(--px-card)] p-[13px_14px] text-center">
            <p className="mono text-[11px] uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
              Resolving Sprint {state.iterationNumber}...
            </p>
          </div>
        )}

        {state.phase === 'planning' && (
          <>
            <SectionLabel>Today</SectionLabel>
            <PlanMessage
              state={state}
              people={people}
              resolved={planResolved}
              onOpen={() => setOpenSheet({ kind: 'plan' })}
            />
          </>
        )}

        {state.phase === 'review' && state.pendingEvents.length > 0 && (
          <>
            <SectionLabel>New since you committed</SectionLabel>
            {state.pendingEvents.map((eventId) => {
              const card = scenario.eventDeck.find((e) => e.id === eventId);
              if (!card) return null;
              return (
                <EventMessage
                  key={eventId}
                  card={card}
                  people={people}
                  onOpen={() => setOpenSheet({ kind: 'event', eventId })}
                />
              );
            })}
          </>
        )}

        {state.phase === 'review' && state.pendingEvents.length === 0 && justCommitted && !peeked && (
          <Cliffhanger sprint={state.iterationNumber} onPeek={() => setPeeked(true)} />
        )}

        {state.phase === 'review' && state.pendingEvents.length === 0 && (!justCommitted || peeked) && (
          <ReviewFlow
            state={state}
            scenario={scenario}
            score={score}
            snapshot={snapshot}
            subStep={reviewSubStep}
            onAdvanceToDebrief={() => setReviewSubStep('debrief')}
            onAdvanceSprint={() => dispatch({ type: 'advance-iteration' })}
            isLastSprint={isLastSprint}
          />
        )}
      </div>

      {state.phase === 'planning' && (
        <CommitBar
          sprint={state.iterationNumber}
          armed={planResolved}
          onOpen={() => setOpenSheet({ kind: 'commit' })}
          bottomInset={commitBarBottomInset}
        />
      )}

      {/* ---------- decision sheets ---------- */}
      <Sheet open={openSheet?.kind === 'plan'} onClose={closeSheet} title={undefined}>
        <PlanStep state={state} dispatch={dispatch} firstSprint={state.iterationNumber === 1} />
        <button
          type="button"
          onClick={closeSheet}
          className="mono mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--px-line-strong)] bg-transparent px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--px-accent)]"
        >
          Done planning
        </button>
      </Sheet>

      <Sheet
        open={openSheet?.kind === 'commit'}
        onClose={closeSheet}
        title={`Commit Sprint ${state.iterationNumber}`}
        subtitle={commitSummary(state)}
      >
        <div className="mt-1">
          <label
            htmlFor="inbox-rationale"
            className="mono block text-[10.5px] uppercase tracking-[0.08em] text-[var(--px-dimmer)]"
          >
            Why? · one line — goes in your Career File
          </label>
          <input
            id="inbox-rationale"
            type="text"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Optional — the trade-off you're making and why"
            maxLength={280}
            className="mono mt-2 w-full rounded-[10px] border border-[var(--px-line)] bg-[var(--px-ground)] px-3 py-2.5 text-[13px] text-[var(--px-ink)] placeholder:text-[var(--px-dimmer)] focus:border-[var(--px-accent)] focus:outline-none"
          />
        </div>

        {/* Sim 2.0 W5-J: optional artifact moment, offered ONLY when this
            sprint's plan includes a placed release card (design-sim-2.0.md
            §2.4). Skipping it leaves everything identical to today. */}
        {state.releaseCardPosition !== null && (
          <div className="mt-3.5 border-t border-dashed border-[var(--px-line)] pt-3.5">
            {releasePrepScore !== null ? (
              <p className="text-[12px] leading-[1.5] text-[var(--px-dim)]">
                Launch PRD graded: <span className="mono font-bold text-[var(--px-ink)]">{releasePrepScore}/100</span> — locked in for this sprint.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpenSheet(null);
                  setReleasePrepOpen(true);
                }}
                className="mono flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[var(--px-line-strong)] bg-transparent px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[var(--px-accent)]"
              >
                Write the launch PRD (optional)
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleCommit}
          className="mono mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--px-accent)] px-4 py-3.5 text-[14px] font-bold uppercase tracking-[0.06em] text-[var(--px-on-accent)]"
        >
          Commit Sprint {state.iterationNumber}
        </button>
      </Sheet>

      <ReleasePrepSheet
        open={releasePrepOpen}
        onClose={closeReleasePrepSheet}
        onSkip={closeReleasePrepSheet}
        onGraded={handleReleasePrepGraded}
        industry={industry}
      />

      {state.phase === 'review' &&
        state.pendingEvents.map((eventId) => {
          const card = scenario.eventDeck.find((e) => e.id === eventId);
          if (!card) return null;
          return (
            <Sheet
              key={eventId}
              open={openSheet?.kind === 'event' && openSheet.eventId === eventId}
              onClose={closeSheet}
              title="A decision landed on your desk"
              subtitle={card.narrative}
            >
              <div className="grid gap-2.5">
                {card.options.map((opt) => (
                  <EventOptionButton
                    key={opt.id}
                    option={opt}
                    state={state}
                    onChoose={() => chooseEventOption(card, opt)}
                  />
                ))}
              </div>
            </Sheet>
          );
        })}
    </main>
  );
}

/* ============================================================
   Small presentational pieces
   ============================================================ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono mb-2 mt-5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
      {children}
    </p>
  );
}

function AppHead({ scenario, state }: { scenario: Scenario; state: GameState }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-1">
      <div className="min-w-0">
        <div className="truncate text-[16px] font-bold leading-tight text-[var(--px-ink)]">
          {scenario.name}
        </div>
        <div className="mono mt-0.5 text-[10.5px] uppercase tracking-[0.06em] text-[var(--px-dim)]">
          Sprint {state.iterationNumber} of {state.totalIterations}
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * "Previously on ..." recap, from the last resolved sprint. Reuses
 * decisionLogStore's `deriveOutcomeSummary` — the same pure, factual,
 * no-invented-numbers summary already attached to the Career File entry for
 * that sprint (OutcomeStep) — rather than deriving a second summarization of
 * the same IterationOutcome.
 */
function RecapCard({ scenario, outcome }: { scenario: Scenario; outcome: IterationOutcome }) {
  return (
    <div className="mt-3 rounded-[14px] border border-[var(--px-line)] bg-gradient-to-br from-[var(--px-raised)] to-[var(--px-card)] p-[12px_14px]">
      <span className="mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--px-accent)]">
        Previously on {scenario.name}
      </span>
      <p className="mt-1.5 text-[13px] leading-[1.45] text-[var(--px-body)]">
        {capitalize(deriveOutcomeSummary(outcome))}.
      </p>
    </div>
  );
}

const AVATAR_PALETTE = ['#e8a84c', '#7fa8e0', '#b48fd9', '#56b3a5', '#e0836f', '#8fd9b4', '#d98f9f'];

function avatarColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Resolve a message's sender, falling back to a generic "Your team" persona
 * when the roster can't resolve one (e.g. an old persisted state without
 * `people` yet, or a scenario event with an unmapped category) — mirrors the
 * "never blocks the sim" fallback style used throughout people.ts.
 */
function senderOrFallback(
  id: string | null,
  people: Record<string, PersonState> | undefined,
): { id: string; name: string; role: string; trust: number } {
  const p = id ? people?.[id] : undefined;
  if (p) return { id: p.id, name: p.name, role: roleLabel(p.role), trust: p.trust };
  return { id: 'fallback', name: 'Your team', role: 'General', trust: 60 };
}

function MessageAvatar({ id, initials }: { id: string; initials: string }) {
  return (
    <span
      className="mono flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] text-[13px] font-bold text-[#10151d]"
      style={{ background: avatarColorFor(id) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function TrustBar({ trust }: { trust: number }) {
  return (
    <span className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--px-dim)]">
      Trust
      <span className="h-1 w-16 overflow-hidden rounded-full bg-[var(--px-line)]">
        <span
          className="block h-full rounded-full bg-[var(--px-accent)]"
          style={{ width: `${Math.max(0, Math.min(100, trust))}%` }}
        />
      </span>
      {Math.round(trust)}
    </span>
  );
}

function MessageTag({ tone, children }: { tone: 'decision' | 'done'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'mono flex-none text-[9.5px] font-bold uppercase tracking-[0.06em]',
        tone === 'decision' ? 'text-[var(--px-warn)]' : 'text-[var(--px-good)]',
      )}
    >
      {children}
    </span>
  );
}

function PlanMessage({
  state,
  people,
  resolved,
  onOpen,
}: {
  state: GameState;
  people: Record<string, PersonState> | undefined;
  resolved: boolean;
  onOpen: () => void;
}) {
  const sender = senderOrFallback(deriveSenderIdForPBI('tech', people), people);
  const breakdown = capacityBreakdown(state);
  const projection = projectIteration(state);
  const backlogCount = state.productBacklog.length;
  const text = resolved
    ? `Locked in ${projection.committed} pts against a likely ${breakdown.expected}. Open this any time before you commit to change it.`
    : `Capacity this sprint runs ${breakdown.lower}-${breakdown.upper} pts, likely ${breakdown.expected}. There's ${backlogCount} item${backlogCount === 1 ? '' : 's'} in the backlog — what are we building?`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-start gap-3 rounded-[14px] border bg-[var(--px-card)] p-[13px_14px] text-left transition-colors',
        'border-[var(--px-line)] hover:border-[var(--px-line-strong)]',
        resolved && 'opacity-70',
      )}
    >
      <MessageAvatar id={sender.id} initials={initialsFor(sender.name)} />
      <span className="min-w-0 flex-auto">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-semibold text-[var(--px-ink)]">
            {sender.name} <span className="text-[11px] font-normal text-[var(--px-dim)]">· {sender.role}</span>
          </span>
          <MessageTag tone={resolved ? 'done' : 'decision'}>{resolved ? 'Planned' : 'Decision'}</MessageTag>
        </span>
        <p className="mt-1.5 text-[13px] leading-[1.45] text-[var(--px-body)]">{text}</p>
        <TrustBar trust={sender.trust} />
      </span>
    </button>
  );
}

function EventMessage({
  card,
  people,
  onOpen,
}: {
  card: EventCard;
  people: Record<string, PersonState> | undefined;
  onOpen: () => void;
}) {
  const sender = senderOrFallback(deriveSenderIdForEvent(card, people), people);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-2.5 flex w-full items-start gap-3 rounded-[14px] border border-[var(--px-line)] bg-[var(--px-card)] p-[13px_14px] text-left transition-colors hover:border-[var(--px-line-strong)]"
    >
      <MessageAvatar id={sender.id} initials={initialsFor(sender.name)} />
      <span className="min-w-0 flex-auto">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-semibold text-[var(--px-ink)]">
            {sender.name} <span className="text-[11px] font-normal text-[var(--px-dim)]">· {sender.role}</span>
          </span>
          <MessageTag tone="decision">Decision</MessageTag>
        </span>
        <p className="mt-1.5 text-[13px] leading-[1.45] text-[var(--px-body)]">{card.narrative}</p>
        <TrustBar trust={sender.trust} />
      </span>
    </button>
  );
}

function EventOptionButton({
  option,
  state,
  onChoose,
}: {
  option: EventOptionData;
  state: GameState;
  onChoose: () => void;
}) {
  const hints = summarizeEventEffects(option.effects, state);
  return (
    <button
      type="button"
      onClick={onChoose}
      className="w-full rounded-[12px] border border-[var(--px-line)] bg-[var(--px-ground)] p-[12px_13px] text-left transition-colors hover:border-[var(--px-accent)]"
    >
      <div className="text-[13.5px] font-semibold leading-[1.35] text-[var(--px-ink)]">{option.label}</div>
      <p className="mt-1.5 text-[12px] leading-[1.5] text-[var(--px-dim)]">{option.visibleConsequence}</p>
      {hints.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {hints.map((hint, i) => (
            <span
              key={i}
              className={cn(
                'mono inline-flex items-center gap-1 text-[10.5px] font-semibold',
                hint.dir === 'up'
                  ? 'text-[var(--px-good)]'
                  : hint.dir === 'down'
                    ? 'text-[var(--px-crit)]'
                    : 'text-[var(--px-dim)]',
              )}
            >
              {hint.dir === 'up' ? (
                <TriangleUpIcon size={10} />
              ) : hint.dir === 'down' ? (
                <TriangleDownIcon size={10} />
              ) : null}
              {hint.label}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

/**
 * Transient post-choice confirmation ("toast"), reusing `deriveEventBeats` for
 * the full "BECAUSE" narration — richer than the mockup's single toast line,
 * kept because the "because" moment is the sim's core teaching device
 * (explain.ts's whole reason for existing).
 */
function EventChoiceToast({
  option,
  scenario,
  onDismiss,
}: {
  option: EventOptionData;
  scenario: Scenario;
  onDismiss: () => void;
}) {
  const beats: OutcomeBeat[] = deriveEventBeats(option, scenario);
  return (
    <div className="mt-3 rounded-[14px] border border-[var(--px-accent)]/40 bg-[var(--px-card)] p-[13px_14px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--px-accent)]">
            You chose
          </span>
          <p className="mt-1 text-[13.5px] font-semibold leading-[1.4] text-[var(--px-ink)]">{option.label}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="mono flex-none text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--px-dim)]"
        >
          Got it
        </button>
      </div>
      {beats.length > 0 && (
        <div className="mt-3">
          <EventBeatList beats={beats} />
        </div>
      )}
    </div>
  );
}

function commitSummary(state: GameState): string {
  const projection = projectIteration(state);
  const items = state.iterationBacklog.filter((p) => p.kind !== 'release-card').length;
  const hasRelease = state.iterationBacklog.some((p) => p.kind === 'release-card');
  return `${items} item${items === 1 ? '' : 's'} · ${projection.committed} pts${hasRelease ? ' · release included' : ''}.`;
}

function CommitBar({
  sprint,
  armed,
  onOpen,
  bottomInset = 0,
}: {
  sprint: number;
  armed: boolean;
  onOpen: () => void;
  bottomInset?: number;
}) {
  return (
    <div
      className="fixed inset-x-0 z-30 bg-gradient-to-t from-[var(--px-ground)] from-[45%] to-transparent px-4 pb-5 pt-8"
      style={{ bottom: bottomInset }}
    >
      <div className="mx-auto max-w-[480px]">
        <button
          type="button"
          disabled={!armed}
          onClick={onOpen}
          className={cn(
            'mono flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-4 text-[14px] font-bold uppercase tracking-[0.06em] transition-colors',
            armed
              ? 'bg-[var(--px-accent)] text-[var(--px-on-accent)]'
              : 'cursor-not-allowed bg-[var(--px-line)] text-[var(--px-dimmer)]',
          )}
        >
          Commit Sprint {sprint}
        </button>
        <p className="mono mt-2 text-center text-[10.5px] uppercase tracking-[0.06em] text-[var(--px-dimmer)]">
          {armed ? 'Ready — review and commit.' : 'Pick at least one backlog item to commit.'}
        </p>
      </div>
    </div>
  );
}

function Cliffhanger({ sprint, onPeek }: { sprint: number; onPeek: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-[18px] border border-[var(--px-line)] bg-[var(--px-card)] px-6 py-12 text-center">
      <span className="mb-6 inline-flex h-3.5 w-3.5 animate-pulse rounded-full bg-[var(--px-accent)]" aria-hidden="true" />
      <h2 className="text-[20px] font-bold tracking-[-0.01em] text-[var(--px-ink)]">
        Sprint {sprint} is running.
      </h2>
      <p className="mt-2 max-w-[30ch] text-[13.5px] leading-[1.55] text-[var(--px-body)]">
        Results at your next standup.
      </p>
      <p className="mt-4 max-w-[34ch] text-[11px] leading-[1.5] text-[var(--px-dimmer)]">
        The outcome you get next time is one you authored today. The engine already computed it — this
        wait is the story, not a load screen.
      </p>
      <button
        type="button"
        onClick={onPeek}
        className="mono mt-7 inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--px-line-strong)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--px-accent)]"
      >
        <ClockIcon size={13} />
        Peek at the results now
      </button>
    </div>
  );
}

/**
 * The post-cliffhanger (or "next visit already resolved") review: the
 * existing Outcome then Debrief components, reused and lightly restyled
 * (StepHeader's `hideStepBadge`), driven by a tiny local two-step cursor
 * instead of the old 6-step flow. `snapshot` may be null on a fresh mount
 * that finds itself already in `review` (no commit happened THIS session) —
 * same graceful fallback the old SimRunner used: baseline = post-state, so
 * deltas read as zero instead of crashing.
 */
function ReviewFlow({
  state,
  scenario,
  score,
  snapshot,
  subStep,
  onAdvanceToDebrief,
  onAdvanceSprint,
  isLastSprint,
}: {
  state: GameState;
  scenario: Scenario;
  score: GameScore;
  snapshot: { iteration: number; state: GameState; score: GameScore } | null;
  subStep: 'outcome' | 'debrief';
  onAdvanceToDebrief: () => void;
  onAdvanceSprint: () => void;
  isLastSprint: boolean;
}) {
  const outcome = state.lastOutcome;
  if (!outcome) return null;
  const baselineState = snapshot?.state ?? state;
  const baselineScore = snapshot?.score ?? score;

  return (
    <div className="mt-3">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--px-accent)]">
        <MessageIcon size={12} />
        Sprint {state.iterationNumber} results
      </div>
      <div className="rounded-[18px] border border-[var(--px-line)] bg-[var(--px-card)] p-[16px]">
        {subStep === 'outcome' ? (
          <OutcomeStep outcome={outcome} preState={baselineState} postState={state} />
        ) : (
          <DebriefStep
            preScore={baselineScore}
            postScore={score}
            outcome={outcome}
            postState={state}
            scenario={scenario}
          />
        )}
      </div>
      <div className="mt-3">
        {subStep === 'outcome' ? (
          <SimDock
            primaryLabel="Continue"
            hint="Read why each number moved."
            onPrimary={onAdvanceToDebrief}
            primaryTone="accent"
          />
        ) : (
          <SimDock
            primaryLabel={isLastSprint ? 'Finish & see results' : `Start Sprint ${state.iterationNumber + 1}`}
            hint={isLastSprint ? 'Wrap up and get your retrospective.' : 'Carry your scoreboard forward.'}
            onPrimary={onAdvanceSprint}
            primaryTone="good"
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Bottom sheet
   ============================================================ */

// Exported so ReleasePrepSheet.tsx (Sim 2.0 W5-J) can reuse the exact same
// bottom-sheet chrome for the optional "Write the launch PRD" moment instead
// of forking a second copy — additive export, zero behavior change here.
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[86vh] w-full max-w-[480px] overflow-y-auto rounded-t-[24px] border-t border-[var(--px-line-strong)] bg-[var(--px-card)] p-[18px_18px_28px] shadow-[0_-10px_32px_rgba(0,0,0,0.35)]"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--px-line-strong)]" aria-hidden="true" />
        {title && <h2 className="text-[16px] font-bold text-[var(--px-ink)]">{title}</h2>}
        {subtitle && <p className="mt-1 text-[13px] leading-[1.5] text-[var(--px-body)]">{subtitle}</p>}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[var(--px-dim)]"
        >
          <XIcon size={15} />
        </button>
        <div className={cn(title || subtitle ? 'mt-3.5' : '')}>{children}</div>
      </div>
    </>
  );
}
