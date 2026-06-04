import type { DrillType } from '@/methods';

/**
 * A skill's lifecycle state on the Practice Map.
 *
 * NOTE: this is the *derived display* state. The persisted source of truth is
 * per-skill mastery in the learning store; `deriveSkillState` turns mastery +
 * level/unit order into one of these.
 */
export type SkillState = 'mastered' | 'active' | 'available' | 'locked';

/* ------------------------------------------------------------------
   LEVELS: the career ladder.

   PRAXIS is a zero-to-expert curriculum organised as six levels, each a rung
   on a real PM career ladder. Levels are the top-level navigation: a learner
   climbs from Foundations to Director/VP. `staff` and `director` both branch
   after `senior` (the IC track forks from the management track), which we model
   with `branch`: everything up to `senior` is on the `core` spine, and the two
   post-senior levels are tagged `ic` (Staff/Principal) and `management`
   (Director/VP). `order` still gives a single linear sort for rendering.
   ------------------------------------------------------------------ */
export type LevelId =
  | 'foundations'
  | 'associate'
  | 'pm'
  | 'senior'
  | 'staff'
  | 'director';

/**
 * Which fork of the ladder a level sits on.
 *  - `core`:       the shared spine everyone climbs (Foundations → Senior).
 *  - `ic`:         the individual-contributor branch (Staff / Principal).
 *  - `management`: the people-management branch (Director / VP).
 * Both `ic` and `management` are "post-senior": they unlock after Senior and
 * represent a choice of direction rather than a strict sequence.
 */
export type LevelBranch = 'core' | 'ic' | 'management';

export interface Level {
  id: LevelId;
  label: string;
  /** 1-based linear order for rendering (director is ordered after staff). */
  order: number;
  /** Which fork this level sits on (see LevelBranch). */
  branch: LevelBranch;
  /** One-line description of the rung. */
  summary: string;
}

/* ------------------------------------------------------------------
   COMPETENCY SPINE: the Reforge / Ravi Mehta product-competency model.

   Every skill tags exactly one competency. Competencies roll up into four
   product DIMENSIONS (execution / insight / strategy / influence), plus a set
   of CROSS-CUTTING competencies (business / technical / design / communication
   / ethics) that don't belong to a single dimension but thread through all of
   them. The pair (dimension, competency) lets the map show *what kind* of PM
   muscle each skill builds, independent of the level it sits at.
   ------------------------------------------------------------------ */
export type Dimension = 'execution' | 'insight' | 'strategy' | 'influence';

/** Competencies under each of the four core dimensions. */
export type ExecutionCompetency =
  | 'feature-spec'
  | 'delivery'
  | 'quality';
export type InsightCompetency =
  | 'data-fluency'
  | 'voice-of-customer'
  | 'ux';
export type StrategyCompetency =
  | 'business-outcome'
  | 'vision-roadmap'
  | 'strategic-impact';
export type InfluenceCompetency =
  | 'stakeholder-mgmt'
  | 'team-leadership'
  | 'managing-up';

/**
 * Cross-cutting competencies. These don't sit under one dimension; they are
 * the broad literacies every PM carries across all four.
 */
export type CrossCuttingCompetency =
  | 'business'
  | 'technical'
  | 'design'
  | 'communication'
  | 'ethics';

export type Competency =
  | ExecutionCompetency
  | InsightCompetency
  | StrategyCompetency
  | InfluenceCompetency
  | CrossCuttingCompetency;

/** The dimension a competency rolls up into, or `'cross-cutting'`. */
export type CompetencyGroup = Dimension | 'cross-cutting';

export interface DimensionMeta {
  id: CompetencyGroup;
  label: string;
}

export interface CompetencyMeta {
  id: Competency;
  label: string;
  /** Which dimension (or 'cross-cutting') this competency belongs to. */
  group: CompetencyGroup;
}

/** Display labels for the four dimensions + the cross-cutting bucket. */
export const DIMENSIONS: Record<CompetencyGroup, DimensionMeta> = {
  execution: { id: 'execution', label: 'Execution' },
  insight: { id: 'insight', label: 'Insight' },
  strategy: { id: 'strategy', label: 'Strategy' },
  influence: { id: 'influence', label: 'Influence' },
  'cross-cutting': { id: 'cross-cutting', label: 'Cross-cutting' },
};

/** Display label + parent dimension for every competency. */
export const COMPETENCIES: Record<Competency, CompetencyMeta> = {
  // execution
  'feature-spec': { id: 'feature-spec', label: 'Feature Spec', group: 'execution' },
  delivery: { id: 'delivery', label: 'Delivery', group: 'execution' },
  quality: { id: 'quality', label: 'Quality', group: 'execution' },
  // insight
  'data-fluency': { id: 'data-fluency', label: 'Data Fluency', group: 'insight' },
  'voice-of-customer': { id: 'voice-of-customer', label: 'Voice of Customer', group: 'insight' },
  ux: { id: 'ux', label: 'UX', group: 'insight' },
  // strategy
  'business-outcome': { id: 'business-outcome', label: 'Business Outcome', group: 'strategy' },
  'vision-roadmap': { id: 'vision-roadmap', label: 'Vision & Roadmap', group: 'strategy' },
  'strategic-impact': { id: 'strategic-impact', label: 'Strategic Impact', group: 'strategy' },
  // influence
  'stakeholder-mgmt': { id: 'stakeholder-mgmt', label: 'Stakeholder Mgmt', group: 'influence' },
  'team-leadership': { id: 'team-leadership', label: 'Team Leadership', group: 'influence' },
  'managing-up': { id: 'managing-up', label: 'Managing Up', group: 'influence' },
  // cross-cutting
  business: { id: 'business', label: 'Business', group: 'cross-cutting' },
  technical: { id: 'technical', label: 'Technical', group: 'cross-cutting' },
  design: { id: 'design', label: 'Design', group: 'cross-cutting' },
  communication: { id: 'communication', label: 'Communication', group: 'cross-cutting' },
  ethics: { id: 'ethics', label: 'Ethics', group: 'cross-cutting' },
};

/* ------------------------------------------------------------------
   MODALITIES: *how* a skill is practised.

   A skill can use several. `lesson`, `drill`, and `sim` have working content
   today; the rest (artifact / roleplay / judgment / reading / reference) are
   planned formats and render as informational tags for now.
   ------------------------------------------------------------------ */
export type Modality =
  | 'lesson'
  | 'drill'
  | 'artifact'
  | 'sim'
  | 'roleplay'
  | 'judgment'
  | 'reading'
  | 'reference';

export interface ModalityMeta {
  id: Modality;
  label: string;
  /** True for modalities that have working interactive content today. */
  live: boolean;
}

export const MODALITIES: Record<Modality, ModalityMeta> = {
  lesson: { id: 'lesson', label: 'Lesson', live: true },
  drill: { id: 'drill', label: 'Drill', live: true },
  artifact: { id: 'artifact', label: 'Artifact', live: false },
  sim: { id: 'sim', label: 'Sim', live: true },
  roleplay: { id: 'roleplay', label: 'Roleplay', live: false },
  judgment: { id: 'judgment', label: 'Judgment', live: false },
  reading: { id: 'reading', label: 'Reading', live: false },
  reference: { id: 'reference', label: 'Reference', live: false },
};

/* ------------------------------------------------------------------
   STATUS: whether a skill is playable yet.

   `ready`:       has a working lesson/drill loop today; counts toward mastery
                  and can gate progression.
   `coming-soon`: content is planned. Renders as a tasteful placeholder, is
                   non-interactive, and NEVER blocks progress or counts against
                   any mastery denominator (see learnStore for the gating rule).
   ------------------------------------------------------------------ */
export type SkillStatus = 'ready' | 'coming-soon';

/* ------------------------------------------------------------------
   SPECIALIZATION TRACKS: off-ladder depth.

   Tracks sit beside the career ladder rather than on it. Conceptually they
   unlock at Senior+ and let a PM go deep on a domain (growth, platform/API,
   AI/ML, monetization, marketplace, B2B-vs-B2C, zero-to-one). A track's skills
   reuse the Skill shape but carry `track` instead of `level`.
   ------------------------------------------------------------------ */
export type TrackId =
  | 'growth'
  | 'platform-api'
  | 'ai-ml'
  | 'monetization'
  | 'marketplace'
  | 'b2b-b2c'
  | 'zero-to-one';

export interface Track {
  id: TrackId;
  label: string;
  order: number;
  /** One-line description of the specialization. */
  summary: string;
  skills: Skill[];
}

/* ------------------------------------------------------------------
   SKILL + UNIT.

   The display contract used by the lesson components is preserved: a Skill
   still carries `id`, `title`, `unitId`, and a 1-based `index`; a Unit still
   carries `number`, `title`, and `skills`. New fields (`level`/`track`,
   `competency`, `modalities`, `status`) layer the leveled model on top.
   ------------------------------------------------------------------ */
export interface Skill {
  /** Stable slug used in the /learn/[skillId] route. Generic, never finance-specific. */
  id: string;
  title: string;
  /** Id of the unit this skill belongs to (e.g. 'foundations-u1'). */
  unitId: string;
  /** 1-based position across the whole ladder, for the "Skill 0X" meta label. */
  index: number;
  /**
   * The ladder level this skill belongs to. Mutually exclusive with `track`:
   * ladder skills set `level`; specialization-track skills set `track`.
   */
  level?: LevelId;
  /** The specialization track this skill belongs to (track skills only). */
  track?: TrackId;
  /** The single product competency this skill builds. */
  competency: Competency;
  /** Which practice modalities this skill uses (drill/sim are live today). */
  modalities: Modality[];
  /** Whether the skill is playable (`ready`) or a planned placeholder. */
  status: SkillStatus;
  /**
   * Linked method in methods/data.ts, when one exists. Lets a lesson pull
   * reference content from the existing method library.
   */
  methodId?: string;
  /**
   * Existing drill component this skill maps to, when one exists. Distinct from
   * `status`: a drill may exist in the library without a Console lesson yet.
   */
  drillType?: DrillType;
  /**
   * Convenience flag mirrored from `status === 'ready'`: true when a working
   * Console lesson loop ships for this skill. Kept for readability at call
   * sites that branch on "is this interactive". Derived in data.ts, never
   * hand-set out of sync with `status`.
   */
  hasLesson: boolean;
}

export interface Unit {
  /** Stable id, e.g. 'foundations-u1'. */
  id: string;
  /** Id of the level this unit belongs to. */
  levelId: LevelId;
  /** 1-based unit number *within its level*, for the "UNIT 0X" eyebrow. */
  number: number;
  title: string;
  /** One-line generic description of what the unit teaches. */
  blurb: string;
  skills: Skill[];
}
