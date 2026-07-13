import { describe, it, expect } from 'vitest';
import { masterableSkills } from '@/curriculum/data';
import { FOG_GATE_LIST } from '../fogOfWar';
import {
  realUnlockLine,
  pedagogicalUnlockLine,
  unlockLineFor,
  nextSkillsSharingCompetency,
} from '../skillUnlocks';

// Every currently-registered fog-of-war gate's unlock skill: the tech tree's
// only honest source of "sim" unlock lines (see skillUnlocks.ts's header
// comment). Read from the live registry rather than hardcoded, so this suite
// doesn't go stale the next time a gate's target skill changes.
const gatedSkillIds = FOG_GATE_LIST.map((g) => g.unlockSkillOrCompetency);

describe('realUnlockLine', () => {
  it('returns a sourced sim unlock for every fog-of-war-gated skill', () => {
    for (const skillId of gatedSkillIds) {
      const line = realUnlockLine(skillId);
      expect(line).not.toBeNull();
      expect(line?.kind).toBe('sim');
      expect(line?.text.length).toBeGreaterThan(0);
    }
  });

  it('returns null for a skill with no real in-sim gate yet', () => {
    expect(realUnlockLine('some-skill-with-no-gate')).toBeNull();
  });
});

describe('nextSkillsSharingCompetency', () => {
  it('only returns later-index skills sharing the same competency', () => {
    const skill = masterableSkills[0];
    const next = nextSkillsSharingCompetency(skill, 5);
    for (const s of next) {
      expect(s.competency).toBe(skill.competency);
      expect(s.index).toBeGreaterThan(skill.index);
    }
  });

  it('respects the count cap', () => {
    const skill = masterableSkills[0];
    const next = nextSkillsSharingCompetency(skill, 1);
    expect(next.length).toBeLessThanOrEqual(1);
  });
});

describe('pedagogicalUnlockLine', () => {
  it('names later skills on the same thread when they exist', () => {
    const skill = masterableSkills.find(
      (s) => nextSkillsSharingCompetency(s, 1).length > 0,
    )!;
    const line = pedagogicalUnlockLine(skill);
    expect(line.kind).toBe('pedagogical');
    expect(line.text).toMatch(/^Feeds:/);
  });

  it('falls back to naming the competency for the last skill on a thread', () => {
    const skill = masterableSkills.find(
      (s) => nextSkillsSharingCompetency(s, 1).length === 0,
    );
    if (!skill) return; // every competency happens to have more than one skill today; skip if so
    const line = pedagogicalUnlockLine(skill);
    expect(line.kind).toBe('pedagogical');
    expect(line.text).toMatch(/^Builds/);
  });
});

describe('unlockLineFor', () => {
  it('every masterable skill gets a non-empty unlock line', () => {
    for (const skill of masterableSkills) {
      const line = unlockLineFor(skill);
      expect(line.text.length).toBeGreaterThan(0);
    }
  });

  it('prefers the real sim unlock over the pedagogical fallback when one exists', () => {
    expect(gatedSkillIds.length).toBeGreaterThan(0); // guard: the registry actually has gates today
    for (const skillId of gatedSkillIds) {
      const skill = masterableSkills.find((s) => s.id === skillId);
      if (!skill) continue; // gate target isn't a ladder skill (e.g. a track skill) — nothing to assert here
      expect(unlockLineFor(skill).kind).toBe('sim');
    }
  });
});
