import type { IndustryId } from '@/curriculum/industries';
import {
  type Flavoured,
  type IndustryContext,
  resolveFlavoured,
  resolveFlavouredList,
} from '@/curriculum/lessons/types';

/**
 * ROLEPLAY MODALITY: the "influence without authority" loop.
 *
 * Where an artifact grades a written deliverable and a drill checks one move, a
 * roleplay puts the learner in a live conversation with an AI character who
 * pushes back. The learner has a position to hold and a relationship to keep,
 * and the only lever they have is persuasion: data, framing, empathy, a real
 * tradeoff. This is the muscle senior PMs live on and the hardest to practise
 * without a person on the other side, so an in-character model is the point.
 *
 * AUTHORING MODEL (mirrors artifacts/lessons)
 * -------------------------------------------
 * Content is plain data (no JSX), one file per scenario under
 * `src/curriculum/roleplay/` and barrel-exported by `skillId`. Industry flavour
 * reuses the lessons' `Flavoured<T>` + ctx pattern: the situation framing, the
 * character's role, and the opening line can read in the learner's world without
 * hand-writing five copies. The SCORING RUBRIC is deliberately industry-NEUTRAL:
 * the bar for "stated a clear position" or "handled the objection" does not move
 * because the product is a marketplace, and keeping it identical keeps scores
 * comparable across industries (same rule the artifact rubric follows).
 *
 * GRADING + REPLY CONTRACT
 * ------------------------
 * Two server actions back this modality (see `src/app/api/roleplay/route.ts`):
 *  - `reply`: given the persona + the conversation so far, the character replies
 *    in character, still pushing where a real counterpart would.
 *  - `score`: grades the whole conversation against `rubric`, returning a
 *    per-criterion band + an overall pass/keep-going verdict. The same
 *    descriptors the learner reads up front are the descriptors the model scores
 *    against (rubric-aligned prompting), so the bar is honest and visible.
 * There is no client-side answer key; both the character and the verdict are the
 * model's, and the whole thing degrades to a calm "needs an API key" state with
 * the conversation preserved when no key is set.
 */

/* ------------------------------------------------------------------
   CONVERSATION CONTRACT + SERVER-ENFORCED CAPS.

   These constants are the SHARED source of truth for the conversation shape and
   its caps. The server route imports them to enforce the turn cap (so the
   `reply` action cannot be looped without bound) and to clamp message length;
   the client imports them to gate the UI to the same limits. Keeping one
   definition means the UI and the cost guardrail can never drift apart.
   ------------------------------------------------------------------ */

/** Who authored a turn. `character` is the AI persona; `learner` is the user. */
export type RoleplayRole = 'character' | 'learner';

/** One turn in the transcript. Kept tiny so it crosses the wire cheaply. */
export interface RoleplayMessage {
  role: RoleplayRole;
  text: string;
}

/**
 * Hard cap on learner turns per session, enforced SERVER-SIDE in the `reply`
 * action. After this many learner messages the route refuses to generate more
 * character replies and the client forces the wrap-up. This is the cost guardrail
 * that stops a public, unauthenticated endpoint from being looped into unbounded
 * model spend, sitting alongside the shared per-client rate limiter.
 */
export const MAX_LEARNER_TURNS = 6;

/**
 * Minimum learner turns before "Wrap up and get scored" enables. A couple of
 * real exchanges are needed before there is anything worth scoring; below this
 * the wrap-up stays disabled (it is force-enabled once the turn cap is hit).
 */
export const MIN_LEARNER_TURNS_TO_SCORE = 2;

/** Per-message length clamp (server + client). Bounds input cost per call. */
export const MAX_MESSAGE_CHARS = 1200;

/**
 * Count the learner's turns in a transcript. Pure and tiny so the server can
 * enforce the cap and a test can pin it without standing up the route.
 */
export function countLearnerTurns(messages: readonly RoleplayMessage[]): number {
  return messages.reduce((n, m) => (m.role === 'learner' ? n + 1 : n), 0);
}

/**
 * The server's decision for a `reply` request: is the learner allowed another
 * character response, or have they hit the cap and must wrap up? Extracted as a
 * pure function so the turn-cap guardrail is unit-testable directly (the route
 * just calls this and returns 409 when `allowed` is false).
 */
export function canReply(messages: readonly RoleplayMessage[]): {
  allowed: boolean;
  learnerTurns: number;
  cap: number;
} {
  const learnerTurns = countLearnerTurns(messages);
  return { allowed: learnerTurns <= MAX_LEARNER_TURNS, learnerTurns, cap: MAX_LEARNER_TURNS };
}

/* ------------------------------------------------------------------
   SCORING RUBRIC (industry-neutral).
   ------------------------------------------------------------------ */

/**
 * One rubric criterion the model scores the WHOLE conversation against.
 * `descriptor` is the load-bearing field: it is both shown to the learner ("here
 * is the bar") and handed to the grader ("score against this"). Write it as what
 * a STRONG performance on this criterion looks like, concretely.
 */
export interface RoleplayCriterion {
  /** Stable id, unique within the scenario; echoed back in the verdict. */
  id: string;
  /** Short label, e.g. "Clarity of position". */
  label: string;
  /** What strong looks like on this criterion (the bar). */
  descriptor: string;
}

/* ------------------------------------------------------------------
   THE SCENARIO.
   ------------------------------------------------------------------ */

export interface RoleplayScenario {
  /** Must match the curriculum skill id this roleplay practises. */
  skillId: string;
  /** Short scenario name, e.g. "Defend your roadmap". */
  title: string;
  /** One-line "why this matters" hook shown under the title. */
  hook: string;
  /** Optional framework attribution, e.g. "Influence without authority". */
  framework?: string;
  /** Short tag for the chip row, e.g. "SaaS · influence". Flavoured. */
  scenarioTag: Flavoured<string>;

  /** Who the learner is talking to: a short role title, e.g. "VP of Product". */
  characterName: Flavoured<string>;
  /** A one-line description of the character's stance/temperament for the UI. */
  characterStance: Flavoured<string>;

  /** The situation, authored as paragraphs. Each line may be industry-flavoured. */
  situation: Flavoured<string>[];
  /** The learner's goal in this conversation, in one or two crisp lines. */
  goal: Flavoured<string>[];

  /** The character's opening line that starts the thread. Flavoured. */
  opening: Flavoured<string>;

  /**
   * The persona contract handed to the `reply` action: who the character is, what
   * they want, how they argue, and how they can be won over. Industry-neutral on
   * purpose (the surface framing is flavoured separately) so the persona stays
   * one authored string. Written as instructions to the model, not shown raw to
   * the learner.
   */
  persona: string;

  /** The scoring rubric: 3-5 criteria, shown to the learner AND used to grade. */
  rubric: RoleplayCriterion[];
}

/* ------------------------------------------------------------------
   RESOLUTION.

   Resolve the authored (possibly flavoured) content against the learner's
   industry once, in the component, so the rest of the UI and the request payload
   deal in plain strings. The persona + rubric are industry-neutral by design.
   ------------------------------------------------------------------ */

/** A scenario with every flavoured field resolved to a concrete string. */
export interface ResolvedRoleplay {
  skillId: string;
  title: string;
  hook: string;
  framework?: string;
  scenarioTag: string;
  characterName: string;
  characterStance: string;
  situation: string[];
  goal: string[];
  opening: string;
  persona: string;
  rubric: RoleplayCriterion[];
}

/** Resolve one scenario's flavoured content against an industry context. */
export function resolveRoleplay(
  scenario: RoleplayScenario,
  ctx: IndustryContext,
): ResolvedRoleplay {
  return {
    skillId: scenario.skillId,
    title: scenario.title,
    hook: scenario.hook,
    framework: scenario.framework,
    scenarioTag: resolveFlavoured(scenario.scenarioTag, ctx),
    characterName: resolveFlavoured(scenario.characterName, ctx),
    characterStance: resolveFlavoured(scenario.characterStance, ctx),
    situation: resolveFlavouredList(scenario.situation, ctx),
    goal: resolveFlavouredList(scenario.goal, ctx),
    opening: resolveFlavoured(scenario.opening, ctx),
    // Persona + rubric are industry-neutral by design.
    persona: scenario.persona,
    rubric: scenario.rubric,
  };
}

/** Re-export the industry id for authors importing from this module. */
export type { IndustryId };
