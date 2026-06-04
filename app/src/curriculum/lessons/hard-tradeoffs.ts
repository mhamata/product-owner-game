import type { ConceptLessonContent } from './types';

/**
 * Staff / Principal · Judgment: "Hard Tradeoffs".
 * Allocating effort by leverage (Shreyas Doshi's LNO) and pricing the clock
 * (cost of delay / cost of inaction) so the do-nothing option is made explicit.
 */
export const hardTradeoffs: ConceptLessonContent = {
  skillId: 'hard-tradeoffs',
  hook: 'The hard part of a tradeoff is rarely the math. It\'s deciding what deserves your best effort and what deserves barely any.',
  framework: 'Shreyas Doshi · LNO framework · Cost of Delay (Reinertsen)',
  sections: [
    {
      heading: 'Not all tasks deserve equal effort: LNO',
      body: [
        'Shreyas Doshi\'s LNO framework sorts work by leverage, not by your instinct to do everything well. Leverage tasks (L) return 10x or more on the effort you put in (a strategy doc, a hiring decision, the framing of a key problem) and deserve your best, most rested thinking. Neutral tasks (N) return roughly 1:1, so do them competently and move on. Overhead tasks (O) return less than the effort spent; the goal is to do them just well enough to clear the bar, or not at all. Most people\'s mistake is doing overhead tasks excellently and leverage tasks in a rush.',
      ],
      bullets: [
        'L is Leverage: high return on effort; bring your A-game and your freshest hours.',
        'N is Neutral: linear return; aim for "good enough," not perfect.',
        'O is Overhead: sub-linear return; satisfice or eliminate, because perfecting these is a hidden tax.',
      ],
    },
    {
      heading: 'Price the clock: cost of delay',
      body: [
        'A tradeoff isn\'t just "which is more valuable?" It\'s "what does waiting cost?" Cost of Delay (from Don Reinertsen\'s flow economics) puts a number on the value lost per week a thing isn\'t done. Two features worth the same total can have very different costs of delay: one bleeds revenue every day it slips; the other can wait a quarter at no cost. Sequencing by cost of delay, not by who asked loudest, is how staff PMs decide what jumps the queue. The clock is a real variable, and ignoring it is itself a choice.',
      ],
    },
    {
      heading: 'Cost of inaction: make "do nothing" explicit',
      body: [
        'Every decision has a hidden option: do nothing. Teams reflexively compare the proposals on the table and forget to price the status quo, but inaction has a cost too, and sometimes it\'s the largest cost of all. Before committing, write down what happens if you do nothing: the deal you lose, the debt that compounds, the competitor who fills the gap. Naming the cost of inaction stops "let\'s wait and see" from masquerading as the safe, free choice. Often it isn\'t free; it\'s just an unpriced bet on the present.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Sequencing two ${ctx.product} bets under a deadline`,
      lines: [
        (ctx) =>
          `Two efforts, similar total value: a compliance fix a ${ctx.user} segment needs, and a polish pass on an existing flow.`,
        'Cost of delay differs sharply: the compliance gap risks a contract that renews in three weeks; the polish pass loses nothing if it waits a quarter. Cost of delay says ship compliance first.',
        'LNO check on your own week: the strategy memo that aligns three teams is a Leverage task, so protect your best hours for it. Reformatting the status deck is Overhead, so do it in ten minutes, not an afternoon.',
        (ctx) =>
          `And the do-nothing option on a flaky integration: inaction quietly costs support load and ${ctx.user} trust every week, so "wait and see" is not actually free.`,
      ],
      takeaway:
        'Spend effort where leverage is highest, sequence by cost of delay, and always price the do-nothing option before calling it safe.',
    },
  ],
  takeaways: [
    'LNO (Shreyas Doshi): give Leverage tasks your best effort, do Neutral tasks adequately, and satisfice or drop Overhead tasks.',
    'Cost of Delay prices the value lost per week of waiting; sequence by it, not by who is loudest.',
    'Every choice includes "do nothing"; name the cost of inaction so the status quo stops looking deceptively free.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Under Shreyas Doshi\'s LNO framework, how should you treat an "Overhead" task, one whose return is less than the effort it takes?',
        options: [
          { id: 'a', label: 'Do it excellently, because quality always matters.' },
          {
            id: 'b',
            label: 'Do it just well enough to clear the bar, or eliminate it; perfecting it is a hidden tax.',
          },
          { id: 'c', label: 'Always delegate it to a junior teammate.' },
        ],
        correctId: 'b',
        why: 'Overhead tasks return less than the effort invested, so polishing them is wasted leverage. The move is to satisfice (meet the bar and stop) or drop the task entirely, reserving your best effort for high-leverage work.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Two features have nearly equal total value, but one loses revenue every week it slips while the other can wait a quarter at no cost. What decides the sequence?',
        options: [
          { id: 'a', label: 'Build them in the order they were requested.' },
          { id: 'b', label: 'Cost of delay: ship the one that bleeds value per week of waiting first.' },
          { id: 'c', label: 'Whichever stakeholder is more senior gets theirs first.' },
        ],
        correctId: 'b',
        why: 'When total value is similar, the differentiator is how much waiting costs. Cost of Delay prices the value lost per unit of time, so the feature that loses value each week it slips should jump the queue.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Teams often compare the proposals on the table but forget to price the status quo. The cost of choosing to do nothing is called the cost of ____.',
        accept: ['inaction', 'doing nothing', 'do nothing', 'the status quo'],
        why: 'The cost of inaction is what you lose by leaving things as they are: compounding debt, a lost deal, a competitor filling the gap. Naming it stops "wait and see" from looking like a free, safe choice.',
        placeholder: 'one word',
      },
    ],
  },
};
