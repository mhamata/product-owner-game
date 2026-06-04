import type { ConceptLessonContent } from './types';

/**
 * Senior · Influence: "Influence Without Authority".
 * Moving decisions you can't mandate: narrative over assertion, Amazon's
 * 6-pager, and the pre-mortem as a tool to surface dissent and de-risk.
 */
export const influenceWithoutAuthority: ConceptLessonContent = {
  skillId: 'influence-without-authority',
  hook: 'A PM rarely has the authority to order anything. The work gets done by changing what people believe, and that runs on narrative, not job title.',
  framework: 'Amazon 6-pager / Narrative · Pre-mortem (Gary Klein)',
  sections: [
    {
      heading: 'Authority is borrowed; influence is built',
      body: [
        'A product manager sits at the center of a team they don’t manage and depends on partners they can’t command. So the lever isn’t power, it’s persuasion: getting smart, skeptical people to choose your direction because they’re convinced, not because they were told. Influence is built from credibility (you’ve been right and honest before), a clear case for the decision, and genuinely engaging others’ concerns rather than steamrolling them. People support what they helped shape.',
      ],
    },
    {
      heading: 'Narrative beats assertion: the 6-pager',
      body: [
        'A claim asserted is easy to wave away; a claim reasoned through is hard to argue with. Amazon famously banned slide decks for big decisions in favor of a six-page written narrative, read silently at the start of the meeting. The format forces what bullet points let you skip: full sentences expose fuzzy logic, the argument has to flow from problem to evidence to recommendation, and the room reacts to the same complete case rather than to whoever talks first. Writing the narrative is itself the thinking: if you can’t write the case clearly, you don’t yet have one.',
      ],
      bullets: [
        'Prose, not bullets: full sentences surface gaps a slide hides.',
        'Read silently up front: everyone engages the same complete argument.',
        'Problem → evidence → recommendation: the logic has to hold together.',
        'Writing it is the work: a muddled draft means muddled thinking.',
      ],
    },
    {
      heading: 'Pre-mortems surface dissent and build buy-in',
      body: [
        'A pre-mortem (Gary Klein) flips the post-mortem: before committing, imagine it’s a year later and the project has clearly failed, then have everyone write down why. It works for two reasons. It defeats groupthink and overconfidence: "prospective hindsight" gives people permission to voice doubts they’d otherwise swallow in front of the boss. And because the team named the risks, they own the plan to mitigate them, which is exactly the buy-in influence depends on. You walk out with a de-risked plan and a team that helped shape it, both worth more than a confident yes.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Winning a hard ${ctx.product} decision without the authority to mandate it`,
      lines: [
        (ctx) =>
          `You want to delay the ${ctx.product} launch to fix activation, but you can’t order it: eng, marketing, and the GM all have a say.`,
        'Instead of a deck, write a 6-page narrative: the activation data, why launching now wastes the spend, and the recommendation, in plain prose.',
        (ctx) =>
          `Run a pre-mortem: "it’s a year out and the ${ctx.user} launch flopped. Why?" The room itself surfaces the activation gap you were worried about.`,
        'Now the fix is the team’s idea, not your decree: they own the mitigation plan and back the delay because they reasoned their way to it.',
      ],
      takeaway:
        'Replace assertion with a written narrative and let a pre-mortem surface the risks: people commit to a conclusion they reached themselves.',
    },
  ],
  takeaways: [
    'A PM influences without authority: persuade skeptical peers via credibility and a clear case, because people support what they helped shape.',
    'Narrative beats assertion: Amazon’s silently-read 6-pager forces full-sentence logic, and writing the case is the thinking itself.',
    'A pre-mortem (imagine the failure, ask why) defeats groupthink, surfaces honest dissent, and produces a de-risked plan the team owns.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Why did Amazon replace slide decks with a silently-read six-page written narrative for important decisions?',
        options: [
          { id: 'a', label: 'Prose is faster to produce than slides, saving the author time.' },
          {
            id: 'b',
            label:
              'Full-sentence prose exposes gaps in logic that bullets hide, and reading it silently means everyone engages the same complete argument instead of reacting to whoever speaks first.',
          },
          { id: 'c', label: 'Written documents are easier to archive for legal compliance.' },
        ],
        correctId: 'b',
        why: 'The narrative format forces a coherent problem→evidence→recommendation argument that bullet points let you skip, and the silent read gives the whole room the same complete case. Writing it clearly is itself the test of whether the thinking holds up.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A team is about to commit to a plan and everyone seems confident. How does running a pre-mortem add value beyond a normal risk review?',
        options: [
          { id: 'a', label: 'It delays the decision, which is always safer.' },
          {
            id: 'b',
            label:
              'By imagining the project has already failed and asking why, it gives people permission to voice doubts they’d otherwise suppress, defeating groupthink and producing a plan the team owns.',
          },
          { id: 'c', label: 'It assigns blame in advance so failures have a clear owner.' },
        ],
        correctId: 'b',
        why: 'The pre-mortem’s "prospective hindsight" lowers the social cost of dissent, surfacing real risks that confident teams gloss over. Because the team named the risks, they buy into the mitigations: exactly the commitment influence without authority relies on.',
      },
    ],
  },
};
