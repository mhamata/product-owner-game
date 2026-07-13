'use client';

import { useEffect, useMemo } from 'react';
import type { GameState } from '@/engine/types';
import { calculateScore } from '@/engine/score';
import { getScenarioForIndustry } from '@/scenarios';
import { applyDifficulty } from '@/scenarios/difficulty';
import { useGameStore } from '@/store/gameStore';
import { useCoachStore } from '@/store/coachStore';
import { useIndustryStore } from '@/store/industryStore';
import { useSimDifficultyStore } from '@/store/simDifficultyStore';
import { DEFAULT_INDUSTRY } from '@/curriculum/industries';
import { Topbar } from '../Topbar';
import { RestartIcon } from '../Icon';
import { InboxTurn } from './InboxTurn';
import { SimEndPanel } from './SimEndPanel';
import { useHydrated } from './useHydrated';

/**
 * SimRunner: bootstraps the game (industry/difficulty-aware) and hands the
 * live turn experience to InboxTurn (Sim 2.0 W2-D's inbox presentation).
 *
 * The engine is the single source of truth; this component itself never
 * dispatches turn-content actions — it only:
 *   • ensures a game exists for this scenario/industry (rebuilding on a
 *     switch, mirroring the old GameView bootstrap),
 *   • auto-resolves a committed sprint (execute-iteration) the instant the
 *     engine reaches `committed`, so the outcome is ready the moment the
 *     inbox needs it,
 *   • renders the terminal `complete` phase as SimEndPanel (unchanged),
 *   • otherwise renders <InboxTurn>, which owns everything about how
 *     planning + events + commit are experienced.
 */
export function SimRunner({ scenarioId }: { scenarioId: string }) {
  const state = useGameStore((s) => s.state);
  const currentId = useGameStore((s) => s.scenarioId);
  const gameIndustry = useGameStore((s) => s.industry);
  const newGame = useGameStore((s) => s.newGame);
  const dispatch = useGameStore((s) => s.dispatch);
  const replayTutorial = useCoachStore((s) => s.replayTutorial);

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

  const phase = state?.phase;

  const liveScore = useMemo(
    () => (state && scenario ? calculateScore(state, scenario) : null),
    [state, scenario],
  );

  // Auto-resolve: the instant the engine reaches `committed` (InboxTurn's
  // Commit sheet dispatched commit-iteration), run execute-iteration so the
  // outcome/pendingEvents exist before the inbox needs to show them.
  useEffect(() => {
    if (phase === 'committed') {
      dispatch({ type: 'execute-iteration' });
    }
  }, [phase, dispatch]);

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
            <button
              type="button"
              onClick={() => {
                replayTutorial();
                newGame(scenarioId, { scenario: sc, industry });
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

      <InboxTurn state={game} scenario={sc} score={liveScore} dispatch={dispatch} industry={industry} />
    </>
  );
}
