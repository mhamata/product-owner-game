import type { FreeTextDrill, FreeTextValues } from './types';

/**
 * Jobs-to-be-Done drill — free-text, LLM-graded.
 *
 * The learner writes a JTBD statement in the canonical
 * "When [situation], I want to [motivation], so I can [outcome]" form for a
 * concrete persona, and /api/grade returns a rubric verdict. Content is
 * industry-generic (a SaaS analytics product), never finance-specific.
 */
export const jtbdDrill: FreeTextDrill = {
  drillId: 'jtbd',
  scenario: 'SaaS · discovery',
  prompt: 'Write the Job this user is hiring your product to do.',
  briefTitle: 'The user',
  brief:
    'Maya is a marketing analyst at a 60-person B2B SaaS company. Every Monday she rebuilds the same campaign-performance report by hand in a spreadsheet, pulling numbers from three dashboards. Her VP asks for it before the 9am standup. She has tried two analytics tools but went back to the spreadsheet because she could not trust the numbers.',
  fields: [
    {
      key: 'situation',
      label: 'When… (situation — a concrete trigger, not "when I use the app")',
      placeholder:
        'e.g., it is Monday morning and my VP needs the campaign report before standup',
      multiline: true,
      rows: 2,
    },
    {
      key: 'motivation',
      label: '…I want to (motivation — the job, not the feature)',
      placeholder:
        'e.g., pull the numbers together once and trust they are right',
      multiline: true,
      rows: 2,
    },
    {
      key: 'outcome',
      label: '…so I can (outcome — what the user gains)',
      placeholder: 'e.g., walk into standup without scrambling or second-guessing',
      multiline: true,
      rows: 2,
    },
  ],
  preview: (v: FreeTextValues) =>
    `When ${v.situation?.trim() || '[situation]'}, I want to ${
      v.motivation?.trim() || '[motivation]'
    }, so I can ${v.outcome?.trim() || '[outcome]'}.`,
  composeInput: (v: FreeTextValues) =>
    `When ${v.situation?.trim()}, I want to ${v.motivation?.trim()}, so I can ${v.outcome?.trim()}.`,
  buildContext: () => ({
    persona:
      'Maya, marketing analyst at a 60-person B2B SaaS company; rebuilds a weekly campaign report by hand; abandoned two analytics tools over trust in the numbers.',
  }),
  isReady: (v: FreeTextValues) =>
    Boolean(v.situation?.trim() && v.motivation?.trim() && v.outcome?.trim()),
};
