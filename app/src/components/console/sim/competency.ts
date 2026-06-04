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

/**
 * Name the strategy the player actually ran, from where their final scoreboard
 * leans. The point is to reinforce that these scenarios have no single dominant
 * line: a growth-first run and a foundation-first run are both valid, they just
 * trade differently. A nearly even board reads as a balanced operator.
 */
export interface RunArchetype {
  label: string;
  blurb: string;
}

const ARCHETYPE: Record<
  Exclude<keyof GameScore, 'total'>,
  { label: string; phrase: string; foil: string }
> = {
  valueDelivered: { label: 'Growth-first', phrase: 'shipping value and revenue', foil: 'a foundation-first' },
  customerLoyalty: { label: 'Customer-first', phrase: 'keeping customers happy', foil: 'a growth-first' },
  teamHealth: { label: 'Team-first', phrase: 'protecting the team', foil: 'a growth-first' },
  stakeholderTrust: { label: 'Trust-first', phrase: 'managing stakeholders', foil: 'a delivery-first' },
  productIntegrity: { label: 'Foundation-first', phrase: 'paying down debt and quality', foil: 'a growth-first' },
};

export function deriveArchetype(score: GameScore): RunArchetype {
  const dims = Object.keys(ARCHETYPE) as Array<Exclude<keyof GameScore, 'total'>>;
  const sorted = dims.map((d) => ({ d, v: score[d] })).sort((a, b) => b.v - a.v);
  const spread = sorted[0].v - sorted[sorted.length - 1].v;

  if (spread <= 8) {
    return {
      label: 'Balanced operator',
      blurb:
        'You spread your attention evenly. No front ran away and none was starved. A sharper bet on one dimension was an equally valid line.',
    };
  }

  const top = ARCHETYPE[sorted[0].d];
  return {
    label: top.label,
    blurb: `You leaned hardest on ${top.phrase}. There was no single right line here: ${top.foil} run was just as valid, it would have traded differently.`,
  };
}
