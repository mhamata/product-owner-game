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
 * Render coverage for W4-G's two fog-of-war panes on the Product screen:
 * locked (fog treatment: dashed border, lock icon, unlock hint) vs unlocked
 * (real content) per gate, and that unlocking one gate never unlocks the
 * other. See `@/lib/fogOfWar.test.ts` for the pure gating-logic coverage and
 * `cohortCurves.test.ts` for the unlocked-content derivation coverage.
 */
describe('ProductMapScreen fog-of-war panes', () => {
  const scenario = makeScenario({ id: 'fog-test' });
  const state = makeState({ scenarioId: 'fog-test', seed: 'seed-1' });

  beforeEach(() => {
    window.localStorage.clear();
    useDecisionLogStore.setState({ entries: [], interviewStories: {} });
    useMetricsHistoryStore.setState({ history: [] });
    useLearnStore.getState().resetProgress();
  });

  it('renders both gates locked (fog treatment) when nothing is mastered', () => {
    render(<ProductMapScreen state={state} scenario={scenario} />);

    expect(screen.getByText(FOG_GATES['cohort-curves'].label)).toBeInTheDocument();
    expect(screen.getByText(FOG_GATES['decision-annotations-history'].label)).toBeInTheDocument();
    expect(screen.getByText(FOG_GATES['cohort-curves'].unlockHint)).toBeInTheDocument();
    expect(screen.getByText(FOG_GATES['decision-annotations-history'].unlockHint)).toBeInTheDocument();
    // Neither pane's real content is present yet.
    expect(screen.queryByText(/Not enough sprints recorded/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No rationale logged yet/)).not.toBeInTheDocument();
    expect(screen.queryAllByText('Unlocked')).toHaveLength(0);
  });

  it('the unlock hint links to the unlocking skill\'s learn route', () => {
    render(<ProductMapScreen state={state} scenario={scenario} />);
    const link = screen.getByText(FOG_GATES['cohort-curves'].unlockHint);
    expect(link.closest('a')).toHaveAttribute('href', `/learn/${FOG_GATES['cohort-curves'].unlockSkillOrCompetency}`);
  });

  it('mastering the cohort-curves skill unlocks ONLY that pane, showing its honest empty-history caption', () => {
    useLearnStore.getState().masterSkill(FOG_GATES['cohort-curves'].unlockSkillOrCompetency);
    render(<ProductMapScreen state={state} scenario={scenario} />);

    // Cohort pane: unlocked, locked hint gone, honest "no history yet" content shown.
    expect(screen.queryByText(FOG_GATES['cohort-curves'].unlockHint)).not.toBeInTheDocument();
    expect(screen.getByText(/Not enough sprints recorded yet this run/)).toBeInTheDocument();
    expect(screen.getAllByText('Unlocked')).toHaveLength(1);

    // The other gate stays locked.
    expect(screen.getByText(FOG_GATES['decision-annotations-history'].unlockHint)).toBeInTheDocument();
  });

  it('mastering the decision-annotations-history skill unlocks its pane and lists logged rationale', () => {
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

  it('tapping a listed decision-annotation history entry opens the same rationale detail sheet as the metric-tile dots', () => {
    useDecisionLogStore.setState({
      entries: [loggedEntry({ sprint: 2, rationale: 'Shipped the onboarding fix to unblock activation.' })],
      interviewStories: {},
    });
    useLearnStore.getState().masterSkill(FOG_GATES['decision-annotations-history'].unlockSkillOrCompetency);

    render(<ProductMapScreen state={state} scenario={scenario} />);
    fireEvent.click(screen.getByText('Sprint 2'));

    expect(screen.getByRole('dialog', { name: 'Sprint 2 — why' })).toBeInTheDocument();
    expect(screen.getByText('“Shipped the onboarding fix to unblock activation.”')).toBeInTheDocument();
  });

  it('mastering both gate skills unlocks both panes', () => {
    useLearnStore.getState().masterSkill(FOG_GATES['cohort-curves'].unlockSkillOrCompetency);
    useLearnStore.getState().masterSkill(FOG_GATES['decision-annotations-history'].unlockSkillOrCompetency);

    render(<ProductMapScreen state={state} scenario={scenario} />);

    expect(screen.getAllByText('Unlocked')).toHaveLength(2);
    expect(screen.queryByText(/Unlocks with/)).not.toBeInTheDocument();
  });
});
