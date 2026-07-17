import { describe, it, expect } from 'vitest';
import { getSkill } from '@/curriculum/data';
import { FOG_GATES, FOG_GATE_LIST, type FogGateId } from '../fogOfWar';

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

  it("builds each gate's hint-chip copy from the curriculum's own skill title", () => {
    for (const gate of FOG_GATE_LIST) {
      const skill = getSkill(gate.unlockSkillOrCompetency)!;
      expect(gate.unlockHint).toBe(`Sharpen this: ${skill.title}`);
    }
  });

  it('cohort-curves maps to Significance & Cohorts (the only curriculum skill naming cohorts)', () => {
    expect(FOG_GATES['cohort-curves'].unlockSkillOrCompetency).toBe('reading-results');
    expect(getSkill('reading-results')?.title).toBe('Significance & Cohorts');
  });

  it('decision-annotations-history maps to the foundational Metrics Literacy skill', () => {
    expect(FOG_GATES['decision-annotations-history'].unlockSkillOrCompetency).toBe('metrics-literacy');
    expect(getSkill('metrics-literacy')?.title).toBe('Metrics Literacy');
  });
});

// SELF-STUDY RULING (2026-07-16, Mike): `isFogGateUnlocked` was DELETED —
// both Product-screen panes render their real content unconditionally now
// (see ProductMapScreen.test.tsx for that render coverage). This registry's
// only remaining job is supplying copy for a "sharpen this" hint chip shown
// until the mapped skill is mastered, so there is no gating predicate left
// to pin here.
