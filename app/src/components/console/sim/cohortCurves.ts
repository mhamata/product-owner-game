// Pure derivation for the Product tab's fog-of-war "cohort retention curves"
// pane (Sim 2.0 W4-G, design-sim-2.0.md §2.2 "fog of war" + §2.5). See
// `@/lib/fogOfWar.ts` for the gate/unlock logic; this file only concerns
// what the UNLOCKED pane shows.
//
// ENGINE REALITY (read before "fixing" this to match a richer cohort-retention
// chart): `state.customers` carries each customer's CURRENT happiness (0-10)
// and a static `archetype` — the closest thing this engine's customer model
// has to a "segment". Nothing in engine/ or the pre-W4-G stores tracked
// per-customer happiness over time, so — mirroring exactly how
// `metricsHistoryStore.ts` itself came to exist for the aggregate metric
// tiles (see that file's header) — this slice adds ONE new optional field to
// `MetricsSnapshot` (`customerHappiness`) and starts RECORDING real
// per-sprint per-customer values as the run plays. Nothing here backfills or
// invents a number for a sprint that was never recorded: a resumed older
// run, or any sprint played before this field existed, is honestly absent
// from these curves, not synthesized.
//
// "Cohort" here means customer ARCHETYPE (innovator / mainstream /
// enterprise / skeptic / power-user / lurker) — the only grouping the
// engine's customer model supports — averaged across every customer of that
// archetype with a recorded snapshot at a given sprint. This is NOT
// retention in the classic "% of a signup cohort still active N days later"
// sense (the engine has no signup-date/cohort-entry concept); the pane's
// caption says so explicitly rather than implying a stat this data can't
// support.

import type { CustomerArchetype, Scenario } from '@/engine/types';
import type { MetricsSnapshot } from '@/store/metricsHistoryStore';

export interface CohortPoint {
  sprint: number;
  /** Average happiness (0-10) across every customer of this archetype recorded at this sprint. */
  avgHappiness: number;
  customerCount: number;
}

export interface CohortSegment {
  archetype: CustomerArchetype;
  label: string;
  points: CohortPoint[];
}

const ARCHETYPE_LABELS: Record<CustomerArchetype, string> = {
  innovator: 'Innovators',
  mainstream: 'Mainstream',
  enterprise: 'Enterprise',
  skeptic: 'Skeptics',
  'power-user': 'Power users',
  lurker: 'Lurkers',
};

/**
 * PURE: group every recorded per-sprint customer-happiness reading by the
 * customer's archetype (per `scenario.customers`, the authored/static
 * source — archetype is never mutated at runtime), averaged per sprint.
 * Snapshots recorded before `customerHappiness` existed are skipped, not
 * zero-filled (see file header).
 */
export function deriveCohortSegments(history: MetricsSnapshot[], scenario: Scenario): CohortSegment[] {
  const archetypeById = new Map(scenario.customers.map((c) => [c.id, c.archetype]));
  const bucket = new Map<CustomerArchetype, Map<number, number[]>>();

  for (const snap of history) {
    const happiness = snap.customerHappiness ?? {};
    for (const [customerId, value] of Object.entries(happiness)) {
      const archetype = archetypeById.get(customerId);
      if (!archetype) continue; // unknown customer id — nothing to attribute this to
      let bySprint = bucket.get(archetype);
      if (!bySprint) {
        bySprint = new Map();
        bucket.set(archetype, bySprint);
      }
      const arr = bySprint.get(snap.sprint) ?? [];
      arr.push(value);
      bySprint.set(snap.sprint, arr);
    }
  }

  const segments: CohortSegment[] = [];
  for (const [archetype, bySprint] of bucket) {
    const points: CohortPoint[] = Array.from(bySprint.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([sprint, values]) => ({
        sprint,
        avgHappiness: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10,
        customerCount: values.length,
      }));
    segments.push({ archetype, label: ARCHETYPE_LABELS[archetype], points });
  }

  return segments.sort((a, b) => a.label.localeCompare(b.label));
}

/** True once at least one segment has 2+ points — i.e. there's an actual line to draw, not just a dot. */
export function hasCohortTrend(segments: CohortSegment[]): boolean {
  return segments.some((s) => s.points.length > 1);
}

/** Every sprint that appears across any segment, ascending — the shared x-domain for a multi-line chart. */
export function allCohortSprints(segments: CohortSegment[]): number[] {
  const set = new Set<number>();
  for (const s of segments) for (const p of s.points) set.add(p.sprint);
  return Array.from(set).sort((a, b) => a - b);
}

// Happiness is a fixed 0-10 engine scale (engine/customers.ts, engine/events.ts
// clamp every mutation to this range) — unlike the per-tile sparklines in
// productMap.ts (which each normalize to their OWN min/max), every segment
// here shares this same fixed y-domain so multiple lines stay comparable on
// one chart.
const HAPPINESS_MIN = 0;
const HAPPINESS_MAX = 10;

export interface CohortLinePoint {
  x: number;
  y: number;
  sprint: number;
  value: number;
}

/** PURE: map one segment's points to shared-scale SVG coordinates against the shared sprint domain. */
export function cohortLinePoints(
  points: CohortPoint[],
  sprintDomain: number[],
  width = 220,
  height = 64,
): CohortLinePoint[] {
  if (sprintDomain.length === 0) return [];
  const minSprint = sprintDomain[0];
  const maxSprint = sprintDomain[sprintDomain.length - 1];
  const span = maxSprint - minSprint || 1;
  return points.map((p) => ({
    x: Math.round(((p.sprint - minSprint) / span) * width * 100) / 100,
    y: Math.round(
      (height - ((p.avgHappiness - HAPPINESS_MIN) / (HAPPINESS_MAX - HAPPINESS_MIN)) * height) * 100,
    ) / 100,
    sprint: p.sprint,
    value: p.avgHappiness,
  }));
}

export function cohortPolylineFor(points: CohortLinePoint[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}
