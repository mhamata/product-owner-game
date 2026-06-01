import type { FreeTextDrill, FreeTextValues } from './types';

/**
 * User Interviews drill (The Mom Test) — free-text, LLM-graded.
 *
 * The learner writes ONE interview question that passes the Mom Test: it asks
 * about concrete past behaviour, stays specific, and never pitches the idea or
 * asks a hypothetical. /api/grade returns a rubric verdict. Generic SaaS
 * framing (a team-collaboration product), never finance-specific.
 */
export const momTestDrill: FreeTextDrill = {
  drillId: 'mom-test',
  scenario: 'SaaS · discovery',
  prompt: 'Write one interview question that passes the Mom Test.',
  briefTitle: 'The interview',
  brief:
    'You are building a tool to cut down the number of status meetings teams sit through. You have 30 minutes with a team lead at a prospective customer. You want to learn whether status meetings are actually a painful, recurring problem for them — without leading them or pitching your idea. Write the single best opening question to ask.',
  fields: [
    {
      key: 'question',
      label: 'Your question (ask about real past behaviour — no "would you…")',
      placeholder:
        'e.g., Walk me through the last status meeting your team had — what happened and what did you do afterward?',
      multiline: true,
      rows: 3,
    },
  ],
  composeInput: (v: FreeTextValues) => v.question?.trim() ?? '',
  buildContext: () => ({
    goal:
      'Learn whether recurring status meetings are a real, painful problem for a prospective customer team lead, without pitching a meeting-reduction tool.',
  }),
  isReady: (v: FreeTextValues) => (v.question?.trim().length ?? 0) >= 12,
};
