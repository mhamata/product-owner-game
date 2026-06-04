import type { ConceptLessonContent } from './types';

/**
 * Director / VP · Leading Teams: "Org Design".
 * How to slice teams so each owns a durable problem space, why Conway's Law
 * means org shape becomes product shape, and the topology vocabulary
 * (Skelton & Pais, Team Topologies).
 */
export const orgDesign: ConceptLessonContent = {
  skillId: 'org-design',
  hook: 'How you draw the team boundaries decides what your product can become: the org chart ships, too.',
  framework: 'Conway’s Law · Skelton & Pais · Team Topologies',
  sections: [
    {
      heading: 'Conway’s Law: the org ships the architecture',
      body: [
        'Conway’s Law observes that systems end up mirroring the communication structure of the organization that builds them. Two teams that rarely talk will build two loosely-joined components with an awkward seam between them; one team that owns a flow end-to-end tends to build it coherently. This is not a tendency to fight. It is a force to use. The "inverse Conway maneuver" means designing the team boundaries you want, so the architecture you want follows.',
        'For a product leader the implication is blunt: org design is product design done one level up. Before debating a re-org, ask what architecture and what customer experience you are implicitly choosing by drawing the lines where you are drawing them.',
      ],
    },
    {
      heading: 'Slice by problem space, not by project or function',
      body: [
        'The durable way to carve teams is around a stable problem space or customer journey the team can own for years: onboarding, payments, the seller experience, not around a temporary project or a technology layer. Problem-space ownership lets a team build deep context, hold an outcome, and live with the consequences of its own decisions. Project-shaped teams disband and lose that context; layer-shaped teams (a "frontend team," a "backend team") force every customer-facing change to cross several teams.',
      ],
      bullets: [
        'Durable ownership: a team keeps its slice long enough to compound learning and feel its own results.',
        'Aligned to value: boundaries follow the customer journey, so an outcome lives inside one team.',
        'Low coordination cost: most changes ship within a team, not across three.',
        'Clear accountability: when a metric moves, it is obvious whose problem it was.',
      ],
    },
    {
      heading: 'A vocabulary for team types',
      body: [
        'Team Topologies (Skelton & Pais) gives leaders four useful team types. A stream-aligned team owns a slice of the customer journey end-to-end: most teams should be this. A platform team builds internal tooling that makes the stream-aligned teams faster (its customers are other teams). An enabling team coaches others through a capability gap, then leaves. A complicated-subsystem team owns a piece needing rare, deep expertise. The art is keeping the platform and enabling teams genuinely in service of the stream-aligned ones, not turning them into gatekeepers every change must queue behind.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Re-slicing the ${ctx.product} org`,
      lines: [
        (ctx) =>
          `The ${ctx.product} is split into a "frontend team" and a "backend team." Every meaningful ${ctx.user} change (even a small one) needs both, so nothing ships without a cross-team negotiation.`,
        'Symptoms follow Conway’s Law: a brittle API seam between the two, slow delivery, and no single team accountable for any customer outcome.',
        (ctx) =>
          `Leadership re-slices into stream-aligned teams by journey: Acquisition, Activation, Retention, each owning its ${ctx.user} experience full-stack and a metric to move.`,
        'A small platform team is spun up to own shared auth and design-system plumbing, explicitly in service of the stream teams’ speed, not as a gate they must pass through.',
      ],
      takeaway:
        'Cutting teams along the customer journey instead of the tech stack puts each outcome inside one team, and the cleaner architecture follows the cleaner org.',
    },
  ],
  takeaways: [
    'Conway’s Law: systems mirror the org that builds them, so designing team boundaries is designing the architecture (use the inverse Conway maneuver deliberately).',
    'Slice teams around durable problem spaces or customer journeys, not temporary projects or technology layers.',
    'Team Topologies names four types: stream-aligned (the default), platform, enabling, complicated-subsystem, and the support teams must serve the stream teams, not gate them.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A leader notices a brittle, awkward integration exactly at the boundary between two teams that almost never communicate. Which principle best explains this?',
        options: [
          { id: 'a', label: 'The teams simply hired weaker engineers.' },
          {
            id: 'b',
            label:
              'Conway’s Law: the system’s structure mirrors the communication structure of the org that built it.',
          },
          { id: 'c', label: 'The architecture was chosen first and the org happened to follow it by coincidence.' },
        ],
        correctId: 'b',
        why: 'Conway’s Law predicts exactly this: a weak communication path between two teams produces a weak, awkward seam in the software. The leadership move is to redraw the team boundaries to get the architecture you actually want.',
      },
      {
        kind: 'fill',
        id: 'q2',
        prompt:
          'In Team Topologies, what is the name of the team type that owns a slice of the customer journey end-to-end and should be the default, most common type?',
        accept: ['stream-aligned', 'stream aligned', 'stream-aligned team', 'stream aligned team'],
        why: 'Stream-aligned teams own a flow of value end-to-end and are meant to be the majority of teams. Platform, enabling, and complicated-subsystem teams exist mainly to make the stream-aligned teams faster.',
        placeholder: 'team type',
      },
    ],
  },
};
