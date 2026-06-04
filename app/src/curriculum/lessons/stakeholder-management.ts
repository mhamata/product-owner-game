import type { ConceptLessonContent } from './types';

/**
 * Senior · Influence: "Stakeholder Management".
 * Mapping stakeholders, clarifying decision rights with RACI, and reconciling
 * divergent agendas without letting the loudest voice set the roadmap.
 */
export const stakeholderManagement: ConceptLessonContent = {
  skillId: 'stakeholder-management',
  hook: 'Most roadmap chaos isn’t a strategy problem. It’s an unmanaged-stakeholder problem: too many people who think it’s their call.',
  framework: 'RACI · Stakeholder mapping (power/interest)',
  sections: [
    {
      heading: 'Map before you manage',
      body: [
        'A stakeholder is anyone affected by your product or who can affect it: sales, support, legal, finance, a partner team, an executive sponsor. Before managing them, map them. A simple power/interest read works: who has the authority to block or fund this, and who cares deeply about the outcome? High-power, high-interest people need to be partnered with closely; high-power, low-interest ones need to be kept satisfied and unsurprised; the rest are kept informed. The mistake is treating every stakeholder identically: over-investing in the indifferent and under-investing in the one who can sink the launch.',
      ],
    },
    {
      heading: 'RACI: who actually decides',
      body: [
        'Conflict often comes from unclear decision rights, not disagreement about the answer. RACI names four roles per decision. Responsible: does the work. Accountable: owns the outcome and makes the final call; there is exactly one. Consulted: gives input before the decision (two-way). Informed: told after (one-way). The discipline is forcing a single Accountable. When two people both believe they’re accountable for a call, you don’t have a debate, you have a standoff, and naming the one A resolves it before it festers.',
      ],
      bullets: [
        'Responsible: does the actual work.',
        'Accountable: owns it and decides; exactly one person.',
        'Consulted: gives input before the call (two-way).',
        'Informed: kept in the loop after (one-way).',
      ],
    },
    {
      heading: 'Reconciling divergent agendas',
      body: [
        'Stakeholders pull in different directions because they’re measured on different things: sales wants the deal-closing feature, support wants the bug backlog, finance wants margin. None are wrong. They’re local optima. Your job is to surface the underlying interest behind each position (sales doesn’t want that exact feature; they want to hit quota), then arbitrate against the shared product strategy and outcomes rather than against who pushed hardest. "Loudest wins" is how a roadmap becomes a feature factory. Anchor every trade-off to the strategic intent so the decision is defensible and the same to everyone’s face as behind their back.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Untangling a contested ${ctx.product} decision`,
      lines: [
        (ctx) =>
          `Sales, support, and a partner team each demand a different next feature for the ${ctx.product}; each escalates to the VP.`,
        'Map it: the VP is Accountable, you’re Responsible, the three teams are Consulted. Naming one A ends the "whose call is this?" standoff.',
        (ctx) =>
          `Dig past positions to interests: sales wants quota, support wants fewer tickets, the partner wants their ${ctx.user}s unblocked.`,
        'Arbitrate against the strategy: this quarter’s intent is retention, so the ticket-reducing fix wins, and you tell sales that to their face.',
      ],
      takeaway:
        'Name one accountable owner, translate positions into interests, and settle trade-offs against the strategy, not against who shouted loudest.',
    },
  ],
  takeaways: [
    'Map stakeholders by power and interest first; partner closely with high-power/high-interest, keep high-power/low-interest satisfied, inform the rest.',
    'RACI clarifies decision rights: Responsible, Accountable (exactly one), Consulted, Informed, and the single Accountable owner ends standoffs.',
    'Divergent agendas are competing local optima; surface the interest behind each position and arbitrate against the product strategy, not volume.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Two senior leaders each believe they have the final say on a launch decision, and the team is stuck. Which RACI principle most directly resolves this?',
        options: [
          { id: 'a', label: 'Add more people to the Consulted list so there’s broader input.' },
          {
            id: 'b',
            label:
              'There must be exactly one Accountable person for the decision; naming who holds the A ends the standoff over who decides.',
          },
          { id: 'c', label: 'Make both leaders Responsible so they share the workload.' },
        ],
        correctId: 'b',
        why: 'RACI permits many people to be Responsible, Consulted, or Informed, but the Accountable role is singular by design. The conflict is a decision-rights problem; explicitly assigning one A is what unblocks it.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Sales insists on Feature X to close deals; support insists on the bug backlog. What’s the most effective way for a PM to reconcile them?',
        options: [
          { id: 'a', label: 'Build whichever one is demanded by the more senior or louder stakeholder.' },
          {
            id: 'b',
            label:
              'Surface the underlying interest behind each position, then arbitrate against the product strategy and the outcome it targets, not against who pushed hardest.',
          },
          { id: 'c', label: 'Split the team and attempt both at once to keep everyone happy.' },
        ],
        correctId: 'b',
        why: 'Each stakeholder is optimizing a local metric. Translating positions into interests and deciding against the shared strategy keeps the roadmap coherent and the decision defensible, rather than letting volume or rank set priorities.',
      },
    ],
  },
};
