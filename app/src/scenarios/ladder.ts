import type { Competency, LevelId } from '@/curriculum/types';
import { getLevel } from '@/curriculum/data';

/**
 * One rung of the simulation ladder.
 *
 * The sim climbs the same competency ladder the curriculum teaches. Every rung
 * reuses the one engine but retunes it so a different competency dominates and
 * the squeeze tightens as you climb.
 *
 * SELF-STUDY RULING (2026-07-16, Mike): `isRungUnlocked` was DELETED. Every
 * rung is open and freely replayable from a cold start — nothing here gates
 * on certification anymore. `pairedWithLevel` survives purely as a display
 * pairing: which curriculum level's competency profile this rung was tuned
 * to match, surfaced as a "Paired with {level}" hint, never as a requirement.
 */
export interface LadderRung {
  /** Route id and scenario-registry key (see ./index). */
  scenarioId: string;
  /** Display title for the rung. */
  title: string;
  /** One line on what makes this rung hard (the squeeze). */
  tagline: string;
  /** Career altitude this rung trains, for display. */
  altitude: string;
  /**
   * The curriculum level whose competency profile this rung is tuned to
   * match, or null for the tutorial rung (no particular pairing). Display
   * hint only — see the self-study ruling above.
   */
  pairedWithLevel: LevelId | null;
  /** Competencies this rung leans on hardest. Drives the competency debrief. */
  dominantCompetencies: Competency[];
}

/** The ladder, in climb order (Foundations through Staff). */
export const SIM_LADDER: readonly LadderRung[] = [
  {
    scenarioId: '01-canadian-launch',
    title: 'First Sprint',
    tagline: 'Learn the loop with slack in the system and a forgiving deck.',
    altitude: 'Foundations',
    pairedWithLevel: null,
    dominantCompetencies: ['delivery', 'feature-spec'],
  },
  {
    scenarioId: 'turnaround',
    title: 'The Turnaround',
    tagline: 'Inherit a mess: high tech debt, low morale, two customers at the door.',
    altitude: 'Associate',
    pairedWithLevel: 'foundations',
    dominantCompetencies: ['quality', 'stakeholder-mgmt', 'delivery'],
  },
  {
    scenarioId: 'zero-to-one',
    title: 'Zero to One',
    tagline: 'No revenue yet and effort mostly hidden. Find signal before you scale.',
    altitude: 'PM',
    pairedWithLevel: 'associate',
    dominantCompetencies: ['voice-of-customer', 'data-fluency', 'business-outcome'],
  },
  {
    scenarioId: 'scaling-crunch',
    title: 'The Scaling Crunch',
    tagline: 'Demand outruns the team. Sequence a dependency web and say no well.',
    altitude: 'Senior',
    pairedWithLevel: 'pm',
    dominantCompetencies: ['vision-roadmap', 'technical', 'managing-up'],
  },
  {
    scenarioId: 'regulated-launch',
    title: 'The Regulated Launch',
    tagline: 'A regulator in the room and a hard date. Trade speed against scrutiny.',
    altitude: 'Staff',
    pairedWithLevel: 'senior',
    dominantCompetencies: ['strategic-impact', 'ethics', 'stakeholder-mgmt'],
  },
];

/** Look up the ladder rung for a scenario id, if it is on the ladder. */
export function rungForScenario(scenarioId: string): LadderRung | undefined {
  return SIM_LADDER.find((r) => r.scenarioId === scenarioId);
}

/**
 * Display label of the level this rung is paired with, for the "Paired with
 * X" hint (never a requirement — see the self-study ruling above). Null for
 * the tutorial rung, which has no particular pairing.
 */
export function pairedLevelLabel(rung: LadderRung): string | null {
  return rung.pairedWithLevel ? getLevel(rung.pairedWithLevel)?.label ?? null : null;
}
