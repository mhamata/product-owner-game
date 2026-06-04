import type { ConceptLessonContent } from './types';

/**
 * Associate PM · Shipping Well — "Quality & Delivery".
 * Definition of done, release management, and the tech-debt trade-off.
 */
export const qualityAndDelivery: ConceptLessonContent = {
  skillId: 'quality-and-delivery',
  hook: 'Shipping isn’t the finish line — quality, a clear bar for "done", and how you release decide whether the work actually lands.',
  framework: 'Definition of Done · release strategies',
  sections: [
    {
      heading: 'Definition of Done',
      body: [
        'Acceptance criteria say when one story is complete. The Definition of Done (DoD) is the team-wide standard that applies to every story: the checklist a piece of work must pass before it counts as truly shippable. It typically includes things like code reviewed, tests written and passing, no known critical bugs, documentation updated, and accessibility checked.',
        'A shared DoD prevents the slow rot of "done" meaning "the happy path works on my machine." It makes quality a default, not a heroic afterthought, and it keeps the team honest about what’s really finished.',
      ],
    },
    {
      heading: 'Releasing is its own skill',
      body: [
        'Getting code to users safely is release management. Rather than flip a risky big-bang switch, mature teams de-risk the rollout. Knowing these patterns lets you talk credibly with engineering about how — not just whether — to ship.',
      ],
      bullets: [
        'Feature flags — ship code dark, then turn it on for a chosen audience without redeploying.',
        'Phased / canary rollout — release to 1%, then 10%, then everyone, watching metrics at each step.',
        'Beta / staged release — a limited audience first, to catch problems before the full launch.',
        'Rollback plan — a fast, known way to turn it off if something breaks.',
      ],
    },
    {
      heading: 'Technical debt is a real trade-off',
      body: [
        'Technical debt is the implied cost of shortcuts taken to ship faster now — quick-and-dirty code, skipped tests, a design that won’t scale. Like financial debt, a little can be a smart, deliberate trade to hit a deadline or test an idea; left unpaid, the "interest" compounds as every future change gets slower and buggier.',
        'The PM’s job isn’t to eliminate debt — that’s impossible and often wasteful — but to make it a conscious decision. Take debt on purpose when speed matters, and budget real time to pay it down before it strangles the team’s velocity. The wrong move is to always sacrifice the codebase for the next feature.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `A careful launch on a ${ctx.product}`,
      lines: [
        (ctx) =>
          `The team finishes a payments change for the ${ctx.product}. The DoD requires tests, a review, and an accessibility pass — all green before it’s "done".`,
        'They ship behind a feature flag, on for internal users first, then 5% of customers, watching error rates and conversion.',
        (ctx) =>
          `A spike in failures for one ${ctx.user} segment appears at 5% — they flip the flag off in seconds, fix it, and resume. No full-blown incident.`,
        'To hit the date they skipped one optimization (logged as tech debt) and scheduled time next sprint to pay it back.',
      ],
      takeaway:
        'A clear DoD plus a phased, reversible rollout turns "we shipped it" into "we shipped it safely" — and debt taken on purpose gets paid back on purpose.',
    },
  ],
  takeaways: [
    'Definition of Done is the team-wide quality bar every story must pass — distinct from per-story acceptance criteria.',
    'Release with feature flags, phased/canary rollouts, and a rollback plan to ship safely rather than in a risky big bang.',
    'Technical debt is a deliberate trade-off: take it consciously for speed, then budget time to pay it down before interest compounds.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt: 'How does the Definition of Done differ from a story’s acceptance criteria?',
        options: [
          {
            id: 'a',
            label:
              'Acceptance criteria are specific to one story; the Definition of Done is the shared quality bar applied to every story.',
          },
          { id: 'b', label: 'They are the same thing under two names.' },
          { id: 'c', label: 'The Definition of Done applies only to bug fixes.' },
        ],
        correctId: 'a',
        why: 'Acceptance criteria define when a particular story is complete. The Definition of Done is the team-wide standard (tests passing, reviewed, no critical bugs, etc.) that applies across all work.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt: 'A team rolls a change out to 1% of users, then 10%, then 100%, watching metrics at each step. What is this called?',
        options: [
          { id: 'a', label: 'A big-bang release.' },
          { id: 'b', label: 'A phased (canary) rollout.' },
          { id: 'c', label: 'A rollback.' },
        ],
        correctId: 'b',
        why: 'Gradually exposing a change to a growing share of users while watching metrics is a phased or canary rollout — a way to catch problems early and limit blast radius.',
      },
      {
        kind: 'choice',
        id: 'q3',
        prompt: 'What is the healthiest way for a PM to treat technical debt?',
        options: [
          { id: 'a', label: 'Eliminate all of it before shipping anything new.' },
          { id: 'b', label: 'Always sacrifice the codebase to ship the next feature faster.' },
          {
            id: 'c',
            label:
              'Treat it as a conscious trade-off — take it deliberately for speed, and budget time to pay it down.',
          },
        ],
        correctId: 'c',
        why: 'Some debt is a smart, deliberate trade to move fast; the danger is letting it accumulate invisibly until it cripples velocity. The PM’s role is to make it a conscious decision and schedule paydown — not to chase zero debt, nor to always defer it.',
      },
    ],
  },
};
