// @vitest-environment jsdom
//
// jsdom gives us a real `localStorage`, which the persisted learn store needs.
// The placement assembler itself is environment-agnostic; the store recording
// tests are why we opt this file into jsdom.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildPlacementChallenge,
  canTestOut,
  isPlacementPass,
  PLACEMENT_PASS_RATIO,
} from '../placement';
import { readySkillIdsOfLevel, isLevelCertified } from '../data';
import { getLessonContent } from '../lessons';
import { useLearnStore } from '@/store/learnStore';
import type { LevelId } from '../types';

const ALL_LEVEL_IDS: LevelId[] = ['foundations', 'associate', 'pm', 'senior', 'staff', 'director'];

describe('buildPlacementChallenge', () => {
  it('builds a 5-8 question challenge for Foundations, drawn from its ready lessons', () => {
    const challenge = buildPlacementChallenge('foundations');
    expect(challenge).not.toBeNull();
    if (!challenge) return;

    expect(challenge.levelId).toBe('foundations');
    expect(challenge.questions.length).toBeGreaterThanOrEqual(5);
    expect(challenge.questions.length).toBeLessThanOrEqual(8);

    // Every drawn question really comes from a ready skill of the level and
    // matches a question authored in that skill's lesson.
    const readyIds = new Set(readySkillIdsOfLevel('foundations'));
    for (const pq of challenge.questions) {
      expect(readyIds.has(pq.skillId)).toBe(true);
      const lesson = getLessonContent(pq.skillId);
      expect(lesson?.check.questions.some((q) => q.id === pq.question.id)).toBe(true);
      // The composite uid namespaces the lesson-local question id.
      expect(pq.uid).toBe(`${pq.skillId}::${pq.question.id}`);
    }
  });

  it('gives every placement question a globally-unique uid (no q1 collisions)', () => {
    for (const id of ALL_LEVEL_IDS) {
      const challenge = buildPlacementChallenge(id);
      if (!challenge) continue;
      const uids = challenge.questions.map((q) => q.uid);
      expect(new Set(uids).size).toBe(uids.length);
    }
  });

  it('spreads questions across multiple skills rather than draining one', () => {
    const challenge = buildPlacementChallenge('foundations');
    expect(challenge).not.toBeNull();
    if (!challenge) return;
    const distinctSkills = new Set(challenge.questions.map((q) => q.skillId));
    expect(distinctSkills.size).toBeGreaterThan(1);
  });

  it('covers exactly the level ready skills on a pass', () => {
    const challenge = buildPlacementChallenge('associate');
    expect(challenge).not.toBeNull();
    if (!challenge) return;
    expect(challenge.coveredSkillIds.sort()).toEqual(readySkillIdsOfLevel('associate').sort());
  });

  it('sets a passMark at the ceiling of 80 percent of the question count', () => {
    for (const id of ALL_LEVEL_IDS) {
      const challenge = buildPlacementChallenge(id);
      if (!challenge) continue;
      expect(challenge.passMark).toBe(Math.ceil(challenge.questions.length * PLACEMENT_PASS_RATIO));
    }
  });

  it('canTestOut agrees with buildPlacementChallenge being non-null', () => {
    for (const id of ALL_LEVEL_IDS) {
      expect(canTestOut(id)).toBe(buildPlacementChallenge(id) !== null);
    }
  });
});

describe('isPlacementPass', () => {
  it('passes at exactly 80 percent and above', () => {
    expect(isPlacementPass(8, 10)).toBe(true);
    expect(isPlacementPass(5, 6)).toBe(true); // 0.833
    expect(isPlacementPass(6, 6)).toBe(true);
  });

  it('fails below 80 percent', () => {
    expect(isPlacementPass(7, 10)).toBe(false);
    expect(isPlacementPass(4, 6)).toBe(false); // 0.666
    expect(isPlacementPass(0, 6)).toBe(false);
  });

  it('never passes an empty challenge', () => {
    expect(isPlacementPass(0, 0)).toBe(false);
  });
});

describe('test-out recording: a pass certifies the level (certification is feedback, not a gate)', () => {
  beforeEach(() => {
    useLearnStore.getState().resetProgress();
  });

  it('records every covered skill as mastered on a pass', () => {
    const challenge = buildPlacementChallenge('foundations');
    expect(challenge).not.toBeNull();
    if (!challenge) return;

    const store = useLearnStore.getState();
    expect(isLevelCertified('foundations', store.masteredIds())).toBe(false);

    // Simulate a PASSING run: record the pass for the covered skills.
    store.recordPlacementPass(challenge.coveredSkillIds);

    const after = useLearnStore.getState().masteredIds();
    for (const id of challenge.coveredSkillIds) {
      expect(after.has(id)).toBe(true);
    }
    // The level is now certified — a badge, not a key: Associate was already
    // open before this pass (self-study ruling, 2026-07-16).
    expect(isLevelCertified('foundations', after)).toBe(true);
  });

  it('extends the consistency streak once for the whole batch, not once per skill', () => {
    const challenge = buildPlacementChallenge('foundations');
    if (!challenge) return;
    expect(useLearnStore.getState().streak).toBe(0);
    useLearnStore.getState().recordPlacementPass(challenge.coveredSkillIds);
    // One consistency credit for the test-out, regardless of how many skills.
    expect(useLearnStore.getState().streak).toBe(1);
  });

  it('a FAILING run records nothing (the caller must not call recordPlacementPass)', () => {
    // The honest contract: a fail records nothing. We model the caller's guard:
    // only a pass triggers recording. Here we assert that not recording leaves
    // the level uncertified, exactly what the UI promises on a fail.
    const challenge = buildPlacementChallenge('foundations');
    if (!challenge) return;

    const before = useLearnStore.getState().masteredIds();
    expect(before.size).toBe(0);

    // (No recordPlacementPass call: this is the fail path.)
    const after = useLearnStore.getState().masteredIds();
    expect(after.size).toBe(0);
    expect(isLevelCertified('foundations', after)).toBe(false);
  });

  it('re-passing an already-certified level is idempotent and does not double the streak', () => {
    const challenge = buildPlacementChallenge('foundations');
    if (!challenge) return;
    const store = useLearnStore.getState();
    store.recordPlacementPass(challenge.coveredSkillIds);
    const streakAfterFirst = useLearnStore.getState().streak;
    const countAfterFirst = useLearnStore.getState().masteredCount();

    // Record again the same day: nothing newly mastered, so no extra credit.
    useLearnStore.getState().recordPlacementPass(challenge.coveredSkillIds);
    expect(useLearnStore.getState().masteredCount()).toBe(countAfterFirst);
    expect(useLearnStore.getState().streak).toBe(streakAfterFirst);
  });
});
