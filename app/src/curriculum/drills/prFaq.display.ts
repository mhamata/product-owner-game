import type { IndustryId } from '@/curriculum/industries';
import type { FreeTextDrill, FreeTextField } from './types';
import { prFaqStructure, type PrFaqFieldKey } from './prFaq';

/**
 * PR-FAQ drill: DISPLAY LAYER (per industry).
 *
 * Human-readable copy ONLY: scenario, prompt, the assignment, the three field
 * labels/placeholders, and the `assignment` context passed to the grader (the
 * same string as the brief). The `drillId`, field keys, and compose/ready logic
 * live in `./prFaq` and never change. The industry swaps the launch being
 * announced; the PR-FAQ rubric is identical. Mirrors
 * `@/scenarios/scenario01.display`.
 */

export interface PrFaqFieldCopy {
  label: string;
  placeholder: string;
}

export interface PrFaqDisplay {
  scenario: string;
  prompt: string;
  briefTitle: string;
  /** The assignment; also passed verbatim to the grader as context. */
  assignment: string;
  fields: Record<PrFaqFieldKey, PrFaqFieldCopy>;
}

const PROMPT =
  'Write the press-release opener. Lead with the customer benefit, not the feature.';
const BRIEF_TITLE = 'Assignment';
const LABELS: Record<PrFaqFieldKey, string> = {
  headline: 'Headline (one line: a customer benefit, not the feature name)',
  subtitle: 'Subtitle (who, specifically, is this for?)',
  summary: 'Summary (3-4 sentences: the problem in the customer’s voice)',
};

// ============================================================================
// SaaS: original content, ported verbatim from the legacy prFaqDrill.
// ============================================================================
const saas: PrFaqDisplay = {
  scenario: 'SaaS · launch comms',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  assignment:
    'Write the press-release opener for "Insights API v2", a new analytics platform that lets product teams query their own usage data in seconds instead of filing a request with the data team and waiting days. Audience for the PR: product managers, engineering leaders, and the tech press.',
  fields: {
    headline: {
      label: LABELS.headline,
      placeholder: 'e.g., Product teams get answers from their data in seconds, not days',
    },
    subtitle: {
      label: LABELS.subtitle,
      placeholder:
        'e.g., Self-serve analytics for product managers at teams without a dedicated data engineer',
    },
    summary: {
      label: LABELS.summary,
      placeholder:
        'Previously, getting a simple usage number meant filing a ticket and waiting for the data team…',
    },
  },
};

// ============================================================================
// Fintech: generic expense-management / spend platform (no brokerage/trading).
// ============================================================================
const fintech: PrFaqDisplay = {
  scenario: 'Fintech · launch comms',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  assignment:
    'Write the press-release opener for "Close in a Day", a new feature that lets finance teams reconcile and close the month in hours instead of waiting days for receipts and manual matching. Audience for the PR: finance ops managers, controllers, and the trade press.',
  fields: {
    headline: {
      label: LABELS.headline,
      placeholder: 'e.g., Finance teams close the month in hours, not days',
    },
    subtitle: {
      label: LABELS.subtitle,
      placeholder:
        'e.g., Automated reconciliation for finance teams without a dedicated systems analyst',
    },
    summary: {
      label: LABELS.summary,
      placeholder:
        'Previously, closing the month meant chasing receipts and matching transactions by hand for days…',
    },
  },
};

// ============================================================================
// Marketplace: two-sided marketplace connecting sellers & buyers.
// ============================================================================
const marketplace: PrFaqDisplay = {
  scenario: 'Marketplace · launch comms',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  assignment:
    'Write the press-release opener for "Seller Insights", a new dashboard that lets sellers see what is selling and what to restock in seconds instead of exporting spreadsheets and guessing. Audience for the PR: independent sellers, merchant-success teams, and the trade press.',
  fields: {
    headline: {
      label: LABELS.headline,
      placeholder: 'e.g., Sellers know what to restock in seconds, not spreadsheets',
    },
    subtitle: {
      label: LABELS.subtitle,
      placeholder:
        'e.g., Self-serve sales insights for independent sellers without an analyst on staff',
    },
    summary: {
      label: LABELS.summary,
      placeholder:
        'Previously, figuring out what was selling meant exporting a spreadsheet and guessing…',
    },
  },
};

// ============================================================================
// Consumer: habit-tracking / journaling app.
// ============================================================================
const consumer: PrFaqDisplay = {
  scenario: 'Consumer · launch comms',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  assignment:
    'Write the press-release opener for "Weekly Replay", a new feature that shows users a clear picture of their week in seconds instead of scrolling back through scattered entries. Audience for the PR: everyday users, lifestyle press, and app reviewers.',
  fields: {
    headline: {
      label: LABELS.headline,
      placeholder: 'e.g., See how your week really went in seconds, not by scrolling',
    },
    subtitle: {
      label: LABELS.subtitle,
      placeholder:
        'e.g., An automatic weekly recap for people building a daily habit',
    },
    summary: {
      label: LABELS.summary,
      placeholder:
        'Previously, reviewing your week meant scrolling back through scattered entries and piecing it together…',
    },
  },
};

// ============================================================================
// Healthcare: clinic-facing healthtech (patient intake & scheduling).
// ============================================================================
const healthcare: PrFaqDisplay = {
  scenario: 'Healthcare · launch comms',
  prompt: PROMPT,
  briefTitle: BRIEF_TITLE,
  assignment:
    'Write the press-release opener for "Front-Desk Insights", a new dashboard that lets clinic staff see no-shows and wait times in seconds instead of pulling reports by hand. Audience for the PR: practice managers, clinic operators, and the healthtech press.',
  fields: {
    headline: {
      label: LABELS.headline,
      placeholder: 'e.g., Clinics spot no-shows and bottlenecks in seconds, not reports',
    },
    subtitle: {
      label: LABELS.subtitle,
      placeholder:
        'e.g., Self-serve front-desk insights for clinics without an operations analyst',
    },
    summary: {
      label: LABELS.summary,
      placeholder:
        'Previously, understanding no-shows and wait times meant pulling reports by hand for days…',
    },
  },
};

/** All five PR-FAQ display packs, keyed by industry id. */
export const PR_FAQ_DISPLAY: Record<IndustryId, PrFaqDisplay> = {
  saas,
  fintech,
  marketplace,
  consumer,
  healthcare,
};

/**
 * Assemble the PR-FAQ drill for a given home industry: the shared field shapes
 * + grading logic with the industry's copy + assignment merged on. The
 * `drillId` and its rubric are unchanged.
 */
export function resolvePrFaqDrill(industry: IndustryId): FreeTextDrill {
  const display = PR_FAQ_DISPLAY[industry];
  const fields: FreeTextField[] = prFaqStructure.fields.map((shape) => {
    const copy = display.fields[shape.key as PrFaqFieldKey];
    return {
      key: shape.key,
      label: copy.label,
      placeholder: copy.placeholder,
      multiline: shape.multiline,
      ...(shape.rows !== undefined ? { rows: shape.rows } : {}),
    };
  });
  return {
    drillId: prFaqStructure.drillId,
    scenario: display.scenario,
    prompt: display.prompt,
    briefTitle: display.briefTitle,
    brief: display.assignment,
    fields,
    composeInput: prFaqStructure.composeInput,
    buildContext: () => ({ assignment: display.assignment }),
    isReady: prFaqStructure.isReady,
  };
}
