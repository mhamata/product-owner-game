import type { Competency, LevelId } from '@/curriculum/types';
import { isLevelCertified } from '@/curriculum/data';

/**
 * One rung of the simulation ladder.
 *
 * The sim climbs the same competency ladder the curriculum teaches. Every rung
 * reuses the one engine but retunes it so a different competency dominates and
 * the squeeze tightens as you climb. A rung unlocks when its gate level is
 * CERTIFIED (every ready skill in that level mastered), except the tutorial rung
 * which is always open. Once unlocked, a rung is freely replayable: that is the
 * free-play sandbox sitting on top of the gated progression.
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
   * The level whose CERTIFICATION unlocks this rung, or null for the always-open
   * tutorial. Gating runs through isLevelCertified, so a rung opens only once
   * every ready skill in the gate level is mastered.
   */
  unlockOnCertified: LevelId | null;
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
    unlockOnCertified: null,
    dominantCompetencies: ['delivery', 'feature-spec'],
  },
  {
    scenarioId: 'turnaround',
    title: 'The Turnaround',
    tagline: 'Inherit a mess: high tech debt, low morale, two customers at the door.',
    altitude: 'Associate',
    unlockOnCertified: 'foundations',
    dominantCompetencies: ['quality', 'stakeholder-mgmt', 'delivery'],
  },
  {
    scenarioId: 'zero-to-one',
    title: 'Zero to One',
    tagline: 'No revenue yet and effort mostly hidden. Find signal before you scale.',
    altitude: 'PM',
    unlockOnCertified: 'associate',
    dominantCompetencies: ['voice-of-customer', 'data-fluency', 'business-outcome'],
  },
  {
    scenarioId: 'scaling-crunch',
    title: 'The Scaling Crunch',
    tagline: 'Demand outruns the team. Sequence a dependency web and say no well.',
    altitude: 'Senior',
    unlockOnCertified: 'pm',
    dominantCompetencies: ['vision-roadmap', 'technical', 'managing-up'],
  },
  {
    scenarioId: 'regulated-launch',
    title: 'The Regulated Launch',
    tagline: 'A regulator in the room and a hard date. Trade speed against scrutiny.',
    altitude: 'Staff',
    unlockOnCertified: 'senior',
    dominantCompetencies: ['strategic-impact', 'ethics', 'stakeholder-mgmt'],
  },
];

/** Look up the ladder rung for a scenario id, if it is on the ladder. */
export function rungForScenario(scenarioId: string): LadderRung | undefined {
  return SIM_LADDER.find((r) => r.scenarioId === scenarioId);
}

/** True if a rung is unlocked given the player's set of mastered skill ids. */
export function isRungUnlocked(rung: LadderRung, masteredIds: ReadonlySet<string>): boolean {
  if (rung.unlockOnCertified === null) return true;
  return isLevelCertified(rung.unlockOnCertified, masteredIds);
}
