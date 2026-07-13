'use client';

import { useEffect, useState } from 'react';
import type { Action, GameState, Scenario } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { cn } from '@/lib/cn';
import { InboxIcon, MapGridIcon, SeasonIcon } from '../Icon';
import { InboxTurn } from './InboxTurn';
import { ProductMapScreen } from './ProductMapScreen';
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
 * already covers is untouched. Product is the new map screen (W3-E). Season
 * is a placeholder card that W3-F replaces wholesale — this slice does not
 * touch board/season presentation.
 *
 * All three tabs stay MOUNTED simultaneously (toggled with `hidden`, not
 * conditional `&&` rendering): InboxTurn owns real local UI state (which
 * sheet is open, the pre-commit snapshot used for review deltas, whether the
 * cliffhanger has been "peeked" past) that a tab switch must not reset —
 * unmounting it on every tab hop would silently skip the cliffhanger the
 * instant a player checked the Product tab mid-sprint. `display: none` also
 * takes InboxTurn's `fixed` Commit bar and sheets out of layout entirely
 * while hidden, so there's no interaction leakage between tabs.
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
  const [tab, setTab] = useState<TabId>('standup');
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

  return (
    <div style={{ paddingBottom: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom))` }}>
      <div className={cn(tab !== 'standup' && 'hidden')}>
        <InboxTurn
          state={state}
          scenario={scenario}
          score={score}
          dispatch={dispatch}
          industry={industry}
          commitBarBottomInset={TAB_BAR_HEIGHT}
        />
      </div>
      <div className={cn(tab !== 'product' && 'hidden')}>
        <ProductMapScreen state={state} scenario={scenario} />
      </div>
      <div className={cn(tab !== 'season' && 'hidden')}>
        <SeasonComingSoon sprint={state.iterationNumber} total={state.totalIterations} />
      </div>

      <TabBar active={tab} onChange={setTab} pendingCount={state.phase === 'review' ? state.pendingEvents.length : 0} />
    </div>
  );
}

function SeasonComingSoon({ sprint, total }: { sprint: number; total: number }) {
  return (
    <div className="mx-auto max-w-[480px] px-4 pt-4">
      <p className="mono mb-2 mt-5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
        Sprint {sprint} of {total}
      </p>
      <div className="rounded-[18px] border border-[var(--px-line)] bg-[var(--px-card)] px-6 py-12 text-center">
        <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--px-accent)]/12 text-[var(--px-accent)]">
          <SeasonIcon size={20} />
        </span>
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-[var(--px-ink)]">
          The Season view arrives with W3-F.
        </h2>
        <p className="mx-auto mt-2.5 max-w-[32ch] text-[13px] leading-[1.55] text-[var(--px-body)]">
          Board confidence, the season timeline, your roster, and the Career File all land in the next slice.
          This card is the one component it replaces.
        </p>
      </div>
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
