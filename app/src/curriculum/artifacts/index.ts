/**
 * Artifact content registry.
 *
 * Every authored artifact is collected here and keyed by its `skillId`, so the
 * lesson router can ask "does this skill have an artifact to practise?" with a
 * single lookup, exactly like the concept-lesson registry. Adding an artifact is
 * two lines: import the content file and list it in `ALL_ARTIFACTS`. The runtime
 * check guarantees each artifact's `skillId` is unique.
 */
import type { ArtifactContent } from './types';
import { onePagePrd } from './one-page-prd';
import { strategyMemo } from './strategy-memo';
import { experimentPlan } from './experiment-plan';
import { northStarTree } from './north-star-tree';
import { positioningStatement } from './positioning-statement';

/**
 * Every authored artifact, in curriculum order (ladder level → unit).
 *
 * Each artifact is its OWN practice skill, sitting beside the concept lesson that
 * teaches the same topic (the comments name the sibling lesson). Keying artifacts
 * to dedicated skill ids is what lets the lesson router send a skill to exactly
 * one modality, so both the lesson and the artifact stay reachable.
 */
export const ALL_ARTIFACTS: ArtifactContent[] = [
  onePagePrd, // 'prd-artifact' · Associate PM, beside PRDs & Specs
  experimentPlan, // 'experiment-plan' · PM, beside A/B Test Design
  northStarTree, // 'north-star-tree' · PM, beside North Star & OKRs
  positioningStatement, // 'positioning-statement' · PM, beside Positioning Basics
  strategyMemo, // 'strategy-memo' · Senior PM, beside Product Strategy Stack
];

/** skillId -> artifact. Throws at module load on a duplicate skillId. */
export const ARTIFACT_CONTENT: Record<string, ArtifactContent> = (() => {
  const map: Record<string, ArtifactContent> = {};
  for (const a of ALL_ARTIFACTS) {
    if (map[a.skillId]) {
      throw new Error(`Duplicate artifact for skillId "${a.skillId}"`);
    }
    map[a.skillId] = a;
  }
  return map;
})();

/** The artifact for a skill, or undefined when the skill has none. */
export function getArtifactContent(skillId: string): ArtifactContent | undefined {
  return ARTIFACT_CONTENT[skillId];
}

export type { ArtifactContent } from './types';
export {
  type RubricCriterion,
  type ArtifactField,
  type ArtifactValues,
  type ResolvedArtifact,
  resolveArtifact,
  composeSubmission,
  isSubmittable,
  MIN_SUBMISSION_CHARS,
} from './types';
