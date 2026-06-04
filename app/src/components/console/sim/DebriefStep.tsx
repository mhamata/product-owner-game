'use client';

import type { GameState, IterationOutcome, Scenario } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { cn } from '@/lib/cn';
import { AlertTriangleIcon, CapIcon, TriangleDownIcon, TriangleUpIcon } from '../Icon';
import { StepHeader } from './StepHeader';
import { DIMENSIONS } from './dimensions';
import { deriveEventBeats, type OutcomeBeat } from './explain';
import { EventBeatList } from './EventBeats';
import { useReducedMotion } from './useReducedMotion';
import { useReveal } from './useReveal';

/**
 * STEP 6 · DEBRIEF: the full scoreboard with this sprint's deltas, plus a
 * one-line takeaway. Deltas are the difference between the post-sprint score and
 * the pre-sprint score (both from calculateScore, the engine read function).
 * "Start Sprint N+1" / "Finish" lives in the dock and dispatches advance-iteration.
 */
export function DebriefStep({
  preScore,
  postScore,
  outcome,
  postState,
  scenario,
}: {
  preScore: GameScore;
  postScore: GameScore;
  outcome: IterationOutcome;
  postState: GameState;
  scenario: Scenario;
}) {
  const reduced = useReducedMotion();
  // Single-shot reveal: the bars fill once on entry (after a short beat).
  const filled = useReveal(outcome.iteration, 1, 0, reduced, 140) >= 1;

  const sprint = outcome.iteration;
  const takeaway = deriveTakeaway(outcome, postState);
  // Persistent record of how each event the player resolved THIS sprint moved
  // the scoreboard. This is the durable home for those "because" lines, most
  // importantly Stakeholder Trust, which only ever moves via events, so even a
  // player who clicked past the Event step's confirmation still sees the cause.
  const eventBeats = deriveResolvedEventBeats(outcome.iteration, postState, scenario);

  return (
    <section aria-labelledby="debrief-title">
      <StepHeader
        stepIndex={5}
        totalSteps={6}
        name="Debrief"
        eyebrow={`Sprint ${sprint} complete`}
        title={<span id="debrief-title">Where you stand after Sprint {sprint}.</span>}
        sub="Five dimensions, this sprint's movement called out. Then carry it forward."
      />

      <div
        className="mt-[22px] grid grid-cols-5 gap-3 max-[720px]:grid-cols-2 max-[560px]:grid-cols-1"
        role="group"
        aria-label="Full scoreboard with this sprint's deltas"
      >
        {DIMENSIONS.map(({ key, label, flatLabel, Icon }) => {
          const value = Math.round(postScore[key]);
          const delta = Math.round(postScore[key] - preScore[key]);
          return (
            <div
              key={key}
              className="flex flex-col gap-[11px] rounded-console-lg border border-line bg-paper p-[16px_14px]"
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className="flex-none text-slate" />
                <span className="mono text-[9.5px] uppercase leading-[1.25] tracking-[0.05em] text-mute">
                  {label[0]}
                  <br />
                  {label[1]}
                </span>
              </div>
              <div
                className="mono tnum flex items-baseline gap-[7px] text-[28px] font-semibold leading-none text-ink"
                aria-label={`${flatLabel}: ${value} out of 100${
                  delta !== 0 ? `, ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} this sprint` : ', unchanged'
                }`}
              >
                {value}
                {delta !== 0 && (
                  <span
                    className={cn(
                      'mono inline-flex items-center text-[12px] font-semibold',
                      delta > 0 ? 'text-good' : 'text-bad',
                    )}
                    aria-hidden="true"
                  >
                    {delta > 0 ? <TriangleUpIcon size={11} /> : <TriangleDownIcon size={11} />}
                    {Math.abs(delta)}
                  </span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-700',
                    delta < 0 ? 'bg-bad' : 'bg-accent',
                  )}
                  style={{ width: filled ? `${Math.max(0, Math.min(100, value))}%` : '0%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* event-driven movements: the durable "because" for choices made this
          sprint (the only place Stakeholder Trust moves). */}
      {eventBeats.length > 0 && (
        <div className="mt-5">
          <div className="mb-2.5 flex items-center gap-2">
            <AlertTriangleIcon size={15} className="flex-none text-warn" />
            <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-warn">
              From your event {eventBeats.length === 1 ? 'call' : 'calls'} this sprint
            </span>
          </div>
          <EventBeatList beats={eventBeats} />
        </div>
      )}

      {/* one-line takeaway */}
      <div className="mt-5 flex items-start gap-[13px] rounded-console-lg border border-accent-100 bg-gradient-to-b from-accent-050 to-paper p-[16px_18px]">
        <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent text-white" aria-hidden="true">
          <CapIcon size={17} />
        </span>
        <div>
          <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            What you learned
          </span>
          <p className="mt-1 text-[14.5px] leading-[1.5] text-ink">{takeaway}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Rebuild the explained beats for every event the player resolved this sprint,
 * by replaying the chosen option (from the engine's eventLog) through the same
 * deriveEventBeats helper the Event step uses. Pure read of GameState; no
 * engine mutation. This is what guarantees event-driven movements (Stakeholder
 * Trust especially) always carry a visible "because" in the persistent debrief.
 */
function deriveResolvedEventBeats(
  iteration: number,
  postState: GameState,
  scenario: Scenario,
): OutcomeBeat[] {
  const beats: OutcomeBeat[] = [];
  for (const record of postState.eventLog) {
    if (record.iteration !== iteration || !record.optionId) continue;
    const card = scenario.eventDeck.find((e) => e.id === record.eventId);
    const option = card?.options.find((o) => o.id === record.optionId);
    if (!option) continue;
    // Namespace the beat ids by event so multiple events don't collide.
    for (const beat of deriveEventBeats(option, scenario)) {
      beats.push({ ...beat, id: `${record.eventId}-${beat.id}` });
    }
  }
  return beats;
}

/**
 * Pick the single most salient lesson from this sprint's outcome. Derived from
 * the same engine facts the Outcome step explains; not invented. Priority order
 * surfaces the highest-leverage teaching moment.
 */
function deriveTakeaway(outcome: IterationOutcome, postState: GameState): string {
  const builtCustomerWork = outcome.done.some((p) => p.kind === 'customer');
  const churned = Object.entries(outcome.happinessDeltas).some(
    ([id, d]) => d < 0 && postState.customers[id]?.engagementState === 'churned',
  );

  if (outcome.releasedProducts.length > 0 && outcome.revenueEarned > 0) {
    return 'Releasing is what converts finished work into revenue. When products are complete, shipping a Release is the move that pays.';
  }
  if (builtCustomerWork && outcome.releasedProducts.length === 0) {
    return 'You built customer value but never released it, so none of it earned revenue. Finished features only pay out when you Ship a Release.';
  }
  if (churned) {
    return 'A customer churned after too long with nothing for them. Spreading attention too thin can cost you the relationships you already have.';
  }
  if (outcome.moraleDelta <= -1) {
    return 'A packed sprint with no slack cost you team health. Committing closer to the likely capacity protects morale, and next sprint.';
  }
  if (outcome.techDebtDelta >= 5) {
    return 'Shipping features without engineering health let tech debt climb. Debt you skip compounds, and quietly slows every future sprint.';
  }
  if (outcome.techDebtDelta < 0) {
    return 'Investing in engineering health paid down debt. It rarely feels urgent, but it buys you steadier, faster sprints later.';
  }
  if (outcome.moraleDelta >= 1) {
    return 'A realistic commitment let the team finish what they started. Delivering on your word builds momentum and trust.';
  }
  return 'Trade-offs compound across sprints. Watch how today’s choice reshapes capacity, customers, and team health next time.';
}
