import type { ConceptLessonContent } from './types';

/**
 * B2B / B2C track: "B2B Motion".
 * The buyer is not the user, the sales-led go-to-market that follows, and the
 * non-negotiable enterprise requirements (security, admin, SSO, compliance).
 */
export const trackB2bMotion: ConceptLessonContent = {
  skillId: 'track-b2b-motion',
  hook: 'In B2B, the person who pays is usually not the person who uses. Miss that, and you build a product users love and buyers will not approve.',
  framework: 'B2B product strategy: buyer-vs-user, sales-led go-to-market, enterprise readiness',
  sections: [
    {
      heading: 'The buyer is not the user',
      body: [
        'The defining feature of B2B is that the buyer and the user are often different people with different goals. The user wants the daily job to be easy; the economic buyer (a manager, a director, IT, procurement) cares about ROI, risk, security, and how it fits the rest of their stack. A purchase can involve a whole committee of these stakeholders, each able to say no. So a B2B PM has to satisfy two audiences at once: build something users genuinely want to use, and give the buyer the business case, controls, and assurances they need to sign. Optimizing only for the end user produces a beloved tool that never clears procurement; optimizing only for the buyer produces shelfware nobody opens.',
      ],
      bullets: [
        'User: wants the daily workflow to be fast and pleasant.',
        'Economic buyer: wants ROI, low risk, security, and fit with existing systems.',
        'Other gatekeepers: IT, security, procurement, finance, each a potential veto.',
      ],
    },
    {
      heading: 'Sales-led go-to-market',
      body: [
        'When deals are large, considered, and involve multiple stakeholders, the motion is typically sales-led: a salesperson guides the buyer through evaluation, a pilot or proof-of-concept, procurement, and a contract, with longer cycles and higher prices per deal. This shapes the product, not just the org chart. The product has to support the sale: demo environments, pilots that prove value to a committee, security reviews, and onboarding for a whole organization rather than one signup. The PM works hand in glove with sales and customer success, because the deal does not close at "I like it," it closes when the buyer\'s risks are answered and the rollout is credible.',
      ],
    },
    {
      heading: 'Enterprise readiness is table stakes',
      body: [
        'To sell to larger organizations, certain capabilities are not features you prioritize against roadmap, they are entry requirements that gate the deal entirely. The usual list: single sign-on (SSO) so the company manages access through its own identity provider; role-based access and admin controls so an administrator governs who can do what; audit logs and data controls; security and compliance posture (and often certifications); and provisioning to add and remove users at scale. A team can have the best product in the category and still lose every enterprise deal because it lacks SSO or cannot pass a security review. Knowing which requirements are deal-blockers for your target segment, and when to invest in them, is core B2B judgment.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Selling a ${ctx.product} into a large organization`,
      lines: [
        (ctx) =>
          `The daily ${ctx.user}s love the product, but the buyer is their director, who asks about ROI, security, and how it fits the existing stack.`,
        'Because the deal is large and multi-stakeholder, the motion is sales-led: a pilot to prove value to a committee, a security review, then procurement and a contract.',
        'During the security review, the deal stalls: there is no SSO and no admin role controls. Those are not nice-to-haves, they are deal-blockers.',
        (ctx) =>
          `You prioritize SSO, admin controls, and audit logs, because no amount of ${ctx.user} love closes the deal until the buyer\'s requirements are met.`,
      ],
      takeaway:
        'Win the user and the buyer at once, support a sales-led motion with pilots and reviews, and treat enterprise requirements like SSO and admin controls as deal-blocking entry requirements.',
    },
  ],
  takeaways: [
    'In B2B the buyer is often not the user: satisfy both the user (great workflow) and the economic buyer and gatekeepers (ROI, risk, security, fit), since either can kill a deal.',
    'Large, considered, multi-stakeholder deals run a sales-led motion (pilots, security reviews, procurement), which shapes the product (demos, org-wide onboarding), not just the org chart.',
    'Enterprise requirements (SSO, role-based admin controls, audit logs, security and compliance) are deal-blocking entry requirements, not roadmap niceties; know which gate your segment.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'What is the single most important structural difference a PM must account for when moving from B2C to B2B?',
        options: [
          { id: 'a', label: 'B2B products are always more technically complex than B2C ones.' },
          {
            id: 'b',
            label:
              'The buyer is frequently not the user: the person who pays (and the committee of gatekeepers) has different goals (ROI, risk, security, fit) from the person who uses it daily, so you must satisfy both.',
          },
          { id: 'c', label: 'B2B products do not need to be easy to use because they are mandatory.' },
        ],
        correctId: 'b',
        why: 'The defining B2B trait is the split between buyer and user. The user wants an easy workflow; the economic buyer and gatekeepers (IT, security, procurement) care about ROI, risk, and fit, and any of them can veto. Serving only one audience yields either shelfware or a beloved tool that never clears procurement.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A B2B team has the best-loved product in its category among end users but keeps losing enterprise deals during security review because it lacks single sign-on (SSO) and admin role controls. How should it treat these capabilities?',
        options: [
          { id: 'a', label: 'As low-priority polish, since users already love the product without them.' },
          {
            id: 'b',
            label:
              'As deal-blocking entry requirements for the target segment: without them the deal cannot close regardless of how much users love the product, so they must be prioritized to compete at all.',
          },
          { id: 'c', label: 'As features to build only after a customer has already signed.' },
        ],
        correctId: 'b',
        why: 'Enterprise requirements like SSO, admin controls, audit logs, and security posture gate the deal entirely for larger organizations. They are not roadmap niceties weighed against other features; lacking a deal-blocker means losing every deal in that segment no matter how strong the core product is.',
      },
    ],
  },
};
