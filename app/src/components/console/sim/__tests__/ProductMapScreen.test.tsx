// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { makeScenario, makeState } from '@/engine/__tests__/fixtures';
import { ProductMapScreen } from '../ProductMapScreen';
import { useDecisionLogStore, runIdFor, type DecisionLogEntry } from '@/store/decisionLogStore';
import { useMetricsHistoryStore } from '@/store/metricsHistoryStore';
import { useLearnStore } from '@/store/learnStore';
import { FOG_GATES } from '@/lib/fogOfWar';

function loggedEntry(overrides: Partial<DecisionLogEntry> & Pick<DecisionLogEntry, 'sprint' | 'rationale'>): DecisionLogEntry {
  return {
    runId: runIdFor('fog-test', 'seed-1'),
    scenarioId: 'fog-test',
    industry: null,
    committedAt: new Date().toISOString(),
    sprintGoal: null,
    backlogTitles: [],
    releaseCard: null,
    eventResponses: [],
    outcome: null,
    ...overrides,
  };
}

/**
 * Render coverage for W4-G's two "analyst view" panes on the Product screen.
 *
 * SELF-STUDY RULING (2026-07-16, Mike): both panes render their real content
 * UNCONDITIONALLY now — there is no fog/lock treatment left to test. The one
 * remaining behavior worth pinning is the "sharpen this" hint chip: present
 * (and linking to the right /learn route) while the mapped skill is
 * unmastered, gone once it's mastered. See `@/lib/fogOfWar.test.ts` for the
 * registry's pure copy coverage and `cohortCurves.test.ts` for the unlocked-
 * content derivation coverage.
 */
describe('ProductMapScreen analyst-view panes', () => {
  const scenario = makeScenario({ id: 'fog-test' });
  const state = makeState({ scenarioId: 'fog-test', seed: 'seed-1' });

  beforeEach(() => {
    window.localStorage.clear();
    useDecisionLogStore.setState({ entries: [], interviewStories: {} });
    useMetricsHistoryStore.setState({ history: [] });
    useLearnStore.getState().resetProgress();
  });

  it('renders both panes with real content even when nothing is mastered', () => {
    render(<ProductMapScreen state={state} scenario={scenario} />);

    expect(screen.getByText(FOG_GATES['cohort-curves'].label)).toBeInTheDocument();
    expect(screen.getByText(FOG_GATES['decision-annotations-history'].label)).toBeInTheDocument();
    // Real content, not a fog/blur placeholder — the honest empty states.
    expect(screen.getByText(/Not enough sprints recorded/)).toBeInTheDocument();
    expect(screen.getByText(/No rationale logged yet/)).toBeInTheDocument();
    // Both hint chips show while their mapped skill is unmastered.
    expect(screen.getByText(FOG_GATES['cohort-curves'].unlockHint)).toBeInTheDocument();
    expect(screen.getByText(FOG_GATES['decision-annotations-history'].unlockHint)).toBeInTheDocument();
  });

  it("the hint chip links to the mapped skill's learn route", () => {
    render(<ProductMapScreen state={state} scenario={scenario} />);
    const link = screen.getByText(FOG_GATES['cohort-curves'].unlockHint);
    expect(link.closest('a')).toHaveAttribute('href', `/learn/${FOG_GATES['cohort-curves'].unlockSkillOrCompetency}`);
  });

  it('mastering the cohort-curves skill removes ONLY that pane\'s hint chip', () => {
    useLearnStore.getState().masterSkill(FOG_GATES['cohort-curves'].unlockSkillOrCompetency);
    render(<ProductMapScreen state={state} scenario={scenario} />);

    // Cohort pane: hint chip gone, real content still there (honest "no
    // history yet" — mastery doesn't fabricate sprint history).
    expect(screen.queryByText(FOG_GATES['cohort-curves'].unlockHint)).not.toBeInTheDocument();
    expect(screen.getByText(/Not enough sprints recorded yet this run/)).toBeInTheDocument();

    // The other pane's chip is unaffected.
    expect(screen.getByText(FOG_GATES['decision-annotations-history'].unlockHint)).toBeInTheDocument();
  });

  it('mastering the decision-annotations-history skill removes its hint chip', () => {
    useDecisionLogStore.setState({
      entries: [loggedEntry({ sprint: 1, rationale: 'Paying down checkout debt before the enterprise renewal.' })],
      interviewStories: {},
    });
    useLearnStore.getState().masterSkill(FOG_GATES['decision-annotations-history'].unlockSkillOrCompetency);

    render(<ProductMapScreen state={state} scenario={scenario} />);

    expect(screen.queryByText(FOG_GATES['decision-annotations-history'].unlockHint)).not.toBeInTheDocument();
    expect(screen.getByText(/Paying down checkout debt before the enterprise renewal\./)).toBeInTheDocument();
    expect(screen.getByText('Sprint 1')).toBeInTheDocument();
  });

  it('the decision-annotation history is browsable with ZERO mastery — logged rationale is never gated', () => {
    useDecisionLogStore.setState({
      entries: [loggedEntry({ sprint: 2, rationale: 'Shipped the onboarding fix to unblock activation.' })],
      interviewStories: {},
    });
    // Deliberately no masterSkill call: content must be reachable regardless.

    render(<ProductMapScreen state={state} scenario={scenario} />);
    fireEvent.click(screen.getByText('Sprint 2'));

    expect(screen.getByRole('dialog', { name: 'Sprint 2 — why' })).toBeInTheDocument();
    expect(screen.getByText('“Shipped the onboarding fix to unblock activation.”')).toBeInTheDocument();
  });

  it('mastering both gate skills removes both hint chips', () => {
    useLearnStore.getState().masterSkill(FOG_GATES['cohort-curves'].unlockSkillOrCompetency);
    useLearnStore.getState().masterSkill(FOG_GATES['decision-annotations-history'].unlockSkillOrCompetency);

    render(<ProductMapScreen state={state} scenario={scenario} />);

    expect(screen.queryByText(/Sharpen this:/)).not.toBeInTheDocument();
  });
});
