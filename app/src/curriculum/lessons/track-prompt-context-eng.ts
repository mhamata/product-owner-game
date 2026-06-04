import type { ConceptLessonContent } from './types';

/**
 * AI / ML track: "Prompt & Context Engineering".
 * The prompt as a spec, context engineering as assembling the right information
 * into a limited window, and why retrieval beats stuffing everything in.
 */
export const trackPromptContextEng: ConceptLessonContent = {
  skillId: 'track-prompt-context-eng',
  hook: 'A model can only reason about what you put in front of it. The skill is not clever wording, it is engineering the right information into a limited window.',
  framework: 'Prompt engineering and context engineering (the prompt as a spec)',
  sections: [
    {
      heading: 'The prompt is a spec, not a magic phrase',
      body: [
        'A prompt is the instruction you give a model, and the most useful way to think about it is as a specification. A good prompt states the role, the task, the constraints, the format of the output, and shows an example or two of what good looks like. This is the same clarity you would give a sharp new teammate who has no context: vague instructions get vague work, and a precise spec gets precise work. Most "the model is bad at this" complaints are really under-specified prompts. Prompt engineering is not hunting for secret words; it is writing a clear, testable spec and iterating it against real cases.',
      ],
      bullets: [
        'Role and task: who the model is acting as and exactly what to do.',
        'Constraints and format: what to avoid and the precise shape of the output.',
        'Examples: one or two demonstrations of a good answer (few-shot) to anchor the target.',
      ],
    },
    {
      heading: 'Context engineering: get the right information in front of the model',
      body: [
        'Context engineering is the bigger discipline around the prompt: deciding what information the model can see when it answers. A model knows nothing about your specific user, document, or live data unless you put it in the context. So the real work is assembling the relevant facts (the user\'s history, the right document, current state) and placing them in the input, rather than hoping the model already knows or guesses. As products get more capable, the differentiator is less the wording of the instruction and more whether the right context reliably reaches the model at the moment it answers.',
      ],
    },
    {
      heading: 'The window is finite: retrieve, do not stuff',
      body: [
        'The context window (how much text the model can consider at once) is limited and not free: more context costs more and can actually dilute quality, because burying the key fact in a wall of irrelevant text makes the model more likely to miss it. So you cannot just stuff everything in. The standard answer is retrieval: at answer time, fetch only the most relevant pieces (often by semantic search over your data) and put those in the window. This retrieval-augmented pattern is how a model answers questions about information it was never trained on, while keeping the context focused, cheaper, and more accurate than dumping in the whole corpus.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Grounding an assistant inside a ${ctx.product}`,
      lines: [
        (ctx) =>
          `A ${ctx.user} asks the in-app assistant a question about their own account. The model knows nothing about them unless you supply it.`,
        'Prompt as spec: you set the role ("a helpful support assistant"), the task, the tone, the format, and show one example of a good answer.',
        (ctx) =>
          `Context engineering: instead of pasting the entire help center and every ${ctx.user} record, you retrieve only the few relevant articles and this user\'s recent activity.`,
        'Those focused pieces go into the limited window, so the answer is grounded, cheaper, and more accurate than stuffing everything in.',
      ],
      takeaway:
        'Write the prompt like a precise spec, then engineer the context: retrieve only the relevant facts into the finite window rather than dumping in everything.',
    },
  ],
  takeaways: [
    'A prompt is a specification: state the role, task, constraints, and output format, and give examples. Vague prompts get vague work; clear ones get precise work.',
    'Context engineering is the larger skill: a model only knows what you put in front of it, so the real work is assembling the right facts into the input at answer time.',
    'The context window is finite and costly, and irrelevant text dilutes quality: retrieve only the most relevant pieces (retrieval-augmented) rather than stuffing everything in.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Which framing of "prompt engineering" is most accurate and useful for a PM?',
        options: [
          { id: 'a', label: 'Searching for secret magic words that unlock the model\'s hidden abilities.' },
          {
            id: 'b',
            label:
              'Writing the instruction as a clear specification (role, task, constraints, output format, examples) and iterating it against real cases, the way you would brief a sharp new teammate.',
          },
          { id: 'c', label: 'Making the prompt as short as possible regardless of clarity.' },
        ],
        correctId: 'b',
        why: 'A prompt is a spec. Most "the model is bad at this" problems are under-specified instructions. Stating role, task, constraints, format, and examples, then iterating against real cases, is what reliably improves results, not hunting for secret phrasing.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'You are building an assistant that must answer questions about a company\'s thousands of internal documents. Why is retrieving only the most relevant documents at answer time better than putting all of them into the model\'s context?',
        options: [
          { id: 'a', label: 'There is no difference; models read any amount of text equally well.' },
          {
            id: 'b',
            label:
              'The context window is finite and costly, and burying the key facts in a wall of irrelevant text dilutes quality; retrieving only the relevant pieces keeps the input focused, cheaper, and more accurate.',
          },
          { id: 'c', label: 'Retrieval lets you avoid writing a prompt entirely.' },
        ],
        correctId: 'b',
        why: 'More context is not free: it costs more and can lower accuracy when the important fact is lost in noise. Retrieval-augmented prompting fetches just the relevant pieces into the limited window, which is how a model answers over data it never trained on while staying focused and cheaper.',
      },
    ],
  },
};
