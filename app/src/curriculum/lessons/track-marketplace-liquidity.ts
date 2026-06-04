import type { ConceptLessonContent } from './types';

/**
 * Marketplace track: "Liquidity & Matching".
 * Liquidity as the one metric that matters, balancing supply and demand, the
 * cold-start problem, and take rate as the price of the match.
 */
export const trackMarketplaceLiquidity: ConceptLessonContent = {
  skillId: 'track-marketplace-liquidity',
  hook: 'A marketplace lives or dies on one thing: can a buyer who shows up find what they want, and can a seller find a buyer? That is liquidity, and almost everything else is downstream of it.',
  framework: 'Marketplace liquidity, supply/demand balance, the cold-start problem, and take rate',
  sections: [
    {
      heading: 'Liquidity is the metric that matters',
      body: [
        'Liquidity is the probability that a participant who comes to the marketplace gets a successful match: a buyer finds something to buy, a seller finds a buyer. It is the health metric for a marketplace the way retention is for a product. High liquidity means the marketplace works, so people come back and tell others; low liquidity means buyers leave empty-handed and sellers see no demand, and both stop showing up. You measure it concretely (search-to-purchase rate, time to first booking, percent of listings that sell) rather than vanity totals like "number of listings," because a million listings nobody buys is not a liquid marketplace.',
      ],
    },
    {
      heading: 'Balance the two sides',
      body: [
        'A marketplace has two sides and they have to grow in balance. Too much supply and not enough demand, and sellers get no sales and churn; too much demand and not enough supply, and buyers cannot find what they want and churn. Either imbalance breaks liquidity. So marketplace growth is not "get more users," it is keeping the ratio healthy, which often means deliberately constraining one side or pouring effort into the lagging one. The two sides also create the chicken-and-egg dynamic: buyers want to go where the sellers are, and sellers want to go where the buyers are, so neither has a reason to be first.',
      ],
      bullets: [
        'Supply-constrained: plenty of buyers, too few sellers; buyers leave unmatched.',
        'Demand-constrained: plenty of sellers, too few buyers; sellers leave unsold.',
        'The job is the ratio, not the raw total on either side.',
      ],
    },
    {
      heading: 'Solve the cold start, then price the match',
      body: [
        'Because of the chicken-and-egg problem, the hardest moment is the cold start: an empty marketplace is useless to both sides, so why join? Proven tactics solve it by not trying to boil the ocean. Go narrow: pick a single category, city, or niche and get it liquid before expanding, so even a small marketplace feels full within that slice. Seed the harder side yourself (often supply) so the first participants on the other side find something. Once liquidity exists, the marketplace monetizes through the take rate: the cut it keeps on each transaction. Set it too high and you push participants to deal off-platform or leave; too low and you cannot sustain the business. The take rate has to be justified by the value the marketplace adds to the match (trust, discovery, payments, convenience).',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Bootstrapping liquidity for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Empty-marketplace problem: no ${ctx.user}s come because there is no supply, and no supply comes because there are no ${ctx.user}s. Chicken and egg.`,
        'Cold-start move: you go narrow, just one city and one category, and seed the supply side yourself so the first buyers actually find something.',
        'Balance: as it grows you watch the ratio, pushing effort into whichever side is lagging instead of chasing raw signups on both.',
        'Once matches happen reliably, you set a take rate justified by the value you add (trust, payments, discovery), high enough to sustain you but not so high people transact off-platform.',
      ],
      takeaway:
        'Optimize for liquidity, keep the two sides in balance, beat the cold start by going narrow and seeding the hard side, then price the match with a take rate the added value justifies.',
    },
  ],
  takeaways: [
    'Liquidity (the chance a participant gets a successful match) is the marketplace health metric: measure it directly, not via vanity totals like listing counts.',
    'Balance supply and demand: either imbalance breaks liquidity, so the job is the ratio between the two sides, not the raw total, against a chicken-and-egg dynamic.',
    'Beat the cold start by going narrow and seeding the hard side, then monetize with a take rate justified by the value the marketplace adds, not set so high people go off-platform.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Two marketplaces each have a million listings. Marketplace A: most searches end in a purchase. Marketplace B: almost no listings ever sell. Why is A far healthier despite the identical listing count?',
        options: [
          { id: 'a', label: 'It is not; an identical number of listings means identical health.' },
          {
            id: 'b',
            label:
              'A has high liquidity (participants who show up actually get matched), which is the metric that matters; B\'s listing count is a vanity total masking the fact that the marketplace does not actually work for its users.',
          },
          { id: 'c', label: 'A simply has a nicer user interface than B.' },
        ],
        correctId: 'b',
        why: 'Liquidity, the probability of a successful match, is the real health metric. A million listings nobody buys is not a liquid marketplace; buyers leave empty-handed and sellers see no demand. Concrete match rates beat vanity totals like raw listing counts every time.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A new marketplace faces the classic chicken-and-egg problem: buyers will not come without sellers, and sellers will not come without buyers. Which approach is most likely to establish liquidity?',
        options: [
          { id: 'a', label: 'Launch as broadly as possible across every category and city at once to maximize total listings.' },
          {
            id: 'b',
            label:
              'Go narrow (one category or city), seed the harder side yourself so the first participants on the other side find a match, and get that slice liquid before expanding.',
          },
          { id: 'c', label: 'Wait for both sides to organically discover the empty marketplace on their own.' },
        ],
        correctId: 'b',
        why: 'An empty marketplace is useless to both sides, so broad launches spread thin and stay empty everywhere. The proven cold-start play is to narrow to a slice and seed the hard side (usually supply) so even a small marketplace feels full within that niche, establishing liquidity before expanding.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'A marketplace typically earns revenue by keeping a percentage cut of each transaction. What two-word term names that cut?',
        accept: ['take rate', 'take-rate'],
        why: 'The take rate is the cut the marketplace keeps on each transaction. It must be justified by the value the marketplace adds to the match; set too high, participants transact off-platform or leave; too low and the business cannot sustain itself.',
        placeholder: 'two words',
      },
    ],
  },
};
