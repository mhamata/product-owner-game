import type { ConceptLessonContent } from './types';

/**
 * Foundations · The Role — "The Four Big Risks" (Cagan).
 * Value, usability, feasibility, viability — and tackling them before build.
 */
export const fourBigRisks: ConceptLessonContent = {
  skillId: 'four-big-risks',
  hook: 'Most product failures trace to one of four risks left unaddressed before the team started building.',
  framework: 'Marty Cagan · INSPIRED / EMPOWERED',
  sections: [
    {
      heading: 'The four risks',
      body: [
        'Before committing a team to build something, Cagan argues you should confront four distinct risks. They are separate questions — a product can pass three and die on the fourth — so it helps to name and test each one deliberately rather than assuming "it’s a good idea".',
      ],
      bullets: [
        'Value risk — will customers actually want it, and choose it over the alternatives? (the most common killer)',
        'Usability risk — can users figure out how to use it?',
        'Feasibility risk — can our engineers build it, with the tech, skills, time, and data we have?',
        'Viability risk — does it work for our business: sales, marketing, finance, legal, support, partners?',
      ],
    },
    {
      heading: 'Value risk is the one that bites',
      body: [
        'Teams are usually good at building things; they are far worse at building things people want. Value risk is whether the customer has a problem painful enough that your solution wins their attention, money, or switch from what they do today. Most well-engineered, beautifully designed products fail here — they answered "can we?" without first answering "should we?".',
      ],
    },
    {
      heading: 'Address risks before build, not after',
      body: [
        'The expensive mistake is to discover these risks in production, after months of engineering. Discovery work — interviews, prototypes, data, feasibility spikes, a quick chat with legal or finance — exists to surface and reduce these risks cheaply, before the costly commitment to build. The goal isn’t certainty; it’s to stop pouring engineering time into a bet that a day of prototyping would have shown was wrong.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Pressure-testing a new ${ctx.product} feature`,
      lines: [
        (ctx) =>
          `The team wants to add AI-generated summaries to the ${ctx.product}. Walk the four risks before writing code.`,
        (ctx) =>
          `Value: would a ${ctx.user} actually use summaries, or do they trust their own reading? Test with a fake-door or a clickable prototype.`,
        'Usability: can users tell what the summary covers and when it’s stale? Prototype and watch five people use it.',
        'Feasibility: is the model accurate and fast enough on our data, at acceptable cost? Run a quick engineering spike.',
        'Viability: does the per-summary cost survive our pricing, and is legal comfortable with the data going to a model?',
      ],
      takeaway:
        'A day spent testing value and feasibility can save a quarter spent building something that fails on viability.',
    },
  ],
  takeaways: [
    'The four big risks (Cagan) are value, usability, feasibility, and viability — distinct questions, each able to sink a product.',
    'Value risk — will they want it and choose it? — is the most common cause of failure.',
    'Discovery exists to confront these risks cheaply before the costly commitment to build, not after.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Finance flags that the per-transaction cost of a proposed feature would erase the margin on the plan it ships in. Which of the four big risks is this?',
        options: [
          { id: 'a', label: 'Usability risk' },
          { id: 'b', label: 'Feasibility risk' },
          { id: 'c', label: 'Viability risk' },
          { id: 'd', label: 'Value risk' },
        ],
        correctId: 'c',
        why: 'Viability is whether the solution works for the business — including finance, pricing, legal, sales, and support. A feature that customers love and engineers can build can still be non-viable if it destroys margin.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt: 'Which big risk does Cagan identify as the most common reason products fail?',
        options: [
          { id: 'a', label: 'Feasibility — teams routinely can’t build what they design.' },
          { id: 'b', label: 'Value — customers don’t want it, or won’t choose it over the alternative.' },
          { id: 'c', label: 'Usability — users can’t figure out the interface.' },
        ],
        correctId: 'b',
        why: 'Teams are generally capable of building and designing. The far more common failure is value risk: shipping something customers simply don’t want enough to adopt or pay for.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Discovery work is meant to surface and reduce the four risks at which point relative to building — before, or after?',
        accept: ['before', 'before build', 'before building', 'beforehand'],
        why: 'The entire point of discovery is to confront the risks cheaply before the expensive commitment to engineer the solution.',
        placeholder: 'before / after',
      },
    ],
  },
};
