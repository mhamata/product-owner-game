import type { ConceptLessonContent } from './types';

/**
 * Growth track: "Growth Loops".
 * The growth model as a system of feedback loops, the AARRR sub-loops that feed
 * it, and the weakest-stage principle that decides where leverage actually is.
 */
export const trackGrowthLoops: ConceptLessonContent = {
  skillId: 'track-growth-loops',
  hook: 'A funnel describes how users leak out the bottom. A growth model describes the loops that feed users back into the top, and the one stage holding the whole thing back.',
  framework: 'Reforge (Brian Balfour) Growth Model and Loops, building on AARRR (Dave McClure)',
  sections: [
    {
      heading: 'A growth model, not a growth hack',
      body: [
        'Growth is not a bag of tricks. It is a model: a written-down account of exactly how your product acquires, keeps, and makes money from users, and how each of those feeds the next. The discipline is to draw the whole system on one page so you can argue about it. A real growth model names your loops, the inputs each one needs, and the rate at which each turns. Once it exists, "what should we work on?" stops being a popularity contest and becomes a question about which part of the model is throttling the rest.',
        'The shift from funnel-thinking to model-thinking is the core of the track. A funnel is one-directional and linear: pour in at the top, measure what survives. A growth model is a set of loops where the output of one turn becomes fuel for the next, so growth can compound instead of requiring ever more spend at the mouth of the funnel.',
      ],
    },
    {
      heading: 'The five sub-loops (AARRR), read as a system',
      body: [
        'Dave McClure\'s AARRR (the "pirate metrics") names five stages: Acquisition, Activation, Retention, Revenue, Referral. Most teams treat these as a funnel and optimize each in isolation. The growth lens reads them as interlocking loops. Retention is what gives you something to monetize and someone to refer; Referral feeds Acquisition; Revenue can fund paid Acquisition. The stages are not five independent dials, they are one connected machine.',
      ],
      bullets: [
        'Acquisition: how a new user first arrives (organic, paid, viral, content).',
        'Activation: the first experience where they actually reach value.',
        'Retention: whether they keep coming back; the multiplier on everything.',
        'Revenue: how delivered value turns into money.',
        'Referral: how existing users bring in the next ones, feeding Acquisition.',
      ],
    },
    {
      heading: 'The weakest-stage principle',
      body: [
        'Because the stages multiply, your growth rate is governed by the weakest one, not the average. Pushing harder on a stage that is already healthy is wasted effort: a 2x improvement in Acquisition does nothing if Activation is the leak, because the extra arrivals fall straight through. This is the growth version of the theory of constraints. The job is to find the single binding constraint, fix it until something else becomes the constraint, then move. Resist the pull to optimize the stage you are best at or the one that is easiest to move; chase the one that is actually capping the system.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Reading the growth model of a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Acquisition looks great: lots of new ${ctx.user}s arriving from content and ads each week.`,
        'But Activation is weak: most never reach the first moment of value, so they churn in days. That is the binding constraint.',
        (ctx) =>
          `Spending more on Acquisition just pours more ${ctx.user}s through the same leak. The leverage is fixing Activation first.`,
        'Once Activation is healthy, retained users start producing referrals, which feeds Acquisition back as a loop instead of a line.',
      ],
      takeaway:
        'Map the whole model, find the single weakest stage, and fix that before pouring effort into a stage that is already working.',
    },
  ],
  takeaways: [
    'Growth is a written-down model of loops, not a list of hacks: name your loops and the rate each one turns so prioritization becomes a question about the system.',
    'AARRR (Acquisition, Activation, Retention, Revenue, Referral) is one connected machine, not five independent dials: retention powers revenue and referral, referral feeds acquisition.',
    'The weakest stage governs the whole rate (theory of constraints): fix the binding constraint first, not the stage that is easiest or most fun to move.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A team doubles its acquisition spend, but overall growth barely moves because most new users never reach the product\'s core value and churn within days. What does the weakest-stage principle say to do?',
        options: [
          { id: 'a', label: 'Keep increasing acquisition spend; more arrivals will eventually compound.' },
          {
            id: 'b',
            label:
              'Fix activation first, since it is the binding constraint: improving the stage that is already healthy (acquisition) just pushes more users through the same leak.',
          },
          { id: 'c', label: 'Switch to a different acquisition channel and try again.' },
        ],
        correctId: 'b',
        why: 'Because the stages multiply, the growth rate is governed by the weakest stage. Activation is the leak here, so extra acquisition falls straight through. The leverage is the binding constraint, not the stage that is easiest to push on.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'What distinguishes a growth model from a growth funnel?',
        options: [
          { id: 'a', label: 'A growth model has more stages than a funnel.' },
          {
            id: 'b',
            label:
              'A funnel is a one-directional path users leak out of; a growth model is a set of loops where the output of one turn becomes the input that drives the next, so growth can compound.',
          },
          { id: 'c', label: 'A growth model is only for paid acquisition; funnels are for organic.' },
        ],
        correctId: 'b',
        why: 'A funnel is linear and describes a moment. A growth model is a system of feedback loops (retained users produce referrals that feed acquisition, revenue funds more acquisition) that reinvest output as input, which is what lets growth compound.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'The AARRR "pirate metrics" name five stages: Acquisition, Activation, ___, Revenue, and Referral. Name the third stage, the one that acts as the multiplier on the whole system.',
        accept: ['retention'],
        why: 'The five AARRR stages are Acquisition, Activation, Retention, Revenue, Referral. Retention is the multiplier: only retained users keep producing the revenue and referrals that feed the rest of the model.',
        placeholder: 'one word',
      },
    ],
  },
};
