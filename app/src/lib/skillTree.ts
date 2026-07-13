import { getUnitsForLevel, deriveSkillState } from '@/curriculum/data';
import type { LevelId, Skill } from '@/curriculum/types';
import { strengthOf, isRusty, type DecayRecord } from './masteryDecay';
import { unlockLineFor, type UnlockLine } from './skillUnlocks';

/**
 * TECH-TREE NODE DERIVATION (praxis-learn-mockup.html's Skills tab):
 * level-grouped node cards with 4 states — done / rusty / next / locked.
 *
 * Pure, presentation-agnostic: takes the same `masteredIds` set + a per-skill
 * decay record `deriveSkillState`/`masteryDecay` already use, and produces a
 * small view-model the tree component renders. No React here, so node-state
 * derivation is unit-testable without mounting anything.
 *
 * STATE MAPPING — `SkillState` (curriculum/data.ts) has exactly 3 REACHABLE
 * values today (`deriveSkillState` never returns `'available'` despite the
 * type allowing it — see that function's own comment): `mastered`, `active`,
 * `locked`. This maps 1:1 onto the mockup's 4-state vocabulary, decay adding
 * the done/rusty split within `mastered`:
 *
 *   deriveSkillState  + decay          -> NodeState
 *   ----------------    -----             ---------
 *   'mastered'          strength >= 70   -> 'done'
 *   'mastered'          strength <  70   -> 'rusty'
 *   'active'             (n/a)           -> 'next'
 *   'locked'             (n/a)           -> 'locked'   (includes coming-soon)
 *
 * This NEVER writes to mastery — `deriveSkillState` is called exactly as
 * every other gated surface calls it, decay only picks between 'done'/'rusty'
 * within the 'mastered' branch (design ruling: decay never re-locks).
 */
export type NodeState = 'done' | 'rusty' | 'next' | 'locked';

export interface SkillNodeView {
  skill: Skill;
  state: NodeState;
  /** 0-100 decay-adjusted strength, or null when the skill isn't mastered (no meter to show). */
  strengthPct: number | null;
  /** True only for 'rusty' nodes — surfaces the refresh CTA. */
  offersRefresh: boolean;
  unlock: UnlockLine;
}

/** One skill's tech-tree node state, given the ladder's mastered set + its decay record. */
export function deriveNodeState(
  skillId: string,
  masteredIds: ReadonlySet<string>,
  decay: DecayRecord | undefined,
  now: number = Date.now(),
): NodeState {
  const state = deriveSkillState(skillId, masteredIds);
  if (state === 'mastered') return isRusty(decay, now) ? 'rusty' : 'done';
  if (state === 'active') return 'next';
  return 'locked';
}

/** The full node view-model for one skill. */
export function deriveSkillNode(
  skill: Skill,
  masteredIds: ReadonlySet<string>,
  decay: DecayRecord | undefined,
  now: number = Date.now(),
): SkillNodeView {
  const state = deriveNodeState(skill.id, masteredIds, decay, now);
  const strengthPct = state === 'done' || state === 'rusty' ? strengthOf(decay, now) : null;
  return {
    skill,
    state,
    strengthPct,
    offersRefresh: state === 'rusty',
    unlock: unlockLineFor(skill),
  };
}

/**
 * Every skill node for a level, in curriculum order, flattened across the
 * level's units — the mockup's "level-grouped node cards" render one flat
 * tree per level, not one per unit (see praxis-learn-mockup.html's
 * `#scr-skills`, `.lvl-head` + a single `.tree` beneath it).
 *
 * `decayFor` is injected (rather than this module reaching into a store)
 * to keep the module pure and independently testable; callers pass
 * `learnStore`'s progress lookup.
 */
export function skillNodesForLevel(
  levelId: LevelId,
  masteredIds: ReadonlySet<string>,
  decayFor: (skillId: string) => DecayRecord | undefined,
  now: number = Date.now(),
): SkillNodeView[] {
  return getUnitsForLevel(levelId)
    .flatMap((u) => u.skills)
    .sort((a, b) => a.index - b.index)
    .map((skill) => deriveSkillNode(skill, masteredIds, decayFor(skill.id), now));
}

/** Count of a level's `done`/`rusty` (i.e. mastered) nodes, for the level-header "N / M mastered" line. */
export function levelMasteredCount(nodes: readonly SkillNodeView[]): number {
  return nodes.filter((n) => n.state === 'done' || n.state === 'rusty').length;
}
