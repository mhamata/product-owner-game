import type { GameState, PBI, TechState } from './types';

export interface TechUpdateResult {
  tech: TechState;
  delta: number;
}

export function updateTechDebt(state: GameState, done: PBI[]): TechUpdateResult {
  const prevDebt = state.tech.techDebt;
  const tech: TechState = {
    ...state.tech,
    investmentsDone: [...state.tech.investmentsDone],
  };

  // Accumulation: shipping customer stories without explicit DoD check increases debt.
  const shippedCustomerWork = done.some((i) => i.kind === 'customer');
  if (shippedCustomerWork) {
    const hasDoD = done.some((i) => i.requires.includes('dod-check'));
    if (!hasDoD) tech.techDebt += 5;
  }

  // Drift if no tech investment for 3+ iterations.
  const hadTechThisIter = done.some((i) => i.kind === 'tech');
  if (!hadTechThisIter) {
    const lastInv = tech.lastTechInvestmentIter ?? 0;
    if (state.iterationNumber - lastInv >= 3) tech.techDebt += 10;
  } else {
    tech.lastTechInvestmentIter = state.iterationNumber;
  }

  // Pay-down from specific tech investments + record into investmentsDone.
  for (const item of done) {
    if (item.kind !== 'tech') continue;
    if (!tech.investmentsDone.includes(item.id)) tech.investmentsDone.push(item.id);
    if (item.id === 'refactor-core') tech.techDebt = Math.max(0, tech.techDebt - 30);
    else if (item.id === 'automated-tests') tech.techDebt = Math.max(0, tech.techDebt - 10);
    else if (item.id === 'observability') tech.techDebt = Math.max(0, tech.techDebt - 5);
    else tech.techDebt = Math.max(0, tech.techDebt - 5);
  }

  tech.techDebt = Math.max(0, Math.min(100, tech.techDebt));

  // Threshold consequences (only when crossing upward).
  const crossed = (t: number) => prevDebt < t && tech.techDebt >= t;
  if (crossed(30)) tech.releaseCost = Math.max(tech.releaseCost, 4);
  if (crossed(50)) tech.releaseCost = Math.max(tech.releaseCost, 5);
  if (crossed(60)) tech.capacityBaseline = Math.max(5, tech.capacityBaseline - 2);
  if (crossed(80)) tech.releaseCost = Math.max(tech.releaseCost, 6);

  return { tech, delta: tech.techDebt - prevDebt };
}
