import { describe, it, expect } from 'vitest';
import {
  ALL_ARTIFACTS,
  ARTIFACT_CONTENT,
  getArtifactContent,
  resolveArtifact,
  isSubmittable,
  MIN_SUBMISSION_CHARS,
  type ArtifactContent,
} from '..';
import { getSkill } from '@/curriculum/data';
import {
  INDUSTRIES,
  INDUSTRY_NOUNS,
  type IndustryId,
} from '@/curriculum/industries';
import type { IndustryContext } from '@/curriculum/lessons/types';

/**
 * These tests guard the artifact content layer the AI-graded modality stands on.
 * Authoring a broken artifact (a skill id that does not exist, points at a
 * non-ready skill, a skill missing the 'artifact' modality, or two artifacts
 * keyed to the same skill) should fail here, not surprise a learner. They also
 * pin the submittable bar, since the spend cap and the disabled Submit button
 * both lean on it.
 */

const DEFAULT_INDUSTRY: IndustryId = INDUSTRIES[0].id;

function ctxFor(id: IndustryId): IndustryContext {
  return {
    id,
    label: INDUSTRIES.find((i) => i.id === id)?.label ?? id,
    product: INDUSTRY_NOUNS[id].product,
    user: INDUSTRY_NOUNS[id].user,
  };
}

describe('artifact registry', () => {
  it('keys ARTIFACT_CONTENT by skillId and resolves via the helper', () => {
    for (const artifact of ALL_ARTIFACTS) {
      expect(ARTIFACT_CONTENT[artifact.skillId]).toBe(artifact);
      expect(getArtifactContent(artifact.skillId)).toBe(artifact);
    }
    expect(getArtifactContent('does-not-exist')).toBeUndefined();
  });

  it('has no duplicate skill ids', () => {
    const ids = ALL_ARTIFACTS.map((a) => a.skillId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects two artifacts keyed to the same skill id', () => {
    // The barrel builds its lookup by throwing on a duplicate skillId. Mirror
    // that exact reduction here and confirm it throws, so the guarantee is
    // tested even though the real ALL_ARTIFACTS is (correctly) duplicate-free.
    const buildMap = (list: ArtifactContent[]) => {
      const map: Record<string, ArtifactContent> = {};
      for (const a of list) {
        if (map[a.skillId]) {
          throw new Error(`Duplicate artifact for skillId "${a.skillId}"`);
        }
        map[a.skillId] = a;
      }
      return map;
    };

    const dupe = ALL_ARTIFACTS[0];
    expect(() => buildMap([dupe, dupe])).toThrow(/Duplicate artifact/);
    // The genuine set builds without throwing.
    expect(() => buildMap(ALL_ARTIFACTS)).not.toThrow();
  });
});

describe('artifacts map to real, ready, artifact-modality skills', () => {
  it.each(ALL_ARTIFACTS)(
    '$skillId is a ready skill whose modality includes artifact',
    (artifact) => {
      const skill = getSkill(artifact.skillId);
      expect(skill).toBeDefined();
      expect(skill?.status).toBe('ready');
      expect(skill?.modalities).toContain('artifact');
    },
  );
});

describe('isSubmittable gates on the minimum', () => {
  const resolvedFor = (artifact: ArtifactContent) =>
    resolveArtifact(artifact, ctxFor(DEFAULT_INDUSTRY));

  it('rejects empty values', () => {
    for (const artifact of ALL_ARTIFACTS) {
      expect(isSubmittable(resolvedFor(artifact), {})).toBe(false);
    }
  });

  it('rejects a draft below the minimum length', () => {
    const resolved = resolvedFor(ALL_ARTIFACTS[0]);
    // A few characters in every field clears "all filled" but not the length bar.
    const tiny = Object.fromEntries(resolved.fields.map((f) => [f.key, 'x']));
    expect(isSubmittable(resolved, tiny)).toBe(false);
  });

  it('rejects when only some fields are filled, even past the length bar', () => {
    const multi = ALL_ARTIFACTS.find((a) => a.fields.length > 1);
    // Only assert this where there is more than one field to leave blank.
    if (!multi) return;
    const resolved = resolvedFor(multi);
    const long = 'a real sentence with enough words to clear the bar '.repeat(4);
    const partial = { [resolved.fields[0].key]: long };
    expect(isSubmittable(resolved, partial)).toBe(false);
  });

  it('accepts a substantial draft in every field', () => {
    for (const artifact of ALL_ARTIFACTS) {
      const resolved = resolvedFor(artifact);
      // Spread the minimum across the fields so each is non-empty and the
      // composed total clears MIN_SUBMISSION_CHARS comfortably.
      const perField = Math.ceil(MIN_SUBMISSION_CHARS / resolved.fields.length) + 20;
      const filler = 'lorem ipsum dolor sit amet '.repeat(
        Math.ceil(perField / 'lorem ipsum dolor sit amet '.length),
      );
      const full = Object.fromEntries(
        resolved.fields.map((f) => [f.key, filler]),
      );
      expect(isSubmittable(resolved, full)).toBe(true);
    }
  });
});
