// Sim 2.0 W2-C: board confidence, season expectations, the firing fail-state,
// end-of-season verdict, and deterministic job-market offers
// (design-sim-2.0.md §2.3). Engine-only: pure, deterministic (no PRNG beyond
// the seeded generators already used elsewhere), additive/backward-compatible
// exactly like people.ts's roster — see types.ts's `GameState.board` comment.

import type { BoardExpectation, BoardExpectationStatus, BoardState, GameState, Scenario } from './types';
import { createPRNG } from './prng';
import { calculateScore, type GameScore } from './score';

/** Confidence floor: at/above stays employed, below → fired at review. */
export const FIRING_FLOOR = 30;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---------------------------------------------------------------------------
// Starting confidence
// ---------------------------------------------------------------------------

/**
 * Starting board confidence, derived deterministically from the scenario's
 * capacity volatility — the one axis the adaptive difficulty ratchet
 * (`scenarios/difficulty.ts`) actually moves (it widens `capacityVariance`
 * relative to `capacityBaseline` per earned tier, and difficulty is applied
 * to the scenario BEFORE it reaches `createGame`, so this reads the
 * already-tiered numbers). A scenario/tier whose capacity is proportionally
 * more volatile reads as a harder board to satisfy from turn one, so
 * confidence starts a little lower. No PRNG: same scenario (+ tier) always
 * yields the same starting number.
 *
 * Rule: base 62, minus 1 point per percentage-point the variance:baseline
 * ratio sits above 20%, clamped to [45, 65].
 */
export function deriveInitialConfidence(scenario: Scenario): number {
  const { capacityBaseline, capacityVariance } = scenario.tech;
  const ratio = capacityBaseline > 0 ? capacityVariance / capacityBaseline : 0;
  const penalty = Math.max(0, Math.round((ratio - 0.2) * 100));
  return clamp(62 - penalty, 45, 65);
}

// ---------------------------------------------------------------------------
// Expectations: 3 per run, ids fixed, derived from the scenario's own
// structure (its revenue target + its customer/tech state shape), status
// computed at read time from current GameState.
// ---------------------------------------------------------------------------

const EXPECTATION_IDS = ['revenue', 'customers', 'product'] as const;
export type BoardExpectationId = (typeof EXPECTATION_IDS)[number];

const EXPECTATION_LABELS: Record<BoardExpectationId, (scenario: Scenario) => string> = {
  revenue: (scenario) => `Hit $${scenario.targetRevenue} in revenue this season`,
  customers: () => 'Keep customers happy and engaged',
  product: () => 'Keep tech debt under control',
};

/** Ids + labels for a scenario's 3 expectations, all starting 'on-track'
 * (nothing has happened yet at game creation — see refreshExpectations for
 * the real per-sprint status math). */
export function deriveBoardExpectations(scenario: Scenario): BoardExpectation[] {
  return EXPECTATION_IDS.map((id) => ({
    id,
    label: EXPECTATION_LABELS[id](scenario),
    status: 'on-track',
  }));
}

function revenueStatus(state: GameState, scenario: Scenario): BoardExpectationStatus {
  if (!scenario.targetRevenue || scenario.targetRevenue <= 0) return 'on-track';
  if (!state.totalIterations) return 'on-track';
  const sprintsCompleted = clamp(state.iterationNumber, 1, state.totalIterations);
  const paceExpected = scenario.targetRevenue * (sprintsCompleted / state.totalIterations);
  if (paceExpected <= 0) return 'on-track';
  const ratio = state.economy.revenue / paceExpected;
  if (ratio >= 0.9) return 'on-track';
  if (ratio >= 0.5) return 'at-risk';
  return 'off-track';
}

function customerStatus(state: GameState): BoardExpectationStatus {
  const customers = Object.values(state.customers);
  if (customers.length === 0) return 'on-track';
  const avgHappiness = customers.reduce((sum, c) => sum + c.happiness, 0) / customers.length;
  if (avgHappiness >= 6) return 'on-track';
  if (avgHappiness >= 3.5) return 'at-risk';
  return 'off-track';
}

function productStatus(state: GameState): BoardExpectationStatus {
  const debt = state.tech.techDebt;
  if (debt < 40) return 'on-track';
  if (debt < 65) return 'at-risk';
  return 'off-track';
}

/** Recompute every expectation's status from the current GameState. Pure. */
export function computeExpectationStatus(
  id: string,
  state: GameState,
  scenario: Scenario,
): BoardExpectationStatus {
  switch (id as BoardExpectationId) {
    case 'revenue':
      return revenueStatus(state, scenario);
    case 'customers':
      return customerStatus(state);
    case 'product':
      return productStatus(state);
    default:
      return 'on-track';
  }
}

export function refreshExpectations(
  expectations: BoardExpectation[],
  state: GameState,
  scenario: Scenario,
): BoardExpectation[] {
  return expectations.map((e) => ({
    ...e,
    status: computeExpectationStatus(e.id, state, scenario),
  }));
}

// ---------------------------------------------------------------------------
// Backfill (mirrors people.ts's ensurePeopleRoster)
// ---------------------------------------------------------------------------

/** `board` if present, else a fresh one for this scenario. Pure. */
export function ensureBoard(board: BoardState | undefined, scenario: Scenario): BoardState {
  return (
    board ?? {
      confidence: deriveInitialConfidence(scenario),
      expectations: deriveBoardExpectations(scenario),
    }
  );
}

// ---------------------------------------------------------------------------
// Per-sprint confidence dynamics
// ---------------------------------------------------------------------------

/**
 * Board confidence delta rule table — small, bounded, additive per sprint.
 * Deterministic given the sprint's resolved outcome; no PRNG involved.
 * Multiple rules can fire the same sprint; the sum is clamped to [0, 100] by
 * the caller (`advanceBoard`).
 *
 * | Trigger                                                      | Delta |
 * |----------------------------------------------------------------|------:|
 * | Commit delivery >= 90% ("sprint goal met")                      |   +3  |
 * | Commit delivery < 50% ("sprint goal missed")                     |   -4  |
 * | A product released this sprint                                   |   +5  |
 * | Cumulative revenue >= 90% of the pro-rated season target pace     |   +2  |
 * | Cumulative revenue < 50% of the pro-rated season target pace       |   -3  |
 * | Tech debt crosses upward into the 60+ band this sprint (incident)   |   -5  |
 * | Tech debt crosses upward into the 80+ band this sprint (incident)    |   -5  |
 */
export interface BoardConfidenceInputs {
  commitRatio: number;
  releasedAnyProduct: boolean;
  revenueAfter: number;
  targetRevenue: number;
  sprintsCompleted: number;
  totalIterations: number;
  techDebtBefore: number;
  techDebtAfter: number;
}

export function deriveConfidenceDelta(inputs: BoardConfidenceInputs): number {
  let delta = 0;

  if (inputs.commitRatio >= 0.9) delta += 3;
  else if (inputs.commitRatio < 0.5) delta -= 4;

  if (inputs.releasedAnyProduct) delta += 5;

  if (inputs.targetRevenue > 0 && inputs.totalIterations > 0) {
    const paceExpected =
      inputs.targetRevenue * (inputs.sprintsCompleted / inputs.totalIterations);
    if (paceExpected > 0) {
      const ratio = inputs.revenueAfter / paceExpected;
      if (ratio >= 0.9) delta += 2;
      else if (ratio < 0.5) delta -= 3;
    }
  }

  const crossedUpwardInto = (t: number) =>
    inputs.techDebtBefore < t && inputs.techDebtAfter >= t;
  if (crossedUpwardInto(60)) delta -= 5;
  if (crossedUpwardInto(80)) delta -= 5;

  return delta;
}

/**
 * Apply one sprint's confidence delta + refresh expectation statuses.
 * `state` should be the post-resolution state (economy/tech/customers
 * already updated for this sprint, `iterationNumber` still the sprint that
 * was just resolved — see execution.ts's call site). Never sets
 * `firedAtSprint`: that's step.ts's 'advance-iteration' concern (see
 * types.ts's Phase comment for why 'fired' is reachable only from review).
 */
export function advanceBoard(
  board: BoardState,
  state: GameState,
  scenario: Scenario,
  inputs: BoardConfidenceInputs,
): BoardState {
  const delta = deriveConfidenceDelta(inputs);
  const confidence = clamp(board.confidence + delta, 0, 100);
  const expectations = refreshExpectations(board.expectations, state, scenario);
  return { ...board, confidence, expectations };
}

// ---------------------------------------------------------------------------
// End-of-season summary
// ---------------------------------------------------------------------------

export type SeasonVerdict = 'exceeded' | 'met' | 'mixed' | 'missed' | 'fired';

export interface SeasonSummary {
  verdict: SeasonVerdict;
  score: GameScore;
  confidence: number;
  expectations: BoardExpectation[];
  expectationsOnTrack: number;
  fired: boolean;
  firedAtSprint: number | null;
}

/** Pure derivation of the season's verdict from confidence + expectations +
 * the existing 5-dimension score. Never mutates state. */
export function deriveSeasonSummary(state: GameState, scenario: Scenario): SeasonSummary {
  const board = ensureBoard(state.board, scenario);
  const score = calculateScore(state, scenario);
  const fired = state.phase === 'fired' || board.firedAtSprint !== undefined;
  const expectationsOnTrack = board.expectations.filter((e) => e.status === 'on-track').length;

  let verdict: SeasonVerdict;
  if (fired) verdict = 'fired';
  else if (score.total >= 80 && board.confidence >= 70) verdict = 'exceeded';
  else if (score.total >= 60 && board.confidence >= 50) verdict = 'met';
  else if (score.total >= 40) verdict = 'mixed';
  else verdict = 'missed';

  return {
    verdict,
    score,
    confidence: board.confidence,
    expectations: board.expectations,
    expectationsOnTrack,
    fired,
    firedAtSprint: board.firedAtSprint ?? null,
  };
}

// ---------------------------------------------------------------------------
// Job market: 2-3 deterministic offers derived from the FINAL state (not
// just the seed) — same final record (score/confidence/fired), even from
// different play-throughs of the same seed, always yields the same offers.
// ---------------------------------------------------------------------------

export type JobOfferLevel = 'down' | 'same' | 'up';

export interface JobOffer {
  id: string;
  company: string;
  level: JobOfferLevel;
  title: string;
  pitch: string;
}

const LEVEL_TITLES: Record<JobOfferLevel, string> = {
  down: 'Associate Product Manager',
  same: 'Product Manager',
  up: 'Senior Product Manager',
};

// Company pools are cosmetic ("industry-flavored"), never balance — same
// spirit as scenarios/*.display.ts. `default` covers no/unknown industry so
// the engine never depends on `@/curriculum/industries` (see people.ts).
const COMPANY_POOLS: Record<string, string[]> = {
  saas: ['Northbeam', 'Loopwork', 'Ferrous Labs', 'Gridline', 'Basecamp Nine'],
  fintech: ['Ledgerly', 'Vaultwise', 'Coinlatch', 'Trustmark Pay', 'Northstar Capital'],
  marketplace: ['Barterly', 'Sidewalk', 'Traderoute', 'Kindred Goods', 'Openlot'],
  consumer: ['Dayglow', 'Homeward', 'Nestled', 'Pocketful', 'Sunroom'],
  healthcare: ['Carewell Health', 'Vitalis', 'Northline Care', 'Meridian Health', 'Wellspring Clinical'],
  default: ['Anchorpoint', 'Brightline', 'Cedarwood', 'Driftline', 'Everport'],
};

const PITCH_FLAVORS: Record<JobOfferLevel, string[]> = {
  down: [
    'Smaller team, more surface area to prove yourself on.',
    'A rebuild story — ship fast, own the roadmap early.',
    'Scrappy stage; the record from this season still opens the door.',
  ],
  same: [
    'Same scope, a fresh product to learn.',
    'They read the record and want the same bet again.',
    'A lateral move, different market, same level of trust.',
  ],
  up: [
    'They want the operator who shipped under pressure.',
    'A bigger scope, funded by exactly the record this season proved.',
    'Stretch role — the board wants someone who has already been tested.',
  ],
};

/** Which levels get offered, purely from the record (not randomness). */
function deriveOfferLevels(fired: boolean, scoreTotal: number): JobOfferLevel[] {
  if (fired) return ['down', 'same'];
  if (scoreTotal >= 75) return ['up', 'up', 'same'];
  if (scoreTotal >= 50) return ['same', 'up'];
  return ['same', 'down'];
}

function pick<T>(pool: readonly T[], prng: () => number): T {
  const idx = Math.min(pool.length - 1, Math.floor(prng() * pool.length));
  return pool[idx];
}

/**
 * 2-3 deterministic offers from the final state. `industry` is an optional
 * plain string (see people.ts) purely for cosmetic company-pool flavour.
 */
export function deriveJobMarketOffers(
  state: GameState,
  scenario: Scenario,
  industry?: string,
): JobOffer[] {
  const summary = deriveSeasonSummary(state, scenario);
  const levels = deriveOfferLevels(summary.fired, summary.score.total);
  const pool = COMPANY_POOLS[industry ?? 'default'] ?? COMPANY_POOLS.default;

  // Seeded on the run's seed PLUS the final record, so replays of the same
  // seed that end up with a different outcome (different actions) get
  // different offers, while an identical final state always reproduces the
  // same ones.
  const seedKey = [
    state.seed,
    'offers',
    scenario.id,
    Math.round(summary.score.total),
    Math.round(summary.confidence),
    summary.fired ? 'fired' : 'active',
  ].join('::');
  const prng = createPRNG(seedKey);

  const usedCompanies = new Set<string>();
  return levels.map((level, i) => {
    let company = pick(pool, prng);
    for (let guard = 0; usedCompanies.has(company) && guard < pool.length; guard++) {
      company = pick(pool, prng);
    }
    usedCompanies.add(company);
    return {
      id: `offer-${i}-${level}`,
      company,
      level,
      title: LEVEL_TITLES[level],
      pitch: pick(PITCH_FLAVORS[level], prng),
    };
  });
}

// ---------------------------------------------------------------------------
// Selectors (pure)
// ---------------------------------------------------------------------------

export function getBoardConfidence(state: GameState, scenario: Scenario): number {
  return ensureBoard(state.board, scenario).confidence;
}

export function getExpectationStatuses(state: GameState, scenario: Scenario): BoardExpectation[] {
  return ensureBoard(state.board, scenario).expectations;
}

export function isFired(state: GameState): boolean {
  return state.phase === 'fired';
}
