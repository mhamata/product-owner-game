import { describe, it, expect } from 'vitest';
import { createGame, step } from '../step';
import { applyEventEffects } from '../events';
import {
  PERSON_MEMORY_CAP,
  PERSON_ROLES,
  appendMemory,
  deriveSenderIdForCategory,
  deriveSenderIdForEvent,
  deriveSenderIdForPBI,
  deriveSenderRoleForCategory,
  deriveSenderRoleForPBIKind,
  generatePeopleRoster,
} from '../people';
import type { EventCard, GameState, PersonState } from '../types';
import { makeScenario, makeState } from './fixtures';

describe('generatePeopleRoster', () => {
  it('is deterministic: same scenarioId + seed always yields the same roster', () => {
    const a = generatePeopleRoster('turnaround', 'seed-alpha');
    const b = generatePeopleRoster('turnaround', 'seed-alpha');
    expect(a).toEqual(b);
  });

  it('produces the 5 canonical roles, each with a stable id', () => {
    const roster = generatePeopleRoster('turnaround', 'seed-alpha');
    expect(Object.keys(roster).sort()).toEqual(
      PERSON_ROLES.map((r) => `person-${r}`).sort(),
    );
    for (const role of PERSON_ROLES) {
      expect(roster[`person-${role}`].role).toBe(role);
    }
  });

  it('different seeds (near-)always yield different names', () => {
    // Compare across several seed pairs so this isn't sensitive to any one
    // pool-collision coincidence.
    const seeds = ['seed-1', 'seed-2', 'seed-3', 'seed-4', 'seed-5', 'seed-6'];
    const rosters = seeds.map((s) => generatePeopleRoster('turnaround', s));
    const signatures = rosters.map((r) =>
      PERSON_ROLES.map((role) => r[`person-${role}`].name).join('|'),
    );
    const uniqueSignatures = new Set(signatures);
    expect(uniqueSignatures.size).toBeGreaterThan(1);
  });

  it('different scenarioId (same seed) can also change the roster', () => {
    const a = generatePeopleRoster('turnaround', 'seed-alpha');
    const b = generatePeopleRoster('zero-to-one', 'seed-alpha');
    expect(a).not.toEqual(b);
  });

  it('starts every person at neutral trust, steady mood, and empty memory', () => {
    const roster = generatePeopleRoster('turnaround', 'seed-alpha');
    for (const role of PERSON_ROLES) {
      const p = roster[`person-${role}`];
      expect(p.trust).toBe(60);
      expect(p.mood).toBe('steady');
      expect(p.memory).toEqual([]);
      expect(typeof p.agenda).toBe('string');
      expect(p.agenda.length).toBeGreaterThan(0);
    }
  });
});

describe('appendMemory (FIFO cap)', () => {
  it('caps at PERSON_MEMORY_CAP, dropping the oldest entry first', () => {
    let memory: PersonState['memory'] = [];
    for (let i = 1; i <= PERSON_MEMORY_CAP + 3; i++) {
      memory = appendMemory(memory, { sprint: i, note: `note-${i}` });
    }
    expect(memory.length).toBe(PERSON_MEMORY_CAP);
    // Oldest 3 (sprint 1-3) should have been evicted; newest should remain.
    expect(memory[0].sprint).toBe(4);
    expect(memory[memory.length - 1].sprint).toBe(PERSON_MEMORY_CAP + 3);
  });

  it('does not mutate the input array', () => {
    const original: PersonState['memory'] = [{ sprint: 1, note: 'a' }];
    const next = appendMemory(original, { sprint: 2, note: 'b' });
    expect(original.length).toBe(1);
    expect(next.length).toBe(2);
  });
});

describe('applyEventEffects: person-trust', () => {
  function stateWithRoster(): GameState {
    const roster = generatePeopleRoster('test', 'seed-1');
    return makeState({ people: roster, iterationNumber: 3 });
  }

  it('clamps trust to [0, 100]', () => {
    const state = stateWithRoster();
    const high = applyEventEffects(state, [
      { kind: 'person-trust', personId: 'person-eng-lead', delta: 1000 },
    ]);
    expect(high.people!['person-eng-lead'].trust).toBe(100);

    const low = applyEventEffects(state, [
      { kind: 'person-trust', personId: 'person-eng-lead', delta: -1000 },
    ]);
    expect(low.people!['person-eng-lead'].trust).toBe(0);
  });

  it('appends a memory note on a big swing but not on a small one', () => {
    const state = stateWithRoster();
    const bigDrop = applyEventEffects(state, [
      { kind: 'person-trust', personId: 'person-design', delta: -20 },
    ]);
    expect(bigDrop.people!['person-design'].memory.length).toBe(1);
    expect(bigDrop.people!['person-design'].memory[0].sprint).toBe(3);
    expect(bigDrop.people!['person-design'].mood).toBe('strained');

    const smallBump = applyEventEffects(state, [
      { kind: 'person-trust', personId: 'person-design', delta: 3 },
    ]);
    expect(smallBump.people!['person-design'].memory.length).toBe(0);
    expect(smallBump.people!['person-design'].mood).toBe('steady');
  });

  it('is a no-op when the personId is unknown (does not throw)', () => {
    const state = stateWithRoster();
    expect(() =>
      applyEventEffects(state, [
        { kind: 'person-trust', personId: 'nobody', delta: 10 },
      ]),
    ).not.toThrow();
  });

  it('is a no-op when state.people is missing entirely (does not throw)', () => {
    const state = makeState(); // no `people`
    const result = applyEventEffects(state, [
      { kind: 'person-trust', personId: 'person-eng-lead', delta: 10 },
    ]);
    expect(result.people).toBeUndefined();
  });
});

describe('sender derivation', () => {
  it('maps every event category to one of the 5 canonical roles', () => {
    const categories: EventCard['category'][] = [
      'stakeholder',
      'team',
      'customer',
      'vendor',
      'market',
      'tech',
      'strategic',
      'regulatory',
    ];
    for (const category of categories) {
      expect(PERSON_ROLES).toContain(deriveSenderRoleForCategory(category));
    }
  });

  it('maps every PBI kind to one of the 5 canonical roles', () => {
    const kinds = ['customer', 'tech', 'regulatory', 'release-card'] as const;
    for (const kind of kinds) {
      expect(PERSON_ROLES).toContain(deriveSenderRoleForPBIKind(kind));
    }
  });

  it('resolves a category to an actual roster person id', () => {
    const roster = generatePeopleRoster('turnaround', 'seed-alpha');
    const id = deriveSenderIdForCategory('team', roster);
    expect(id).toBe('person-eng-lead');
  });

  it('resolves a PBI kind to an actual roster person id', () => {
    const roster = generatePeopleRoster('turnaround', 'seed-alpha');
    expect(deriveSenderIdForPBI('customer', roster)).toBe('person-sales-cs');
    expect(deriveSenderIdForPBI('tech', roster)).toBe('person-eng-lead');
    expect(deriveSenderIdForPBI('regulatory', roster)).toBe('person-exec');
  });

  it('returns null (not a throw) when people is undefined', () => {
    expect(deriveSenderIdForCategory('team', undefined)).toBeNull();
    expect(deriveSenderIdForPBI('tech', undefined)).toBeNull();
  });

  it('an authored card.senderId wins over the category derivation', () => {
    const roster = generatePeopleRoster('turnaround', 'seed-alpha');
    const card: Pick<EventCard, 'category' | 'senderId'> = {
      category: 'team', // would normally derive to eng-lead
      senderId: 'person-exec',
    };
    expect(deriveSenderIdForEvent(card, roster)).toBe('person-exec');
  });

  it('falls back to category derivation when senderId is unset or unknown', () => {
    const roster = generatePeopleRoster('turnaround', 'seed-alpha');
    expect(deriveSenderIdForEvent({ category: 'customer' }, roster)).toBe('person-sales-cs');
    expect(
      deriveSenderIdForEvent({ category: 'customer', senderId: 'ghost' }, roster),
    ).toBe('person-sales-cs');
  });
});

describe('old-snapshot backward compatibility', () => {
  it('createGame always populates people on a fresh game', () => {
    const scenario = makeScenario();
    const g = createGame(scenario, 'seed-1');
    expect(g.people).toBeDefined();
    expect(Object.keys(g.people!).length).toBe(PERSON_ROLES.length);
  });

  it('step() on a state missing `people` (pre-W1-A snapshot) does not crash and backfills it', () => {
    const scenario = makeScenario({ initialBacklog: [] });
    // Simulate an old persisted snapshot: no `people` key at all.
    const oldSnapshot: GameState = makeState({ scenarioId: scenario.id, seed: 'legacy-seed' });
    expect(oldSnapshot.people).toBeUndefined();

    const next = step(oldSnapshot, { type: 'set-sprint-goal', goal: 'ship it' }, scenario);
    expect(next.people).toBeDefined();
    expect(Object.keys(next.people!).length).toBe(PERSON_ROLES.length);
    expect(next.sprintGoal).toBe('ship it');
  });

  it('the backfilled roster matches what createGame would have produced for that scenario+seed', () => {
    const scenario = makeScenario({ id: 'turnaround', initialBacklog: [] });
    const oldSnapshot: GameState = makeState({ scenarioId: scenario.id, seed: 'legacy-seed' });
    const next = step(oldSnapshot, { type: 'set-sprint-goal', goal: 'x' }, scenario);
    const fresh = createGame(scenario, 'legacy-seed');
    expect(next.people).toEqual(fresh.people);
  });

  it('a full commit/execute/advance/respond-to-event cycle works fine without pre-seeded people', () => {
    const scenario = makeScenario({
      id: 'turnaround',
      initialBacklog: [],
      totalIterations: 2,
    });
    let g: GameState = makeState({ scenarioId: scenario.id, totalIterations: 2, seed: 'legacy' });
    expect(g.people).toBeUndefined();
    g = step(g, { type: 'commit-iteration' }, scenario);
    g = step(g, { type: 'execute-iteration' }, scenario);
    expect(g.phase).toBe('review');
    expect(g.people).toBeDefined();
    g = step(g, { type: 'advance-iteration' }, scenario);
    expect(g.phase).toBe('planning');
  });
});
