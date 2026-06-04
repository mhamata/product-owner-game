import type { FreeTextValues } from './types';

/**
 * User Interviews drill (The Mom Test) — STRUCTURAL CORE (industry-neutral).
 *
 * Free-text, LLM-graded. The learner writes ONE interview question that passes
 * the Mom Test: it asks about concrete past behaviour, stays specific, and never
 * pitches the idea or asks a hypothetical.
 *
 * As with the other free-text drills there is no client-side answer key —
 * grading is the rubric verdict from `/api/grade`, keyed SERVER-SIDE by
 * `drillId`. The industry-invariant structure is the `drillId`, the single field
 * key + shape, and the compose/ready logic. The goal/scenario copy is DISPLAY
 * (`./momTest.display`). The industry changes which product the learner is
 * researching, never how the question is graded.
 */

export type MomTestFieldKey = 'question';

export interface MomTestFieldShape {
  key: MomTestFieldKey;
  multiline: boolean;
  rows: number;
}

export interface MomTestStructure {
  drillId: 'mom-test';
  fields: MomTestFieldShape[];
  composeInput: (values: FreeTextValues) => string;
  isReady: (values: FreeTextValues) => boolean;
}

export const momTestStructure: MomTestStructure = {
  drillId: 'mom-test',
  fields: [{ key: 'question', multiline: true, rows: 3 }],
  composeInput: (v) => v.question?.trim() ?? '',
  isReady: (v) => (v.question?.trim().length ?? 0) >= 12,
};
