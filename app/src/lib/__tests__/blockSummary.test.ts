import { describe, it, expect } from 'vitest';
import { getSkill, masterableSkills } from '@/curriculum/data';
import { FOG_GATE_LIST } from '../fogOfWar';
import { deriveBlockSummary } from '../blockSummary';
import { DECAY_FULL_STRENGTH } from '../masteryDecay';

// A skill a real fog-of-war gate names, so the "sim" closer-line branch is
// exercised against the live registry rather than a hand-picked guess.
const gatedSkill = getSkill(FOG_GATE_LIST[0].unlockSkillOrCompetency)!;
// A plain ladder skill with no fog gate, for the pedagogical-fallback branch.
const plainSkill = masterableSkills.find(
  (s) => !FOG_GATE_LIST.some((g) => g.unlockSkillOrCompetency === s.id),
)!;

const NOW = Date.parse('2026-06-04T12:00:00Z');

describe('deriveBlockSummary', () => {
  it('carries the tally through untouched', () => {
    const summary = deriveBlockSummary({
      skill: plainSkill,
      tally: { correct: 2, total: 4 },
      before: undefined,
      after: { mastery: 0.5, lastPracticedAt: NOW },
      now: NOW,
    });
    expect(summary.tally).toEqual({ correct: 2, total: 4 });
  });

  it('shows "X% to mastery" (no closer line) when the attempt did not reach mastery', () => {
    const summary = deriveBlockSummary({
      skill: plainSkill,
      tally: { correct: 3, total: 4 },
      before: undefined,
      after: { mastery: 0.75, lastPracticedAt: NOW },
      now: NOW,
    });
    expect(summary.masteredBefore).toBe(false);
    expect(summary.masteredAfter).toBe(false);
    expect(summary.masteryPercent).toBe(75);
    expect(summary.closerLine).toBeNull();
  });

  it('reports a real strength delta and a closer line the moment a skill newly masters', () => {
    const summary = deriveBlockSummary({
      skill: plainSkill,
      tally: { correct: 4, total: 4 },
      before: undefined, // never attempted before
      after: { mastery: 1, lastPracticedAt: NOW, masteredAt: NOW },
      now: NOW,
    });
    expect(summary.masteredBefore).toBe(false);
    expect(summary.masteredAfter).toBe(true);
    expect(summary.strengthBefore).toBe(0);
    expect(summary.strengthAfter).toBe(DECAY_FULL_STRENGTH);
    expect(summary.strengthDelta).toBe(DECAY_FULL_STRENGTH);
    expect(summary.closerLine).not.toBeNull();
    expect(summary.closerLine!.text.length).toBeGreaterThan(0);
  });

  it('sources a "sim" closer line from the real fog-of-war registry, never fabricated', () => {
    const summary = deriveBlockSummary({
      skill: gatedSkill,
      tally: { correct: 1, total: 1 },
      before: undefined,
      after: { mastery: 1, lastPracticedAt: NOW, masteredAt: NOW },
      now: NOW,
    });
    expect(summary.closerLine).not.toBeNull();
    expect(summary.closerLine!.kind).toBe('sim');
    expect(summary.closerLine!.text).toBe(
      `Unlocks ${FOG_GATE_LIST[0].label} on the Product screen — the fog lifts on every future run, permanently.`,
    );
  });

  it('shows no closer line and no fabricated delta when re-practicing an already-fresh mastered skill', () => {
    const summary = deriveBlockSummary({
      skill: plainSkill,
      tally: { correct: 4, total: 4 },
      before: { mastery: 1, lastPracticedAt: NOW, masteredAt: NOW - 1000 },
      after: { mastery: 1, lastPracticedAt: NOW, masteredAt: NOW - 1000 },
      now: NOW,
    });
    expect(summary.masteredBefore).toBe(true);
    expect(summary.masteredAfter).toBe(true);
    expect(summary.strengthBefore).toBe(DECAY_FULL_STRENGTH);
    expect(summary.strengthAfter).toBe(DECAY_FULL_STRENGTH);
    expect(summary.strengthDelta).toBeNull(); // the model genuinely did not move
    expect(summary.closerLine).toBeNull(); // nothing NEW was unlocked
  });

  it('reports a real strength delta when a refresh clears rust on an already-mastered skill', () => {
    const fiftyDaysAgo = NOW - 50 * 86_400_000; // past the decay floor
    const summary = deriveBlockSummary({
      skill: plainSkill,
      tally: { correct: 2, total: 2 },
      before: { mastery: 1, lastPracticedAt: fiftyDaysAgo, masteredAt: fiftyDaysAgo },
      after: { mastery: 1, lastPracticedAt: NOW, masteredAt: fiftyDaysAgo },
      now: NOW,
    });
    expect(summary.strengthBefore).toBeLessThan(DECAY_FULL_STRENGTH);
    expect(summary.strengthAfter).toBe(DECAY_FULL_STRENGTH);
    expect(summary.strengthDelta).toBe(summary.strengthAfter - summary.strengthBefore);
    expect(summary.closerLine).toBeNull(); // already mastered before; nothing new
  });
});
