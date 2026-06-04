import type { ConceptLessonContent } from './types';

/**
 * AI / ML track: "Evals & Quality" (the flagship AI-PM skill).
 * Evals as the core competency: systematic error analysis, a failure-mode
 * taxonomy, and encoding product taste into a measurable, repeatable check.
 */
export const trackEvals: ConceptLessonContent = {
  skillId: 'track-evals',
  hook: 'For an AI product, evals are the job. A team without evals is flying blind: it cannot tell whether a change helped, and it cannot say what "good" even means.',
  framework: 'Evals as the core AI-PM skill: error analysis, failure-mode taxonomy, encoding product taste',
  sections: [
    {
      heading: 'Evals are how you measure a probabilistic product',
      body: [
        'An eval is a repeatable test of your AI system\'s quality: a set of representative inputs, run through the system, with each output judged against a definition of good. Because a model is probabilistic and "done" is a quality distribution rather than pass-fail, evals are the only way to answer the questions that matter: is this prompt change better or worse, did the new model regress on our hard cases, is quality drifting in production? Vibes ("it felt better in the demo") do not scale and quietly mislead. For an AI PM, building and owning the eval set is not a chore beside the work, it is the central work.',
      ],
    },
    {
      heading: 'Error analysis: read the failures, build the taxonomy',
      body: [
        'You cannot fix what you have not looked at, so the foundational habit is systematic error analysis: sit with a sample of real outputs, read the failures, and label what actually went wrong. Out of that labeling comes a failure-mode taxonomy: a named list of the distinct ways your system fails (for example: hallucinated a fact, ignored an instruction, wrong tone, right answer but bad format, refused a valid request). The taxonomy turns a vague "it is sometimes bad" into countable categories. Now you can size each failure mode, target the biggest one, and track whether a change actually shrank it. This loop, look at outputs then categorize then measure, is the engine of every serious AI quality effort.',
      ],
      bullets: [
        'Look at real outputs; never reason about quality only in the abstract.',
        'Name each distinct failure mode (hallucination, ignored instruction, wrong format, bad tone, wrong refusal).',
        'Count them, attack the biggest, and re-measure to confirm the fix.',
      ],
    },
    {
      heading: 'Encode your product taste into the evals',
      body: [
        'The hardest and most valuable part is defining good. A generic benchmark does not know that for your product a confidently-wrong answer is far worse than an honest "I am not sure," or that a particular tone is off-brand, or which mistakes are unacceptable versus merely annoying. Those are product-taste judgments, and evals are where you make them explicit and durable. By writing graders and example-labeled cases that capture your standard, you encode taste into something measurable and shareable, so the whole team optimizes toward the same definition of quality and a model swap can be checked against it. Evals are how a PM\'s judgment about what good means becomes a repeatable test instead of a private opinion.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Building the eval loop for an AI feature in a ${ctx.product}`,
      lines: [
        (ctx) =>
          `You assemble a set of real ${ctx.user} requests, including the hard and weird ones, as your eval set, then run the system over all of them.`,
        'Error analysis: you read the failures and label them. Patterns emerge: 40% are hallucinated details, 30% ignore a stated constraint, the rest are tone.',
        'That taxonomy lets you attack the biggest mode (hallucination) first, then re-run the same set to confirm the rate actually dropped instead of trusting a demo.',
        (ctx) =>
          `You encode taste into a grader: for this ${ctx.product}, a confident wrong answer fails hard while an honest "I am not certain" passes, so the team optimizes to your standard.`,
      ],
      takeaway:
        'Build a representative eval set, run systematic error analysis into a named failure-mode taxonomy, and encode your definition of good so every change is measured, not vibed.',
    },
  ],
  takeaways: [
    'Evals are the core AI-PM skill: a repeatable test of quality over representative inputs, and the only reliable way to tell whether a change helped or hurt.',
    'Systematic error analysis (read real failures, name each failure mode, count and attack the biggest) is the engine of AI quality; vibes do not scale.',
    'The hardest, most valuable work is encoding your product taste into graders and labeled cases, turning "what good means" from a private opinion into a shared, measurable test.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Why are evals considered the core skill for an AI product manager, rather than an optional extra?',
        options: [
          { id: 'a', label: 'They are a compliance requirement imposed by model providers.' },
          {
            id: 'b',
            label:
              'Because the product is probabilistic, evals are the only repeatable way to know whether a prompt or model change actually improved quality and whether it is regressing; without them the team is flying blind and steering on vibes.',
          },
          { id: 'c', label: 'Because evals make the model itself run faster.' },
        ],
        correctId: 'b',
        why: 'A model\'s quality is a distribution, not pass-fail. Evals turn "did this help?" into a measurable, repeatable answer over representative inputs. Without them, a team cannot detect regressions or define good, so it is steering on demos and impressions that quietly mislead.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A PM says "the assistant is sometimes bad." What is the right first move to make that actionable?',
        options: [
          { id: 'a', label: 'Swap to a bigger model and hope it is better.' },
          {
            id: 'b',
            label:
              'Do systematic error analysis: read a sample of real failing outputs and label what went wrong, building a failure-mode taxonomy so the vague "sometimes bad" becomes countable categories you can size and attack.',
          },
          { id: 'c', label: 'Rewrite the prompt repeatedly until the next demo looks fine.' },
        ],
        correctId: 'b',
        why: 'You cannot fix what you have not looked at. Reading real failures and naming each distinct failure mode converts a vague impression into measurable categories, so you can target the biggest one and confirm a fix by re-measuring, instead of guessing with a model swap or a demo-driven rewrite.',
      },
      {
        kind: 'choice',
        id: 'q3',
        prompt:
          'What does it mean to "encode product taste into evals," and why does it matter?',
        options: [
          { id: 'a', label: 'Using the prettiest possible UI for the eval dashboard.' },
          {
            id: 'b',
            label:
              'Writing graders and labeled cases that capture your specific standard of good (e.g. a confident wrong answer fails, an honest "not sure" passes), turning the PM\'s judgment into a shared, measurable test the whole team and any model swap can be checked against.',
          },
          { id: 'c', label: 'Letting the model decide on its own what counts as a good answer.' },
        ],
        correctId: 'b',
        why: 'Generic benchmarks do not know your product\'s standards. Encoding taste means making those judgments explicit in graders and example-labeled cases, so good stops being a private opinion and becomes a durable, shareable target the team optimizes toward and model changes are evaluated against.',
      },
    ],
  },
};
