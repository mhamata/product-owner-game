import type { FreeTextValues } from './types';

/**
 * PR-FAQ drill — STRUCTURAL CORE (industry-neutral).
 *
 * Free-text, LLM-graded. The learner writes the press-release opener (headline +
 * subtitle + summary) for an Amazon-style PR-FAQ, framing a customer benefit
 * rather than a feature.
 *
 * No client-side answer key — `/api/grade` scores it with a rubric keyed
 * SERVER-SIDE by `drillId`. The industry-invariant structure is the `drillId`,
 * the three field keys + shapes, and the compose/ready logic. The assignment is
 * DISPLAY (`./prFaq.display`). The industry changes which launch is being
 * announced, never how the opener is graded.
 */

export type PrFaqFieldKey = 'headline' | 'subtitle' | 'summary';

export interface PrFaqFieldShape {
  key: PrFaqFieldKey;
  multiline: boolean;
  /** Rows for the textarea (only meaningful when multiline). */
  rows?: number;
}

export interface PrFaqStructure {
  drillId: 'pr-faq';
  fields: PrFaqFieldShape[];
  composeInput: (values: FreeTextValues) => string;
  isReady: (values: FreeTextValues) => boolean;
}

export const prFaqStructure: PrFaqStructure = {
  drillId: 'pr-faq',
  fields: [
    { key: 'headline', multiline: false },
    { key: 'subtitle', multiline: false },
    { key: 'summary', multiline: true, rows: 5 },
  ],
  composeInput: (v) =>
    `HEADLINE:\n${v.headline?.trim() ?? ''}\n\nSUBTITLE:\n${
      v.subtitle?.trim() ?? ''
    }\n\nSUMMARY:\n${v.summary?.trim() ?? ''}`,
  isReady: (v) =>
    Boolean(v.headline?.trim() && v.subtitle?.trim()) &&
    (v.summary?.trim().length ?? 0) >= 50,
};
