import type { CustomerState, EngagementState, GameState, PBI } from './types';

const progression: EngagementState[] = ['dormant', 'interested', 'active', 'advocate', 'champion'];

export function promoteState(s: EngagementState): EngagementState {
  const i = progression.indexOf(s);
  if (i === -1) return s; // churned/disengaged stay
  return i < progression.length - 1 ? progression[i + 1] : s;
}

export function demoteState(s: EngagementState): EngagementState {
  const i = progression.indexOf(s);
  if (i > 0) return progression[i - 1];
  if (s === 'dormant') return 'disengaged';
  return s;
}

export interface CustomerUpdateResult {
  customers: Record<string, CustomerState>;
  happinessDeltas: Record<string, number>;
}

export function updateCustomerStates(
  state: GameState,
  done: PBI[],
  releasedProducts: string[],
): CustomerUpdateResult {
  const servedByIteration = new Set<string>();
  for (const pbi of done) {
    for (const cid of pbi.satisfies) servedByIteration.add(cid);
  }

  const servedByRelease = new Set<string>();
  for (const productId of releasedProducts) {
    // Any customer who was satisfied by any done PBI with this productId counts as served.
    for (const pbi of done) {
      if (pbi.productId === productId) {
        for (const cid of pbi.satisfies) servedByRelease.add(cid);
      }
    }
  }

  const newCustomers: Record<string, CustomerState> = {};
  const happinessDeltas: Record<string, number> = {};

  for (const id in state.customers) {
    const c = { ...state.customers[id] };
    const before = c.happiness;
    const wasServed = servedByRelease.has(id);
    const gotStory = servedByIteration.has(id);

    if (wasServed) {
      c.happiness = Math.min(10, c.happiness + 5);
      c.lastFullRelease = state.iterationNumber;
      c.consecutivePartial = 0;
      c.consecutiveNothing = 0;
      c.engagementState = promoteState(c.engagementState);
    } else if (gotStory) {
      c.consecutivePartial += 1;
      c.consecutiveNothing = 0;
      if (c.consecutivePartial >= 3) {
        c.happiness = Math.max(0, c.happiness - 1);
        c.engagementState = demoteState(c.engagementState);
      }
    } else {
      c.consecutiveNothing += 1;
      c.happiness = Math.max(0, c.happiness - 1);
      if (c.happiness === 0) {
        c.engagementState = 'churned';
      }
    }

    if (c.archetype === 'skeptic' && c.consecutivePartial >= 2) {
      c.happiness = Math.max(0, c.happiness - 1);
    }

    newCustomers[id] = c;
    happinessDeltas[id] = c.happiness - before;
  }

  return { customers: newCustomers, happinessDeltas };
}
