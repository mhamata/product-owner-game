import { describe, it, expect, beforeEach } from 'vitest';
import type { GameScore } from '@/engine/score';
import { deriveRunCompetencies } from '../competency';
import { useSimEvidenceStore } from '@/store/simEvidenceStore';

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
