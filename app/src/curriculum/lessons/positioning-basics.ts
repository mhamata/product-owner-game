import type { ConceptLessonContent } from './types';

/**
 * Product Manager · Roadmapping & Positioning: "Positioning Basics" (Dunford).
 * Positioning as context-setting: competitive alternatives → unique attributes →
 * the value they enable → the best-fit market segment that cares most.
 */
export const positioningBasics: ConceptLessonContent = {
  skillId: 'positioning-basics',
  hook: 'Positioning isn’t a tagline. It’s the context you set so customers instantly grasp what your product is and why it’s for them.',
  framework: 'April Dunford · Obviously Awesome',
  sections: [
    {
      heading: 'Positioning is context, not slogans',
      body: [
        'April Dunford defines positioning as deliberately setting the context for your product: the frame of reference customers use to understand what it is, who it’s for, and why it’s better. Get the frame wrong and even a great product looks confusing or mediocre; get it right and the value becomes obvious. Positioning is the foundation that messaging, pricing, and go-to-market all sit on top of; it is not a clever line of copy.',
      ],
    },
    {
      heading: 'Dunford’s chain: alternatives → attributes → value → segment',
      body: [
        'Dunford’s method builds positioning in a specific order. Each step depends on the one before it, which is why she runs it as a sequence rather than a brainstorm.',
      ],
      bullets: [
        'Competitive alternatives: what customers would use if you didn’t exist (often a spreadsheet or "do nothing," not a named rival).',
        'Unique attributes: the capabilities you have that the alternatives lack.',
        'Value: the benefit those attributes enable, in terms the customer cares about.',
        'Best-fit segment: the customers who care most about that value, where your strengths matter most.',
      ],
    },
    {
      heading: 'Why the order matters',
      body: [
        'You can only claim to be "different" relative to something, so alternatives come first; they set the baseline. Your unique attributes are what you have that those alternatives don’t, and value is the "so what" of each attribute translated into a customer benefit. Finally, the best-fit segment is whoever values that benefit most intensely; nailing the segment is what makes the same product feel essential to the right buyer instead of vaguely nice to everyone. Trying to be for everybody dilutes the value and positions you against the wrong alternatives.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Positioning a ${ctx.product} the Dunford way`,
      lines: [
        (ctx) =>
          `Alternatives: what would a ${ctx.user} use instead? Often a manual spreadsheet plus email, not a flashy competitor. That’s the real baseline.`,
        'Unique attributes: the things you have that the spreadsheet doesn’t, say automatic reconciliation and a live audit trail.',
        'Value: translate each attribute into a benefit: "close the books days sooner, with fewer errors." That’s what the customer actually buys.',
        (ctx) =>
          `Best-fit segment: the ${ctx.user}s who feel that pain hardest (those drowning in manual reconciliation) where your strengths matter most.`,
      ],
      takeaway:
        'Define what you’re really competing against first; your differentiation, its value, and the segment that cares most all flow from that frame.',
    },
  ],
  takeaways: [
    'Positioning is the context you set so customers grasp what the product is and why it’s for them: the foundation under messaging, not a tagline.',
    'Dunford’s order: competitive alternatives → unique attributes → the value they enable → the best-fit market segment.',
    'You’re only "different" relative to the alternatives, so name those first; then target the segment that values your differentiation most, rather than everyone.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'In Dunford’s approach, what is the correct starting point for figuring out your positioning?',
        options: [
          { id: 'a', label: 'Write a memorable tagline, then work backward from it.' },
          {
            id: 'b',
            label:
              'Identify the competitive alternatives: what customers would use if your product didn’t exist.',
          },
          { id: 'c', label: 'Pick the price point first and position around it.' },
        ],
        correctId: 'b',
        why: 'Positioning is relative: you can only be "different" or "better" compared to something. Competitive alternatives (often a spreadsheet or doing nothing) set the baseline from which your unique attributes, value, and best-fit segment all follow.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Why does Dunford insist on identifying the single best-fit segment rather than positioning for "everyone"?',
        options: [
          { id: 'a', label: 'Smaller markets are always more profitable.' },
          {
            id: 'b',
            label:
              'The best-fit segment values your differentiation most intensely, so the same product feels essential to them, whereas positioning for everyone dilutes the value and frames you against the wrong alternatives.',
          },
          { id: 'c', label: 'It’s easier to build a product for fewer users.' },
        ],
        correctId: 'b',
        why: 'A product feels essential to the customers who care most about what makes it unique. Targeting everyone waters down the value claim and pits you against alternatives that segment doesn’t even share.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'In Dunford’s chain, the capabilities you have that the competitive alternatives lack are your unique ___ (the step between alternatives and value).',
        accept: ['attributes', 'attribute'],
        why: 'The order is alternatives → unique attributes → value → best-fit segment. Unique attributes are what you can do that the alternatives can’t; value is the customer benefit those attributes enable.',
        placeholder: 'one word',
      },
    ],
  },
};
