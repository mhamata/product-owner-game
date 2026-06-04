import type { ConceptLessonContent } from './types';

/**
 * Product Manager · Experimentation: "Significance & Cohorts".
 * Reading A/B results honestly: statistical significance, the peeking trap, and
 * using cohort & funnel analysis to see WHERE and for WHOM a number moved.
 */
export const readingResults: ConceptLessonContent = {
  skillId: 'reading-results',
  hook: 'The fastest way to ship a bad change is to call a winner too early. Reading results honestly is a skill you can be taught out of fooling yourself.',
  framework: 'Statistical significance · Cohort & funnel analysis',
  sections: [
    {
      heading: 'Statistical significance, in plain terms',
      body: [
        'When a variant beats control by a few percent, the first question is whether the gap is real or just noise. Statistical significance asks: if the change truly did nothing, how likely is a difference this big by pure chance? The p-value is that probability; a common bar is p < 0.05 (under a 5% chance it’s a fluke). Significance is usually paired with statistical power: having a large enough sample to detect a real effect if one exists.',
        'Two cautions. Significant does not mean large: a tiny, useless effect can be statistically significant with enough users. And not significant does not mean "no effect": it may mean the test was simply too small to tell. Report the effect size and a confidence interval, not just a green "significant" badge.',
      ],
    },
    {
      heading: 'The peeking trap',
      body: [
        'Peeking is repeatedly checking a running experiment and stopping the moment it crosses significance. It badly inflates false positives: random noise will wander across the p < 0.05 line at some point if you keep looking, so "stop when it’s significant" all but guarantees you’ll eventually declare a winner that isn’t one.',
      ],
      bullets: [
        'Decide the sample size and end date before launch, and read the result then.',
        'Don’t stop early just because the line looks good (or kill it because it looks bad) on a wobble.',
        'If you genuinely need to monitor as you go, use methods built for it (sequential testing / always-valid p-values), not naive repeated peeking.',
      ],
    },
    {
      heading: 'Cohorts and funnels: where and for whom',
      body: [
        'A single average answers "did it move?" but not "where, and for whom?" Funnel analysis breaks a flow into steps and shows which step the change actually helped or hurt: a lift at signup that’s lost at activation nets to nothing. Cohort analysis groups users by a shared trait or start week and tracks each group over time, separating new-user behaviour from a tired average dominated by old users. Together they turn one blended number into a diagnosis you can act on.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Reading a ${ctx.product} experiment without fooling yourself`,
      lines: [
        (ctx) =>
          `Day 3, the variant is "significant" and the team wants to ship. But the test was sized for two weeks, so calling it now is peeking, and noise crosses the line early.`,
        'Wait for the planned end. At two weeks the lift holds at +3% on the primary metric, p < 0.05, with a tight confidence interval. Now it’s credible.',
        (ctx) =>
          `Funnel view: the gain is entirely at activation, where new ${ctx.user}s were dropping, so that’s a real, located improvement, not a vague bump.`,
        (ctx) =>
          `Cohort view: the lift shows up in this month’s new ${ctx.user}s, exactly the group the change targeted: consistent, not a fluke of one segment.`,
      ],
      takeaway:
        'Wait for the pre-set sample, check effect size and a confidence interval, then use funnels and cohorts to confirm the win is real and located where you expected.',
    },
  ],
  takeaways: [
    'Statistical significance asks how likely the observed gap is if the change did nothing; p < 0.05 is a common bar. But significant ≠ large, and not-significant ≠ no effect.',
    'The peeking trap (stopping the instant a running test hits significance) inflates false positives; fix the sample size and end date in advance.',
    'Funnel analysis shows which step moved; cohort analysis shows which group of users moved, and together they explain where and for whom, not just whether.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A teammate checks the live A/B dashboard every few hours and proposes shipping the moment it first crosses p < 0.05. Why is this "peeking" a problem?',
        options: [
          { id: 'a', label: 'It isn’t. Crossing significance at any point is sufficient proof.' },
          {
            id: 'b',
            label:
              'Repeatedly checking and stopping at the first significant moment inflates false positives, because random noise will eventually wander across the threshold.',
          },
          { id: 'c', label: 'It’s only a problem if the sample is very large.' },
        ],
        correctId: 'b',
        why: 'Each peek is another chance for noise to cross the line. "Stop when significant" therefore over-detects winners that aren’t real. The fix is to set the sample size and end date before launch and read the result then.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A result is reported as "not statistically significant." What is the most accurate interpretation?',
        options: [
          { id: 'a', label: 'The change definitely has no effect.' },
          {
            id: 'b',
            label:
              'The data didn’t provide strong enough evidence of an effect, which can also happen when the test was simply too small to detect one.',
          },
          { id: 'c', label: 'The experiment was run incorrectly and is invalid.' },
        ],
        correctId: 'b',
        why: 'Not significant means "insufficient evidence," not "proven zero." An underpowered test (too few users) can miss a real effect. That’s why you report effect size and confidence intervals, not just the significance verdict.',
      },
      {
        kind: 'choice',
        id: 'q3',
        prompt:
          'You want to know whether a change helped this month’s new users specifically, tracked over their first weeks, rather than a blended average dominated by long-time users. Which analysis is built for that?',
        options: [
          { id: 'a', label: 'Cohort analysis: group users by start period and track each group over time.' },
          { id: 'b', label: 'Checking the single overall average metric.' },
          { id: 'c', label: 'Increasing the ad budget to gather more data.' },
        ],
        correctId: 'a',
        why: 'Cohort analysis groups users by a shared start (e.g. signup month) and follows each group over time, isolating new-user behaviour from an average that older users would otherwise dominate.',
      },
    ],
  },
};
