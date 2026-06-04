import type { ConceptLessonContent } from './types';

/**
 * Zero-to-One track: "The First Wedge".
 * Winning a narrow beachhead completely before expanding, why a niche you
 * dominate beats a broad market you dabble in, and earning the right to scale.
 */
export const trackFirstWedge: ConceptLessonContent = {
  skillId: 'track-first-wedge',
  hook: 'You do not win a big market by aiming at all of it. You win a tiny slice so completely that it becomes the launchpad for the next one.',
  framework: 'The beachhead / wedge strategy (Crossing the Chasm, Geoffrey Moore)',
  sections: [
    {
      heading: 'Start with a wedge, not the whole market',
      body: [
        'A wedge (or beachhead) is the narrow first market you go after: a specific segment with an acute version of the problem, small enough that you can actually dominate it with limited resources. The counterintuitive truth of zero-to-one is that a narrow, intense need beats a broad, shallow one. Aiming at the whole market spreads a small team thin and produces a product that is mediocre for everyone and essential for no one. Picking one sharp segment lets you build something so good for them that they love it, refer others, and give you the dense early adoption a brand-new product needs. The size of the eventual market does not change the wedge; you still have to win a beachhead first.',
      ],
    },
    {
      heading: 'Dominate the niche before you expand',
      body: [
        'The wedge only works if you actually take it: become the obvious best choice for that one segment, not a tied option among many. Domination gives you reference customers, word of mouth inside a tight community, a product hardened by real use, and the credibility to move next door. Then you expand deliberately into adjacent segments, each a short step from the last, carrying your momentum forward, the way a beachhead lets an army move inland. Trying to grab the broad market before you own the niche is the classic failure: you abandon the slice that was working to chase one you have not earned, and end up owning neither.',
      ],
      bullets: [
        'Win the wedge completely: be the clear best choice for one segment, not a runner-up for many.',
        'Bank the assets: references, word of mouth, a hardened product, credibility to expand.',
        'Expand to adjacent segments deliberately, one short step at a time.',
      ],
    },
    {
      heading: 'A wedge is not scaling: earn the right to grow',
      body: [
        'The wedge is a zero-to-one move, and it demands the search mindset, not the scaling one. You are still finding what works for this segment, so you stay close to users and adapt, rather than locking a roadmap and forecasting growth as if fit were settled. The mistake is switching on the scaling playbook (pour on acquisition, expand the surface area, project a hockey stick) before the wedge is truly won, which buries a still-unproven product under premature growth. Win the beachhead first, confirm the pull is real there, and only then turn to scaling. Scaling amplifies whatever you have: applied to a won wedge it compounds, applied to an unwon one it just spends faster.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Choosing the first wedge for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `The temptation is to launch the ${ctx.product} for every kind of ${ctx.user} at once, which spreads your small team thin and wins no one.`,
        'Instead you pick one narrow segment with an acute version of the problem, small enough that you can be the clear best choice for them.',
        'You dominate that slice: they love it, refer others in their tight community, and the product hardens on real use, earning you references and credibility.',
        'Only after the wedge is genuinely won do you expand to an adjacent segment and turn up acquisition, because scaling a won wedge compounds while scaling an unwon one just burns cash.',
      ],
      takeaway:
        'Pick one narrow beachhead, win it so completely that it becomes a launchpad, and expand to adjacent segments only after the wedge is proven, not before.',
    },
  ],
  takeaways: [
    'Start with a wedge (a narrow beachhead segment with an acute need) you can dominate, because a niche you own beats a broad market you dabble in for a brand-new product.',
    'Win the niche completely first: domination banks references, word of mouth, a hardened product, and the credibility to expand deliberately into adjacent segments one step at a time.',
    'A wedge is a zero-to-one search move, not scaling: confirm real pull in the beachhead before turning on the growth playbook, since scaling amplifies whatever you already have.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A new product is aimed at a huge market. Why do experienced zero-to-one PMs still insist on starting with a narrow wedge (beachhead) segment?',
        options: [
          { id: 'a', label: 'Because small markets are inherently more profitable than large ones.' },
          {
            id: 'b',
            label:
              'A small team aimed at the whole market builds something mediocre for everyone and essential for no one; winning one sharp segment lets you be its clear best choice and earn the dense early adoption, references, and momentum a new product needs.',
          },
          { id: 'c', label: 'Because targeting a large market is against the rules of product strategy.' },
        ],
        correctId: 'b',
        why: 'A narrow, intense need beats a broad, shallow one for a new product. Aiming everywhere spreads a small team thin into a product no one loves. Dominating one beachhead produces passionate users, word of mouth in a tight community, and the credibility to expand, which is the launchpad the eventual large market is reached through.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A startup is starting to win its narrow first segment, then abruptly pivots to chase the entire broad market and ramps up acquisition spend. What is the risk?',
        options: [
          { id: 'a', label: 'No risk; broadening early always accelerates growth.' },
          {
            id: 'b',
            label:
              'It abandons the slice that was working to chase one it has not earned, switching on the scaling playbook before the wedge is won, which buries a still-unproven product under premature growth and can leave it owning neither market.',
          },
          { id: 'c', label: 'The only risk is that competitors copy the broad strategy.' },
        ],
        correctId: 'b',
        why: 'The wedge is a search move: you win the beachhead completely, then expand to adjacent segments deliberately. Turning on scaling (broad acquisition, a hockey-stick forecast) before the wedge is truly won amplifies an unproven product, spends faster without compounding, and risks losing the niche that was working without capturing the broad market.',
      },
    ],
  },
};
