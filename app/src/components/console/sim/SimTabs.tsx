'use client';

import { useEffect, useState } from 'react';
import type { Action, GameState, Scenario } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { cn } from '@/lib/cn';
import { InboxIcon, MapGridIcon, SeasonIcon } from '../Icon';
import { InboxTurn } from './InboxTurn';
import { ProductMapScreen } from './ProductMapScreen';
import { SeasonScreen } from './SeasonScreen';
import { FiredBeat } from './FiredBeat';
import { SimEndPanel } from './SimEndPanel';
import { runIdFor } from '@/store/decisionLogStore';
import { deriveMetricSnapshot, useMetricsHistoryStore } from '@/store/metricsHistoryStore';

type TabId = 'standup' | 'product' | 'season';

const TABS: { id: TabId; label: string; Icon: typeof InboxIcon }[] = [
  { id: 'standup', label: 'Standup', Icon: InboxIcon },
  { id: 'product', label: 'Product', Icon: MapGridIcon },
  { id: 'season', label: 'Season', Icon: SeasonIcon },
];

// The rest of the app (Topbar, InboxTurn's own Commit bar) pins fixed
// elements straight to the viewport rather than running an app-shell layout
// (see Topbar.tsx: `sticky top-0`; InboxTurn's CommitBar: `fixed bottom-0`).
// The tab bar follows the same convention here, and InboxTurn's Commit bar
// is nudged up by exactly this height (`commitBarBottomInset`) so the two
// fixed elements stack instead of overlapping.
const TAB_BAR_HEIGHT = 64;

/**
 * SimTabs: the three-tab shell for the sim surface (Sim 2.0 W3-E,
 * design-sim-2.0.md §3 / praxis-sim2-mockup.html's tab bar). This is a
 * WRAPPER, not a fork: Standup renders the existing `InboxTurn` unmodified
 * apart from one additive prop (`commitBarBottomInset`, see InboxTurn.tsx) —
 * every decision-sheet/commit/event/cliffhanger behavior InboxTurn.test.tsx
 * already covers is untouched. Product is the map screen (W3-E). Season is
 * `SeasonScreen` (W3-F, see below) — no longer a placeholder.
 *
 * All three tabs stay MOUNTED simultaneously (toggled with `hidden`, not
 * conditional `&&` rendering): InboxTurn owns real local UI state (which
 * sheet is open, the pre-commit snapshot used for review deltas, whether the
 * cliffhanger has been "peeked" past) that a tab switch must not reset —
 * unmounting it on every tab hop would silently skip the cliffhanger the
 * instant a player checked the Product tab mid-sprint. `display: none` also
 * takes InboxTurn's `fixed` Commit bar and sheets out of layout entirely
 * while hidden, so there's no interaction leakage between tabs.
 *
 * Season is `SeasonScreen` (W3-F): sprint timeline, board confidence +
 * expectations, roster, this-run Career File summary, and the job market
 * (locked while live, open once `phase` is 'complete' or 'fired' — see
 * season.ts's `deriveJobMarketVisibility`).
 *
 * FIRED is the one exception to "all three tabs stay mounted": the instant
 * `state.phase === 'fired'`, this component renders `FiredBeat` FULL SCREEN
 * instead of the tab shell — "the sim surface (whatever tab)" the W3-F
 * instruction calls for, matching design-sim-2.0.md §2.3's ruling ("a story
 * beat, not a punishment screen"). It's safe to drop the "stay mounted"
 * guarantee here because 'fired' is terminal (step.ts no-ops on it, same as
 * 'complete') — there is no more sprint in progress whose UI state could be
 * lost. Dismissing the beat ("See your offers") reveals the normal tab shell
 * with the Season tab already selected and its job market already open.
 */
export function SimTabs({
  state,
  scenario,
  score,
  dispatch,
  industry,
}: {
  state: GameState;
  scenario: Scenario;
  score: GameScore;
  dispatch: (a: Action) => void;
  industry: string | null;
}) {
  // Terminal states open on Season (QBR verdict / job market); live runs open
  // on Standup. Initial-value-only by design: a run COMPLETING while mounted
  // must not yank the player off their current tab — the Standup tab's content
  // swap to SimEndPanel (below) is that moment's transition instead.
  const [tab, setTab] = useState<TabId>(() =>
    state.phase === 'complete' || state.phase === 'fired' ? 'season' : 'standup',
  );
  // Whether the player has dismissed the fired full-screen beat ("See your
  // offers") this mount. Irrelevant once phase isn't 'fired' anymore (a
  // brand new run starts back at 'planning'), so no reset effect is needed.
  const [firedBeatSeen, setFiredBeatSeen] = useState(false);
  const recordSnapshot = useMetricsHistoryStore((s) => s.recordSnapshot);

  // Record one metrics snapshot per sprint as the run plays (see
  // metricsHistoryStore.ts's file header for why this can't just be read off
  // GameState). Runs regardless of which tab is active so the Product tab has
  // real history the first time a player opens it. Idempotent: the store
  // upserts by (runId, sprint), so re-firing on an unrelated re-render is
  // harmless — it just re-records the same-or-refined current values.
  const runId = runIdFor(state.scenarioId, state.seed);
  const boardConfidence = state.board?.confidence ?? null;
  useEffect(() => {
    recordSnapshot(runId, deriveMetricSnapshot(state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    runId,
    state.iterationNumber,
    state.phase,
    state.economy.revenue,
    state.team.morale,
    state.tech.techDebt,
    state.tech.reliability,
    boardConfidence,
  ]);

  // FIRED: the full-screen story beat takes over the whole sim surface,
  // ahead of any tab. See the file header comment above.
  if (state.phase === 'fired' && !firedBeatSeen) {
    return (
      <FiredBeat
        state={state}
        scenario={scenario}
        onSeeOffers={() => {
          setFiredBeatSeen(true);
          setTab('season');
        }}
      />
    );
  }

  return (
    <div style={{ paddingBottom: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom))` }}>
      <div className={cn(tab !== 'standup' && 'hidden')}>
        {state.phase === 'complete' ? (
          // Completed run: the Standup tab becomes the classic end-of-run
          // debrief. Rendering it here (even hidden) keeps SimEndPanel's
          // end-of-run resurface() effect firing exactly as it did when
          // SimRunner returned it directly (W3-F seam; see SimRunner.tsx).
          <SimEndPanel state={state} scenario={scenario} score={score} />
        ) : (
          <InboxTurn
            state={state}
            scenario={scenario}
            score={score}
            dispatch={dispatch}
            industry={industry}
            commitBarBottomInset={TAB_BAR_HEIGHT}
          />
        )}
      </div>
      <div className={cn(tab !== 'product' && 'hidden')}>
        <ProductMapScreen state={state} scenario={scenario} />
      </div>
      <div className={cn(tab !== 'season' && 'hidden')}>
        <SeasonScreen state={state} scenario={scenario} industry={industry} />
      </div>

      <TabBar active={tab} onChange={setTab} pendingCount={state.phase === 'review' ? state.pendingEvents.length : 0} />
    </div>
  );
}

function TabBar({
  active,
  onChange,
  pendingCount,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  pendingCount: number;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sim sections"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--px-line)] bg-[var(--px-card)] px-2 pb-[env(safe-area-inset-bottom)] pt-2"
      style={{ height: TAB_BAR_HEIGHT }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={cn(
              'relative mono flex flex-1 flex-col items-center gap-1 rounded-[10px] py-1.5 text-[10.5px] font-semibold',
              isActive ? 'text-[var(--px-accent)]' : 'text-[var(--px-dimmer)]',
            )}
          >
            <span className="relative">
              <Icon size={21} />
              {id === 'standup' && pendingCount > 0 && (
                <span
                  className="mono absolute -right-2 -top-1 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[var(--px-warn)] text-[9.5px] font-extrabold text-[var(--px-on-accent)] tabular-nums"
                  aria-hidden="true"
                >
                  {pendingCount}
                </span>
              )}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
