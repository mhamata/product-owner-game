import type { GameScore } from '@/engine/score';
import type { EventCard } from '@/engine/types';
import type { Competency } from '@/curriculum/types';
import { rungForScenario } from '@/scenarios/ladder';
import {
  JUDGMENT_SCENARIOS,
  JUDGMENT_COMPETENCY_LABEL,
  type JudgmentCompetency,
} from '@/curriculum/judgment';

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

/**
 * Pick the judgment-deck cards to resurface after a run, from where the player
 * was thinnest. Each scoreboard dimension maps to the kind of decision its
 * weakness implies; the run's lowest dimension chooses the focus, and we return
 * the matching cards so the sim can pull them to the front of the spaced-
 * repetition deck. A run that was strong everywhere (no dimension under 70)
 * returns null: there is nothing to single out.
 */
const DIMENSION_REVIEW_FOCUS: Record<Exclude<keyof GameScore, 'total'>, JudgmentCompetency> = {
  valueDelivered: 'prioritization',
  customerLoyalty: 'discovery-delivery',
  teamHealth: 'scope-quality',
  stakeholderTrust: 'stakeholder-influence',
  productIntegrity: 'scope-quality',
};

export interface ReviewFocus {
  competency: JudgmentCompetency;
  label: string;
  cardIds: string[];
}

export function deriveReviewFocus(score: GameScore): ReviewFocus | null {
  const dims = Object.keys(DIMENSION_REVIEW_FOCUS) as Array<Exclude<keyof GameScore, 'total'>>;
  const weakest = dims.map((d) => ({ d, v: score[d] })).sort((a, b) => a.v - b.v)[0];
  if (weakest.v >= 70) return null; // a strong run: nothing to single out

  const competency = DIMENSION_REVIEW_FOCUS[weakest.d];
  const cardIds = JUDGMENT_SCENARIOS.filter((s) => s.competency === competency).map((s) => s.id);
  if (cardIds.length === 0) return null;

  return { competency, label: JUDGMENT_COMPETENCY_LABEL[competency], cardIds };
}

/**
 * Map a fired event's category to the judgment-deck competency it is closest
 * to, so an in-sim event can resurface matching Leitner cards the moment it
 * lands — not just at end-of-run (see `deriveReviewFocus` above, which stays
 * as the weakest-dimension resurface at the debrief).
 *
 * NOTE: no existing content links `EventCard.category` to `JudgmentCompetency`
 * directly — the two vocabularies were built independently (one categorizes
 * engine events, the other categorizes judgment-deck scenarios). This table is
 * a new, deliberately conservative one-to-one mapping between the two EXISTING
 * vocabularies; it does not introduce a third tag system. Each pairing:
 *   stakeholder -> stakeholder-influence  (direct match)
 *   vendor      -> build-buy              (direct match: vendor calls ARE build-vs-buy)
 *   regulatory  -> ethics                 (compliance trade-offs read as ethics calls)
 *   team        -> scope-quality          (protecting the team is a scope/quality trade)
 *   customer    -> discovery-delivery     (customer signal shapes discovery vs shipping)
 *   market      -> metrics                (reading external signals = metrics interpretation)
 *   strategic   -> prioritization         (strategic trade-offs are prioritization calls)
 *   tech        -> ship-polish            (tech risk events are ship-now-vs-harden calls)
 */
export const EVENT_CATEGORY_JUDGMENT_COMPETENCY: Record<EventCard['category'], JudgmentCompetency> = {
  stakeholder: 'stakeholder-influence',
  team: 'scope-quality',
  customer: 'discovery-delivery',
  vendor: 'build-buy',
  market: 'metrics',
  tech: 'ship-polish',
  strategic: 'prioritization',
  regulatory: 'ethics',
};

/**
 * Judgment-deck card ids to resurface when an event of this category fires.
 * Never throws: an unmapped/unknown category (future content this table has
 * not been extended for) safely returns an empty list, and `resurface([])` is
 * itself a no-op, so a missing mapping never blocks the sim.
 */
export function judgmentCardIdsForEventCategory(category: string): string[] {
  const competency = (
    EVENT_CATEGORY_JUDGMENT_COMPETENCY as Record<string, JudgmentCompetency | undefined>
  )[category];
  if (!competency) return [];
  return JUDGMENT_SCENARIOS.filter((s) => s.competency === competency).map((s) => s.id);
}
