import { describe, it, expect, beforeEach } from 'vitest';
import type { IterationOutcome, PBI } from '@/engine/types';
import {
  useDecisionLogStore,
  runIdFor,
  appendEntryPure,
  recordEventResponsePure,
  attachOutcomePure,
  selectEntriesForRun,
  clearRunPure,
  deriveOutcomeSummary,
  setInterviewStoriesPure,
  clearInterviewStoriesPure,
  setQbrMeetingPure,
  clearQbrMeetingPure,
  MAX_ENTRIES,
  type DecisionLogEntry,
  type NewDecisionLogEntry,
  type InterviewStoryRecord,
  type QBRMeetingRecord,
} from '../decisionLogStore';

/**
 * The decision log is the Career File's raw material: these tests pin its
 * pure contract (append/attach/select/cap) independent of React or
 * persistence, mirroring reviewStore's scheduler tests.
 */

function pbi(id: string, title: string, kind: PBI['kind'] = 'customer'): PBI {
  return {
    id,
    title,
    kind,
    effort: 3,
    effortRevealed: 3,
    value: 5,
    satisfies: [],
    requires: [],
  };
}

function outcome(overrides: Partial<IterationOutcome> = {}): IterationOutcome {
  return {
    iteration: 1,
    capacityRolled: 10,
    capacityRange: { lower: 8, expected: 10, upper: 12 },
    done: [],
    notDone: [],
    releasedProducts: [],
    revenueEarned: 0,
    techDebtDelta: 0,
    moraleDelta: 0,
    happinessDeltas: {},
    firedEvents: [],
    ...overrides,
  };
}

function newEntry(overrides: Partial<NewDecisionLogEntry> = {}): NewDecisionLogEntry {
  return {
    runId: runIdFor('scenario01', 'seed-1'),
    scenarioId: 'scenario01',
    industry: 'saas',
    sprint: 1,
    sprintGoal: 'Ship onboarding',
    backlogTitles: ['Item A', 'Item B'],
    releaseCard: null,
    rationale: null,
    ...overrides,
  };
}

describe('runIdFor', () => {
  it('pairs a scenario id and seed into one stable id', () => {
    expect(runIdFor('scenario01', 'abc')).toBe('scenario01::abc');
  });

  it('produces distinct ids for different seeds of the same scenario', () => {
    expect(runIdFor('scenario01', 'abc')).not.toBe(runIdFor('scenario01', 'def'));
  });
});

describe('appendEntryPure', () => {
  it('appends a new entry with committedAt, empty eventResponses, and null outcome', () => {
    const next = appendEntryPure([], newEntry(), '2026-07-12T00:00:00.000Z');
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      runId: runIdFor('scenario01', 'seed-1'),
      sprint: 1,
      sprintGoal: 'Ship onboarding',
      backlogTitles: ['Item A', 'Item B'],
      eventResponses: [],
      outcome: null,
      committedAt: '2026-07-12T00:00:00.000Z',
    });
  });

  it('preserves the optional rationale when provided', () => {
    const next = appendEntryPure([], newEntry({ rationale: 'Betting on retention over growth' }));
    expect(next[0].rationale).toBe('Betting on retention over growth');
  });

  it('preserves the optional artifactGrade when provided (the release-prep moment)', () => {
    const next = appendEntryPure([], newEntry({ artifactGrade: 82 }));
    expect(next[0].artifactGrade).toBe(82);
  });

  it('leaves artifactGrade undefined when not provided (no release-prep moment this sprint)', () => {
    const next = appendEntryPure([], newEntry());
    expect(next[0].artifactGrade).toBeUndefined();
  });

  it('caps total entries at MAX_ENTRIES, evicting the oldest first (FIFO)', () => {
    let entries: DecisionLogEntry[] = [];
    for (let i = 0; i < MAX_ENTRIES + 10; i += 1) {
      entries = appendEntryPure(entries, newEntry({ sprint: i }), `t${i}`);
    }
    expect(entries).toHaveLength(MAX_ENTRIES);
    // The first 10 appended (sprint 0..9) should have been evicted.
    expect(entries[0].sprint).toBe(10);
    expect(entries[entries.length - 1].sprint).toBe(MAX_ENTRIES + 9);
  });
});

describe('recordEventResponsePure', () => {
  it('appends a response to the latest entry of the matching run', () => {
    const runId = runIdFor('scenario01', 'seed-1');
    let entries = appendEntryPure([], newEntry({ runId, sprint: 1 }));
    entries = recordEventResponsePure(entries, runId, {
      event: 'A stakeholder pushes back on scope',
      choice: 'Hold the line',
    });
    expect(entries[0].eventResponses).toEqual([
      { event: 'A stakeholder pushes back on scope', choice: 'Hold the line' },
    ]);
  });

  it('targets the most recent entry when a run has multiple sprints logged', () => {
    const runId = runIdFor('scenario01', 'seed-1');
    let entries = appendEntryPure([], newEntry({ runId, sprint: 1 }));
    entries = appendEntryPure(entries, newEntry({ runId, sprint: 2 }));
    entries = recordEventResponsePure(entries, runId, { event: 'e', choice: 'c' });
    expect(entries[0].eventResponses).toEqual([]);
    expect(entries[1].eventResponses).toEqual([{ event: 'e', choice: 'c' }]);
  });

  it('is a no-op when the run has no entries yet', () => {
    const entries = recordEventResponsePure([], 'missing-run', { event: 'e', choice: 'c' });
    expect(entries).toEqual([]);
  });
});

describe('attachOutcomePure', () => {
  it('sets the outcome on the latest entry of the matching run', () => {
    const runId = runIdFor('scenario01', 'seed-1');
    let entries = appendEntryPure([], newEntry({ runId, sprint: 1 }));
    entries = attachOutcomePure(entries, runId, { summary: '2 items shipped, +$500 revenue' });
    expect(entries[0].outcome).toEqual({ summary: '2 items shipped, +$500 revenue' });
  });

  it('overwriting is idempotent-safe: calling twice keeps the latest value', () => {
    const runId = runIdFor('scenario01', 'seed-1');
    let entries = appendEntryPure([], newEntry({ runId, sprint: 1 }));
    entries = attachOutcomePure(entries, runId, { summary: 'first' });
    entries = attachOutcomePure(entries, runId, { summary: 'second' });
    expect(entries[0].outcome).toEqual({ summary: 'second' });
  });

  it('is a no-op when the run has no entries yet', () => {
    const entries = attachOutcomePure([], 'missing-run', { summary: 'x' });
    expect(entries).toEqual([]);
  });
});

describe('selectEntriesForRun / clearRunPure', () => {
  it('selects only entries for the given run, in commit order', () => {
    const runA = runIdFor('scenario01', 'seed-a');
    const runB = runIdFor('scenario01', 'seed-b');
    let entries = appendEntryPure([], newEntry({ runId: runA, sprint: 1 }));
    entries = appendEntryPure(entries, newEntry({ runId: runB, sprint: 1 }));
    entries = appendEntryPure(entries, newEntry({ runId: runA, sprint: 2 }));
    const forA = selectEntriesForRun(entries, runA);
    expect(forA.map((e) => e.sprint)).toEqual([1, 2]);
  });

  it('clears only the targeted run, leaving other runs intact', () => {
    const runA = runIdFor('scenario01', 'seed-a');
    const runB = runIdFor('scenario01', 'seed-b');
    let entries = appendEntryPure([], newEntry({ runId: runA }));
    entries = appendEntryPure(entries, newEntry({ runId: runB }));
    entries = clearRunPure(entries, runA);
    expect(entries).toHaveLength(1);
    expect(entries[0].runId).toBe(runB);
  });
});

describe('deriveOutcomeSummary', () => {
  it('reports shipped count with no slipped/revenue mentions on a clean sweep', () => {
    const o = outcome({ done: [pbi('a', 'Item A'), pbi('b', 'Item B')] });
    expect(deriveOutcomeSummary(o)).toBe('2 items shipped');
  });

  it('excludes the release-card PBI from the shipped count', () => {
    const o = outcome({ done: [pbi('a', 'Item A'), pbi('release-card', 'Release 🚀', 'release-card')] });
    expect(deriveOutcomeSummary(o)).toBe('1 item shipped');
  });

  it('includes slipped items when some did not fit', () => {
    const o = outcome({ done: [pbi('a', 'Item A')], notDone: [pbi('b', 'Item B')] });
    expect(deriveOutcomeSummary(o)).toBe('1 item shipped, 1 slipped');
  });

  it('excludes the release-card PBI from the slipped count, same as shipped', () => {
    const o = outcome({
      done: [pbi('a', 'Item A')],
      notDone: [pbi('b', 'Item B'), pbi('release-card', 'Release 🚀', 'release-card')],
    });
    expect(deriveOutcomeSummary(o)).toBe('1 item shipped, 1 slipped');
  });

  it('includes revenue and released-product counts only when non-zero', () => {
    const o = outcome({
      done: [pbi('a', 'Item A')],
      revenueEarned: 1200,
      releasedProducts: ['prod-1'],
    });
    expect(deriveOutcomeSummary(o)).toBe('1 item shipped, +$1,200 revenue, 1 product released');
  });

  it('never invents numbers not present on the outcome (a quiet, empty sprint)', () => {
    const o = outcome();
    expect(deriveOutcomeSummary(o)).toBe('0 items shipped');
  });
});

describe('useDecisionLogStore (wiring)', () => {
  beforeEach(() => useDecisionLogStore.getState().reset());

  it('appends, records an event response, and attaches an outcome end-to-end', () => {
    const runId = runIdFor('scenario01', 'seed-1');
    const store = useDecisionLogStore.getState();
    store.appendEntry(newEntry({ runId }));
    store.recordEventResponse(runId, { event: 'e', choice: 'c' });
    store.attachOutcome(runId, { summary: '1 item shipped' });

    const entries = useDecisionLogStore.getState().entriesForRun(runId);
    expect(entries).toHaveLength(1);
    expect(entries[0].eventResponses).toEqual([{ event: 'e', choice: 'c' }]);
    expect(entries[0].outcome).toEqual({ summary: '1 item shipped' });
  });

  it('clearRun removes only that run from the store', () => {
    const runA = runIdFor('scenario01', 'seed-a');
    const runB = runIdFor('scenario01', 'seed-b');
    const store = useDecisionLogStore.getState();
    store.appendEntry(newEntry({ runId: runA }));
    store.appendEntry(newEntry({ runId: runB }));
    store.clearRun(runA);
    expect(useDecisionLogStore.getState().entriesForRun(runA)).toEqual([]);
    expect(useDecisionLogStore.getState().entriesForRun(runB)).toHaveLength(1);
  });
});

/**
 * `interviewStories`: the persisted STAR-story drafts from `/api/interview-ammo`
 * (design-sim-2.0.md §2.4). Pure-helper coverage mirrors the pattern above, plus
 * a store-wiring case for `clearRun`'s cross-field cleanup.
 */
function story(overrides: Partial<InterviewStoryRecord> = {}): InterviewStoryRecord {
  return {
    title: 'Chose retention over a one-off ask',
    situation: 'Sales asked for a custom integration mid-sprint.',
    task: 'Decide whether to chase the one-off deal or protect the roadmap.',
    action: 'Pushed back and explained the retention bet already in flight.',
    result: 'Shipped the retention work; churn language matched the plan.',
    sprints: [3],
    draftedAt: '2026-07-12T00:00:00.000Z',
    ...overrides,
  };
}

describe('setInterviewStoriesPure', () => {
  it('sets the story list for a run with no prior stories', () => {
    const next = setInterviewStoriesPure({}, 'run-a', [story()]);
    expect(next).toEqual({ 'run-a': [story()] });
  });

  it('overwrites (does not merge/append) an existing run entry on redraft', () => {
    const first = setInterviewStoriesPure({}, 'run-a', [story({ title: 'Old draft' })]);
    const second = setInterviewStoriesPure(first, 'run-a', [story({ title: 'Fresh draft' })]);
    expect(second['run-a']).toHaveLength(1);
    expect(second['run-a'][0].title).toBe('Fresh draft');
  });

  it('leaves other runs untouched', () => {
    const state = setInterviewStoriesPure({ 'run-b': [story()] }, 'run-a', [story()]);
    expect(state['run-b']).toEqual([story()]);
    expect(state['run-a']).toEqual([story()]);
  });
});

describe('clearInterviewStoriesPure', () => {
  it('drops only the targeted run', () => {
    const state = clearInterviewStoriesPure({ 'run-a': [story()], 'run-b': [story()] }, 'run-a');
    expect(state).toEqual({ 'run-b': [story()] });
  });

  it('is a no-op (returns the same reference) when the run has no stories', () => {
    const input = { 'run-b': [story()] };
    expect(clearInterviewStoriesPure(input, 'run-a')).toBe(input);
  });
});

describe('useDecisionLogStore interviewStories (wiring)', () => {
  beforeEach(() => useDecisionLogStore.getState().reset());

  it('setInterviewStories persists and interviewStoriesForRun reads it back', () => {
    const runId = runIdFor('scenario01', 'seed-1');
    const store = useDecisionLogStore.getState();
    expect(store.interviewStoriesForRun(runId)).toEqual([]);

    store.setInterviewStories(runId, [story()]);
    expect(useDecisionLogStore.getState().interviewStoriesForRun(runId)).toEqual([story()]);
  });

  it('clearRun also drops that run’s drafted stories, leaving other runs intact', () => {
    const runA = runIdFor('scenario01', 'seed-a');
    const runB = runIdFor('scenario01', 'seed-b');
    const store = useDecisionLogStore.getState();
    store.appendEntry(newEntry({ runId: runA }));
    store.appendEntry(newEntry({ runId: runB }));
    store.setInterviewStories(runA, [story()]);
    store.setInterviewStories(runB, [story()]);

    store.clearRun(runA);

    expect(useDecisionLogStore.getState().interviewStoriesForRun(runA)).toEqual([]);
    expect(useDecisionLogStore.getState().interviewStoriesForRun(runB)).toEqual([story()]);
  });
});

/**
 * `qbrMeetings`: the persisted multi-party QBR meeting from `/api/qbr`
 * (design-sim-2.0.md §2.1/§2.4). Pure-helper coverage mirrors the
 * `interviewStories` pattern above, except a run holds exactly ONE meeting
 * (a plain overwrite, not a list).
 */
function meeting(overrides: Partial<QBRMeetingRecord> = {}): QBRMeetingRecord {
  return {
    turns: [
      { speakerId: 'person-exec', text: 'Confidence held, but barely.' },
      { speakerId: 'person-eng-lead', text: 'We paid down debt instead of chasing the sales ask.' },
    ],
    closingLine: 'The committee reads this as a season that held the line.',
    draftedAt: '2026-07-12T00:00:00.000Z',
    ...overrides,
  };
}

describe('setQbrMeetingPure', () => {
  it('sets the meeting for a run with no prior meeting', () => {
    const next = setQbrMeetingPure({}, 'run-a', meeting());
    expect(next).toEqual({ 'run-a': meeting() });
  });

  it('overwrites (does not merge) an existing run entry on reconvene', () => {
    const first = setQbrMeetingPure({}, 'run-a', meeting({ closingLine: 'Old verdict' }));
    const second = setQbrMeetingPure(first, 'run-a', meeting({ closingLine: 'Fresh verdict' }));
    expect(second['run-a'].closingLine).toBe('Fresh verdict');
  });

  it('leaves other runs untouched', () => {
    const state = setQbrMeetingPure({ 'run-b': meeting() }, 'run-a', meeting());
    expect(state['run-b']).toEqual(meeting());
    expect(state['run-a']).toEqual(meeting());
  });
});

describe('clearQbrMeetingPure', () => {
  it('drops only the targeted run', () => {
    const state = clearQbrMeetingPure({ 'run-a': meeting(), 'run-b': meeting() }, 'run-a');
    expect(state).toEqual({ 'run-b': meeting() });
  });

  it('is a no-op (returns the same reference) when the run has no meeting', () => {
    const input = { 'run-b': meeting() };
    expect(clearQbrMeetingPure(input, 'run-a')).toBe(input);
  });
});

describe('useDecisionLogStore qbrMeetings (wiring)', () => {
  beforeEach(() => useDecisionLogStore.getState().reset());

  it('setQbrMeeting persists and qbrMeetingForRun reads it back', () => {
    const runId = runIdFor('scenario01', 'seed-1');
    const store = useDecisionLogStore.getState();
    expect(store.qbrMeetingForRun(runId)).toBeNull();

    store.setQbrMeeting(runId, meeting());
    expect(useDecisionLogStore.getState().qbrMeetingForRun(runId)).toEqual(meeting());
  });

  it('clearRun also drops that run’s drafted QBR meeting, leaving other runs intact', () => {
    const runA = runIdFor('scenario01', 'seed-a');
    const runB = runIdFor('scenario01', 'seed-b');
    const store = useDecisionLogStore.getState();
    store.appendEntry(newEntry({ runId: runA }));
    store.appendEntry(newEntry({ runId: runB }));
    store.setQbrMeeting(runA, meeting());
    store.setQbrMeeting(runB, meeting());

    store.clearRun(runA);

    expect(useDecisionLogStore.getState().qbrMeetingForRun(runA)).toBeNull();
    expect(useDecisionLogStore.getState().qbrMeetingForRun(runB)).toEqual(meeting());
  });
});
