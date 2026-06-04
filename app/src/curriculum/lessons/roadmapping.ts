import type { ConceptLessonContent } from './types';

/**
 * Product Manager · Roadmapping & Positioning: "Roadmapping".
 * Outcome-based roadmaps and the Now / Next / Later horizon format that promises
 * direction and confidence honestly instead of fake dated commitments.
 */
export const roadmapping: ConceptLessonContent = {
  skillId: 'roadmapping',
  hook: 'A roadmap full of features on dates is a promise you’ll break. A roadmap of outcomes by horizon is one you can keep.',
  framework: 'Now / Next / Later (Janna Bastow) · Outcome-based roadmaps',
  sections: [
    {
      heading: 'The timeline roadmap is a trap',
      body: [
        'The traditional roadmap is a Gantt chart: named features pinned to quarters and dates. It looks reassuring and is almost always wrong. It treats guesses as commitments, so the moment you learn something new (and discovery means you will), every downstream date is a broken promise. Worse, it locks the team into shipping the listed feature even after evidence says a different solution would serve the goal better.',
      ],
    },
    {
      heading: 'Now / Next / Later',
      body: [
        'The Now / Next / Later format (popularized by Janna Bastow / ProdPad) replaces dates with horizons of decreasing certainty. It communicates direction honestly: the near term is concrete, the far term is deliberately fuzzy.',
      ],
      bullets: [
        'Now: what the team is actively working on; well-understood, high confidence.',
        'Next: what’s coming up soon; shaped but not committed, medium confidence.',
        'Later: directional bets and big problems; intentionally vague, low confidence.',
        'Items move left toward "Now" as they’re validated, and some are dropped entirely.',
      ],
    },
    {
      heading: 'Make it about outcomes, not features',
      body: [
        'The stronger move is to populate the roadmap with outcomes and problems to solve, not pre-decided features. "Reduce week-1 churn" belongs on a roadmap; "build a referral widget" usually doesn’t, because the widget is just one untested guess at the outcome. An outcome-based roadmap keeps the goal fixed while leaving the team free to discover the best solution, and it sets honest expectations with stakeholders: you’re committing to pursue a result, not to ship a specific thing on a specific day.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `A Now / Next / Later roadmap for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Now: "Lift week-1 activation for new ${ctx.user}s", in active discovery and delivery, high confidence on the problem.`,
        'Next: "Make returning users faster to re-engage", shaped, agreed as important, but the solution is still open.',
        (ctx) =>
          `Later: "Help power ${ctx.user}s collaborate", a directional bet, deliberately fuzzy, may change or drop as we learn.`,
        'Note what’s absent: no "ship feature X by March." Each entry is an outcome, and items graduate leftward only once evidence supports them.',
      ],
      takeaway:
        'Frame the roadmap as outcomes across Now / Next / Later: you promise a direction and honest confidence, not a dated feature you may regret.',
    },
  ],
  takeaways: [
    'Dated feature timelines turn guesses into commitments and break the moment discovery teaches you something new.',
    'Now / Next / Later organizes work by decreasing certainty: Now is concrete and high-confidence, Later is directional and deliberately fuzzy.',
    'Populate the roadmap with outcomes and problems, not pre-decided features, so the goal stays fixed while the solution stays open.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'In a Now / Next / Later roadmap, what does moving an item between columns primarily communicate?',
        options: [
          { id: 'a', label: 'An exact delivery date for that item.' },
          {
            id: 'b',
            label:
              'The team’s level of certainty and how soon it’s being worked: Now is concrete and high-confidence, Later is fuzzy and low-confidence.',
          },
          { id: 'c', label: 'The dollar budget allocated to that item.' },
        ],
        correctId: 'b',
        why: 'Now / Next / Later are horizons of confidence, not dates. The format deliberately keeps the near term concrete and the far term vague, and items graduate toward "Now" as they’re validated.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Which item best fits an outcome-based roadmap?',
        options: [
          { id: 'a', label: 'Build a referral widget by Q3.' },
          { id: 'b', label: 'Reduce week-1 churn among new users.' },
          { id: 'c', label: 'Ship version 4.2 of the mobile app.' },
        ],
        correctId: 'b',
        why: 'An outcome-based roadmap lists problems and results to pursue. "Reduce week-1 churn" is an outcome; the referral widget and a version number are pre-decided outputs that lock in one untested guess at the solution.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'In the Now / Next / Later format, which column holds the directional, lowest-confidence, intentionally fuzzy bets?',
        accept: ['later'],
        why: 'Later is the most distant horizon: big problems and directional bets that are deliberately vague and may change or be dropped as the team learns more.',
        placeholder: 'one word',
      },
    ],
  },
};
