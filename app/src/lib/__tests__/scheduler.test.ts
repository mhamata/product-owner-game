import { describe, it, expect } from 'vitest';
import {
  competencyStrength,
  rankCompetencies,
  pickWeakestCompetency,
  pickPracticeSkill,
  chooseWorkloadBlock,
  formatWhyLine,
  buildMentorLine,
  type CompetencyCandidate,
  type PracticeSkillLike,
} from '../scheduler';
import type { CoverageStat } from '@/curriculum/data';

/**
 * The scheduler is the Standup's Act 2 brain: it decides what one block a
 * learner does today, deterministically, with no AI call. These tests pin
 * that contract independent of the curriculum data module or any store, using
 * small synthetic candidates so the logic is exercised in isolation.
 */

function coverage(mastered: number, total: number): CoverageStat {
  return { total, mastered, fraction: total === 0 ? 0 : mastered / total };
}

describe('competencyStrength', () => {
  it('equals coverage fraction alone when there is no sim evidence yet', () => {
    expect(competencyStrength(coverage(1, 4))).toBe(0.25);
  });

  it('averages coverage fraction and sim score once evidence exists', () => {
    // coverage 0.5, sim 80% -> (0.5 + 0.8) / 2 = 0.65
    expect(competencyStrength(coverage(2, 4), 80)).toBeCloseTo(0.65);
  });

  it('clamps an out-of-range sim score into 0..1 before blending', () => {
    expect(competencyStrength(coverage(0, 2), 150)).toBeCloseTo(0.5); // (0 + 1) / 2
    expect(competencyStrength(coverage(0, 2), -50)).toBeCloseTo(0); // (0 + 0) / 2
  });
});

describe('rankCompetencies / pickWeakestCompetency', () => {
  it('picks the lowest-strength LIVE competency as weakest', () => {
    const candidates: CompetencyCandidate[] = [
      { competency: 'data-fluency', coverage: coverage(3, 4) }, // 0.75
      { competency: 'ux', coverage: coverage(1, 4) }, // 0.25 <- weakest
      { competency: 'delivery', coverage: coverage(2, 4) }, // 0.5
    ];
    const weakest = pickWeakestCompetency(candidates);
    expect(weakest?.competency).toBe('ux');
    expect(weakest?.strength).toBeCloseTo(0.25);
  });

  it('excludes non-live competencies (zero ready skills) from ranking entirely', () => {
    const candidates: CompetencyCandidate[] = [
      { competency: 'ethics', coverage: coverage(0, 0) }, // not live
      { competency: 'ux', coverage: coverage(3, 4) }, // 0.75, only live one
    ];
    const ranked = rankCompetencies(candidates);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].competency).toBe('ux');
  });

  it('breaks ties deterministically by competency id (alphabetical)', () => {
    const candidates: CompetencyCandidate[] = [
      { competency: 'ux', coverage: coverage(1, 4) }, // 0.25
      { competency: 'delivery', coverage: coverage(1, 4) }, // 0.25, tied
      { competency: 'business', coverage: coverage(1, 4) }, // 0.25, tied, alphabetically first
    ];
    const weakest = pickWeakestCompetency(candidates);
    expect(weakest?.competency).toBe('business');
  });

  it('is a pure function of its input: repeated calls with the same candidates agree', () => {
    const candidates: CompetencyCandidate[] = [
      { competency: 'ux', coverage: coverage(1, 4), simScore: 40 },
      { competency: 'quality', coverage: coverage(2, 4) },
    ];
    const a = pickWeakestCompetency(candidates);
    const b = pickWeakestCompetency(candidates);
    expect(a).toEqual(b);
  });

  it('no-data fallback: returns null when there is nothing live to pick from', () => {
    expect(pickWeakestCompetency([])).toBeNull();
    expect(
      pickWeakestCompetency([{ competency: 'ux', coverage: coverage(0, 0) }]),
    ).toBeNull();
  });
});

describe('pickPracticeSkill', () => {
  const skills: PracticeSkillLike[] = [
    { id: 'ux-3', title: 'UX skill 3', competency: 'ux', status: 'ready', index: 30 },
    { id: 'ux-1', title: 'UX skill 1', competency: 'ux', status: 'ready', index: 10 },
    { id: 'ux-2', title: 'UX skill 2', competency: 'ux', status: 'ready', index: 20 },
    { id: 'ux-soon', title: 'UX soon', competency: 'ux', status: 'coming-soon', index: 5 },
    { id: 'delivery-1', title: 'Delivery skill', competency: 'delivery', status: 'ready', index: 1 },
  ];

  it('picks the lowest-index unmastered ready skill for the competency', () => {
    const picked = pickPracticeSkill('ux', skills, new Set());
    expect(picked?.id).toBe('ux-1');
  });

  it('skips mastered skills and coming-soon skills', () => {
    const picked = pickPracticeSkill('ux', skills, new Set(['ux-1']));
    expect(picked?.id).toBe('ux-2');
  });

  it('no-data fallback: returns null once every ready skill is mastered', () => {
    const picked = pickPracticeSkill(
      'ux',
      skills,
      new Set(['ux-1', 'ux-2', 'ux-3']),
    );
    expect(picked).toBeNull();
  });

  it('never crosses competencies', () => {
    const picked = pickPracticeSkill('delivery', skills, new Set());
    expect(picked?.id).toBe('delivery-1');
  });
});

describe('chooseWorkloadBlock', () => {
  const label = (c: string) => c.toUpperCase();

  it('assembles the weakest competency + its best practice skill + a why-line', () => {
    const block = chooseWorkloadBlock({
      candidates: [
        { competency: 'ux', coverage: coverage(0, 2) }, // 0.0, weakest
        { competency: 'delivery', coverage: coverage(1, 2) }, // 0.5
      ],
      skills: [
        { id: 'ux-1', title: 'UX skill 1', competency: 'ux', status: 'ready', index: 1 },
        { id: 'delivery-1', title: 'Delivery skill', competency: 'delivery', status: 'ready', index: 1 },
      ],
      masteredIds: new Set(),
      competencyLabel: label,
    });
    expect(block?.skillId).toBe('ux-1');
    expect(block?.competency).toBe('ux');
    expect(block?.whyLine).toContain('UX');
    expect(block?.whyLine).toContain('0%');
  });

  it('falls through to the next-weakest live competency when the weakest has nothing left to assign', () => {
    const block = chooseWorkloadBlock({
      candidates: [
        { competency: 'ux', coverage: coverage(1, 1) }, // 1.0 but somehow ranked weakest-eligible in this synthetic case
        { competency: 'delivery', coverage: coverage(0, 1) }, // 0.0
      ],
      skills: [
        // ux's only ready skill is already mastered -> nothing to assign for ux
        { id: 'ux-1', title: 'UX skill 1', competency: 'ux', status: 'ready', index: 1 },
        { id: 'delivery-1', title: 'Delivery skill', competency: 'delivery', status: 'ready', index: 1 },
      ],
      masteredIds: new Set(['ux-1']),
      competencyLabel: label,
    });
    expect(block?.skillId).toBe('delivery-1');
    expect(block?.competency).toBe('delivery');
  });

  it('no-data fallback: returns null when nothing live has anything left to assign', () => {
    const block = chooseWorkloadBlock({
      candidates: [{ competency: 'ux', coverage: coverage(1, 1) }],
      skills: [{ id: 'ux-1', title: 'UX skill 1', competency: 'ux', status: 'ready', index: 1 }],
      masteredIds: new Set(['ux-1']),
      competencyLabel: label,
    });
    expect(block).toBeNull();
  });
});

describe('formatWhyLine', () => {
  it('mentions only lesson coverage when there is no sim evidence', () => {
    const line = formatWhyLine({ competencyLabel: 'UX', coverageFraction: 0.4, simScore: null });
    expect(line).toBe('Why this: UX is your weakest live competency at 40% mastered.');
  });

  it('mentions both signals once sim evidence exists', () => {
    const line = formatWhyLine({ competencyLabel: 'UX', coverageFraction: 0.4, simScore: 62 });
    expect(line).toContain('40% mastered in lessons');
    expect(line).toContain('62% shown in the sim');
  });
});

describe('buildMentorLine', () => {
  it('names the due count and weakest competency when both exist', () => {
    const line = buildMentorLine({ dueCount: 2, streak: 5, weakestCompetencyLabel: 'UX' });
    expect(line).toContain('2 judgment calls are due');
    expect(line).toContain('UX');
    expect(line).toContain('Streak: 5.');
  });

  it('reads calmly when the deck is clear (singular phrasing, no punishment tone)', () => {
    const line = buildMentorLine({ dueCount: 0, streak: 0, weakestCompetencyLabel: 'Delivery' });
    expect(line).toContain('Your review deck is clear');
    expect(line).not.toContain('Streak:');
  });

  it('no-data fallback: reads as a win when every live competency is mastered', () => {
    const line = buildMentorLine({ dueCount: 0, streak: 1, weakestCompetencyLabel: null });
    expect(line.toLowerCase()).toContain("you've mastered every live competency");
  });
});
