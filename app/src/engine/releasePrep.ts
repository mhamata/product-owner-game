import type { ReleasePrepQuality, TechState } from './types';

/**
 * Sim 2.0 W5-J: the in-sim graded-artifact moment (design-sim-2.0.md §2.4 —
 * "the grade modulates execution risk in-engine"). When a player writes the
 * launch PRD for a placed release card and it is graded client-side by the
 * EXISTING `/api/grade-artifact` v2 route (this module never calls it, and
 * never modifies it), the returned 0-100 `overallScore` is banded into a
 * `ReleasePrepQuality` and dispatched as the `set-release-prep` action
 * (engine/step.ts), which nudges ONLY two knobs the engine already has —
 * `tech.capacityVariance` (the uncertainty width around the capacity roll,
 * see capacity.ts) and `tech.techDebt` — by small, bounded, one-time amounts.
 * No new outcome math: these are the exact same fields events.ts's
 * `capacity-baseline`/`tech-debt`-flavoured effects and techDebt.ts's own
 * updates already move.
 *
 * SCORE BANDS (server-independent — the CLIENT computes this from the
 * grade-artifact v2 route's `overallScore`; no route change was needed):
 *
 *   overallScore >= 80          -> 'strong'
 *   60 <= overallScore < 80     -> 'mixed'
 *   overallScore < 60           -> 'weak'
 *
 * EFFECT TABLE (applied ONCE, at the moment the action is dispatched):
 *
 * | Quality | tech.capacityVariance delta | tech.techDebt delta | Why |
 * |---------|------------------------------|----------------------|-----|
 * | strong  | -1                           | 0                    | A tightly-scoped PRD reads as a more predictable roll — the capacity range narrows slightly. |
 * | mixed   |  0                           | 0                    | An adequate PRD changes nothing — a true no-op. |
 * | weak    | +1                           | +2                   | A vague PRD reads as more scope-creep risk on the roll AND leaves a small debt tax behind (ambiguity gets built around, not resolved). |
 *
 * BOUNDS: `capacityVariance` is clamped to [1, 8] after the delta — capacity.ts's
 * `calculateCapacityRange` already re-clamps to [1, 6] at roll time regardless
 * of the stored value, so this is a defensive ceiling on the stored field, not
 * the effective roll width. `techDebt` is clamped to [0, 100], the same bound
 * techDebt.ts's own updates use.
 *
 * NEVER CALLED (the moment is entirely optional — no release card placed this
 * sprint, or the player skips writing the PRD) => `tech` is untouched,
 * byte-for-byte; no new GameState field is introduced, so old persisted saves
 * keep loading with zero migration. DETERMINISTIC: no PRNG — a pure function
 * of the current `tech` + the dispatched `quality`.
 */

export interface ReleasePrepEffect {
  capacityVarianceDelta: number;
  techDebtDelta: number;
}

/** The exact effect table documented above, keyed by quality band. */
export const RELEASE_PREP_EFFECTS: Record<ReleasePrepQuality, ReleasePrepEffect> = {
  strong: { capacityVarianceDelta: -1, techDebtDelta: 0 },
  mixed: { capacityVarianceDelta: 0, techDebtDelta: 0 },
  weak: { capacityVarianceDelta: 1, techDebtDelta: 2 },
};

const MIN_CAPACITY_VARIANCE = 1;
const MAX_CAPACITY_VARIANCE = 8;

/**
 * Score-band mapping documented above, as one pure function so the client
 * (which reads this from the grade-artifact v2 route's response — never
 * touching the route itself) and this module's own tests share the exact
 * same bands, with no drift between UI and engine.
 */
export function releasePrepQualityFromScore(overallScore: number): ReleasePrepQuality {
  if (overallScore >= 80) return 'strong';
  if (overallScore >= 60) return 'mixed';
  return 'weak';
}

/** PURE: apply one release-prep quality's bounded, one-time nudge to `tech`. */
export function applyReleasePrep(tech: TechState, quality: ReleasePrepQuality): TechState {
  const effect = RELEASE_PREP_EFFECTS[quality];
  return {
    ...tech,
    capacityVariance: Math.max(
      MIN_CAPACITY_VARIANCE,
      Math.min(MAX_CAPACITY_VARIANCE, tech.capacityVariance + effect.capacityVarianceDelta),
    ),
    techDebt: Math.max(0, Math.min(100, tech.techDebt + effect.techDebtDelta)),
  };
}
