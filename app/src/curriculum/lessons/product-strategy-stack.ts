import type { ConceptLessonContent } from './types';

/**
 * Senior · Strategy & Vision: "Product Strategy Stack".
 * Vision → strategic intent → initiatives → options: the connective tissue
 * (Perri / Cagan) that turns a direction into the work a team picks up.
 */
export const productStrategyStack: ConceptLessonContent = {
  skillId: 'product-strategy-stack',
  hook: 'Strategy isn’t a document. It’s the chain that connects a far-off vision to the very next thing your team builds.',
  framework: 'Melissa Perri · Escaping the Build Trap / Marty Cagan · EMPOWERED',
  sections: [
    {
      heading: 'Four levels, one chain',
      body: [
        'Melissa Perri calls it the Product Strategy Stack: a set of nested layers that each constrain the one below. Vision is the long-term change you exist to create. Strategic intent names the few business outcomes you will chase next to move toward that vision. Initiatives (Perri calls them product initiatives; Cagan calls these objectives) are the problems a team takes on to deliver an intent. Options are the specific solutions a team might build to solve the problem, and most of them should be discarded.',
        'The point of the stack is alignment without micromanagement. Leadership owns the top (vision, intent); teams own the bottom (which options to pursue). When the layers connect, anyone can trace the feature in front of them up to the company outcome it serves, and a team can say no to good ideas that don’t ladder up.',
      ],
    },
    {
      heading: 'Strategy is what you DON’T do',
      body: [
        'A strategy that lists everything important is not a strategy. It’s a wish list. Strategic intent is a deliberate bet: of all the outcomes we could pursue this year, these one or two are how we win, so everything else waits. The hard part is the cut. If your "strategy" wouldn’t make anyone unhappy, it isn’t making a choice.',
      ],
    },
    {
      heading: 'The build trap',
      body: [
        'The build trap is measuring yourself by features shipped instead of value created: staying busy producing output while losing the thread to outcomes. The stack is the antidote: it forces every initiative to be a problem with a measurable result, not a pre-decided solution. When the layers are missing, teams default to building whatever is loudest, and a roadmap becomes a feature factory’s to-do list.',
      ],
      bullets: [
        'Vision: the long-term change you’re here to make (years).',
        'Strategic intent: the few business outcomes you’ll chase now to get there.',
        'Initiatives / objectives: the problems teams take on to deliver an intent.',
        'Options: candidate solutions for a problem; most get discarded.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Tracing the stack on a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Vision: every ${ctx.user} reaches their goal without needing support. Aspirational, durable, not a feature.`,
        'Strategic intent (this year): grow revenue by lifting retention of the customers we already have, not by chasing new acquisition.',
        (ctx) =>
          `Initiative for one team: "new ${ctx.user}s abandon in week one." A measurable problem (cut week-one churn), not a named solution.`,
        'Options the team weighs: a guided setup, a check-in email, a concierge onboarding. They prototype, pick one, and drop the rest.',
      ],
      takeaway:
        'When the chain holds, the feature a team ships is traceable straight up to the company outcome it’s meant to move.',
    },
  ],
  takeaways: [
    'The Product Strategy Stack (Perri) nests vision → strategic intent → initiatives/objectives → options, each layer constraining the next.',
    'Strategic intent is a choice: a few outcomes you’ll chase now, which means saying no to other good things.',
    'The stack is the escape from the build trap: every initiative is a problem with a measurable result, not a pre-decided feature.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A leadership team writes a strategy listing eleven priorities for the year, each marked "critical." What’s the core problem with this as strategy?',
        options: [
          { id: 'a', label: 'It’s too short. Strategy should cover every part of the business.' },
          {
            id: 'b',
            label:
              'It makes no real choice: a strategy that prioritizes everything has decided nothing, leaving teams to guess what matters.',
          },
          { id: 'c', label: 'Nothing. More priorities means more value delivered.' },
        ],
        correctId: 'b',
        why: 'Strategic intent is a deliberate bet on a few outcomes, which necessarily means deferring others. Eleven equal "critical" priorities is a wish list; it provides no basis for a team to say no.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'In the Product Strategy Stack, what sits between strategic intent (the business outcomes) and the specific solutions a team might build?',
        options: [
          { id: 'a', label: 'The vision.' },
          { id: 'b', label: 'Initiatives / objectives: the problems a team takes on to deliver an intent.' },
          { id: 'c', label: 'The quarterly roadmap dates.' },
        ],
        correctId: 'b',
        why: 'The layers nest vision → strategic intent → initiatives (objectives) → options. Initiatives translate a business outcome into a specific problem a team owns; options are the candidate solutions to that problem.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Perri’s name for measuring yourself by features shipped instead of value created is the "build ___." Fill in the blank.',
        accept: ['trap', 'build trap'],
        why: 'The build trap is the failure mode of optimizing for output (features) rather than outcomes (value). The strategy stack exists to keep teams out of it.',
        placeholder: 'one word',
      },
    ],
  },
};
