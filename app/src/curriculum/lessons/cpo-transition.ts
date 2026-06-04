import type { ConceptLessonContent } from './types';

/**
 * Director / VP · Culture & The Top Job: "The CPO Transition".
 * The shift from doing product to building the org that does product; operating
 * at the exec/board altitude (capital, narrative, cross-functional peers).
 */
export const cpoTransition: ConceptLessonContent = {
  skillId: 'cpo-transition',
  hook: 'The top product job is not the best product manager scaled up. It is a different job: building the org and the strategy that build the product.',
  framework: 'Marty Cagan · EMPOWERED · the leadership transition',
  sections: [
    {
      heading: 'From doing the work to designing the system',
      body: [
        'Each rung of the product ladder changes what you are actually paid to do. A PM does product work directly. A senior leader does it through a few teams. The CPO (or VP of Product) barely touches a feature; their product is the product organization itself: its strategy, its structure, its leaders, and its operating model. The work shifts from making product decisions to building the system that makes good product decisions reliably, across teams you will never sit in.',
        'The classic failure of the transition is not letting go. A leader who keeps making the calls their teams should make becomes the bottleneck, disempowers everyone below them, and starves the strategic work only they can do. Your leverage is no longer your own judgement on a feature; it is the quality of the leaders you hire and coach, and the clarity of the strategy and principles you set.',
      ],
    },
    {
      heading: 'What the top job is actually accountable for',
      body: [
        'At the top, the deliverables change shape. You are judged less on any single product and more on whether the whole product function compounds.',
      ],
      bullets: [
        'Product strategy: the few hard choices about where the company will and won’t play, made explicit enough to focus every team.',
        'The leadership team: hiring, coaching, and trusting strong directors and managers; the org’s ceiling is their quality.',
        'The operating model and culture: the durable way of working and the behaviour the org rewards.',
        'Executive and board influence: securing belief, capital, and air cover for the product strategy at the top table.',
      ],
    },
    {
      heading: 'Operating at the exec and board altitude',
      body: [
        'A CPO is a peer to the heads of sales, marketing, finance, and engineering, and answers to the CEO and board, an audience that does not care about your roadmap and does care about the business. That demands a different language: framing product strategy in terms of the company’s objectives, growth, and economics, not feature plans. It means earning trust so product is given problems and outcomes rather than handed a feature list by sales or the board: the same empowerment you give your teams, won one level up. And it means defending the time and focus your teams need to do discovery against an organization that will always want more output, faster.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `A new CPO over the ${ctx.product} org`,
      lines: [
        (ctx) =>
          `Newly promoted, the CPO’s instinct is to keep reviewing every ${ctx.product} spec and making the close calls themselves, the work that got them promoted.`,
        'Within a month they are the bottleneck: decisions queue on their calendar, their directors are disempowered, and the company strategy they alone can write goes unwritten.',
        (ctx) =>
          `They reset the job: invest in coaching their directors to make those calls, set a sharp product strategy and a few operating principles, and let teams own the ${ctx.user} outcomes.`,
        'At the same time they shift their own attention upward, translating product strategy into the board’s language of growth and economics, and winning the capital and air cover their teams need.',
      ],
      takeaway:
        'The CPO’s leverage moves from making product calls to building the leaders, strategy, and exec trust that let the org make them. Letting go is the job, not a risk to it.',
    },
  ],
  takeaways: [
    'The top product job is a different job, not a bigger PM role: your product becomes the product organization, with its strategy, structure, leaders, and operating model.',
    'The classic failure is not letting go; a leader who keeps making the teams’ calls becomes the bottleneck and starves the strategic work only they can do.',
    'A CPO operates at the exec/board altitude: framing product strategy in business terms and winning the belief, capital, and air cover the teams need.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A newly-appointed CPO keeps personally reviewing every spec and making the key product decisions their directors and teams should own. What is the most likely result?',
        options: [
          { id: 'a', label: 'Stronger products, because the most experienced person makes every call.' },
          {
            id: 'b',
            label:
              'They become the bottleneck and disempower their leaders, while the strategy and org-building only they can do goes undone.',
          },
          { id: 'c', label: 'No real change; the top job is just the PM job at larger scale.' },
        ],
        correctId: 'b',
        why: 'The top job is building the system that makes good product decisions, not making them all yourself. A leader who won’t let go becomes a bottleneck, disempowers their teams, and neglects the strategic and organizational work that is uniquely theirs.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'How should a CPO frame product strategy when presenting to the CEO and board?',
        options: [
          {
            id: 'a',
            label:
              'As a detailed feature roadmap with delivery dates, since that is what product produces.',
          },
          {
            id: 'b',
            label:
              'In terms of the company’s objectives, growth, and economics, earning the belief and capital to let teams own outcomes rather than be handed a feature list.',
          },
          { id: 'c', label: 'It shouldn’t; the board only needs to see engineering’s output metrics.' },
        ],
        correctId: 'b',
        why: 'The board and CEO care about the business, not the roadmap. A CPO translates product strategy into objectives, growth, and economics to win trust and resources, securing the same empowerment for the product org that the org gives its own teams.',
      },
    ],
  },
};
