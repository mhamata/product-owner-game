import type { Competency } from '@/curriculum/types';
import type { CoverageStat } from '@/curriculum/data';

/**
 * DETERMINISTIC daily-block scheduler for the Standup's Act 2 (Workload).
 *
 * Pure by design: every function here takes plain data in and returns plain
 * data out — no store reads, no React, no randomness, no AI call. The
 * mentor's "why this" line is templated straight from the same facts this
 * module computes; the LLM (elsewhere, if ever) narrates, it never picks.
 * That split is a hard design-doc requirement (design-sim-2.0.md §3), and
 * keeping this module pure is what makes it cheaply testable and cheaply
 * auditable — the same reason `reviewStore`'s scheduling math is pure.
 */

/** One competency's raw signals, as read from the learner's stores today. */
export interface CompetencyCandidate {
  competency: Competency;
  /** Lesson/drill mastery coverage for this competency (competencyCoverage()). */
  coverage: CoverageStat;
  /** Best-seen sim-evidence score 0-100, or undefined if the sim has never touched it. */
  simScore?: number;
  /**
   * W4-H, additive: average mastery-decay strength (0..1) across this
   * competency's MASTERED ready skills — see
   * `@/lib/masteryDecay`'s `averageCompetencyDecay`. Defaults to 1 (no
   * discount) when omitted, so every existing caller/test is unaffected.
   * A competency whose mastered skills have gone rusty ranks WEAKER here
   * without ever touching `coverage` itself (mastery/gating stay untouched —
   * decay never re-locks, it only reweights scheduling).
   */
  decayFactor?: number;
}

/** A competency ranked by strength, with the facts that produced the rank. */
export interface RankedCompetency {
  competency: Competency;
  /** Blended 0..1 signal; LOWER = weaker. See {@link competencyStrength}. */
  strength: number;
  coverageFraction: number;
  simScore: number | null;
  /** The decay discount actually applied (1 = none). See `CompetencyCandidate.decayFactor`. */
  decayFactor: number;
}

/**
 * Blend a competency's lesson-mastery coverage (0..1) with its sim-evidence
 * score (0..100) into one 0..1 "strength" reading.
 *
 * With no sim evidence yet, coverage alone IS the strength — the sim signal
 * simply hasn't arrived. Once sim evidence exists, the two signals are
 * weighted equally: studied-and-passed and demonstrated-under-simulation are
 * both real evidence, and neither should drown out the other.
 *
 * `decayFactor` (0..1, default 1) discounts the COVERAGE term only, before
 * blending with sim evidence: a competency whose mastered skills have gone
 * rusty reads as less "covered" than a pure boolean count would say, so it
 * naturally re-surfaces as a weakest-competency pick. Default of 1 means "no
 * rust anywhere" and reproduces the pre-decay behavior exactly.
 */
export function competencyStrength(
  coverage: CoverageStat,
  simScore?: number,
  decayFactor = 1,
): number {
  const discountedCoverage = coverage.fraction * decayFactor;
  if (simScore === undefined) return discountedCoverage;
  const simFraction = Math.max(0, Math.min(1, simScore / 100));
  return (discountedCoverage + simFraction) / 2;
}

/**
 * Rank every LIVE competency (one with at least one `ready` skill today —
 * see `coverage.total`) from weakest to strongest. A competency with zero
 * ready skills has nothing to practise yet and is excluded entirely, never
 * ranked as "weakest" by default.
 *
 * Deterministic tie-break: equal strength sorts by competency id
 * (alphabetical), so identical inputs always produce the identical order —
 * no randomness anywhere in this module.
 */
export function rankCompetencies(
  candidates: readonly CompetencyCandidate[],
): RankedCompetency[] {
  return candidates
    .filter((c) => c.coverage.total > 0)
    .map((c) => {
      const decayFactor = c.decayFactor ?? 1;
      return {
        competency: c.competency,
        strength: competencyStrength(c.coverage, c.simScore, decayFactor),
        coverageFraction: c.coverage.fraction,
        simScore: c.simScore ?? null,
        decayFactor,
      };
    })
    .sort((a, b) => {
      if (a.strength !== b.strength) return a.strength - b.strength;
      return a.competency.localeCompare(b.competency);
    });
}

/**
 * The single weakest live competency, or `null` if nothing is live yet (a
 * no-data fallback: a brand-new curriculum with zero `ready` skills, for
 * instance). Thin convenience wrapper over {@link rankCompetencies}.
 */
export function pickWeakestCompetency(
  candidates: readonly CompetencyCandidate[],
): RankedCompetency | null {
  return rankCompetencies(candidates)[0] ?? null;
}

/** The minimal skill shape the scheduler needs to pick a practice surface. */
export interface PracticeSkillLike {
  id: string;
  title: string;
  competency: Competency;
  status: 'ready' | 'coming-soon';
  /** 1-based curriculum order, used to pick the earliest unmastered skill. */
  index: number;
}

/**
 * The best existing practice surface for a competency: the lowest-index
 * `ready`, not-yet-mastered skill tagged with it. Ordering by curriculum
 * index means the same mastery state always names the same skill — the
 * natural "next rep" for that gap, not a random pick among several.
 *
 * Returns `null` when every ready skill for the competency is already
 * mastered (nothing left to assign for it today).
 */
export function pickPracticeSkill(
  competency: Competency,
  skills: readonly PracticeSkillLike[],
  masteredIds: ReadonlySet<string>,
): PracticeSkillLike | null {
  const candidates = skills
    .filter(
      (s) =>
        s.competency === competency &&
        s.status === 'ready' &&
        !masteredIds.has(s.id),
    )
    .sort((a, b) => a.index - b.index);
  return candidates[0] ?? null;
}

/** Act 2's chosen block: one skill, with the templated reason it was picked. */
export interface WorkloadBlock {
  skillId: string;
  skillTitle: string;
  competency: Competency;
  competencyLabel: string;
  coverageFraction: number;
  simScore: number | null;
  /** Templated, deterministic — never an AI call. */
  whyLine: string;
}

/**
 * Compose the "why this" line from the scheduler's own facts. Deterministic
 * string templating, matching the design ruling that the mentor line may be
 * AI-narrated elsewhere but the scheduler itself never calls out to an LLM.
 */
export function formatWhyLine(facts: {
  competencyLabel: string;
  coverageFraction: number;
  simScore: number | null;
}): string {
  const pct = Math.round(facts.coverageFraction * 100);
  if (facts.simScore !== null) {
    return `Why this: ${facts.competencyLabel} is your weakest live competency — ${pct}% mastered in lessons, ${Math.round(facts.simScore)}% shown in the sim.`;
  }
  return `Why this: ${facts.competencyLabel} is your weakest live competency at ${pct}% mastered.`;
}

/**
 * Choose today's ONE Act-2 block, end to end: rank live competencies weakest
 * first, then walk that ranking until one has an available (ready,
 * unmastered) practice skill. Walking the whole ranking — not just taking the
 * single weakest — is the no-data fallback: if the weakest competency's ready
 * skills are all already mastered (its coverage is 1.0, so it would never
 * legitimately rank weakest — but a caller-supplied edge case could still
 * produce this), the next-weakest live competency is used instead.
 *
 * Returns `null` only when there is truly nothing left to assign: no live
 * competency has an unmastered ready skill. The Standup UI treats that as a
 * calm "you've mastered every live competency" state, not an error.
 */
export function chooseWorkloadBlock(input: {
  candidates: readonly CompetencyCandidate[];
  skills: readonly PracticeSkillLike[];
  masteredIds: ReadonlySet<string>;
  competencyLabel: (c: Competency) => string;
}): WorkloadBlock | null {
  const ranked = rankCompetencies(input.candidates);
  for (const r of ranked) {
    const skill = pickPracticeSkill(r.competency, input.skills, input.masteredIds);
    if (!skill) continue;
    const competencyLabel = input.competencyLabel(r.competency);
    return {
      skillId: skill.id,
      skillTitle: skill.title,
      competency: r.competency,
      competencyLabel,
      coverageFraction: r.coverageFraction,
      simScore: r.simScore,
      whyLine: formatWhyLine({
        competencyLabel,
        coverageFraction: r.coverageFraction,
        simScore: r.simScore,
      }),
    };
  }
  return null;
}

/**
 * The mentor's top-of-Standup one-liner. Templated from the same facts the
 * rest of this module computes (due count, streak, weakest-competency label)
 * — never an AI call. Kept deliberately plain and calm rather than punchy:
 * absence is never punished, and an empty state ("deck's clear", "you've
 * mastered every live competency") must read as good news, not a nag.
 */
export function buildMentorLine(input: {
  dueCount: number;
  streak: number;
  /** The weakest-competency label Act 2 is targeting, or null if nothing live. */
  weakestCompetencyLabel: string | null;
}): string {
  const warmup =
    input.dueCount > 0
      ? `${input.dueCount} judgment ${input.dueCount === 1 ? 'call is' : 'calls are'} due`
      : 'Your review deck is clear';

  const block = input.weakestCompetencyLabel
    ? `today's block targets ${input.weakestCompetencyLabel}, your weakest live competency`
    : "you've mastered every live competency — nice work";

  const streakClause = input.streak > 0 ? ` Streak: ${input.streak}.` : '';

  return `${warmup}. ${capitalize(block)}.${streakClause}`;
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
