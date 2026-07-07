/**
 * Interview case registry, keyed by case id — the same two-line authoring
 * contract as artifacts and roleplay: import the case, list it, and the
 * runtime uniqueness check guards against id collisions.
 *
 * ⚠️ NEVER VALUE-IMPORT THIS BARREL FROM CLIENT COMPONENTS. It carries the
 * authored cases, whose `brief` fields are the case ANSWERS — a value import
 * bundles them into the browser JS. Client code takes values from the leaf
 * `./types` (caps, band helpers) and receives case metadata as props from a
 * server page that strips the brief. `import type` is erased and safe, but
 * point it at the leaf anyway so nobody converts it to a value import here.
 */
import type { InterviewCase } from './types';
import { psRenterMaintenance } from './ps-renter-maintenance';
import { exDauDrop } from './ex-dau-drop';

/** Every authored interview case, in picker order. */
export const ALL_INTERVIEW_CASES: InterviewCase[] = [
  psRenterMaintenance, // product-sense · design for renters
  exDauDrop, // execution · diagnose a metric drop
];

/** id -> case. Throws at module load on a duplicate id. */
export const INTERVIEW_CASES: Record<string, InterviewCase> = (() => {
  const map: Record<string, InterviewCase> = {};
  for (const c of ALL_INTERVIEW_CASES) {
    if (map[c.id]) throw new Error(`Duplicate interview case id "${c.id}"`);
    map[c.id] = c;
  }
  return map;
})();

/** The case for an id, or undefined when none exists. */
export function getInterviewCase(id: string): InterviewCase | undefined {
  return INTERVIEW_CASES[id];
}

export type {
  InterviewCase,
  InterviewDimension,
  InterviewKind,
  InterviewMessage,
  HiringBand,
} from './types';
export {
  MAX_CANDIDATE_TURNS,
  MIN_CANDIDATE_TURNS_TO_SCORE,
  MAX_INTERVIEW_MESSAGE_CHARS,
  countCandidateTurns,
  canInterviewReply,
  hiringBand,
  HIRING_BANDS,
} from './types';
