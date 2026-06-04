import type { ConceptLessonContent } from './types';

/**
 * Product Manager · Experimentation: "A/B Test Design".
 * Framing a falsifiable hypothesis, choosing one primary metric, protecting it
 * with guardrail metrics, and randomizing so the test can actually prove cause.
 */
export const abTestDesign: ConceptLessonContent = {
  skillId: 'ab-test-design',
  hook: 'An experiment you designed after seeing the data can prove anything. The discipline is committing to the question before you run it.',
  framework: 'Hypothesis cards · Controlled experiments',
  sections: [
    {
      heading: 'Start with a falsifiable hypothesis',
      body: [
        'An A/B test splits users randomly into a control (current experience) and one or more variants (the change), then compares a metric. It only earns its keep if you write the hypothesis first: a specific, falsifiable prediction. A useful shape is: "We believe [change] will cause [effect on a metric] for [segment], because [reason]." If no plausible result could prove it wrong, it is a wish, not a hypothesis.',
        'Writing it down up front is what stops you from running the test, scanning the dashboard for any line that moved, and inventing a story afterward. You decide what would count as success before you can be tempted by the data.',
      ],
    },
    {
      heading: 'One primary metric, plus guardrails',
      body: [
        'Pick a single primary metric the test is trying to move: the one that decides ship-or-not. Optimizing for many metrics at once means you can always find one that "won," which is how teams fool themselves. But a narrow win can hide broad damage, so you also name guardrail metrics: things the change must not harm even while it lifts the primary one.',
      ],
      bullets: [
        'Primary metric: the one outcome the decision hinges on (e.g. checkout conversion).',
        'Guardrail metrics: must-not-break measures (e.g. refund rate, page-load time, unsubscribe rate, revenue per user).',
        'A variant that lifts the primary metric but trips a guardrail is not a win; it’s a trade you must surface.',
      ],
    },
    {
      heading: 'Randomize, and size the test before you start',
      body: [
        'Random assignment is what lets an A/B test claim causation rather than correlation: if the only systematic difference between the groups is the change, a difference in the metric is caused by the change. Assign at the right unit (usually the user, so one person sees a consistent experience), and decide the sample size and run length in advance from the effect you would care about. Starting without a planned stopping point is what leads to the peeking trap: calling a winner the moment a wobble looks good.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Designing an A/B test for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Hypothesis: "Showing a progress bar in onboarding will increase week-1 activation for new ${ctx.user}s, because it sets a clear finish line."`,
        'Primary metric: week-1 activation rate. That single number decides whether the variant ships.',
        (ctx) =>
          `Guardrails: support-ticket rate and median time-to-first-value must not get worse. A faster signup that confuses ${ctx.user}s is no win.`,
        'Randomize by user, compute the sample size needed to detect a 5-point lift, and set the run length before launch, then don’t peek early.',
      ],
      takeaway:
        'Write the hypothesis, pick one primary metric, name the guardrails, randomize, and fix the sample size, all before a single user is bucketed.',
    },
  ],
  takeaways: [
    'Write a falsifiable hypothesis first: "[change] will cause [effect] for [segment], because [reason]." Decide success before you see data.',
    'Choose one primary metric to decide the test, and protect it with guardrail metrics the change must not harm.',
    'Random assignment is what licenses a causal claim; size the test and set the run length in advance, before bucketing users.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Why is random assignment of users to control and variant essential to an A/B test?',
        options: [
          { id: 'a', label: 'It makes the test run faster by needing fewer users.' },
          {
            id: 'b',
            label:
              'It makes the change the only systematic difference between groups, so a metric difference can be attributed to the change (causation, not correlation).',
          },
          { id: 'c', label: 'It guarantees the variant will win.' },
        ],
        correctId: 'b',
        why: 'Randomization balances the groups on everything except the change. That is precisely what lets you claim the change caused any difference, rather than some hidden trait of who saw what.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A variant lifts checkout conversion (the primary metric) by 4%, but refund rate climbs sharply. Refund rate was set as a guardrail metric. What does this mean?',
        options: [
          { id: 'a', label: 'Ship it. The primary metric improved, which is all that matters.' },
          {
            id: 'b',
            label:
              'Not a clean win. The change breached a guardrail, so the conversion gain may be coming at a real cost that must be weighed before shipping.',
          },
          { id: 'c', label: 'The test is invalid and must be discarded entirely.' },
        ],
        correctId: 'b',
        why: 'Guardrail metrics exist to catch exactly this: a narrow win that causes broad harm. A higher refund rate may mean conversions are being pushed through that shouldn’t be, so the trade-off has to be surfaced, not ignored.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'A good experiment starts with a prediction that some result could prove wrong. What one word describes a hypothesis that is capable of being disproven?',
        accept: ['falsifiable', 'testable'],
        why: 'A hypothesis must be falsifiable: there has to be a possible outcome that would show it false. If nothing could disprove it, the test can’t actually teach you anything.',
        placeholder: 'one word',
      },
    ],
  },
};
