import type { FreeTextValues } from './types';

/**
 * Jobs-to-be-Done drill — STRUCTURAL CORE (industry-neutral).
 *
 * Free-text, LLM-graded. The learner writes a JTBD statement in the canonical
 * "When [situation], I want to [motivation], so I can [outcome]" form.
 *
 * "Answer-bearing" here is different from the deterministic drills: there is no
 * client-side answer key — grading is the rubric verdict from `/api/grade`,
 * keyed SERVER-SIDE by `drillId` (see `src/app/api/grade/route.ts`). So the
 * structure that must stay identical across industries is: the `drillId` (which
 * selects the rubric), the field KEYS + input shapes, and the pure
 * compose/preview/ready LOGIC that operates on those keys. The persona text and
 * all visible copy are DISPLAY and live in `./jtbd.display`. Changing the
 * industry changes the persona the learner writes about, never how the answer
 * is graded.
 */

/** The structural field keys — the keys every display pack must label. */
export type JtbdFieldKey = 'situation' | 'motivation' | 'outcome';

/** Field input shape (structural: which keys exist + how they render). */
export interface JtbdFieldShape {
  key: JtbdFieldKey;
  multiline: boolean;
  rows: number;
}

export interface JtbdStructure {
  drillId: 'jtbd';
  fields: JtbdFieldShape[];
  /** Live preview of the composed sentence. */
  preview: (values: FreeTextValues) => string;
  /** The string sent to the grader. */
  composeInput: (values: FreeTextValues) => string;
  /** True once the answer is substantial enough to submit. */
  isReady: (values: FreeTextValues) => boolean;
}

export const jtbdStructure: JtbdStructure = {
  drillId: 'jtbd',
  fields: [
    { key: 'situation', multiline: true, rows: 2 },
    { key: 'motivation', multiline: true, rows: 2 },
    { key: 'outcome', multiline: true, rows: 2 },
  ],
  preview: (v) =>
    `When ${v.situation?.trim() || '[situation]'}, I want to ${
      v.motivation?.trim() || '[motivation]'
    }, so I can ${v.outcome?.trim() || '[outcome]'}.`,
  composeInput: (v) =>
    `When ${v.situation?.trim()}, I want to ${v.motivation?.trim()}, so I can ${v.outcome?.trim()}.`,
  isReady: (v) =>
    Boolean(v.situation?.trim() && v.motivation?.trim() && v.outcome?.trim()),
};
