import type { ConceptLessonContent } from './types';

/**
 * Marketplace track: "Trust & Safety".
 * Trust as the precondition for liquidity, the tools that manufacture it between
 * strangers, and disintermediation (the platform getting cut out of the deal).
 */
export const trackMarketplaceTrust: ConceptLessonContent = {
  skillId: 'track-marketplace-trust',
  hook: 'A marketplace asks two strangers to transact. If either fears getting burned, the match never happens, so trust is not a nice-to-have, it is the thing that makes liquidity possible.',
  framework: 'Trust as the enabler of marketplace transactions; disintermediation risk',
  sections: [
    {
      heading: 'Trust is the precondition for the transaction',
      body: [
        'Every marketplace transaction is an act of trust between people who do not know each other: the buyer trusts the item or service is as described and that payment is safe; the seller trusts they will get paid and not be scammed. If that trust is missing, the transaction does not happen no matter how good your matching is, which means trust gates liquidity. This is why trust and safety is core marketplace product work, not a back-office function. The platform\'s job is to manufacture enough trust between strangers that they are willing to transact, and to keep it by handling the bad actors who would otherwise poison it for everyone.',
      ],
    },
    {
      heading: 'How a platform manufactures trust',
      body: [
        'Trust between strangers is built with concrete product mechanisms, not slogans. The classic toolkit: two-sided ratings and reviews so reputation accrues and bad actors are visible; verification of identity, listings, or quality so participants are who and what they claim; secure payments held by the platform so neither side has to trust the other directly with money; and clear policies with responsive support and dispute resolution when something goes wrong. A guarantee or insurance that makes a participant whole after a bad experience can unlock transactions that fear would otherwise block. Each mechanism substitutes platform-backed trust for the personal trust strangers cannot have, lowering the perceived risk enough that the match converts.',
      ],
      bullets: [
        'Reputation: two-sided ratings and reviews so good behavior compounds and bad behavior shows.',
        'Verification: confirm identity, listings, or quality so claims are credible.',
        'Secure payments and guarantees: the platform stands between the parties and makes wronged users whole.',
      ],
    },
    {
      heading: 'Disintermediation: do not get cut out',
      body: [
        'A structural risk unique to marketplaces is disintermediation: once the platform introduces two parties and trust exists, they may take the relationship off-platform to avoid the take rate, cutting you out of future transactions. A marketplace that only introduces people and adds nothing after is easy to bypass. The defense is to keep adding value inside the platform that is lost by leaving: integrated payments and protection, scheduling and records, the reputation a participant has built and would forfeit, ongoing discovery of new counterparties, and a guarantee that only applies on-platform. The same trust tools that enable the first transaction, when designed well, are also what make staying on the platform worth more than the take rate saved by leaving.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Building trust into a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Two strangers need to transact and neither wants to be burned, so the ${ctx.user} hesitates. Without trust, your matching does not matter.`,
        'You manufacture trust: two-sided reviews build reputation over time, verification confirms claims, and the platform holds payment so neither side risks the other directly.',
        'When something goes wrong, clear policies, responsive support, and a guarantee make the wronged party whole, which unlocks transactions fear would have blocked.',
        'Against disintermediation, you keep value on-platform: protected payments, the reputation they would forfeit by leaving, and a guarantee that only applies if they stay.',
      ],
      takeaway:
        'Manufacture trust with reputation, verification, and protected payments so strangers will transact, and keep adding on-platform value so neither side has reason to take the deal elsewhere.',
    },
  ],
  takeaways: [
    'Trust is the precondition for a marketplace transaction between strangers, so it gates liquidity: trust and safety is core product work, not a back-office function.',
    'Platforms manufacture trust with concrete mechanisms (two-sided reputation, verification, secure payments, dispute resolution, guarantees) that substitute platform trust for personal trust.',
    'Disintermediation (parties going off-platform once trust exists) is a structural risk; defend it by keeping enough value inside the platform that leaving costs more than the take rate saved.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Why is trust and safety considered core product work for a marketplace rather than a back-office concern?',
        options: [
          { id: 'a', label: 'Because regulators require every marketplace to have a trust team.' },
          {
            id: 'b',
            label:
              'Because a transaction is an act of trust between strangers; if either party fears being burned the match never converts, so trust directly gates liquidity, the marketplace\'s core metric.',
          },
          { id: 'c', label: 'Because trust features are the cheapest things to build.' },
        ],
        correctId: 'b',
        why: 'Marketplaces ask people who do not know each other to transact. Without enough trust, even a perfect match does not convert, so trust is upstream of liquidity. Manufacturing and protecting trust between strangers is therefore central marketplace product work, not a support afterthought.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A marketplace notices that once it introduces a buyer and seller, they often complete future deals directly and stop paying the take rate. What is this risk called, and what is the right defense?',
        options: [
          { id: 'a', label: 'Churn; the defense is to lower prices until they stay.' },
          {
            id: 'b',
            label:
              'Disintermediation; the defense is to keep adding on-platform value (protected payments, reputation they would forfeit, ongoing discovery, a guarantee) so staying is worth more than the take rate saved by leaving.',
          },
          { id: 'c', label: 'Liquidity collapse; the defense is to add more listings.' },
        ],
        correctId: 'b',
        why: 'Disintermediation is the structural marketplace risk of parties taking the relationship off-platform once trust exists. A marketplace that only introduces people is easy to bypass. The defense is continuing value inside the platform (payments, protection, forfeited reputation, discovery) that exceeds the take rate a participant would save by leaving.',
      },
    ],
  },
};
