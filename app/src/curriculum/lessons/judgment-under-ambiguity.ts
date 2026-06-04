import type { ConceptLessonContent } from './types';

/**
 * Staff / Principal · Judgment: "Judgment Under Ambiguity".
 * Decision quality vs outcome; "it depends" as analysis, not evasion; and
 * matching rigor to reversibility (Bezos one-way vs two-way doors).
 */
export const judgmentUnderAmbiguity: ConceptLessonContent = {
  skillId: 'judgment-under-ambiguity',
  hook: 'At the staff level the data runs out before the decision does, so judgment, not analysis, becomes the bottleneck.',
  framework: 'Annie Duke · Thinking in Bets · Bezos one-way / two-way doors',
  sections: [
    {
      heading: 'Separate decision quality from outcome',
      body: [
        'A good decision is one that was sound given what you could reasonably know at the time. A good outcome is the result you happened to get. They are not the same thing: Annie Duke calls confusing them "resulting". A well-reasoned bet can lose to bad luck, and a reckless bet can win. If you judge decisions only by how they turned out, you reward luck and punish good thinking, and you learn the wrong lessons.',
        'The staff PM\'s job is to raise the quality of decisions, the part you control, and to resist grading every call purely by its result. The test of judgment is not "were you right?" but "given the information available, was this the bet a careful person would have made?"',
      ],
    },
    {
      heading: '"It depends" is the start of the analysis, not the end',
      body: [
        'Junior answers are confident and context-free. Senior answers begin "it depends," and then say exactly what it depends on. The phrase is only an evasion if you stop there. Used well, it surfaces the two or three variables that actually flip the decision: the stage of the product, the cost of being wrong, who the customer is, how reversible the move is. Name those variables, state your assumption for each, and the recommendation falls out.',
      ],
      bullets: [
        'Bad "it depends": vague hedging that avoids committing to anything.',
        'Good "it depends": names the 2-3 factors that change the answer, then commits given a stated read of them.',
        'The payoff: when a factor changes, everyone can see the decision should change too.',
      ],
    },
    {
      heading: 'Match rigor to reversibility',
      body: [
        'Jeff Bezos splits decisions into two-way doors (reversible, you can walk back through) and one-way doors (irreversible, or expensive to undo). The mistake is treating them the same. One-way doors deserve slow, careful, heavily-reviewed deliberation. Two-way doors should be made fast, by the people closest to the work, because the cost of a wrong call is just walking back. Most decisions are two-way doors dressed up as one-way doors, and treating them as irreversible is how organizations grind to a halt.',
        'So before you spend a week analyzing, ask: if this is wrong, how cheaply can we reverse it? Cheap-to-reverse means decide now with the information you have. Hard-to-reverse means buy more certainty first.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Two doors on the same ${ctx.product} call`,
      lines: [
        (ctx) =>
          `The team is split on whether to change the default sort order for ${ctx.user}s. It feels weighty, so a month of debate is brewing.`,
        'Reversibility check: a default is a config flag. If engagement drops, you flip it back next week. This is a two-way door: decide today, instrument it, move on.',
        (ctx) =>
          `Contrast: migrating every ${ctx.user} to a new pricing model and deprecating the old plans. You can\'t quietly un-ring that bell. That is a one-way door: slow down, model it, get the call reviewed.`,
        'A loss either way isn\'t proof the decision was wrong: judge whether the bet was sound given what was knowable, not only by how it landed.',
      ],
      takeaway:
        'Spend your deliberation budget on the irreversible few; make the reversible many fast and learn from them.',
    },
  ],
  takeaways: [
    'Decision quality (was the bet sound given what was knowable?) is distinct from outcome (what happened); grading only by outcome is "resulting".',
    '"It depends" is a strong answer when it names the few variables that flip the decision, then commits given a stated read of them.',
    'Match rigor to reversibility: two-way (reversible) doors decided fast, one-way (irreversible) doors deliberated slowly.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A PM made a carefully reasoned launch call using the best evidence available; an unforeseeable supplier failure tanked the result. A leader declares it "a bad decision." What error is the leader making?',
        options: [
          { id: 'a', label: 'None; a bad outcome means it was a bad decision.' },
          {
            id: 'b',
            label:
              'Resulting: judging the decision\'s quality purely by its outcome, ignoring that the bet was sound given what was knowable.',
          },
          { id: 'c', label: 'Over-analysis; the PM should have gathered even more data.' },
        ],
        correctId: 'b',
        why: 'Decision quality and outcome are separate. A sound decision can still lose to luck or unforeseeable events. Grading the decision only by how it turned out is what Annie Duke calls "resulting," and it teaches the wrong lesson.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Which decision genuinely warrants slow, heavily-reviewed deliberation rather than a fast call by the team closest to it?',
        options: [
          { id: 'a', label: 'Changing a default setting that can be reverted with a config flag.' },
          { id: 'b', label: 'Running a two-week experiment on a small traffic slice.' },
          {
            id: 'c',
            label: 'Migrating all customers off the old data model and permanently deleting it.',
          },
        ],
        correctId: 'c',
        why: 'A permanent, hard-to-undo migration is a one-way door: the cost of being wrong is high and irreversible, so it earns careful deliberation. Reversible "two-way door" calls (a default flag, a small experiment) should be made fast and walked back if wrong.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Bezos calls a reversible decision (one you can easily walk back) a "____-way door." Fill in the number word.',
        accept: ['two', 'two-way', '2'],
        why: 'A two-way door is reversible: you can walk back through it cheaply, so it should be decided quickly. A one-way door is irreversible and deserves much more deliberation.',
        placeholder: 'one / two',
      },
    ],
  },
};
