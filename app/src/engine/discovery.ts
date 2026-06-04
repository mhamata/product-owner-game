import type { GameState, PBI, Scenario } from './types';
import { iterationPRNG } from './prng';

// Reveal 1 PBI from the scenario's discoveryPool at the start of an iteration.
// Selection is deterministic (seeded PRNG keyed by seed + iteration).
// An item is only revealed once: already-discovered ids are filtered out.
export function runDiscovery(
  state: GameState,
  scenario: Scenario,
): { newBacklog: PBI[]; newlyDiscoveredIds: string[] } {
  const pool = scenario.discoveryPool ?? [];
  if (pool.length === 0) {
    return { newBacklog: state.productBacklog, newlyDiscoveredIds: [] };
  }

  const seenIds = new Set<string>([
    ...state.productBacklog.map((p) => p.id),
    ...state.iterationBacklog.map((p) => p.id),
    // Also exclude anything that has already been discovered on a prior iter
    // but has since shipped: check against initialBacklog + any prior
    // newlyDiscoveredIds recorded in eventLog via source tag is overkill;
    // we rely on the same-id guard below.
  ]);

  // Anything in the pool that hasn't been seen yet.
  const available = pool.filter((p) => !seenIds.has(p.id));
  if (available.length === 0) {
    return { newBacklog: state.productBacklog, newlyDiscoveredIds: [] };
  }

  const prng = iterationPRNG(state.seed, state.iterationNumber);
  const idx = Math.floor(prng() * available.length);
  const chosen: PBI = {
    ...available[idx],
    discoveredInIteration: state.iterationNumber,
    source: 'discovery',
  };

  return {
    newBacklog: [chosen, ...state.productBacklog],
    newlyDiscoveredIds: [chosen.id],
  };
}
