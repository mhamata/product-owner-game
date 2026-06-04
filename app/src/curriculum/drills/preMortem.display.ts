import type { IndustryId } from '@/curriculum/industries';
import type { FreeTextDrill, FreeTextField } from './types';
import { preMortemStructure, type PreMortemFieldKey } from './preMortem';

/**
 * Pre-Mortem drill — DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY: scenario, prompt, the project brief, the four field
 * labels/placeholders, and the `project` context passed to the grader (the same
 * string as the brief). The `drillId`, field keys, and compose/ready logic live
 * in `./preMortem` and never change. The industry swaps the project at risk; the
 * coverage rubric is identical. Mirrors `@/scenarios/scenario01.display`.
 */

export interface PreMortemFieldCopy {
  label: string;
  placeholder: string;
}

export interface PreMortemDisplay {
  scenario: string;
  prompt: string;
  briefTitle: string;
  /** The project description — also passed verbatim to the grader as context. */
  project: string;
  fields: Record<PreMortemFieldKey, PreMortemFieldCopy>;
}

const PROMPT =
  'It is six months from now and the launch failed. Name four ways it went wrong.';
const BRIEF_TITLE = 'The project';
const LABELS: Record<PreMortemFieldKey, string> = {
  f1: 'Failure #1',
  f2: 'Failure #2',
  f3: 'Failure #3',
  f4: 'Failure #4',
};

// ============================================================================
// SaaS — original content, ported verbatim from the legacy preMortemDrill.
// ============================================================================
const saas: PreMortemDisplay = {
  scenario: 'SaaS · delivery risk',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  project:
    'Your team will replace the legacy monolith behind your SaaS product with a new microservices platform over two quarters. Team: 4 engineers + 1 QA. Success = no customer-facing downtime during cutover, p95 latency cut in half, and the migration finished before the next major customer onboards.',
  fields: {
    f1: {
      label: LABELS.f1,
      placeholder:
        'e.g., the cutover caused an hour of downtime during a customer’s peak window and they churned',
    },
    f2: {
      label: LABELS.f2,
      placeholder:
        'e.g., a shared platform team blocked an API change and we shipped on a forked version for weeks',
    },
    f3: {
      label: LABELS.f3,
      placeholder: 'e.g., the new services were faster but our on-call had no runbooks for them',
    },
    f4: {
      label: LABELS.f4,
      placeholder: 'e.g., leadership reprioritized us mid-migration and we were stuck half-cut-over',
    },
  },
};

// ============================================================================
// Fintech — generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: PreMortemDisplay = {
  scenario: 'Fintech · delivery risk',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  project:
    'Your team will replace the legacy monolith behind your expense-management product with a new microservices platform over two quarters. Team: 4 engineers + 1 QA. Success = no customer-facing downtime during cutover, p95 latency cut in half, and the migration finished before the next major customer onboards.',
  fields: {
    f1: {
      label: LABELS.f1,
      placeholder:
        'e.g., the cutover caused an hour of downtime during a customer’s month-end close and they churned',
    },
    f2: {
      label: LABELS.f2,
      placeholder:
        'e.g., a shared platform team blocked an API change and we shipped on a forked version for weeks',
    },
    f3: {
      label: LABELS.f3,
      placeholder: 'e.g., the new services were faster but our on-call had no runbooks for them',
    },
    f4: {
      label: LABELS.f4,
      placeholder: 'e.g., leadership reprioritized us mid-migration and we were stuck half-cut-over',
    },
  },
};

// ============================================================================
// Marketplace — two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: PreMortemDisplay = {
  scenario: 'Marketplace · delivery risk',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  project:
    'Your team will replace the legacy monolith behind your marketplace with a new microservices platform over two quarters. Team: 4 engineers + 1 QA. Success = no buyer- or seller-facing downtime during cutover, p95 latency cut in half, and the migration finished before the next peak shopping season.',
  fields: {
    f1: {
      label: LABELS.f1,
      placeholder:
        'e.g., the cutover caused an hour of downtime during a peak sales window and top sellers left',
    },
    f2: {
      label: LABELS.f2,
      placeholder:
        'e.g., a shared platform team blocked an API change and we shipped on a forked version for weeks',
    },
    f3: {
      label: LABELS.f3,
      placeholder: 'e.g., the new services were faster but our on-call had no runbooks for them',
    },
    f4: {
      label: LABELS.f4,
      placeholder: 'e.g., leadership reprioritized us mid-migration and we were stuck half-cut-over',
    },
  },
};

// ============================================================================
// Consumer — habit-tracking / journaling app.
// ============================================================================
const consumer: PreMortemDisplay = {
  scenario: 'Consumer · delivery risk',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  project:
    'Your team will replace the legacy backend behind your consumer app with a new microservices platform over two quarters. Team: 4 engineers + 1 QA. Success = no user-facing downtime during cutover, p95 latency cut in half, and the migration finished before the new-year sign-up surge.',
  fields: {
    f1: {
      label: LABELS.f1,
      placeholder:
        'e.g., the cutover dropped users’ streaks during the new-year surge and they uninstalled',
    },
    f2: {
      label: LABELS.f2,
      placeholder:
        'e.g., a shared platform team blocked an API change and we shipped on a forked version for weeks',
    },
    f3: {
      label: LABELS.f3,
      placeholder: 'e.g., the new services were faster but our on-call had no runbooks for them',
    },
    f4: {
      label: LABELS.f4,
      placeholder: 'e.g., leadership reprioritized us mid-migration and we were stuck half-cut-over',
    },
  },
};

// ============================================================================
// Healthcare — clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: PreMortemDisplay = {
  scenario: 'Healthcare · delivery risk',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  project:
    'Your team will replace the legacy monolith behind your clinic platform with a new microservices platform over two quarters. Team: 4 engineers + 1 QA. Success = no clinic-facing downtime during cutover, p95 latency cut in half, and the migration finished before the next multi-clinic customer onboards.',
  fields: {
    f1: {
      label: LABELS.f1,
      placeholder:
        'e.g., the cutover caused an hour of downtime during morning clinic hours and a customer churned',
    },
    f2: {
      label: LABELS.f2,
      placeholder:
        'e.g., a shared platform team blocked an API change and we shipped on a forked version for weeks',
    },
    f3: {
      label: LABELS.f3,
      placeholder: 'e.g., the new services were faster but our on-call had no runbooks for them',
    },
    f4: {
      label: LABELS.f4,
      placeholder: 'e.g., leadership reprioritized us mid-migration and we were stuck half-cut-over',
    },
  },
};

/** All five Pre-Mortem display packs, keyed by industry id. */
export const PRE_MORTEM_DISPLAY: Record<IndustryId, PreMortemDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the Pre-Mortem drill for a given home industry: the shared field
 * shapes + grading logic with the industry's copy + project merged on. The
 * `drillId` and its coverage rubric are unchanged.
 */
export function resolvePreMortemDrill(industry: IndustryId): FreeTextDrill {
  const display = PRE_MORTEM_DISPLAY[industry];
  const fields: FreeTextField[] = preMortemStructure.fields.map((shape) => {
    const copy = display.fields[shape.key as PreMortemFieldKey];
    return {
      key: shape.key,
      label: copy.label,
      placeholder: copy.placeholder,
      multiline: shape.multiline,
      rows: shape.rows,
    };
  });
  return {
    drillId: preMortemStructure.drillId,
    scenario: display.scenario,
    prompt: display.prompt,
    briefTitle: display.briefTitle,
    brief: display.project,
    fields,
    composeInput: preMortemStructure.composeInput,
    buildContext: () => ({ project: display.project }),
    isReady: preMortemStructure.isReady,
  };
}
