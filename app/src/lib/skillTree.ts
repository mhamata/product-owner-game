import { getUnitsForLevel, deriveSkillState } from '@/curriculum/data';
import type { LevelId, Skill } from '@/curriculum/types';
import { strengthOf, isRusty, type DecayRecord } from './masteryDecay';
import { unlockLineFor, type UnlockLine } from './skillUnlocks';

/**
 * TECH-TREE NODE DERIVATION (praxis-learn-mockup.html's Skills tab):
 * level-grouped node cards with 5 states — done / rusty / next / open / locked.
 *
 * Pure, presentation-agnostic: takes the same `masteredIds` set + a per-skill
 * decay record `deriveSkillState`/`masteryDecay` already use, and produces a
 * small view-model the tree component renders. No React here, so node-state
 * derivation is unit-testable without mounting anything.
 *
 * SELF-STUDY RULING (2026-07-16): `SkillState` (curriculum/data.ts) has 4
 * values — `mastered`, `active`, `available`, `locked` — and after the
 * ungating change ALL of them are reachable (`'available'` used to be dead;
 * see git history). This maps 1:1 onto the tree's 5-state vocabulary, decay
 * adding the done/rusty split within `mastered`:
 *
 *   deriveSkillState  + decay          -> NodeState
 *   ----------------    -----             ---------
 *   'mastered'          strength >= 70   -> 'done'
 *   'mastered'          strength <  70   -> 'rusty'
 *   'active'             (n/a)           -> 'next'      (up-next SUGGESTION, not a gate)
 *   'available'          (n/a)           -> 'open'       (fully playable, not the suggestion)
 *   'locked'             (n/a)           -> 'locked'     (coming-soon ONLY — content gate)
 *
 * This NEVER writes to mastery — `deriveSkillState` is called exactly as
 * every other surface calls it, decay only picks between 'done'/'rusty'
 * within the 'mastered' branch (design ruling: decay never re-locks).
 */
export type NodeState = 'done' | 'rusty' | 'next' | 'open' | 'locked';

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
  if (state === 'available') return 'open';
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
