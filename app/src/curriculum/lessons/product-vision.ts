import type { ConceptLessonContent } from './types';

/**
 * Senior · Strategy & Vision: "Vision & Strategic Intent".
 * What a vision is (and isn't), what makes it good, and how strategic intent
 * narrows a durable vision into the bet you make this year.
 */
export const productVision: ConceptLessonContent = {
  skillId: 'product-vision',
  hook: 'A good product vision is a recruiting tool, a filter, and a north star, not a slogan on a slide.',
  framework: 'Marty Cagan · INSPIRED (Product Vision)',
  sections: [
    {
      heading: 'Vision vs strategy vs mission',
      body: [
        'These three blur together, so keep them straight. The mission is why the company exists. The vision is the future you’re trying to create (usually 3 to 10 years out) described vividly enough that people can picture it. The strategy is how you’ll get there: the sequence of bets. Vision is the destination; strategy is the route. A team with a route and no destination optimizes its way to nowhere in particular.',
      ],
    },
    {
      heading: 'What makes a vision good',
      body: [
        'Cagan’s test: a strong vision is inspiring enough to recruit and retain great people, persistent enough to survive the inevitable pivots in strategy, and customer-centric: it describes a better world for the user, not a bigger number for you. It should be ambitious but believable, and concrete enough to act as a filter: you can hold a proposed feature up to it and ask "does this take us toward that world?"',
        'Beware two failure modes. A vision that’s really a quarterly target ("hit $50M ARR") expires and inspires no one. A vision that’s pure poetry ("delight users everywhere") is so vague it filters nothing. The good ones are specific about the change and silent about the mechanics.',
      ],
      bullets: [
        'Inspiring: makes talented people want to work on it.',
        'Persistent: survives strategy pivots; you don’t rewrite it every quarter.',
        'Customer-centric: a better world for the user, not a metric for you.',
        'A filter: concrete enough to judge whether an idea moves you toward it.',
      ],
    },
    {
      heading: 'Strategic intent narrows the vision',
      body: [
        'A vision is too big to act on directly. You can’t build "the future" this quarter. Strategic intent is the bridge: given the durable vision, what is the one focused thing we must achieve in the next year or two to make real progress? It turns an inspiring direction into a bet specific enough that teams can form objectives under it. Vision answers "where are we going?"; strategic intent answers "what do we have to nail next to get closer?"',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Sharpening a vague vision for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Weak: "Be the #1 ${ctx.product} in the market." It’s a target about you, it expires, and it can’t filter a single feature decision.`,
        (ctx) =>
          `Stronger: "A world where any ${ctx.user} can go from question to confident decision in under a minute, without asking anyone for help."`,
        'It’s customer-centric, durable (still true in five years), and a real filter: you can ask of any idea, "does this shorten that path?"',
        'Strategic intent for next year: make first-session success the moment of truth, getting a brand-new user to that first confident decision unaided.',
      ],
      takeaway:
        'Describe the better world for the user, keep it free of metrics and mechanics, and check that it can actually filter a decision.',
    },
  ],
  takeaways: [
    'Vision is the destination (the future you’re creating, 3-10 yrs); strategy is the route. Don’t confuse either with the mission.',
    'A good vision (Cagan) is inspiring, persistent through pivots, customer-centric, and concrete enough to act as a decision filter.',
    'Strategic intent bridges vision and execution: the focused bet you must nail in the next year or two to move toward the vision.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Which of these best functions as a product vision by Cagan’s test?',
        options: [
          { id: 'a', label: '"Grow to 5 million users and $50M ARR by end of next fiscal year."' },
          {
            id: 'b',
            label:
              '"A world where anyone can manage their money as confidently as a professional, without needing one."',
          },
          { id: 'c', label: '"Ship the redesign and three new integrations this quarter."' },
        ],
        correctId: 'b',
        why: 'A vision describes a durable, customer-centric future you can recruit toward and filter ideas against. The other two are a financial target and a quarterly plan: both expire and neither describes a better world for the user.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Why does a team need strategic intent if it already has an inspiring vision?',
        options: [
          { id: 'a', label: 'It doesn’t. A vivid vision is enough to direct daily work.' },
          {
            id: 'b',
            label:
              'A vision is too broad to act on directly; strategic intent names the focused bet for the next year or two so teams can form objectives under it.',
          },
          { id: 'c', label: 'Strategic intent replaces the vision once the company matures.' },
        ],
        correctId: 'b',
        why: 'Vision is the multi-year destination. You can’t build "the future" this quarter. Strategic intent narrows it into the specific outcome you must achieve next, bridging the gap between an inspiring direction and a team’s objectives.',
      },
    ],
  },
};
