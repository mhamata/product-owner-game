import type {
  Competency,
  Level,
  LevelId,
  Modality,
  Skill,
  SkillState,
  SkillStatus,
  Track,
  TrackId,
  Unit,
} from './types';

/**
 * The PRAXIS curriculum — a leveled, zero-to-expert PM career ladder.
 *
 * SHAPE
 * -----
 * Six LEVELS (a real PM career ladder), each containing UNITS, each containing
 * 2–4 SKILLS. Every skill tags one product `competency`, lists its practice
 * `modalities`, and carries a `status` of `ready` (playable today) or
 * `coming-soon` (planned placeholder). A separate set of specialization TRACKS
 * sits beside the ladder.
 *
 * READY vs COMING-SOON
 * --------------------
 * Only the skills with working content today are `ready`. These are the
 * original 21-skill curriculum's drills/lessons, re-homed into the new model
 * with their `id` / `methodId` / `drillType` PRESERVED so every existing drill
 * still plays and stays industry-aware. Everything new is `coming-soon`.
 *
 * Mapping is intentionally generic — no finance / Moomoo content here. All the
 * industry skinning lives in the drill resolvers, which key off the unchanged
 * skill ids, not this structure.
 */

/* ==================================================================
   LEVELS — the career ladder.
   ================================================================== */
export const levels: Level[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    order: 1,
    branch: 'core',
    summary: 'What the job actually is, and the shared language to do it.',
  },
  {
    id: 'associate',
    label: 'Associate PM',
    order: 2,
    branch: 'core',
    summary: 'Execute cleanly: specs, stories, and a backlog that ships.',
  },
  {
    id: 'pm',
    label: 'Product Manager',
    order: 3,
    branch: 'core',
    summary: 'Own outcomes: discover, prioritize, measure, experiment.',
  },
  {
    id: 'senior',
    label: 'Senior PM',
    order: 4,
    branch: 'core',
    summary: 'Set strategy and move people who don’t report to you.',
  },
  {
    id: 'staff',
    label: 'Staff / Principal PM',
    order: 5,
    branch: 'ic',
    summary: 'Multiply teams through judgment, framing, and leverage.',
  },
  {
    id: 'director',
    label: 'Director / VP Product',
    order: 6,
    branch: 'management',
    summary: 'Build the org and the operating model that builds product.',
  },
];

/* ==================================================================
   UNITS + SKILLS, declared per level.

   Seeds are terse on purpose: a unit lists its skills, each skill carries a
   `competency` + `modalities` + `status` (+ optional `methodId`/`drillType`).
   The global `index`, per-level unit `number`, `unitId`, `level`, and the
   `hasLesson` mirror are all filled in by the assembly pass below — never by
   hand (hand-numbering drifts the moment the list changes).
   ================================================================== */
type SkillSeed = {
  id: string;
  title: string;
  competency: Competency;
  modalities: Modality[];
  status: SkillStatus;
  methodId?: string;
  drillType?: Skill['drillType'];
};

interface UnitSeed {
  /** Stable id suffix; the full unit id is `${levelId}-${id}`. */
  id: string;
  title: string;
  blurb: string;
  skills: SkillSeed[];
}

type LevelUnitSeeds = Record<LevelId, UnitSeed[]>;

// Shorthand for the two live modality combos so the seeds stay readable.
const DRILL: Modality[] = ['lesson', 'drill'];
const SOON_LESSON: Modality[] = ['lesson'];

const LEVEL_UNITS: LevelUnitSeeds = {
  /* ---------------------------------------------------------------
     FOUNDATIONS — what PM is + shared language.
     --------------------------------------------------------------- */
  foundations: [
    {
      id: 'u1',
      title: 'The Role',
      blurb: 'What a PM is — and is not — and how the work fits together.',
      skills: [
        { id: 'what-pm-is', title: 'What PM Is', competency: 'business', modalities: ['lesson', 'reading'], status: 'ready' },
        { id: 'product-lifecycle', title: 'The Product Lifecycle', competency: 'business-outcome', modalities: ['lesson', 'reading'], status: 'ready' },
        { id: 'four-big-risks', title: 'The Four Big Risks', competency: 'business', modalities: ['lesson', 'judgment'], status: 'ready' },
      ],
    },
    {
      id: 'u2',
      title: 'Working in a Team',
      blurb: 'How product, engineering, and design build together.',
      skills: [
        { id: 'working-with-eng-design', title: 'Working with Eng & Design', competency: 'team-leadership', modalities: ['lesson', 'roleplay'], status: 'ready' },
        { id: 'agile-scrum', title: 'Agile & Scrum Basics', competency: 'delivery', methodId: 'shape-up', modalities: ['lesson', 'reading'], status: 'ready' },
      ],
    },
    {
      id: 'u3',
      title: 'Literacy',
      blurb: 'Enough technical and quantitative fluency to be dangerous.',
      skills: [
        { id: 'technical-literacy', title: 'Technical Literacy', competency: 'technical', modalities: ['lesson', 'reference'], status: 'ready' },
        { id: 'metrics-literacy', title: 'Metrics Literacy', competency: 'data-fluency', modalities: ['lesson', 'reference'], status: 'ready' },
      ],
    },
  ],

  /* ---------------------------------------------------------------
     ASSOCIATE PM — execution.
     --------------------------------------------------------------- */
  associate: [
    {
      id: 'u1',
      title: 'Writing It Down',
      blurb: 'Turn intent into a spec a team can build from.',
      skills: [
        { id: 'prds-and-specs', title: 'PRDs & Specs', competency: 'feature-spec', modalities: ['lesson', 'artifact'], status: 'ready' },
        { id: 'user-stories', title: 'User Stories & Acceptance Criteria', competency: 'feature-spec', modalities: ['lesson', 'artifact'], status: 'ready' },
      ],
    },
    {
      id: 'u2',
      title: 'Running the Backlog',
      blurb: 'Shape and sequence the work so it flows.',
      skills: [
        { id: 'backlog-sprints-kanban', title: 'Backlog, Sprints & Kanban', competency: 'delivery', modalities: ['lesson', 'reference'], status: 'ready' },
        { id: 'story-mapping', title: 'Story Mapping', competency: 'feature-spec', modalities: ['lesson', 'artifact'], status: 'ready' },
      ],
    },
    {
      id: 'u3',
      title: 'Shipping Well',
      blurb: 'Size the work and keep quality from slipping.',
      skills: [
        // Existing T-shirt sizing drill — industry-aware, fully playable.
        { id: 'estimation', title: 'Estimation', competency: 'delivery', methodId: 't-shirt', drillType: 't-shirt', modalities: DRILL, status: 'ready' },
        { id: 'quality-and-delivery', title: 'Quality & Delivery', competency: 'quality', modalities: ['lesson', 'reference'], status: 'ready' },
      ],
    },
  ],

  /* ---------------------------------------------------------------
     PRODUCT MANAGER — insight + strategy.
     --------------------------------------------------------------- */
  pm: [
    {
      id: 'u1',
      title: 'Continuous Discovery',
      blurb: 'Find the real problem before you fall in love with a solution.',
      skills: [
        // The three live discovery drills (free-text, LLM-graded, industry-aware).
        { id: 'jtbd', title: 'Jobs To Be Done', competency: 'voice-of-customer', methodId: 'jtbd', drillType: 'jtbd', modalities: DRILL, status: 'ready' },
        { id: 'user-interviews', title: 'User Interviews', competency: 'voice-of-customer', methodId: 'mom-test', drillType: 'mom-test', modalities: DRILL, status: 'ready' },
        { id: 'problem-framing', title: 'Problem Framing', competency: 'voice-of-customer', methodId: 'five-whys', drillType: 'five-whys', modalities: DRILL, status: 'ready' },
        { id: 'opportunity-solution-trees', title: 'Opportunity-Solution Trees', competency: 'voice-of-customer', methodId: 'opportunity-solution-tree', modalities: SOON_LESSON, status: 'coming-soon' },
      ],
    },
    {
      id: 'u2',
      title: 'Prioritization',
      blurb: 'Decide what to build next when everything feels urgent.',
      skills: [
        // The four live prioritization drills (deterministic, industry-aware).
        { id: 'value-vs-effort', title: 'Value vs Effort', competency: 'business-outcome', methodId: 'value-vs-effort', modalities: DRILL, status: 'ready' },
        { id: 'rice', title: 'RICE Scoring', competency: 'business-outcome', methodId: 'rice', drillType: 'rice', modalities: DRILL, status: 'ready' },
        { id: 'kano-moscow', title: 'Kano & MoSCoW', competency: 'business-outcome', methodId: 'kano', drillType: 'kano', modalities: DRILL, status: 'ready' },
        { id: 'cost-of-delay', title: 'Cost of Delay', competency: 'business-outcome', methodId: 'cost-of-delay', drillType: 'wsjf', modalities: DRILL, status: 'ready' },
      ],
    },
    {
      id: 'u3',
      title: 'Metrics & North Star',
      blurb: 'Measure what matters and ignore the vanity numbers.',
      skills: [
        { id: 'aarrr-funnel', title: 'AARRR Funnel', competency: 'data-fluency', methodId: 'aarrr', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'activation-retention', title: 'Activation & Retention', competency: 'data-fluency', methodId: 'heart', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'north-star', title: 'North Star & OKRs', competency: 'business-outcome', methodId: 'north-star', modalities: SOON_LESSON, status: 'coming-soon' },
      ],
    },
    {
      id: 'u4',
      title: 'Experimentation',
      blurb: 'Design honest tests and read results without fooling yourself.',
      skills: [
        { id: 'ab-test-design', title: 'A/B Test Design', competency: 'data-fluency', methodId: 'hypothesis-cards', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'reading-results', title: 'Significance & Cohorts', competency: 'data-fluency', modalities: SOON_LESSON, status: 'coming-soon' },
      ],
    },
    {
      id: 'u5',
      title: 'Roadmapping & Positioning',
      blurb: 'Sequence the bets and say what the product is for.',
      skills: [
        { id: 'roadmapping', title: 'Roadmapping', competency: 'vision-roadmap', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'positioning-basics', title: 'Positioning Basics', competency: 'business-outcome', modalities: SOON_LESSON, status: 'coming-soon' },
      ],
    },
  ],

  /* ---------------------------------------------------------------
     SENIOR PM — strategy + influence.
     --------------------------------------------------------------- */
  senior: [
    {
      id: 'u1',
      title: 'Strategy & Vision',
      blurb: 'Set a direction worth committing a team to.',
      skills: [
        { id: 'product-strategy-stack', title: 'Product Strategy Stack', competency: 'strategic-impact', methodId: 'lean-canvas', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'product-vision', title: 'Vision & Strategic Intent', competency: 'vision-roadmap', methodId: 'vision-board', modalities: SOON_LESSON, status: 'coming-soon' },
      ],
    },
    {
      id: 'u2',
      title: 'Growth & Monetization',
      blurb: 'Build the loops and the model that compound value.',
      skills: [
        { id: 'growth-loops-retention', title: 'Growth Loops & Retention', competency: 'business-outcome', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'monetization-pricing', title: 'Monetization & Pricing', competency: 'business-outcome', modalities: SOON_LESSON, status: 'coming-soon' },
      ],
    },
    {
      id: 'u3',
      title: 'Go-to-Market',
      blurb: 'Position, write the launch narrative, and de-risk it.',
      skills: [
        // PR-FAQ — existing free-text drill, industry-aware.
        { id: 'pr-faq', title: 'PR-FAQ & Launch', competency: 'vision-roadmap', methodId: 'pr-faq', drillType: 'pr-faq', modalities: DRILL, status: 'ready' },
        // Pre-mortem — existing free-text drill, industry-aware.
        { id: 'pre-mortem', title: 'Pre-Mortem', competency: 'strategic-impact', methodId: 'pre-mortem', drillType: 'pre-mortem', modalities: DRILL, status: 'ready' },
      ],
    },
    {
      id: 'u4',
      title: 'Influence',
      blurb: 'Move people and decisions without the org chart.',
      skills: [
        { id: 'stakeholder-management', title: 'Stakeholder Management', competency: 'stakeholder-mgmt', methodId: 'raci', modalities: ['lesson', 'roleplay'], status: 'coming-soon' },
        { id: 'influence-without-authority', title: 'Influence Without Authority', competency: 'stakeholder-mgmt', modalities: ['lesson', 'roleplay'], status: 'coming-soon' },
        { id: 'managing-up', title: 'Managing Up', competency: 'managing-up', modalities: ['lesson', 'roleplay'], status: 'coming-soon' },
      ],
    },
  ],

  /* ---------------------------------------------------------------
     STAFF / PRINCIPAL — leverage (IC branch).
     --------------------------------------------------------------- */
  staff: [
    {
      id: 'u1',
      title: 'Judgment',
      blurb: 'Decide well when the data runs out.',
      skills: [
        { id: 'judgment-under-ambiguity', title: 'Judgment Under Ambiguity', competency: 'strategic-impact', methodId: 'one-way-doors', modalities: ['lesson', 'judgment'], status: 'coming-soon' },
        { id: 'framing-problems', title: 'Framing Problems for Others', competency: 'strategic-impact', modalities: ['lesson', 'judgment'], status: 'coming-soon' },
        { id: 'hard-tradeoffs', title: 'Hard Tradeoffs', competency: 'strategic-impact', methodId: 'cost-of-inaction', modalities: ['lesson', 'judgment'], status: 'coming-soon' },
      ],
    },
    {
      id: 'u2',
      title: 'Scope & Leverage',
      blurb: 'Think across teams, platforms, and portfolios.',
      skills: [
        { id: 'multi-team-strategy', title: 'Multi-Team Strategy', competency: 'strategic-impact', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'platform-portfolio-thinking', title: 'Platform & Portfolio Thinking', competency: 'vision-roadmap', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'force-multiplier-influence', title: 'Force-Multiplier Influence', competency: 'team-leadership', modalities: ['lesson', 'roleplay'], status: 'coming-soon' },
      ],
    },
  ],

  /* ---------------------------------------------------------------
     DIRECTOR / VP — the org (management branch).
     --------------------------------------------------------------- */
  director: [
    {
      id: 'u1',
      title: 'Leading Teams',
      blurb: 'Build empowered teams and the people on them.',
      skills: [
        { id: 'empowered-teams', title: 'Empowered Teams', competency: 'team-leadership', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'org-design', title: 'Org Design', competency: 'team-leadership', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'hiring-coaching-pms', title: 'Hiring & Coaching PMs', competency: 'team-leadership', modalities: ['lesson', 'roleplay'], status: 'coming-soon' },
      ],
    },
    {
      id: 'u2',
      title: 'The Operating Model',
      blurb: 'Make the system that makes the product.',
      skills: [
        { id: 'product-operating-model', title: 'Product Operating Model', competency: 'strategic-impact', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'pnl-business-acumen', title: 'P&L & Business Acumen', competency: 'business', modalities: SOON_LESSON, status: 'coming-soon' },
      ],
    },
    {
      id: 'u3',
      title: 'Culture & The Top Job',
      blurb: 'Set the culture and step into product leadership.',
      skills: [
        { id: 'product-culture', title: 'Product Culture', competency: 'team-leadership', modalities: SOON_LESSON, status: 'coming-soon' },
        { id: 'cpo-transition', title: 'The CPO Transition', competency: 'strategic-impact', modalities: SOON_LESSON, status: 'coming-soon' },
      ],
    },
  ],
};

/* ==================================================================
   SPECIALIZATION TRACKS — off-ladder depth (conceptually unlock at senior+).
   All coming-soon for now; surfaced in their own Practice Map section.
   ================================================================== */
type TrackSeed = {
  id: TrackId;
  label: string;
  summary: string;
  skills: SkillSeed[];
};

const TRACK_SEEDS: TrackSeed[] = [
  {
    id: 'growth',
    label: 'Growth',
    summary: 'Loops, funnels, and retention as a system.',
    skills: [
      { id: 'track-growth-loops', title: 'Growth Loops', competency: 'business-outcome', modalities: SOON_LESSON, status: 'coming-soon' },
      { id: 'track-growth-experimentation', title: 'Growth Experimentation', competency: 'data-fluency', modalities: SOON_LESSON, status: 'coming-soon' },
    ],
  },
  {
    id: 'platform-api',
    label: 'Platform & API',
    summary: 'Products whose customers are other builders.',
    skills: [
      { id: 'track-platform-thinking', title: 'Platform Thinking', competency: 'technical', modalities: SOON_LESSON, status: 'coming-soon' },
      { id: 'track-api-as-product', title: 'API as Product', competency: 'technical', modalities: SOON_LESSON, status: 'coming-soon' },
    ],
  },
  {
    id: 'ai-ml',
    label: 'AI / ML',
    summary: 'Evals, prompt & context engineering, agents, AI-fit judgment.',
    skills: [
      { id: 'track-ai-fit-judgment', title: 'AI-Fit Judgment', competency: 'technical', modalities: ['lesson', 'judgment'], status: 'coming-soon' },
      { id: 'track-prompt-context-eng', title: 'Prompt & Context Engineering', competency: 'technical', modalities: SOON_LESSON, status: 'coming-soon' },
      { id: 'track-evals', title: 'Evals & Quality', competency: 'quality', modalities: SOON_LESSON, status: 'coming-soon' },
      { id: 'track-agents', title: 'Agentic Products', competency: 'technical', modalities: SOON_LESSON, status: 'coming-soon' },
    ],
  },
  {
    id: 'monetization',
    label: 'Monetization',
    summary: 'Packaging, pricing, and the business model.',
    skills: [
      { id: 'track-pricing-strategy', title: 'Pricing Strategy', competency: 'business-outcome', modalities: SOON_LESSON, status: 'coming-soon' },
      { id: 'track-packaging-tiers', title: 'Packaging & Tiers', competency: 'business-outcome', modalities: SOON_LESSON, status: 'coming-soon' },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    summary: 'Two-sided liquidity, matching, and trust.',
    skills: [
      { id: 'track-marketplace-liquidity', title: 'Liquidity & Matching', competency: 'business-outcome', modalities: SOON_LESSON, status: 'coming-soon' },
      { id: 'track-marketplace-trust', title: 'Trust & Safety', competency: 'ethics', modalities: SOON_LESSON, status: 'coming-soon' },
    ],
  },
  {
    id: 'b2b-b2c',
    label: 'B2B / B2C',
    summary: 'How buyer, user, and motion differ across the divide.',
    skills: [
      { id: 'track-b2b-motion', title: 'B2B Motion', competency: 'business', modalities: SOON_LESSON, status: 'coming-soon' },
      { id: 'track-b2c-motion', title: 'B2C Motion', competency: 'business', modalities: SOON_LESSON, status: 'coming-soon' },
    ],
  },
  {
    id: 'zero-to-one',
    label: 'Zero-to-One',
    summary: 'Finding product-market fit from nothing.',
    skills: [
      { id: 'track-finding-pmf', title: 'Finding PMF', competency: 'voice-of-customer', modalities: ['lesson', 'judgment'], status: 'coming-soon' },
      { id: 'track-first-wedge', title: 'The First Wedge', competency: 'strategic-impact', modalities: SOON_LESSON, status: 'coming-soon' },
    ],
  },
];

/* ==================================================================
   ASSEMBLY — turn the terse seeds into fully-numbered Units/Skills.

   `index` is a single running counter across the whole ladder (so the
   "Skill 0X" label stays globally unique and stable). Unit `number` resets per
   level. `hasLesson` is mirrored from `status === 'ready'` exactly once here.
   ================================================================== */
let runningIndex = 0;

function buildSkill(seed: SkillSeed, unitId: string, level: LevelId): Skill {
  runningIndex += 1;
  return {
    id: seed.id,
    title: seed.title,
    unitId,
    index: runningIndex,
    level,
    competency: seed.competency,
    modalities: seed.modalities,
    status: seed.status,
    methodId: seed.methodId,
    drillType: seed.drillType,
    hasLesson: seed.status === 'ready',
  };
}

/** Every unit across every level, in ladder order. */
export const units: Unit[] = levels.flatMap((level) =>
  (LEVEL_UNITS[level.id] ?? []).map((unitSeed, i) => {
    const unitId = `${level.id}-${unitSeed.id}`;
    return {
      id: unitId,
      levelId: level.id,
      number: i + 1,
      title: unitSeed.title,
      blurb: unitSeed.blurb,
      skills: unitSeed.skills.map((s) => buildSkill(s, unitId, level.id)),
    };
  }),
);

/** Specialization tracks (off-ladder). Track skills carry `track`, not `level`. */
export const tracks: Track[] = TRACK_SEEDS.map((seed, i) => ({
  id: seed.id,
  label: seed.label,
  order: i + 1,
  summary: seed.summary,
  skills: seed.skills.map((s) => {
    runningIndex += 1;
    return {
      id: s.id,
      title: s.title,
      unitId: `track-${seed.id}`,
      index: runningIndex,
      track: seed.id,
      competency: s.competency,
      modalities: s.modalities,
      status: s.status,
      methodId: s.methodId,
      drillType: s.drillType,
      hasLesson: s.status === 'ready',
    } satisfies Skill;
  }),
}));

/* ==================================================================
   DERIVED COLLECTIONS + LOOKUPS.
   ================================================================== */

/** Flat list of every LADDER skill, in curriculum order (excludes tracks). */
export const allSkills: Skill[] = units.flatMap((u) => u.skills);

/** Flat list of every TRACK skill. */
export const allTrackSkills: Skill[] = tracks.flatMap((t) => t.skills);

/** Every skill in the system — ladder + tracks (used for route generation). */
export const everySkill: Skill[] = [...allSkills, ...allTrackSkills];

/**
 * Total skills that count toward mastery = the `ready` ladder skills.
 *
 * GATING RULE (documented once, used everywhere):
 *  - `coming-soon` skills are placeholders. They never count toward the mastery
 *    denominator and never block progression — otherwise the map would feel
 *    permanently stuck at a tiny percentage and every level past the first
 *    would be unreachable. So "mastery" is measured against the *playable*
 *    curriculum only.
 *  - A LEVEL is unlocked once every `ready` skill in all PRIOR core levels is
 *    mastered (see `isLevelUnlocked`). Post-senior branches (staff/director)
 *    unlock off Senior. Levels with zero `ready` skills are treated as already
 *    satisfied for gating purposes so they don't wall off the ladder.
 */
export const masterableSkills: Skill[] = allSkills.filter((s) => s.status === 'ready');

/** Count of skills that count toward the headline mastery number. */
export const TOTAL_SKILLS = masterableSkills.length;

/** Count of every ladder skill, ready + coming-soon (for "N skills" copy). */
export const TOTAL_LADDER_SKILLS = allSkills.length;

export function getLevel(id: LevelId): Level | undefined {
  return levels.find((l) => l.id === id);
}

/** Units belonging to a level, in order. */
export function getUnitsForLevel(levelId: LevelId): Unit[] {
  return units.filter((u) => u.levelId === levelId);
}

export function getSkill(id: string): Skill | undefined {
  return everySkill.find((s) => s.id === id);
}

export function getUnit(id: string): Unit | undefined {
  return units.find((u) => u.id === id);
}

export function getUnitForSkill(skillId: string): Unit | undefined {
  return units.find((u) => u.skills.some((s) => s.id === skillId));
}

/**
 * The next *playable* skill after the given one in ladder order, if any.
 *
 * Used by lessons for the "next skill" affordance. We skip `coming-soon` skills
 * so the hand-off always lands on something the learner can actually do; we
 * also skip across track skills (those aren't part of the linear ladder).
 */
export function getNextSkill(id: string): Skill | undefined {
  const i = allSkills.findIndex((s) => s.id === id);
  if (i === -1) return undefined;
  for (let j = i + 1; j < allSkills.length; j += 1) {
    if (allSkills[j].status === 'ready') return allSkills[j];
  }
  return undefined;
}

/* ==================================================================
   STATE DERIVATION — mastery → display state.
   ================================================================== */

/**
 * The `ready` skills a level requires for the NEXT level to unlock.
 * Empty array ⇒ nothing to require (the level is "free" for gating).
 */
function readySkillsOfLevel(levelId: LevelId): Skill[] {
  return allSkills.filter((s) => s.level === levelId && s.status === 'ready');
}

/**
 * Is this level unlocked given the mastered set?
 *
 *  - `foundations` is always unlocked (the entry point).
 *  - A `core` level unlocks once every `ready` skill in all earlier core levels
 *    is mastered. Earlier levels with no `ready` skills impose no requirement.
 *  - The post-senior branches (`ic` = staff, `management` = director) unlock
 *    off the same bar as the level immediately after Senior: once Senior's
 *    `ready` skills (and everything before) are mastered.
 */
export function isLevelUnlocked(
  levelId: LevelId,
  masteredIds: ReadonlySet<string>,
): boolean {
  const level = getLevel(levelId);
  if (!level) return false;
  if (levelId === 'foundations') return true;

  // The "spine" prerequisite for any level is: all core levels strictly before
  // Senior+ that precede this one in `order`. For branch levels, the gate is
  // the core spine up to and including Senior.
  const senior = getLevel('senior');
  const prereqCeilingOrder =
    level.branch === 'core' ? level.order : (senior?.order ?? level.order) + 1;

  const requiredLevels = levels.filter(
    (l) => l.branch === 'core' && l.order < prereqCeilingOrder,
  );

  return requiredLevels.every((l) =>
    readySkillsOfLevel(l.id).every((s) => masteredIds.has(s.id)),
  );
}

/**
 * Derive a skill's display state from persisted mastery.
 *
 * Rules (Duolingo-style linear unlock over the *playable* curriculum):
 *  - A `coming-soon` skill is always `locked` (it isn't playable yet, but it is
 *    rendered with a distinct "coming soon" treatment — see SkillCard).
 *  - A skill the learner has mastered → `mastered`.
 *  - In a LOCKED level, every skill is `locked`.
 *  - In an UNLOCKED level, the first un-mastered `ready` skill *of the whole
 *    ladder* is the single `active` node; earlier-in-order ready skills that
 *    aren't mastered can't exist (they'd have been the active one), and later
 *    ready skills are `locked` to keep the path scannable.
 */
export function deriveSkillState(
  skillId: string,
  masteredIds: ReadonlySet<string>,
): SkillState {
  const skill = getSkill(skillId);
  if (!skill) return 'locked';
  if (skill.status === 'coming-soon') return 'locked';
  if (masteredIds.has(skillId)) return 'mastered';

  // Level gating: a ready skill in a locked level stays locked.
  if (skill.level && !isLevelUnlocked(skill.level, masteredIds)) return 'locked';

  // The single active node is the first un-mastered *ready* ladder skill.
  const firstPlayable = masterableSkills.find((s) => !masteredIds.has(s.id));
  if (firstPlayable && firstPlayable.id === skillId) return 'active';

  return 'locked';
}

/**
 * True once every `ready` skill in the unit is mastered.
 *
 * A unit with no `ready` skills (all coming-soon) is never "complete" — it has
 * nothing to master yet — so it reads as upcoming rather than done.
 */
export function isUnitComplete(unitId: string, masteredIds: ReadonlySet<string>): boolean {
  const unit = getUnit(unitId);
  if (!unit) return false;
  const ready = unit.skills.filter((s) => s.status === 'ready');
  if (ready.length === 0) return false;
  return ready.every((s) => masteredIds.has(s.id));
}

/** True when the unit contains the single active node. */
export function isUnitCurrent(unitId: string, masteredIds: ReadonlySet<string>): boolean {
  const unit = getUnit(unitId);
  if (!unit) return false;
  return unit.skills.some((s) => deriveSkillState(s.id, masteredIds) === 'active');
}

/** A level is complete once all its `ready` skills are mastered. */
export function isLevelComplete(levelId: LevelId, masteredIds: ReadonlySet<string>): boolean {
  const ready = readySkillsOfLevel(levelId);
  if (ready.length === 0) return false;
  return ready.every((s) => masteredIds.has(s.id));
}

/** True when the level contains the single active node. */
export function isLevelCurrent(levelId: LevelId, masteredIds: ReadonlySet<string>): boolean {
  return getUnitsForLevel(levelId).some((u) => isUnitCurrent(u.id, masteredIds));
}
