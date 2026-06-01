// UI-side pure helpers that turn an engine IterationOutcome (already computed by
// the engine) into plain-language "BECAUSE …" reason strings, and that re-derive
// the capacity range's labeled breakdown for the Plan step.
//
// IMPORTANT: this file NEVER changes game state and NEVER reimplements scoring.
// It mirrors the *rule conditions* the engine already applied so the UI can
// EXPLAIN them — every branch here corresponds 1:1 to a branch in
//   - engine/execution.ts   (morale commit-ratio, revenue from released products)
//   - engine/customers.ts    (happiness: served / partial / nothing / skeptic)
//   - engine/techDebt.ts     (+5 customer-work-no-DoD, +10 no-tech-in-3-iters, pay-downs)
//   - engine/capacity.ts     (baseline penalties + variance + investment bonuses)
// If an engine rule changes, the matching branch here must be updated to match.

import type {
  CustomerState,
  EventEffect,
  EventOptionData,
  GameState,
  IterationOutcome,
  PBI,
  Scenario,
} from '@/engine/types';
import { calculateCapacityRange } from '@/engine/capacity';

/* ============================================================
   CAPACITY "WHY" — re-derive the labeled contributions that
   calculateCapacityRange folds into a single number, so the
   Plan step can show "Base 15 · −2 onboarding · −1 tech debt".
   The math mirrors engine/capacity.ts exactly; we surface the
   engine's CapacityRange as the source of truth for the totals.
   ============================================================ */

export interface CapacityContribution {
  /** Signed point contribution (base is positive; penalties negative). */
  delta: number;
  /** Plain-language reason, e.g. "onboarding a new hire". */
  label: string;
  /** 'base' anchors the bar; 'bonus'/'penalty' colour the chip. */
  kind: 'base' | 'penalty' | 'bonus';
}

export interface CapacityBreakdown {
  /** The engine-authoritative range (we never recompute the result ourselves). */
  lower: number;
  expected: number;
  upper: number;
  /** Labeled baseline contributions (sum ≈ expected, before clamping). */
  contributions: CapacityContribution[];
  /** Human notes about *variance* (uncertainty), which widens the range. */
  varianceNotes: string[];
}

/**
 * Build the labeled capacity breakdown for the Plan step. The numeric range is
 * read straight from the engine (`calculateCapacityRange`) — the source of
 * truth — while the individual chips re-trace the same conditions so a learner
 * can see *why* the likely line sits where it does.
 */
export function capacityBreakdown(state: GameState): CapacityBreakdown {
  const { team, tech } = state;
  const range = calculateCapacityRange(state);

  const contributions: CapacityContribution[] = [
    { delta: tech.capacityBaseline, label: 'baseline team velocity', kind: 'base' },
  ];

  // Baseline penalties — mirrors engine/capacity.ts.
  if (team.sickOrVacation > 0) {
    contributions.push({
      delta: -(team.sickOrVacation * 1.5),
      label:
        team.sickOrVacation === 1
          ? 'someone out sick / on leave'
          : `${team.sickOrVacation} people out sick / on leave`,
      kind: 'penalty',
    });
  }
  if (team.onboarding > 0) {
    contributions.push({
      delta: -(team.onboarding * 1.0),
      label:
        team.onboarding === 1
          ? 'onboarding a new hire'
          : `onboarding ${team.onboarding} new hires`,
      kind: 'penalty',
    });
  }
  if (team.morale < 4) {
    contributions.push({ delta: -2, label: 'low team morale', kind: 'penalty' });
  }
  if (team.morale < 2) {
    contributions.push({ delta: -3, label: 'morale near rock-bottom', kind: 'penalty' });
  }
  if (team.burnoutFlag) {
    contributions.push({ delta: -3, label: 'the team is burning out', kind: 'penalty' });
  }
  if (tech.techDebt >= 30) {
    contributions.push({
      delta: -1,
      label: `tech debt (${Math.round(tech.techDebt)})`,
      kind: 'penalty',
    });
  }
  if (tech.techDebt >= 50) {
    contributions.push({ delta: -2, label: 'heavy tech debt', kind: 'penalty' });
  }
  if (tech.techDebt >= 70) {
    contributions.push({ delta: -3, label: 'crippling tech debt', kind: 'penalty' });
  }

  // Baseline bonuses from completed investments — mirrors engine/capacity.ts.
  if (tech.investmentsDone.includes('dev-team-training-bundle')) {
    contributions.push({ delta: 1, label: 'team training paid off', kind: 'bonus' });
  }
  if (tech.investmentsDone.includes('framework-upgrade-bundle')) {
    contributions.push({ delta: 2, label: 'framework upgrade paid off', kind: 'bonus' });
  }

  // Variance notes — these widen the range rather than move the likely line.
  const varianceNotes: string[] = [];
  if (team.burnoutFlag) varianceNotes.push('burnout makes the sprint less predictable');
  if (tech.techDebt >= 40) varianceNotes.push('tech debt adds delivery risk');
  if (tech.investmentsDone.includes('automated-tests')) {
    varianceNotes.push('automated tests make delivery steadier');
  }
  if (tech.investmentsDone.includes('observability')) {
    varianceNotes.push('observability makes delivery steadier');
  }

  return {
    lower: range.lower,
    expected: range.expected,
    upper: range.upper,
    contributions,
    varianceNotes,
  };
}

/* ============================================================
   OUTCOME "BECAUSE" — one explained beat per change the engine
   recorded in IterationOutcome.
   ============================================================ */

export type BeatTone = 'good' | 'bad' | 'neutral';

export interface OutcomeBeat {
  /** Stable key for React lists + animation ordering. */
  id: string;
  /** Emoji glyph shown in the beat icon (paired with text — never colour-alone). */
  glyph: string;
  tone: BeatTone;
  /** The effect headline, e.g. "Team morale dips". */
  effect: string;
  /** Signed numeric chip, e.g. "+5 happiness" / "−6 morale" / null for none. */
  delta: string | null;
  /** The plain-language cause, rendered after a "BECAUSE" lead. */
  because: string;
}

const fmtSigned = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/**
 * Did this iteration ship any customer-facing work? (engine/techDebt.ts gate)
 */
function shippedCustomerWork(done: PBI[]): boolean {
  return done.some((i) => i.kind === 'customer');
}

/**
 * Build the ordered list of explained beats from the resolved outcome.
 *
 * @param outcome   the engine's IterationOutcome (already computed)
 * @param preState  the GameState *before* execute-iteration ran — needed for the
 *                  commit ratio and the pre-change customer happiness baseline
 * @param postCustomers the customers map *after* resolution (for archetype/name)
 */
export function deriveOutcomeBeats(
  outcome: IterationOutcome,
  preState: GameState,
  postCustomers: Record<string, CustomerState>,
): OutcomeBeat[] {
  const beats: OutcomeBeat[] = [];

  // ---- Per-customer happiness (engine/customers.ts) ----
  // served by a released product → +happiness & promote
  // got a story but no release, 3rd consecutive partial → −1
  // nothing at all → −1 (and churn at 0)
  const servedByRelease = new Set<string>();
  for (const productId of outcome.releasedProducts) {
    for (const pbi of outcome.done) {
      if (pbi.productId === productId) {
        for (const cid of pbi.satisfies) servedByRelease.add(cid);
      }
    }
  }
  const servedByIteration = new Set<string>();
  for (const pbi of outcome.done) {
    for (const cid of pbi.satisfies) servedByIteration.add(cid);
  }

  for (const [cid, delta] of Object.entries(outcome.happinessDeltas)) {
    if (delta === 0) continue;
    const c = postCustomers[cid] ?? preState.customers[cid];
    const name = shortName(c?.name ?? cid);
    const churned = c?.engagementState === 'churned';

    let because: string;
    let tone: BeatTone;
    let glyph: string;

    if (delta > 0 && servedByRelease.has(cid)) {
      tone = 'good';
      glyph = '🚀';
      because = `you shipped work ${name} needed — and released it, so the value actually reached them.`;
    } else if (delta < 0 && churned) {
      tone = 'bad';
      glyph = '💔';
      because = `${name} went too long with nothing for them and churned — their happiness hit zero.`;
    } else if (delta < 0 && servedByIteration.has(cid)) {
      tone = 'bad';
      glyph = '😕';
      because = `${name} keeps getting partial progress but nothing released — patience finally ran out.`;
    } else if (delta < 0) {
      tone = 'bad';
      glyph = '😕';
      because = `nothing this sprint addressed ${name}'s needs, so they slipped.`;
    } else {
      tone = 'good';
      glyph = '🙂';
      because = `${name} saw progress on what they care about.`;
    }

    beats.push({
      id: `cust-${cid}`,
      glyph,
      tone,
      effect: `${name} ${delta > 0 ? 'warms up' : 'cools off'}`,
      delta: `${fmtSigned(delta)} happiness`,
      because,
    });
  }

  // ---- Team morale (engine/execution.ts commit-ratio rule) ----
  if (outcome.moraleDelta !== 0) {
    const committedCount = preState.iterationBacklog.length;
    const ratio = committedCount ? outcome.done.length / committedCount : 1;
    const tone: BeatTone = outcome.moraleDelta > 0 ? 'good' : 'bad';
    let because: string;
    if (outcome.moraleDelta > 0) {
      because = `the team finished almost everything they committed (${outcome.done.length}/${committedCount}) — delivering builds momentum.`;
    } else {
      because = `the team only cleared ${outcome.done.length} of ${committedCount} committed items (${Math.round(
        ratio * 100,
      )}%) — over-committing wears morale down.`;
    }
    beats.push({
      id: 'morale',
      glyph: outcome.moraleDelta > 0 ? '💪' : '😓',
      tone,
      effect: `Team morale ${outcome.moraleDelta > 0 ? 'lifts' : 'dips'}`,
      delta: `${fmtSigned(outcome.moraleDelta)} morale`,
      because,
    });
  }

  // ---- Tech debt (engine/techDebt.ts) ----
  if (outcome.techDebtDelta !== 0) {
    const shippedCust = shippedCustomerWork(outcome.done);
    const hadDoD = outcome.done.some((i) => i.requires.includes('dod-check'));
    const hadTech = outcome.done.some((i) => i.kind === 'tech');

    let because: string;
    if (outcome.techDebtDelta > 0) {
      const reasons: string[] = [];
      if (shippedCust && !hadDoD) {
        reasons.push('you shipped customer features with no quality/DoD step');
      }
      if (!hadTech) {
        reasons.push("it's been a while since any engineering health work shipped");
      }
      because =
        reasons.length > 0
          ? `${reasons.join(' and ')} — the debt you skip compounds quietly.`
          : 'shortcuts this sprint added to the debt you carry forward.';
    } else {
      because = 'you invested in engineering health, paying down accumulated debt.';
    }

    beats.push({
      id: 'techdebt',
      glyph: outcome.techDebtDelta > 0 ? '🧱' : '🧹',
      tone: outcome.techDebtDelta > 0 ? 'bad' : 'good',
      effect: `Tech debt ${outcome.techDebtDelta > 0 ? 'grows' : 'shrinks'}`,
      delta: `${fmtSigned(outcome.techDebtDelta)} debt`,
      because,
    });
  }

  // ---- Releases / revenue (engine/execution.ts) ----
  if (outcome.releasedProducts.length > 0) {
    beats.push({
      id: 'release',
      glyph: '🎉',
      tone: 'good',
      effect:
        outcome.releasedProducts.length === 1
          ? 'A product shipped to customers'
          : `${outcome.releasedProducts.length} products shipped to customers`,
      delta: outcome.revenueEarned > 0 ? `+$${outcome.revenueEarned.toLocaleString()}` : null,
      because:
        'a Release was in the sprint and every piece of those products was finished — so the value finally reached paying customers.',
    });
  } else if (outcome.done.some((i) => i.kind === 'customer')) {
    // Built customer work but did NOT release it — the #1 lesson.
    beats.push({
      id: 'no-release',
      glyph: '🏦',
      tone: 'neutral',
      effect: 'Finished work is banked — not yet earning',
      delta: '+$0',
      because:
        'you built customer features but did not Ship a Release, so none of it converted to revenue this sprint.',
    });
  }

  return beats;
}

/* ============================================================
   EVENT "BECAUSE" — narrate the metric movements the player's
   CHOSEN option applies. Mirrors engine/events.ts applyEventEffects
   1:1 (one beat per EventEffect kind), so every event-driven move —
   crucially Stakeholder Trust, which ONLY moves via events — gets a
   plain-language "because you chose <option>" the player can see.
   The cause text is the option's own label/effect data; we never
   invent consequences the engine didn't apply.
   ============================================================ */

/**
 * Display name for a stakeholder's trust beat. Stakeholder names carry a
 * parenthetical role, e.g. "Wei (VP of Growth)". The role is the more
 * recognisable hook for a trust line ("VP of Growth trust −3"), so we prefer
 * it and fall back to the given name when no role is present.
 */
function stakeholderLabel(scenario: Scenario, stakeholderId: string): string {
  const s = scenario.stakeholders.find((x) => x.id === stakeholderId);
  if (!s) return 'A stakeholder';
  const match = s.name.match(/\(([^)]+)\)/);
  if (match) {
    // The parenthetical may carry extra context after a comma; keep the role.
    return match[1].split(',')[0].trim();
  }
  return shortName(s.name);
}

function customerLabel(scenario: Scenario, customerId: string): string {
  const c = scenario.customers.find((x) => x.id === customerId);
  return c ? shortName(c.name) : 'A customer';
}

/**
 * Turn the CHOSEN option's effects into explained beats. One beat per effect
 * kind that moves a tracked metric (morale, trust, happiness, revenue,
 * capacity, headcount, tech debt). `add-pattern` / `add-pbi` are structural,
 * not scoreboard movements, so they get a light informational beat rather than
 * a signed gauge delta.
 *
 * @param option   the option the player picked (its `effects` are what the
 *                 engine applied verbatim via applyEventEffects)
 * @param scenario the scenario, for stakeholder/customer display names
 */
export function deriveEventBeats(
  option: EventOptionData,
  scenario: Scenario,
): OutcomeBeat[] {
  // A short, lower-cased echo of the choice, used to close each "because"
  // clause ("…because you chose to ship the AI assistant.").
  const choice = decapitalize(option.label.replace(/[.\s]+$/, ''));
  const beats: OutcomeBeat[] = [];

  option.effects.forEach((eff, i) => {
    const beat = eventBeat(eff, i, choice, scenario);
    if (beat) beats.push(beat);
  });
  return beats;
}

function eventBeat(
  eff: EventEffect,
  index: number,
  choice: string,
  scenario: Scenario,
): OutcomeBeat | null {
  const key = `evt-${index}-${eff.kind}`;
  switch (eff.kind) {
    case 'morale': {
      const up = eff.delta >= 0;
      return {
        id: key,
        glyph: up ? '💪' : '😓',
        tone: up ? 'good' : 'bad',
        effect: `Team morale ${up ? 'lifts' : 'dips'}`,
        delta: `${fmtSigned(eff.delta)} morale`,
        because: `you chose to ${choice} — and that ${
          up ? 'energised' : 'wore on'
        } the team.`,
      };
    }
    case 'trust': {
      const up = eff.delta >= 0;
      const who = stakeholderLabel(scenario, eff.stakeholderId);
      return {
        id: key,
        glyph: up ? '🤝' : '📉',
        tone: up ? 'good' : 'bad',
        effect: `${who} trust ${up ? 'rises' : 'falls'}`,
        delta: `${fmtSigned(eff.delta)} trust`,
        because: `you chose to ${choice} — ${who} ${
          up ? 'felt heard' : 'was not happy with that call'
        }.`,
      };
    }
    case 'happiness': {
      const up = eff.delta >= 0;
      const who = customerLabel(scenario, eff.customerId);
      return {
        id: key,
        glyph: up ? '🙂' : '😕',
        tone: up ? 'good' : 'bad',
        effect: `${who} ${up ? 'warms up' : 'cools off'}`,
        delta: `${fmtSigned(eff.delta)} happiness`,
        because: `you chose to ${choice} — ${who} ${
          up ? 'liked the outcome' : 'was let down by it'
        }.`,
      };
    }
    case 'revenue': {
      const up = eff.delta >= 0;
      return {
        id: key,
        glyph: up ? '💰' : '💸',
        tone: up ? 'good' : 'bad',
        effect: `Revenue ${up ? 'comes in' : 'takes a hit'}`,
        delta: `${up ? '+' : '−'}$${Math.abs(eff.delta).toLocaleString()}`,
        because: `you chose to ${choice}.`,
      };
    }
    case 'capacity-baseline': {
      const up = eff.delta >= 0;
      return {
        id: key,
        glyph: up ? '⚡' : '🐌',
        tone: up ? 'good' : 'bad',
        effect: `Team capacity ${up ? 'grows' : 'shrinks'}`,
        delta: `${fmtSigned(eff.delta)} pts/sprint`,
        because: `you chose to ${choice} — it changes how much the team can take on each sprint.`,
      };
    }
    case 'headcount': {
      const up = eff.delta >= 0;
      return {
        id: key,
        glyph: up ? '🧑‍💻' : '👋',
        tone: up ? 'good' : 'bad',
        effect: up ? 'The team grows' : 'The team shrinks',
        delta: `${fmtSigned(eff.delta)} headcount`,
        because: up
          ? `you chose to ${choice} — a new hire joins (and needs onboarding before they're at full speed).`
          : `you chose to ${choice} — someone leaves the team.`,
      };
    }
    case 'tech-debt': {
      // Tech debt going UP is bad; going down is good.
      const grew = eff.delta > 0;
      return {
        id: key,
        glyph: grew ? '🧱' : '🧹',
        tone: grew ? 'bad' : 'good',
        effect: `Tech debt ${grew ? 'grows' : 'shrinks'}`,
        delta: `${fmtSigned(eff.delta)} debt`,
        because: `you chose to ${choice} — ${
          grew ? 'the shortcut adds to the debt you carry forward' : 'paying it down buys steadier sprints'
        }.`,
      };
    }
    case 'add-pbi':
      return {
        id: key,
        glyph: '📥',
        tone: 'neutral',
        effect: 'A new backlog item arrives',
        delta: null,
        because: `you chose to ${choice} — “${eff.pbi.title}” is now in your product backlog to plan.`,
      };
    case 'add-pattern':
      // Structural tag, not a scoreboard movement — no beat in the player view.
      return null;
  }
}

function decapitalize(s: string): string {
  return s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s;
}

/* ============================================================
   PLAN-STEP TELEGRAPHED IMPACTS — read straight off the PBI.
   No invention: derived from kind, value, and `satisfies`.
   ============================================================ */

export interface TelegraphedImpact {
  tone: 'good' | 'bad' | 'accent' | 'neutral';
  /** Short label, e.g. "Maya happiness" or "pays down tech debt". */
  label: string;
}

/**
 * Telegraph what an item is likely to do, using only facts already on the PBI
 * and the scenario's customer names. This is a *hint*, not a simulation.
 */
export function telegraphImpacts(
  item: PBI,
  customers: Record<string, CustomerState>,
): TelegraphedImpact[] {
  if (item.kind === 'release-card') {
    return [{ tone: 'accent', label: 'turns finished work into revenue' }];
  }
  if (item.kind === 'tech') {
    return [
      { tone: 'good', label: 'pays down tech debt' },
      { tone: 'good', label: 'steadier delivery' },
    ];
  }

  const impacts: TelegraphedImpact[] = [];
  const names = item.satisfies
    .map((cid) => shortName(customers[cid]?.name ?? cid))
    .filter(Boolean);
  if (names.length > 0) {
    impacts.push({
      tone: 'good',
      label: `${names.join(' & ')} ${names.length > 1 ? 'happier' : 'happier'}`,
    });
  }
  if (item.value >= 800) {
    impacts.push({ tone: 'accent', label: 'big revenue bet' });
  } else if (item.value > 0) {
    impacts.push({ tone: 'good', label: 'revenue when released' });
  }
  if (item.kind === 'regulatory') {
    impacts.push({ tone: 'bad', label: 'compliance / exec pressure' });
  }
  if (item.effortUncertain) {
    impacts.push({ tone: 'neutral', label: 'uncertain size' });
  }
  return impacts;
}

/* ============================================================
   shared helpers
   ============================================================ */

/**
 * Customer/stakeholder names in the scenario carry a parenthetical role, e.g.
 * "Maya (Ops Admin, mid-market trial)". For tight UI we show just the given
 * name; the full label remains available for tooltips/aria where needed.
 */
export function shortName(full: string): string {
  return full.split('(')[0].trim();
}
