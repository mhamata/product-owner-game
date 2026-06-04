import type { ConceptLessonContent } from './types';

/**
 * Product Manager · Metrics & North Star: "North Star & OKRs".
 * The single North Star metric that captures delivered value, and OKRs whose
 * key results are outcomes (numbers that move) rather than shipped output.
 */
export const northStar: ConceptLessonContent = {
  skillId: 'north-star',
  hook: 'A team pointed at one shared measure of customer value beats a team chasing ten dashboards: that measure is the North Star.',
  framework: 'North Star Metric (Amplitude) · OKRs (Doerr / Grove)',
  sections: [
    {
      heading: 'What a North Star metric is',
      body: [
        'A North Star metric is the single number that best captures the value your product delivers to customers, chosen so that, as it grows, both the customer and the business win. Spotify’s is time spent listening; Airbnb’s is nights booked. It is not revenue directly (revenue is the result), and it is not a vanity count like total signups; it is the leading measure of delivered value that revenue follows.',
        'Its job is alignment. When every team can see how their work ladders up to one North Star, prioritization arguments get shorter: you ask "does this move the North Star?" rather than defending pet metrics.',
      ],
    },
    {
      heading: 'OKRs: objective + key results',
      body: [
        'OKRs (Objectives and Key Results, popularized by Andy Grove and John Doerr) are a goal-setting structure. The Objective is a short, qualitative, inspiring statement of what you want to achieve. The Key Results are 2-4 measurable conditions that prove you got there. The classic shorthand: "I will [Objective] as measured by [these Key Results]."',
      ],
      bullets: [
        'Objective: directional and memorable ("Make new users successful in their first week").',
        'Key Results: measurable outcomes that confirm it ("week-1 activation 40% → 60%").',
        'A handful, not a wall: focus is the point.',
      ],
    },
    {
      heading: 'Key results are outcomes, not output',
      body: [
        'The most common OKR mistake is writing key results as a to-do list: "ship the new onboarding," "launch templates." Those are output: they can all be done while the goal is still missed. A real key result is an outcome: a number that moves because the work succeeded ("increase activation rate to 60%," "cut time-to-first-value below 5 minutes"). If you could check off the key result by simply shipping something, regardless of whether it worked, it is output in disguise. Write the result, not the task.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `An outcome OKR for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `North Star for this ${ctx.product}: weekly active ${ctx.user}s who complete a core action, the truest measure of value delivered.`,
        'Objective: "New users reliably reach value in their first week." Inspiring, directional, no numbers yet.',
        'Output trap (wrong): KR = "Launch redesigned onboarding flow." It can ship and change nothing.',
        'Outcome KR (right): "Raise week-1 activation from 38% to 55%," "reduce median time-to-first-value from 12 to 5 minutes."',
      ],
      takeaway:
        'If a key result is satisfied merely by shipping a feature, rewrite it as the number that feature was supposed to move.',
    },
  ],
  takeaways: [
    'A North Star metric is the single measure of delivered customer value the whole team aligns behind, not revenue, not a vanity count.',
    'OKRs pair a qualitative Objective with 2-4 measurable Key Results: "I will [objective] as measured by [key results]."',
    'Key results must be outcomes (a number that moves), not output (a feature shipped); if shipping alone satisfies it, it’s output in disguise.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Which of these is a properly written Key Result, an outcome rather than output?',
        options: [
          { id: 'a', label: 'Ship the redesigned onboarding flow by end of quarter.' },
          { id: 'b', label: 'Launch three new integrations.' },
          { id: 'c', label: 'Increase week-1 activation rate from 38% to 55%.' },
        ],
        correctId: 'c',
        why: 'Shipping a flow or launching integrations is output: it can be completed while the goal is missed. A Key Result must be a measurable outcome, like moving the activation rate, that proves the work actually worked.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Which best describes a North Star metric?',
        options: [
          {
            id: 'a',
            label:
              'The single measure that best captures the value the product delivers to customers, which the team aligns behind.',
          },
          { id: 'b', label: 'Total cumulative signups since launch.' },
          { id: 'c', label: 'This quarter’s total revenue figure.' },
        ],
        correctId: 'a',
        why: 'A North Star is the leading measure of delivered customer value (e.g. nights booked, time listening). Cumulative signups is a vanity count, and revenue is the trailing result the North Star is meant to drive.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'In OKRs, the qualitative "what we want to achieve" statement is the Objective. What two-word term (abbreviated KR) names the measurable conditions that prove it was achieved?',
        accept: ['key results', 'key result'],
        why: 'OKR stands for Objectives and Key Results. The Objective is directional; the Key Results are the 2-4 measurable outcomes that confirm you reached it.',
        placeholder: 'two words',
      },
    ],
  },
};
