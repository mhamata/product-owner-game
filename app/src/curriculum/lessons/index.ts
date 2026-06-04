/**
 * Concept-lesson content registry.
 *
 * Every authored concept lesson is collected here and keyed by its `skillId`, so
 * the lesson router can ask "does this skill have a teaching lesson?" with a
 * single lookup. Adding a lesson is two lines: import the content file and list
 * it in `ALL_LESSONS`. The grouping and order below mirror `curriculum/data.ts`
 * (level → unit) so this file can be scanned against the ladder. The runtime
 * check in `LESSON_CONTENT` guarantees each lesson's `skillId` is unique.
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

// Product Manager
import { opportunitySolutionTrees } from './opportunity-solution-trees';
import { aarrrFunnel } from './aarrr-funnel';
import { activationRetention } from './activation-retention';
import { northStar } from './north-star';
import { abTestDesign } from './ab-test-design';
import { readingResults } from './reading-results';
import { roadmapping } from './roadmapping';
import { positioningBasics } from './positioning-basics';

// Senior PM
import { productStrategyStack } from './product-strategy-stack';
import { productVision } from './product-vision';
import { growthLoopsRetention } from './growth-loops-retention';
import { monetizationPricing } from './monetization-pricing';
import { stakeholderManagement } from './stakeholder-management';
import { influenceWithoutAuthority } from './influence-without-authority';
import { managingUp } from './managing-up';

// Staff / Principal PM
import { judgmentUnderAmbiguity } from './judgment-under-ambiguity';
import { framingProblems } from './framing-problems';
import { hardTradeoffs } from './hard-tradeoffs';
import { multiTeamStrategy } from './multi-team-strategy';
import { platformPortfolioThinking } from './platform-portfolio-thinking';
import { forceMultiplierInfluence } from './force-multiplier-influence';

// Director / VP Product
import { empoweredTeams } from './empowered-teams';
import { orgDesign } from './org-design';
import { hiringCoachingPms } from './hiring-coaching-pms';
import { productOperatingModel } from './product-operating-model';
import { pnlBusinessAcumen } from './pnl-business-acumen';
import { productCulture } from './product-culture';
import { cpoTransition } from './cpo-transition';

/** Every authored concept lesson, in curriculum (level → unit) order. */
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
  // Product Manager
  opportunitySolutionTrees,
  aarrrFunnel,
  activationRetention,
  northStar,
  abTestDesign,
  readingResults,
  roadmapping,
  positioningBasics,
  // Senior PM
  productStrategyStack,
  productVision,
  growthLoopsRetention,
  monetizationPricing,
  stakeholderManagement,
  influenceWithoutAuthority,
  managingUp,
  // Staff / Principal PM
  judgmentUnderAmbiguity,
  framingProblems,
  hardTradeoffs,
  multiTeamStrategy,
  platformPortfolioThinking,
  forceMultiplierInfluence,
  // Director / VP Product
  empoweredTeams,
  orgDesign,
  hiringCoachingPms,
  productOperatingModel,
  pnlBusinessAcumen,
  productCulture,
  cpoTransition,
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
