import type { ConceptLessonContent } from './types';

/**
 * Foundations · Working in a Team: "Agile & Scrum Basics".
 * Sprints, backlog, ceremonies, and the common anti-patterns.
 */
export const agileScrum: ConceptLessonContent = {
  skillId: 'agile-scrum',
  hook: 'Agile is a set of values for shipping in small loops; Scrum is one popular way to run those loops.',
  framework: 'The Agile Manifesto · the Scrum framework',
  sections: [
    {
      heading: 'Agile is the values; Scrum is a framework',
      body: [
        'Agile is a mindset, captured in the 2001 Manifesto: favour individuals and interactions over processes and tools, working software over documentation, customer collaboration over contract negotiation, and responding to change over following a plan. The thread through all of it is short feedback loops: ship something small, learn, adjust.',
        'Scrum is the most common concrete framework for working that way. It’s a set of roles, events, and artifacts on a fixed cadence. Scrum is not Agile itself: a team can "do Scrum" by the book and still be rigid and waterfall in spirit.',
      ],
    },
    {
      heading: 'The moving parts',
      body: [
        'Scrum runs in fixed-length iterations called sprints (usually one to two weeks). The product backlog is the single, ordered list of everything that might be built; the team pulls the top items into a sprint backlog to commit to for that sprint.',
      ],
      bullets: [
        'Sprint planning: the team selects what it will build this sprint, and why.',
        'Daily standup: a short daily sync to surface progress and blockers (not a status report to a manager).',
        'Sprint review: show the working increment to stakeholders and gather feedback.',
        'Retrospective: the team reflects on how it worked and picks one or two improvements.',
        'Backlog refinement: ongoing grooming so the top of the backlog is clear and ready.',
      ],
    },
    {
      heading: 'The anti-patterns',
      body: [
        'Most of the value is in avoiding the ways teams quietly turn the ceremonies into theatre. The framework only helps if the loops actually produce learning and the team actually owns its work.',
      ],
      bullets: [
        'Standup as status theatre: reporting up to a manager instead of unblocking each other.',
        'Scope creep mid-sprint: letting the committed sprint goal get stretched until it never finishes.',
        'Velocity as a target: gaming story points instead of using them to forecast; velocity is a measure, not a goal.',
        'Skipping retros: the loop that improves the loops is the first to get cut, and the one you can least afford to lose.',
        '"Agile" as a feature factory: fast output, no outcomes; a faster way to ship the wrong things.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `A healthy sprint on a ${ctx.product} team`,
      lines: [
        'Monday: planning. The team commits to a clear sprint goal (improve first-week retention) and pulls only what fits.',
        'Daily: a five-minute standup where two engineers realize they’re blocked on the same API and pair to clear it, not a round of status updates.',
        (ctx) =>
          `End of sprint: review with stakeholders on a real working build; a ${ctx.user}-facing change is demoed, not described.`,
        'Retro: the team notices estimates slipped because tickets were vague, and agrees to refine the backlog earlier next time.',
      ],
      takeaway:
        'The ceremonies earn their keep only when they create learning and unblock the team. Otherwise they’re overhead.',
    },
  ],
  takeaways: [
    'Agile is the values (short feedback loops, responding to change); Scrum is one framework that implements them.',
    'The core loop: an ordered product backlog feeds fixed-length sprints, bracketed by planning, standup, review, and retro.',
    'Watch the anti-patterns: standup-as-status, mid-sprint scope creep, velocity-as-target, skipped retros, and "agile" feature factories.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt: 'Which statement best captures the relationship between Agile and Scrum?',
        options: [
          { id: 'a', label: 'They are the same thing: "Agile" and "Scrum" are interchangeable.' },
          {
            id: 'b',
            label:
              'Agile is a mindset of short feedback loops; Scrum is one concrete framework for working that way.',
          },
          { id: 'c', label: 'Scrum is the philosophy; Agile is the specific ceremonies.' },
        ],
        correctId: 'b',
        why: 'Agile is the underlying set of values (the Manifesto). Scrum is a specific framework of roles, events, and artifacts. A team can follow Scrum mechanically while violating the Agile mindset.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A manager turns the daily standup into a round where each engineer reports their status to them. Which anti-pattern is this?',
        options: [
          {
            id: 'a',
            label: 'Standup as status theatre: reporting up instead of unblocking each other.',
          },
          { id: 'b', label: 'Velocity as a target.' },
          { id: 'c', label: 'Scope creep.' },
        ],
        correctId: 'a',
        why: 'The standup exists for the team to coordinate and surface blockers among themselves. Turning it into a status report to a manager is the classic "status theatre" anti-pattern: the form survives but the purpose is lost.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'What is the fixed-length iteration in Scrum called, in which the team commits to a set of work?',
        accept: ['sprint', 'a sprint', 'the sprint'],
        why: 'A sprint is the fixed-length iteration (typically one to two weeks) that the Scrum cadence is built around.',
        placeholder: 'one word',
      },
    ],
  },
};
