// @vitest-environment jsdom
import { useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Action, EventCard, GameState, PBI, Scenario } from '@/engine/types';
import { createGame, step, calculateScore } from '@/engine';
import { makeScenario } from '@/engine/__tests__/fixtures';
import { InboxTurn } from '../InboxTurn';
import { useDecisionLogStore, runIdFor } from '@/store/decisionLogStore';

// jsdom does not implement matchMedia. OutcomeStep -> useReducedMotion (an
// existing, unmodified hook) reads it via useSyncExternalStore, so the
// post-cliffhanger review flow needs a minimal stub to render in tests.
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

/**
 * InboxTurn is the Sim 2.0 (W2-D) presentation that REPLACES SimRunner's old
 * linear 6-step flow. No render-level tests existed for the old
 * PlanStep/PreviewStep/ShipStep/EventStep/DebriefStep/SimRunner stepper (the
 * repo had zero component-render tests before this slice — only pure-logic
 * tests, e.g. competency.test.ts). This file is the first render-level
 * coverage for the sim UI, written fresh against the new structure, and
 * exercises the same behaviors the ledger asked for: real action dispatch
 * (through the actual engine reducer, not a mock), and decision-log capture
 * (through the actual decisionLogStore, not a mock).
 *
 * The harness below plays the role SimRunner + gameStore play in production:
 * it owns a GameState in React state, dispatches through the real `step()`
 * reducer, and auto-fires `execute-iteration` on `committed` — the exact
 * effect SimRunner.tsx keeps. This gives end-to-end coverage of one full
 * turn (plan -> commit -> event resolution -> cliffhanger -> peek -> outcome
 * -> debrief -> advance -> next turn's recap) without mocking the engine.
 */

const backlogItem: PBI = {
  id: 'pbi-1',
  title: 'Ship the widget',
  kind: 'customer',
  effort: 3,
  effortRevealed: 3,
  value: 500,
  satisfies: [],
  requires: [],
};

const forcedEvent: EventCard = {
  id: 'evt-1',
  category: 'stakeholder',
  baseWeight: 1,
  trigger: 'forced',
  forcedAtIteration: 1,
  narrative: 'Dana wants SSO committed this quarter.',
  options: [
    {
      id: 'opt-commit',
      label: 'Commit to it',
      visibleConsequence: 'Capacity takes a hit next sprint.',
      effects: [{ kind: 'capacity-baseline', delta: -2 }],
    },
    {
      id: 'opt-decline',
      label: 'Decline for now',
      visibleConsequence: 'Team morale holds steady.',
      effects: [{ kind: 'morale', delta: 1 }],
    },
  ],
};

function testScenario(overrides: Partial<Scenario> = {}): Scenario {
  return makeScenario({
    id: 'test-scenario',
    name: 'Relay',
    totalIterations: 2,
    initialBacklog: [backlogItem],
    eventDeck: [forcedEvent],
    ...overrides,
  });
}

/** Mirrors SimRunner: owns state, dispatches through the real reducer, and
 * auto-executes on `committed` — so this harness behaves like production. */
function Harness({ scenario }: { scenario: Scenario }) {
  const [state, setState] = useState<GameState>(() => createGame(scenario, 'seed-1'));

  // Mirrors SimRunner's real auto-execute effect (commit -> committed ->
  // execute-iteration -> review), but via React's "adjust state during
  // render" pattern — the same convention this codebase already uses (e.g.
  // StandupView's warm-up snapshot) — instead of a plain setState-in-effect,
  // so the test harness itself doesn't trip react-hooks/set-state-in-effect.
  if (state.phase === 'committed') {
    setState(step(state, { type: 'execute-iteration' }, scenario));
  }

  const dispatch = (a: Action) => setState((s) => step(s, a, scenario));
  const score = calculateScore(state, scenario);

  return <InboxTurn state={state} scenario={scenario} score={score} dispatch={dispatch} industry="saas" />;
}

/** Open the Plan sheet, add the one backlog item, and close it. */
function planTheOneItem() {
  fireEvent.click(screen.getByText('Decision'));
  fireEvent.click(screen.getByText('Ship the widget'));
  fireEvent.click(screen.getByRole('button', { name: /Done planning/i }));
}

/**
 * Open the Commit sheet, optionally fill in a rationale, and confirm. Scoped
 * with `within` because the commit BAR button and the sheet's CONFIRM button
 * share the same accessible name ("Commit Sprint N").
 */
function commitSprint(sprint: number, rationale?: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`Commit Sprint ${sprint}`, 'i') }));
  const sheet = screen.getByRole('dialog', { name: `Commit Sprint ${sprint}` });
  if (rationale) {
    fireEvent.change(within(sheet).getByLabelText(/Why\?/i), { target: { value: rationale } });
  }
  fireEvent.click(within(sheet).getByRole('button', { name: new RegExp(`Commit Sprint ${sprint}`, 'i') }));
}

describe('InboxTurn', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDecisionLogStore.setState({ entries: [], interviewStories: {} });
  });

  it('shows the Plan message as an undecided Decision, and the commit bar disabled, with an empty sprint', () => {
    render(<Harness scenario={testScenario()} />);
    expect(screen.getByText('Decision')).toBeInTheDocument();
    const commitButton = screen.getByRole('button', { name: /Commit Sprint 1/i });
    expect(commitButton).toBeDisabled();
    expect(screen.getByText('Pick at least one backlog item to commit.')).toBeInTheDocument();
  });

  it('opening the Plan message and adding a backlog item arms the commit bar (real add-to-iteration dispatch)', () => {
    render(<Harness scenario={testScenario()} />);
    // Open the Plan sheet.
    fireEvent.click(screen.getByText('Decision'));
    expect(screen.getByText(/What will the team build this sprint/i)).toBeInTheDocument();

    // Add the one backlog item — dispatches add-to-iteration through the real reducer.
    fireEvent.click(screen.getByText('Ship the widget'));

    // Close the sheet.
    fireEvent.click(screen.getByRole('button', { name: /Done planning/i }));

    const commitButton = screen.getByRole('button', { name: /Commit Sprint 1/i });
    expect(commitButton).toBeEnabled();
    expect(screen.getByText('Ready — review and commit.')).toBeInTheDocument();
  });

  it('committing captures a decision-log entry with the rationale, then surfaces the forced event as a message', () => {
    render(<Harness scenario={testScenario()} />);

    planTheOneItem();
    commitSprint(1, 'Widget is the highest-value item.');

    // decisionLogStore captured the commit-time entry (PR #10's wiring, reused
    // verbatim) BEFORE the engine advanced past planning.
    const runId = runIdFor('test-scenario', 'seed-1');
    const entries = useDecisionLogStore.getState().entriesForRun(runId);
    expect(entries).toHaveLength(1);
    expect(entries[0].rationale).toBe('Widget is the highest-value item.');
    expect(entries[0].backlogTitles).toEqual(['Ship the widget']);
    expect(entries[0].sprint).toBe(1);

    // The engine auto-executed (commit -> committed -> execute-iteration ->
    // review) and the forced event now shows as a new inbox message.
    expect(screen.getByText(/Dana wants SSO committed this quarter\./i)).toBeInTheDocument();
    // The generic sender fallback for an unauthored 'stakeholder' category
    // event resolves to the exec role (people.ts's deriveSenderRoleForCategory).
    expect(screen.getByText(/CEO \/ Board Rep/i)).toBeInTheDocument();
  });

  it('does not offer the launch-PRD moment when no release card is placed this sprint', () => {
    render(<Harness scenario={testScenario()} />);
    planTheOneItem();
    fireEvent.click(screen.getByRole('button', { name: /Commit Sprint 1/i }));
    const sheet = screen.getByRole('dialog', { name: 'Commit Sprint 1' });
    expect(within(sheet).queryByText(/Write the launch PRD/i)).not.toBeInTheDocument();
  });

  it('offers the optional launch-PRD moment when a release card is placed, and skipping it commits normally', () => {
    render(<Harness scenario={testScenario()} />);

    // Plan: add the one item AND place the release card (Sim 2.0 W5-J's gate
    // — engine/types.ts's `releaseCardPosition !== null`).
    fireEvent.click(screen.getByText('Decision'));
    fireEvent.click(screen.getByText('Ship the widget'));
    fireEvent.click(screen.getByRole('button', { name: /Ship a Release/i }));
    fireEvent.click(screen.getByRole('button', { name: /Done planning/i }));

    fireEvent.click(screen.getByRole('button', { name: /Commit Sprint 1/i }));
    const commitSheet = screen.getByRole('dialog', { name: 'Commit Sprint 1' });
    const prdButton = within(commitSheet).getByRole('button', { name: /Write the launch PRD/i });
    fireEvent.click(prdButton);

    // The launch-PRD sheet takes over (the commit sheet closes underneath it).
    const prdSheet = screen.getByRole('dialog', { name: 'Write the launch PRD' });
    expect(prdSheet).toBeInTheDocument();

    // Skip the moment: control returns to the commit sheet, unchanged.
    fireEvent.click(within(prdSheet).getByRole('button', { name: /Skip this moment/i }));
    const reopenedCommitSheet = screen.getByRole('dialog', { name: 'Commit Sprint 1' });
    expect(
      within(reopenedCommitSheet).getByRole('button', { name: /Write the launch PRD/i }),
    ).toBeInTheDocument();

    // Committing without grading logs no artifactGrade — identical to a run
    // that never places a release card at all.
    fireEvent.click(within(reopenedCommitSheet).getByRole('button', { name: 'Commit Sprint 1' }));
    const runId = runIdFor('test-scenario', 'seed-1');
    const entries = useDecisionLogStore.getState().entriesForRun(runId);
    expect(entries[0].artifactGrade).toBeUndefined();
    expect(entries[0].releaseCard).toBe('Release 🚀');
  });

  it('choosing an event option dispatches respond-to-event, logs the response, then shows the cliffhanger', () => {
    render(<Harness scenario={testScenario()} />);

    planTheOneItem();
    commitSprint(1);

    // Open the event's decision sheet and choose an option.
    fireEvent.click(screen.getByText(/Dana wants SSO committed this quarter\./i));
    const sheet = screen.getByRole('dialog', { name: /A decision landed on your desk/i });
    fireEvent.click(within(sheet).getByText('Decline for now'));

    // The response is folded into this sprint's decision-log entry.
    const runId = runIdFor('test-scenario', 'seed-1');
    const entry = useDecisionLogStore.getState().entriesForRun(runId)[0];
    expect(entry.eventResponses).toEqual([
      { event: 'Dana wants SSO committed this quarter.', choice: 'Decline for now' },
    ]);

    // With no pending events left, the cliffhanger takes over (results are
    // withheld by default — presentation, not engine, per design-sim-2.0.md §3).
    expect(screen.getByText('Sprint 1 is running.')).toBeInTheDocument();
    expect(screen.getByText('Results at your next standup.')).toBeInTheDocument();
  });

  it('"peek now" reveals the Outcome/Debrief, and advancing shows next sprint\'s recap', () => {
    render(<Harness scenario={testScenario()} />);

    planTheOneItem();
    commitSprint(1);
    fireEvent.click(screen.getByText(/Dana wants SSO committed this quarter\./i));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: /A decision landed on your desk/i })).getByText(
        'Decline for now',
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: /Peek at the results now/i }));
    expect(screen.getByText(/Here's why the numbers moved\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    expect(screen.getByText(/Where you stand after Sprint 1\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Start Sprint 2/i }));

    // Next sprint: back to a Plan message, with a recap of what just happened.
    expect(screen.getByText(/Previously on Relay/i)).toBeInTheDocument();
    expect(screen.getByText('Decision')).toBeInTheDocument();
  });

  it('renders a calm placeholder for the "fired" terminal phase instead of crashing (Sim 2.0 W2-C addition)', () => {
    const scenario = testScenario();
    const state: GameState = { ...createGame(scenario, 'seed-1'), phase: 'fired', iterationNumber: 4 };
    render(
      <InboxTurn
        state={state}
        scenario={scenario}
        score={calculateScore(state, scenario)}
        dispatch={() => {}}
        industry="saas"
      />,
    );
    expect(screen.getByText(/The board pulled the plug at Sprint 4/i)).toBeInTheDocument();
  });
});
