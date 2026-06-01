// Non-mutating forecast/projection for the Plan + Preview steps.
//
// This computes what the player is ABOUT to commit and a telegraphed,
// best-effort guess at the consequences — WITHOUT running the engine. It reads
// the live iterationBacklog and mirrors only the *shape* of the engine's rules
// (commit ratio for morale, "release required for revenue", "tech work pays down
// debt") so the player can preview a trade-off before committing. The authoritative
// result is still produced by the engine on execute-iteration.

import type { CustomerState, GameState, PBI } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { calculateCapacityRange } from '@/engine/capacity';
import { shortName } from './explain';
import type { DimensionDeltas } from './SimScoreboard';

export interface SimProjection {
  /** Points committed = Σ(effortRevealed ?? effort) over the iteration backlog. */
  committed: number;
  /** Engine-authoritative likely capacity (the range midpoint). */
  likely: number;
  lower: number;
  upper: number;
  /** Is the player over the likely line (some work will probably not fit)? */
  overCommitted: boolean;
  /** Is a release card in the sprint? (revenue only moves when releasing) */
  hasRelease: boolean;
  /** Revenue that would land IF a release is included and products complete. */
  revenueIfReleased: number;
  /** Customer-facing work is committed but no release card present. */
  bankedWithoutRelease: boolean;
  /** Telegraphed team-health direction from the commit ratio rule. */
  teamImpact: 'up' | 'steady' | 'down';
  /** Plain-language note for the team impact. */
  teamNote: string;
  /** Names of customers a committed+released product would satisfy. */
  customersServedIfReleased: string[];
}

const effortOf = (p: PBI) => p.effortRevealed ?? p.effort;

/**
 * Build the live forecast for the current iteration backlog. Pure read — never
 * dispatches or mutates.
 */
export function projectIteration(state: GameState): SimProjection {
  const range = calculateCapacityRange(state);
  const items = state.iterationBacklog;
  const committed = items.reduce((sum, p) => sum + effortOf(p), 0);
  const hasRelease = items.some((p) => p.kind === 'release-card');
  const customerWork = items.filter((p) => p.kind === 'customer');

  // Revenue projection: a product earns only when ALL its PBIs are done across
  // iterations AND a release ships. We can't know cross-iteration completion
  // here, so we project the optimistic "if this all ships and releases" figure
  // from the customers the committed customer-work would satisfy — clearly
  // framed in the UI as "if released", never as a promise.
  const servedIds = new Set<string>();
  for (const p of customerWork) for (const cid of p.satisfies) servedIds.add(cid);
  let revenueIfReleased = 0;
  const customersServedIfReleased: string[] = [];
  if (hasRelease) {
    for (const cid of servedIds) {
      const c: CustomerState | undefined = state.customers[cid];
      if (c && c.engagementState !== 'churned') {
        revenueIfReleased += c.ltv;
        customersServedIfReleased.push(shortName(c.name));
      }
    }
  }

  // Team impact mirrors engine/execution.ts: if you commit at/over the likely
  // line you risk a low completion ratio → morale drop. Comfortably under, and
  // a high completion ratio is likely → morale lift.
  const overCommitted = committed > range.expected;
  let teamImpact: SimProjection['teamImpact'] = 'steady';
  let teamNote = 'Team steady — a realistic commitment.';
  if (overCommitted) {
    teamImpact = 'down';
    teamNote = `Packed sprint — ${committed} pts against a likely ${range.expected}. Expect spillover and a morale hit.`;
  } else if (committed > 0 && committed <= range.lower) {
    teamImpact = 'up';
    teamNote = 'Comfortable load — the team is likely to finish and gain momentum.';
  }

  return {
    committed,
    likely: range.expected,
    lower: range.lower,
    upper: range.upper,
    overCommitted,
    hasRelease,
    revenueIfReleased,
    bankedWithoutRelease: customerWork.length > 0 && !hasRelease,
    teamImpact,
    teamNote,
    customersServedIfReleased,
  };
}

/* ============================================================
   PREVIEW — projected directional movement per scoreboard
   dimension, and per-customer reactions. Directional only
   (up / down / steady), framed in the UI as a projection.
   Mirrors the *shape* of the engine rules without running them.
   ============================================================ */

export type Direction = 'up' | 'down' | 'steady';

export interface DimensionForecast {
  /** matches GameScore keys */
  key: 'valueDelivered' | 'customerLoyalty' | 'teamHealth' | 'stakeholderTrust' | 'productIntegrity';
  direction: Direction;
}

export interface CustomerForecast {
  id: string;
  name: string;
  direction: Direction;
  /** Plain-language reason for the projected reaction. */
  why: string;
}

export interface PreviewForecast {
  dimensions: DimensionForecast[];
  customers: CustomerForecast[];
}

export function previewForecast(state: GameState): PreviewForecast {
  const proj = projectIteration(state);
  const items = state.iterationBacklog;
  const hasTech = items.some((p) => p.kind === 'tech');
  const hasCustomerWork = items.some((p) => p.kind === 'customer');
  const debtWillGrow = hasCustomerWork && !hasTech; // mirrors techDebt accumulation shape

  // Which customers does the committed (and released) work serve?
  const servedIfReleased = new Set<string>();
  if (proj.hasRelease) {
    for (const p of items) {
      if (p.kind === 'customer') for (const cid of p.satisfies) servedIfReleased.add(cid);
    }
  }
  const touchedAtAll = new Set<string>();
  for (const p of items) {
    if (p.kind === 'customer') for (const cid of p.satisfies) touchedAtAll.add(cid);
  }

  const dimensions: DimensionForecast[] = [
    {
      key: 'valueDelivered',
      direction: proj.hasRelease && proj.revenueIfReleased > 0 ? 'up' : 'steady',
    },
    {
      key: 'customerLoyalty',
      direction: servedIfReleased.size > 0 ? 'up' : touchedAtAll.size === 0 ? 'down' : 'steady',
    },
    { key: 'teamHealth', direction: proj.teamImpact },
    { key: 'stakeholderTrust', direction: 'steady' },
    { key: 'productIntegrity', direction: hasTech ? 'up' : debtWillGrow ? 'down' : 'steady' },
  ];

  const customers: CustomerForecast[] = Object.values(state.customers)
    .filter((c) => c.engagementState !== 'churned')
    .map((c) => {
      const name = shortName(c.name);
      if (servedIfReleased.has(c.id)) {
        return { id: c.id, name, direction: 'up' as const, why: `Work they need ships and releases — ${name} feels the value.` };
      }
      if (touchedAtAll.has(c.id)) {
        return {
          id: c.id,
          name,
          direction: proj.hasRelease ? ('up' as const) : ('steady' as const),
          why: proj.hasRelease
            ? `${name}'s feature ships and releases this sprint.`
            : `${name}'s feature is being built — but only counts once you release it.`,
        };
      }
      return { id: c.id, name, direction: 'down' as const, why: `Nothing this sprint addresses ${name}'s needs.` };
    });

  return { dimensions, customers };
}

/* ============================================================
   PROJECTED RAIL DELTAS — turn the directional preview forecast
   into modest signed nudges for the persistent rail's gauge
   chips on Plan / Preview. These are HINTS, not promises: the
   value-delivered nudge is grounded in the real projected
   revenue, while the other four use a small fixed step in the
   forecast's direction. Framed as "projected" in the UI/aria so
   they're never mistaken for a realised, committed movement.
   ============================================================ */

/** Small fixed nudge (in score points) for directional-only dimensions. */
const HINT_STEP = 4;

/**
 * Projected per-dimension deltas for the Plan/Preview rail. Pure read; mirrors
 * only the SHAPE of the engine rules (via previewForecast) — it never runs the
 * engine or claims a precise outcome.
 */
export function projectedDimensionDeltas(
  state: GameState,
  scenario: { targetRevenue: number },
): DimensionDeltas {
  const proj = projectIteration(state);
  const forecast = previewForecast(state);
  const dirOf = (key: DimensionForecast['key']): Direction =>
    forecast.dimensions.find((d) => d.key === key)?.direction ?? 'steady';

  // Value delivered: ground the hint in the actual projected revenue (only a
  // release converts finished work), expressed on the 0–100 score scale.
  const valueHint =
    proj.hasRelease && proj.revenueIfReleased > 0 && scenario.targetRevenue > 0
      ? Math.min(100, (proj.revenueIfReleased / scenario.targetRevenue) * 100)
      : 0;

  const step = (key: DimensionForecast['key']): number => {
    const dir = dirOf(key);
    return dir === 'up' ? HINT_STEP : dir === 'down' ? -HINT_STEP : 0;
  };

  return {
    valueDelivered: Math.round(valueHint),
    customerLoyalty: step('customerLoyalty'),
    teamHealth: step('teamHealth'),
    stakeholderTrust: step('stakeholderTrust'),
    productIntegrity: step('productIntegrity'),
  };
}

/**
 * Realised per-dimension deltas = post-sprint score − pre-sprint score, per
 * dimension. Exact (both scores come from the engine's calculateScore). Used by
 * the rail after the Outcome step to show what actually moved.
 */
export function realisedDimensionDeltas(
  preScore: GameScore,
  postScore: GameScore,
): DimensionDeltas {
  return {
    valueDelivered: postScore.valueDelivered - preScore.valueDelivered,
    customerLoyalty: postScore.customerLoyalty - preScore.customerLoyalty,
    teamHealth: postScore.teamHealth - preScore.teamHealth,
    stakeholderTrust: postScore.stakeholderTrust - preScore.stakeholderTrust,
    productIntegrity: postScore.productIntegrity - preScore.productIntegrity,
  };
}
