import type Anthropic from '@anthropic-ai/sdk';
import { ARTIFACT_CONTENT, resolveArtifact } from '@/curriculum/artifacts';
import { INDUSTRIES, INDUSTRY_NOUNS, type IndustryId } from '@/curriculum/industries';
import type { IndustryContext } from '@/curriculum/lessons/types';
import { gradeArtifact } from '@/lib/artifactGrader';
import { gradeArtifactV2 } from '@/lib/artifactGraderV2';
import type { GraderVersion } from './cliOptions';
import type { CriterionBand, GoldenItem, GraderRun } from './types';

/**
 * Grades golden-set items with the PRODUCTION grading core. The brief is
 * re-resolved from the item's recorded industry so the grader sees the same
 * scenario the submission was written against.
 */

export function industryContext(id: IndustryId): IndustryContext {
  const industry = INDUSTRIES.find((i) => i.id === id);
  if (!industry) throw new Error(`Unknown industry: ${id}`);
  return { id, label: industry.label, ...INDUSTRY_NOUNS[id] };
}

/** One graded run of one golden item, using the live grading contract. */
export async function gradeGoldenItem(client: Anthropic, item: GoldenItem): Promise<GraderRun> {
  const content = ARTIFACT_CONTENT[item.artifactSkillId];
  if (!content) throw new Error(`No artifact content for skillId "${item.artifactSkillId}"`);

  const resolved = resolveArtifact(content, industryContext(item.industry));
  const { verdict } = await gradeArtifact(client, {
    skillId: resolved.skillId,
    artifactTitle: resolved.title,
    brief: resolved.brief.join('\n\n'),
    rubric: resolved.rubric,
    graderInstructions: resolved.graderInstructions,
    submission: item.submission,
  });

  if (!verdict || verdict.criteria.length === 0) {
    throw new Error(`Grader returned no parseable verdict for item "${item.id}"`);
  }

  // Key the ordered criteria array by id; ignore ids the rubric doesn't know
  // (a hallucinated id must not silently become a scored criterion).
  const knownIds = new Set(resolved.rubric.map((c) => c.id));
  const criteria: Record<string, CriterionBand> = {};
  for (const c of verdict.criteria) {
    if (!knownIds.has(c.id)) continue;
    criteria[c.id] = Math.max(0, Math.min(3, Math.round(c.score))) as CriterionBand;
  }

  const missing = resolved.rubric.filter((c) => criteria[c.id] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `Grader verdict for "${item.id}" is missing criteria: ${missing.map((c) => c.id).join(', ')}`,
    );
  }

  return { itemId: item.id, criteria, pass: verdict.passed, overallScore: verdict.overallScore };
}

/**
 * Grades one golden-set item with GRADING V2 (block-anchored annotations +
 * revise loop) — the version the panel study must target once the paid wedge
 * ships on v2 (docs/PHASE1.md Decisions). Golden-set items are always a first
 * pass, never a revision, so `previousSubmission`/`previousVerdict` are never
 * supplied: the delta view only exists for a learner's real second attempt.
 *
 * The per-criterion 0-3 bands are mapped into the agreement math exactly like
 * V1's verdict (same shape, same clamp-and-key-by-id logic). V2-only fields —
 * annotations, topFix, delta — are ignored for agreement purposes, but the
 * full verdict is attached as `verdictV2` so annotation quality stays
 * inspectable later (see `buildReport`'s `v2Verdicts`).
 */
export async function gradeGoldenItemV2(client: Anthropic, item: GoldenItem): Promise<GraderRun> {
  const content = ARTIFACT_CONTENT[item.artifactSkillId];
  if (!content) throw new Error(`No artifact content for skillId "${item.artifactSkillId}"`);

  const resolved = resolveArtifact(content, industryContext(item.industry));
  const { verdict } = await gradeArtifactV2(client, {
    skillId: resolved.skillId,
    artifactTitle: resolved.title,
    brief: resolved.brief.join('\n\n'),
    rubric: resolved.rubric,
    graderInstructions: resolved.graderInstructions,
    submission: item.submission,
  });

  if (!verdict || verdict.criteria.length === 0) {
    throw new Error(`Grader v2 returned no parseable verdict for item "${item.id}"`);
  }

  // Same mapping as v1: key the ordered criteria array by id, ignore ids the
  // rubric doesn't know (a hallucinated id must not silently become a scored
  // criterion), clamp into the 0-3 band.
  const knownIds = new Set(resolved.rubric.map((c) => c.id));
  const criteria: Record<string, CriterionBand> = {};
  for (const c of verdict.criteria) {
    if (!knownIds.has(c.id)) continue;
    criteria[c.id] = Math.max(0, Math.min(3, Math.round(c.score))) as CriterionBand;
  }

  const missing = resolved.rubric.filter((c) => criteria[c.id] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `Grader v2 verdict for "${item.id}" is missing criteria: ${missing.map((c) => c.id).join(', ')}`,
    );
  }

  return {
    itemId: item.id,
    criteria,
    pass: verdict.passed,
    overallScore: verdict.overallScore,
    verdictV2: verdict,
  };
}

/** Small retry wrapper: transient API failures should not sink a 30-item run. */
export async function gradeWithRetry(
  client: Anthropic,
  item: GoldenItem,
  attempts = 3,
  grader: GraderVersion = 'v1',
): Promise<GraderRun> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return grader === 'v2' ? await gradeGoldenItemV2(client, item) : await gradeGoldenItem(client, item);
    } catch (e) {
      lastError = e;
      // Linear backoff is enough here; the runner also caps concurrency.
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastError;
}

/** Grade a set of items with bounded concurrency; `runs` > 1 measures variance. */
export async function gradeGoldenSet(
  client: Anthropic,
  items: GoldenItem[],
  options: {
    runs?: number;
    concurrency?: number;
    /** Which grading contract to run. Defaults to `v1`, the frozen contract. */
    grader?: GraderVersion;
    onProgress?: (done: number, total: number) => void;
  } = {},
): Promise<GraderRun[]> {
  const runs = options.runs ?? 1;
  const concurrency = options.concurrency ?? 4;
  const grader = options.grader ?? 'v1';

  const jobs: GoldenItem[] = [];
  for (let r = 0; r < runs; r++) jobs.push(...items);

  const results: GraderRun[] = [];
  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const index = cursor++;
      const run = await gradeWithRetry(client, jobs[index], 3, grader);
      results.push(run);
      done++;
      options.onProgress?.(done, jobs.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  return results;
}
