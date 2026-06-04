import type { ConceptLessonContent } from './types';

/**
 * Zero-to-One track: "Finding PMF".
 * What product-market fit actually is and how you feel it, why zero-to-one is a
 * search under ambiguity (not optimization), and how to read the signal.
 */
export const trackFindingPmf: ConceptLessonContent = {
  skillId: 'track-finding-pmf',
  hook: 'Before product-market fit, nothing you optimize matters; after it, you can feel the pull. The zero-to-one job is to find that fit, not to tune a machine that does not exist yet.',
  framework: 'Product-market fit (Marc Andreessen) and the Sean Ellis must-have test',
  sections: [
    {
      heading: 'What product-market fit is, and how you feel it',
      body: [
        'Product-market fit (PMF) is the moment a product so clearly satisfies a strong market need that the market pulls it out of you. Marc Andreessen\'s description is visceral: before PMF you are pushing, and after it customers are buying as fast as you can make it, usage grows on its own, and you are scrambling to keep up. Pre-PMF, the opposite: users try it and drift away, word of mouth is flat, and growth only happens when you push hard. PMF is binary in feel even though it is gradual in reality: you are mainly either searching for it or scaling it, and confusing the two is the classic early-stage mistake.',
      ],
    },
    {
      heading: 'Zero-to-one is search under ambiguity, not optimization',
      body: [
        'The skill that defines zero-to-one is operating without a map. You do not yet know the customer, the problem, or the solution for certain, so the work is search: form a sharp hypothesis about who has the problem and why, get something real in front of them fast, and learn. This is a fundamentally different muscle from scaling. Scaling is optimization: the fit is proven, the metrics are known, and the job is to make a working machine run better and bigger. Pre-PMF, optimizing conversion or polishing features is often wasted motion, because you might be improving the wrong product for the wrong customer. The discipline is to tolerate the ambiguity and resprint toward learning, not to manufacture the false certainty of dashboards and roadmaps you have not earned yet.',
      ],
      bullets: [
        'Pre-PMF (search): unknown customer, problem, solution; the job is to learn fast and find fit.',
        'Post-PMF (scale): fit proven; the job is to optimize and grow a known machine.',
        'The mistake: running the scaling playbook (optimize, roadmap, forecast) before fit exists.',
      ],
    },
    {
      heading: 'Reading the signal: separate real pull from noise',
      body: [
        'Because PMF is easy to fool yourself about, you need honest signal, not flattering vanity metrics. Retention is the truest tell: do people keep coming back and using the core thing, or do they try it once and vanish? A flat retention curve that settles above zero says a segment genuinely needs you; a curve that decays to nothing says no fit yet, no matter how many signups you celebrate. A useful proxy is Sean Ellis\'s must-have test: ask users how they would feel if they could no longer use the product, and watch the share who say "very disappointed" (a rule of thumb is around 40% as a sign of fit). Talk to the users who love it and the ones who left; pull and indifference both tell you where you are.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Hunting for fit with a new ${ctx.product}`,
      lines: [
        (ctx) =>
          `Early on you do not yet know which ${ctx.user} truly needs this, so you treat it as search: a sharp hypothesis, something real in front of them quickly, and fast learning.`,
        'Signups look fine, but the honest signal is retention, and most users try it once and never return. That is not PMF; it is the absence of it.',
        'You resist the scaling reflex (optimizing the funnel, building a long roadmap) because you might be polishing the wrong product for the wrong person.',
        (ctx) =>
          `You run the must-have test and find one ${ctx.user} segment that would be "very disappointed" to lose it and keeps coming back. That pull is the fit to build on.`,
      ],
      takeaway:
        'Treat pre-PMF as search, read retention and the must-have test for honest signal, and do not switch on the scaling playbook until a segment is genuinely pulling the product from you.',
    },
  ],
  takeaways: [
    'Product-market fit is the market pulling the product out of you (organic growth, demand you scramble to meet); pre-PMF you are pushing and users drift away.',
    'Zero-to-one is search under ambiguity (unknown customer, problem, solution), a different muscle from scaling, which is optimizing a proven machine; do not run the scaling playbook too early.',
    'Read honest signal, not vanity metrics: retention is the truest tell of fit, and the must-have test ("very disappointed" share) is a useful proxy; talk to lovers and leavers alike.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Why is pre-PMF zero-to-one work described as a fundamentally different skill from scaling, rather than just an earlier version of it?',
        options: [
          { id: 'a', label: 'It is the same skill; early-stage work is simply scaling with fewer users.' },
          {
            id: 'b',
            label:
              'Pre-PMF is search under ambiguity (the customer, problem, and solution are unknown, so you must learn fast to find fit), whereas scaling is optimization of an already-proven machine; running the scaling playbook before fit exists wastes motion on the wrong product.',
          },
          { id: 'c', label: 'Because scaling requires more engineers than finding PMF does.' },
        ],
        correctId: 'b',
        why: 'The defining zero-to-one muscle is operating without a map: forming a hypothesis and learning fast because the customer, problem, and solution are not yet known. Scaling is the opposite, optimizing and growing a validated machine. Optimizing conversion or building long roadmaps before fit risks improving the wrong product for the wrong customer.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A founder points to thousands of signups as proof of product-market fit, but almost everyone stops using the product within a week. What does this actually indicate?',
        options: [
          { id: 'a', label: 'Clear product-market fit, since the signup numbers are large.' },
          {
            id: 'b',
            label:
              'No fit yet: signups are a vanity metric, while retention is the honest signal, and a curve that decays to near zero means the market is not pulling the product, regardless of how many people tried it.',
          },
          { id: 'c', label: 'That the product needs a bigger marketing budget to get even more signups.' },
        ],
        correctId: 'b',
        why: 'PMF is the market pulling the product out of you, which shows up as retention: people keep coming back to the core value. Signups that churn out within a week are the absence of fit dressed up as success. Honest signal (a retention curve that settles above zero, the must-have test) tells the real story, not raw signup counts.',
      },
    ],
  },
};
