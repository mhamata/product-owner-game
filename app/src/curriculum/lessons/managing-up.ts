import type { ConceptLessonContent } from './types';

/**
 * Senior · Influence: "Managing Up".
 * Making your manager and leadership effective partners: surfacing problems
 * early, bringing decisions not just status, and disagreeing then committing.
 */
export const managingUp: ConceptLessonContent = {
  skillId: 'managing-up',
  hook: 'Managing up isn’t flattery or politics. It’s taking responsibility for the relationship so your manager can actually help you.',
  framework: 'Managing up · "Disagree and commit" (Bezos / Andy Grove)',
  sections: [
    {
      heading: 'No surprises: escalate early',
      body: [
        'The fastest way to lose a manager’s trust is to surprise them with a problem they could have helped with weeks earlier. Managing up starts with a no-surprises rule: when a risk appears (a slipping date, a stakeholder conflict, a bet that’s going sideways), you raise it early, while there’s still room to act. Bad news doesn’t improve with age. Bringing a problem forward isn’t admitting failure; it’s giving the one person with more leverage than you the chance to remove a blocker before it becomes a fire.',
      ],
    },
    {
      heading: 'Bring decisions, not just status',
      body: [
        'Executives are time-poor and context-rich in some areas, blind in others. Don’t hand them a raw status dump and make them do the synthesis. Come with the situation, the options you considered, your recommendation, and the specific thing you need from them: a decision, an unblock, an introduction. This is the difference between "here’s what’s happening" and "here’s what’s happening, here’s what I’d do, do you agree?" The second respects their time, demonstrates ownership, and is far more likely to get you a fast yes.',
      ],
      bullets: [
        'Lead with the recommendation, then the reasoning behind it.',
        'Name the decision you need and by when.',
        'Show the options you weighed so they trust the recommendation.',
        'Right-size it: a one-line update for small things, a real brief for big ones.',
      ],
    },
    {
      heading: 'Disagree and commit',
      body: [
        'You won’t win every call, and you shouldn’t go quiet when you lose one. "Disagree and commit" (used at Amazon, rooted in Andy Grove’s Intel) is the discipline: voice your disagreement clearly and once, with your reasoning, while the decision is open; then, if the call goes the other way, commit to it fully and execute as if it were your own. The failure modes are equal and opposite: staying silent to avoid friction, or relitigating the decision in the hallway after it’s made. Sandbagging a decision you publicly accepted is how you become someone leadership stops trusting with the next one.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Taking a slipping ${ctx.product} bet to your manager`,
      lines: [
        (ctx) =>
          `Two weeks in, the new ${ctx.product} initiative is clearly behind. The instinct is to wait and hope; managing up says raise it now.`,
        'Bring a brief, not a dump: here’s the slip, here are three options (cut scope, add help, push the date), here’s the one I recommend and why.',
        'You ask for a specific decision (approval to cut scope), not vague reassurance, so your manager can act in two minutes instead of twenty.',
        'They choose a different option. You disagree once, on the record, then commit fully and run it as if it were your own call.',
      ],
      takeaway:
        'Surface it early, arrive with a recommendation and a clear ask, and once the decision is made, commit to it without relitigating.',
    },
  ],
  takeaways: [
    'Managing up means owning the relationship: a no-surprises rule, escalating risks early while there’s still time to act on them.',
    'Bring decisions, not status dumps. Lead with the situation, options, your recommendation, and the specific ask, so leadership can act fast.',
    'Disagree and commit: voice your case clearly while the decision is open, then back the final call fully, with no silent sandbagging or hallway relitigating.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'You realize a key initiative is likely to miss its date. What does "managing up" suggest you do?',
        options: [
          { id: 'a', label: 'Wait until you’re certain it will slip, to avoid alarming your manager prematurely.' },
          {
            id: 'b',
            label:
              'Raise it early, while there’s still room to act, and arrive with options and a recommendation rather than just the bad news.',
          },
          { id: 'c', label: 'Quietly try to fix it yourself and only mention it if it can’t be recovered.' },
        ],
        correctId: 'b',
        why: 'Bad news doesn’t improve with age. A no-surprises approach gives the person with more leverage a chance to unblock you, and bringing options plus a recommendation turns the escalation into a fast decision rather than a fire drill.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A decision goes against your strong recommendation. Under "disagree and commit," what’s the right move?',
        options: [
          { id: 'a', label: 'Keep raising the objection in side conversations until the decision is reversed.' },
          {
            id: 'b',
            label:
              'Having voiced your disagreement clearly while it was open, now commit fully and execute the chosen path as if it were your own.',
          },
          { id: 'c', label: 'Comply outwardly but invest minimal effort so the decision is shown to be wrong.' },
        ],
        correctId: 'b',
        why: 'Disagree and commit requires both halves: argue your case once, on the record, while the decision is live; then, once it’s made, back it wholeheartedly. Silent compliance with low effort (sandbagging) and hallway relitigation are the two failure modes that erode trust.',
      },
    ],
  },
};
