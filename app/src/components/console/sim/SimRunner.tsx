'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameScore } from '@/engine/score';
import type { Action, GameState, IterationOutcome, Scenario } from '@/engine/types';
import { calculateScore } from '@/engine/score';
import { getScenarioForIndustry } from '@/scenarios';
import { applyDifficulty } from '@/scenarios/difficulty';
import { useGameStore } from '@/store/gameStore';
import { useCoachStore } from '@/store/coachStore';
import { useIndustryStore } from '@/store/industryStore';
import { useCalibrationStore } from '@/store/calibrationStore';
import { useSimDifficultyStore } from '@/store/simDifficultyStore';
import { useDecisionLogStore, runIdFor } from '@/store/decisionLogStore';
import { DEFAULT_INDUSTRY } from '@/curriculum/industries';
import { Topbar } from '../Topbar';
import { CircleDotIcon, RestartIcon } from '../Icon';
import { SimContextRail } from './SimContextRail';
import { SimStepper } from './SimStepper';
import { SimDock } from './SimDock';
import { PlanStep } from './PlanStep';
import { PreviewStep } from './PreviewStep';
import { ShipStep } from './ShipStep';
import { OutcomeStep } from './OutcomeStep';
import { EventStep } from './EventStep';
import { DebriefStep } from './DebriefStep';
import { SimEndPanel } from './SimEndPanel';
import { STEP_INDEX } from './steps';
import {
  projectIteration,
  projectedDimensionDeltas,
  realisedDimensionDeltas,
} from './projection';
import type { DimensionDeltas } from './SimScoreboard';
import { useHydrated } from './useHydrated';

/**
 * SimRunner: the Guided Flow simulation, a linear stepper that REPLACES the old
 * 3-column GameView on /play/[scenarioId].
 *
 * The engine is the single source of truth. The runner:
 *   • derives which step is allowed from the engine `phase` and clamps a local
 *     cursor to it (so within-phase Back/Next is local, but you can never get
 *     ahead of or behind the engine),
 *   • drives the sim ONLY through gameStore.dispatch(Action),
 *   • renders entirely from GameState + the engine read fns (calculateScore).
 *
 * Step ↔ phase ↔ action map:
 *   Plan      planning   add/remove-to-iteration, place-release-card
 *   Preview   planning   (read-only projection); CTA → commit-iteration + execute-iteration
 *   Ship      review     (reads lastOutcome, already resolved); animates the roll
 *   Outcome   review     reads lastOutcome; CTA → advance cursor
 *   Event     review     respond-to-event (gated until pendingEvents empty)
 *   Debrief   review     CTA → advance-iteration (→ planning, or → complete)
 */
export function SimRunner({ scenarioId }: { scenarioId: string }) {
  const state = useGameStore((s) => s.state);
  const currentId = useGameStore((s) => s.scenarioId);
  const gameIndustry = useGameStore((s) => s.industry);
  const newGame = useGameStore((s) => s.newGame);
  const dispatch = useGameStore((s) => s.dispatch);
  const replayTutorial = useCoachStore((s) => s.replayTutorial);
  const pendingCall = useCalibrationStore((s) => s.pending);
  const appendDecisionLogEntry = useDecisionLogStore((s) => s.appendEntry);

  // The player's home industry re-skins the capstone. Read it hydration-safely:
  // until the industry store rehydrates we use the default, matching SSR + the
  // first client paint (the home-page dropdown gates the same way).
  const industryHydrated = useIndustryStore((s) => s.hasHydrated);
  const storedIndustry = useIndustryStore((s) => s.industry);
  const industry = industryHydrated ? storedIndustry : DEFAULT_INDUSTRY;

  // Adaptive difficulty: the scenario ratchets to the hardest tier the player
  // has earned by acing it. Read hydration-safely (tier 0 until the store loads,
  // matching SSR), and gate new-game creation on it so a fresh game is built at
  // the right tier rather than at 0 then rebuilt.
  const difficultyHydrated = useSimDifficultyStore((s) => s.hasHydrated);
  const earnedTier = useSimDifficultyStore((s) => s.tiers[scenarioId] ?? 0);
  const effectiveTier = difficultyHydrated ? earnedTier : 0;

  const hydrated = useHydrated();

  // Assemble the scenario for the active industry. Structurally identical across
  // industries (same engine balance); only the displayed story differs.
  const scenario = useMemo(() => {
    const base = getScenarioForIndustry(scenarioId, industry);
    return base ? applyDifficulty(base, effectiveTier) : base;
  }, [scenarioId, industry, effectiveTier]);

  // Ensure a game exists for this scenario (mirrors the old GameView bootstrap).
  // Also rebuild when the player switches home industry, so the running sim and
  // the engine both reflect the chosen theme. We wait for BOTH stores to
  // rehydrate so we never clobber a persisted in-progress game with the default.
  useEffect(() => {
    if (!hydrated || !industryHydrated || !difficultyHydrated || !scenario) return;
    const needsNewGame = !state || currentId !== scenarioId || gameIndustry !== industry;
    if (needsNewGame) {
      newGame(scenarioId, { scenario, industry });
    }
  }, [hydrated, industryHydrated, difficultyHydrated, state, currentId, gameIndustry, scenarioId, industry, scenario, newGame]);

  // Local step cursor (0..5). Clamped against the engine phase below.
  const [step, setStep] = useState(0);

  // Snapshot of state + score taken at the moment of commit, so Outcome/Debrief
  // can explain deltas against the pre-sprint baseline.
  const [snapshot, setSnapshot] = useState<{
    iteration: number;
    state: GameState;
    score: GameScore;
  } | null>(null);

  // The optional one-line "why" for this sprint's commit, captured into the
  // decision log alongside the entry. Local UI state (not a store) because it
  // is draft text until the player actually commits; reset whenever a fresh
  // planning phase begins, same as the snapshot.
  const [rationale, setRationale] = useState('');

  const phase = state?.phase;
  const iteration = state?.iterationNumber;

  // Reset the cursor to Plan whenever a fresh planning phase begins (new sprint
  // or new game). This uses React's "adjust state during render" pattern keyed
  // by phase+iteration, so no effect, no flash, and no setState-in-effect.
  const planKey = phase === 'planning' ? `plan-${iteration}` : '';
  const [lastPlanKey, setLastPlanKey] = useState('');
  if (planKey && planKey !== lastPlanKey) {
    setLastPlanKey(planKey);
    setStep(STEP_INDEX.Plan);
    setSnapshot(null);
    setRationale('');
  }

  const liveScore = useMemo(
    () => (state && scenario ? calculateScore(state, scenario) : null),
    [state, scenario],
  );

  // Auto-resolve: when we land in `committed` (after the Preview CTA), run the
  // engine's execute-iteration so the roll outcome exists for the Ship step.
  useEffect(() => {
    if (phase === 'committed') {
      dispatch({ type: 'execute-iteration' });
    }
  }, [phase, dispatch]);

  // ---------- focus management on step transitions ----------
  // The rendered step is a pure function of (step cursor, engine phase,
  // iteration); any of those changing advances the panel. On each transition
  // (but NOT the initial mount), move keyboard focus to the new step's heading
  // and scroll the panel to the top, so screen-reader and keyboard users are
  // told the page advanced instead of being stranded on the dock button.
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const heading = stepContainerRef.current?.querySelector<HTMLElement>('[data-step-heading]');
    heading?.focus();
    // Scroll the document to the top so the new heading is in view (the panel
    // sits below the sticky chrome). Honour reduced-motion via 'auto'.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step, phase, iteration]);

  // ---------- guards ----------
  if (!hydrated || !state || !scenario || !liveScore) {
    return (
      <main className="flex flex-auto items-center justify-center">
        <p className="mono text-[13px] text-mute">Loading simulation…</p>
      </main>
    );
  }

  // ---------- terminal: game complete ----------
  if (state.phase === 'complete') {
    return <SimEndPanel state={state} scenario={scenario} score={liveScore} />;
  }

  // Non-null aliases for use inside the closures below: the guards above have
  // already returned when these are null, but TS can't prove that narrowing
  // holds inside hoisted function declarations.
  const game: GameState = state;
  const sc = scenario;

  const outcome = game.lastOutcome;
  const firstSprint = game.iterationNumber === 1;
  const hasPendingEvents = game.pendingEvents.length > 0;
  const isLastSprint = game.iterationNumber >= game.totalIterations;

  // The set of steps the engine currently permits the cursor to occupy.
  const inReview = game.phase === 'review' || game.phase === 'committed';
  const allowedMax = game.phase === 'planning' ? STEP_INDEX.Preview : STEP_INDEX.Debrief;
  const allowedMin = inReview ? STEP_INDEX.Ship : STEP_INDEX.Plan;
  const clampedStep = Math.min(Math.max(step, allowedMin), allowedMax);

  // ---------- navigation ----------
  function canNavigateTo(target: number): boolean {
    // Back-navigation is only free inside the planning window (Plan ⇄ Preview).
    // Once committed the engine is one-directional, so review steps are forward-only.
    if (game.phase === 'planning') return target <= clampedStep && target <= STEP_INDEX.Preview;
    return false;
  }

  function goPlanning(target: number) {
    if (canNavigateTo(target)) setStep(target);
  }

  const projection = projectIteration(game);

  // Live rail deltas: a *projected* hint while planning (Plan/Preview), the
  // *realised* movement once the sprint has resolved (Outcome/Debrief). Ship and
  // Event sit mid-resolution, so no delta is shown there. Matches the approved
  // mockup's live rail (design/previews/sim-b.html).
  let railDeltas: DimensionDeltas | undefined;
  let railTense: 'projected' | 'realised' | undefined;
  if (clampedStep === STEP_INDEX.Plan || clampedStep === STEP_INDEX.Preview) {
    railDeltas = projectedDimensionDeltas(game, sc);
    railTense = 'projected';
  } else if (
    (clampedStep === STEP_INDEX.Outcome || clampedStep === STEP_INDEX.Debrief) &&
    snapshot
  ) {
    railDeltas = realisedDimensionDeltas(snapshot.score, liveScore);
    railTense = 'realised';
  }

  function handlePrimary() {
    switch (clampedStep) {
      case STEP_INDEX.Plan:
        setStep(STEP_INDEX.Preview);
        break;
      case STEP_INDEX.Preview: {
        // Snapshot the pre-sprint baseline, then commit + execute via the engine.
        setSnapshot({
          iteration: game.iterationNumber,
          state: game,
          score: calculateScore(game, sc),
        });
        // Capture this sprint's commit-time decision into the decision log
        // (Career File material) BEFORE dispatching commit-iteration, so we
        // read the exact backlog/goal/release-card the player just chose.
        appendDecisionLogEntry({
          runId: runIdFor(game.scenarioId, game.seed),
          scenarioId: game.scenarioId,
          industry,
          sprint: game.iterationNumber,
          sprintGoal: game.sprintGoal,
          backlogTitles: game.iterationBacklog
            .filter((p) => p.kind !== 'release-card')
            .map((p) => p.title),
          releaseCard:
            game.releaseCardPosition !== null
              ? (game.iterationBacklog.find((p) => p.kind === 'release-card')?.title ?? 'Release')
              : null,
          rationale: rationale.trim() || null,
        });
        dispatch({ type: 'commit-iteration' });
        // execute-iteration fires from the `committed` effect above; advancing the
        // cursor to Ship lets that step animate the resolved roll.
        setStep(STEP_INDEX.Ship);
        setRationale('');
        break;
      }
      case STEP_INDEX.Ship:
        setStep(STEP_INDEX.Outcome);
        break;
      case STEP_INDEX.Outcome:
        setStep(hasPendingEvents ? STEP_INDEX.Event : STEP_INDEX.Debrief);
        break;
      case STEP_INDEX.Event:
        if (!hasPendingEvents) setStep(STEP_INDEX.Debrief);
        break;
      case STEP_INDEX.Debrief:
        // Advance the engine. → planning (next sprint) resets the cursor via the
        // effect above; → complete renders SimEndPanel.
        dispatch({ type: 'advance-iteration' });
        break;
    }
  }

  // ---------- per-step dock config ----------
  const dock = dockConfig(clampedStep, {
    firstSprint,
    isLastSprint,
    projection,
    hasPendingEvents,
    sprint: game.iterationNumber,
    hasCalled: projection.committed === 0 || pendingCall?.iteration === game.iterationNumber,
  });

  return (
    <>
      <Topbar
        context="simulation"
        right={
          <div className="flex items-center gap-3">
            {effectiveTier > 0 && (
              <span className="mono inline-flex items-center rounded-full border border-accent-100 bg-accent-050 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                Hard +{effectiveTier}
              </span>
            )}
            <span className="mono inline-flex items-center gap-[9px] rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-slate">
              <CircleDotIcon size={7} className="flex-none text-accent" />
              Sprint {game.iterationNumber} / {game.totalIterations}
            </span>
            <button
              type="button"
              onClick={() => {
                replayTutorial();
                newGame(scenarioId, { scenario: sc, industry });
                setStep(STEP_INDEX.Plan);
                setSnapshot(null);
              }}
              className="mono inline-flex items-center gap-[7px] rounded-console border border-line bg-paper px-3 py-[7px] text-[11px] uppercase tracking-[0.06em] text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
              aria-label="Restart the simulation from Sprint 1 and replay the tutorial coachmarks"
            >
              <RestartIcon size={13} />
              <span className="max-[560px]:hidden">Restart</span>
            </button>
          </div>
        }
      />

      <SimContextRail
        state={game}
        scenario={sc}
        score={liveScore}
        deltas={railDeltas}
        deltasTense={railTense}
      />

      <SimStepper current={clampedStep} canNavigateTo={canNavigateTo} onNavigate={goPlanning} />

      <main className="flex-auto">
        <div
          ref={stepContainerRef}
          className="mx-auto max-w-[880px] px-6 pb-[160px] pt-[30px] max-[560px]:px-4 max-[560px]:pb-[150px]"
        >
          <StepBody
            step={clampedStep}
            state={game}
            scenario={sc}
            score={liveScore}
            dispatch={dispatch}
            firstSprint={firstSprint}
            outcome={outcome}
            snapshot={snapshot}
            rationale={rationale}
            onRationaleChange={setRationale}
          />
        </div>
      </main>

      <SimDock
        primaryLabel={dock.label}
        hint={dock.hint}
        onPrimary={handlePrimary}
        primaryDisabled={dock.disabled}
        primaryTone={dock.tone}
        showBack={clampedStep === STEP_INDEX.Preview && game.phase === 'planning'}
        onBack={() => goPlanning(STEP_INDEX.Plan)}
      />
    </>
  );
}

/**
 * Render the active step. Outcome/Debrief require the pre-sprint snapshot; if it
 * is missing (e.g. a hard refresh landed mid-review with persisted state), we
 * fall back to the post-state as its own baseline so deltas read as zero rather
 * than crashing.
 */
function StepBody({
  step,
  state,
  scenario,
  score,
  dispatch,
  firstSprint,
  outcome,
  snapshot,
  rationale,
  onRationaleChange,
}: {
  step: number;
  state: GameState;
  scenario: Scenario;
  score: GameScore;
  dispatch: (a: Action) => void;
  firstSprint: boolean;
  outcome: IterationOutcome | null;
  snapshot: { iteration: number; state: GameState; score: GameScore } | null;
  rationale: string;
  onRationaleChange: (value: string) => void;
}) {
  const baselineState = snapshot?.state ?? state;
  const baselineScore = snapshot?.score ?? score;

  switch (step) {
    case STEP_INDEX.Plan:
      return <PlanStep state={state} dispatch={dispatch} firstSprint={firstSprint} />;
    case STEP_INDEX.Preview:
      return (
        <PreviewStep
          state={state}
          score={score}
          rationale={rationale}
          onRationaleChange={onRationaleChange}
        />
      );
    case STEP_INDEX.Ship:
      return <ShipStep state={state} firstSprint={firstSprint} />;
    case STEP_INDEX.Outcome:
      return outcome ? (
        <OutcomeStep outcome={outcome} preState={baselineState} postState={state} />
      ) : null;
    case STEP_INDEX.Event:
      return <EventStep state={state} scenario={scenario} dispatch={dispatch} />;
    case STEP_INDEX.Debrief:
      return outcome ? (
        <DebriefStep
          preScore={baselineScore}
          postScore={score}
          outcome={outcome}
          postState={state}
          scenario={scenario}
        />
      ) : null;
    default:
      return null;
  }
}

interface DockState {
  label: string;
  hint?: string;
  disabled?: boolean;
  tone: 'accent' | 'good';
}

function dockConfig(
  step: number,
  ctx: {
    firstSprint: boolean;
    isLastSprint: boolean;
    projection: ReturnType<typeof projectIteration>;
    hasPendingEvents: boolean;
    sprint: number;
    hasCalled: boolean;
  },
): DockState {
  switch (step) {
    case STEP_INDEX.Plan:
      return {
        label: 'Next: Preview',
        hint: ctx.projection.committed === 0 ? 'Pick at least one backlog item to continue.' : 'Review the projected outcome before you commit.',
        disabled: ctx.projection.committed === 0,
        tone: 'accent',
      };
    case STEP_INDEX.Preview:
      return {
        label: 'Ship it',
        hint: ctx.hasCalled
          ? 'This is a projection. Capacity still rolls on the next step.'
          : 'Make your call above before you ship.',
        disabled: !ctx.hasCalled,
        tone: 'accent',
      };
    case STEP_INDEX.Ship:
      return { label: 'See the outcome', hint: 'Your real capacity landed in range.', tone: 'accent' };
    case STEP_INDEX.Outcome:
      return {
        label: 'Continue',
        hint: ctx.hasPendingEvents ? 'A decision is waiting next.' : 'Read why each number moved.',
        tone: 'accent',
      };
    case STEP_INDEX.Event:
      return {
        label: 'Continue',
        hint: ctx.hasPendingEvents ? 'Choose a response to every event to continue.' : 'All events resolved.',
        disabled: ctx.hasPendingEvents,
        tone: 'accent',
      };
    case STEP_INDEX.Debrief:
      return {
        label: ctx.isLastSprint ? 'Finish & see results' : `Start Sprint ${ctx.sprint + 1}`,
        hint: ctx.isLastSprint ? 'Wrap up and get your retrospective.' : 'Carry your scoreboard forward.',
        tone: 'good',
      };
    default:
      return { label: 'Continue', tone: 'accent' };
  }
}
