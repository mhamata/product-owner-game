import { describe, it, expect } from 'vitest';
import { ALL_LESSONS, LESSON_CONTENT, getLessonContent, hasLessonContent } from '..';
import {
  isFillCorrect,
  normaliseFill,
  resolveFlavoured,
  resolveQuestion,
  type IndustryContext,
} from '../types';
import { getSkill } from '@/curriculum/data';
import { INDUSTRIES, INDUSTRY_NOUNS, type IndustryId } from '@/curriculum/industries';

/**
 * These tests guard the concept-lesson content layer: every authored lesson maps
 * to a real, ready, lesson-modality skill; every comprehension check is
 * internally consistent (so it can actually be passed); the fill grader behaves;
 * and industry-flavoured content resolves for every industry without throwing.
 *
 * Authoring a broken lesson (a typo'd skill id, a correctId that matches no
 * option, an empty accept list) should fail here, not surprise a learner.
 */

const ALL_INDUSTRIES: IndustryId[] = INDUSTRIES.map((i) => i.id);

function ctxFor(id: IndustryId): IndustryContext {
  return {
    id,
    label: INDUSTRIES.find((i) => i.id === id)?.label ?? id,
    product: INDUSTRY_NOUNS[id].product,
    user: INDUSTRY_NOUNS[id].user,
  };
}

describe('lesson registry', () => {
  it('exposes the expected Foundations + Associate lessons', () => {
    const ids = ALL_LESSONS.map((l) => l.skillId);
    const expected = [
      // Foundations
      'what-pm-is',
      'product-lifecycle',
      'four-big-risks',
      'working-with-eng-design',
      'agile-scrum',
      'technical-literacy',
      'metrics-literacy',
      // Associate
      'prds-and-specs',
      'user-stories',
      'backlog-sprints-kanban',
      'story-mapping',
      'quality-and-delivery',
    ];
    expect(ids.sort()).toEqual(expected.sort());
  });

  it('has no duplicate skill ids', () => {
    const ids = ALL_LESSONS.map((l) => l.skillId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keys LESSON_CONTENT by skillId and resolves via the helpers', () => {
    for (const lesson of ALL_LESSONS) {
      expect(LESSON_CONTENT[lesson.skillId]).toBe(lesson);
      expect(getLessonContent(lesson.skillId)).toBe(lesson);
      expect(hasLessonContent(lesson.skillId)).toBe(true);
    }
    expect(getLessonContent('does-not-exist')).toBeUndefined();
    expect(hasLessonContent('does-not-exist')).toBe(false);
  });
});

describe('lessons map to real, ready, lesson-modality skills', () => {
  it.each(ALL_LESSONS)('$skillId is a ready skill whose modality includes lesson', (lesson) => {
    const skill = getSkill(lesson.skillId);
    expect(skill).toBeDefined();
    expect(skill?.status).toBe('ready');
    expect(skill?.modalities).toContain('lesson');
  });

  it('makes "what-pm-is" the very first ready ladder skill (cold-start node)', () => {
    // The product requirement: a brand-new learner starts at the first
    // Foundations skill. With Foundations now populated, that skill is what-pm-is.
    const skill = getSkill('what-pm-is');
    expect(skill?.level).toBe('foundations');
    expect(skill?.index).toBe(1);
  });
});

describe('every lesson has a teachable, well-formed body', () => {
  it.each(ALL_LESSONS)('$skillId has a hook, sections, an example, and takeaways', (lesson) => {
    expect(lesson.hook.length).toBeGreaterThan(0);
    expect(lesson.sections.length).toBeGreaterThanOrEqual(1);
    expect(lesson.examples.length).toBeGreaterThanOrEqual(1);
    expect(lesson.takeaways.length).toBeGreaterThanOrEqual(2);
    expect(lesson.takeaways.length).toBeLessThanOrEqual(3);
    for (const section of lesson.sections) {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('comprehension checks are internally consistent', () => {
  it.each(ALL_LESSONS)('$skillId has 1-3 questions, each gradeable', (lesson) => {
    const qs = lesson.check.questions;
    expect(qs.length).toBeGreaterThanOrEqual(1);
    expect(qs.length).toBeLessThanOrEqual(3);

    // Question ids unique within a check.
    const qids = qs.map((q) => q.id);
    expect(new Set(qids).size).toBe(qids.length);

    for (const q of qs) {
      if (q.kind === 'choice') {
        // Option ids unique, and the correct id matches exactly one option.
        const optIds = q.options.map((o) => o.id);
        expect(optIds.length).toBeGreaterThanOrEqual(2);
        expect(new Set(optIds).size).toBe(optIds.length);
        expect(optIds.filter((id) => id === q.correctId)).toHaveLength(1);
      } else {
        // Fill questions need at least one non-empty accepted answer.
        expect(q.accept.length).toBeGreaterThanOrEqual(1);
        for (const a of q.accept) expect(a.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every choice question is passable by selecting its correctId; every fill by its first accept', () => {
    // Simulate a perfect attempt and confirm the grading predicate agrees.
    for (const lesson of ALL_LESSONS) {
      for (const q of lesson.check.questions) {
        if (q.kind === 'choice') {
          expect(q.options.some((o) => o.id === q.correctId)).toBe(true);
        } else {
          expect(isFillCorrect(q.accept[0], q.accept)).toBe(true);
        }
      }
    }
  });
});

describe('flavoured content resolves for every industry', () => {
  it.each(ALL_INDUSTRIES)('resolves all lessons for industry "%s" without throwing', (industryId) => {
    const ctx = ctxFor(industryId);
    for (const lesson of ALL_LESSONS) {
      for (const section of lesson.sections) {
        for (const body of section.body) {
          expect(typeof resolveFlavoured(body, ctx)).toBe('string');
        }
        for (const bullet of section.bullets ?? []) {
          expect(typeof resolveFlavoured(bullet, ctx)).toBe('string');
        }
      }
      for (const ex of lesson.examples) {
        expect(typeof resolveFlavoured(ex.title, ctx)).toBe('string');
        for (const line of ex.lines) {
          expect(typeof resolveFlavoured(line, ctx)).toBe('string');
        }
      }
      for (const t of lesson.takeaways) {
        expect(typeof resolveFlavoured(t, ctx)).toBe('string');
      }
      for (const q of lesson.check.questions) {
        const resolved = resolveQuestion(q, ctx);
        expect(resolved.kind).toBe(q.kind);
      }
    }
  });
});

describe('fill grader', () => {
  it('matches case-insensitively and trims surrounding whitespace', () => {
    expect(isFillCorrect('  Acquisition ', ['acquisition'])).toBe(true);
    expect(isFillCorrect('THEN', ['then'])).toBe(true);
    expect(isFillCorrect('sprint', ['a sprint', 'sprint'])).toBe(true);
  });

  it('collapses internal whitespace before comparing', () => {
    expect(normaliseFill('before   build')).toBe('before build');
    expect(isFillCorrect('before   build', ['before build'])).toBe(true);
  });

  it('rejects an answer that is not in the accept list', () => {
    expect(isFillCorrect('retention', ['acquisition'])).toBe(false);
    expect(isFillCorrect('', ['then'])).toBe(false);
  });
});
