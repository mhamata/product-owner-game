import type { FreeTextDrill, FreeTextValues } from './types';

/**
 * PR-FAQ drill — free-text, LLM-graded.
 *
 * The learner writes the press-release opener (headline + subtitle + summary)
 * for an Amazon-style PR-FAQ, framing a customer benefit rather than a feature.
 * /api/grade scores it. Generic SaaS framing (a developer platform), never
 * finance-specific.
 */
const ASSIGNMENT =
  'Write the press-release opener for "Insights API v2" — a new analytics platform that lets product teams query their own usage data in seconds instead of filing a request with the data team and waiting days. Audience for the PR: product managers, engineering leaders, and the tech press.';

export const prFaqDrill: FreeTextDrill = {
  drillId: 'pr-faq',
  scenario: 'SaaS · launch comms',
  prompt: 'Write the press-release opener — lead with the customer benefit, not the feature.',
  briefTitle: 'Assignment',
  brief: ASSIGNMENT,
  fields: [
    {
      key: 'headline',
      label: 'Headline (one line — a customer benefit, not the feature name)',
      placeholder:
        'e.g., Product teams get answers from their data in seconds, not days',
      multiline: false,
    },
    {
      key: 'subtitle',
      label: 'Subtitle (who, specifically, is this for?)',
      placeholder:
        'e.g., Self-serve analytics for product managers at teams without a dedicated data engineer',
      multiline: false,
    },
    {
      key: 'summary',
      label: 'Summary (3–4 sentences — the problem in the customer’s voice)',
      placeholder:
        'Previously, getting a simple usage number meant filing a ticket and waiting for the data team…',
      multiline: true,
      rows: 5,
    },
  ],
  composeInput: (v: FreeTextValues) =>
    `HEADLINE:\n${v.headline?.trim() ?? ''}\n\nSUBTITLE:\n${
      v.subtitle?.trim() ?? ''
    }\n\nSUMMARY:\n${v.summary?.trim() ?? ''}`,
  buildContext: () => ({ assignment: ASSIGNMENT }),
  isReady: (v: FreeTextValues) =>
    Boolean(v.headline?.trim() && v.subtitle?.trim()) &&
    (v.summary?.trim().length ?? 0) >= 50,
};
