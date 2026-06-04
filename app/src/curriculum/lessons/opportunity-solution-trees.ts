import type { ConceptLessonContent } from './types';

/**
 * Product Manager · Continuous Discovery: "Opportunity-Solution Trees" (Torres).
 * A visual map from a single outcome down through opportunities to solutions and
 * experiments, so discovery stays tied to a goal and explores more than one path.
 */
export const opportunitySolutionTrees: ConceptLessonContent = {
  skillId: 'opportunity-solution-trees',
  hook: 'A good idea is worthless until you can say which customer need it serves and which outcome it moves: a tree makes that chain visible.',
  framework: 'Teresa Torres · Continuous Discovery Habits',
  sections: [
    {
      heading: 'Why a tree, not a list',
      body: [
        'Most teams jump straight from "the boss wants X" to building X. An opportunity-solution tree forces the missing thinking in between. It is a simple visual: a single desired outcome at the top, the customer opportunities (needs, pains, desires) that branch off it, the candidate solutions under each opportunity, and the experiments under each solution. Reading top to bottom, every solution can be traced to a need, and every need to the outcome.',
        'The structure does two jobs at once. It keeps discovery anchored to a goal (no orphan features), and it makes you generate more than one option before committing: you compare opportunities against each other, then solutions against each other, instead of falling in love with the first idea.',
      ],
    },
    {
      heading: 'The four layers',
      body: [
        'Torres’s tree has a fixed shape. Build it top-down, but spend most of your time in the opportunity space: that is where the leverage is.',
      ],
      bullets: [
        'Outcome: one measurable result you are trying to move (a behaviour, not a feature count).',
        'Opportunities: customer needs, pains, and desires, phrased in their words, surfaced from interviews.',
        'Solutions: multiple ways you might address a chosen opportunity (here is where features live).',
        'Experiments / assumption tests: the cheap tests that tell you whether a solution will actually work.',
      ],
    },
    {
      heading: 'Continuous discovery, not a one-off',
      body: [
        'Torres’s wider argument is that discovery is a weekly habit, not a phase before a project. A product trio (PM, designer, engineer) talks to customers every week, adds what they hear to the opportunity space, and lets the tree evolve. Crucially, you do not try to solve every opportunity: you assess and compare them, pick the one most likely to move the outcome, and go deep there. A tree with fifty opportunities and no decision is a wall of sticky notes, not discovery.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `A tree for a ${ctx.product} retention goal`,
      lines: [
        (ctx) =>
          `Outcome at the top: increase the share of new ${ctx.user}s still active in week four. That is a behaviour to move, not a feature to ship.`,
        (ctx) =>
          `From interviews, opportunities branch out: "I forget the ${ctx.product} exists," "I never hit the moment it got useful," "I couldn’t tell if it was working."`,
        'Pick the highest-leverage opportunity (say, "I never hit the useful moment") and branch several solutions: a guided first task, a templates gallery, a concierge setup.',
        'Under one solution, list experiments: a fake-door for templates, a five-user prototype test, a small A/B. Cheap tests before the build commitment.',
      ],
      takeaway:
        'The tree turns "what should we build?" into "which need, addressed how, will move this outcome, and what’s the cheapest way to find out?"',
    },
  ],
  takeaways: [
    'An opportunity-solution tree links one outcome → customer opportunities → solutions → experiments, so no feature is an orphan.',
    'Spend most effort in the opportunity space and compare options at each layer rather than committing to the first idea.',
    'Discovery is a continuous weekly habit for the product trio, not a phase that ends before building starts.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'In an opportunity-solution tree, what sits at the very top, the root the whole tree hangs from?',
        options: [
          { id: 'a', label: 'The list of features the team plans to build this quarter.' },
          { id: 'b', label: 'A single desired outcome: a customer or business behaviour to move.' },
          { id: 'c', label: 'The most-requested customer feature.' },
        ],
        correctId: 'b',
        why: 'The root is one measurable outcome. Opportunities branch from it, solutions branch from opportunities, and experiments branch from solutions, so everything below traces back to the goal.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Torres argues you should spend most of your discovery effort in which layer of the tree?',
        options: [
          { id: 'a', label: 'The solution space: generating as many feature ideas as possible.' },
          {
            id: 'b',
            label:
              'The opportunity space: understanding and comparing customer needs before choosing what to solve.',
          },
          { id: 'c', label: 'The experiment layer: running tests on every idea at once.' },
        ],
        correctId: 'b',
        why: 'The leverage is in the opportunity space. Mapping and comparing real customer needs is what stops a team from polishing a solution to a problem that barely matters.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Torres frames discovery as a weekly habit rather than a one-time phase. What single word describes this ongoing style of discovery (as in her "___ discovery habits")?',
        accept: ['continuous'],
        why: 'Continuous discovery means the product trio talks to customers and updates the opportunity space every week, so the tree keeps evolving instead of being built once and frozen.',
        placeholder: 'one word',
      },
    ],
  },
};
