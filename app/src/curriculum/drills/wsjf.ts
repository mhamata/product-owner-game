import type { ScoreRankDrill } from './types';

/**
 * Cost of Delay → WSJF drill, de-specialized to generic SaaS / platform work.
 * WSJF = (Value + Time Criticality + Risk Reduction) / Job Size.
 * Factors use the Fibonacci scale (1,2,3,5,8,13,21). Higher = do sooner.
 *
 * Teaching point preserved: the big platform rewrite has the highest raw value
 * but its enormous size kills the ratio — small-but-urgent beats
 * large-but-transformative on a short horizon.
 */
export const wsjfDrill: ScoreRankDrill = {
  scenario: 'SaaS · quarterly planning',
  prompt:
    'Cost of Delay made concrete. Score each item with WSJF, then rank them by what to do first.',
  formula: '(Value + Time Criticality + Risk Reduction) / Job Size',
  factors: [
    { key: 'value', label: 'Value', format: 'int' },
    { key: 'time', label: 'Time crit.', format: 'int' },
    { key: 'risk', label: 'Risk red.', format: 'int' },
    { key: 'size', label: 'Job Size', format: 'int' },
  ],
  rows: [
    {
      id: 'compliance',
      name: 'SOC 2 evidence automation',
      context:
        'Hard audit date this quarter · slipping it risks losing enterprise deals in the pipeline',
      factors: { value: 8, time: 13, risk: 8, size: 13 },
      reasoning:
        'A fixed deadline drives time criticality sky-high. Even at a sizeable 13, the ratio wins — urgency carries it.',
    },
    {
      id: 'dashboard',
      name: 'Usage analytics dashboard',
      context:
        'High everyday value for customers · but no deadline pressure and a modest build',
      factors: { value: 8, time: 3, risk: 3, size: 8 },
      reasoning:
        'Genuinely valuable, but with no clock running its time criticality is low. Still ranks well thanks to a small size.',
    },
    {
      id: 'cost-optimizer',
      name: 'Cloud cost optimizer',
      context:
        'Saves infra spend · nice to have, but no external pressure to ship it now',
      factors: { value: 5, time: 2, risk: 2, size: 8 },
      reasoning:
        'Soft value, no urgency — the kind of work that always loses to anything with a deadline.',
    },
    {
      id: 'rewrite',
      name: 'Event-driven platform rewrite',
      context:
        'Huge long-term payoff · but a multi-quarter effort with no near-term forcing function',
      factors: { value: 13, time: 2, risk: 5, size: 21 },
      reasoning:
        'Highest raw value of the four — and it still ranks last. The enormous size (21) crushes the ratio.',
    },
  ],
  score: (r) =>
    (r.factors.value + r.factors.time + r.factors.risk) / r.factors.size,
  insight:
    'WSJF’s gift is that the platform rewrite — the most valuable item — ranks last once you divide by size. Small-but-urgent beats large-but-transformative when the horizon is short.',
};
