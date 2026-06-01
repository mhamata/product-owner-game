import type { Skill, SkillState, Unit } from './types';

/**
 * The PRAXIS curriculum — 7 units, 21 skills, industry-generic.
 *
 * Each skill links (where one exists) to a method in methods/data.ts and/or an
 * existing drill component. `hasLesson` flags the skills with a working Console
 * lesson loop. Phase 2 shipped the deterministic (client-graded) drills —
 * value-vs-effort, rice, kano-moscow, cost-of-delay, estimation, and
 * problem-framing. Phase 3 adds the free-text / LLM-graded drills (jtbd,
 * user-interviews, pre-mortem, pr-faq), which submit prose to /api/grade and
 * render a coached rubric verdict in the Console feedback style.
 *
 * Mapping is intentionally generic — no finance / Moomoo content here.
 */

// Built bottom-up so each skill carries its unit id + a global 1-based index
// without hand-numbering (which drifts the moment the list changes).
type SkillSeed = Omit<Skill, 'unitId' | 'index'>;

interface UnitSeed {
  id: string;
  title: string;
  blurb: string;
  skills: SkillSeed[];
}

const UNIT_SEEDS: UnitSeed[] = [
  {
    id: 'u1',
    title: 'Discovery Foundations',
    blurb: 'Find the real problem before you fall in love with a solution.',
    skills: [
      { id: 'jtbd', title: 'Jobs To Be Done', methodId: 'jtbd', drillType: 'jtbd', hasLesson: true },
      { id: 'user-interviews', title: 'User Interviews', methodId: 'mom-test', drillType: 'mom-test', hasLesson: true },
      { id: 'problem-framing', title: 'Problem Framing', methodId: 'five-whys', drillType: 'five-whys', hasLesson: true },
    ],
  },
  {
    id: 'u2',
    title: 'Prioritization',
    blurb: 'Decide what to build next when everything feels urgent.',
    skills: [
      // The Console exemplar lesson lives here.
      { id: 'value-vs-effort', title: 'Value vs Effort', methodId: 'value-vs-effort', hasLesson: true },
      { id: 'rice', title: 'RICE Scoring', methodId: 'rice', drillType: 'rice', hasLesson: true },
      { id: 'kano-moscow', title: 'Kano & MoSCoW', methodId: 'kano', drillType: 'kano', hasLesson: true },
      { id: 'cost-of-delay', title: 'Cost of Delay', methodId: 'cost-of-delay', drillType: 'wsjf', hasLesson: true },
    ],
  },
  {
    id: 'u3',
    title: 'Metrics Fundamentals',
    blurb: 'Measure what matters and ignore the vanity numbers.',
    skills: [
      { id: 'aarrr-funnel', title: 'AARRR Funnel', methodId: 'aarrr', hasLesson: false },
      { id: 'activation-retention', title: 'Activation & Retention', methodId: 'heart', hasLesson: false },
      { id: 'north-star', title: 'North Star', methodId: 'north-star', hasLesson: false },
    ],
  },
  {
    id: 'u4',
    title: 'Execution & Delivery',
    blurb: 'Turn a plan into shipped increments without thrash.',
    skills: [
      { id: 'agile-scrum', title: 'Agile / Scrum', methodId: 'shape-up', hasLesson: false },
      { id: 'user-stories', title: 'User Stories', hasLesson: false },
      { id: 'estimation', title: 'Estimation', methodId: 't-shirt', drillType: 't-shirt', hasLesson: true },
    ],
  },
  {
    id: 'u5',
    title: 'Strategy & Vision',
    blurb: 'Set a direction worth committing a team to.',
    skills: [
      { id: 'product-vision', title: 'Product Vision', methodId: 'vision-board', hasLesson: false },
      { id: 'okrs', title: 'OKRs', methodId: 'okrs', hasLesson: false },
      { id: 'strategic-choice', title: 'Strategic Choice', methodId: 'lean-canvas', hasLesson: false },
    ],
  },
  {
    id: 'u6',
    title: 'Experimentation',
    blurb: 'Design honest tests and read the results without fooling yourself.',
    skills: [
      { id: 'ab-test-design', title: 'A/B Test Design', methodId: 'hypothesis-cards', hasLesson: false },
      { id: 'reading-results', title: 'Reading Results', hasLesson: false },
    ],
  },
  {
    id: 'u7',
    title: 'Communication & Risk',
    blurb: 'Align stakeholders and surface risk before it ships.',
    skills: [
      { id: 'pr-faq', title: 'PR-FAQ', methodId: 'pr-faq', drillType: 'pr-faq', hasLesson: true },
      { id: 'roadmapping', title: 'Roadmapping', hasLesson: false },
      { id: 'pre-mortem', title: 'Pre-Mortem', methodId: 'pre-mortem', drillType: 'pre-mortem', hasLesson: true },
    ],
  },
];

let runningIndex = 0;
export const units: Unit[] = UNIT_SEEDS.map((unitSeed, i) => ({
  id: unitSeed.id,
  number: i + 1,
  title: unitSeed.title,
  blurb: unitSeed.blurb,
  skills: unitSeed.skills.map((skill) => {
    runningIndex += 1;
    return { ...skill, unitId: unitSeed.id, index: runningIndex };
  }),
}));

/** Flat list of every skill, in curriculum order. */
export const allSkills: Skill[] = units.flatMap((u) => u.skills);

/** Total skills across the curriculum (derived, never hard-coded). */
export const TOTAL_SKILLS = allSkills.length;

export function getSkill(id: string): Skill | undefined {
  return allSkills.find((s) => s.id === id);
}

export function getUnit(id: string): Unit | undefined {
  return units.find((u) => u.id === id);
}

export function getUnitForSkill(skillId: string): Unit | undefined {
  return units.find((u) => u.skills.some((s) => s.id === skillId));
}

/** The skill immediately after the given one in curriculum order, if any. */
export function getNextSkill(id: string): Skill | undefined {
  const i = allSkills.findIndex((s) => s.id === id);
  if (i === -1 || i === allSkills.length - 1) return undefined;
  return allSkills[i + 1];
}

/**
 * Derive a skill's display state from persisted mastery.
 *
 * Rules (Duolingo-style linear unlock):
 *  - A skill the learner has mastered → 'mastered'.
 *  - The first un-mastered skill in curriculum order → 'active' (the playable node).
 *  - Any later un-mastered skill whose prerequisites are met but isn't the
 *    single active node → 'available' (kept for future free-practice; today the
 *    map renders these as locked to stay scannable like the mockup).
 *  - Everything past the active node → 'locked'.
 */
export function deriveSkillState(
  skillId: string,
  masteredIds: ReadonlySet<string>,
): SkillState {
  if (masteredIds.has(skillId)) return 'mastered';

  const firstUnmastered = allSkills.find((s) => !masteredIds.has(s.id));
  if (firstUnmastered && firstUnmastered.id === skillId) return 'active';

  return 'locked';
}

/** True once every skill in the unit is mastered. */
export function isUnitComplete(unitId: string, masteredIds: ReadonlySet<string>): boolean {
  const unit = getUnit(unitId);
  if (!unit) return false;
  return unit.skills.every((s) => masteredIds.has(s.id));
}

/** True when the unit contains the single active node. */
export function isUnitCurrent(unitId: string, masteredIds: ReadonlySet<string>): boolean {
  const unit = getUnit(unitId);
  if (!unit) return false;
  return unit.skills.some((s) => deriveSkillState(s.id, masteredIds) === 'active');
}
