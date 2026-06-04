import type { ConceptLessonContent } from './types';

/**
 * Foundations · Working in a Team — "Working with Eng & Design".
 * The product trio; empowered teams vs feature teams.
 */
export const workingWithEngDesign: ConceptLessonContent = {
  skillId: 'working-with-eng-design',
  hook: 'Great products come from a trio that shares the problem — not a PM who hands down solutions.',
  framework: 'Marty Cagan · EMPOWERED · the product trio',
  sections: [
    {
      heading: 'The product trio',
      body: [
        'The core of a product team is three roles working as peers: product, design, and engineering — often called the product trio. Product brings the business and customer lens, design brings the user-experience lens, and engineering brings the what-is-possible lens. None reports to the others. They sit together over the same problem and the same customer.',
        'The reason to involve engineering and design early — in discovery, not just delivery — is leverage: engineers know what’s newly possible (the best ideas often come from them), and designers find usability problems while they’re still cheap to fix. Bring them in after the spec is written and you’ve thrown away their best contribution.',
      ],
    },
    {
      heading: 'Empowered teams vs feature teams',
      body: [
        'Cagan draws a sharp line between two ways of running a team. A feature team is handed a prioritized list of features and asked to build them — measured on output, on shipping the list. An empowered team is handed a problem to solve and a clear outcome, and is trusted to discover the best solution — measured on whether the problem actually got solved.',
        'The difference isn’t talent; it’s whether the team owns the solution. Feature teams optimize for "did we ship the roadmap?" Empowered teams optimize for "did the metric move?" — which is the whole point of the role.',
      ],
      bullets: [
        'Feature team — given solutions to build; accountable for output; the PM writes specs.',
        'Empowered team — given problems to solve; accountable for outcomes; the trio discovers the solution.',
      ],
    },
    {
      heading: 'How the PM shows up',
      body: [
        'In a trio, the PM’s job is to bring the sharpest possible understanding of the customer, the data, the business, and the market — and to frame the problem and the desired outcome clearly. It is not to dictate the design or the architecture. You earn the right to lead by being the most prepared person in the room, not the most senior on an org chart.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Two ways to start the same ${ctx.product} project`,
      lines: [
        (ctx) =>
          `Feature-team way: the PM writes "build a guided setup wizard," hands the spec to the ${ctx.product} team, and tracks it to ship.`,
        (ctx) =>
          `Empowered way: the PM frames the outcome — "new ${ctx.user}s reach first value in under a day; today most never do" — and brings the trio the data behind it.`,
        'Engineering suggests pre-filling setup from existing data; design proposes a checklist over a wizard. The solution that ships is better than the one the PM would have specified alone.',
      ],
      takeaway:
        'Hand the team a problem and an outcome, not a solution — you get their judgement, and a better answer.',
    },
  ],
  takeaways: [
    'The product trio — product, design, engineering — are peers who share the problem; involve eng and design in discovery, not just delivery.',
    'Feature teams are given solutions and measured on output; empowered teams are given problems and measured on outcomes (Cagan).',
    'A PM earns the lead by being the most prepared on the customer, data, and business — not by dictating design or architecture.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A team is handed a prioritized list of features each quarter and judged on whether it ships the list. In Cagan’s terms, what kind of team is this?',
        options: [
          { id: 'a', label: 'An empowered team — it owns its outcomes.' },
          { id: 'b', label: 'A feature team — given solutions to build and measured on output.' },
          { id: 'c', label: 'A product trio — by definition empowered.' },
        ],
        correctId: 'b',
        why: 'Being handed solutions to build and judged on shipping them is the definition of a feature team. An empowered team is given a problem and an outcome and is trusted to find the solution.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt: 'Why does an empowered team bring engineering and design into discovery, not just delivery?',
        options: [
          {
            id: 'a',
            label:
              'To make them feel included, even though the PM has already chosen the solution.',
          },
          {
            id: 'b',
            label:
              'Because engineers surface what’s newly possible and designers catch usability problems while they’re still cheap to fix.',
          },
          { id: 'c', label: 'So the PM can delegate writing the spec to them.' },
        ],
        correctId: 'b',
        why: 'Early involvement is about leverage: engineering often sees the best, most feasible solutions, and design finds usability issues before they’re expensive. Bringing them in only at delivery wastes that.',
      },
    ],
  },
};
