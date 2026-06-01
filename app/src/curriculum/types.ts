import type { DrillType } from '@/methods';

/**
 * A skill's lifecycle state on the Practice Map.
 *
 * NOTE: this is the *derived display* state. The persisted source of truth is
 * per-skill mastery in the learning store; `deriveSkillState` turns mastery +
 * unit-unlock order into one of these.
 */
export type SkillState = 'mastered' | 'active' | 'available' | 'locked';

export interface Skill {
  /** Stable slug used in the /learn/[skillId] route. Generic — never finance-specific. */
  id: string;
  title: string;
  /** Id of the unit this skill belongs to (e.g. 'u2'). */
  unitId: string;
  /** 1-based position across the whole curriculum, for the "Skill 0X" meta label. */
  index: number;
  /**
   * Linked method in methods/data.ts, when one exists. Lets a lesson pull
   * reference content from the existing 37-method library.
   */
  methodId?: string;
  /**
   * Existing drill component this skill maps to, when one exists. Distinct from
   * `hasLesson`: a drill may exist in the library without a Console lesson yet.
   */
  drillType?: DrillType;
  /**
   * True when a fully working Console lesson loop ships for this skill.
   * Phase 1: only 'value-vs-effort'. Everything else renders "Coming soon".
   */
  hasLesson: boolean;
}

export interface Unit {
  /** Stable id, e.g. 'u1'. */
  id: string;
  /** 1-based unit number for the "UNIT 0X" eyebrow. */
  number: number;
  title: string;
  /** One-line generic description of what the unit teaches. */
  blurb: string;
  skills: Skill[];
}
