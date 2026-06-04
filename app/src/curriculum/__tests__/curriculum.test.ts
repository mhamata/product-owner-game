import { describe, it, expect } from 'vitest';
import {
  levels,
  units,
  tracks,
  allSkills,
  allTrackSkills,
  everySkill,
  masterableSkills,
  TOTAL_SKILLS,
  getSkill,
  getNextSkill,
  getUnitForSkill,
  getUnitsForLevel,
  deriveSkillState,
  isLevelUnlocked,
  isLevelComplete,
  isUnitComplete,
} from '../data';
import { COMPETENCIES, MODALITIES, type LevelId } from '../types';

/**
 * These tests pin the *shape* of the leveled curriculum and the gating rule the
 * Practice Map relies on. They are deliberately structural: they don't assert a
 * specific skill count (that will grow as content lands), but they DO guarantee
 * the invariants: six levels, preserved drills, valid tags, and a gating rule
 * where coming-soon skills never wall off the ladder.
 */

const ALL_LEVEL_IDS: LevelId[] = [
  'foundations',
  'associate',
  'pm',
  'senior',
  'staff',
  'director',
];

/** Convenience: the set of every masterable skill id (a fully-mastered learner). */
function masterAll(): Set<string> {
  return new Set(masterableSkills.map((s) => s.id));
}

describe('levels', () => {
  it('defines exactly the six career-ladder levels in order', () => {
    expect(levels.map((l) => l.id)).toEqual(ALL_LEVEL_IDS);
    expect(levels.map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('puts staff on the IC branch and director on the management branch', () => {
    expect(levels.find((l) => l.id === 'staff')?.branch).toBe('ic');
    expect(levels.find((l) => l.id === 'director')?.branch).toBe('management');
    // Everything up to and including senior is the shared core spine.
    for (const id of ['foundations', 'associate', 'pm', 'senior'] as LevelId[]) {
      expect(levels.find((l) => l.id === id)?.branch).toBe('core');
    }
  });

  it('gives every level at least one unit', () => {
    for (const id of ALL_LEVEL_IDS) {
      expect(getUnitsForLevel(id).length).toBeGreaterThan(0);
    }
  });
});

describe('units & skills', () => {
  it('numbers units per-level starting at 1', () => {
    for (const id of ALL_LEVEL_IDS) {
      const levelUnits = getUnitsForLevel(id);
      expect(levelUnits.map((u) => u.number)).toEqual(
        levelUnits.map((_, i) => i + 1),
      );
    }
  });

  it('gives every unit 2-4 skills', () => {
    for (const unit of units) {
      expect(unit.skills.length).toBeGreaterThanOrEqual(2);
      expect(unit.skills.length).toBeLessThanOrEqual(4);
    }
  });

  it('assigns a globally-unique, contiguous 1-based index across all skills', () => {
    const indices = everySkill.map((s) => s.index);
    expect(new Set(indices).size).toBe(indices.length);
    expect([...indices].sort((a, b) => a - b)).toEqual(
      everySkill.map((_, i) => i + 1),
    );
  });

  it('has no duplicate skill ids anywhere (ladder + tracks)', () => {
    const ids = everySkill.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tags every skill with a known competency and at least one valid modality', () => {
    for (const skill of everySkill) {
      expect(COMPETENCIES[skill.competency]).toBeDefined();
      expect(skill.modalities.length).toBeGreaterThan(0);
      for (const m of skill.modalities) expect(MODALITIES[m]).toBeDefined();
    }
  });

  it('keeps hasLesson in sync with status === ready', () => {
    for (const skill of everySkill) {
      expect(skill.hasLesson).toBe(skill.status === 'ready');
    }
  });

  it('marks every ladder skill with a level and no track (and vice-versa)', () => {
    for (const s of allSkills) {
      expect(s.level).toBeDefined();
      expect(s.track).toBeUndefined();
    }
    for (const s of allTrackSkills) {
      expect(s.track).toBeDefined();
      expect(s.level).toBeUndefined();
    }
  });
});

describe('existing drills are preserved (the 21-skill curriculum maps in as ready)', () => {
  // Every skill that shipped a working drill/lesson must survive the migration
  // with its id + drill wiring intact, so the industry-aware drills still play.
  const READY_DRILLS: { id: string; drillType?: string; methodId?: string }[] = [
    { id: 'jtbd', drillType: 'jtbd', methodId: 'jtbd' },
    { id: 'user-interviews', drillType: 'mom-test', methodId: 'mom-test' },
    { id: 'problem-framing', drillType: 'five-whys', methodId: 'five-whys' },
    { id: 'value-vs-effort', methodId: 'value-vs-effort' },
    { id: 'rice', drillType: 'rice', methodId: 'rice' },
    { id: 'kano-moscow', drillType: 'kano', methodId: 'kano' },
    { id: 'cost-of-delay', drillType: 'wsjf', methodId: 'cost-of-delay' },
    { id: 'estimation', drillType: 't-shirt', methodId: 't-shirt' },
    { id: 'pr-faq', drillType: 'pr-faq', methodId: 'pr-faq' },
    { id: 'pre-mortem', drillType: 'pre-mortem', methodId: 'pre-mortem' },
  ];

  it.each(READY_DRILLS)('keeps $id wired as a ready skill', (expected) => {
    const skill = getSkill(expected.id);
    expect(skill).toBeDefined();
    expect(skill?.status).toBe('ready');
    expect(skill?.hasLesson).toBe(true);
    expect(skill?.drillType).toBe(expected.drillType);
    expect(skill?.methodId).toBe(expected.methodId);
  });

  it('keeps every known drill in the masterable (ready) set', () => {
    // Ready skills are now a superset: the preserved drills PLUS the authored
    // concept lessons. The invariant we still guarantee is that no drill silently
    // dropped out of the playable curriculum.
    const readyIds = new Set(masterableSkills.map((s) => s.id));
    for (const d of READY_DRILLS) expect(readyIds.has(d.id)).toBe(true);
  });

  it('TOTAL_SKILLS counts the ready (masterable) skills, drills + lessons', () => {
    expect(TOTAL_SKILLS).toBe(masterableSkills.length);
    // The drills are a strict subset of ready skills now that lessons also ship.
    expect(TOTAL_SKILLS).toBeGreaterThanOrEqual(READY_DRILLS.length);
  });
});

describe('coming-soon skills never break the map', () => {
  it('renders every coming-soon skill as locked regardless of mastery', () => {
    const all = masterAll();
    for (const s of everySkill) {
      if (s.status === 'coming-soon') {
        expect(deriveSkillState(s.id, all)).toBe('locked');
      }
    }
  });

  it('never counts a coming-soon skill toward unit completion', () => {
    // A unit whose ready skills are all mastered is complete even if it also
    // holds coming-soon skills; a unit with ONLY coming-soon skills is never
    // "complete" (nothing to master yet).
    const all = masterAll();
    const comingSoonOnly = units.filter((u) =>
      u.skills.every((s) => s.status === 'coming-soon'),
    );
    for (const u of comingSoonOnly) {
      expect(isUnitComplete(u.id, all)).toBe(false);
    }
  });
});

describe('gating rule', () => {
  it('always unlocks Foundations from a cold start', () => {
    expect(isLevelUnlocked('foundations', new Set())).toBe(true);
  });

  it('puts the single active node on the first ready skill from a cold start', () => {
    const cold = new Set<string>();
    const actives = everySkill.filter(
      (s) => deriveSkillState(s.id, cold) === 'active',
    );
    expect(actives).toHaveLength(1);
    expect(actives[0].id).toBe(masterableSkills[0].id);
  });

  it('locks the PM level until the ready skills before it are mastered', () => {
    // Foundations and Associate now both carry ready skills (concept lessons +
    // the estimation drill). PM unlocks only once EVERY ready skill in those two
    // earlier core levels is mastered. Derive that prerequisite set from the data
    // so the test stays correct as content is added.
    const cold = new Set<string>();
    expect(isLevelUnlocked('pm', cold)).toBe(false);

    const prereq = allSkills
      .filter((s) => (s.level === 'foundations' || s.level === 'associate') && s.status === 'ready')
      .map((s) => s.id);
    expect(prereq.length).toBeGreaterThan(0);

    // Mastering all but one prerequisite is not enough; the full set unlocks PM.
    const allButOne = new Set(prereq.slice(0, -1));
    expect(isLevelUnlocked('pm', allButOne)).toBe(false);

    const afterPrereqs = new Set(prereq);
    expect(isLevelUnlocked('pm', afterPrereqs)).toBe(true);
  });

  it('unlocks the post-senior branches (staff, director) off the senior bar', () => {
    const all = masterAll();
    expect(isLevelUnlocked('staff', all)).toBe(true);
    expect(isLevelUnlocked('director', all)).toBe(true);
    // Both branch levels gate on the same core spine, so with no progress they
    // are locked together.
    expect(isLevelUnlocked('staff', new Set())).toBe(false);
    expect(isLevelUnlocked('director', new Set())).toBe(false);
  });

  it('marks all core levels complete when every ready skill is mastered', () => {
    const all = masterAll();
    for (const id of ALL_LEVEL_IDS) {
      // Levels that actually hold ready skills should report complete.
      const hasReady = getUnitsForLevel(id)
        .flatMap((u) => u.skills)
        .some((s) => s.status === 'ready');
      if (hasReady) expect(isLevelComplete(id, all)).toBe(true);
    }
  });
});

describe('navigation helpers', () => {
  it('getNextSkill skips coming-soon skills and lands on the next ready one', () => {
    // From the last prioritization drill, the next *ready* skill is estimation's
    // sibling? No, estimation is earlier. The contract is only that whatever it
    // returns is itself ready (or undefined at the end).
    for (const s of masterableSkills) {
      const next = getNextSkill(s.id);
      if (next) expect(next.status).toBe('ready');
    }
  });

  it('getUnitForSkill resolves a unit for every ladder skill', () => {
    for (const s of allSkills) {
      expect(getUnitForSkill(s.id)?.skills.some((x) => x.id === s.id)).toBe(true);
    }
  });

  it('exposes the seven specialization tracks, each a ready lesson skill', () => {
    expect(tracks).toHaveLength(7);
    for (const t of tracks) {
      expect(t.skills.length).toBeGreaterThan(0);
      for (const s of t.skills) {
        // Track skills now ship a concept lesson: ready, with the 'lesson'
        // modality, while staying off-ladder (track set, no level).
        expect(s.status).toBe('ready');
        expect(s.modalities).toContain('lesson');
        expect(s.track).toBe(t.id);
        expect(s.level).toBeUndefined();
      }
    }
  });
});

describe('roleplay practice skills are wired into the influence units', () => {
  // Each roleplay is a SEPARATE practice skill (modality 'roleplay' only, ready),
  // added beside an influence concept lesson the way the artifacts were added,
  // never overwriting the lesson. This pins the wiring and the invariant.
  const ROLEPLAY_SKILLS: { id: string; unitId: string; sibling: string }[] = [
    { id: 'roleplay-scope-cut', unitId: 'foundations-u2', sibling: 'working-with-eng-design' },
    { id: 'roleplay-defend-roadmap', unitId: 'senior-u4', sibling: 'influence-without-authority' },
    { id: 'roleplay-customer-escalation', unitId: 'staff-u2', sibling: 'force-multiplier-influence' },
    { id: 'roleplay-say-no', unitId: 'director-u1', sibling: 'hiring-coaching-pms' },
  ];

  it.each(ROLEPLAY_SKILLS)(
    '$id is a ready, roleplay-only ladder skill in $unitId',
    ({ id, unitId }) => {
      const skill = getSkill(id);
      expect(skill).toBeDefined();
      expect(skill?.status).toBe('ready');
      expect(skill?.modalities).toEqual(['roleplay']);
      expect(skill?.level).toBeDefined();
      expect(getUnitForSkill(id)?.id).toBe(unitId);
    },
  );

  it('adds each roleplay beside its influence lesson sibling without overwriting it', () => {
    for (const { id, unitId, sibling } of ROLEPLAY_SKILLS) {
      const unit = units.find((u) => u.id === unitId);
      expect(unit).toBeDefined();
      const ids = unit?.skills.map((s) => s.id) ?? [];
      // Both the roleplay practice skill and its concept-lesson sibling live in
      // the same unit, as distinct skills.
      expect(ids).toContain(id);
      expect(ids).toContain(sibling);
      // The sibling keeps its concept lesson (modality includes 'lesson'); it was
      // not replaced by the roleplay.
      expect(getSkill(sibling)?.modalities).toContain('lesson');
    }
  });

  it('keeps every unit within the 2-4 skill invariant after the additions', () => {
    // A second, explicit guard alongside the generic units check: the roleplay
    // additions must not push any unit out of range.
    for (const unit of units) {
      expect(unit.skills.length).toBeGreaterThanOrEqual(2);
      expect(unit.skills.length).toBeLessThanOrEqual(4);
    }
  });

  it('counts the four roleplay skills among the masterable (ready) ladder skills', () => {
    const readyIds = new Set(masterableSkills.map((s) => s.id));
    for (const { id } of ROLEPLAY_SKILLS) expect(readyIds.has(id)).toBe(true);
  });
});
