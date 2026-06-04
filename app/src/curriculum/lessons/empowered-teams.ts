import type { ConceptLessonContent } from './types';

/**
 * Director / VP · Leading Teams: "Empowered Teams".
 * Empowered product teams vs feature teams, at the leadership altitude: what a
 * leader owes a team so it can be trusted with a problem (Cagan, EMPOWERED).
 */
export const empoweredTeams: ConceptLessonContent = {
  skillId: 'empowered-teams',
  hook: 'A leader’s job is not to direct the teams’ work. It is to build teams worth trusting with a problem.',
  framework: 'Marty Cagan & Chris Jones · EMPOWERED',
  sections: [
    {
      heading: 'The distinction, restated for a leader',
      body: [
        'A feature team is given a roadmap of solutions to build and is measured on output: did it ship the list. An empowered team is given a problem to solve and a measurable outcome, and is trusted to discover the best solution, measured on whether the problem moved. By the time you are a Director or VP, you are no longer choosing this for one team; you are deciding which kind of organization you run.',
        'Cagan’s central claim in EMPOWERED is that the difference between the best companies and the rest is not the quality of their people; it is how those people are led. Most companies hire capable people and then use them as mercenaries to build features. The leadership task is to convert that into missionaries trusted with outcomes.',
      ],
    },
    {
      heading: 'What a leader owes an empowered team',
      body: [
        'Empowerment is not the absence of leadership; it is a harder kind. A team can only be handed a problem if its leaders have done their own job first: a clear product strategy that says which problems matter, strong managers who coach the people, and the context the team needs to make good decisions without escalating every one.',
      ],
      bullets: [
        'Strategic context: the company and product strategy, so the team knows which problems are worth solving and why now.',
        'A problem to solve, framed as an outcome, not a feature to build, not a deadline to hit.',
        'Competent, coached people: managers whose first job is growing the team, not assigning its tasks.',
        'The latitude to own the solution, and to be held accountable for the result, good or bad.',
      ],
    },
    {
      heading: 'Why leaders quietly default to feature teams',
      body: [
        'Feature teams feel safer to a nervous executive: a roadmap of committed features looks like control, and control looks like leadership. But it trades away the very thing you hired good people for: their judgement about the solution. The failure mode is a building full of capable engineers and designers reduced to order-takers, shipping a roadmap nobody can prove will work. Choosing empowerment means tolerating that you cannot pre-specify the answer, and trusting the system you built to find it.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Re-chartering a team on the ${ctx.product}`,
      lines: [
        (ctx) =>
          `Today the team gets a quarterly feature list from leadership ("ship in-app messaging, then SSO") for the ${ctx.product}. It hits its dates and is praised for delivery.`,
        (ctx) =>
          `A VP re-charters it as empowered: the objective becomes "raise activated ${ctx.user}s in week one from 18% to 30%," with the team free to choose how.`,
        'For that to be fair, the VP first supplies the strategy (why activation is this quarter’s lever), a manager who coaches the PM, and access to the data, then steps back from dictating the solution.',
        'The team tests three approaches and lands on one leadership never would have specified, and is accountable for the number, not the feature list.',
      ],
      takeaway:
        'Handing a team an outcome is only fair once you have given it strategy, coaching, and context first. Empowerment is earned by the leader, not just granted to the team.',
    },
  ],
  takeaways: [
    'Empowered teams are given problems and outcomes; feature teams are given solutions and measured on output (Cagan).',
    'The difference between great and ordinary product orgs is how people are led, not how talented they are.',
    'Empowerment is harder leadership, not less: it requires strategy, strong managers, and context, the leader’s job done first.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A VP says, "We run empowered teams," but every team still receives a fully-specified feature roadmap each quarter and is reviewed on whether it shipped that roadmap. What is actually happening?',
        options: [
          { id: 'a', label: 'These are empowered teams: they own delivery of the roadmap.' },
          {
            id: 'b',
            label:
              'These are feature teams in name only: given solutions and judged on output, regardless of the label.',
          },
          { id: 'c', label: 'It depends on how talented the team members are.' },
        ],
        correctId: 'b',
        why: 'The label does not change the mechanics. Receiving prescribed solutions and being measured on shipping them is the definition of a feature team. Empowerment means being given a problem and an outcome and being trusted to find the solution.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'According to Cagan, what most distinguishes the strongest product organizations from ordinary ones?',
        options: [
          { id: 'a', label: 'They hire fundamentally more talented people.' },
          { id: 'b', label: 'They have larger budgets and longer roadmaps.' },
          {
            id: 'c',
            label:
              'How their people are led: empowered to solve problems rather than directed to build features.',
          },
        ],
        correctId: 'c',
        why: 'EMPOWERED’s thesis is that the gap is leadership, not raw talent. Most companies have capable people; the best ones lead them as missionaries entrusted with outcomes instead of mercenaries handed a feature list.',
      },
    ],
  },
};
