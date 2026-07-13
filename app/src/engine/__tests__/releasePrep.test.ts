import { describe, it, expect } from 'vitest';
import { createGame, step } from '../step';
import { makeScenario } from './fixtures';
import { applyReleasePrep, releasePrepQualityFromScore, RELEASE_PREP_EFFECTS } from '../releasePrep';
import type { TechState } from '../types';

/**
 * Sim 2.0 W5-J: the in-sim graded-artifact moment's engine hook. Pins the
 * score bands, the exact bounded effect table, phase-gating, no-op-when-
 * never-called, and determinism — the same discipline the sibling engine
 * modules (board.ts, releasePrep's `tech` cousin) already carry tests for.
 */

describe('releasePrepQualityFromScore', () => {
  it('bands >= 80 as strong', () => {
    expect(releasePrepQualityFromScore(80)).toBe('strong');
    expect(releasePrepQualityFromScore(100)).toBe('strong');
  });

  it('bands [60, 80) as mixed', () => {
    expect(releasePrepQualityFromScore(60)).toBe('mixed');
    expect(releasePrepQualityFromScore(79)).toBe('mixed');
  });

  it('bands below 60 as weak', () => {
    expect(releasePrepQualityFromScore(59)).toBe('weak');
    expect(releasePrepQualityFromScore(0)).toBe('weak');
  });
});

describe('applyReleasePrep', () => {
  const baseTech: TechState = {
    releaseCost: 3,
    capacityBaseline: 15,
    capacityVariance: 3,
    techDebt: 20,
    reliability: 7,
    cycleTime: 1.0,
    investmentsDone: [],
    lastTechInvestmentIter: null,
  };

  it('strong narrows capacityVariance by 1 and leaves techDebt untouched', () => {
    const next = applyReleasePrep(baseTech, 'strong');
    expect(next.capacityVariance).toBe(2);
    expect(next.techDebt).toBe(20);
  });

  it('mixed is a true no-op on both knobs', () => {
    const next = applyReleasePrep(baseTech, 'mixed');
    expect(next.capacityVariance).toBe(3);
    expect(next.techDebt).toBe(20);
  });

  it('weak widens capacityVariance by 1 and adds a small techDebt tax', () => {
    const next = applyReleasePrep(baseTech, 'weak');
    expect(next.capacityVariance).toBe(4);
    expect(next.techDebt).toBe(22);
  });

  it('matches the documented RELEASE_PREP_EFFECTS table exactly', () => {
    for (const quality of ['strong', 'mixed', 'weak'] as const) {
      const effect = RELEASE_PREP_EFFECTS[quality];
      const next = applyReleasePrep(baseTech, quality);
      expect(next.capacityVariance).toBe(baseTech.capacityVariance + effect.capacityVarianceDelta);
      expect(next.techDebt).toBe(baseTech.techDebt + effect.techDebtDelta);
    }
  });

  it('clamps capacityVariance at the floor of 1 (repeated strong nudges cannot go negative)', () => {
    let tech = { ...baseTech, capacityVariance: 1 };
    tech = applyReleasePrep(tech, 'strong');
    expect(tech.capacityVariance).toBe(1);
  });

  it('clamps capacityVariance at the ceiling of 8', () => {
    let tech = { ...baseTech, capacityVariance: 8 };
    tech = applyReleasePrep(tech, 'weak');
    expect(tech.capacityVariance).toBe(8);
  });

  it('clamps techDebt at the ceiling of 100', () => {
    const tech = { ...baseTech, techDebt: 99 };
    const next = applyReleasePrep(tech, 'weak');
    expect(next.techDebt).toBe(100);
  });

  it('clamps techDebt at the floor of 0 (never goes negative, even though no band drives it below 0 today)', () => {
    const tech = { ...baseTech, techDebt: 0 };
    const next = applyReleasePrep(tech, 'strong');
    expect(next.techDebt).toBe(0);
  });

  it('is deterministic: same input always yields the same output', () => {
    const a = applyReleasePrep(baseTech, 'weak');
    const b = applyReleasePrep(baseTech, 'weak');
    expect(a).toEqual(b);
  });

  it('never mutates the input tech object', () => {
    const before = { ...baseTech };
    applyReleasePrep(baseTech, 'weak');
    expect(baseTech).toEqual(before);
  });
});

describe('step(): set-release-prep action', () => {
  it('nudges tech per the effect table when dispatched during planning', () => {
    const scenario = makeScenario();
    let g = createGame(scenario, 'seed');
    expect(g.phase).toBe('planning');
    const before = g.tech.capacityVariance;
    g = step(g, { type: 'set-release-prep', quality: 'weak' }, scenario);
    expect(g.tech.capacityVariance).toBe(before + 1);
    expect(g.tech.techDebt).toBe(2);
  });

  it('is a no-op outside planning (e.g. already committed)', () => {
    const scenario = makeScenario();
    let g = createGame(scenario, 'seed');
    g = step(g, { type: 'commit-iteration' }, scenario);
    expect(g.phase).toBe('committed');
    const before = g.tech;
    g = step(g, { type: 'set-release-prep', quality: 'weak' }, scenario);
    expect(g.tech).toEqual(before);
  });

  it('never dispatched => tech is untouched, byte-for-byte (no-op-by-omission)', () => {
    const scenario = makeScenario();
    const g = createGame(scenario, 'seed');
    expect(g.tech).toEqual({ ...scenario.tech, investmentsDone: [...scenario.tech.investmentsDone] });
  });

  it('a mixed dispatch changes nothing, confirming the action itself is a legitimate no-op path', () => {
    const scenario = makeScenario();
    let g = createGame(scenario, 'seed');
    const before = g.tech;
    g = step(g, { type: 'set-release-prep', quality: 'mixed' }, scenario);
    expect(g.tech).toEqual(before);
  });

  it('old persisted saves (no releasePrep-related fields) still load and step normally', () => {
    // GameState never gained a new field for this slice — the action only
    // ever touches the pre-existing `tech` shape — so any pre-W5-J save
    // continues to work with zero migration. This is exercised implicitly by
    // every other test in this file (createGame's `tech` is the same shape a
    // pre-W5-J snapshot would already have), pinned explicitly here.
    const scenario = makeScenario();
    const g = createGame(scenario, 'seed');
    expect(Object.keys(g)).not.toContain('releasePrep');
    expect(Object.keys(g.tech)).toEqual([
      'releaseCost',
      'capacityBaseline',
      'capacityVariance',
      'techDebt',
      'reliability',
      'cycleTime',
      'investmentsDone',
      'lastTechInvestmentIter',
    ]);
  });
});
