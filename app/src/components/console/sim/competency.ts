import type { GameScore } from '@/engine/score';
import type { Competency } from '@/curriculum/types';
import { rungForScenario } from '@/scenarios/ladder';

/**
 * Map a finished simulation run to a per-competency 0-100 read.
 *
 * The five scoreboard dimensions each credit the competencies they exercise, at
 * that dimension's score. On top, the rung's dominant competencies (the ones the
 * scenario is built to stress) are credited at the overall score, so the higher
 * rungs surface higher-altitude competencies (strategy, ethics) that the five
 * dimensions do not name directly. Best score wins per competency.
 *
 * This is sim EVIDENCE, kept in its own store and shown as its own band on the
 * progress page. It deliberately does NOT mark curriculum skills mastered, which
 * would falsely certify levels: doing a sim well is evidence of judgment, not a
 * substitute for the lesson and drill reps a skill is gated on.
 */
const DIMENSION_COMPETENCIES: Record<
  Exclude<keyof GameScore, 'total'>,
  Competency[]
> = {
  valueDelivered: ['business-outcome', 'delivery'],
  customerLoyalty: ['voice-of-customer', 'ux'],
  teamHealth: ['team-leadership'],
  stakeholderTrust: ['stakeholder-mgmt', 'managing-up'],
  productIntegrity: ['quality', 'technical'],
};

export function deriveRunCompetencies(
  score: GameScore,
  scenarioId: string,
): Partial<Record<Competency, number>> {
  const out: Partial<Record<Competency, number>> = {};
  const credit = (c: Competency, value: number) => {
    out[c] = Math.max(out[c] ?? 0, Math.round(value));
  };

  (Object.keys(DIMENSION_COMPETENCIES) as Array<Exclude<keyof GameScore, 'total'>>).forEach(
    (dim) => {
      for (const c of DIMENSION_COMPETENCIES[dim]) credit(c, score[dim]);
    },
  );

  const rung = rungForScenario(scenarioId);
  if (rung) {
    for (const c of rung.dominantCompetencies) credit(c, score.total);
  }

  return out;
}
