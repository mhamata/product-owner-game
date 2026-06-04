import type { ConceptLessonContent } from './types';

/**
 * Director / VP · Leading Teams: "Hiring & Coaching PMs".
 * Coaching as the manager's first job (Cagan, EMPOWERED); the SVPG product
 * manager assessment as a gap-finder; hiring for character and potential.
 */
export const hiringCoachingPms: ConceptLessonContent = {
  skillId: 'hiring-coaching-pms',
  hook: 'The single most important thing a manager of product managers does is coach: develop the person, not just review the work.',
  framework: 'Marty Cagan · EMPOWERED · the SVPG product manager assessment',
  sections: [
    {
      heading: 'Coaching is the job, not a side task',
      body: [
        'Cagan is emphatic in EMPOWERED: the first and most important responsibility of a manager of product managers is coaching. Empowered teams are only possible when the people on them are competent enough to be trusted with a problem, and that competence is something the manager actively develops, not something they wait to discover. A manager who only reviews roadmaps and approves decisions has not done the job.',
        'Practically, coaching means a real weekly 1:1 focused on the person’s growth (not a status update), candid and specific feedback, and gradually widening the scope of decisions you let them own. The goal is a PM who needs you less over time.',
      ],
    },
    {
      heading: 'The assessment: find the gaps deliberately',
      body: [
        'To coach well you need an honest read of where each PM is strong and where they are weak. SVPG’s product manager assessment is a structured way to do this: rate the PM across the dimensions the role actually requires, rather than forming a vague overall impression. It turns "they’re doing fine" into a specific development plan.',
      ],
      bullets: [
        'Knowledge of the customer: do they have deep, first-hand understanding of the users?',
        'Knowledge of the data: are they fluent in the analytics and comfortable in the numbers?',
        'Knowledge of the business: do they understand sales, finance, legal, and the constraints (the viability lens)?',
        'Knowledge of the market and industry: competitors, trends, and the forces shaping the space.',
        'Process skills: discovery, prioritization, and working effectively with the trio.',
        'Character and influence: integrity, reliability, and the ability to move people without authority.',
      ],
    },
    {
      heading: 'Hire for character and potential',
      body: [
        'When hiring, the durable predictors are character and potential, not a polished résumé of shipped features. Skills and product knowledge can be coached; integrity, curiosity, and the drive to own outcomes are far harder to install. Cagan’s view is that you hire for competence and character and then commit to coaching the person up, which is exactly why you only hire someone you are genuinely willing to invest in.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Coaching a strong-but-uneven PM on the ${ctx.product}`,
      lines: [
        (ctx) =>
          `A PM on the ${ctx.product} ships reliably and writes crisp specs, so the easy read is "doing fine," and they get left alone.`,
        (ctx) =>
          `Run against the assessment, a real gap appears: they rarely talk to a ${ctx.user} first-hand and lean on second-hand summaries, so their customer knowledge is thin.`,
        'The manager turns that into a concrete plan: three user conversations a week, debriefed together in the 1:1, with the manager modeling the first one.',
        'Within a quarter the PM’s problem framing visibly improves, because the manager coached the specific gap instead of praising the general competence.',
      ],
      takeaway:
        'A structured assessment converts a vague "they’re fine" into a specific, coachable gap, which is the difference between managing a PM and developing one.',
    },
  ],
  takeaways: [
    'Coaching is the most important responsibility of a manager of PMs (Cagan): develop the person, not just review the artifacts.',
    'The SVPG assessment rates a PM across the dimensions the role requires (customer, data, business, market, process, character) to turn impressions into a development plan.',
    'Hire primarily for character and potential; skills and product knowledge can be coached, but integrity and drive largely cannot.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'In EMPOWERED, what does Cagan identify as the single most important responsibility of a manager of product managers?',
        options: [
          { id: 'a', label: 'Approving every team’s roadmap and reviewing its specs.' },
          { id: 'b', label: 'Coaching: actively developing the competence of each person on the team.' },
          { id: 'c', label: 'Reporting team status accurately up to executives.' },
        ],
        correctId: 'b',
        why: 'Cagan puts coaching first: empowered teams require competent people, and developing that competence is the manager’s core job. Reviewing artifacts and reporting status are not substitutes for growing the person.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A manager believes a PM is "doing fine" but cannot say specifically where they are strong or weak. What is the value of running the SVPG product manager assessment here?',
        options: [
          {
            id: 'a',
            label:
              'It replaces the need for 1:1s by scoring the PM automatically.',
          },
          {
            id: 'b',
            label:
              'It converts a vague overall impression into specific, named gaps (e.g., thin customer or data knowledge) that can be coached.',
          },
          { id: 'c', label: 'It ranks PMs against each other for promotion decisions.' },
        ],
        correctId: 'b',
        why: 'The assessment’s purpose is diagnostic: by rating the PM across the dimensions the role requires, it turns "they’re fine" into a concrete development plan. It supports coaching and 1:1s rather than replacing them.',
      },
    ],
  },
};
