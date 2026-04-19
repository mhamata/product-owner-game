import type { GameState, IterationOutcome, PBI, Scenario } from './types';
import { calculateCapacityRange, resolveActualCapacity } from './capacity';
import { iterationPRNG } from './prng';
import { updateCustomerStates } from './customers';
import { updateTechDebt } from './techDebt';
import { selectEventsForIteration } from './events';

// Reveal true effort for uncertain items (e.g. "5?").
export function revealEffort(
  item: PBI,
  state: GameState,
  prng: () => number,
): number {
  if (item.effortRevealed !== null) return item.effortRevealed;
  if (!item.effortUncertain) return item.effort;

  let multiplier = 1.0;
  if (state.tech.techDebt >= 50) multiplier += 0.3;
  if (state.activePatterns.some((p) => p.tag === 'skips_refinement')) multiplier += 0.5;
  const surprise = prng() * (multiplier - 1.0);
  return Math.max(1, Math.round(item.effort * (1.0 + surprise)));
}

// Determine which products released: a product releases when all PBIs tagged productId
// for that product have been completed across any iteration AND a release-card shipped
// this iteration at a position that includes them.
function determineReleasedProducts(
  doneThisIter: PBI[],
  priorDone: Set<string>,
  allPBIs: PBI[],
): string[] {
  const released: Set<string> = new Set();
  const doneAll = new Set<string>([...priorDone, ...doneThisIter.map((i) => i.id)]);

  const releaseCardShipped = doneThisIter.some((i) => i.kind === 'release-card');
  if (!releaseCardShipped) return [];

  const productIds = Array.from(
    new Set(allPBIs.map((p) => p.productId).filter((x): x is string => !!x)),
  );

  for (const productId of productIds) {
    const itemsForProduct = allPBIs.filter((p) => p.productId === productId && p.kind !== 'release-card');
    if (itemsForProduct.length === 0) continue;
    const allShipped = itemsForProduct.every((p) => doneAll.has(p.id));
    if (allShipped) released.add(productId);
  }

  return Array.from(released);
}

// Compute revenue earned from released products: sum of satisfied customer ltvs.
function computeRevenue(
  releasedProducts: string[],
  allPBIs: PBI[],
  customers: GameState['customers'],
): number {
  let revenue = 0;
  const satisfiedCustomerIds = new Set<string>();
  for (const productId of releasedProducts) {
    for (const pbi of allPBIs) {
      if (pbi.productId === productId) {
        for (const cid of pbi.satisfies) satisfiedCustomerIds.add(cid);
      }
    }
  }
  for (const cid of satisfiedCustomerIds) {
    const c = customers[cid];
    if (c && c.engagementState !== 'churned') revenue += c.ltv;
  }
  return revenue;
}

export interface PriorDoneLedger {
  // ids of PBIs that have been shipped across prior iterations
  ids: string[];
}

export function resolveIteration(
  state: GameState,
  scenario: Scenario,
  priorDoneIds: Set<string>,
): { next: GameState; outcome: IterationOutcome } {
  const prng = iterationPRNG(state.seed, state.iterationNumber);
  const range = calculateCapacityRange(state);
  const actualCapacity = resolveActualCapacity(state, prng);

  const moraleBefore = state.team.morale;

  let pointsConsumed = 0;
  const done: PBI[] = [];
  const notDone: PBI[] = [];

  for (const item of state.iterationBacklog) {
    const effort = revealEffort(item, state, prng);
    if (pointsConsumed + effort <= actualCapacity) {
      pointsConsumed += effort;
      done.push({ ...item, effortRevealed: effort });
    } else {
      notDone.push({ ...item, effortRevealed: effort });
    }
  }

  const allPBIs = [...scenario.initialBacklog];
  const releasedProducts = determineReleasedProducts(done, priorDoneIds, allPBIs);
  const revenueEarned = computeRevenue(releasedProducts, allPBIs, state.customers);

  const { customers, happinessDeltas } = updateCustomerStates(
    state,
    done,
    releasedProducts,
  );

  const { tech, delta: techDebtDelta } = updateTechDebt(state, done);

  // Team state: morale drifts based on how much shipped vs committed.
  const commitRatio = state.iterationBacklog.length
    ? done.length / state.iterationBacklog.length
    : 1;
  let morale = state.team.morale;
  if (commitRatio >= 0.9) morale = Math.min(10, morale + 1);
  else if (commitRatio < 0.5) morale = Math.max(0, morale - 1);

  // Onboarders ramp after 2 iters.
  const team = { ...state.team, morale, onboarding: Math.max(0, state.team.onboarding - 1) };

  // Return not-done PBIs to productBacklog (top of list, preserving order).
  const productBacklog: PBI[] = [
    ...notDone.map((p) => ({ ...p, effortRevealed: p.effortRevealed })),
    ...state.productBacklog,
  ];

  const economy = {
    ...state.economy,
    revenue: state.economy.revenue + revenueEarned,
    interestAccrued:
      state.economy.interestAccrued + state.economy.revenue * state.economy.interestRate,
  };

  // Decide next-iteration events (just names — UI will render from scenario deck).
  const nextState: GameState = {
    ...state,
    productBacklog,
    iterationBacklog: [],
    releaseCardPosition: null,
    customers,
    team,
    tech,
    economy,
    phase: 'review',
  };

  const fired = selectEventsForIteration(nextState, scenario);
  nextState.pendingEvents = fired.map((e) => e.id);

  const outcome: IterationOutcome = {
    iteration: state.iterationNumber,
    capacityRolled: actualCapacity,
    capacityRange: range,
    done,
    notDone,
    releasedProducts,
    revenueEarned,
    techDebtDelta,
    moraleDelta: morale - moraleBefore,
    happinessDeltas,
    firedEvents: fired.map((e) => e.id),
  };

  nextState.lastOutcome = outcome;
  return { next: nextState, outcome };
}
