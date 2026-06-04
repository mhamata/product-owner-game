import type { FreeTextValues } from './types';

/**
 * Pre-Mortem drill: STRUCTURAL CORE (industry-neutral).
 *
 * Free-text, LLM-graded. The learner imagines the project has already failed and
 * names four distinct failure modes, aiming for breadth across categories
 * (technical, organizational, stakeholder, market, adoption).
 *
 * No client-side answer key. `/api/grade` scores coverage with a rubric keyed
 * SERVER-SIDE by `drillId`. The industry-invariant structure is the `drillId`,
 * the four field keys, and the compose/ready logic. The project brief is DISPLAY
 * (`./preMortem.display`). The industry changes which project is at risk, never
 * how coverage is graded.
 */

export type PreMortemFieldKey = 'f1' | 'f2' | 'f3' | 'f4';

/** The four field keys, in order: used by compose/ready and the display packs. */
export const PRE_MORTEM_FIELD_KEYS: PreMortemFieldKey[] = ['f1', 'f2', 'f3', 'f4'];

export interface PreMortemFieldShape {
  key: PreMortemFieldKey;
  multiline: boolean;
  rows: number;
}

export interface PreMortemStructure {
  drillId: 'pre-mortem';
  fields: PreMortemFieldShape[];
  composeInput: (values: FreeTextValues) => string;
  isReady: (values: FreeTextValues) => boolean;
}

export const preMortemStructure: PreMortemStructure = {
  drillId: 'pre-mortem',
  fields: PRE_MORTEM_FIELD_KEYS.map((key) => ({ key, multiline: true, rows: 2 })),
  composeInput: (v) =>
    PRE_MORTEM_FIELD_KEYS.map((k, i) => `${i + 1}. ${v[k]?.trim() ?? ''}`).join('\n'),
  isReady: (v) => PRE_MORTEM_FIELD_KEYS.every((k) => (v[k]?.trim().length ?? 0) >= 10),
};
