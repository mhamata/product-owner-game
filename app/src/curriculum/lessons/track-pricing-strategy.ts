import type { ConceptLessonContent } from './types';

/**
 * Monetization track: "Pricing Strategy".
 * Value-based vs cost-plus, willingness to pay as the anchor, and the price
 * metric (value metric) as the most consequential pricing decision.
 */
export const trackPricingStrategy: ConceptLessonContent = {
  skillId: 'track-pricing-strategy',
  hook: 'Customers do not pay for what it cost you to build. They pay for the value they get, so price has to start from what they are actually willing to pay.',
  framework: 'Value-based pricing and willingness to pay; Monetizing Innovation (Ramanujam & Tacke)',
  sections: [
    {
      heading: 'Value-based, not cost-plus',
      body: [
        'There are two ways to set a price. Cost-plus adds a margin to what the product cost to make. Value-based starts from the value the customer receives and what they would pay for it. Cost-plus feels safe but answers the wrong question: your costs are your problem, not the customer\'s, and pricing off them systematically leaves money on the table where value is high and overprices where value is low. Value-based pricing anchors to the customer\'s perceived value. The key input is willingness to pay (WTP): the most a given segment would pay for the value delivered. You learn WTP by asking and testing, not by guessing, and crucially you do it during discovery, alongside the value and viability risks, not after the product is built.',
      ],
      bullets: [
        'Cost-plus: margin on your cost. Easy, but ignores what the customer values.',
        'Value-based: anchored to perceived value and willingness to pay.',
        'WTP belongs in discovery: validate that someone will pay before you build, not after.',
      ],
    },
    {
      heading: 'The price metric is the biggest decision',
      body: [
        'The price metric (also called the value metric) is the unit you charge by: per seat, per transaction, per GB, per active user, per outcome. It is usually the most consequential pricing choice you make, more than the number itself, because it governs how revenue scales as a customer gets more value. The best metric tracks value and grows with the customer\'s success: light users pay little and are not scared off, heavy users pay more, and accounts expand naturally as usage grows. A misaligned metric (a flat fee regardless of use, or charging for something customers do not tie to value) either caps your upside on power users or deters newcomers at the door. A good metric is also easy to understand and hard to game.',
      ],
    },
    {
      heading: 'Different segments, different willingness to pay',
      body: [
        'WTP is not a single number; it varies by segment. A solo user, a small team, and a large enterprise get different amounts of value from the same product and will pay very differently for it. This is the whole reason tiers and segmented pricing exist: to capture more of the value across a range of customers instead of setting one price that is too high for the small and too low for the large. The strategic move is to identify your segments, learn each one\'s WTP, and structure pricing so each pays closer to the value it actually receives. Get the metric and the segmentation right and the exact number becomes a tunable detail rather than the whole fight.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Setting pricing strategy for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Cost-plus temptation: total the hosting and salaries, add 40%. But that number has nothing to do with what a ${ctx.user} actually values.`,
        'Value-based instead: in discovery you ask and test what each segment would pay for the outcome, and learn that heavy users get far more value than light ones.',
        'Price metric: a flat monthly fee would let power users underpay and scare off small ones, so you charge per active workflow, which scales with value received.',
        (ctx) =>
          `Segments: a solo ${ctx.user}, a team, and an enterprise have different WTP, so pricing is structured so each pays nearer the value it gets.`,
      ],
      takeaway:
        'Anchor price to willingness to pay learned in discovery, choose a metric that scales with the value the customer receives, and segment because WTP differs across customers.',
    },
  ],
  takeaways: [
    'Use value-based pricing, not cost-plus: customers pay for the value they receive, so anchor to willingness to pay (learned in discovery), not to your costs.',
    'The price metric (the unit you charge by) is usually the biggest decision: a metric that scales with value expands accounts and avoids pricing out small users.',
    'Willingness to pay varies by segment, which is exactly why tiers and segmented pricing exist: structure pricing so each segment pays closer to the value it gets.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A team prices its product by totaling monthly costs and adding a fixed margin. What is the fundamental flaw in this cost-plus approach?',
        options: [
          { id: 'a', label: 'The margin percentage is probably too small.' },
          {
            id: 'b',
            label:
              'It ignores what the customer would actually pay for the value received (willingness to pay); pricing off your costs leaves money on the table where value is high and overprices where value is low.',
          },
          { id: 'c', label: 'Nothing; cost-plus is the safest method because it guarantees a margin.' },
        ],
        correctId: 'b',
        why: 'Customers pay for value, not for your costs. Value-based pricing anchors to researched willingness to pay per segment. Cost-plus answers the wrong question and systematically misprices relative to the value customers actually perceive.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Why is the price metric (the unit you charge by, e.g. per seat vs per transaction) often the most consequential pricing decision, more than the dollar amount?',
        options: [
          { id: 'a', label: 'It is not; the dollar amount is always the decisive factor.' },
          {
            id: 'b',
            label:
              'The metric governs how revenue scales with value and usage: a metric aligned to value lets heavy users pay more while not scaring off light ones, so accounts expand naturally; a misaligned metric caps upside or deters entrants.',
          },
          { id: 'c', label: 'Because the metric determines the company\'s tax treatment.' },
        ],
        correctId: 'b',
        why: 'The price metric controls the shape of how money scales as customers get more value. When it tracks value, small customers start cheaply and big ones pay more as they grow. A flat or misaligned metric either leaves money on the table with power users or prices out newcomers, which the headline number cannot fix.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Value-based pricing anchors to the most a customer segment would pay for the value delivered, a quantity abbreviated "WTP." Spell out what WTP stands for (three words).',
        accept: ['willingness to pay', 'willingness-to-pay'],
        why: 'WTP is willingness to pay: the maximum a segment will pay for the value received. It is learned by asking and testing in discovery and is the anchor for value-based pricing, in contrast to cost-plus.',
        placeholder: 'three words',
      },
    ],
  },
};
