import type { ConceptLessonContent } from './types';

/**
 * B2B / B2C track: "B2C Motion".
 * The user is the buyer (product-led self-serve), why the product must sell
 * itself in seconds, and the consumer psychology that drives adoption.
 */
export const trackB2cMotion: ConceptLessonContent = {
  skillId: 'track-b2c-motion',
  hook: 'In consumer, there is no salesperson in the room. The product is the entire pitch, and it has seconds to convince someone before they bounce.',
  framework: 'B2C product strategy: product-led self-serve growth and consumer psychology',
  sections: [
    {
      heading: 'The user is the buyer: the product must sell itself',
      body: [
        'In B2C the person using the product is usually also the one deciding to adopt and pay, often in a single sitting with no committee and no sales call. That collapses the whole evaluation onto the product itself: it has to communicate value and deliver a first win fast, because attention is scarce and a confused or slow first experience loses the user for good. The motion is product-led and self-serve: people discover, try, and convert on their own. So onboarding and time-to-value are not nice polish, they are the sale. Where a B2B PM equips a salesperson, a B2C PM makes the product do the selling.',
      ],
    },
    {
      heading: 'Product-led growth and scale economics',
      body: [
        'Consumer products typically have huge numbers of users each paying little (or nothing directly), the mirror image of B2B\'s few high-value deals. That math forces a self-serve, low-friction funnel: you cannot afford a salesperson per user, so signup, activation, and upgrade all have to work without human help. Growth tends to come from the product itself: virality and referral (users bring users), content and organic discovery, and a frictionless path from first touch to habit. Retention is everything, because reacquiring a churned consumer is expensive and a leaky funnel at consumer scale wastes enormous spend. The lever is the product experience, optimized relentlessly through experimentation.',
      ],
      bullets: [
        'Self-serve funnel: discover, try, activate, and pay with no human in the loop.',
        'Product-driven growth: virality, referral, and organic discovery over a sales team.',
        'Many small users: scale economics demand low friction and strong retention.',
      ],
    },
    {
      heading: 'Consumer psychology drives adoption',
      body: [
        'Consumers do not read ROI spreadsheets; they respond to motivation, friction, emotion, and habit. So B2C product work leans hard on behavioral design. Reduce friction at every step, because each extra field or tap sheds users. Deliver an early, visible reward so the first session feels worth it. Build a habit loop (a cue, an easy action, a satisfying payoff) so the product earns a place in daily life. Use social proof and a sense of progress to pull people forward. None of this means manipulation; the durable version is aligning the product\'s hooks with value the user genuinely wants. Understanding why a person acts, and designing the experience around that, is the core craft of consumer PM.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Driving self-serve adoption of a ${ctx.product}`,
      lines: [
        (ctx) =>
          `There is no sales call: a ${ctx.user} lands, and the product has seconds to show value before they leave.`,
        'So you obsess over onboarding and time-to-value, stripping every unnecessary signup field and getting them to a first visible win fast.',
        'Growth is product-led: a frictionless funnel plus referral and organic discovery, because you cannot put a salesperson behind millions of small users.',
        'You apply consumer psychology: an early reward, a habit loop, and social proof, all aligned with value the user actually wants, then you A/B test the funnel relentlessly.',
      ],
      takeaway:
        'Make the product sell itself with fast time-to-value, grow through a low-friction self-serve and viral funnel, and design around consumer psychology so adoption and habit follow.',
    },
  ],
  takeaways: [
    'In B2C the user is the buyer and there is no salesperson, so the product itself must communicate value and deliver a first win in seconds: onboarding and time-to-value are the sale.',
    'The motion is product-led and self-serve, with many small users: growth comes from virality, referral, and organic discovery, and retention is decisive at consumer scale.',
    'Consumers act on motivation, friction, emotion, and habit, so lean on behavioral design (reduce friction, early reward, habit loop, social proof) aligned with value they genuinely want.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Why must a consumer (B2C) product "sell itself" in a way a sales-led B2B product does not?',
        options: [
          { id: 'a', label: 'Because consumer products are legally barred from having salespeople.' },
          {
            id: 'b',
            label:
              'Because the user is the buyer and adopts self-serve with no salesperson in the room, so the product alone must communicate value and deliver a first win fast before scarce attention runs out.',
          },
          { id: 'c', label: 'Because consumers always pay more than businesses do.' },
        ],
        correctId: 'b',
        why: 'In B2C the person using the product also decides to adopt and pay, usually alone and in one sitting. With no salesperson to guide evaluation, the entire pitch collapses onto the product, so onboarding and time-to-value are the sale, not optional polish.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A consumer product has millions of users who each pay little or nothing directly. How does this scale math shape the go-to-market motion?',
        options: [
          { id: 'a', label: 'It justifies hiring a dedicated salesperson for each user to maximize conversion.' },
          {
            id: 'b',
            label:
              'It forces a low-friction, self-serve funnel and product-led growth (virality, referral, organic discovery), since you cannot afford human-assisted sales per user, and makes retention decisive at that scale.',
          },
          { id: 'c', label: 'It means the product does not need to worry about retention.' },
        ],
        correctId: 'b',
        why: 'Many small users is the mirror of B2B\'s few large deals. The economics rule out per-user sales, so signup, activation, and upgrade must work self-serve, growth comes from the product (virality, referral, organic), and retention matters intensely because reacquiring churned consumers at scale is expensive.',
      },
    ],
  },
};
