import { masterableSkills } from '@/curriculum/data';
import { COMPETENCIES, type Skill } from '@/curriculum/types';
import { FOG_GATE_LIST } from './fogOfWar';

/**
 * TECH-TREE UNLOCK LINES (design-sim-2.0.md §2.5: "skills unlock capabilities,
 * not checkmarks... locked ≠ hidden: the learner can always read the power
 * they're missing").
 *
 * Every skill node on the tech tree names what mastering it grants. Two kinds:
 *
 *  - `sim`: a REAL in-app power, honestly sourced from something that actually
 *    exists in the codebase today. We do not invent unlocks that don't exist
 *    yet — see SIM_UNLOCKS below, built straight from W4-G's fog-of-war gate
 *    registry (`@/lib/fogOfWar`), the real source of truth for which skill
 *    unlocks which Product-screen pane.
 *  - `pedagogical`: no real in-sim gate exists for this skill yet, so the line
 *    names what studying it actually opens NEXT in the curriculum — the
 *    closest honest analogue to "unlocks" the ladder can support today (the
 *    ladder has no per-skill prerequisite graph; `deriveSkillState` is
 *    strictly linear across the whole curriculum — see curriculum/data.ts).
 *
 * SOURCING SIM_UNLOCKS: built from `FOG_GATE_LIST` (`@/lib/fogOfWar`), each
 * gate's `unlockSkillOrCompetency` mapped to a fresh, tree-flavoured sentence
 * naming the pane it grants. We deliberately compose our own copy from
 * `gate.label` rather than string-surgery on `gate.unlockHint` (that hint is
 * authored for the Product screen's own locked-panel copy, a different
 * surface with a different voice) — this keeps the two call sites decoupled
 * from each other's exact wording while both stay honestly sourced from the
 * same one registry, so there is exactly one place a gate can be added,
 * renamed, or retired.
 */
export type UnlockKind = 'sim' | 'pedagogical';

export interface UnlockLine {
  kind: UnlockKind;
  text: string;
}

/** skillId -> honest, sourced in-sim unlock copy, built from the fog-of-war gate registry. */
const SIM_UNLOCKS: Record<string, string> = Object.fromEntries(
  FOG_GATE_LIST.map((gate) => [
    gate.unlockSkillOrCompetency,
    `Unlocks ${gate.label} on the Product screen — the fog lifts on every future run, permanently.`,
  ]),
);

/** The real, sourced in-sim unlock for a skill, or null if none exists yet. */
export function realUnlockLine(skillId: string): UnlockLine | null {
  const text = SIM_UNLOCKS[skillId];
  return text ? { kind: 'sim', text } : null;
}

/**
 * The next `count` ready ladder skills (by curriculum index) that share this
 * skill's competency. This is what "Feeds:" names on a mastered/active node —
 * an honest, data-derived answer to "what does this open up", since the
 * curriculum has no explicit skill-to-skill prerequisite graph.
 */
export function nextSkillsSharingCompetency(skill: Skill, count = 2): Skill[] {
  return masterableSkills
    .filter((s) => s.competency === skill.competency && s.index > skill.index)
    .sort((a, b) => a.index - b.index)
    .slice(0, count);
}

/**
 * The pedagogical (non-sim) unlock line for a skill: names the skills further
 * up the same competency thread it feeds, or — for the last skill on a
 * thread — names the competency it builds outright.
 */
export function pedagogicalUnlockLine(skill: Skill): UnlockLine {
  const next = nextSkillsSharingCompetency(skill);
  if (next.length > 0) {
    return {
      kind: 'pedagogical',
      text: `Feeds: ${next.map((s) => s.title).join(' · ')}`,
    };
  }
  return {
    kind: 'pedagogical',
    text: `Builds ${COMPETENCIES[skill.competency].label} — the last skill on this thread today.`,
  };
}

/** The unlock line to show on a skill's tech-tree node: real sim power first, pedagogical fallback otherwise. */
export function unlockLineFor(skill: Skill): UnlockLine {
  return realUnlockLine(skill.id) ?? pedagogicalUnlockLine(skill);
}
