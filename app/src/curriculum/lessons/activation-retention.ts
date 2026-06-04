import type { ConceptLessonContent } from './types';

/**
 * Product Manager · Metrics & North Star: "Activation & Retention".
 * The aha moment, defining activation as a measurable setup moment, and reading
 * retention curves (the flattening-or-not test for product-market fit).
 */
export const activationRetention: ConceptLessonContent = {
  skillId: 'activation-retention',
  hook: 'Acquisition is rented; retention is owned. The two levers that decide whether a product compounds are activation and retention.',
  framework: 'Aha moment (Chamath / Facebook) · Retention curves',
  sections: [
    {
      heading: 'The aha moment and activation',
      body: [
        'The "aha moment" is the point where a new user first feels the product’s core value, the thing that makes them get it. The famous example is Facebook’s observation that users who reached a certain number of friends in their first days were dramatically more likely to stick. Activation is the job of getting as many new users to that moment as quickly as possible.',
        'The discipline is to define activation as a specific, measurable event, not a vibe. Find a behaviour that early on separates users who retain from users who churn, then make activation = "did the user do that thing in their first session/week?" That definition becomes a number you can move.',
      ],
    },
    {
      heading: 'Reading a retention curve',
      body: [
        'A retention curve plots the share of a cohort still active over time: day 0, day 1, day 7, day 30. Every curve falls at first (some users were never a fit). What matters is what happens next.',
      ],
      bullets: [
        'Curve flattens to a stable plateau above zero (a "smile" or flat tail) means a core of users keeps coming back: a signal of product-market fit.',
        'Curve keeps sliding toward zero, with no flattening, means a leaky bucket: you retain almost no one, and growth only masks it.',
        'The height of the plateau, not the day-1 number, is the real health signal.',
      ],
    },
    {
      heading: 'Why retention sits upstream of everything',
      body: [
        'Retention is the closest thing to a single product-health vital sign. It feeds revenue (retained users pay longer), referral (retained users invite), and even acquisition economics (you can spend more to acquire a user who stays). This is why activation and retention are usually worked before scaling acquisition: improving the plateau lifts every downstream metric at once, while acquisition spend on a falling curve evaporates.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Defining activation for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Look at past cohorts: ${ctx.user}s who completed one real task in week one retained at 50%; those who didn’t, at 8%.`,
        'That gap makes "completed one real task in week one" a strong activation definition: a concrete, measurable aha proxy.',
        'Now the onboarding has a job: get more new users to that one task, faster. You can A/B test changes against the activation rate.',
        (ctx) =>
          `Plot the cohort’s retention curve: if it flattens at ~35% by week eight, a real core of ${ctx.user}s sticks. If it keeps falling to near zero, fix fit before buying growth.`,
      ],
      takeaway:
        'Pick the early behaviour that predicts who stays, make it your activation metric, then judge health by where the retention curve flattens, not by day one.',
    },
  ],
  takeaways: [
    'The aha moment is where a user first feels core value; activation is getting new users to it fast, defined as a measurable event.',
    'A retention curve that flattens to a plateau above zero signals fit; one that keeps falling to zero is a leaky bucket.',
    'Retention is upstream of revenue, referral, and acquisition economics. Improve activation and retention before scaling spend.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Two new-user retention curves: Curve A keeps declining toward zero with no flattening; Curve B drops at first, then levels off at a stable 30%. Which is the stronger signal of product-market fit?',
        options: [
          { id: 'a', label: 'Curve A, because a steep early drop shows strong initial interest.' },
          {
            id: 'b',
            label:
              'Curve B, because flattening to a stable plateau above zero means a core of users keeps coming back.',
          },
          { id: 'c', label: 'Neither curve can say anything about fit.' },
        ],
        correctId: 'b',
        why: 'Every curve falls early. The fit signal is whether it flattens to a plateau above zero (Curve B), that stable returning core, versus sliding to zero (Curve A), which is a leaky bucket.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'What is the most useful way to define "activation" so it can be improved and measured?',
        options: [
          { id: 'a', label: 'A general sense that the user seems happy with the product.' },
          {
            id: 'b',
            label:
              'A specific, measurable early behaviour that separates users who retain from those who churn.',
          },
          { id: 'c', label: 'The total number of users acquired this month.' },
        ],
        correctId: 'b',
        why: 'Activation has to be a concrete event (like reaching the aha moment in week one) chosen because it predicts retention. A vibe can’t be moved with onboarding changes; a defined behaviour can.',
      },
    ],
  },
};
