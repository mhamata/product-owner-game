import type { IndustryId } from '@/curriculum/industries';
import type { FreeTextDrill, FreeTextField } from './types';
import { momTestStructure, type MomTestFieldKey } from './momTest';

/**
 * Mom Test drill — DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY: scenario, prompt, brief, the single field's
 * label/placeholder, and the `goal` context passed to the grader. The
 * `drillId`, field key, and compose/ready logic live in `./momTest` and never
 * change. The industry swaps the product being researched; the Mom-Test rubric
 * is identical. Mirrors `@/scenarios/scenario01.display`.
 */

export interface MomTestFieldCopy {
  label: string;
  placeholder: string;
}

export interface MomTestDisplay {
  scenario: string;
  prompt: string;
  briefTitle: string;
  brief: string;
  fields: Record<MomTestFieldKey, MomTestFieldCopy>;
  context: { goal: string };
}

const PROMPT = 'Write one interview question that passes the Mom Test.';
const BRIEF_TITLE = 'The interview';
const FIELD_LABEL =
  'Your question (ask about real past behaviour — no "would you…")';

// ============================================================================
// SaaS — original content, ported verbatim from the legacy momTestDrill.
// ============================================================================
const saas: MomTestDisplay = {
  scenario: 'SaaS · discovery',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  brief:
    'You are building a tool to cut down the number of status meetings teams sit through. You have 30 minutes with a team lead at a prospective customer. You want to learn whether status meetings are actually a painful, recurring problem for them — without leading them or pitching your idea. Write the single best opening question to ask.',
  fields: {
    question: {
      label: FIELD_LABEL,
      placeholder:
        'e.g., Walk me through the last status meeting your team had — what happened and what did you do afterward?',
    },
  },
  context: {
    goal: 'Learn whether recurring status meetings are a real, painful problem for a prospective customer team lead, without pitching a meeting-reduction tool.',
  },
};

// ============================================================================
// Fintech — generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: MomTestDisplay = {
  scenario: 'Fintech · discovery',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  brief:
    'You are building a tool to cut down the time finance teams spend chasing receipts and reconciling expenses. You have 30 minutes with a finance ops manager at a prospective customer. You want to learn whether month-end reconciliation is actually a painful, recurring problem for them — without leading them or pitching your idea. Write the single best opening question to ask.',
  fields: {
    question: {
      label: FIELD_LABEL,
      placeholder:
        'e.g., Walk me through your last month-end close — where did the time go and what did you do about it?',
    },
  },
  context: {
    goal: 'Learn whether month-end expense reconciliation is a real, painful problem for a prospective finance ops manager, without pitching an expense tool.',
  },
};

// ============================================================================
// Marketplace — two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: MomTestDisplay = {
  scenario: 'Marketplace · discovery',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  brief:
    'You are building tools to help sellers fulfil orders faster. You have 30 minutes with a busy seller on a prospective marketplace. You want to learn whether order fulfilment is actually a painful, recurring problem for them — without leading them or pitching your idea. Write the single best opening question to ask.',
  fields: {
    question: {
      label: FIELD_LABEL,
      placeholder:
        'e.g., Walk me through the last order you shipped — what slowed you down and what did you do about it?',
    },
  },
  context: {
    goal: 'Learn whether order fulfilment is a real, painful problem for a prospective marketplace seller, without pitching a fulfilment tool.',
  },
};

// ============================================================================
// Consumer — habit-tracking / journaling app.
// ============================================================================
const consumer: MomTestDisplay = {
  scenario: 'Consumer · discovery',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  brief:
    'You are building an app to help people stick to daily habits. You have 30 minutes with someone who has tried and failed to keep a habit going. You want to learn whether losing momentum is actually a painful, recurring problem for them — without leading them or pitching your idea. Write the single best opening question to ask.',
  fields: {
    question: {
      label: FIELD_LABEL,
      placeholder:
        'e.g., Tell me about the last habit you tried to build — what happened the week it fell apart?',
    },
  },
  context: {
    goal: 'Learn whether losing momentum on a habit is a real, painful problem for someone who has tried before, without pitching a habit app.',
  },
};

// ============================================================================
// Healthcare — clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: MomTestDisplay = {
  scenario: 'Healthcare · discovery',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  brief:
    'You are building a tool to cut down the time clinic staff spend on patient intake paperwork. You have 30 minutes with a practice manager at a prospective clinic. You want to learn whether intake is actually a painful, recurring problem for them — without leading them or pitching your idea. Write the single best opening question to ask.',
  fields: {
    question: {
      label: FIELD_LABEL,
      placeholder:
        'e.g., Walk me through how your last new patient got checked in — where did the time go and what did you do about it?',
    },
  },
  context: {
    goal: 'Learn whether patient-intake paperwork is a real, painful problem for a prospective clinic practice manager, without pitching an intake tool.',
  },
};

/** All five Mom Test display packs, keyed by industry id. */
export const MOM_TEST_DISPLAY: Record<IndustryId, MomTestDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the Mom Test drill for a given home industry: the shared field shape
 * + grading logic with the industry's copy + goal merged on. The `drillId` and
 * its rubric are unchanged.
 */
export function resolveMomTestDrill(industry: IndustryId): FreeTextDrill {
  const display = MOM_TEST_DISPLAY[industry];
  const fields: FreeTextField[] = momTestStructure.fields.map((shape) => {
    const copy = display.fields[shape.key as MomTestFieldKey];
    return {
      key: shape.key,
      label: copy.label,
      placeholder: copy.placeholder,
      multiline: shape.multiline,
      rows: shape.rows,
    };
  });
  return {
    drillId: momTestStructure.drillId,
    scenario: display.scenario,
    prompt: display.prompt,
    briefTitle: display.briefTitle,
    brief: display.brief,
    fields,
    composeInput: momTestStructure.composeInput,
    buildContext: () => display.context,
    isReady: momTestStructure.isReady,
  };
}
