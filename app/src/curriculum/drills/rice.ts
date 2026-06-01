import type { ScoreRankDrill } from './types';

/**
 * RICE scoring drill — de-specialized to a generic SaaS backlog.
 * RICE = (Reach × Impact × Confidence) / Effort. Higher = higher priority.
 *
 * The teaching point survives the de-specialization: the middle option has the
 * weakest confidence (the factor teams most often inflate to rescue a pet
 * feature), so halving it tanks the score.
 */
export const riceDrill: ScoreRankDrill = {
  scenario: 'SaaS · product backlog',
  prompt:
    'Three candidate features for next quarter. Score each with RICE, then rank them 1–3.',
  formula: '(Reach × Impact × Confidence) / Effort',
  factors: [
    { key: 'reach', label: 'Reach', format: 'int' },
    { key: 'impact', label: 'Impact', format: 'int' },
    { key: 'confidence', label: 'Confidence', format: 'percent' },
    { key: 'effort', label: 'Effort', format: 'months' },
  ],
  rows: [
    {
      id: 'sso',
      name: 'Single sign-on (SSO)',
      context:
        '15,000 seats/qtr ask for it · table-stakes for enterprise deals · backed by solid sales + survey data',
      factors: { reach: 15000, impact: 3, confidence: 0.8, effort: 12 },
      reasoning:
        'High reach and high confidence carry it despite the heaviest effort — the strongest overall bet.',
    },
    {
      id: 'templates',
      name: 'Shareable templates',
      context:
        '8,000 users/qtr · strong signal, but mostly from a loud forum thread rather than research',
      factors: { reach: 8000, impact: 2, confidence: 0.5, effort: 6 },
      reasoning:
        'The weakest confidence (0.5) is the tell — halving it would tank the score. This is the factor teams inflate to rescue a pet feature.',
    },
    {
      id: 'audit-log',
      name: 'Audit log export',
      context:
        '3,000 admins/qtr · unblocks security reviews · well-understood scope',
      factors: { reach: 3000, impact: 2, confidence: 0.8, effort: 4 },
      reasoning:
        'Small reach, but high confidence and low effort make it a respectable, low-risk pick.',
    },
  ],
  score: (r) =>
    (r.factors.reach * r.factors.impact * r.factors.confidence) /
    r.factors.effort,
  insight:
    'Confidence is the lever to defend out loud. Shareable templates looks tempting, but its 0.5 confidence is doing the damage — say so explicitly rather than quietly rounding it up.',
};
