import type { ConceptLessonContent } from './types';

/**
 * Foundations · The Role — "The Product Lifecycle".
 * The arc a product travels and how the PM's job changes at each stage.
 */
export const productLifecycle: ConceptLessonContent = {
  skillId: 'product-lifecycle',
  hook: 'A product is never "done" — it moves through stages, and the PM’s job changes at each one.',
  sections: [
    {
      heading: 'The four stages',
      body: [
        'Most products travel a recognizable arc. Knowing which stage you’re in tells you what to optimize for — chasing growth tactics during a fight for product-market fit, or polishing features on a declining product, is effort spent in the wrong place.',
      ],
      bullets: [
        'Introduction — find product-market fit: does anyone want this enough to keep using it?',
        'Growth — adoption accelerates; the work is scaling, onboarding, and reliability.',
        'Maturity — growth flattens; the work is retention, efficiency, and defending the moat.',
        'Decline — usage falls; the work is to revive, reposition, harvest, or sunset deliberately.',
      ],
    },
    {
      heading: 'The job changes with the stage',
      body: [
        'Early on, almost everything is discovery: you are searching for a problem worth solving and a solution people return to. Speed and learning beat polish. In growth, the bottleneck shifts to delivery and scale — the product works, now make it work for many more people without falling over.',
        'At maturity, marginal features add little; the leverage is in retention, monetization, and operational efficiency. In decline, the honest question is whether to invest in a turnaround or manage a graceful sunset. The same feature idea can be right in one stage and a distraction in another.',
      ],
    },
    {
      heading: 'Build–measure–learn underneath it all',
      body: [
        'Within any stage, healthy teams run a tight loop: build the smallest thing that tests a belief, measure how customers actually respond, and learn enough to decide the next move. The product never "finishes" — it compounds through cycles of evidence. The lifecycle tells you what to bet on; the loop tells you how to place the bet cheaply.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Reading the stage of a ${ctx.product}`,
      lines: [
        (ctx) =>
          `New ${ctx.product}, a handful of design partners, churn still high: this is Introduction. The right metric is whether a ${ctx.user} comes back unprompted — proof of fit — not signups.`,
        'A year later, week-over-week active users are climbing fast and servers strain under load. That’s Growth: invest in onboarding and reliability, not novel features.',
        'Two years on, growth has flattened and competitors match the feature set. That’s Maturity: defend with retention and efficiency; a turnaround bet only makes sense if the market is still real.',
      ],
      takeaway:
        'Diagnose the stage first; it tells you whether to optimize for fit, scale, retention, or an exit.',
    },
  ],
  takeaways: [
    'Products move through Introduction, Growth, Maturity, and Decline — and the PM’s priorities change at each.',
    'The same feature can be right in one stage and a distraction in another; diagnose the stage before you prioritize.',
    'Inside every stage, run build–measure–learn: test beliefs cheaply with evidence rather than treating the product as ever "finished".',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A product’s week-over-week active users are climbing fast, but the system keeps buckling under load. Which stage is this, and what should the PM prioritize?',
        options: [
          { id: 'a', label: 'Introduction — keep searching for product-market fit.' },
          {
            id: 'b',
            label: 'Growth — invest in scale, reliability, and onboarding so the surge sticks.',
          },
          { id: 'c', label: 'Decline — begin planning a graceful sunset.' },
        ],
        correctId: 'b',
        why: 'Accelerating adoption that strains capacity is the signature of the Growth stage. The leverage is in scaling the product and making the new users successful, not in chasing fit (already found) or sunsetting.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt: 'What is the core purpose of the build–measure–learn loop within any lifecycle stage?',
        options: [
          { id: 'a', label: 'To ship as many features as possible each sprint.' },
          {
            id: 'b',
            label:
              'To test a belief with the smallest possible build, observe real customer response, and decide the next move from evidence.',
          },
          { id: 'c', label: 'To lock the roadmap a year ahead so the team can’t change course.' },
        ],
        correctId: 'b',
        why: 'The loop exists to reduce uncertainty cheaply: build just enough to test an assumption, measure how customers actually behave, and learn enough to choose the next step — the opposite of betting big on an unvalidated plan.',
      },
    ],
  },
};
