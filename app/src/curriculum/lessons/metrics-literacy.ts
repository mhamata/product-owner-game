import type { ConceptLessonContent } from './types';

/**
 * Foundations · Literacy — "Metrics Literacy".
 * The quantitative literacy a PM needs: causation traps, distributions,
 * activity metrics, retention, and the AARRR / HEART frameworks.
 */
export const metricsLiteracy: ConceptLessonContent = {
  skillId: 'metrics-literacy',
  hook: 'Numbers don’t lie, but they’re easy to read wrong — and a PM who misreads them ships the wrong thing with confidence.',
  framework: 'AARRR (Dave McClure) · HEART (Google)',
  sections: [
    {
      heading: 'Correlation is not causation',
      body: [
        'Two things moving together does not mean one caused the other. Users who adopt a feature may retain better not because the feature helps, but because already-engaged users were the ones who tried it. Confusing the two leads to forcing features on everyone that only correlated with success. When you can, an experiment (an A/B test) is how you move from "these move together" to "this caused that".',
      ],
    },
    {
      heading: 'Mean vs median — mind the distribution',
      body: [
        'The average (mean) can lie when data is skewed. If most sessions last 2 minutes but a few power users run 3-hour sessions, the mean session might read "20 minutes" — describing nobody. The median (the middle value) often describes the typical user far better. Reach for the median, and for percentiles (p50, p90), whenever a few extreme values can drag the average around.',
      ],
    },
    {
      heading: 'Activity and retention metrics',
      body: [
        'DAU, WAU, and MAU are daily, weekly, and monthly active users — counts of distinct people who did something meaningful in that window. The DAU/MAU ratio is a rough "stickiness" gauge: how many monthly users show up on a given day. But activity counts can hide the thing that matters most — retention: do people come back over time? A leaky bucket can post growing signups and still be dying. Retention is usually the truest signal of product-market fit.',
      ],
      bullets: [
        'DAU / WAU / MAU — distinct active users per day / week / month.',
        'Stickiness — DAU ÷ MAU; higher means people return more often.',
        'Retention — the share of a cohort still active N days/weeks later.',
      ],
    },
    {
      heading: 'Two frameworks to organize the funnel',
      body: [
        'AARRR ("Pirate Metrics," Dave McClure) tracks the lifecycle: Acquisition, Activation, Retention, Referral, Revenue. It’s a clean way to ask "where in the funnel are we actually losing people?" HEART (Google) is built for measuring user experience quality: Happiness, Engagement, Adoption, Retention, Task success — paired with Goals, Signals, and Metrics to turn a fuzzy goal into a concrete number. Use AARRR to find the leak; use HEART to judge whether the experience itself is good.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Reading a ${ctx.product} metric the right way`,
      lines: [
        (ctx) =>
          `A chart shows ${ctx.user}s who use the new feature retain 30% better. Tempting conclusion: roll it out to everyone.`,
        'Causation check: maybe the most engaged users self-selected into the feature, so it correlates with retention without causing it.',
        'Better: run an A/B test — show the feature to a random half — and compare. Only then can you claim it caused the lift.',
        'Meanwhile, signups are up but the 4-week retention curve is flattening near zero: a leaky bucket. Growth is masking a fit problem.',
      ],
      takeaway:
        'Before acting on a number, ask: could something else explain it, and is this the metric that actually reflects health?',
    },
  ],
  takeaways: [
    'Correlation ≠ causation — to claim cause, run an experiment rather than trusting two lines that move together.',
    'Use the median (and percentiles) when a few extreme values can distort the mean; watch retention, not just signups or activity counts.',
    'AARRR (Acquisition → Activation → Retention → Referral → Revenue) finds where you lose users; HEART measures experience quality.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Users who adopt a new feature retain better than those who don’t. What’s the most rigorous next step before crediting the feature?',
        options: [
          { id: 'a', label: 'Roll the feature out to everyone — the data clearly shows it works.' },
          {
            id: 'b',
            label:
              'Run an A/B test, since the correlation could be explained by already-engaged users self-selecting into the feature.',
          },
          { id: 'c', label: 'Remove the feature — correlation proves nothing.' },
        ],
        correctId: 'b',
        why: 'Adopters retaining better is a correlation; engaged users may simply be the ones who try new features. A randomized A/B test is how you establish whether the feature actually causes the lift.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Most sessions are short, but a handful of power users run very long ones, pulling the average session time up to a figure no typical user matches. Which statistic better describes the typical user?',
        options: [
          { id: 'a', label: 'The mean (average), because it uses every data point.' },
          { id: 'b', label: 'The median (middle value), because it resists a few extreme outliers.' },
          { id: 'c', label: 'The maximum, because it shows what’s possible.' },
        ],
        correctId: 'b',
        why: 'With a skewed distribution, a few large outliers drag the mean away from the typical case. The median (and percentiles like p50) describes the everyday user far more honestly.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'In the AARRR "pirate metrics" framework, what does the first "A" stand for — the stage where you first get users?',
        accept: ['acquisition', 'acquire'],
        why: 'AARRR is Acquisition, Activation, Retention, Referral, Revenue. Acquisition is the top of the funnel — getting users to show up in the first place.',
        placeholder: 'one word',
      },
    ],
  },
};
