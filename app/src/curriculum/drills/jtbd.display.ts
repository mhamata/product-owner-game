import type { IndustryId } from '@/curriculum/industries';
import type { FreeTextDrill, FreeTextField } from './types';
import { jtbdStructure, type JtbdFieldKey } from './jtbd';

/**
 * JTBD drill: DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY: the scenario, prompt, brief/persona, per-field
 * labels + placeholders, and the persona `context` object passed to the grader.
 * The `drillId` (which selects the SERVER-SIDE rubric), the field keys, and the
 * compose/preview/ready logic live in `./jtbd` and never change. Changing the
 * industry swaps the persona the learner reasons about; the rubric that grades
 * the answer is identical. Mirrors `@/scenarios/scenario01.display`.
 *
 * Per-field copy keys derive from the structural field keys → the compiler
 * forces every pack to label every field.
 */

export interface JtbdFieldCopy {
  label: string;
  placeholder: string;
}

export interface JtbdDisplay {
  scenario: string;
  prompt: string;
  briefTitle: string;
  brief: string;
  fields: Record<JtbdFieldKey, JtbdFieldCopy>;
  /** Persona context passed alongside the answer to the grader. */
  context: { persona: string };
}

// ============================================================================
// SaaS: original content, ported verbatim from the legacy jtbdDrill.
// ============================================================================
const saas: JtbdDisplay = {
  scenario: 'SaaS · discovery',
  prompt: 'Write the Job this user is hiring your product to do.',
  briefTitle: 'The user',
  brief:
    'Maya is a marketing analyst at a 60-person B2B SaaS company. Every Monday she rebuilds the same campaign-performance report by hand in a spreadsheet, pulling numbers from three dashboards. Her VP asks for it before the 9am standup. She has tried two analytics tools but went back to the spreadsheet because she could not trust the numbers.',
  fields: {
    situation: {
      label: 'When… (situation: a concrete trigger, not "when I use the app")',
      placeholder:
        'e.g., it is Monday morning and my VP needs the campaign report before standup',
    },
    motivation: {
      label: '…I want to (motivation: the job, not the feature)',
      placeholder: 'e.g., pull the numbers together once and trust they are right',
    },
    outcome: {
      label: '…so I can (outcome: what the user gains)',
      placeholder: 'e.g., walk into standup without scrambling or second-guessing',
    },
  },
  context: {
    persona:
      'Maya, marketing analyst at a 60-person B2B SaaS company; rebuilds a weekly campaign report by hand; abandoned two analytics tools over trust in the numbers.',
  },
};

// ============================================================================
// Fintech: generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: JtbdDisplay = {
  scenario: 'Fintech · discovery',
  prompt: 'Write the Job this user is hiring your product to do.',
  briefTitle: 'The user',
  brief:
    'Maya is a finance ops manager at a 60-person company. Every Monday she rebuilds the same spend-by-team report by hand in a spreadsheet, pulling numbers from three systems. Her VP asks for it before the 9am standup. She has tried two expense tools but went back to the spreadsheet because she could not trust the numbers.',
  fields: {
    situation: {
      label: 'When… (situation: a concrete trigger, not "when I use the app")',
      placeholder:
        'e.g., it is Monday morning and my VP needs the spend report before standup',
    },
    motivation: {
      label: '…I want to (motivation: the job, not the feature)',
      placeholder: 'e.g., pull the numbers together once and trust they are right',
    },
    outcome: {
      label: '…so I can (outcome: what the user gains)',
      placeholder: 'e.g., walk into standup without scrambling or second-guessing',
    },
  },
  context: {
    persona:
      'Maya, finance ops manager at a 60-person company; rebuilds a weekly spend-by-team report by hand; abandoned two expense tools over trust in the numbers.',
  },
};

// ============================================================================
// Marketplace: two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: JtbdDisplay = {
  scenario: 'Marketplace · discovery',
  prompt: 'Write the Job this user is hiring your product to do.',
  briefTitle: 'The user',
  brief:
    'Maya runs a growing shop on your marketplace. Every Monday she rebuilds the same sales-and-payouts report by hand in a spreadsheet, pulling numbers from three screens. Her accountant needs it before their weekly call. She has tried two seller dashboards but went back to the spreadsheet because she could not trust the numbers.',
  fields: {
    situation: {
      label: 'When… (situation: a concrete trigger, not "when I use the app")',
      placeholder:
        'e.g., it is Monday morning and my accountant needs the sales report before our call',
    },
    motivation: {
      label: '…I want to (motivation: the job, not the feature)',
      placeholder: 'e.g., pull the numbers together once and trust they are right',
    },
    outcome: {
      label: '…so I can (outcome: what the user gains)',
      placeholder: 'e.g., walk into the call without scrambling or second-guessing',
    },
  },
  context: {
    persona:
      'Maya, an independent seller on a marketplace; rebuilds a weekly sales-and-payouts report by hand; abandoned two seller dashboards over trust in the numbers.',
  },
};

// ============================================================================
// Consumer: habit-tracking / journaling app.
// ============================================================================
const consumer: JtbdDisplay = {
  scenario: 'Consumer · discovery',
  prompt: 'Write the Job this user is hiring your product to do.',
  briefTitle: 'The user',
  brief:
    'Maya is trying to build a daily journaling habit. Every Sunday evening she tries to review how her week went, piecing it together from notes scattered across her phone. She wants to feel on top of her goals before the week starts. She has tried two habit apps but went back to scattered notes because she could never trust she had logged everything.',
  fields: {
    situation: {
      label: 'When… (situation: a concrete trigger, not "when I use the app")',
      placeholder:
        'e.g., it is Sunday evening and I want to review how my week actually went',
    },
    motivation: {
      label: '…I want to (motivation: the job, not the feature)',
      placeholder: 'e.g., see my week in one place and trust nothing is missing',
    },
    outcome: {
      label: '…so I can (outcome: what the user gains)',
      placeholder: 'e.g., start the new week feeling on top of my goals, not behind',
    },
  },
  context: {
    persona:
      'Maya, trying to build a journaling habit; pieces her week together from scattered phone notes; abandoned two habit apps because she could not trust she had logged everything.',
  },
};

// ============================================================================
// Healthcare: clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: JtbdDisplay = {
  scenario: 'Healthcare · discovery',
  prompt: 'Write the Job this user is hiring your product to do.',
  briefTitle: 'The user',
  brief:
    'Maya is a practice manager at a 6-provider clinic. Every Monday she rebuilds the same patient-flow and no-show report by hand in a spreadsheet, pulling numbers from three screens. Her lead physician asks for it before the weekly huddle. She has tried two scheduling tools but went back to the spreadsheet because she could not trust the numbers.',
  fields: {
    situation: {
      label: 'When… (situation: a concrete trigger, not "when I use the app")',
      placeholder:
        'e.g., it is Monday morning and the physician needs the no-show report before the huddle',
    },
    motivation: {
      label: '…I want to (motivation: the job, not the feature)',
      placeholder: 'e.g., pull the numbers together once and trust they are right',
    },
    outcome: {
      label: '…so I can (outcome: what the user gains)',
      placeholder: 'e.g., walk into the huddle without scrambling or second-guessing',
    },
  },
  context: {
    persona:
      'Maya, practice manager at a 6-provider clinic; rebuilds a weekly patient-flow and no-show report by hand; abandoned two scheduling tools over trust in the numbers.',
  },
};

/** All five JTBD display packs, keyed by industry id. */
export const JTBD_DISPLAY: Record<IndustryId, JtbdDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the JTBD drill for a given home industry: the shared field shapes +
 * grading logic with the industry's copy + persona merged on. The `drillId` and
 * the rubric it selects are unchanged, so grading is identical across
 * industries.
 */
export function resolveJtbdDrill(industry: IndustryId): FreeTextDrill {
  const display = JTBD_DISPLAY[industry];
  const fields: FreeTextField[] = jtbdStructure.fields.map((shape) => {
    const copy = display.fields[shape.key as JtbdFieldKey];
    return {
      key: shape.key,
      label: copy.label,
      placeholder: copy.placeholder,
      multiline: shape.multiline,
      rows: shape.rows,
    };
  });
  return {
    drillId: jtbdStructure.drillId,
    scenario: display.scenario,
    prompt: display.prompt,
    briefTitle: display.briefTitle,
    brief: display.brief,
    fields,
    composeInput: jtbdStructure.composeInput,
    buildContext: () => display.context,
    preview: jtbdStructure.preview,
    isReady: jtbdStructure.isReady,
  };
}
