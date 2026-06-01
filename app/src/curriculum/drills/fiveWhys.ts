import type { SequencingDrill } from './types';

/**
 * 5-Whys drill — de-specialized to a generic SaaS incident.
 *
 * The /methods library keeps the open-ended "write your own whys" version.
 * For the Console lesson we use a DETERMINISTIC variant: the five causes are
 * given shuffled and the learner orders them surface → root. This preserves the
 * core discipline (don't stop at the technical cause; the root is
 * organizational) while staying client-gradable without an LLM.
 */
export const fiveWhysDrill: SequencingDrill = {
  scenario: 'SaaS · post-incident review',
  symptom: 'Checkout was down for 90 minutes on Tuesday; customers could not pay.',
  prompt:
    'Order these five causes from the surface symptom down to the true root. Each "why" should go one level deeper than the last.',
  // CANONICAL order: surface (technical) → root (organizational).
  steps: [
    {
      id: 's1',
      text: 'A deploy shipped a payment-service config that pointed at the wrong API endpoint.',
      layer: 'Technical cause — not the root',
    },
    {
      id: 's2',
      text: 'The bad config passed code review because no one noticed the changed value.',
      layer: 'Process gap — getting closer',
    },
    {
      id: 's3',
      text: 'There were no automated tests covering payment configuration.',
      layer: 'Process cause',
    },
    {
      id: 's4',
      text: 'No one owns the payment integration’s test coverage.',
      layer: 'Organizational cause',
    },
    {
      id: 's5',
      text: 'Payments was launched as a side project and never staffed as an owned service.',
      layer: 'Root — organizational. The fix is ownership + process, not a one-line patch.',
    },
  ],
  insight:
    'The hardest discipline is not stopping at the first human-error cause ("the reviewer missed it"). Real roots are almost always organizational or process-level — if your last why is still technical, go deeper.',
};
