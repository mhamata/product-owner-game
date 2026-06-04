import type { ReactNode } from 'react';
import type { Flavoured, IndustryContext } from '@/curriculum/lessons/types';
import { resolveFlavoured } from '@/curriculum/lessons/types';

/**
 * JUDGMENT SCENARIO: the unit of the spaced-repetition "judgment deck".
 *
 * A scenario is a small, realistic PM decision: a 2-4 sentence situation, three
 * or four plausible options, the best-judgment choice, and a short "why" that
 * names the underlying principle. These are NOT trivia and NOT gotchas: every
 * option is something a real PM might reasonably reach for, and the rationale
 * teaches a transferable judgment heuristic, not a memorised fact.
 *
 * The deck exists so judgment is *rehearsed over time*, not crammed once. The
 * scheduler (see `@/store/reviewStore`) decides which scenarios are due on a
 * given day; this file owns only the content and its shape.
 *
 * INDUSTRY FLAVOUR
 * ----------------
 * The surface of a scenario (the situation prose and the option labels) can be
 * authored as a function of the learner's home industry, reusing the same
 * `Flavoured<T>` / `IndustryContext` machinery the concept lessons use, so the
 * call lands in the world the learner works in. The CORRECT answer and its
 * rationale are deliberately industry-neutral: good judgment does not change
 * because the product changed. Authors flavour only the dressing.
 */

/**
 * The judgment competency a scenario exercises. This is a small, self-contained
 * vocabulary for the deck's filter/label, intentionally NOT the curriculum's
 * full competency spine: the deck groups by the *kind of decision* being made
 * (a prioritization tradeoff, a metrics read, an ethics call), which is the lens
 * a learner reviews under. Keeping it local also means the deck never couples to
 * curriculum internals that evolve independently.
 */
export type JudgmentCompetency =
  | 'prioritization'
  | 'scope-quality'
  | 'discovery-delivery'
  | 'stakeholder-influence'
  | 'metrics'
  | 'build-buy'
  | 'ethics'
  | 'ship-polish';

/** Display label for each judgment competency. */
export const JUDGMENT_COMPETENCY_LABEL: Record<JudgmentCompetency, string> = {
  prioritization: 'Prioritization tradeoffs',
  'scope-quality': 'Scope vs quality',
  'discovery-delivery': 'Discovery vs delivery',
  'stakeholder-influence': 'Stakeholder influence',
  metrics: 'Metrics interpretation',
  'build-buy': 'Build vs buy',
  ethics: 'Ethics',
  'ship-polish': 'Ship vs polish',
};

/** A single option a learner can pick. `id` is stable within its scenario. */
export interface JudgmentOption {
  /** Stable id within the scenario (a, b, c, d). */
  id: string;
  /** The choice, as the learner reads it. May be industry-flavoured. */
  label: Flavoured<string>;
}

/**
 * One judgment scenario. Authored as data, collected in `scenarios.ts`, and
 * keyed by `id` so the scheduler can track it across sessions by a stable id.
 */
export interface JudgmentScenario {
  /** Stable id, e.g. "prioritization-loud-customer". Never reuse or renumber. */
  id: string;
  /** Which kind of decision this rehearses (drives the label + filter). */
  competency: JudgmentCompetency;
  /** A short, scannable title for lists and the review header. */
  title: string;
  /** The 2-4 sentence situation. May be industry-flavoured at the surface. */
  situation: Flavoured<string>;
  /** Three or four plausible options. */
  options: JudgmentOption[];
  /** The id of the best-judgment option. Exactly one. */
  bestOptionId: string;
  /**
   * Why the best option is the best call: names the principle and stays
   * industry-neutral. Always shown after the learner picks, so the card teaches
   * whether or not they got it right.
   */
  why: Flavoured<string>;
  /**
   * Optional one-line "what the principle is called", surfaced as a small credit
   * (e.g. "Vanity vs actionable metrics"). Kept separate from `why` so the card
   * can label the heuristic without burying it in prose.
   */
  principle?: string;
}

/**
 * A scenario with every flavoured field resolved to a concrete value for the
 * active industry, so the component renders plain data.
 */
export interface ResolvedScenario {
  id: string;
  competency: JudgmentCompetency;
  title: string;
  situation: ReactNode;
  options: { id: string; label: ReactNode }[];
  bestOptionId: string;
  why: ReactNode;
  principle?: string;
}

/** Resolve one scenario against the live industry context. */
export function resolveScenario(
  s: JudgmentScenario,
  ctx: IndustryContext,
): ResolvedScenario {
  return {
    id: s.id,
    competency: s.competency,
    title: s.title,
    situation: resolveFlavoured(s.situation, ctx),
    options: s.options.map((o) => ({
      id: o.id,
      label: resolveFlavoured(o.label, ctx),
    })),
    bestOptionId: s.bestOptionId,
    why: resolveFlavoured(s.why, ctx),
    principle: s.principle,
  };
}
