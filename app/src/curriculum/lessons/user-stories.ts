import type { ConceptLessonContent } from './types';

/**
 * Associate PM · Writing It Down: "User Stories & Acceptance Criteria".
 * The story format, INVEST, and Gherkin-style acceptance criteria.
 */
export const userStories: ConceptLessonContent = {
  skillId: 'user-stories',
  hook: 'A user story keeps the team focused on a person and their goal; acceptance criteria define exactly when it’s done.',
  framework: 'INVEST (Bill Wake) · Gherkin Given/When/Then',
  sections: [
    {
      heading: 'The story format',
      body: [
        'A user story is a small, user-centred unit of work, usually phrased: "As a [type of user], I want [some goal], so that [some benefit]." The format isn’t bureaucracy. It forces three things into view: who it’s for, what they’re trying to do, and why it’s worth doing. The "so that" is the part teams skip and the part that carries the value.',
        'A story is a placeholder for a conversation, not a complete spec. Its job is to be small enough to deliver and clear enough to talk about.',
      ],
    },
    {
      heading: 'INVEST: what makes a story good',
      body: [
        'Bill Wake’s INVEST is the checklist for a well-formed story. A story that fails one of these is usually a story that will cause trouble in a sprint.',
      ],
      bullets: [
        'Independent: can be built and shipped without depending on other stories.',
        'Negotiable: a starting point for discussion, not a rigid contract.',
        'Valuable: delivers value to a user or customer (not "build the database table").',
        'Estimable: clear enough that the team can size it.',
        'Small: fits comfortably inside a sprint.',
        'Testable: you can write a concrete check that proves it’s done.',
      ],
    },
    {
      heading: 'Acceptance criteria define "done"',
      body: [
        'Acceptance criteria (AC) are the conditions that must be true for a story to be accepted. They turn "it works" into something unambiguous and testable. A common, sharp format is Gherkin: Given [a context], When [an action], Then [an expected result]. Writing AC up front prevents the "but that’s not what I meant" conversation at the end of the sprint, and it doubles as the basis for QA tests.',
        'Good AC are specific and cover the edges: the happy path, the empty state, the error case. Vague AC ("the page loads fast") aren’t testable; specific ones ("loads in under 2 seconds on 3G") are.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `A story and its acceptance criteria on a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Story: "As a ${ctx.user}, I want to reset my password by email, so that I can get back in when I forget it."`,
        'Given a registered user on the login screen, When they request a reset for their email, Then a reset link is sent and a confirmation is shown.',
        'Given an unregistered email, When a reset is requested, Then the same neutral confirmation is shown (so we don’t reveal who has an account).',
        'Given an expired reset link, When it’s opened, Then the user is told it expired and offered a new one.',
      ],
      takeaway:
        'The story names the who/what/why in a sentence; the Given/When/Then criteria make "done" concrete and testable, including the edge cases.',
    },
  ],
  takeaways: [
    'User stories follow "As a [user], I want [goal], so that [benefit]". The "so that" is where the value lives.',
    'INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable) is the checklist for a well-formed story.',
    'Acceptance criteria (often Given/When/Then) define "done" unambiguously and should cover the happy path and the edges.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt: 'Which part of the "As a… I want… so that…" format do teams most often drop, even though it carries the value?',
        options: [
          { id: 'a', label: 'The "as a": the type of user.' },
          { id: 'b', label: 'The "I want": the goal.' },
          { id: 'c', label: 'The "so that": the benefit / why it matters.' },
        ],
        correctId: 'c',
        why: 'The "so that" clause captures why the story is worth doing. Skipping it leaves a task with no stated value: exactly the connection a user story is meant to preserve.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A story reads "build the orders database table." Which INVEST letter does it most clearly violate?',
        options: [
          { id: 'a', label: 'V for Valuable: it describes internal plumbing, not value to a user.' },
          { id: 'b', label: 'S for Small: tables are always large.' },
          { id: 'c', label: 'N for Negotiable: tables can’t be discussed.' },
        ],
        correctId: 'a',
        why: 'A pure technical task with no user-facing value fails the "Valuable" test. A good story is framed around the value delivered to a user, even when it requires technical work underneath.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Acceptance criteria are often written in a three-part format: Given / When / ____. What’s the third keyword (the expected result)?',
        accept: ['then'],
        why: 'Gherkin-style acceptance criteria use Given (context) / When (action) / Then (expected result) to state a testable condition for "done".',
        placeholder: 'one word',
      },
    ],
  },
};
