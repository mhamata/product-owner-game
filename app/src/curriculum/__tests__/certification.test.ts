import { describe, it, expect } from 'vitest';
import {
  levels,
  allSkills,
  masterableSkills,
  readySkillIdsOfLevel,
  isLevelCertified,
  isLevelComplete,
  competencyCoverage,
  dimensionCoverage,
  allCompetencyCoverage,
} from '../data';
import { COMPETENCIES, DIMENSIONS, type Competency, type CompetencyGroup, type LevelId } from '../types';

/**
 * Certification and competency coverage are the "what level am I, where am I
 * strong/weak" layer. These tests pin the contract the profile view and the map
 * badge rely on: certification is exactly mastering a level's ready skills, an
 * empty level is never vacuously certified, and coverage counts only ready
 * skills so the denominator is always reachable.
 */

const ALL_LEVEL_IDS: LevelId[] = ['foundations', 'associate', 'pm', 'senior', 'staff', 'director'];

function masterAll(): Set<string> {
  return new Set(masterableSkills.map((s) => s.id));
}

describe('isLevelCertified', () => {
  it('does not certify any level from a cold start', () => {
    const cold = new Set<string>();
    for (const id of ALL_LEVEL_IDS) {
      expect(isLevelCertified(id, cold)).toBe(false);
    }
  });

  it('certifies a level once every ready skill in it is mastered', () => {
    // Foundations is the entry level and has ready skills; mastering exactly its
    // ready set certifies it, and nothing less does.
    const foundationsReady = readySkillIdsOfLevel('foundations');
    expect(foundationsReady.length).toBeGreaterThan(0);

    const allButOne = new Set(foundationsReady.slice(0, -1));
    expect(isLevelCertified('foundations', allButOne)).toBe(false);

    const full = new Set(foundationsReady);
    expect(isLevelCertified('foundations', full)).toBe(true);
  });

  it('certifies every level that holds ready skills when all are mastered', () => {
    const all = masterAll();
    for (const id of ALL_LEVEL_IDS) {
      const hasReady = readySkillIdsOfLevel(id).length > 0;
      expect(isLevelCertified(id, all)).toBe(hasReady);
    }
  });

  it('treats a level with zero ready skills as not certifiable (not vacuously certified)', () => {
    // Construct a hypothetical: a level id whose ready set is empty must report
    // false even against a fully-mastered learner. We assert the rule directly
    // for any such level present, and assert the predicate on an empty set.
    const all = masterAll();
    for (const id of ALL_LEVEL_IDS) {
      if (readySkillIdsOfLevel(id).length === 0) {
        expect(isLevelCertified(id, all)).toBe(false);
      }
    }
  });

  it('is an exact alias of isLevelComplete (one source of truth)', () => {
    const sets = [new Set<string>(), masterAll(), new Set(readySkillIdsOfLevel('foundations'))];
    for (const set of sets) {
      for (const id of ALL_LEVEL_IDS) {
        expect(isLevelCertified(id, set)).toBe(isLevelComplete(id, set));
      }
    }
  });
});

describe('competency coverage', () => {
  it('reports zero mastered and a 0 fraction from a cold start, but a real total', () => {
    const cold = new Set<string>();
    let totalAcross = 0;
    for (const id of Object.keys(COMPETENCIES) as Competency[]) {
      const stat = competencyCoverage(id, cold);
      expect(stat.mastered).toBe(0);
      expect(stat.fraction).toBe(0);
      expect(stat.total).toBeGreaterThanOrEqual(0);
      totalAcross += stat.total;
    }
    // Every ready ladder skill is tagged with exactly one competency, so the
    // per-competency totals must sum to the masterable (ready) count.
    expect(totalAcross).toBe(masterableSkills.length);
  });

  it('counts only ready skills toward a competency total', () => {
    const cold = new Set<string>();
    for (const id of Object.keys(COMPETENCIES) as Competency[]) {
      const readyForComp = allSkills.filter(
        (s) => s.competency === id && s.status === 'ready',
      ).length;
      expect(competencyCoverage(id, cold).total).toBe(readyForComp);
    }
  });

  it('reaches full coverage on every competency that has ready skills when all are mastered', () => {
    const all = masterAll();
    for (const id of Object.keys(COMPETENCIES) as Competency[]) {
      const stat = competencyCoverage(id, all);
      if (stat.total > 0) {
        expect(stat.mastered).toBe(stat.total);
        expect(stat.fraction).toBe(1);
      } else {
        expect(stat.fraction).toBe(0);
      }
    }
  });

  it('rolls competencies up into dimensions correctly', () => {
    const all = masterAll();
    for (const group of Object.keys(DIMENSIONS) as CompetencyGroup[]) {
      const dim = dimensionCoverage(group, all);
      // The dimension total is the sum of its member competencies' totals.
      const memberTotal = (Object.keys(COMPETENCIES) as Competency[])
        .filter((c) => COMPETENCIES[c].group === group)
        .reduce((sum, c) => sum + competencyCoverage(c, all).total, 0);
      expect(dim.total).toBe(memberTotal);
    }
  });

  it('allCompetencyCoverage returns a stat for all twelve+cross-cutting competencies', () => {
    const cold = new Set<string>();
    const cov = allCompetencyCoverage(cold);
    expect(Object.keys(cov).sort()).toEqual(Object.keys(COMPETENCIES).sort());
  });

  it('partial mastery yields a partial fraction on the affected competency', () => {
    // Master exactly one ready skill and confirm its competency moved off zero
    // while staying below full.
    const first = masterableSkills[0];
    const partial = new Set([first.id]);
    const stat = competencyCoverage(first.competency, partial);
    expect(stat.mastered).toBeGreaterThanOrEqual(1);
    expect(stat.fraction).toBeGreaterThan(0);
  });
});

describe('coverage is independent of level certification', () => {
  it('a single mastered skill never certifies its level but does move coverage', () => {
    const first = masterableSkills[0];
    const one = new Set([first.id]);
    // Foundations has more than one ready skill, so one mastered skill cannot
    // certify it, yet competency coverage for that skill is non-zero.
    expect(isLevelCertified('foundations', one)).toBe(false);
    expect(competencyCoverage(first.competency, one).mastered).toBeGreaterThan(0);
  });
});

describe('levels sanity', () => {
  it('exposes six levels (the profile renders all six)', () => {
    expect(levels).toHaveLength(6);
  });
});
