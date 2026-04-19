import type { GameState } from './types';

export interface CapacityRange {
  lower: number;
  expected: number;
  upper: number;
}

export function calculateCapacityRange(state: GameState): CapacityRange {
  const { team, tech } = state;

  let baseline = tech.capacityBaseline;
  let variance = tech.capacityVariance;

  baseline -= team.sickOrVacation * 1.5;
  baseline -= team.onboarding * 1.0;
  if (team.morale < 4) baseline -= 2;
  if (team.morale < 2) baseline -= 3;
  if (team.burnoutFlag) {
    baseline -= 3;
    variance += 2;
  }

  if (tech.techDebt >= 30) baseline -= 1;
  if (tech.techDebt >= 50) baseline -= 2;
  if (tech.techDebt >= 70) baseline -= 3;
  if (tech.techDebt >= 40) variance += 1;
  if (tech.techDebt >= 70) variance += 1;

  if (tech.investmentsDone.includes('automated-tests')) variance = Math.max(1, variance - 1);
  if (tech.investmentsDone.includes('observability')) variance = Math.max(1, variance - 1);
  if (tech.investmentsDone.includes('dev-team-training-bundle')) baseline += 1;
  if (tech.investmentsDone.includes('framework-upgrade-bundle')) baseline += 2;

  baseline = Math.max(5, baseline);
  variance = Math.max(1, Math.min(6, variance));

  return {
    lower: Math.round(baseline - variance),
    expected: Math.round(baseline),
    upper: Math.round(baseline + variance),
  };
}

export function resolveActualCapacity(state: GameState, prng: () => number): number {
  const range = calculateCapacityRange(state);
  const roll = prng();
  return Math.round(range.lower + roll * (range.upper - range.lower));
}
