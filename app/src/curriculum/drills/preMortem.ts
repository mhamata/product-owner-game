import type { FreeTextDrill, FreeTextValues } from './types';

/**
 * Pre-Mortem drill — free-text, LLM-graded.
 *
 * The learner imagines the project has already failed and names four distinct
 * failure modes, aiming for breadth across categories (technical, organizational,
 * stakeholder, market, adoption). /api/grade scores the coverage. Generic SaaS
 * framing (a platform re-architecture), never finance-specific.
 */
const PROJECT =
  'Your team will replace the legacy monolith behind your SaaS product with a new microservices platform over two quarters. Team: 4 engineers + 1 QA. Success = no customer-facing downtime during cutover, p95 latency cut in half, and the migration finished before the next major customer onboards.';

export const preMortemDrill: FreeTextDrill = {
  drillId: 'pre-mortem',
  scenario: 'SaaS · delivery risk',
  prompt: 'It is six months from now and the launch failed. Name four ways it went wrong.',
  briefTitle: 'The project',
  brief: PROJECT,
  fields: [
    {
      key: 'f1',
      label: 'Failure #1',
      placeholder:
        'e.g., the cutover caused an hour of downtime during a customer’s peak window and they churned',
      multiline: true,
      rows: 2,
    },
    {
      key: 'f2',
      label: 'Failure #2',
      placeholder:
        'e.g., a shared platform team blocked an API change and we shipped on a forked version for weeks',
      multiline: true,
      rows: 2,
    },
    {
      key: 'f3',
      label: 'Failure #3',
      placeholder: 'e.g., the new services were faster but our on-call had no runbooks for them',
      multiline: true,
      rows: 2,
    },
    {
      key: 'f4',
      label: 'Failure #4',
      placeholder: 'e.g., leadership reprioritized us mid-migration and we were stuck half-cut-over',
      multiline: true,
      rows: 2,
    },
  ],
  composeInput: (v: FreeTextValues) =>
    ['f1', 'f2', 'f3', 'f4']
      .map((k, i) => `${i + 1}. ${v[k]?.trim() ?? ''}`)
      .join('\n'),
  buildContext: () => ({ project: PROJECT }),
  isReady: (v: FreeTextValues) =>
    ['f1', 'f2', 'f3', 'f4'].every((k) => (v[k]?.trim().length ?? 0) >= 10),
};
