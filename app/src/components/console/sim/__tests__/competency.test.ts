import { describe, it, expect, beforeEach } from 'vitest';
import type { GameScore } from '@/engine/score';
import { deriveRunCompetencies, deriveArchetype, deriveReviewFocus } from '../competency';
import { useSimEvidenceStore } from '@/store/simEvidenceStore';
import { useReviewStore, todayISO } from '@/store/reviewStore';

const score: GameScore = {
  valueDelivered: 80,
  customerLoyalty: 60,
  teamHealth: 40,
  stakeholderTrust: 90,
  productIntegrity: 50,
  total: 64,
};

describe('deriveRunCompetencies', () => {
  it('credits each scoreboard dimension to its competencies at the dimension score', () => {
    const r = deriveRunCompetencies(score, 'unknown-scenario');
    expect(r['business-outcome']).toBe(80); // valueDelivered
    expect(r['delivery']).toBe(80);
    expect(r['stakeholder-mgmt']).toBe(90); // stakeholderTrust
    expect(r['quality']).toBe(50); // productIntegrity
    expect(r['team-leadership']).toBe(40); // teamHealth
  });

  it("credits a rung's dominant competencies at the overall score", () => {
    // The 'regulated-launch' rung's dominant competencies include strategic-impact
    // and ethics, which no scoreboard dimension feeds directly.
    const r = deriveRunCompetencies(score, 'regulated-launch');
    expect(r['strategic-impact']).toBe(64); // from total
    expect(r['ethics']).toBe(64);
    // stakeholder-mgmt is fed by both the dimension (90) and the dominant (64): best wins
    expect(r['stakeholder-mgmt']).toBe(90);
  });
});

describe('simEvidenceStore', () => {
  beforeEach(() => useSimEvidenceStore.getState().reset());

  it('keeps the best score per competency across runs', () => {
    const s = useSimEvidenceStore.getState();
    s.recordRun({ delivery: 50, quality: 70 });
    s.recordRun({ delivery: 80, ux: 30 });
    const { scores } = useSimEvidenceStore.getState();
    expect(scores.delivery).toBe(80); // best of 50 and 80
    expect(scores.quality).toBe(70);
    expect(scores.ux).toBe(30);
  });
});

describe('deriveArchetype', () => {
  it('names the leading dimension when the board is lopsided', () => {
    const a = deriveArchetype({
      valueDelivered: 90,
      customerLoyalty: 40,
      teamHealth: 40,
      stakeholderTrust: 45,
      productIntegrity: 40,
      total: 51,
    });
    expect(a.label).toBe('Growth-first');
  });

  it('reads a near-even board as a balanced operator', () => {
    const a = deriveArchetype({
      valueDelivered: 62,
      customerLoyalty: 60,
      teamHealth: 58,
      stakeholderTrust: 61,
      productIntegrity: 59,
      total: 60,
    });
    expect(a.label).toBe('Balanced operator');
  });
});

describe('deriveReviewFocus', () => {
  it('returns null for a strong run with no thin spot', () => {
    const r = deriveReviewFocus({
      valueDelivered: 80,
      customerLoyalty: 75,
      teamHealth: 72,
      stakeholderTrust: 90,
      productIntegrity: 78,
      total: 79,
    });
    expect(r).toBeNull();
  });

  it('focuses prioritization when value delivered is the weakest dimension', () => {
    const r = deriveReviewFocus({
      valueDelivered: 20,
      customerLoyalty: 80,
      teamHealth: 80,
      stakeholderTrust: 80,
      productIntegrity: 80,
      total: 68,
    });
    expect(r?.competency).toBe('prioritization');
    expect(r?.cardIds.length ?? 0).toBeGreaterThan(0);
  });
});

describe('reviewStore.resurface', () => {
  beforeEach(() => useReviewStore.getState().resetReviews());

  it('pulls a scheduled-out card to today and leaves unseen cards untouched', () => {
    const r = useReviewStore.getState();
    r.review('card-a', 'correct'); // promotes: next due is in the future
    expect(useReviewStore.getState().getSchedule('card-a')?.due).not.toBe(todayISO());
    r.resurface(['card-a', 'card-unseen']);
    expect(useReviewStore.getState().getSchedule('card-a')?.due).toBe(todayISO());
    expect(useReviewStore.getState().getSchedule('card-unseen')).toBeUndefined();
  });
});
