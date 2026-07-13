// Pure derivation helpers for the Season tab (Sim 2.0 W3-F,
// praxis-sim2-mockup.html's `#scr-season`, design-sim-2.0.md §2.3). Mirrors
// productMap.ts's convention: every function here reads GameState/Scenario/
// the W2-C board module's own selectors (never recomputed — board.ts owns
// confidence/expectations/verdict/offers math) and computes a DISPLAY value.
// Nothing here invents a number or a mechanic the engine doesn't already
// have: the mockup's "1 weekly 1:1 slot" roster affordance, for instance,
// has no backing Action in engine/types.ts, so it is deliberately not built
// here — that's a future slice's engine work, not a UI stub for one.

import type { GameState, Phase, Scenario } from '@/engine/types';
import { deriveSeasonSummary, type JobOfferLevel, type SeasonVerdict } from '@/engine/board';
import type { DecisionLogEntry } from '@/store/decisionLogStore';

/* ============================================================
   Sprint timeline
   ============================================================ */

export type TimelineSprintStatus = 'past' | 'now' | 'future';

export interface TimelineSprint {
  sprint: number;
  status: TimelineSprintStatus;
  /** The season's final sprint — the Quarterly Business Review. */
  isQBR: boolean;
  /** True on the one sprint `board.firedAtSprint` names, if any. */
  isFiredAt: boolean;
}

/**
 * PURE: one entry per sprint 1..totalIterations. `advance-iteration`
 * (engine/step.ts) never advances `iterationNumber` past the sprint a
 * 'complete'/'fired' run actually ended on, so a terminal phase reads every
 * sprint up to (and including) that one as 'past' — there is no more "now."
 * A non-terminal phase (planning/committed/executing/review) reads the
 * current `iterationNumber` as 'now', exactly like the mockup's `.tl.now`.
 */
export function deriveSprintTimeline(state: GameState): TimelineSprint[] {
  const total = state.totalIterations;
  const current = state.iterationNumber;
  const terminal = state.phase === 'complete' || state.phase === 'fired';
  const firedAtSprint = state.board?.firedAtSprint ?? null;

  const sprints: TimelineSprint[] = [];
  for (let sprint = 1; sprint <= total; sprint += 1) {
    const status: TimelineSprintStatus = terminal
      ? sprint <= current
        ? 'past'
        : 'future'
      : sprint < current
        ? 'past'
        : sprint === current
          ? 'now'
          : 'future';
    sprints.push({
      sprint,
      status,
      isQBR: sprint === total,
      isFiredAt: firedAtSprint !== null && sprint === firedAtSprint,
    });
  }
  return sprints;
}

/* ============================================================
   Job market: visibility + offer-card display meta
   ============================================================ */

export type JobMarketVisibility = 'locked' | 'open';

/** PURE: the job market opens exactly when the season ends — win or fired. */
export function deriveJobMarketVisibility(phase: Phase): JobMarketVisibility {
  return phase === 'complete' || phase === 'fired' ? 'open' : 'locked';
}

export interface OfferCardMeta {
  levelLabel: string;
  arrow: '▲' | '—' | '▼';
}

const OFFER_LEVEL_META: Record<JobOfferLevel, OfferCardMeta> = {
  down: { levelLabel: 'Smaller scope', arrow: '▼' },
  same: { levelLabel: 'Lateral move', arrow: '—' },
  up: { levelLabel: 'Bigger scope', arrow: '▲' },
};

/** PURE: display label + arrow for one of `deriveJobMarketOffers`'s levels. */
export function offerCardMeta(level: JobOfferLevel): OfferCardMeta {
  return OFFER_LEVEL_META[level];
}

/* ============================================================
   Fired experience: which surface renders, and the beat's own facts
   ============================================================ */

export type FiredSurface = 'beat' | 'tabs';

/**
 * PURE: routing for the fired full-screen beat. Any non-'fired' phase always
 * shows the normal tab shell. Once 'fired', the beat owns the screen until
 * the player dismisses it (SimTabs.tsx's local `firedBeatSeen` state), at
 * which point the tab shell returns — with the Season tab's job market
 * already open, since `deriveJobMarketVisibility('fired')` is 'open'.
 */
export function deriveFiredSurface(phase: Phase, beatSeen: boolean): FiredSurface {
  if (phase !== 'fired') return 'tabs';
  return beatSeen ? 'tabs' : 'beat';
}

export interface FiredBeatFacts {
  sprint: number;
  /** One line of what the record still proves — derived, never invented. */
  proofLine: string;
}

/**
 * PURE: the fired beat's two facts, both read off already-computed values
 * (deriveSeasonSummary, itself a consumer of calculateScore — never
 * recomputed here) plus the one raw state field (`economy.revenue`) the
 * summary doesn't already carry.
 */
export function deriveFiredBeatFacts(state: GameState, scenario: Scenario): FiredBeatFacts {
  const summary = deriveSeasonSummary(state, scenario);
  const sprint = summary.firedAtSprint ?? state.iterationNumber;
  const totalExpectations = summary.expectations.length;
  const revenue = Math.max(0, Math.round(state.economy.revenue));
  const proofLine =
    `${summary.expectationsOnTrack} of ${totalExpectations} board expectation` +
    `${totalExpectations === 1 ? '' : 's'} held, and the record still shows ` +
    `$${revenue.toLocaleString()} in revenue this run actually earned.`;
  return { sprint, proofLine };
}

/* ============================================================
   QBR verdict copy
   ============================================================ */

export interface VerdictCopy {
  heading: string;
  line: string;
}

/** PURE: display copy for each of board.ts's `SeasonVerdict` values. */
export function verdictCopy(verdict: SeasonVerdict): VerdictCopy {
  switch (verdict) {
    case 'exceeded':
      return {
        heading: 'The board is thrilled.',
        line: 'You cleared the bar with room to spare — this record travels well.',
      };
    case 'met':
      return {
        heading: 'The board is satisfied.',
        line: 'You delivered what the season asked for.',
      };
    case 'mixed':
      return {
        heading: 'A mixed season.',
        line: 'Real wins and real gaps — both are visible in the record below.',
      };
    case 'missed':
      return {
        heading: 'A rough season.',
        line: 'The targets slipped, but the record of every call you made is still yours.',
      };
    case 'fired':
      return {
        heading: 'The board let you go.',
        line: 'The record still proves what you can do — see it below.',
      };
  }
}

/* ============================================================
   Career File summary (THIS run only — decisionLogStore-derived)
   ============================================================ */

export interface CareerFileSummaryCounts {
  sprintsLogged: number;
  withRationale: number;
  eventResponses: number;
  interviewStoriesDrafted: number;
}

/**
 * PURE: counts drawn only from `decisionLogStore` (the Career File's own raw
 * material — see that file's header). Deliberately does not attempt "graded
 * artifacts" or "incident record" rows the mockup shows: those read from
 * different stores (`readinessReport.ts`'s localStorage assembly,
 * `state.eventLog`'s narrative strings) that are out of this slice's scope
 * to wire — inventing a number for them here would violate the "invent
 * nothing" rule this file otherwise holds to.
 */
export function careerFileSummary(
  entries: DecisionLogEntry[],
  interviewStoriesDrafted: number,
): CareerFileSummaryCounts {
  return {
    sprintsLogged: entries.length,
    withRationale: entries.filter((e) => !!e.rationale).length,
    eventResponses: entries.reduce((sum, e) => sum + e.eventResponses.length, 0),
    interviewStoriesDrafted,
  };
}
