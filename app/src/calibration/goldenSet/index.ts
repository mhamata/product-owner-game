import { ARTIFACT_CONTENT } from '@/curriculum/artifacts';
import { isIndustryId } from '@/curriculum/industries';
import type { GoldenItem } from '../types';
import { PRD_GOLDEN } from './prd';
import { EXPERIMENT_GOLDEN } from './experiment';
import { MEMO_GOLDEN } from './memo';

/** The full golden set, in study order. */
export const GOLDEN_SET: GoldenItem[] = [...PRD_GOLDEN, ...EXPERIMENT_GOLDEN, ...MEMO_GOLDEN];

/**
 * Structural integrity check, run by the CLI before any spend and by the test
 * suite on every commit. Returns a list of problems; empty means sound.
 */
export function validateGoldenSet(items: GoldenItem[] = GOLDEN_SET): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    const where = `item "${item.id}"`;

    if (seenIds.has(item.id)) problems.push(`${where}: duplicate id`);
    seenIds.add(item.id);

    const content = ARTIFACT_CONTENT[item.artifactSkillId];
    if (!content) {
      problems.push(`${where}: unknown artifactSkillId "${item.artifactSkillId}"`);
      continue;
    }
    const rubricIds = new Set(content.rubric.map((c) => c.id));

    if (!isIndustryId(item.industry)) problems.push(`${where}: unknown industry "${item.industry}"`);
    if (item.submission.trim().length < 150) problems.push(`${where}: submission is suspiciously short`);
    if (item.raters.length === 0) problems.push(`${where}: no raters`);

    const raterIds = new Set<string>();
    for (const rater of item.raters) {
      if (raterIds.has(rater.raterId)) problems.push(`${where}: duplicate rater "${rater.raterId}"`);
      raterIds.add(rater.raterId);

      const keys = Object.keys(rater.criteria);
      for (const key of keys) {
        if (!rubricIds.has(key)) problems.push(`${where}: rater "${rater.raterId}" scored unknown criterion "${key}"`);
        const v = rater.criteria[key];
        if (!Number.isInteger(v) || v < 0 || v > 3) {
          problems.push(`${where}: rater "${rater.raterId}" criterion "${key}" score ${v} outside 0-3`);
        }
      }
      for (const id of rubricIds) {
        if (!(id in rater.criteria)) {
          problems.push(`${where}: rater "${rater.raterId}" missing criterion "${id}"`);
        }
      }
    }
  }
  return problems;
}
