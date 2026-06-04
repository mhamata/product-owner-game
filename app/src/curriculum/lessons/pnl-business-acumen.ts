import type { ConceptLessonContent } from './types';

/**
 * Director / VP · The Operating Model: "P&L & Business Acumen".
 * Reading a P&L, unit economics (CAC / LTV / contribution margin / payback),
 * and allocating finite resources as a leader who owns a number.
 */
export const pnlBusinessAcumen: ConceptLessonContent = {
  skillId: 'pnl-business-acumen',
  hook: 'At the leadership altitude you don’t just ship product: you own a number, and you’re expected to read the business behind it.',
  framework: 'Unit economics · CAC · LTV · contribution margin',
  sections: [
    {
      heading: 'Read the P&L like a product',
      body: [
        'A profit-and-loss statement (P&L) is just the business’s outcomes written in money. Top line is revenue. Subtract the cost of goods sold (the direct cost of delivering the product: hosting, payment fees, support tied to each unit) to get gross profit, and gross profit over revenue is your gross margin. Below that sit operating expenses (including the team building the product) which separate gross profit from operating profit. A product leader who can read this can connect a feature decision to where it actually lands on the statement: revenue, margin, or cost.',
        'The point is not to become a finance person. It is to stop treating money as someone else’s department. The viability risk (does this work for the business) lives in these numbers, and at Director/VP you are the one accountable for it.',
      ],
    },
    {
      heading: 'Unit economics: does one customer pay off?',
      body: [
        'Unit economics asks whether a single customer makes or loses money over their lifetime: the question that decides whether growth is a flywheel or a cash incinerator. The core terms are worth knowing precisely.',
      ],
      bullets: [
        'CAC, customer acquisition cost: the fully-loaded cost to win one customer (sales + marketing ÷ customers acquired).',
        'Contribution margin: revenue from a customer minus the variable cost to serve them; what each customer contributes toward fixed costs and profit.',
        'LTV, lifetime value: the total contribution margin a customer delivers before they churn (so it depends heavily on retention).',
        'LTV : CAC ratio: a rough health check; a commonly-cited target is roughly 3:1, meaning a customer returns about three times what they cost to acquire.',
        'Payback period: how many months of margin it takes to earn back the CAC; shorter payback means growth funds itself sooner.',
      ],
    },
    {
      heading: 'Allocation is the real leadership act',
      body: [
        'Strategy is choosing where the finite resources go. As a leader you allocate a fixed number of teams, engineers, and dollars across far more opportunities than you can fund, and every yes is a no somewhere else (the opportunity cost). Good allocation concentrates resources behind the few bets the strategy says matter most, rather than spreading them thin to keep everyone busy. The discipline is to fund outcomes, not to ratify every team’s wish list, and to be willing to starve a beloved project to fully resource a more important one.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Sanity-checking growth on the ${ctx.product}`,
      lines: [
        (ctx) =>
          `The ${ctx.product} is acquiring ${ctx.user}s fast and the team wants to pour more into acquisition. The growth chart looks great.`,
        'The leader checks the unit economics first: CAC is about $300, and each customer’s contribution margin runs ~$25/month.',
        'Retention says the average customer stays ~10 months, so LTV ≈ $250, below the $300 it costs to acquire them. LTV:CAC is under 1, and the payback never completes.',
        'Conclusion: spending more on acquisition would scale a loss. The leverage is retention and margin: lift the customer lifetime above the payback line before stepping on the gas.',
      ],
      takeaway:
        'Fast growth on bad unit economics scales the loss: read CAC, contribution margin, LTV, and payback before funding more acquisition.',
    },
  ],
  takeaways: [
    'A P&L is the business’s outcomes in money: revenue → gross margin (after cost of goods sold) → operating profit (after opex); know where a decision lands.',
    'Unit economics: CAC, contribution margin, LTV, LTV:CAC (~3:1 is a common target), and payback period. Together they decide whether growth makes or loses money.',
    'Leadership is allocation: concentrate finite teams and dollars behind the strategy’s few real bets, knowing every yes is a no elsewhere.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A product line acquires customers at a CAC of $300, but each customer delivers only about $250 in total contribution margin before churning. The line is growing quickly. What does this tell a product leader?',
        options: [
          { id: 'a', label: 'Growth is healthy. More acquisition spend is clearly warranted.' },
          {
            id: 'b',
            label:
              'The unit economics are upside-down (LTV < CAC); growing faster scales a loss, so the lever is retention/margin, not more acquisition.',
          },
          { id: 'c', label: 'CAC and LTV are unrelated, so the comparison isn’t meaningful.' },
        ],
        correctId: 'b',
        why: 'When lifetime value is below acquisition cost, each new customer loses money. Spending more to acquire simply multiplies the loss. The fix is to raise LTV (through retention or contribution margin) until it clears CAC with room to spare.',
      },
      {
        kind: 'fill',
        id: 'q2',
        prompt:
          'What is the name for the metric that measures how many months of a customer’s margin it takes to earn back the cost of acquiring them?',
        accept: ['payback period', 'payback', 'cac payback', 'cac payback period', 'payback time'],
        why: 'The payback period is how long it takes to recover CAC from the customer’s contribution margin. A shorter payback means growth becomes self-funding sooner, which is why leaders watch it closely.',
        placeholder: 'metric name',
      },
    ],
  },
};
