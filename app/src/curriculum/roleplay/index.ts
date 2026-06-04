/**
 * Roleplay scenario registry.
 *
 * Every authored roleplay is collected here and keyed by its `skillId`, so the
 * lesson router can ask "does this skill have a roleplay to practise?" with one
 * lookup, exactly like the artifact and concept-lesson registries. Adding a
 * scenario is two lines: import the file and list it in `ALL_ROLEPLAYS`. The
 * runtime check guarantees each scenario's `skillId` is unique.
 *
 * Each roleplay is its OWN practice skill (modality 'roleplay'), sitting beside
 * the concept lesson that teaches the same influence topic. Keying to dedicated
 * skill ids is what lets the router send a skill to exactly one modality, so the
 * lesson and the roleplay both stay reachable (the artifacts use the same trick).
 */
import type { RoleplayScenario } from './types';
import { defendRoadmap } from './defend-roadmap';
import { scopeCut } from './scope-cut';
import { customerEscalation } from './customer-escalation';
import { sayNo } from './say-no';

/**
 * Every authored roleplay, in curriculum order (ladder level → unit).
 *
 * The comments name the sibling concept lesson and the unit each one lives in.
 */
export const ALL_ROLEPLAYS: RoleplayScenario[] = [
  scopeCut, // 'roleplay-scope-cut' · Foundations, beside Working with Eng & Design
  defendRoadmap, // 'roleplay-defend-roadmap' · Senior, beside Influence Without Authority
  customerEscalation, // 'roleplay-customer-escalation' · Senior, beside Stakeholder Management
  sayNo, // 'roleplay-say-no' · Senior, beside Managing Up
];

/** skillId -> scenario. Throws at module load on a duplicate skillId. */
export const ROLEPLAY_CONTENT: Record<string, RoleplayScenario> = (() => {
  const map: Record<string, RoleplayScenario> = {};
  for (const r of ALL_ROLEPLAYS) {
    if (map[r.skillId]) {
      throw new Error(`Duplicate roleplay for skillId "${r.skillId}"`);
    }
    map[r.skillId] = r;
  }
  return map;
})();

/** The roleplay for a skill, or undefined when the skill has none. */
export function getRoleplayScenario(skillId: string): RoleplayScenario | undefined {
  return ROLEPLAY_CONTENT[skillId];
}

export type { RoleplayScenario } from './types';
export {
  type RoleplayCriterion,
  type RoleplayMessage,
  type RoleplayRole,
  type ResolvedRoleplay,
  resolveRoleplay,
  countLearnerTurns,
  canReply,
  MAX_LEARNER_TURNS,
  MIN_LEARNER_TURNS_TO_SCORE,
  MAX_MESSAGE_CHARS,
} from './types';
