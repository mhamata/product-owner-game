import type { ConceptLessonContent } from './types';

/**
 * Staff / Principal · Scope & Leverage: "Force-Multiplier Influence".
 * Scaling yourself through others: raising the bar across teams, fixing the
 * upstream strategy behind execution thrash, and earning influence without
 * authority.
 */
export const forceMultiplierInfluence: ConceptLessonContent = {
  skillId: 'force-multiplier-influence',
  hook: 'Past a point you can\'t add value by doing more yourself. Your impact is whatever you cause other teams to do better.',
  framework: 'The staff archetypes · "most execution problems are strategy problems"',
  sections: [
    {
      heading: 'Your output is now other people\'s output',
      body: [
        'An individual contributor is measured by what they personally produce. A force multiplier is measured by the lift they create in everyone around them: the standard rose, the decision got sharper, three teams avoided a mistake. This is a genuine identity shift: the instinct that made you successful (do the work, do it well) now caps your impact, because there is only one of you. The leverage move is to invest your time where it raises the ceiling for many: a reusable mental model, a crisp problem frame, a review that levels up everyone who sees it.',
      ],
      bullets: [
        'Raise the bar: set a visible standard (for specs, for decisions, for rigor) that others adopt.',
        'Unblock and de-risk: spot the mistake three teams are about to make and head it off once.',
        'Teach the model, not the answer: give people a way to reason, so they don\'t need you next time.',
      ],
    },
    {
      heading: 'Most execution problems are strategy problems',
      body: [
        'When teams are thrashing (shipping busily but not progressing, redoing work, missing the point) the reflex is to push harder on execution. Usually the real defect is upstream: an unclear strategy, a fuzzy problem, a priority no one actually decided. People execute badly when they don\'t know precisely what they\'re solving or why. So the highest-leverage intervention is rarely "work harder"; it\'s to go upstream and fix the clarity. A staff PM who can tell the difference between "the team can\'t execute" and "the team was never given a real strategy" saves quarters of wasted motion.',
      ],
    },
    {
      heading: 'Influence without authority',
      body: [
        'Force multipliers almost never have the org-chart power to order other teams around, and trying to would fail anyway. Influence at this level is earned, through a few durable currencies: being the most prepared person in the room, building trust by being reliably right and intellectually honest, framing the work in terms of the other team\'s goals (not your own), and giving credit generously. You move people by making the right path the clearest and most attractive one, not by escalating. Borrowed authority spends down; earned credibility compounds.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Multiplying instead of doing on the ${ctx.product}`,
      lines: [
        (ctx) =>
          `Five ${ctx.product} teams keep writing vague specs, so engineers build the wrong thing and rework piles up. You could rewrite each spec yourself and become the bottleneck.`,
        'Force-multiplier move instead: publish one excellent worked example of a sharp spec, run a 30-minute teardown, and make it the visible bar. Now every team writes better specs without you in the loop.',
        (ctx) =>
          `One team is "failing to execute" on a ${ctx.user} feature. Upstream, you find no one ever decided which segment it\'s for: a strategy gap, not an effort gap. You fix the frame, and execution unblocks itself.`,
        'You have no authority over these teams. They follow because you showed up most prepared, tied the change to their goals, and credited their wins, not because you outranked anyone.',
      ],
      takeaway:
        'Scale by raising the bar and fixing upstream clarity, and lead through earned credibility rather than borrowed authority.',
    },
  ],
  takeaways: [
    'A force multiplier\'s impact is the lift they create in other teams: raising the bar, unblocking, and teaching models beats doing more yourself.',
    'Most execution problems are strategy problems: when teams thrash, fix the upstream clarity (strategy, problem, priority) before pushing harder on execution.',
    'Influence without authority is earned through preparation, trust, framing in others\' goals, and generous credit, not commanded through the org chart.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'Several teams keep producing vague specs, causing constant rework. Which response is the genuine force-multiplier move?',
        options: [
          {
            id: 'a',
            label: 'Personally rewrite every team\'s spec to the right standard from now on.',
          },
          {
            id: 'b',
            label:
              'Publish one excellent example, teach the standard in a short teardown, and make it the visible bar every team adopts.',
          },
          { id: 'c', label: 'Escalate to each team\'s manager and demand better specs.' },
        ],
        correctId: 'b',
        why: 'Rewriting every spec makes you the bottleneck and scales only to your own hours. Setting a visible standard and teaching the model lifts every team\'s output without you in the loop: that is leverage. Escalation spends authority you mostly don\'t have and changes no one\'s skill.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A team is shipping constantly but going in circles, redoing work, missing the real goal. A teammate says "they just need to execute better." What\'s the more likely root cause to check first?',
        options: [
          { id: 'a', label: 'The team is lazy and needs tighter deadlines.' },
          {
            id: 'b',
            label:
              'An upstream strategy or clarity gap: no one decided precisely what problem they\'re solving or why.',
          },
          { id: 'c', label: 'The team has too many engineers and should be cut.' },
        ],
        correctId: 'b',
        why: 'Most execution problems are strategy problems. Busy-but-circular work is the classic signature of missing upstream clarity: an unclear problem, strategy, or priority. Pushing harder on execution treats the symptom; fixing the clarity removes the cause.',
      },
    ],
  },
};
