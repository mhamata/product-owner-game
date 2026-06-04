import type { ConceptLessonContent } from './types';

/**
 * Staff / Principal · Scope & Leverage: "Platform & Portfolio Thinking".
 * Leverage as the unit of value: build-vs-buy on what's differentiating,
 * platform investment that compounds, and managing a portfolio of bets.
 */
export const platformPortfolioThinking: ConceptLessonContent = {
  skillId: 'platform-portfolio-thinking',
  hook: 'A senior PM ships a feature; a staff PM builds the thing that makes the next ten features cheaper: leverage is the unit that matters.',
  framework: 'Wardley Mapping · "focus on your core" (build-vs-buy)',
  sections: [
    {
      heading: 'Build vs buy: only build what differentiates',
      body: [
        'For any capability you need, you can build it, buy it (a vendor or SaaS), or adopt something off the shelf (open source). The deciding question is not "can we build it?" (you usually can) but "does building it create durable advantage?" Build the things that are core to why customers choose you; buy or borrow the things that are necessary but undifferentiated. Engineering a bespoke auth system, payments stack, or logging pipeline that a mature vendor already solved spends your scarcest resource (engineering attention) on table stakes that win you nothing.',
      ],
      bullets: [
        'Core / differentiating: build it; this is where your advantage compounds.',
        'Necessary but generic: buy or adopt; don\'t reinvent a solved commodity.',
        'The cost of building commodity capability is the differentiated work you didn\'t do instead.',
      ],
    },
    {
      heading: 'Platform thinking: invest in what compounds',
      body: [
        'A platform is internal leverage: shared capability (a design system, a data pipeline, a payments service, an experimentation framework) that many teams build on so each new product is faster and cheaper than the last. The tradeoff is real: platform work pays no immediate customer dividend, and over-investing too early ("we need a platform") builds abstractions for products that don\'t exist yet. The discipline is to extract a platform from proven, repeated needs (when three teams have each hand-rolled the same thing) rather than to speculate one into existence. Done at the right time, platform investment bends the whole org\'s cost curve down.',
      ],
    },
    {
      heading: 'Portfolio thinking: balance the bets',
      body: [
        'No single product or bet should carry the whole company, so staff PMs think in portfolios. A common lens is the three horizons: Horizon 1 is the core business you defend and optimize; Horizon 2 is emerging bets scaling toward real revenue; Horizon 3 is speculative options on the future. A healthy portfolio funds all three: starving H1 to chase H3 risks the present, while pouring everything into H1 mortgages the future. The portfolio also lets you take asymmetric bets: many cheap, reversible experiments where the downside is capped and the upside is large.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `A leverage call on the ${ctx.product}`,
      lines: [
        (ctx) =>
          `The ${ctx.product} needs notifications, audit logging, and the one thing customers actually rave about: a smart recommendations engine.`,
        'Build vs buy: notifications and audit logging are generic and solved: adopt a vendor. The recommendations engine is the differentiator; build that, and put your best engineers on it.',
        'Platform: three teams have each built their own half-baked event tracking. That repeated, proven need is the signal to extract one shared pipeline: leverage, not speculation.',
        (ctx) =>
          `Portfolio: protect the core ${ctx.user} experience (H1), fund the recommendations bet toward revenue (H2), and run a couple of cheap, reversible experiments on adjacent ideas (H3).`,
      ],
      takeaway:
        'Build only what differentiates, extract platforms from proven repetition, and keep a balanced portfolio of safe core and asymmetric bets.',
    },
  ],
  takeaways: [
    'Build what is core and differentiating; buy or adopt necessary-but-generic capability: building commodities costs you the differentiated work you skipped.',
    'A platform is shared internal leverage; extract it from proven, repeated needs rather than speculating one too early.',
    'Think in a portfolio (e.g. three horizons): fund the core, scale emerging bets, and keep cheap asymmetric options on the future.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A team is debating whether to build its own authentication system or integrate a mature identity vendor. Which question should most drive the build-vs-buy decision?',
        options: [
          { id: 'a', label: 'Can our engineers build it? If yes, we should build it ourselves.' },
          {
            id: 'b',
            label:
              'Is authentication a source of durable differentiation for us? If not, buy it and spend the engineering on what is.',
          },
          { id: 'c', label: 'Which option has the lower upfront license cost this quarter?' },
        ],
        correctId: 'b',
        why: 'Capability ("can we?") is rarely the constraint. Almost any team can build auth. The real question is whether building it creates lasting advantage. Auth is table stakes for most products, so buying frees your scarce engineering for the differentiating work.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'When is the right moment to invest in extracting a shared internal platform?',
        options: [
          {
            id: 'a',
            label: 'Up front, before the first product ships: "we\'ll need a platform eventually."',
          },
          {
            id: 'b',
            label:
              'When several teams have each independently built the same capability: a proven, repeated need signals real leverage.',
          },
          { id: 'c', label: 'Never. Platforms are pure overhead with no customer value.' },
        ],
        correctId: 'b',
        why: 'Platforms built too early are abstractions for products that don\'t exist yet. Extracting one from a need that three teams have each already hand-rolled turns proven repetition into compounding leverage, without speculating.',
      },
    ],
  },
};
