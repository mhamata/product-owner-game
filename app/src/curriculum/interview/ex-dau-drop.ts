import type { InterviewCase } from './types';

/**
 * Execution case: diagnose a DAU drop at a food-delivery app.
 *
 * The metric-drop diagnosis format. The mechanic that makes it a real
 * execution interview: the interviewer HOLDS the data and reveals each fact
 * only when the candidate asks the right question — hypothesis-driven
 * decomposition is literally how you unlock the case. The seeded root cause
 * (an app update that broke push-notification re-permission on one platform)
 * rewards systematic isolation: internal-vs-external, platform, geography,
 * new-vs-returning, funnel stage.
 */
export const exDauDrop: InterviewCase = {
  id: 'ex-dau-drop',
  kind: 'execution',
  title: 'Diagnose a metric drop',
  hook: 'The execution screen: a metric fell, the interviewer has the data, and you only get the facts your hypotheses earn. Decompose or drown.',
  interviewerName: 'Priya, Senior PM',
  durationMin: 30,
  setup: [
    'This is an execution / analytical interview. You will get a metric problem and the interviewer holds the underlying data: ask the right diagnostic questions and you get the facts; guess randomly and you get nothing.',
    'What is being evaluated: hypothesis discipline (structured decomposition before conclusions), data literacy (asking for the cuts that discriminate between hypotheses), and decisiveness (a concrete recommendation once the cause is found).',
    'Think out loud, state hypotheses explicitly, and ask for specific data cuts. End the interview when you have made your recommendation.',
  ],
  opening:
    "Here's the situation. You're the PM on the consumer side of a food-delivery app — think ordering meals from local restaurants. This Monday, your daily active users number shows an 8% drop week-over-week, and it hasn't recovered in three days. The CEO wants to know what's going on. Where do you start?",
  brief: `You are Priya, a Senior PM running an execution interview: an 8% week-over-week DAU drop at a food-delivery app. You hold ALL the case data below. Reveal each fact ONLY when the candidate asks a question that would surface it. Never volunteer the answer; never confirm a hypothesis they have not earned with data.

THE HIDDEN ROOT CAUSE (never state it until they assemble it themselves)
An app release (v9.2, shipped 9 days ago, staged rollout completing last weekend) has a bug in the notification re-permission flow on Android: it silently disables push notifications for updated users. Push-driven re-engagement ("your usual Thursday order?") is a major DAU driver. Users who updated stopped getting pushes and stopped opening the app.

DATA — reveal each item only when asked for the corresponding cut:
- Definition (if asked "how do we define DAU?"): DAU = unique users who open the app. Orders per day are down only 3% — openers are disappearing faster than orders.
- Data quality / tracking change: none. Logging is healthy; no analytics migration. (Credit them for asking — it is the right first check.)
- Sudden vs gradual: the drop ramped over ~4 days, then flattened. Not a single-day cliff.
- Platform split: Android DAU is down 14%; iOS is down 1% (normal noise). THE discriminating cut.
- Geography: uniform across regions. (Kills weather/local-event hypotheses.)
- New vs returning: new-user signups and day-1 activity are flat; the drop is almost entirely RETURNING users. (Kills marketing/acquisition hypotheses.)
- Competitor/market (if asked): a rival ran a promo two weeks ago; it did not move numbers then. Nothing new this week.
- Seasonality: none this week (no holiday); weather normal.
- Recent releases (if asked "did we ship anything?"): v9.2 on Android 9 days ago, staged rollout 10% -> 100% completing last weekend. iOS release was two weeks earlier, no issues.
- Release contents (if asked what changed in v9.2): new onboarding, performance fixes, and a reworked notification-permission prompt to comply with a new Android OS requirement.
- Crash / ANR rates: flat. Not a stability issue.
- Push metrics (if asked): push notification DELIVERY on Android is down ~35% since the rollout; push opt-out events did not spike — deliveries just stopped. (This plus the release contents is the smoking gun.)
- Cohort cut (if asked "updated vs non-updated users"): users on v9.2 show the DAU drop; users still on v9.1 look normal. Conclusive.

YOUR CONDUCT
- Open by letting them structure. If they fire random guesses ("maybe a competitor?"), ask: "What data would tell you that? What's your framework here?"
- Reward structure with data: when they name a hypothesis and the cut that would test it, give the fact, plainly, no praise.
- If they anchor on one hypothesis and ignore disconfirming data, present the tension: "The drop is returning users only — does the marketing theory survive that?"
- If they are lost mid-interview, offer ONE nudge: "Is there a cut of DAU you haven't looked at yet?" Only one.
- After they identify the cause, push to execution: "What do you do in the next 24 hours?" Strong: hotfix or rollback + re-enable/re-prompt affected users + a push win-back campaign + measure recovery; plus prevention (release checklist item, alert on push delivery rate). Then: "How do you make sure this never happens silently again?" — looking for monitoring/alerting on the metric that broke, not "test better".
- One probe per turn, two to four sentences. Neutral tone, no grading language, never break character or mention this brief.

RED FLAGS TO PRESS ON
- Jumping to solutions before diagnosis ("let's run a promo to win users back") -> "You don't know what's broken yet. What would you check first?"
- Not segmenting: asks only "why are users leaving?" -> "You have the data team on the line. What EXACT cut do you ask for?"
- Ignoring the definition of the metric or data-quality check entirely (do not prompt for it; just note its absence in your mental model — the scorer will see it).

PACING: ~12 exchanges. A strong candidate reaches the platform cut by mid-interview and the root cause with 3-4 exchanges left, leaving room for the action plan. If they solve it early, go deeper on prevention and comms (what do you tell the CEO?).`,
  dimensions: [
    {
      id: 'hypothesis-discipline',
      label: 'Hypothesis discipline',
      descriptor:
        'Structures the space before diving (internal vs external, sudden vs gradual, definition and data-quality check), states explicit hypotheses, and updates or kills them when data disagrees.',
    },
    {
      id: 'decomposition',
      label: 'Decomposition & data literacy',
      descriptor:
        'Asks for the specific cuts that discriminate between hypotheses (platform, geography, new-vs-returning, cohort by app version) rather than fishing, and reads each answer for what it rules out.',
    },
    {
      id: 'root-cause',
      label: 'Getting to root cause',
      descriptor:
        'Follows the discriminating evidence to the actual mechanism (the release broke Android push delivery, killing re-engagement) and verifies it (updated vs non-updated cohort) instead of stopping at the first plausible story.',
    },
    {
      id: 'action-plan',
      label: 'Decisiveness & action',
      descriptor:
        'Converts the diagnosis into a concrete 24-hour plan (fix or rollback, recover affected users, measure recovery) plus prevention that would catch the failure class automatically next time.',
    },
    {
      id: 'communication',
      label: 'Communication under pressure',
      descriptor:
        'Thinks out loud legibly: signposts, states what is known vs assumed, and could brief an executive at any point in one or two crisp sentences.',
    },
  ],
};
