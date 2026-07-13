import type { Skill } from '@/curriculum/types';
import {
  isMasteredRecord,
  strengthOf,
  type DecayRecord,
} from './masteryDecay';
import { unlockLineFor, type UnlockLine } from './skillUnlocks';

/** The honest right/wrong count for one drill attempt. */
export interface BlockTally {
  correct: number;
  total: number;
}

/**
 * The truthful post-drill summary shown on the block-summary card (W4-I,
 * praxis-learn-mockup.html's "block summary" bullet). Every field is derived
 * from real store state — nothing here is invented copy:
 *
 *  - `tally` is the drill's own graded correct/total.
 *  - `strengthBefore`/`strengthAfter` read `@/lib/masteryDecay`'s real decay
 *    model on the skill's progress record BEFORE and AFTER this attempt's
 *    `recordResult` call. `strengthDelta` is `null` whenever the two are
 *    equal — the model genuinely did not move, so the UI must not claim a
 *    delta that did not happen (e.g. re-practicing an already-fresh mastered
 *    skill: strength was 100 and stays 100).
 *  - `closerLine` is only ever populated the one moment a skill NEWLY crosses
 *    the mastery threshold this attempt, sourced from `skillUnlocks.ts`'s
 *    `unlockLineFor` — the same registry the tech tree renders, so a "1 block
 *    closer" claim is always the same one a learner would see on the node
 *    itself, never a fabricated one-off.
 */
export interface BlockSummary {
  skillTitle: string;
  tally: BlockTally;
  masteredBefore: boolean;
  masteredAfter: boolean;
  strengthBefore: number;
  strengthAfter: number;
  strengthDelta: number | null;
  /** Current demonstrated competence, 0-100 — the honest "X% to mastery" figure when not yet mastered. */
  masteryPercent: number;
  /** Real unlock line (sim gate or pedagogical fallback), only when this attempt newly mastered the skill. */
  closerLine: UnlockLine | null;
}

export function deriveBlockSummary(params: {
  skill: Skill;
  tally: BlockTally;
  before: DecayRecord | undefined;
  after: DecayRecord;
  now?: number;
}): BlockSummary {
  const { skill, tally, before, after, now = Date.now() } = params;

  const masteredBefore = isMasteredRecord(before);
  const masteredAfter = isMasteredRecord(after);
  const strengthBefore = strengthOf(before, now);
  const strengthAfter = strengthOf(after, now);
  const strengthDelta = strengthAfter === strengthBefore ? null : strengthAfter - strengthBefore;

  // Only a NEW crossing earns a closer line — re-practicing an already-
  // mastered skill refreshes strength, but it does not unlock anything new.
  const closerLine = masteredAfter && !masteredBefore ? unlockLineFor(skill) : null;

  return {
    skillTitle: skill.title,
    tally,
    masteredBefore,
    masteredAfter,
    strengthBefore,
    strengthAfter,
    strengthDelta,
    masteryPercent: Math.round(Math.max(0, Math.min(1, after.mastery ?? 0)) * 100),
    closerLine,
  };
}
