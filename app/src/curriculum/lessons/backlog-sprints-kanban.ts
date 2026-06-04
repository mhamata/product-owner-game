import type { ConceptLessonContent } from './types';

/**
 * Associate PM · Running the Backlog: "Backlog, Sprints & Kanban".
 * The backlog as an ordered list; Scrum sprints vs Kanban flow; refinement and
 * WIP limits.
 */
export const backlogSprintsKanban: ConceptLessonContent = {
  skillId: 'backlog-sprints-kanban',
  hook: 'A backlog is a prioritized list of what might be built, and how you pull work off it (sprints or flow) shapes how your team operates.',
  framework: 'Scrum · Kanban · WIP limits',
  sections: [
    {
      heading: 'The backlog is ordered, not a pile',
      body: [
        'The product backlog is the single source of truth for everything the team might build: features, fixes, improvements. The critical word is ordered: it’s a ranked list, top to bottom, not an undifferentiated dump of tickets. The top should be refined and ready; the bottom can stay rough. A backlog where everything is "high priority" is a backlog with no priorities at all.',
      ],
    },
    {
      heading: 'Refinement keeps the top ready',
      body: [
        'Backlog refinement (or grooming) is the ongoing work of keeping the top of the backlog clear: splitting items that are too big, adding acceptance criteria, clarifying intent, and re-ordering as you learn. The goal is that when the team is ready to pull the next item, it’s already understood and right-sized, so planning isn’t a scramble. Refinement is continuous, a little at a time, not a once-a-quarter cleanup.',
      ],
    },
    {
      heading: 'Two ways to pull the work: Scrum vs Kanban',
      body: [
        'Scrum batches work into fixed-length sprints: the team commits to a set of items and protects that scope until the sprint ends. It suits work that benefits from a cadence and a planning rhythm. Kanban instead visualizes work on a board and flows it continuously: there’s no sprint boundary; you pull the next item when capacity frees up. It suits unpredictable, interrupt-driven work like support or ops.',
        'The choice isn’t about which is "more agile"; it’s about whether your work fits a planned cadence (Scrum) or a continuous stream (Kanban). Many teams blend the two.',
      ],
      bullets: [
        'Scrum: time-boxed sprints, a committed scope, planning and review on a cadence.',
        'Kanban: continuous flow, a visual board, pull the next item when ready.',
      ],
    },
    {
      heading: 'WIP limits: the counter-intuitive lever',
      body: [
        'Kanban’s signature tool is the work-in-progress (WIP) limit: a cap on how many items can be in a given stage at once. It feels backwards (limiting work to go faster) but it works. Too much in flight means constant context-switching, half-finished work, and nothing actually shipping. Capping WIP forces the team to finish before starting, which improves flow and surfaces bottlenecks (whichever stage fills up first is your constraint).',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Choosing a model for two ${ctx.product} teams`,
      lines: [
        (ctx) =>
          `The core feature team works toward planned outcomes for the ${ctx.product}; a two-week sprint with a protected scope gives them a steady rhythm. Scrum fits.`,
        (ctx) =>
          `The platform/support team handles unpredictable incidents and ${ctx.user} escalations; a sprint commitment would shatter on day two. A Kanban board with WIP limits fits.`,
        'On the Kanban board, "In Progress" is capped at three. When it’s full, no one starts new work; they help finish what’s stuck, which is usually waiting on review.',
      ],
      takeaway:
        'Match the model to the work: cadence-friendly work suits sprints; interrupt-driven work suits Kanban flow with WIP limits.',
    },
  ],
  takeaways: [
    'A backlog is an ordered, ranked list; refinement keeps the top right-sized and ready so planning isn’t a scramble.',
    'Scrum pulls work in fixed sprints with committed scope; Kanban flows work continuously off a visual board.',
    'WIP limits cap how much is in progress at once; finishing before starting improves flow and exposes bottlenecks.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt: 'What most fundamentally distinguishes a product backlog from a simple to-do list?',
        options: [
          { id: 'a', label: 'A backlog can only contain bugs, not features.' },
          { id: 'b', label: 'A backlog is explicitly ordered by priority, top to bottom.' },
          { id: 'c', label: 'A backlog must be finished within a single sprint.' },
        ],
        correctId: 'b',
        why: 'The defining property of a backlog is that it is a ranked, ordered list. The order is the prioritization decision; a list where everything is equally urgent isn’t really a backlog.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A team keeps starting new tasks before finishing old ones, and lots of work sits half-done. Which Kanban practice directly targets this?',
        options: [
          { id: 'a', label: 'Longer sprints.' },
          { id: 'b', label: 'A work-in-progress (WIP) limit that caps items in a stage at once.' },
          { id: 'c', label: 'Adding more items to the backlog.' },
        ],
        correctId: 'b',
        why: 'WIP limits cap how much can be in progress simultaneously, forcing the team to finish work before pulling new work. That reduces context-switching and makes the bottleneck visible.',
      },
      {
        kind: 'choice',
        id: 'q3',
        prompt:
          'A team’s work is unpredictable and interrupt-driven (incidents, escalations), making any sprint commitment fall apart. Which model fits best?',
        options: [
          { id: 'a', label: 'Scrum, with strictly enforced two-week sprints.' },
          { id: 'b', label: 'Kanban, with continuous flow and WIP limits.' },
          { id: 'c', label: 'No process at all.' },
        ],
        correctId: 'b',
        why: 'Continuous, interrupt-driven work suits Kanban: there’s no sprint boundary to protect, work flows as it arrives, and WIP limits keep it manageable. Forcing a sprint commitment onto unpredictable work just breaks the commitment.',
      },
    ],
  },
};
