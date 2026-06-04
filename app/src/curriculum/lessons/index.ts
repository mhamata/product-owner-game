/**
 * Concept-lesson content registry.
 *
 * Every authored concept lesson is collected here and keyed by its `skillId`, so
 * the lesson router can ask "does this skill have a teaching lesson?" with a
 * single lookup. Adding a lesson is two lines: import the content file and list
 * it in `LESSON_CONTENT`. The runtime check below guarantees each lesson's
 * `skillId` is unique and self-consistent.
 */
import type { ConceptLessonContent } from './types';

// Foundations
import { whatPmIs } from './what-pm-is';
import { productLifecycle } from './product-lifecycle';
import { fourBigRisks } from './four-big-risks';
import { workingWithEngDesign } from './working-with-eng-design';
import { agileScrum } from './agile-scrum';
import { technicalLiteracy } from './technical-literacy';
import { metricsLiteracy } from './metrics-literacy';

// Associate PM
import { prdsAndSpecs } from './prds-and-specs';
import { userStories } from './user-stories';
import { backlogSprintsKanban } from './backlog-sprints-kanban';
import { storyMapping } from './story-mapping';
import { qualityAndDelivery } from './quality-and-delivery';

/** Every authored concept lesson, in curriculum order. */
export const ALL_LESSONS: ConceptLessonContent[] = [
  // Foundations
  whatPmIs,
  productLifecycle,
  fourBigRisks,
  workingWithEngDesign,
  agileScrum,
  technicalLiteracy,
  metricsLiteracy,
  // Associate PM
  prdsAndSpecs,
  userStories,
  backlogSprintsKanban,
  storyMapping,
  qualityAndDelivery,
];

/** skillId → concept lesson content. Built once; the source of truth for lookups. */
export const LESSON_CONTENT: Record<string, ConceptLessonContent> = Object.fromEntries(
  ALL_LESSONS.map((lesson) => [lesson.skillId, lesson]),
);

/** The concept lesson for a skill, or undefined if none is authored yet. */
export function getLessonContent(skillId: string): ConceptLessonContent | undefined {
  return LESSON_CONTENT[skillId];
}

/** True when a skill has an authored concept lesson. */
export function hasLessonContent(skillId: string): boolean {
  return skillId in LESSON_CONTENT;
}

export type { ConceptLessonContent } from './types';
