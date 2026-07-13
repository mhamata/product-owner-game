'use client';

import type { GameState, Scenario } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { shortName } from './explain';
import { TargetIcon } from '../Icon';
import { SimScoreboard, type DimensionDeltas } from './SimScoreboard';

/**
 * SUPERSEDED by InboxTurn (W2-D), kept for reference this wave. The inbox's
 * Standup screen has no persistent top rail (matching the mockup — mission +
 * live scoreboard move to the Season screen, W3-F); InboxTurn renders its own
 * lightweight "app head" (scenario name + sprint counter) instead.
 *
 * The persistent context rail, always visible across every step. It surfaces
 * the three things the old sim never showed during play:
 *   1. the MISSION: scenario.summary + the revenue target,
 *   2. a REVENUE PROGRESS meter (economy.revenue / targetRevenue),
 *   3. the live 5-dimension SCOREBOARD (calculateScore, passed in fresh).
 */
export function SimContextRail({
  state,
  scenario,
  score,
  deltas,
  deltasTense,
}: {
  state: GameState;
  scenario: Scenario;
  score: GameScore;
  deltas?: DimensionDeltas;
  deltasTense?: 'projected' | 'realised';
}) {
  const target = scenario.targetRevenue;
  const revenue = state.economy.revenue;
  const pct = target > 0 ? Math.min(100, (revenue / target) * 100) : 0;
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="border-b border-line bg-paper">
      <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-6 py-4 max-[1080px]:grid-cols-1 max-[1080px]:gap-4 max-[560px]:px-4">
        {/* mission */}
        <div className="min-w-0">
          <span className="mono inline-flex items-center gap-[7px] text-[10px] uppercase tracking-[0.14em] text-mute">
            <TargetIcon size={13} className="flex-none text-accent" />
            Mission
          </span>
          <p className="mt-[5px] text-[13.5px] leading-[1.45] text-ink-2">
            {summarize(scenario.summary)} Reach{' '}
            <b className="font-semibold text-ink">{fmt(target)}</b> revenue and keep customers and
            team healthy by Sprint {scenario.totalIterations}.
          </p>
          {/* unmissable revenue goal progress */}
          <div
            className="mt-[11px] flex items-center gap-3"
            aria-label={`Revenue progress: ${fmt(revenue)} of ${fmt(target)}`}
          >
            <span className="eyebrow whitespace-nowrap">Revenue</span>
            <div className="relative h-2 flex-auto overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-[#3b82f6] transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="mono tnum whitespace-nowrap text-[12px] font-semibold text-ink">
              {fmt(revenue)} <span className="font-medium text-faint">/ {fmt(target)}</span>
            </span>
          </div>
        </div>

        {/* compact scoreboard */}
        <SimScoreboard score={score} deltas={deltas} tense={deltasTense} />
      </div>
    </div>
  );
}

/**
 * The scenario summary is a full paragraph written for the case-study page. For
 * the rail we keep the first sentence (the role + premise) so the mission reads
 * as one tight line above the target.
 */
function summarize(summary: string): string {
  const firstSentence = summary.split(/(?<=\.)\s/)[0] ?? summary;
  return shortName(firstSentence).endsWith('.') ? firstSentence : `${firstSentence}.`;
}
