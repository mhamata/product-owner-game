/**
 * MASTERY DECAY: a pure, additive strength model layered on top of
 * `learnStore`'s boolean mastery.
 *
 * CRITICAL RULING (design-sim-2.0.md §2.5, "mastery decays, never re-locks"):
 * decay is DISPLAY-ONLY. It never un-masters a skill, never removes it from
 * `masteredIds()`, and never re-locks anything gated on mastery
 * (`deriveSkillState`, `isLevelUnlocked`, `isLevelCertified`, fog-of-war
 * gates, etc. all keep reading the boolean unchanged). Decay only drives:
 *   1. the strength % shown on a mastered skill's tech-tree node, and
 *   2. whether that node is flagged "rusty" (offering a 90-second refresh),
 *   3. the Standup scheduler's competency ranking (see scheduler.ts).
 * This module has no write access to any store — it is pure math over a
 * small input shape, so both invariants above are enforced by construction:
 * there is no exported function here that could un-master anything.
 *
 * DATA SOURCE / MIGRATION
 * ------------------------
 * Strength is computed from "time since last practiced". `learnStore`
 * records `lastPracticedAt` on every `recordResult`/`recordPlacementPass`
 * call going forward (see learnStore.ts). Persisted state from BEFORE this
 * field existed has no `lastPracticedAt` for already-mastered skills — for
 * those we fall back to `masteredAt` (already persisted), which is a
 * reasonable "last known practice" proxy: the moment mastery was reached is
 * the most recent evidence we have. If NEITHER is present (should only
 * happen for a hand-crafted or corrupted record), we treat the skill as
 * "stale-unknown" and render it at the decay FLOOR rather than assuming
 * freshness — silently showing 100% for a skill we have no timing evidence
 * for would be the more dangerous default.
 *
 * DECAY CURVE (FSRS-flavoured, deliberately simplified — see design-doc
 * §2.5's "simple + documented" instruction; no per-modality half-life, since
 * learnStore does not track modality per skill):
 *
 *   days since last practiced     strength
 *   ------------------------      --------
 *   0  .. GRACE (14d)             100  (full strength, no visible decay yet)
 *   14 .. 49d (35-day span)       100 -> 40, linear
 *   49d+                          40   (floor — never below; rust caps out,
 *                                       it does not erase the skill)
 *
 * RECOVERY RULE: completing a 90-second refresh (two judgment cards in a
 * different industry skin, see skillRefresh.ts) calls
 * `learnStore.recordMaintenanceRep(skillId)`, which stamps `lastPracticedAt`
 * to now — resetting the decay clock to full strength (100) regardless of
 * whether both refresh cards were answered correctly. This mirrors
 * `reviewStore`'s own philosophy: showing up and re-engaging with the
 * material is what the decay clock measures. Accuracy is still tracked and
 * has real consequences, just at the Leitner-box level (a wrong card during
 * a refresh still resets that judgment card to box 0 via the normal
 * `reviewStore.review()` call) rather than the decay level.
 */

/** The threshold `learnStore.MASTERY_THRESHOLD` uses. Kept in sync by convention (see learnStore.ts). */
const MASTERY_THRESHOLD = 1;

/** Days of full strength after last practice before decay begins. */
export const DECAY_GRACE_DAYS = 14;

/** Days over which strength decays from full to floor, once the grace window ends. */
export const DECAY_SPAN_DAYS = 35;

/** Strength (0-100) during the grace window. */
export const DECAY_FULL_STRENGTH = 100;

/** Strength (0-100) once fully decayed. Never goes lower — rust caps out. */
export const DECAY_FLOOR_STRENGTH = 40;

/** Below this strength, a mastered skill is flagged "rusty" (offers a refresh). */
export const RUSTY_THRESHOLD = 70;

/** The minimal shape decay math needs for one skill. Mirrors `SkillProgress`. */
export interface DecayRecord {
  /** 0..1 demonstrated competence, same field `learnStore.SkillProgress` carries. */
  mastery: number;
  /** Epoch ms of the most recent practice rep (lesson/drill/artifact/refresh). */
  lastPracticedAt?: number;
  /** Epoch ms the skill first crossed the mastery threshold. */
  masteredAt?: number;
}

/** Whether a record's mastery has crossed the threshold. */
export function isMasteredRecord(r: DecayRecord | undefined): boolean {
  return (r?.mastery ?? 0) >= MASTERY_THRESHOLD;
}

/**
 * The timestamp decay math should treat as "last practiced": the explicit
 * field if we have it, else the mastery timestamp (see migration note above).
 * `undefined` means genuinely no timing evidence at all.
 */
export function effectivePracticedAt(r: DecayRecord | undefined): number | undefined {
  return r?.lastPracticedAt ?? r?.masteredAt;
}

/** Whole (fractional) days between two epoch-ms instants. Never negative. */
export function daysSince(fromMs: number, nowMs: number): number {
  return Math.max(0, (nowMs - fromMs) / 86_400_000);
}

/**
 * A mastered skill's display strength, 0-100. Unmastered skills have no
 * strength concept (the tech tree shows them locked/active, not a meter) and
 * this returns 0 for them by convention.
 */
export function strengthOf(r: DecayRecord | undefined, now: number = Date.now()): number {
  if (!isMasteredRecord(r)) return 0;

  const practicedAt = effectivePracticedAt(r);
  if (practicedAt === undefined) return DECAY_FLOOR_STRENGTH; // stale-unknown: no evidence, don't assume fresh

  const days = daysSince(practicedAt, now);
  if (days <= DECAY_GRACE_DAYS) return DECAY_FULL_STRENGTH;

  const decayDays = days - DECAY_GRACE_DAYS;
  if (decayDays >= DECAY_SPAN_DAYS) return DECAY_FLOOR_STRENGTH;

  const t = decayDays / DECAY_SPAN_DAYS;
  const raw = DECAY_FULL_STRENGTH - t * (DECAY_FULL_STRENGTH - DECAY_FLOOR_STRENGTH);
  return Math.round(raw);
}

/**
 * True for a mastered skill whose strength has decayed below the rusty
 * threshold. Always false for an unmastered skill — decay cannot make
 * something "more locked" than it already is; there is nothing to rust yet.
 */
export function isRusty(r: DecayRecord | undefined, now: number = Date.now()): boolean {
  return isMasteredRecord(r) && strengthOf(r, now) < RUSTY_THRESHOLD;
}

/**
 * A competency's average decay strength (0..1), across only its MASTERED
 * ready skills. Feeds the Standup scheduler (scheduler.ts) so a competency
 * full of rusty-but-mastered skills ranks weaker than one that is equally
 * "covered" but fresh — without ever touching the boolean coverage fraction
 * gating derives from.
 *
 * A competency with no mastered skills yet returns 1 (no discount): there is
 * nothing to have decayed, and `competencyStrength`'s existing coverage term
 * already reads 0 for "nothing mastered" — discounting further would double
 * count the same gap.
 */
export function averageCompetencyDecay(
  records: readonly DecayRecord[],
  now: number = Date.now(),
): number {
  const mastered = records.filter((r) => isMasteredRecord(r));
  if (mastered.length === 0) return 1;
  const total = mastered.reduce((sum, r) => sum + strengthOf(r, now) / 100, 0);
  return total / mastered.length;
}
