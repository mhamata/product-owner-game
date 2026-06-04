import type { ConceptLessonContent } from './types';

/**
 * Product Manager · Metrics & North Star. "AARRR Funnel" (McClure).
 * The five-stage lifecycle funnel and how to use it to find the biggest leak.
 */
export const aarrrFunnel: ConceptLessonContent = {
  skillId: 'aarrr-funnel',
  hook: 'You can’t fix a funnel you can’t see. AARRR names the five stages so you can find the one that’s actually bleeding.',
  framework: 'Dave McClure · AARRR "Pirate Metrics"',
  sections: [
    {
      heading: 'The five stages',
      body: [
        'AARRR (say it like a pirate) breaks the customer lifecycle into five sequential stages. Each is a gate the user passes through, and at each gate some fraction drops off. Naming the stages lets you measure them separately instead of staring at one blended "growth" number that hides where the problem is.',
      ],
      bullets: [
        'Acquisition: users find you and arrive (a visit, an install, a signup start).',
        'Activation: they reach their first genuine "this is useful" moment.',
        'Retention: they come back, repeatedly, over time.',
        'Referral: they tell others, pulling in new users.',
        'Revenue: they (or someone) pay, and the unit economics work.',
      ],
    },
    {
      heading: 'Find the leak before you pour in more water',
      body: [
        'The funnel’s real value is diagnostic. Compute the conversion rate at each step (what share of acquired users activate, what share of activated users retain) and the biggest drop-off is usually where to spend next. Pouring acquisition spend into a funnel that leaks badly at activation just buys more users who never stick. Fix the leak first; then growth at the top compounds instead of draining away.',
      ],
    },
    {
      heading: 'Order matters, and so does sequence of work',
      body: [
        'Although the letters run A-A-R-R-R, McClure’s practical advice is not to optimize them in that order. Retention usually comes first in priority: if users don’t come back, acquisition and referral are wasted, and revenue is fragile. A common sequence is to earn activation and retention (do people get value and return?), then turn on referral and revenue, and only then scale acquisition hard. Growth on a leaky bucket is a vanity exercise.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Diagnosing a ${ctx.product} funnel`,
      lines: [
        (ctx) =>
          `100 ${ctx.user}s start signup (acquisition). 60 finish onboarding and hit the first useful action (activation), a 40% leak right at the top.`,
        'Of those 60, only 18 come back in week two (retention). Two stages, two big drops. Which do you fix first?',
        (ctx) =>
          `Spending more to acquire 1,000 ${ctx.user}s would just feed the same leaks. The cheapest win is the worst-converting step, here activation.`,
        'Tighten activation (a guided first task), watch the rate climb, then move to retention, and only then scale acquisition.',
      ],
      takeaway:
        'AARRR turns "growth is flat" into "we lose 40% at activation," a specific, fixable number instead of a vague worry.',
    },
  ],
  takeaways: [
    'AARRR stages the lifecycle: Acquisition → Activation → Retention → Referral → Revenue.',
    'Measure conversion at each step and attack the biggest drop-off first. Don’t pour acquisition into a leaky funnel.',
    'In priority terms, retention usually comes before acquisition: growth on a bucket that doesn’t hold water is a vanity exercise.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'In AARRR, which stage measures whether a new user reaches their first genuine "this is useful" moment?',
        options: [
          { id: 'a', label: 'Acquisition' },
          { id: 'b', label: 'Activation' },
          { id: 'c', label: 'Referral' },
        ],
        correctId: 'b',
        why: 'Activation is the moment a user first experiences real value. Acquisition is just arriving; activation is the first step that predicts whether they’ll stick around.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Your funnel leaks badly at activation, but the team proposes doubling the ad budget to acquire more users. Why is that usually the wrong first move?',
        options: [
          { id: 'a', label: 'Ads are always too expensive to be worth it.' },
          {
            id: 'b',
            label:
              'More acquisition just feeds a leaky funnel. Most of those new users will drop at the same activation step, so the spend is largely wasted.',
          },
          { id: 'c', label: 'Acquisition is the last stage, so it should never be optimized.' },
        ],
        correctId: 'b',
        why: 'The biggest leak is the highest-leverage fix. Acquiring more users before plugging the activation hole simply pours more water into a bucket that doesn’t hold it.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'AARRR ends with the stage where users (or someone) actually pay and the unit economics work. What is that final "R" stage?',
        accept: ['revenue'],
        why: 'The five stages are Acquisition, Activation, Retention, Referral, Revenue. Revenue is the bottom of the funnel: turning engaged users into a working business model.',
        placeholder: 'one word',
      },
    ],
  },
};
