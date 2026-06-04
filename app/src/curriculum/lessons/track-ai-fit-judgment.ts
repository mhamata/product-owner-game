import type { ConceptLessonContent } from './types';

/**
 * AI / ML track: "AI-Fit Judgment".
 * The first and most-skipped question ("does this even need AI?"), why
 * probabilistic systems demand a different bar, and the model tradeoff triangle.
 */
export const trackAiFitJudgment: ConceptLessonContent = {
  skillId: 'track-ai-fit-judgment',
  hook: 'The most valuable AI judgment a PM has is knowing when not to use AI. Most problems that get an AI feature would be better, cheaper, and more reliable solved another way.',
  framework: 'AI-fit judgment and the cost / latency / quality model tradeoff',
  sections: [
    {
      heading: 'Ask first: does this even need AI?',
      body: [
        'AI is a means, never the goal. Before reaching for a model, ask what job the user is trying to get done and whether a model is genuinely the best tool for it. A huge share of "AI features" are problems a rule, a lookup, a better default, or a plain heuristic would solve more cheaply and far more reliably. The honest test: would this be worth building if it were not labeled AI? Reach for a model when the task is genuinely fuzzy (language, images, judgment, prediction over messy inputs) and a deterministic approach cannot capture the variety. Use AI because it is the right tool, not because it is the exciting one.',
      ],
      bullets: [
        'Good fit: fuzzy, high-variety tasks where rules cannot cover the cases (language, images, ranking, prediction).',
        'Poor fit: deterministic problems a rule, lookup, or sane default handles more cheaply and predictably.',
        'The tell: a model added for novelty, not because the job actually needs one.',
      ],
    },
    {
      heading: 'Probabilistic, not deterministic: a different bar',
      body: [
        'A model is a probabilistic component. The same input can give different outputs, and it will be confidently wrong some of the time. That changes the product bar in two ways. First, you have to design for the error case, not just the happy path: what does the user see when the model is wrong, and how do they recover or correct it? Second, "done" is not pass-fail, it is a quality distribution you have to measure (which is the evals discipline). Treating an AI feature like a deterministic one ("we shipped it, it works") is how teams ship something that demos beautifully and then erodes trust in production.',
      ],
    },
    {
      heading: 'The model tradeoff: cost, latency, quality',
      body: [
        'Once AI is the right tool, choosing how to use it is a constant three-way trade between cost, latency, and quality. A bigger, stronger model usually means higher quality but more cost and more latency; a smaller one is cheap and fast but weaker; techniques like retrieval, fine-tuning, or caching shift the balance. The right point is set by the use case, not by always grabbing the most powerful model. A real-time, high-volume feature may need a small fast model with guardrails; a once-a-day, high-stakes analysis can spend more for top quality. The PM\'s job is to know which corner of that triangle the use case actually demands.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `An AI-fit call inside a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Request: "add AI" to sort a ${ctx.user}\'s list. But the list has a clear, stable rule for ordering, so a model would be slower, costlier, and less predictable than the rule. AI is the wrong tool here.`,
        (ctx) =>
          `A genuine fit: summarizing each ${ctx.user}\'s messy free-text notes. That is fuzzy and high-variety, exactly where a model earns its place.`,
        'Because it is probabilistic, you design the wrong-answer path (let the user edit the summary) instead of assuming it is always right.',
        'Tradeoff: summaries are not real-time and matter a lot, so you pick a stronger model and accept the higher cost and latency for quality.',
      ],
      takeaway:
        'Use AI only where the task is genuinely fuzzy, design for the model being wrong, and pick the cost / latency / quality point the use case actually needs.',
    },
  ],
  takeaways: [
    'The first AI question is "does this even need AI?": many AI features are better solved by a rule, lookup, or default, so use a model only when the task is genuinely fuzzy.',
    'A model is probabilistic, not deterministic: it will be confidently wrong sometimes, so you must design the error path and measure a quality distribution, not declare pass-fail.',
    'Choosing how to use a model is a cost / latency / quality tradeoff: match the corner of that triangle to the use case rather than always grabbing the most powerful model.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A stakeholder asks to "add AI" to a feature that currently sorts items by a clear, stable, well-understood rule. What is the strongest reason to push back?',
        options: [
          { id: 'a', label: 'AI is too expensive to use anywhere, so it should always be avoided.' },
          {
            id: 'b',
            label:
              'A deterministic rule already solves this more cheaply, faster, and more predictably; a model would add cost and unpredictability to a task that does not need fuzziness.',
          },
          { id: 'c', label: 'AI can only be used for text, never for sorting.' },
        ],
        correctId: 'b',
        why: 'AI is a means, not the goal. The job here is deterministic and a rule covers it well, so a probabilistic model would be slower, costlier, and less reliable. Models earn their place on genuinely fuzzy, high-variety tasks, not problems a rule already handles.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Because an AI feature is probabilistic rather than deterministic, what must the PM do that a normal deterministic feature usually does not require?',
        options: [
          { id: 'a', label: 'Nothing different; ship it the same way once it passes a single test.' },
          {
            id: 'b',
            label:
              'Explicitly design for the model being wrong (the recovery and correction path) and measure a quality distribution, since the same input can produce a confidently wrong output some of the time.',
          },
          { id: 'c', label: 'Guarantee the model is correct 100% of the time before launch.' },
        ],
        correctId: 'b',
        why: 'A model can be confidently wrong, and the same input may yield different outputs. So "done" is a measured quality distribution, not pass-fail, and the wrong-answer experience (how the user notices and recovers) is a first-class part of the design, not an edge case.',
      },
      {
        kind: 'choice',
        id: 'q3',
        prompt:
          'A real-time, very high-volume feature needs an AI component. Why might the team deliberately choose a smaller, weaker model over the most powerful one available?',
        options: [
          { id: 'a', label: 'Smaller models are always more accurate than large ones.' },
          {
            id: 'b',
            label:
              'Because using a model is a cost / latency / quality tradeoff: at high volume and real-time speed, a smaller model\'s lower cost and lower latency can be exactly what the use case demands, with guardrails to hold quality.',
          },
          { id: 'c', label: 'Because powerful models cannot be used in real-time products at all, ever.' },
        ],
        correctId: 'b',
        why: 'There is no free lunch: bigger models tend to raise quality but also cost and latency. The right choice is set by the use case. A real-time, high-volume feature often needs the cheap, fast corner of the triangle (with guardrails), whereas a rare high-stakes task can pay for top quality.',
      },
    ],
  },
};
