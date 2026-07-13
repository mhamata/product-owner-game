import { describe, it, expect } from 'vitest';
import { getSkill, getUnit } from '@/curriculum/data';
import { FOG_GATES, FOG_GATE_LIST, isFogGateUnlocked, type FogGateId } from '../fogOfWar';

describe('FOG_GATES registry', () => {
  it('defines exactly the two W4-G gates', () => {
    const ids = FOG_GATE_LIST.map((g) => g.id).sort();
    expect(ids).toEqual(['cohort-curves', 'decision-annotations-history'] satisfies FogGateId[]);
  });

  it('maps every gate to a REAL, ready curriculum skill (not a placeholder id)', () => {
    for (const gate of FOG_GATE_LIST) {
      const skill = getSkill(gate.unlockSkillOrCompetency);
      expect(skill, `${gate.id} -> ${gate.unlockSkillOrCompetency} must resolve to a real skill`).toBeDefined();
      expect(skill?.status).toBe('ready');
    }
  });

  it("builds each gate's unlock hint from the curriculum's own skill/unit titles", () => {
    for (const gate of FOG_GATE_LIST) {
      const skill = getSkill(gate.unlockSkillOrCompetency)!;
      const unit = getUnit(skill.unitId)!;
      expect(gate.unlockHint).toBe(
        `Unlocks with ${skill.title} — ${unit.title} track. Skills grant vision, permanently.`,
      );
    }
  });

  it('cohort-curves unlocks with Significance & Cohorts (the only curriculum skill naming cohorts)', () => {
    expect(FOG_GATES['cohort-curves'].unlockSkillOrCompetency).toBe('reading-results');
    expect(getSkill('reading-results')?.title).toBe('Significance & Cohorts');
  });

  it('decision-annotations-history unlocks with the foundational Metrics Literacy skill', () => {
    expect(FOG_GATES['decision-annotations-history'].unlockSkillOrCompetency).toBe('metrics-literacy');
    expect(getSkill('metrics-literacy')?.title).toBe('Metrics Literacy');
  });
});

describe('isFogGateUnlocked', () => {
  it('is locked when the unlocking skill is not mastered', () => {
    const isMasteredSkill = () => false;
    expect(isFogGateUnlocked(FOG_GATES['cohort-curves'], isMasteredSkill)).toBe(false);
  });

  it('is unlocked once the unlocking skill is mastered', () => {
    const isMasteredSkill = (skillId: string) => skillId === 'reading-results';
    expect(isFogGateUnlocked(FOG_GATES['cohort-curves'], isMasteredSkill)).toBe(true);
    // A different gate's skill being mastered does not unlock this one.
    expect(isFogGateUnlocked(FOG_GATES['decision-annotations-history'], isMasteredSkill)).toBe(false);
  });

  it('only checks the mastery of ITS OWN unlock skill, never another gate\'s', () => {
    const isMasteredSkill = (skillId: string) => skillId === 'metrics-literacy';
    expect(isFogGateUnlocked(FOG_GATES['decision-annotations-history'], isMasteredSkill)).toBe(true);
    expect(isFogGateUnlocked(FOG_GATES['cohort-curves'], isMasteredSkill)).toBe(false);
  });

  it('permanence: has no time/recency parameter at all, so a caller wired to an ever-mastered signal cannot be re-locked by this module', () => {
    // isMasteredSkill here simulates learnStore.isMastered() under W4-H's
    // mastery-decay model: `mastery` itself never drops (decay is a separate,
    // display-only "strength" number — see masteryDecay.ts), so the predicate
    // keeps returning true no matter how many times it's called ("time
    // passing"). isFogGateUnlocked has no mechanism to second-guess that.
    let calls = 0;
    const isMasteredSkill = () => {
      calls += 1;
      return true; // stays true across every call, i.e. "forever" once earned
    };
    for (let i = 0; i < 5; i++) {
      expect(isFogGateUnlocked(FOG_GATES['cohort-curves'], isMasteredSkill)).toBe(true);
    }
    expect(calls).toBe(5);
  });

  it('re-evaluates live: a predicate that starts false and becomes true unlocks on the next call (no caching to go stale)', () => {
    let mastered = false;
    const isMasteredSkill = () => mastered;
    expect(isFogGateUnlocked(FOG_GATES['cohort-curves'], isMasteredSkill)).toBe(false);
    mastered = true;
    expect(isFogGateUnlocked(FOG_GATES['cohort-curves'], isMasteredSkill)).toBe(true);
  });
});
