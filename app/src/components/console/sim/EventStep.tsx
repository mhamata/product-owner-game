'use client';

import { useState } from 'react';
import type {
  Action,
  EventCard,
  EventOptionData,
  GameState,
  Scenario,
} from '@/engine/types';
import { cn } from '@/lib/cn';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from '../Icon';
import { StepHeader } from './StepHeader';
import { deriveEventBeats, summarizeEventEffects } from './explain';
import { EventBeatList } from './EventBeats';
import { judgmentCardIdsForEventCategory } from './competency';
import { useReviewStore } from '@/store/reviewStore';
import { useDecisionLogStore, runIdFor } from '@/store/decisionLogStore';

/**
 * SUPERSEDED by InboxTurn (W2-D), kept for reference this wave. SimRunner no
 * longer renders this as a linear step: pending events now surface as
 * decision-sheet messages in the inbox (see InboxTurn.tsx), reusing this
 * file's `summarizeEventEffects` (moved to explain.ts) and `deriveEventBeats`
 * for the same telegraphed-effect chips and post-choice "because" beats. This
 * component is left intact (not deleted) in case a future slice wants the
 * linear-step presentation back.
 *
 * STEP 5 · EVENT: telegraphed dilemmas, then explained outcomes.
 *
 * Each pending event (state.pendingEvents) is presented as a card with its
 * narrative and option set. Every option shows its engine-authored
 * `visibleConsequence` verbatim (the "telegraph"), plus icon hints derived from
 * the option's effects so the trade-off is never colour-alone.
 *
 * Choosing an option does two things:
 *   1. records the chosen option locally so we can show a "BECAUSE …"
 *      confirmation (deriveEventBeats); every metric the choice moved gets a
 *      plain-language cause→effect line, including Stakeholder Trust (which only
 *      ever moves via events);
 *   2. dispatches respond-to-event, which the engine applies and removes from
 *      pendingEvents.
 * The player reads the confirmation, then clicks Next to face the following
 * event (or, once none remain, the runner's dock advances to the debrief).
 */
export function EventStep({
  state,
  scenario,
  dispatch,
}: {
  state: GameState;
  scenario: Scenario;
  dispatch: (a: Action) => void;
}) {
  const total = state.pendingEvents.length;
  // The engine processes events one response at a time; we always show the
  // first still-pending card. `resolvedThisSprint` is how many have already
  // been answered this sprint (for the "1 of N" readout).
  const eventId = state.pendingEvents[0] ?? null;
  const card = eventId ? scenario.eventDeck.find((e) => e.id === eventId) ?? null : null;
  const resolvedThisSprint = state.eventLog.filter((e) => e.iteration === state.iterationNumber).length;
  const position = resolvedThisSprint + 1;
  const totalThisSprint = resolvedThisSprint + total;

  // The option the player just chose, held so we can narrate its effects before
  // moving on. Cleared when the player clicks Next.
  const [justChosen, setJustChosen] = useState<{
    card: EventCard;
    option: EventOptionData;
  } | null>(null);

  const recordEventResponse = useDecisionLogStore((s) => s.recordEventResponse);
  const resurface = useReviewStore((s) => s.resurface);

  function respond(chosenCard: EventCard, option: EventOptionData) {
    setJustChosen({ card: chosenCard, option });
    dispatch({ type: 'respond-to-event', eventId: chosenCard.id, optionId: option.id });

    // Fold the response into this sprint's decision-log entry (Career File
    // material), keyed by the same runId the commit-time entry was appended
    // under. A no-op if the entry somehow doesn't exist yet — never blocks.
    recordEventResponse(runIdFor(state.scenarioId, state.seed), {
      event: chosenCard.narrative,
      choice: option.label,
    });

    // Pull matching judgment-deck cards back into today's review queue when
    // this event's category maps to a judgment competency. Category-less/
    // unmapped events and cards with no matching content both resolve to an
    // empty list, and resurface([]) is a no-op — this never blocks the sim.
    resurface(judgmentCardIdsForEventCategory(chosenCard.category));
  }

  return (
    <section aria-labelledby="event-title">
      <StepHeader
        stepIndex={4}
        totalSteps={6}
        name="Event"
        eyebrow={totalThisSprint > 1 ? `A curveball · ${position} of ${totalThisSprint}` : 'A curveball'}
        title={<span id="event-title">Something just landed on your desk.</span>}
        sub="Each option shows its likely effect up front. There's no free lunch. Pick the trade-off you can live with."
      />

      {justChosen ? (
        <EventOutcome
          option={justChosen.option}
          scenario={scenario}
          hasNext={total > 0}
          onNext={() => setJustChosen(null)}
        />
      ) : card ? (
        <EventDilemma
          card={card}
          state={state}
          onRespond={(option) => respond(card, option)}
        />
      ) : (
        <div className="mt-[22px] rounded-console-lg border border-good-line bg-good-050 p-[18px] text-[14px] text-ink-2">
          All events resolved. You can advance to the debrief.
        </div>
      )}
    </section>
  );
}

function EventDilemma({
  card,
  state,
  onRespond,
}: {
  card: EventCard;
  state: GameState;
  onRespond: (option: EventOptionData) => void;
}) {
  return (
    <div className="mt-[22px] rounded-console-lg border border-warn-line bg-warn-050 p-[18px]">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-warn text-white"
          aria-hidden="true"
        >
          <AlertTriangleIcon size={18} />
        </span>
        <div className="min-w-0">
          <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-warn">
            {card.category} event · telegraphed
          </span>
          <p className="mt-1 text-[16px] font-semibold leading-[1.4] text-ink">{card.narrative}</p>
        </div>
      </div>

      <div className="mt-[18px] grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1" role="group" aria-label="Choose how to respond">
        {card.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onRespond(opt)}
            className="flex flex-col gap-3 rounded-console-lg border border-line bg-paper p-4 text-left transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-accent hover:shadow-console-md active:translate-y-0"
          >
            <span className="text-[15px] font-semibold leading-[1.35] text-ink">{opt.label}</span>
            <div className="grid gap-1.5">
              <span className="mono text-[9.5px] uppercase tracking-[0.12em] text-faint">Likely effect</span>
              {/* engine-authored telegraph string, verbatim */}
              <span className="text-[12.5px] leading-[1.5] text-slate">{opt.visibleConsequence}</span>
              {/* icon hints from the effect kinds, never colour-alone */}
              <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                {summarizeEventEffects(opt.effects, state).map((hint, i) => (
                  <span
                    key={i}
                    className={cn(
                      'mono inline-flex items-center gap-1 text-[11px]',
                      hint.dir === 'up' ? 'text-good' : hint.dir === 'down' ? 'text-bad' : 'text-mute',
                    )}
                  >
                    {hint.dir === 'up' ? (
                      <TriangleUpIcon size={11} />
                    ) : hint.dir === 'down' ? (
                      <TriangleDownIcon size={11} />
                    ) : null}
                    {hint.label}
                  </span>
                ))}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Post-choice confirmation. Echoes what the player picked, then narrates every
 * metric the choice moved as an explained "BECAUSE" beat (deriveEventBeats).
 * This is where Stakeholder Trust, which moves ONLY via events, finally gets
 * its "because", so the Trust gauge never shifts without a visible reason.
 */
function EventOutcome({
  option,
  scenario,
  hasNext,
  onNext,
}: {
  option: EventOptionData;
  scenario: Scenario;
  hasNext: boolean;
  onNext: () => void;
}) {
  const beats = deriveEventBeats(option, scenario);

  return (
    <div className="mt-[22px] rounded-console-lg border border-accent-100 bg-accent-050 p-[18px]">
      <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
        Your call · here&apos;s what it moved
      </span>
      <p className="mt-1 text-[15px] font-semibold leading-[1.4] text-ink">
        You chose: {option.label}
      </p>

      {beats.length > 0 ? (
        <div className="mt-[16px]">
          <EventBeatList beats={beats} />
        </div>
      ) : (
        <p className="mt-3 text-[13px] leading-[1.5] text-slate">
          No tracked metric moved on this one. Your call shapes the story, not the scoreboard, this
          time.
        </p>
      )}

      <button
        type="button"
        onClick={onNext}
        className="mono mt-[18px] inline-flex items-center gap-2 rounded-console border border-line bg-paper px-4 py-2 text-[12px] font-medium uppercase tracking-[0.06em] text-ink transition-[border-color,box-shadow] duration-150 hover:border-accent hover:shadow-console-md"
      >
        {hasNext ? 'Next event' : 'Got it'}
        <ArrowRightIcon size={14} />
      </button>
    </div>
  );
}

// summarizeEffects moved to explain.ts as `summarizeEventEffects` (W2-D) —
// see the import above.
