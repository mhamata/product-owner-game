// Pure derivation helpers for the Product tab (Sim 2.0 W3-E,
// praxis-sim2-mockup.html's Product screen). Every function here reads
// GameState/Scenario/store data that already exists and computes a display
// value from it — nothing here invents a number the engine (or the metrics
// history / decision log stores) didn't already produce. See
// metricsHistoryStore.ts's file header for what per-metric history is and
// isn't derivable, and the comment above `deriveDistricts` for the same
// documentation on district (product/feature-area) derivation.

import type { GameState, PBI, PBIKind, Scenario } from '@/engine/types';
import type { DecisionLogEntry } from '@/store/decisionLogStore';
import type { MetricKey, MetricsSnapshot } from '@/store/metricsHistoryStore';
import { shortName } from './explain';

/* ============================================================
   Sparklines
   ============================================================ */

export interface SparklinePoint {
  x: number;
  y: number;
  sprint: number;
  value: number;
}

/**
 * Map one metric's history to normalized (min/max-scaled) SVG points. A
 * single data point renders as a flat mid-height line rather than a lone
 * dot (nothing to compare it to yet); an all-equal series (e.g.
 * `reliability`, which never moves — see metricsHistoryStore.ts) also
 * renders flat, honestly, instead of a misleading zig-zag from
 * floating-point noise.
 */
export function sparklineSeries(
  history: MetricsSnapshot[],
  key: MetricKey,
  width = 56,
  height = 22,
): SparklinePoint[] {
  const points = history
    .map((h) => ({ sprint: h.sprint, value: h[key] }))
    .filter((p): p is { sprint: number; value: number } => p.value !== null);
  if (points.length === 0) return [];
  if (points.length === 1) {
    return [{ x: 0, y: height / 2, sprint: points[0].sprint, value: points[0].value }];
  }
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);
  return points.map((p, i) => ({
    x: Math.round(i * stepX * 100) / 100,
    y: Math.round((height - ((p.value - min) / span) * height) * 100) / 100,
    sprint: p.sprint,
    value: p.value,
  }));
}

export function polylineFor(points: SparklinePoint[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

/** True when every recorded value is identical (or there's <2 points) — the flat-line case, e.g. static `reliability`. */
export function isFlatSeries(history: MetricsSnapshot[], key: MetricKey): boolean {
  const values = history.map((h) => h[key]).filter((v): v is number => v !== null);
  if (values.length < 2) return true;
  return values.every((v) => v === values[0]);
}

export interface MetricTrend {
  direction: 'up' | 'down' | 'flat';
  /** Signed delta vs. the previous recorded sprint, or null if there's no prior point. */
  delta: number | null;
  previousSprint: number | null;
}

/** Compare the latest two recorded points for a metric — the tile's "vs Sprint N" caption. */
export function deriveMetricTrend(history: MetricsSnapshot[], key: MetricKey): MetricTrend {
  const points = history
    .map((h) => ({ sprint: h.sprint, value: h[key] }))
    .filter((p): p is { sprint: number; value: number } => p.value !== null)
    .sort((a, b) => a.sprint - b.sprint);
  if (points.length < 2) return { direction: 'flat', delta: null, previousSprint: null };
  const latest = points[points.length - 1];
  const prior = points[points.length - 2];
  const delta = latest.value - prior.value;
  return {
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
    delta,
    previousSprint: prior.sprint,
  };
}

/* ============================================================
   Decision annotations: sprints where the decision log carries a
   player-written rationale (mockup's amber-dot pattern).
   ============================================================ */

export interface DecisionAnnotation {
  sprint: number;
  rationale: string;
  sprintGoal: string | null;
}

/** PURE: one annotation per sprint that has a non-empty rationale, sprint-ascending. */
export function deriveDecisionAnnotations(entries: DecisionLogEntry[]): DecisionAnnotation[] {
  return entries
    .filter((e): e is DecisionLogEntry & { rationale: string } => !!e.rationale)
    .map((e) => ({ sprint: e.sprint, rationale: e.rationale, sprintGoal: e.sprintGoal }))
    .sort((a, b) => a.sprint - b.sprint);
}

/** Sparkline points that land on an annotated sprint (for the amber-dot overlay). */
export function annotatedPoints(points: SparklinePoint[], annotations: DecisionAnnotation[]): SparklinePoint[] {
  const sprints = new Set(annotations.map((a) => a.sprint));
  return points.filter((p) => sprints.has(p.sprint));
}

/* ============================================================
   Districts: the product/feature-area map.

   ENGINE REALITY (read before "fixing" this to match the mockup's 6 broad
   districts like "Checkout" / "Core workflows"): every scenario file checked
   (scenario01/02, zeroToOne, turnaround, scalingCrunch, regulatedLaunch)
   gives every PBI its OWN unique `productId` — there is no scenario data
   where multiple PBIs share one productId, so there is no existing "group
   many features into one area" structure to read. A district here is
   therefore one productId's PBI group, which today always means one PBI;
   the grouping code below still keys and sizes by productId generically (not
   by PBI id) so a future scenario that DOES share a productId across
   several PBIs is handled correctly without a code change.

   "Built" vs "queued" vs "investing" mirrors engine/step.ts's own
   `derivePriorDone` exactly (a PBI counts as shipped once it is no longer in
   either backlog) for every PBI in `scenario.initialBacklog` — the only set
   the engine itself tracks continuously from game start. `discoveryPool`
   items and event-injected PBIs (`add-pbi` effects) are included as
   districts too, but ONLY while they're actually visible in a backlog right
   now: the engine keeps no persistent "ever discovered / ever shipped"
   ledger for them, so once one of those ships it simply disappears from
   view — we have no record to show it as "built" from, and don't invent
   one. Documented, not hidden.
   ============================================================ */

export type DistrictStatus = 'built' | 'investing' | 'queued';
export type DebtLevel = 'none' | 'medium' | 'high';

export interface District {
  /** productId (== the PBI's own id in every scenario shipped today — see file header). */
  id: string;
  name: string;
  pbiIds: string[];
  pbiCount: number;
  totalEffort: number;
  kinds: PBIKind[];
  primaryKind: PBIKind;
  status: DistrictStatus;
  /** 0-100. See the comment above the function body for the derivation. */
  healthPct: number;
  debtLevel: DebtLevel;
  /** Grid column span heuristic (2/3/4 of a 6-col grid), from invested effort. */
  span: 2 | 3 | 4;
  satisfiesCustomerIds: string[];
}

function nonReleaseCard(p: PBI): boolean {
  return p.kind !== 'release-card';
}

/**
 * PBIs the engine tracks continuously from game start — `scenario.initialBacklog`
 * only. Deliberately does NOT include `scenario.discoveryPool`: those items
 * are spoilers (titles the player hasn't been shown yet) until the engine
 * actually reveals one into `productBacklog`, at which point `visiblePbisNow`
 * below picks it up. Showing a district for an undiscovered PBI would invent
 * information the player's own state doesn't have yet.
 */
function knownPbis(scenario: Scenario): PBI[] {
  const map = new Map<string, PBI>();
  for (const p of scenario.initialBacklog.filter(nonReleaseCard)) map.set(p.id, p);
  return Array.from(map.values());
}

/** PBIs currently sitting in either backlog right now (queued or mid-sprint). */
function visiblePbisNow(state: GameState): PBI[] {
  const map = new Map<string, PBI>();
  for (const p of [...state.productBacklog, ...state.iterationBacklog].filter(nonReleaseCard)) {
    map.set(p.id, p);
  }
  return Array.from(map.values());
}

/**
 * Which `scenario.initialBacklog` PBIs have shipped, ever — same rule
 * engine/step.ts's `derivePriorDone` applies before `execute-iteration`:
 * "not in productBacklog and not in iterationBacklog" (both backlogs are the
 * ONLY places the engine ever holds a not-yet-shipped item; nothing lost).
 */
function deriveDoneInitialIds(state: GameState, scenario: Scenario): Set<string> {
  const visibleIds = new Set(visiblePbisNow(state).map((p) => p.id));
  const done = new Set<string>();
  for (const p of scenario.initialBacklog.filter(nonReleaseCard)) {
    if (!visibleIds.has(p.id)) done.add(p.id);
  }
  return done;
}

function spanFor(totalEffort: number): 2 | 3 | 4 {
  if (totalEffort >= 11) return 4;
  if (totalEffort >= 6) return 3;
  return 2;
}

function primaryKindOf(kinds: PBIKind[]): PBIKind {
  if (kinds.includes('tech')) return 'tech';
  if (kinds.includes('regulatory')) return 'regulatory';
  return 'customer';
}

export function deriveDistricts(state: GameState, scenario: Scenario): District[] {
  const known = knownPbis(scenario);
  const knownIds = new Set(known.map((p) => p.id));
  const visibleUnknown = visiblePbisNow(state).filter((p) => !knownIds.has(p.id));

  // Prefer the "known" (scenario-authored) copy of a PBI over its visible
  // one so title/effort stay stable even if the visible-backlog copy has a
  // revealed-effort mutation; visible-only (event-injected) PBIs use their
  // live copy since no authored one exists.
  const allPbis = [...known, ...visibleUnknown];

  const byProduct = new Map<string, PBI[]>();
  for (const pbi of allPbis) {
    const key = pbi.productId ?? pbi.id;
    const list = byProduct.get(key) ?? [];
    list.push(pbi);
    byProduct.set(key, list);
  }

  const doneInitialIds = deriveDoneInitialIds(state, scenario);
  const investingIds = new Set(state.iterationBacklog.map((p) => p.id));

  const districts: District[] = [];
  for (const [productId, pbis] of byProduct) {
    const doneCount = pbis.filter((p) => doneInitialIds.has(p.id)).length;
    const investingCount = pbis.filter((p) => investingIds.has(p.id)).length;

    let status: DistrictStatus;
    if (doneCount === pbis.length && pbis.length > 0) status = 'built';
    else if (investingCount > 0 || doneCount > 0) status = 'investing';
    else status = 'queued';

    const kinds = Array.from(new Set(pbis.map((p) => p.kind)));
    const primaryKind = primaryKindOf(kinds);
    const totalEffort = pbis.reduce((sum, p) => sum + (p.effortRevealed ?? p.effort), 0);
    const satisfiesCustomerIds = Array.from(new Set(pbis.flatMap((p) => p.satisfies)));

    districts.push({
      id: productId,
      name: pbis.map((p) => p.title).join(' + '),
      pbiIds: pbis.map((p) => p.id),
      pbiCount: pbis.length,
      totalEffort,
      kinds,
      primaryKind,
      status,
      healthPct: healthPctFor(status, primaryKind, state.tech.techDebt),
      debtLevel: debtLevelFor(status, primaryKind, state.tech.techDebt),
      span: spanFor(totalEffort),
      satisfiesCustomerIds,
    });
  }

  // Biggest bets first (mirrors the mockup's Onboarding/Checkout-first layout).
  return districts.sort((a, b) => b.totalEffort - a.totalEffort || a.name.localeCompare(b.name));
}

/**
 * Health bar percentage. The engine has exactly ONE reliability number and
 * ONE tech-debt number for the whole product (`state.tech.reliability` /
 * `state.tech.techDebt`) — nothing per-PBI or per-productId. So a built
 * district's health rides the same global debt signal every other built
 * district rides (debt is a shared account in this engine, not attributable
 * to one feature); a `tech`-kind district IS the paydown lever, so once
 * built it reads fully healthy. `investing` gets a fixed neutral read (work
 * is committed but unresolved, nothing to grade yet); `queued` is 0 (never
 * touched).
 */
function healthPctFor(status: DistrictStatus, primaryKind: PBIKind, techDebt: number): number {
  if (status === 'queued') return 0;
  if (status === 'investing') return 45;
  if (primaryKind === 'tech') return 100;
  return Math.max(5, Math.min(100, 100 - techDebt));
}

/** Debt hatching level. `tech` districts never hatch (they're the antidote, not the affliction) — see healthPctFor. */
function debtLevelFor(status: DistrictStatus, primaryKind: PBIKind, techDebt: number): DebtLevel {
  if (status === 'queued' || primaryKind === 'tech') return 'none';
  if (techDebt >= 65) return 'high';
  if (techDebt >= 40) return 'medium';
  return 'none';
}

/* ============================================================
   District detail sheet copy
   ============================================================ */

export function districtStatusLine(d: District): string {
  if (d.status === 'built') return 'Shipped.';
  if (d.status === 'investing') return 'Committed to the current sprint — in progress, not yet resolved.';
  return 'Not built yet — sitting in the backlog, unplanned.';
}

export function districtFactsLine(d: District, scenario: Scenario): string {
  const parts: string[] = [
    `${d.pbiCount} backlog item${d.pbiCount === 1 ? '' : 's'} · ${d.totalEffort} pt${d.totalEffort === 1 ? '' : 's'} invested.`,
  ];
  if (d.satisfiesCustomerIds.length > 0) {
    const names = d.satisfiesCustomerIds
      .map((cid) => {
        const c = scenario.customers.find((x) => x.id === cid);
        return c ? shortName(c.name) : null;
      })
      .filter((n): n is string => !!n);
    if (names.length > 0) parts.push(`Matters to ${names.join(', ')}.`);
  }
  return parts.join(' ');
}

/**
 * Debt attribution: derived from `tech.lastTechInvestmentIter` (a real
 * engine field) plus a best-effort scan of `state.eventLog` for the most
 * recent entry whose summary/narrative mentions debt — the event log stores
 * narrative STRINGS, not structured deltas (see metricsHistoryStore.ts), so
 * this is a text match, not a guaranteed attribution. Returns null when debt
 * isn't elevated enough to be worth a line (mirrors board.ts's
 * `productStatus` "on-track" threshold).
 */
export function districtDebtAttribution(state: GameState): string | null {
  if (state.tech.techDebt < 40) return null;
  const lastInv = state.tech.lastTechInvestmentIter;
  const base =
    lastInv === null
      ? 'No engineering-health investment has shipped yet this run.'
      : `Last engineering-health investment shipped ${state.iterationNumber - lastInv} sprint${
          state.iterationNumber - lastInv === 1 ? '' : 's'
        } ago (Sprint ${lastInv}).`;
  const recentDebtEvent = [...state.eventLog]
    .reverse()
    .find((e) => /debt/i.test(e.summary) || /debt/i.test(e.narrative));
  return recentDebtEvent
    ? `${base} Most recent debt-moving event: "${recentDebtEvent.summary}" (Sprint ${recentDebtEvent.iteration}).`
    : base;
}
