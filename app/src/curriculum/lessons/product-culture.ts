import type { ConceptLessonContent } from './types';

/**
 * Director / VP · Culture & The Top Job: "Product Culture".
 * Culture as the behaviour a leader rewards and tolerates; psychological safety
 * (Edmondson) as the precondition for the learning a product org runs on.
 */
export const productCulture: ConceptLessonContent = {
  skillId: 'product-culture',
  hook: 'Culture is not your stated values. It is the behaviour your organization actually rewards, tolerates, and punishes.',
  framework: 'Amy Edmondson · psychological safety · Cagan · EMPOWERED',
  sections: [
    {
      heading: 'Culture is what you reward, not what you frame',
      body: [
        'Every org has a poster of values. The real culture is the pattern of behaviour those values produce, and people read it from what actually gets rewarded and what quietly gets tolerated. If "we value learning" is on the wall but the person who ran a failed experiment gets sidelined while the person who shipped a useless feature on time gets praised, the real value being taught is "ship the roadmap and don’t get caught being wrong." Leaders set culture far more through what they celebrate, fund, and let slide than through what they say.',
        'For a product org specifically, the culture you want is one that prizes the right things: outcomes over output, evidence over opinion, learning over being right, and customer truth over internal politics. None of that survives unless the leader’s own behaviour and incentives back it.',
      ],
    },
    {
      heading: 'Psychological safety: the precondition for learning',
      body: [
        'Amy Edmondson’s research defines psychological safety as a shared belief that the team is safe for interpersonal risk-taking: that you can ask a naive question, admit a mistake, disagree with the boss, or report bad news without being humiliated or punished. Crucially, it is not the same as being "nice" or lowering the bar. The opposite of safety is silence, and silence is fatal to a product org, which runs entirely on surfacing uncomfortable truths early.',
      ],
      bullets: [
        'It is not niceness or comfort: high-performing teams pair high safety with high standards.',
        'Its enemy is silence: the unsaid risk, the unreported failed test, the disagreement swallowed.',
        'It is what lets discovery work: bad news about a beloved idea reaches the leader while it’s still cheap.',
        'Leaders create it by responding to mistakes and dissent with curiosity, not blame.',
      ],
    },
    {
      heading: 'How a leader builds it',
      body: [
        'Psychological safety is built in the small moments, mostly by the most senior person in the room. The practical moves: respond to a reported failure with "what did we learn?" rather than "who’s responsible?"; thank the person who surfaces bad news or disagrees with you, especially in public; admit your own mistakes out loud so fallibility is visibly survivable; and never punish the messenger. The fastest way to destroy it is one public humiliation: everyone watching learns to stay silent, and the org goes quiet exactly where it most needs to speak.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Two reactions that set the ${ctx.product} culture`,
      lines: [
        (ctx) =>
          `A team runs an honest experiment on the ${ctx.product} to lift ${ctx.user} activation. It fails (the metric doesn’t move) and the PM brings the negative result to the review.`,
        'Reaction A: the VP asks who approved the bet and notes it as a miss in the team’s record. The lesson the whole org learns: hide failed experiments, only show wins.',
        'Reaction B: the VP thanks the PM for killing a bad bet cheaply, asks what they learned, and shares it with other teams. The lesson: surfacing truth fast is exactly the job.',
        'Same event, opposite cultures. It was the leader’s reaction, not the value on the wall, that decided which one the org actually has.',
      ],
      takeaway:
        'Culture is taught in how a leader reacts to failure and dissent: reward the honest negative result and you get a learning org; punish it and you get silence.',
    },
  ],
  takeaways: [
    'Culture is the behaviour an org actually rewards and tolerates, set by what leaders celebrate and fund, not by stated values.',
    'Psychological safety (Edmondson) is the shared belief that interpersonal risk-taking is safe; it is the precondition for the learning a product org runs on, and is not the same as niceness.',
    'Leaders build safety by meeting mistakes and dissent with curiosity and thanks; one public humiliation teaches everyone to go silent.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A company’s values poster says "we celebrate learning," but in practice the PM who ran a failed experiment is quietly marked down while the PM who shipped an unused feature on schedule is praised. What is this company’s real culture teaching?',
        options: [
          { id: 'a', label: 'That it genuinely values learning: the poster says so.' },
          {
            id: 'b',
            label:
              'That it rewards shipping output on time and punishes being visibly wrong, because culture is what gets rewarded, not what’s stated.',
          },
          { id: 'c', label: 'Nothing. Values posters and incentives are unrelated.' },
        ],
        correctId: 'b',
        why: 'People learn the real culture from what is rewarded and tolerated. Praising on-time output while penalizing honest failed experiments teaches "ship the roadmap and don’t get caught being wrong," regardless of the stated value.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Amy Edmondson’s concept of psychological safety is best described as which of the following?',
        options: [
          {
            id: 'a',
            label:
              'A nice, comfortable team that avoids conflict and lowers the performance bar.',
          },
          {
            id: 'b',
            label:
              'A shared belief that the team is safe for interpersonal risk-taking (asking questions, admitting mistakes, and dissenting without humiliation) paired with high standards.',
          },
          { id: 'c', label: 'A guarantee that no one will ever be held accountable for results.' },
        ],
        correctId: 'b',
        why: 'Psychological safety is about safe interpersonal risk-taking, not comfort or lowered standards. Edmondson pairs high safety with high standards; its enemy is silence, which is what kills a learning organization.',
      },
    ],
  },
};
