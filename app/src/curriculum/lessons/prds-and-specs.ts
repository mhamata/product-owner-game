import type { ConceptLessonContent } from './types';

/**
 * Associate PM · Writing It Down — "PRDs & Specs".
 * What a good product requirements document contains, and why.
 */
export const prdsAndSpecs: ConceptLessonContent = {
  skillId: 'prds-and-specs',
  hook: 'A PRD’s job is to align a team on the problem and the bar for done — not to dictate the solution in pixel-perfect detail.',
  sections: [
    {
      heading: 'What a PRD is for',
      body: [
        'A product requirements document (PRD) is the shared reference that gets a team building the right thing. Its real purpose is alignment: when engineering, design, QA, and stakeholders read it, they should come away with the same understanding of why this matters, who it’s for, and how we’ll know it worked.',
        'Modern PRDs are lean and living. The old "throw a 40-page spec over the wall" approach fails because it pretends every detail can be known up front. A good PRD frames the problem and the outcome clearly, then leaves room for the trio to figure out the best solution together.',
      ],
    },
    {
      heading: 'What a good PRD contains',
      body: [
        'Formats vary, but the strong ones answer a consistent set of questions. Notice the order: problem and outcome come first, solution detail comes last.',
      ],
      bullets: [
        'Problem & context — what user or business problem this solves, and why now.',
        'Goals & success metrics — the measurable outcome that defines success, plus what’s explicitly out of scope.',
        'Users & use cases — who this is for and the scenarios it must handle.',
        'Requirements — what the solution must do (the "what"), ideally as user stories with acceptance criteria.',
        'Non-goals & constraints — what we’re deliberately not doing; technical, legal, or design limits.',
        'Open questions & risks — what’s still unknown, so it’s tracked rather than buried.',
      ],
    },
    {
      heading: 'Common failure modes',
      body: [
        'PRDs go wrong in predictable ways: leading with a solution before the problem is even stated; "success" with no metric attached, so nobody can tell if it worked; no out-of-scope section, so the work quietly balloons; and over-specifying the UI, which steals design’s job and goes stale the moment the design changes. Write the why and the bar for done crisply; hold the how loosely.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Two openings for the same ${ctx.product} PRD`,
      lines: [
        (ctx) =>
          `Weak: "Build a settings page with toggles for notifications." It starts at the solution and names no outcome — nobody can tell if it succeeded.`,
        (ctx) =>
          `Strong: "Problem: ${ctx.user}s get too many notifications and disable them entirely, losing a key retention channel. Goal: cut notification opt-outs by 30% this quarter."`,
        'The strong version states the problem, the measurable outcome, and the bar for done — and leaves the trio free to decide whether the answer is a settings page, smarter defaults, or batching.',
      ],
      takeaway:
        'Open with the problem and the metric; let the solution be the team’s to discover, not the document’s to dictate.',
    },
  ],
  takeaways: [
    'A PRD aligns the team on the problem, the users, and the measurable definition of success — not on a locked-down UI.',
    'Strong PRDs lead with problem and outcome, name what’s out of scope, and track open questions and risks.',
    'Watch the failure modes: solution-first framing, success with no metric, no non-goals, and over-specified design.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt: 'What is the primary purpose of a PRD?',
        options: [
          { id: 'a', label: 'To specify the exact UI so engineers can build without designers.' },
          {
            id: 'b',
            label:
              'To align the team on the problem, the target users, and the measurable definition of success.',
          },
          { id: 'c', label: 'To create a permanent contract that can never change once approved.' },
        ],
        correctId: 'b',
        why: 'A PRD exists to get everyone aligned on why a thing matters, who it’s for, and how success is measured. It’s a living alignment tool, not a fixed UI spec or an immutable contract.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A reviewer says a PRD is missing a "non-goals" (out-of-scope) section. Why does that matter?',
        options: [
          { id: 'a', label: 'It doesn’t — listing what you won’t do is filler.' },
          {
            id: 'b',
            label:
              'Without explicit non-goals, scope tends to creep and the team can’t tell where this effort stops.',
          },
          { id: 'c', label: 'Because non-goals are the only part engineers read.' },
        ],
        correctId: 'b',
        why: 'Naming what is deliberately out of scope is one of the most useful parts of a PRD: it prevents scope creep and gives the team a clear boundary for the work.',
      },
    ],
  },
};
