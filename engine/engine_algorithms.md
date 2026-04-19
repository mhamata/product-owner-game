# PRAXIS Game Engine — Deterministic Algorithms

**Purpose:** the deterministic math behind every game mechanic. The UI describes what the player sees; this doc describes what happens under the hood. The engine is a pure function: `newState = step(state, action)`.

**Design principles:**
1. **Deterministic** — given state + action, always produces same result. No hidden randomness except seeded PRNG.
2. **Testable** — every function has a known input/output. Property-based tests trivial to write.
3. **Engine is a library, not a service** — runs in browser for tutorial, on server for real games.
4. **No AI in the hot path** — AI used for retrospectives and Sprint Goal grading (async, optional). Core loop is rules-based.

---

## 1. Core types

```typescript
interface GameState {
  scenarioId: string;
  iterationNumber: number;  // 1-based, 1 to N
  seed: string;             // for deterministic PRNG
  phase: 'planning' | 'committed' | 'executing' | 'review' | 'complete';

  productBacklog: PBI[];    // remaining unordered items
  iterationBacklog: PBI[];  // ordered list + release card position
  releaseCardPosition: number | null;  // index where release is placed
  sprintGoal: string | null;

  customers: Record<string, CustomerState>;
  stakeholders: Record<string, StakeholderState>;
  team: TeamState;
  tech: TechState;
  economy: EconomyState;

  eventLog: EventRecord[];      // append-only log of everything that's happened
  activePatterns: PatternTag[]; // behavioural patterns tracked across iterations
}

interface PBI {
  id: string;
  title: string;
  kind: 'customer' | 'tech' | 'regulatory' | 'release-card';
  effort: number;              // points
  effortRevealed: number | null; // for "effort: 5?" — true cost revealed on execution
  value: number;               // $ if customer-facing; benefit tier if tech
  satisfies: string[];         // customer or stakeholder IDs who benefit
  requires: string[];          // PBI ids this depends on
  bundleWith?: string[];       // must complete all of these together for benefit
}

interface CustomerState {
  id: string;
  archetype: 'innovator' | 'mainstream' | 'enterprise' | 'skeptic' | 'power-user' | 'lurker';
  engagementState: 'dormant' | 'interested' | 'active' | 'advocate' | 'champion' | 'disengaged' | 'churned';
  happiness: number;           // 0-10 internal; player sees as tone of messages
  ltv: number;                 // $ per customer
  lastFullRelease: number | null;  // iter number they last got a full product release
  consecutivePartial: number;   // how many iters of partial delivery
  consecutiveNothing: number;   // how many iters of nothing delivered
}

interface StakeholderState {
  id: string;
  trust: number;               // 0-10
  lastInteraction: number;     // iter number
}

interface TeamState {
  morale: number;              // 0-10
  headcount: number;
  onboarding: number;          // # new hires still ramping
  sickOrVacation: number;      // temporarily reduced this iter
  burnoutFlag: boolean;
}

interface TechState {
  releaseCost: number;         // base cost of release card, starts at 3
  capacityBaseline: number;    // center of range, starts at 15
  capacityVariance: number;    // ± half-width, starts at 3
  techDebt: number;            // 0-100
  reliability: number;         // 0-10
  cycleTime: number;           // multiplier, 1.0 = baseline
  investmentsDone: Set<string>; // IDs of tech PBIs that shipped
}

interface EconomyState {
  revenue: number;             // $ earned to date
  interestAccrued: number;     // $ from compounding
  budgetRemaining: number;     // for scenarios with budget constraint
}
```

---

## 2. Capacity range calculation

The single most important function. Determines what the player can plan and what actually gets done.

```typescript
function calculateCapacityRange(state: GameState): { lower: number; expected: number; upper: number } {
  const team = state.team;
  const tech = state.tech;

  // Start from baseline
  let baseline = tech.capacityBaseline;
  let variance = tech.capacityVariance;

  // Team modifiers
  baseline -= team.sickOrVacation * 1.5;        // each absent person = -1.5 pts
  baseline -= team.onboarding * 1.0;            // each onboarding person = -1 pt (they help eventually)
  if (team.morale < 4) baseline -= 2;           // low morale tanks output
  if (team.morale < 2) baseline -= 3;           // very low adds more
  if (team.burnoutFlag) { baseline -= 3; variance += 2; }

  // Tech modifiers
  if (tech.techDebt >= 30) baseline -= 1;
  if (tech.techDebt >= 50) baseline -= 2;
  if (tech.techDebt >= 70) baseline -= 3;

  if (tech.techDebt >= 40) variance += 1;
  if (tech.techDebt >= 70) variance += 1;

  if (tech.investmentsDone.has('automated-tests')) variance = Math.max(1, variance - 1);
  if (tech.investmentsDone.has('observability')) variance = Math.max(1, variance - 1);
  if (tech.investmentsDone.has('dev-team-training-bundle')) baseline += 1;
  if (tech.investmentsDone.has('framework-upgrade-bundle')) baseline += 2;

  // Floor and ceiling
  baseline = Math.max(5, baseline);              // team always gets something done
  variance = Math.max(1, Math.min(6, variance));

  return {
    lower: Math.round(baseline - variance),
    expected: Math.round(baseline),
    upper: Math.round(baseline + variance),
  };
}
```

**UI rendering:** the progress bar fills as player adds items; zone colours map to the returned range.

---

## 3. Deterministic PRNG

All randomness goes through a single seeded PRNG. Enables replays.

```typescript
// Simple mulberry32 PRNG — fast, good-enough entropy for games
function createPRNG(seed: string): () => number {
  let s = hashString(seed);
  return function() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Seed per iteration to make PRNG progression predictable
function iterationPRNG(state: GameState): () => number {
  return createPRNG(`${state.seed}-iter-${state.iterationNumber}`);
}
```

---

## 4. Execution resolver

The core "commit → resolve" logic. Takes a committed iteration plan, returns the outcome.

```typescript
function resolveIteration(state: GameState): GameState {
  const prng = iterationPRNG(state);
  const capacity = resolveActualCapacity(state, prng);

  let newState = { ...state };
  let pointsConsumed = 0;
  const done: PBI[] = [];
  const notDone: PBI[] = [];
  let releaseHappened = false;
  let releasedProducts: string[] = [];

  for (let i = 0; i < state.iterationBacklog.length; i++) {
    const item = state.iterationBacklog[i];

    // Reveal true effort for "effort: 5?" items
    const actualEffort = revealEffort(item, state, prng);

    if (pointsConsumed + actualEffort <= capacity) {
      pointsConsumed += actualEffort;
      done.push(item);

      // Check if this item is the release card
      if (item.kind === 'release-card') {
        releaseHappened = true;
        releasedProducts = determineReleasedProducts(done, state.productBacklog);
      }
    } else {
      // Partial — item does not complete
      notDone.push(item);
    }
  }

  newState = applyReleases(newState, releasedProducts);
  newState = moveUndoneItemsBack(newState, notDone);
  newState = accrueInterest(newState);
  newState = updateCustomerStates(newState, releasedProducts);
  newState = updateTechDebt(newState, done);
  newState = updateTeamState(newState, done, notDone);

  return newState;
}

function resolveActualCapacity(state: GameState, prng: () => number): number {
  const range = calculateCapacityRange(state);
  // Sample uniformly from [lower, upper]
  const roll = prng();
  return Math.round(range.lower + roll * (range.upper - range.lower));
}

function revealEffort(item: PBI, state: GameState, prng: () => number): number {
  if (item.effortRevealed !== null) return item.effortRevealed;

  // Uncertain items: effort may be 1.0-2.0x original estimate
  // Higher tech debt + less refinement = bigger upward surprise
  let multiplier = 1.0;
  if (state.tech.techDebt >= 50) multiplier += 0.3;
  if (state.activePatterns.includes('skips_refinement')) multiplier += 0.5;
  const surprise = prng() * (multiplier - 1.0);
  return Math.round(item.effort * (1.0 + surprise));
}

function determineReleasedProducts(done: PBI[], productBacklog: PBI[]): string[] {
  // A product releases when ALL stories for that product are Done (including from prior iters)
  // and the release card is in the done list.
  // Product IDs are inferred from satisfies[].
  // This function returns product IDs that just completed.
  // Implementation: group done items by product, check completeness.
  // [detailed impl in src/engine/release.ts]
  return [];
}
```

---

## 5. Customer state transitions

State machine with deterministic triggers.

```typescript
function updateCustomerStates(state: GameState, releasedProducts: string[]): GameState {
  const newState = { ...state };

  for (const customerId in newState.customers) {
    const customer = newState.customers[customerId];
    const wasServed = releasedProducts.some(p => productServes(p, customerId, state));
    const gotStoryDone = iterationServedCustomer(state, customerId);

    if (wasServed) {
      customer.happiness = Math.min(10, customer.happiness + 5);
      customer.lastFullRelease = state.iterationNumber;
      customer.consecutivePartial = 0;
      customer.consecutiveNothing = 0;
      customer.engagementState = promoteState(customer.engagementState);
    } else if (gotStoryDone) {
      // Partial delivery: 0 happiness change
      customer.consecutivePartial += 1;
      customer.consecutiveNothing = 0;
      if (customer.consecutivePartial >= 3) {
        customer.happiness = Math.max(0, customer.happiness - 1);
        customer.engagementState = demoteState(customer.engagementState);
      }
    } else {
      // Nothing delivered
      customer.consecutiveNothing += 1;
      customer.happiness = Math.max(0, customer.happiness - 1);
      if (customer.happiness === 0) {
        customer.engagementState = 'churned';
      }
    }

    // Archetype-specific behaviours
    if (customer.archetype === 'skeptic' && customer.consecutivePartial >= 2) {
      customer.happiness = Math.max(0, customer.happiness - 1);  // skeptics turn faster
    }
    if (customer.archetype === 'innovator' && wasServed) {
      // 20% chance of referral
      // handled in a separate referral step
    }
  }

  return newState;
}

const stateProgression = ['dormant', 'interested', 'active', 'advocate', 'champion'];
function promoteState(s: string): string {
  const i = stateProgression.indexOf(s);
  return i < stateProgression.length - 1 ? stateProgression[i + 1] : s;
}
function demoteState(s: string): string {
  const i = stateProgression.indexOf(s);
  if (i > 0) return stateProgression[i - 1];
  if (s === 'dormant') return 'disengaged';
  return s;
}
```

---

## 6. Event firing

Events fire between iterations based on weighted deck. Weights shift based on state.

```typescript
interface EventCard {
  id: string;
  category: 'stakeholder' | 'team' | 'customer' | 'vendor' | 'market' | 'tech' | 'strategic' | 'regulatory';
  baseWeight: number;
  trigger: 'random' | 'forced' | 'weighted' | 'state-gated';
  forcedAtIteration?: number;
  stateGate?: (state: GameState) => boolean;
  weightModifiers?: Array<{ condition: (state: GameState) => boolean; multiplier: number }>;
  narrative: string;
  options: EventOption[];
}

interface EventOption {
  id: string;
  label: string;
  visibleConsequence: string;  // shown to player before choosing
  apply: (state: GameState) => GameState;  // full consequence including hidden effects
}

function selectEventsForIteration(state: GameState, scenario: Scenario): EventCard[] {
  const prng = iterationPRNG(state);
  const events: EventCard[] = [];

  // 1. Forced events for this iteration
  const forced = scenario.eventDeck.filter(
    e => e.trigger === 'forced' && e.forcedAtIteration === state.iterationNumber
  );
  events.push(...forced);

  // 2. State-gated events (fire if condition met, once only per game)
  const stateGated = scenario.eventDeck.filter(
    e => e.trigger === 'state-gated'
      && e.stateGate!(state)
      && !state.eventLog.some(log => log.eventId === e.id)
  );
  events.push(...stateGated);

  // 3. Weighted random events — typically 1 per iteration
  const pool = scenario.eventDeck.filter(e => e.trigger === 'random' || e.trigger === 'weighted');
  if (pool.length > 0) {
    const weightedPool = pool.map(e => ({
      event: e,
      weight: resolveEventWeight(e, state),
    }));
    const selected = weightedSample(weightedPool, prng);
    if (selected) events.push(selected);
  }

  return events;
}

function resolveEventWeight(event: EventCard, state: GameState): number {
  let weight = event.baseWeight;
  for (const mod of event.weightModifiers ?? []) {
    if (mod.condition(state)) weight *= mod.multiplier;
  }
  return weight;
}

function weightedSample<T>(items: Array<{ event: T; weight: number }>, prng: () => number): T | null {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total === 0) return null;
  let roll = prng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.event;
  }
  return items[items.length - 1].event;
}
```

---

## 7. Tech debt accumulation & thresholds

```typescript
function updateTechDebt(state: GameState, itemsDone: PBI[]): GameState {
  const newState = { ...state };
  const tech = { ...newState.tech };

  // Accumulation
  if (itemsDone.some(i => i.kind === 'customer' && !i.requires.includes('dod-check'))) {
    tech.techDebt += 5;  // shipping without DoD
  }
  if (noTechInvestmentThisIter(state, itemsDone)) {
    const iterationsSinceInvestment = itersSinceLastTechInvestment(state);
    if (iterationsSinceInvestment >= 3) tech.techDebt += 10;
  }

  // Pay-down from tech investments
  for (const item of itemsDone) {
    if (item.kind === 'tech') {
      if (item.id === 'refactor-core') tech.techDebt = Math.max(0, tech.techDebt - 30);
      if (item.id === 'automated-tests') tech.techDebt = Math.max(0, tech.techDebt - 10);
    }
  }

  // Threshold consequences (applied when crossing)
  applyThresholdConsequences(tech, state.tech.techDebt);

  newState.tech = tech;
  return newState;
}

function applyThresholdConsequences(tech: TechState, previousDebt: number): void {
  const newDebt = tech.techDebt;
  const crossed = (threshold: number) => previousDebt < threshold && newDebt >= threshold;

  if (crossed(30)) tech.releaseCost = Math.max(tech.releaseCost, 4);
  if (crossed(50)) tech.releaseCost = Math.max(tech.releaseCost, 5);
  if (crossed(60)) tech.capacityBaseline -= 2;
  if (crossed(80)) tech.releaseCost = Math.max(tech.releaseCost, 6);
}
```

---

## 8. Sprint Goal grading (AI, async, not in hot path)

```typescript
interface SprintGoalGrade {
  clarity: number;             // 0-10
  outcomeOrientation: number;  // 0-10
  feedback: string;            // one sentence
}

async function gradeSprintGoal(goal: string): Promise<SprintGoalGrade> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    system: SPRINT_GOAL_RUBRIC_PROMPT,
    messages: [{ role: 'user', content: goal }],
    // with JSON output schema
  });
  return JSON.parse(response.content);
}

const SPRINT_GOAL_RUBRIC_PROMPT = `You are an expert product coach grading Sprint Goals against the rubric:

CLARITY (0-10):
- 10: Unambiguous outcome a stranger could verify
- 7: Clear intent but some ambiguity
- 4: Vague or abstract
- 0: Meaningless or missing

OUTCOME-ORIENTATION (0-10):
- 10: Pure outcome ("Users can complete checkout in under 30 seconds")
- 7: Outcome-leaning but mentions output
- 4: Output-focused ("Ship the checkout redesign")
- 0: Pure task list ("Do these 5 things")

Return a JSON object: { clarity: 0-10, outcomeOrientation: 0-10, feedback: "one sentence" }
Feedback tone: constructive, specific, actionable. Under 25 words.`;
```

---

## 9. Retrospective generation (AI, end-of-game)

```typescript
async function generateRetrospective(game: Game, user: User): Promise<Retrospective> {
  const gameLog = compileGameLog(game);  // full decisions, outcomes, patterns
  const priorGames = await getUserPriorGames(user.id);  // for cross-game patterns

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    system: RETROSPECTIVE_PROMPT,
    messages: [{
      role: 'user',
      content: JSON.stringify({ gameLog, priorGames, rubric: PATTERN_RUBRIC }),
    }],
    // cached: system prompt + rubric
  });

  return parseRetrospective(response);
}

const RETROSPECTIVE_PROMPT = `You are a senior product manager conducting a post-game retrospective for a trainee.

Generate a structured retrospective with:
1. HEADLINE — one sentence capturing this game's defining decision
2. STRENGTHS — 3 specific moments, each with iteration number + decision + outcome
3. GROWTH EDGES — 3 specific moments where a senior PM would have made a different call
4. ALTERNATE HISTORY — one specific "what if you had done X in iteration Y" replay
5. TECHNIQUE UNLOCKED — one PM method the player demonstrated readiness for (from the method library)
6. RECOMMENDED NEXT SCENARIO — one of the available scenarios, with reason

Tone: constructive, specific, never shaming. Cite evidence from the game log. Under 600 words total.

If prior games are provided, look for CROSS-GAME PATTERNS — things this player does repeatedly.`;
```

---

## 10. Scoring (multi-axis)

At end of game, produce a radar chart.

```typescript
interface GameScore {
  valueDelivered: number;      // 0-100 normalized
  customerLoyalty: number;
  teamHealth: number;
  stakeholderTrust: number;
  productIntegrity: number;
  personalGrowth: number;
  total: number;
}

function calculateScore(game: Game): GameScore {
  const finalState = game.state;

  const valueDelivered = Math.min(100, (finalState.economy.revenue / game.scenario.targetRevenue) * 100);

  const totalHappiness = Object.values(finalState.customers)
    .reduce((s, c) => s + c.happiness, 0);
  const maxHappiness = Object.keys(finalState.customers).length * 10;
  const customerLoyalty = (totalHappiness / maxHappiness) * 100;

  const teamHealth = (finalState.team.morale / 10) * 100;

  const totalTrust = Object.values(finalState.stakeholders).reduce((s, x) => s + x.trust, 0);
  const maxTrust = Object.keys(finalState.stakeholders).length * 10;
  const stakeholderTrust = (totalTrust / maxTrust) * 100;

  const productIntegrity = Math.max(0, 100 - finalState.tech.techDebt);

  // Personal growth: compared to prior games
  const personalGrowth = calculatePersonalGrowth(game);

  const total = (valueDelivered + customerLoyalty + teamHealth + stakeholderTrust + productIntegrity + personalGrowth) / 6;

  return { valueDelivered, customerLoyalty, teamHealth, stakeholderTrust, productIntegrity, personalGrowth, total };
}
```

---

## 11. Pattern classification

Behavioral patterns are tagged on every decision event.

```typescript
interface PatternTag {
  tag: string;
  iteration: number;
  confidence: number;  // 0-1 for fuzzy patterns
  evidence: string;    // human-readable reason
}

function classifyDecision(state: GameState, action: Action): PatternTag[] {
  const tags: PatternTag[] = [];

  // Rules-based (deterministic)
  if (action.type === 'commit-iteration' && action.payload.mid_sprint === true) {
    tags.push({ tag: 'changes_priority_mid_sprint', iteration: state.iterationNumber, confidence: 1.0, evidence: 'Re-ordered backlog after commit' });
  }

  if (action.type === 'event-response' && action.payload.option_id === 'accept_scope') {
    tags.push({ tag: 'mid_sprint_scope_add', iteration: state.iterationNumber, confidence: 1.0, evidence: 'Accepted stakeholder scope addition' });
  }

  // Sprint Goal classification (AI, async — doesn't block commit)
  if (action.type === 'commit-iteration' && action.payload.sprint_goal) {
    // enqueue async classification via Claude Haiku
    enqueueAsyncClassification({
      text: action.payload.sprint_goal,
      gameId: state.gameId,
      candidateTags: ['specifies_how', 'vague_goal', 'output_focused'],
    });
  }

  return tags;
}
```

---

## 12. Deterministic test coverage

Every function has known input/output tests:

- `calculateCapacityRange` — 20+ cases covering all modifier combinations
- `resolveIteration` — property: points consumed ≤ actual velocity; all items above release → released products
- `updateCustomerStates` — transitions fire on exact triggers; no drift
- `updateTechDebt` — threshold consequences idempotent (crossing same threshold twice doesn't double-apply)
- `selectEventsForIteration` — given same seed, same events fire in same order

---

## 13. Minimal engine interface (what UI calls)

```typescript
// The only functions the UI needs:
interface Engine {
  createGame(scenarioId: string, userId: string): Promise<GameState>;
  commitIteration(gameId: string, plan: IterationPlan): Promise<IterationOutcome>;
  respondToEvent(gameId: string, eventId: string, optionId: string): Promise<GameState>;
  completeGame(gameId: string): Promise<Retrospective>;
  getCapacityRange(gameId: string): Promise<{ lower: number; expected: number; upper: number }>;
}
```

---

## 14. MVP scope (what to build first)

For the interview-prep MVP:

- ✅ `calculateCapacityRange` (Section 2)
- ✅ `resolveIteration` (Section 4)
- ✅ `updateCustomerStates` (Section 5)
- ✅ `selectEventsForIteration` (Section 6, rules-based only — no AI events)
- ✅ `updateTechDebt` (Section 7)
- ✅ `generateRetrospective` (Section 9, Claude Opus)
- ✅ `calculateScore` (Section 10)
- ⏭️ Sprint Goal grading (Section 8) — defer to v1.1
- ⏭️ Pattern classification (Section 11) — log tags only; surface in retro only, not live nudges

---

## References

- Prior art: Zuzi Šochová's Business Value Game
- Event weighting inspired by Slay the Spire's card deck mechanics
- Customer state machine inspired by RFM analysis + LTV modeling
- Retrospective prompt structure inspired by AI coaching patterns in Replika / Reflect

---

**Build order suggestion:**
1. Types + empty state
2. `createGame` with Scenario 02 loaded
3. `calculateCapacityRange` (pure function, easy to test)
4. `resolveIteration` (the meat)
5. `updateCustomerStates`
6. `selectEventsForIteration` with 5 rules-based events
7. Wire to React UI: planning board → commit → review screen
8. Add Claude API call for retrospective
9. Scenario 02 playable end-to-end

Target: 3 days of focused Claude Code work.
