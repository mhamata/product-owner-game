// @vitest-environment jsdom
import { useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Action, GameState, PBI, Scenario } from '@/engine/types';
import { createGame, step } from '@/engine';
import { calculateScore } from '@/engine/score';
import { deriveJobMarketOffers } from '@/engine/board';
import { makeScenario } from '@/engine/__tests__/fixtures';
import { SimTabs } from '../SimTabs';
import { useDecisionLogStore } from '@/store/decisionLogStore';
import { useMetricsHistoryStore } from '@/store/metricsHistoryStore';

// jsdom doesn't implement matchMedia; only exercised if a review flow renders
// (not on this test's happy path, but harmless to stub defensively like
// InboxTurn.test.tsx does).
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const backlogItem: PBI = {
  id: 'pbi-1',
  title: 'Ship the widget',
  kind: 'customer',
  effort: 3,
  effortRevealed: 3,
  value: 500,
  satisfies: [],
  requires: [],
  productId: 'pbi-1',
};

function testScenario(): Scenario {
  return makeScenario({
    id: 'sim-tabs-test',
    name: 'Relay',
    totalIterations: 3,
    initialBacklog: [backlogItem],
  });
}

/** Mirrors SimRunner's bootstrap + auto-execute-on-committed, same harness style as InboxTurn.test.tsx. */
function Harness({ scenario }: { scenario: Scenario }) {
  const [state, setState] = useState<GameState>(() => createGame(scenario, 'seed-1'));
  if (state.phase === 'committed') {
    setState(step(state, { type: 'execute-iteration' }, scenario));
  }
  const dispatch = (a: Action) => setState((s) => step(s, a, scenario));
  const score = calculateScore(state, scenario);
  return <SimTabs state={state} scenario={scenario} score={score} dispatch={dispatch} industry="saas" />;
}

describe('SimTabs', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDecisionLogStore.setState({ entries: [], interviewStories: {} });
    useMetricsHistoryStore.setState({ history: [] });
  });

  it('mounts InboxTurn as the default Standup tab', () => {
    render(<Harness scenario={testScenario()} />);
    expect(screen.getByRole('tab', { name: /Standup/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Decision')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Commit Sprint 1/i })).toBeInTheDocument();
  });

  it('shows all three tabs in the tab bar', () => {
    render(<Harness scenario={testScenario()} />);
    expect(screen.getByRole('tab', { name: /Standup/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Product/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Season/i })).toBeInTheDocument();
  });

  it('switches to the Product tab and renders the metric tiles + district map', () => {
    render(<Harness scenario={testScenario()} />);
    fireEvent.click(screen.getByRole('tab', { name: /Product/i }));
    expect(screen.getByRole('tab', { name: /Product/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Team morale')).toBeInTheDocument();
    expect(screen.getByText('Tech debt')).toBeInTheDocument();
    expect(screen.getByText('Reliability')).toBeInTheDocument();
    // The one PBI in this scenario becomes its own district.
    expect(screen.getByText('Ship the widget')).toBeInTheDocument();
    // The analyst-view pane renders unconditionally now (self-study ruling,
    // 2026-07-16) — no fog/lock treatment left, just a smoke check it's there.
    expect(screen.getByText('Cohort retention curves')).toBeInTheDocument();
  });

  it('switches to the Season tab and renders the live-run Season screen (W3-F)', () => {
    render(<Harness scenario={testScenario()} />);
    fireEvent.click(screen.getByRole('tab', { name: /Season/i }));
    expect(screen.getByRole('tab', { name: /Season/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Board confidence')).toBeInTheDocument();
    expect(screen.getByText('Your people')).toBeInTheDocument();
    // The deterministic 5-role roster (people.ts) always includes an eng lead.
    expect(screen.getByText('Engineering Lead')).toBeInTheDocument();
    expect(screen.getByText('Your evidence, so far this run')).toBeInTheDocument();
    // Mid-run: the job market is still locked.
    expect(screen.getByText(/Offers open at season.s end/i)).toBeInTheDocument();
  });

  it('shows the fired full-screen beat first, then reveals the Season tab with offers open on "See your offers"', () => {
    const scenario = testScenario();
    const base = createGame(scenario, 'seed-1');
    const state: GameState = {
      ...base,
      phase: 'fired',
      iterationNumber: 2,
      board: { ...base.board!, confidence: 20, firedAtSprint: 2 },
    };
    const score = calculateScore(state, scenario);
    const expectedOffers = deriveJobMarketOffers(state, scenario, 'saas');

    render(<SimTabs state={state} scenario={scenario} score={score} dispatch={() => {}} industry="saas" />);

    // The beat, not the tab shell, is what renders first.
    expect(screen.getByText('The board let you go.')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /See your offers/i }));

    // Dismissing the beat reveals the tab shell, already on Season, offers open.
    expect(screen.getByRole('tab', { name: /Season/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText(/Offers open at season.s end/i)).not.toBeInTheDocument();
    expect(screen.getByText(expectedOffers[0].company)).toBeInTheDocument();
  });

  it('leads the Season tab with the QBR summary + open job market once the run is "complete"', () => {
    const scenario = testScenario();
    const base = createGame(scenario, 'seed-1');
    const state: GameState = { ...base, phase: 'complete', iterationNumber: scenario.totalIterations };
    const score = calculateScore(state, scenario);
    const expectedOffers = deriveJobMarketOffers(state, scenario, 'saas');

    render(<SimTabs state={state} scenario={scenario} score={score} dispatch={() => {}} industry="saas" />);
    fireEvent.click(screen.getByRole('tab', { name: /Season/i }));

    expect(screen.getByText('Quarterly Business Review · Season complete')).toBeInTheDocument();
    expect(screen.queryByText(/Offers open at season.s end/i)).not.toBeInTheDocument();
    expect(screen.getByText(expectedOffers[0].company)).toBeInTheDocument();
  });

  it('switching back to Standup still shows the live InboxTurn planning flow', () => {
    render(<Harness scenario={testScenario()} />);
    fireEvent.click(screen.getByRole('tab', { name: /Product/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Standup/i }));
    expect(screen.getByRole('tab', { name: /Standup/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /Commit Sprint 1/i })).toBeInTheDocument();
  });

  it('committing on Standup, then checking Product, still lands the district as investing/built once resolved', () => {
    render(<Harness scenario={testScenario()} />);
    // Plan + commit sprint 1 (same flow as InboxTurn.test.tsx). Scoped to the
    // open Plan sheet: with every tab mounted (not just Standup), the same
    // PBI title also renders as a Product-tab district tile, so an unscoped
    // query would match twice.
    fireEvent.click(screen.getByText('Decision'));
    const planSheet = screen.getByRole('dialog');
    fireEvent.click(within(planSheet).getByText('Ship the widget'));
    fireEvent.click(screen.getByRole('button', { name: /Done planning/i }));
    fireEvent.click(screen.getByRole('button', { name: /Commit Sprint 1/i }));
    const sheet = screen.getByRole('dialog', { name: 'Commit Sprint 1' });
    fireEvent.click(within(sheet).getByRole('button', { name: /Commit Sprint 1/i }));

    fireEvent.click(screen.getByRole('tab', { name: /Product/i }));
    // The single PBI shipped this sprint, so its district is no longer "not built".
    expect(screen.queryByText('not built')).not.toBeInTheDocument();
  });
});
