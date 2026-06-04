import type { ConceptLessonContent } from './types';

/**
 * Senior · Growth & Monetization: "Monetization & Pricing".
 * The three decisions of pricing: packaging, price metric, and the price
 * itself anchored to willingness to pay, kept distinct from cost-plus thinking.
 */
export const monetizationPricing: ConceptLessonContent = {
  skillId: 'monetization-pricing',
  hook: 'Pricing isn’t one number. It’s three decisions: how you package, what you charge for, and how much, anchored to what the customer will actually pay.',
  framework: 'Value-based pricing · Monetizing Innovation (Ramanujam & Tacke)',
  sections: [
    {
      heading: 'Three decisions, not one',
      body: [
        'Most "pricing" debates collapse three separate choices into one argument about a dollar figure. Separate them. Packaging is how you bundle capabilities into offers (tiers, add-ons, what’s in Free vs Pro vs Enterprise). The price metric (or value metric) is the unit you charge by: per seat, per transaction, per GB, per active user. The price is the actual amount on each unit. Each is a distinct lever, and the metric is usually the most consequential of the three.',
      ],
      bullets: [
        'Packaging: which capabilities go in which offer (the tiers and add-ons).',
        'Price metric: the unit you charge by (seat, transaction, usage, outcome).',
        'Price: the amount per unit, set against willingness to pay.',
      ],
    },
    {
      heading: 'Charge for what scales with value',
      body: [
        'The best price metric tracks the value the customer gets and grows as their usage of that value grows. When the metric is aligned, customers who get more value pay more, and small customers aren’t priced out: the account expands naturally as they succeed. When it’s misaligned (a flat fee regardless of usage, or charging for something customers don’t connect to value) you either leave money on the table with power users or scare off newcomers. A good metric also has to be easy to understand and hard to game.',
      ],
    },
    {
      heading: 'Willingness to pay, not cost-plus',
      body: [
        'Cost-plus pricing (add a margin to your costs) answers the wrong question. Customers don’t care what it cost you to build; they pay for the value they receive. Value-based pricing starts from willingness to pay (WTP): the most a given segment would pay for the value delivered, which you learn by asking and testing, not guessing. A classic mistake (Ramanujam and Tacke call it building a product nobody will pay for) is shipping first and bolting price on at the end: the WTP conversation belongs in discovery, alongside the value and viability risks, not after launch. Different segments have different WTP, which is exactly why tiers exist.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Picking a price metric for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Per-seat looks simple, but a ${ctx.user} who logs in twice a month pays the same as a daily power user, and light teams balk at buying seats.`,
        'A usage- or outcome-based metric (per active workflow, per successful transaction) ties the bill to value received and expands as the account grows.',
        'Packaging: a Free tier to prove value, Pro for the everyday team, Enterprise for security/controls, each aimed at a segment with different WTP.',
        'Set the price from researched willingness to pay per segment, not by marking up your hosting and salary costs.',
      ],
      takeaway:
        'Choose a metric that grows with the value the customer gets, package to each segment’s WTP, and set the number from value, never from cost.',
    },
  ],
  takeaways: [
    'Pricing is three separate decisions: packaging (the offers), the price metric (the unit you charge by), and the price itself.',
    'The strongest price metric tracks and scales with the value the customer receives, and is simple to understand and hard to game.',
    'Price to willingness to pay, not cost-plus; have the WTP conversation in discovery, and use tiers to serve segments with different WTP.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A team sets its subscription price by totaling its monthly infrastructure and salary costs and adding a 40% margin. What’s the fundamental flaw?',
        options: [
          { id: 'a', label: 'The margin is too low to be sustainable.' },
          {
            id: 'b',
            label:
              'It’s cost-plus pricing: it ignores what the customer would actually pay for the value received (willingness to pay), which is what price should be anchored to.',
          },
          { id: 'c', label: 'Nothing. Cost-plus guarantees profitability, so it’s the safest method.' },
        ],
        correctId: 'b',
        why: 'Customers pay for value, not for your costs. Value-based pricing starts from researched willingness to pay per segment. Cost-plus systematically leaves money on the table where value is high and overprices where value is low.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Why does the choice of price metric (the unit you charge by) often matter more than the price number itself?',
        options: [
          { id: 'a', label: 'It doesn’t. The dollar amount is always the decisive factor.' },
          {
            id: 'b',
            label:
              'A metric aligned to value lets the bill grow as the customer gets more value, expanding accounts naturally and avoiding pricing out small users; a misaligned metric breaks both.',
          },
          { id: 'c', label: 'Because the metric determines the company’s tax treatment.' },
        ],
        correctId: 'b',
        why: 'The price metric governs how revenue scales with usage and value. When it tracks value, customers who benefit more pay more and new customers can start small; a flat or misaligned metric either caps upside or deters entrants.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Value-based pricing anchors the price to the most a customer segment would pay for the value delivered, a quantity abbreviated "WTP." Spell out what WTP stands for (three words).',
        accept: ['willingness to pay', 'willingness-to-pay'],
        why: 'WTP is willingness to pay: the maximum a segment will pay for the value received. It’s learned through research and testing and is the anchor for value-based pricing, in contrast to cost-plus.',
        placeholder: 'three words',
      },
    ],
  },
};
