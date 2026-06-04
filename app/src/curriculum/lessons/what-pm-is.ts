import type { ConceptLessonContent } from './types';

/**
 * Foundations · The Role — "What PM Is".
 * Outcomes vs output; what a PM does and (just as important) doesn't do.
 */
export const whatPmIs: ConceptLessonContent = {
  skillId: 'what-pm-is',
  hook: 'A product manager is accountable for outcomes — not for being the boss of the team.',
  framework: 'Marty Cagan · INSPIRED',
  sections: [
    {
      heading: 'The job is outcomes, not output',
      body: [
        'Output is what ships: features, screens, releases. Outcomes are what changes for the business and the customer because of what shipped — a problem solved, a behaviour moved, a number that goes the right way. A product manager is measured on outcomes. Shipping a feature nobody adopts is motion, not progress.',
        'This is the single most useful idea in the role. It reframes every decision from "what should we build?" to "what result are we trying to create, and is this the cheapest way to get it?" Often the best move is to build less, or nothing, and the discipline to notice that is what separates a PM from a backlog administrator.',
      ],
    },
    {
      heading: 'What a PM actually does',
      body: [
        'The PM owns the "what" and the "why": which problem the team solves next, for whom, and how you will know it worked. They bring three things together — what is valuable (business + customer), what is feasible (engineering), and what is usable (design) — and make the call when those pull apart.',
      ],
      bullets: [
        'Decide what to build next and why it matters now',
        'Define success up front as a measurable outcome',
        'Bring deep knowledge of the customer, the data, the business, and the market',
        'Make the trade-off calls and own the results, good or bad',
      ],
    },
    {
      heading: 'What a PM is not',
      body: [
        'The PM is not the team’s manager — engineers and designers are peers, not reports. They are not the "idea person" who hands down solutions; that wastes the team’s judgement. And they are not a project manager whose job is a Gantt chart and status updates. A PM who only writes tickets and chases dates has quietly become a feature factory.',
      ],
      bullets: [
        'Not the boss of engineering or design — a peer in the trio',
        'Not the sole source of ideas — the team discovers together',
        'Not a project manager — outcomes over schedules and status',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Output vs outcome on a ${ctx.product}`,
      lines: [
        (ctx) =>
          `A stakeholder asks the team to "add a dashboard" to the ${ctx.product}. That request is an output — a thing to build.`,
        (ctx) =>
          `A PM asks what outcome the dashboard is for. The real goal: help a ${ctx.user} notice a problem sooner so they stop churning.`,
        'Reframed that way, a weekly email digest might move the number faster than a dashboard nobody opens — at a fraction of the cost.',
      ],
      takeaway:
        'Translate every feature request back into the outcome it is meant to create, then find the cheapest path to that outcome.',
    },
  ],
  takeaways: [
    'A PM is accountable for outcomes (results), not output (features shipped).',
    'The PM owns the what and the why; engineering and design are peers, not reports.',
    'If the role becomes writing tickets and chasing dates, it has degraded into a feature factory.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A team ships exactly the feature that was requested, on time — but adoption and the target metric don’t move. By the outcomes-over-output standard, how should this be read?',
        options: [
          { id: 'a', label: 'A success — the feature shipped as specified, on schedule.' },
          {
            id: 'b',
            label:
              'Not yet a success — output happened, but the intended outcome did not.',
          },
          { id: 'c', label: 'A success — the PM met the stakeholder’s request.' },
        ],
        correctId: 'b',
        why: 'Shipping on spec is output. Until the customer or business result actually moves, the outcome the team was accountable for has not been achieved.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt: 'Which best describes a product manager’s relationship to the engineers and designers on the team?',
        options: [
          { id: 'a', label: 'Their manager, who assigns and directs the work.' },
          { id: 'b', label: 'Their project coordinator, who tracks status and dates.' },
          {
            id: 'c',
            label:
              'A peer in the product trio, responsible for the what and why while they own how it’s built and designed.',
          },
        ],
        correctId: 'c',
        why: 'In an empowered team the PM, engineering lead, and design lead are peers. The PM owns the problem and the outcome; the craft of building and designing belongs to engineering and design.',
      },
    ],
  },
};
