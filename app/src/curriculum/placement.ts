/**
 * PLACEMENT CHALLENGE: the data layer for "test out of a level".
 *
 * An experienced PM should not have to click through every lesson to prove they
 * already know a level. The placement challenge lets them demonstrate it: a
 * short set of comprehension-check questions drawn from the level's `ready`
 * skills' concept lessons, graded by the exact same predicate the lessons use.
 *
 * HONESTY
 * -------
 * Passing the challenge is demonstrated competence on the same questions the
 * lessons gate on, so recording the level's skills as mastered is legitimate. A
 * failing run records NOTHING (the caller routes the learner into the level to
 * learn it normally). The bar lives here, beside the assembler, so the rule and
 * the questions can't drift apart.
 *
 * DETERMINISM
 * -----------
 * The question set is selected deterministically (curriculum order, stable
 * composite ids), not shuffled per render. That keeps server + first client
 * paint identical (no hydration mismatch) and makes the flow testable. Industry
 * `Flavoured` fields are resolved later in the component, exactly as a lesson
 * does, so the challenge speaks the learner's industry.
 */
import type { CheckQuestion } from './lessons/types';
import { getLessonContent } from './lessons';
import { allSkills, getLevel, readySkillIdsOfLevel } from './data';
import type { LevelId } from './types';

/** Passing bar for a placement challenge: at least 80 percent correct. */
export const PLACEMENT_PASS_RATIO = 0.8;

/** Target number of questions in a challenge (we aim for the middle of 5-8). */
const TARGET_QUESTIONS = 6;
/** Never assemble a challenge shorter than this many questions. */
const MIN_QUESTIONS = 5;
/** Hard cap so the challenge stays "a handful", not a final exam. */
const MAX_QUESTIONS = 8;

/**
 * One question in a placement challenge: the underlying check question plus the
 * skill it came from and a globally-unique composite id.
 *
 * The composite id matters: every lesson numbers its own questions `q1`, `q2`,
 * so two skills in the same level collide on bare ids. `${skillId}::${q.id}`
 * keeps each answerable independently and lets a pass map cleanly back to skills.
 */
export interface PlacementQuestion {
  /** Globally-unique id within the challenge: `${skillId}::${question.id}`. */
  uid: string;
  /** The skill whose lesson this question is drawn from. */
  skillId: string;
  /** Human title of that skill, for the per-question source label. */
  skillTitle: string;
  /** The original (still-flavoured) check question. */
  question: CheckQuestion;
}

export interface PlacementChallenge {
  levelId: LevelId;
  /** Human level label, e.g. "Associate PM". */
  levelLabel: string;
  /** The selected questions, in a stable order. */
  questions: PlacementQuestion[];
  /** Every `ready` skill id this challenge can certify on a pass. */
  coveredSkillIds: string[];
  /** Correct answers needed to pass (ceil of ratio * count). */
  passMark: number;
}

/**
 * The `ready` skills of a level that have an authored concept lesson with at
 * least one check question, in curriculum order. These are the only skills a
 * challenge can draw from (a drill-only skill has no multiple-choice check to
 * reuse here).
 */
function lessonedReadySkills(levelId: LevelId): { id: string; title: string; questions: CheckQuestion[] }[] {
  const readyIds = new Set(readySkillIdsOfLevel(levelId));
  return allSkills
    .filter((s) => readyIds.has(s.id))
    .map((s) => {
      const lesson = getLessonContent(s.id);
      const questions = lesson?.check.questions ?? [];
      return { id: s.id, title: s.title, questions };
    })
    .filter((s) => s.questions.length > 0);
}

/**
 * Assemble the placement challenge for a level, or `null` if the level can't be
 * tested out of yet (no `ready` lessoned skills, or too few questions to make a
 * fair challenge).
 *
 * Selection is breadth-first across skills so the challenge spreads over the
 * level's competencies rather than over-sampling one skill: take each skill's
 * first question, then (if we still need more to clear MIN) their second, and so
 * on, capped at MAX. Deterministic given the curriculum, so it is hydration-safe
 * and testable.
 */
export function buildPlacementChallenge(levelId: LevelId): PlacementChallenge | null {
  const level = getLevel(levelId);
  if (!level) return null;

  const skills = lessonedReadySkills(levelId);
  if (skills.length === 0) return null;

  // Breadth-first round-robin: column 0 is every skill's first question, etc.
  const maxDepth = Math.max(...skills.map((s) => s.questions.length));
  const selected: PlacementQuestion[] = [];
  for (let depth = 0; depth < maxDepth && selected.length < MAX_QUESTIONS; depth += 1) {
    for (const skill of skills) {
      if (selected.length >= MAX_QUESTIONS) break;
      const q = skill.questions[depth];
      if (!q) continue;
      // Stop adding deeper rounds once we have a full, fair-length challenge.
      if (depth > 0 && selected.length >= TARGET_QUESTIONS) break;
      selected.push({
        uid: `${skill.id}::${q.id}`,
        skillId: skill.id,
        skillTitle: skill.title,
        question: q,
      });
    }
  }

  // A challenge needs enough questions to be a real demonstration. If the level
  // simply doesn't have that many authored checks, it isn't testable yet.
  if (selected.length < MIN_QUESTIONS) return null;

  const passMark = Math.ceil(selected.length * PLACEMENT_PASS_RATIO);

  return {
    levelId,
    levelLabel: level.label,
    questions: selected,
    // Every ready skill in the level is certified on a pass, not only the ones
    // a question happened to be drawn from: passing demonstrates the level.
    coveredSkillIds: readySkillIdsOfLevel(levelId),
    passMark,
  };
}

/** True when a level can be tested out of (has a buildable challenge). */
export function canTestOut(levelId: LevelId): boolean {
  return buildPlacementChallenge(levelId) !== null;
}

/**
 * Did a placement attempt pass? `correctCount` is how many questions were
 * answered correctly out of `total`. Passing requires clearing
 * {@link PLACEMENT_PASS_RATIO} (>= 80 percent), matching `passMark`.
 */
export function isPlacementPass(correctCount: number, total: number): boolean {
  if (total === 0) return false;
  return correctCount / total >= PLACEMENT_PASS_RATIO;
}
