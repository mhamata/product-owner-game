import type { ConceptLessonContent } from './types';

/**
 * Monetization track: "Packaging & Tiers".
 * Packaging as a distinct lever from price, the good-better-best tier structure,
 * and fencing features so each segment self-selects into the right offer.
 */
export const trackPackagingTiers: ConceptLessonContent = {
  skillId: 'track-packaging-tiers',
  hook: 'Same product, same price, very different revenue depending on how you bundle it. Packaging is the lever most teams underuse, and it is separate from the number.',
  framework: 'Packaging and good-better-best tiering; feature fencing for self-selection',
  sections: [
    {
      heading: 'Packaging is its own lever',
      body: [
        'Packaging is how you bundle capabilities into offers: what goes in Free versus Pro versus Enterprise, what is a paid add-on, what is included. It is a separate decision from the price metric (the unit you charge by) and from the price itself. Teams often collapse all three into one argument about a dollar figure and never deliberately design the bundles, which leaves a lot of value uncaptured. Good packaging means a customer can find an offer that fits their needs and budget, and the structure nudges them toward paying for what they value. It is the lever that lets one product serve a solo user and a large enterprise without two separate products.',
      ],
    },
    {
      heading: 'Good-better-best: a tier for each segment',
      body: [
        'The most common structure is a small ladder of tiers, often three: a good entry tier, a better mainstream tier, and a best premium tier. Each tier targets a segment with different needs and willingness to pay. The point of multiple tiers is not to confuse, it is to let customers self-select into the offer that matches the value they get, so a small customer is not priced out and a large one is not underpaying. Keep the ladder short and the differences legible; too many tiers or murky distinctions cause decision paralysis and erode trust. A free tier or trial, when it fits, exists to prove value and feed the upgrade path, not to be the destination.',
      ],
      bullets: [
        'Good: an entry offer for the price-sensitive or small segment.',
        'Better: the mainstream tier most customers land on.',
        'Best: a premium tier for the high-value, high-WTP segment.',
      ],
    },
    {
      heading: 'Fencing: put the right features in the right tier',
      body: [
        'A fence is a feature or limit you use to separate the tiers so customers naturally sort themselves. The art is choosing fences that map to who values what, not arbitrary gates. Capabilities that matter most to large or sophisticated customers (advanced controls, higher limits, security and admin features, integrations) belong higher up, because that is what those segments will pay for; the basics that everyone needs go lower so the entry tier is genuinely useful. Bad fencing crippling the cheap tier so it is useless, or putting a must-have for small users behind the top tier pushes customers away or breeds resentment. Good fencing feels fair: each tier is complete for who it is meant for, and the upgrade reason is real value, not a hostage feature.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Designing tiers for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `You stop arguing only about the price and design the bundles: a Free tier to prove value, Pro for the everyday ${ctx.user}, and Enterprise for large organizations.`,
        'Good-better-best maps to segments: Free for the curious, Pro for the mainstream team, Enterprise for the high-WTP buyer.',
        'Fencing by value: everyday features stay in Pro so it is genuinely useful, while advanced controls, higher limits, and admin and security features fence off Enterprise.',
        'You keep it to three legible tiers, so customers self-select instead of freezing in front of ten confusing options.',
      ],
      takeaway:
        'Design the bundles deliberately, use a short good-better-best ladder aimed at real segments, and fence with features each segment actually values so customers self-select.',
    },
  ],
  takeaways: [
    'Packaging (how you bundle capabilities into offers) is a distinct lever from the price metric and the price itself, and it is the one teams most often leave on the table.',
    'A short good-better-best tier ladder lets customers self-select into the offer matching their value and budget; keep it legible, since too many murky tiers cause paralysis.',
    'Fence tiers with features that map to who values what (advanced and admin features higher up, essentials lower): good fencing feels fair, with each tier complete for its segment.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'What is "packaging" in the context of monetization, and why treat it as its own decision?',
        options: [
          { id: 'a', label: 'The physical box and branding the product ships in.' },
          {
            id: 'b',
            label:
              'How you bundle capabilities into offers (what goes in Free vs Pro vs Enterprise, what is an add-on); it is a separate lever from the price metric and the price, and designing it deliberately captures value most teams leave on the table.',
          },
          { id: 'c', label: 'The order in which features are released over time.' },
        ],
        correctId: 'b',
        why: 'Packaging is the bundling decision: which capabilities live in which offer. It is distinct from the unit you charge by and the dollar amount. Teams that collapse all three into one price argument never design the bundles, which is exactly where a lot of capturable value is lost.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'When deciding which features go in which tier (fencing), what makes a fence good rather than resentment-inducing?',
        options: [
          { id: 'a', label: 'Putting as many features as possible behind the top tier to maximize upgrades.' },
          {
            id: 'b',
            label:
              'Fencing on features that map to who values what, so each tier is genuinely complete for its segment and the reason to upgrade is real added value rather than a withheld must-have.',
          },
          { id: 'c', label: 'Randomly distributing features so customers cannot predict the tiers.' },
        ],
        correctId: 'b',
        why: 'Good fencing aligns the gate with value: advanced and admin capabilities (what large or sophisticated customers pay for) sit higher, while essentials stay low so the entry tier is useful. Crippling the cheap tier or hiding a must-have behind the top tier pushes customers away and breeds resentment.',
      },
    ],
  },
};
