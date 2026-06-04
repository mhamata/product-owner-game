import type { Scenario } from '@/engine/types';
import { MAX_DIFFICULTY_TIER } from '@/store/simDifficultyStore';

/**
 * Ratchet a scenario's squeeze for an adaptive replay. Tier 0 returns the
 * scenario unchanged.
 *
 * Each earned tier trims the team's capacity baseline and widens its variance,
 * so a player who aced a rung meets a genuinely harder version: the same goal,
 * fewer and less predictable resources. We deliberately do NOT move the revenue
 * target or any other scored value, so a finished run's score and target never
 * shift retroactively when the next tier unlocks. Capacity is baked into the
 * game state at creation, so only NEW games feel the change; one in progress is
 * untouched. Ids, events, and copy are never altered: the game still plays and
 * reads identically.
 */
export function applyDifficulty(scenario: Scenario, tier: number): Scenario {
  const t = Math.max(0, Math.min(MAX_DIFFICULTY_TIER, Math.round(tier)));
  if (t === 0) return scenario;
  return {
    ...scenario,
    tech: {
      ...scenario.tech,
      capacityBaseline: Math.max(8, scenario.tech.capacityBaseline - t),
      capacityVariance: scenario.tech.capacityVariance + t,
      investmentsDone: [...scenario.tech.investmentsDone],
    },
  };
}
