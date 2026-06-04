import type { ConceptLessonContent } from './types';

/**
 * Platform & API track: "Platform Thinking".
 * Two-sided value (producers and consumers), internal platforms as leverage
 * that compounds, and the discipline of extracting a platform at the right time.
 */
export const trackPlatformThinking: ConceptLessonContent = {
  skillId: 'track-platform-thinking',
  hook: 'A product serves users. A platform serves builders who serve users, so the value you create is the value everyone builds on top of you.',
  framework: 'Platform Revolution (Parker, Van Alstyne, Choudary) and internal-platform leverage',
  sections: [
    {
      heading: 'Two-sided value: producers and consumers',
      body: [
        'A platform connects two groups and creates value by the interaction between them, not by what the platform produces itself. There are producers (who supply the apps, listings, content, or extensions) and consumers (who use them). The platform owner makes its money by enabling and governing that exchange. This is a different job from a linear product: instead of building all the value yourself, you build the rails, the rules, and the tools that let others create value you could never build alone. Strategy becomes about the health of both sides at once, not just your own feature list.',
      ],
      bullets: [
        'Producers: the side that creates supply on top of you (developers, sellers, creators).',
        'Consumers: the side that uses that supply.',
        'Your job: the tools, standards, and trust that make the exchange happen and stay healthy.',
      ],
    },
    {
      heading: 'Internal platforms: leverage that compounds',
      body: [
        'Not every platform is external. The most common kind a PM meets is internal: a shared capability (a design system, a payments service, an experimentation framework, a data pipeline) that many product teams build on, so each new feature is faster and cheaper than the last. The point of an internal platform is leverage. It bends the whole organization\'s cost curve down, because work done once is reused everywhere. A feature team ships a feature; a platform team makes the next ten features across the company cheaper to ship.',
      ],
    },
    {
      heading: 'Extract platforms; do not speculate them',
      body: [
        'Platform investment is seductive and easy to get wrong. Build it too early and you create elaborate abstractions for products that do not exist yet, paying a real cost (platform work delivers no immediate customer value) for imaginary reuse. The discipline is to extract a platform from proven, repeated need, not to speculate one into existence. The signal is repetition: when three teams have each hand-rolled the same thing, that solved-three-times problem is ripe to be pulled out into shared capability. Done at the right moment, the platform pays for itself many times over. Done too soon, it is overhead that slows everyone down.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Spotting the platform inside a ${ctx.product}`,
      lines: [
        (ctx) =>
          `External angle: open the ${ctx.product} to third-party builders so producers create extensions your own team never would, and ${ctx.user}s get far more value.`,
        'Internal angle: three product teams have each built their own half-baked notifications system. That repeated need is the signal.',
        'Extract one shared notifications service the whole org builds on. Work done once, reused everywhere: leverage, not speculation.',
        'You resist building a grand "platform for everything" up front, because abstractions for products that do not exist yet are pure cost.',
      ],
      takeaway:
        'Think in two sides for external platforms and in shared leverage for internal ones, and extract the platform from proven repetition rather than speculating it early.',
    },
  ],
  takeaways: [
    'A platform creates value through the interaction between producers and consumers; you build the rails, rules, and tools, not all the value yourself.',
    'An internal platform is shared capability many teams build on, so it compounds: it makes the next ten features cheaper and bends the whole org\'s cost curve down.',
    'Extract a platform from proven, repeated need (the same thing hand-rolled three times), never speculate one up front for products that do not exist yet.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'What fundamentally distinguishes a platform from a linear (pipeline) product?',
        options: [
          { id: 'a', label: 'A platform has more users than a linear product.' },
          {
            id: 'b',
            label:
              'A platform creates value through the interaction between two sides (producers who supply and consumers who use), and the owner builds the rails and rules rather than producing all the value itself.',
          },
          { id: 'c', label: 'A platform is always free, while a linear product is always paid.' },
        ],
        correctId: 'b',
        why: 'A linear product builds all its value in-house and sells it. A platform connects producers and consumers and profits by enabling and governing their exchange, so its strategy is about the health of both sides and the tools that let others create value the owner could not build alone.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'When is the right moment to invest in extracting a shared internal platform?',
        options: [
          { id: 'a', label: 'Up front, before any product ships, because "we will need a platform eventually."' },
          {
            id: 'b',
            label:
              'When several teams have each independently built the same capability: that proven, repeated need is the signal of real, non-speculative leverage.',
          },
          { id: 'c', label: 'Never; internal platforms are pure overhead with no value.' },
        ],
        correctId: 'b',
        why: 'Platforms built too early are abstractions for products that do not exist yet, a real cost for imaginary reuse. Extracting one from a need three teams have each already hand-rolled converts proven repetition into compounding leverage without the speculation.',
      },
    ],
  },
};
