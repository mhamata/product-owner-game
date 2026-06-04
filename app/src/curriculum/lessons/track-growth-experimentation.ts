import type { ConceptLessonContent } from './types';

/**
 * Growth track: "Growth Experimentation".
 * Growth as a high-velocity testing system: input metrics over output metrics,
 * prioritizing tests by leverage, and reading wins honestly so they compound.
 */
export const trackGrowthExperimentation: ConceptLessonContent = {
  skillId: 'track-growth-experimentation',
  hook: 'A growth team\'s output is not features, it is validated learning per week. The teams that win run more honest experiments against the metric that actually moves the model.',
  framework: 'Lean Startup build-measure-learn (Eric Ries) and ICE prioritization (Sean Ellis)',
  sections: [
    {
      heading: 'Velocity of validated learning is the real output',
      body: [
        'Growth work is a search problem: you rarely know in advance which change will move a metric, so the constraint is how fast you can test ideas and keep the ones that work. That reframes the team\'s output. It is not the number of features shipped, it is the number of trustworthy experiments run and the rate at which you learn. A team that runs eight clean tests a month and kills the seven that fail will out-compound a team that ships two big un-measured bets. Build, measure, learn, then do it again, faster.',
      ],
    },
    {
      heading: 'Move input metrics, watch output metrics',
      body: [
        'Your north-star and revenue numbers are output metrics: lagging, slow, and influenced by a hundred things at once, so they are terrible to steer by week to week. Break the model into input metrics: the specific, controllable levers that feed the output (signups from a channel, percent reaching activation, sessions per retained user). You run experiments against inputs because you can actually move them and read the result quickly. The chain is: an experiment moves an input, enough input movement moves the output. Steering directly by the output metric is like driving by watching only the destination.',
      ],
      bullets: [
        'Output metric: the lagging result (revenue, north star). The goal, not the lever.',
        'Input metric: a controllable upstream lever that feeds the output.',
        'Experiments target inputs; the output confirms the inputs were the right ones.',
      ],
    },
    {
      heading: 'Prioritize by leverage, and keep the wins honest',
      body: [
        'You will always have more test ideas than capacity, so rank them. A simple lens is ICE: Impact (how much it could move the metric), Confidence (how sure you are it will), and Ease (how cheap it is to run). Score each, do the high-leverage ones first, and bias toward cheap tests that teach you a lot. The other half of the discipline is honesty: pre-register what you are testing and what would count as a win, watch out for chasing noise on tiny samples, and confirm a lift holds before you bank it. Growth that compounds is built on real wins; a "win" you fooled yourself into adds nothing and costs you the next test.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `One week of growth experiments on a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Output metric is monthly revenue, too slow to steer by. The input you choose: percent of new ${ctx.user}s who reach activation in week one.`,
        'Idea backlog scored by ICE: a simpler signup (high ease, medium impact) beats a full onboarding rebuild (high impact, low ease, low confidence) as the first test.',
        'You pre-register the win condition (activation 38% to 45%), ship the simpler signup to half of new users, and read the result on a real sample.',
        'It holds, so you bank it and move to the next constraint. The lift in the input metric is what later shows up in the slow output metric.',
      ],
      takeaway:
        'Pick a controllable input metric, rank tests by leverage with ICE, pre-commit the win condition, and only bank lifts that survive an honest read.',
    },
  ],
  takeaways: [
    'A growth team\'s real output is validated learning per week, not features shipped: maximize the number of trustworthy experiments and kill the losers fast.',
    'Experiment against input metrics (controllable, fast-reading levers) rather than steering directly by lagging output metrics like revenue.',
    'Rank tests by leverage (e.g. ICE: Impact, Confidence, Ease), pre-register the win condition, and only bank lifts that survive an honest read of a real sample.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Why do experienced growth teams run experiments against input metrics (like percent of users reaching activation) rather than directly against the output metric (like monthly revenue)?',
        options: [
          { id: 'a', label: 'Input metrics look more impressive in a deck than revenue.' },
          {
            id: 'b',
            label:
              'Input metrics are controllable and read quickly, so a test can actually move them and you can see the result; output metrics are lagging and influenced by many things at once, so they are slow and noisy to steer by.',
          },
          { id: 'c', label: 'Output metrics cannot be measured accurately, so they are ignored.' },
        ],
        correctId: 'b',
        why: 'Output metrics are the goal but they lag and respond to everything at once, which makes them poor week-to-week steering signals. Input metrics are the specific levers that feed the output: you can move them with a test and read the result fast, and enough input movement is what eventually shifts the output.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A growth team celebrates a "winning" experiment that showed a 9% lift, but it ran on 40 users for two days and was never re-checked. What is the core mistake?',
        options: [
          { id: 'a', label: 'They should have run the test on the whole product at once instead of a subset.' },
          {
            id: 'b',
            label:
              'They banked a result that may just be noise on a tiny sample without pre-registering a win condition or confirming the lift holds, so the "win" may add nothing and corrupts the model.',
          },
          { id: 'c', label: 'Nothing; any positive number is a win worth shipping immediately.' },
        ],
        correctId: 'b',
        why: 'Growth that compounds is built on honest wins. A lift on 40 users over two days is well within noise; without a pre-registered win condition and a confirmation that it holds, the team is likely chasing randomness, which wastes the next test and inflates the model with a gain that is not real.',
      },
    ],
  },
};
