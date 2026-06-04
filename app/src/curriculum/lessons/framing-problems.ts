import type { ConceptLessonContent } from './types';

/**
 * Staff / Principal · Judgment: "Framing Problems for Others".
 * Creating clarity as the core staff act: a sharp problem statement, separating
 * problem from solution, and writing so others can think (Amazon narrative norm).
 */
export const framingProblems: ConceptLessonContent = {
  skillId: 'framing-problems',
  hook: 'A staff PM\'s highest-leverage output is rarely a feature. It\'s a problem framed so sharply that a whole org can act on it.',
  framework: 'Amazon six-page narrative · the well-formed problem statement',
  sections: [
    {
      heading: 'Creating clarity is the job',
      body: [
        'Senior roles add value by deciding and doing. Staff roles add value by helping many others decide and do well, and the rawest material for that is clarity. When a problem is fuzzy, every team interprets it differently, builds at cross-purposes, and the most expensive resource in the company (other people\'s time and judgment) gets spent badly. A precise frame is force-multiplied: write it once, and dozens of downstream decisions get easier and more aligned.',
        'This is why "most execution problems are strategy problems." Teams thrash not because they can\'t build, but because no one told them, crisply, which problem they\'re solving, for whom, and how success will be judged.',
      ],
    },
    {
      heading: 'Separate the problem from the solution',
      body: [
        'The most common framing error is smuggling a solution into the problem statement. "We need a notifications center" is a solution wearing a problem\'s clothes: it has already foreclosed the design space before anyone asked what users are actually missing. State the problem in solution-free terms: who is struggling, with what, in what context, and what it costs them and the business. A good frame widens the option space; a solution disguised as a problem narrows it prematurely.',
      ],
      bullets: [
        'Who: the specific person or segment affected (not "users").',
        'What: the struggle or unmet need, stated without naming a feature.',
        'Why now / so what: the cost of leaving it unsolved, and why it matters this quarter.',
        'How we\'ll know: the outcome that would tell you it\'s solved.',
      ],
    },
    {
      heading: 'Write it down: prose, not bullets',
      body: [
        'Amazon famously bans slide decks for big decisions in favor of a written narrative, read in silence at the start of the meeting. The reason is that prose forces complete thoughts: you can hide a muddy idea behind a bullet point, but not behind a paragraph that has to connect to the next one. Writing the frame as a short document (not a slide, not a Slack message) is how you discover the holes in your own thinking before you ask others to commit to it. The artifact is the thinking, not a record of it.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Reframing a ${ctx.product} request from solution to problem`,
      lines: [
        (ctx) =>
          `A VP asks for "an onboarding wizard for new ${ctx.user}s." Three teams could build three different wizards from that sentence.`,
        (ctx) =>
          `Reframe to the problem: "New ${ctx.user}s don\'t reach their first meaningful result. Most never complete setup, and a third churn in week one. We don\'t know which step loses them."`,
        'Now the frame is solution-free: it names who, the struggle, the cost, and the open question. A wizard is one candidate answer; so is pre-filling data, or removing the setup step entirely.',
        'Written as a half-page narrative, the gaps surface: do we even have the funnel data to know where they drop? That question is now visible before anyone builds.',
      ],
      takeaway:
        'Trade the handed-down solution for a sharp, solution-free problem statement, and the team\'s options, and judgment, open back up.',
    },
  ],
  takeaways: [
    'The staff act is creating clarity: a precise problem frame is written once and multiplies the quality of many downstream decisions.',
    'Keep the problem statement solution-free (who struggles, with what, at what cost) so the option space stays open instead of being foreclosed.',
    'Write the frame as short prose, not bullets or a deck; complete sentences expose the holes a bullet list lets you hide.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Which of these is a well-formed problem statement rather than a solution in disguise?',
        options: [
          { id: 'a', label: 'We need to add a notifications center to the app.' },
          {
            id: 'b',
            label:
              'Power users miss time-sensitive account events because nothing surfaces them in-product, and they\'re churning as a result.',
          },
          { id: 'c', label: 'Let\'s build a mobile app so people get push alerts.' },
        ],
        correctId: 'b',
        why: 'Option (b) names who is affected, the struggle, the context, and the cost, without prescribing a feature, so the design space stays open. Options (a) and (c) jump straight to a solution, foreclosing better alternatives before the problem is even understood.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Why does Amazon favor a written six-page narrative over a slide deck for important decisions?',
        options: [
          { id: 'a', label: 'Documents are easier to archive than slides.' },
          {
            id: 'b',
            label:
              'Prose forces complete, connected thoughts and exposes gaps that bullet points let a presenter gloss over.',
          },
          { id: 'c', label: 'It saves time, because narratives are faster to produce than slides.' },
        ],
        correctId: 'b',
        why: 'The point of the narrative is rigor: a paragraph has to hold together logically, so muddy thinking can\'t hide behind a terse bullet. Writing the frame surfaces its holes before others are asked to act on it.',
      },
    ],
  },
};
