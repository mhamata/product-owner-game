import { describe, it, expect } from 'vitest';
import { INDUSTRIES } from '@/curriculum/industries';
import { COMPETENCIES, type Competency } from '@/curriculum/types';
import { JUDGMENT_COMPETENCY_LABEL } from '@/curriculum/judgment';
import {
  COMPETENCY_TO_JUDGMENT,
  judgmentCompetencyFor,
  pickRefreshIndustry,
  pickMaintenanceScenarios,
  buildRefreshSession,
} from '../skillRefresh';

describe('COMPETENCY_TO_JUDGMENT', () => {
  it('maps every curriculum competency to a valid judgment bucket', () => {
    for (const competency of Object.keys(COMPETENCIES) as Competency[]) {
      const bucket = judgmentCompetencyFor(competency);
      expect(JUDGMENT_COMPETENCY_LABEL[bucket]).toBeTruthy();
    }
  });

  it('has exactly one entry per curriculum competency (no gaps, no extras)', () => {
    const competencyIds = Object.keys(COMPETENCIES) as Competency[];
    expect(Object.keys(COMPETENCY_TO_JUDGMENT).sort()).toEqual([...competencyIds].sort());
  });
});

describe('pickRefreshIndustry', () => {
  it('always returns a different industry than the input', () => {
    for (const ind of INDUSTRIES) {
      expect(pickRefreshIndustry(ind.id)).not.toBe(ind.id);
    }
  });

  it('is deterministic (pure, no randomness)', () => {
    expect(pickRefreshIndustry('saas')).toBe(pickRefreshIndustry('saas'));
  });

  it('cycles through every industry, wrapping around', () => {
    const last = INDUSTRIES[INDUSTRIES.length - 1].id;
    expect(pickRefreshIndustry(last)).toBe(INDUSTRIES[0].id);
  });
});

describe('pickMaintenanceScenarios', () => {
  it('returns up to `count` scenarios tagged with the bucket', () => {
    const scenarios = pickMaintenanceScenarios('metrics', 2);
    expect(scenarios.length).toBeLessThanOrEqual(2);
    for (const s of scenarios) expect(s.competency).toBe('metrics');
  });

  it('returns fewer than count when the pool does not have enough', () => {
    const scenarios = pickMaintenanceScenarios('metrics', 2, []);
    expect(scenarios).toEqual([]);
  });
});

describe('buildRefreshSession', () => {
  it('composes a different-industry session with up to 2 scenarios', () => {
    const session = buildRefreshSession('data-fluency', 'saas');
    expect(session.industry).not.toBe('saas');
    expect(session.scenarios.length).toBeGreaterThan(0);
    expect(session.scenarios.length).toBeLessThanOrEqual(2);
    for (const s of session.scenarios) {
      expect(s.competency).toBe(judgmentCompetencyFor('data-fluency'));
    }
  });
});
