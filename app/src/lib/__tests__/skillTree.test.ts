import { describe, it, expect } from 'vitest';
import { masterableSkills, getUnitsForLevel } from '@/curriculum/data';
import { DECAY_GRACE_DAYS, DECAY_SPAN_DAYS, type DecayRecord } from '../masteryDecay';
import { deriveNodeState, deriveSkillNode, skillNodesForLevel, levelMasteredCount } from '../skillTree';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 6, 12);

function daysAgo(n: number): number {
  return NOW - n * DAY;
}

describe('deriveNodeState', () => {
  const firstSkillId = masterableSkills[0].id;

  it('is "next" for the single globally-active skill', () => {
    expect(deriveNodeState(firstSkillId, new Set(), undefined, NOW)).toBe('next');
  });

  it('is "locked" for a not-yet-reached skill', () => {
    const laterId = masterableSkills[5].id;
    expect(deriveNodeState(laterId, new Set(), undefined, NOW)).toBe('locked');
  });

  it('is "done" for a mastered, fresh skill', () => {
    const mastered = new Set([firstSkillId]);
    const fresh: DecayRecord = { mastery: 1, lastPracticedAt: daysAgo(0) };
    expect(deriveNodeState(firstSkillId, mastered, fresh, NOW)).toBe('done');
  });

  it('is "rusty" for a mastered, decayed skill', () => {
    const mastered = new Set([firstSkillId]);
    const stale: DecayRecord = { mastery: 1, lastPracticedAt: daysAgo(DECAY_GRACE_DAYS + DECAY_SPAN_DAYS) };
    expect(deriveNodeState(firstSkillId, mastered, stale, NOW)).toBe('rusty');
  });

  it('mastery gating is never affected by decay: a rusty skill is still in masteredIds everywhere else', () => {
    const mastered = new Set([firstSkillId]);
    const stale: DecayRecord = { mastery: 1, lastPracticedAt: daysAgo(365) };
    expect(deriveNodeState(firstSkillId, mastered, stale, NOW)).toBe('rusty');
    // The invariant under test: passing a "rusty" record never removes the id
    // from the set gating logic reads. This module never mutates masteredIds.
    expect(mastered.has(firstSkillId)).toBe(true);
  });
});

describe('deriveSkillNode', () => {
  it('has a null strength for a locked/next node', () => {
    const skill = masterableSkills[0];
    const node = deriveSkillNode(skill, new Set(), undefined, NOW);
    expect(node.state).toBe('next');
    expect(node.strengthPct).toBeNull();
    expect(node.offersRefresh).toBe(false);
  });

  it('offers a refresh only when rusty', () => {
    const skill = masterableSkills[0];
    const mastered = new Set([skill.id]);
    const stale: DecayRecord = { mastery: 1, lastPracticedAt: daysAgo(365) };
    const node = deriveSkillNode(skill, mastered, stale, NOW);
    expect(node.state).toBe('rusty');
    expect(node.offersRefresh).toBe(true);
    expect(node.strengthPct).not.toBeNull();
  });

  it('always carries a non-empty unlock line', () => {
    const skill = masterableSkills[0];
    const node = deriveSkillNode(skill, new Set(), undefined, NOW);
    expect(node.unlock.text.length).toBeGreaterThan(0);
  });
});

describe('skillNodesForLevel', () => {
  it('returns one node per skill in the level, in index order', () => {
    const levelId = getUnitsForLevel('foundations')[0].levelId;
    const nodes = skillNodesForLevel(levelId, new Set(), () => undefined, NOW);
    const expectedCount = getUnitsForLevel(levelId).flatMap((u) => u.skills).length;
    expect(nodes.length).toBe(expectedCount);
    for (let i = 1; i < nodes.length; i += 1) {
      expect(nodes[i].skill.index).toBeGreaterThan(nodes[i - 1].skill.index);
    }
  });
});

describe('levelMasteredCount', () => {
  it('counts done + rusty nodes as mastered', () => {
    const nodes = [
      { state: 'done' } as const,
      { state: 'rusty' } as const,
      { state: 'next' } as const,
      { state: 'locked' } as const,
    ].map((n) => ({ ...n, skill: masterableSkills[0], strengthPct: null, offersRefresh: false, unlock: { kind: 'pedagogical' as const, text: 'x' } }));
    expect(levelMasteredCount(nodes)).toBe(2);
  });
});
