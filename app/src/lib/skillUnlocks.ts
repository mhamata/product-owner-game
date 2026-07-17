import { masterableSkills } from '@/curriculum/data';
import { COMPETENCIES, type Skill } from '@/curriculum/types';
import { FOG_GATE_LIST } from './fogOfWar';

/**
 * TECH-TREE SKILL LINES. SELF-STUDY RULING (2026-07-16, Mike, see the dated
 * amendment in design-sim-2.0.md §2.5): "skills unlock capabilities, not
 * checkmarks" is superseded by "skills sharpen reads" — nothing here is a
 * gate anymore, so this copy names what mastering a skill DEEPENS, not what
 * it unblocks.
 *
 * Every skill node on the tech tree names what mastering it sharpens. Two
 * kinds:
 *
 *  - `sim`: a REAL in-app payoff, honestly sourced from something that
 *    actually exists in the codebase today. We do not invent payoffs that
 *    don't exist yet — see SIM_UNLOCKS below, built straight from W4-G's
 *    Product-screen "sharpen" registry (`@/lib/fogOfWar`), the real source of
 *    truth for which skill sharpens which Product-screen pane.
 *  - `pedagogical`: no real in-sim payoff exists for this skill yet, so the
 *    line names what studying it actually opens NEXT in the curriculum — the
 *    closest honest analogue the ladder can support today (the ladder has no
 *    per-skill prerequisite graph; `deriveSkillState` orders skills linearly
 *    for the "up next" suggestion only — see curriculum/data.ts).
 *
 * SOURCING SIM_UNLOCKS: built from `FOG_GATE_LIST` (`@/lib/fogOfWar`), each
 * gate's `unlockSkillOrCompetency` mapped to a fresh, tree-flavoured sentence
 * naming the pane it sharpens. We deliberately compose our own copy from
 * `gate.label` rather than string-surgery on `gate.unlockHint` (that hint is
 * authored for the Product screen's own hint-chip copy, a different surface
 * with a different voice) — this keeps the two call sites decoupled from
 * each other's exact wording while both stay honestly sourced from the same
 * one registry, so there is exactly one place a gate can be added, renamed,
 * or retired.
 */
export type UnlockKind = 'sim' | 'pedagogical';

export interface UnlockLine {
  kind: UnlockKind;
  text: string;
}

/** skillId -> honest, sourced in-sim payoff copy, built from the Product-screen "sharpen" registry. */
const SIM_UNLOCKS: Record<string, string> = Object.fromEntries(
  FOG_GATE_LIST.map((gate) => [
    gate.unlockSkillOrCompetency,
    `Powers ${gate.label} on the sim's Product screen.`,
  ]),
);

/** The real, sourced in-sim payoff for a skill, or null if none exists yet. */
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
