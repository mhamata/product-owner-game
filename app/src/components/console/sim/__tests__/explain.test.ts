import { describe, it, expect } from 'vitest';
import type { GameState } from '@/engine/types';
import { makeState } from '@/engine/__tests__/fixtures';
import { summarizeEventEffects } from '../explain';

/**
 * `summarizeEventEffects` was moved here from EventStep.tsx's local, unexported
 * `summarizeEffects` (Sim 2.0 W2-D) so the new inbox decision sheets and the
 * (now superseded-but-kept) EventStep can share one implementation. These
 * tests pin its pre-existing behavior for every EventEffect kind, plus the
 * `board-confidence` kind added concurrently by W2-C, so a future edit to
 * either can't silently break the effect chips shown before a player chooses.
 */
function state(overrides: Partial<GameState> = {}): GameState {
  return makeState({
    stakeholders: {
      dana: { id: 'dana', name: 'Dana (Sales)', role: 'Sales', trust: 5, lastInteraction: 0 },
    },
    customers: {
      aisha: {
        id: 'aisha',
        name: 'Aisha (Enterprise)',
        archetype: 'enterprise',
        engagementState: 'active',
        happiness: 6,
        ltv: 500,
        lastFullRelease: null,
        consecutivePartial: 0,
        consecutiveNothing: 0,
      },
    },
    ...overrides,
  });
}

describe('summarizeEventEffects', () => {
  it('reads morale delta direction', () => {
    expect(summarizeEventEffects([{ kind: 'morale', delta: 2 }], state())).toEqual([
      { dir: 'up', label: 'team morale' },
    ]);
    expect(summarizeEventEffects([{ kind: 'morale', delta: -2 }], state())).toEqual([
      { dir: 'down', label: 'team morale' },
    ]);
  });

  it('inverts tech-debt direction (growth reads as "down", the bad direction)', () => {
    expect(summarizeEventEffects([{ kind: 'tech-debt', delta: 5 }], state())).toEqual([
      { dir: 'down', label: 'tech debt' },
    ]);
    expect(summarizeEventEffects([{ kind: 'tech-debt', delta: -5 }], state())).toEqual([
      { dir: 'up', label: 'tech debt' },
    ]);
  });

  it('names the stakeholder in a trust hint', () => {
    expect(summarizeEventEffects([{ kind: 'trust', stakeholderId: 'dana', delta: -3 }], state())).toEqual([
      { dir: 'down', label: 'Dana trust' },
    ]);
  });

  it('names the customer in a happiness hint', () => {
    expect(
      summarizeEventEffects([{ kind: 'happiness', customerId: 'aisha', delta: 1 }], state()),
    ).toEqual([{ dir: 'up', label: 'Aisha happiness' }]);
  });

  it('reads revenue, capacity, and headcount directions', () => {
    expect(summarizeEventEffects([{ kind: 'revenue', delta: 100 }], state())).toEqual([
      { dir: 'up', label: 'revenue' },
    ]);
    expect(summarizeEventEffects([{ kind: 'capacity-baseline', delta: -2 }], state())).toEqual([
      { dir: 'down', label: 'capacity' },
    ]);
    expect(summarizeEventEffects([{ kind: 'headcount', delta: 1 }], state())).toEqual([
      { dir: 'up', label: 'headcount' },
    ]);
  });

  it('gives add-pbi and add-pattern a neutral "flat" hint', () => {
    expect(
      summarizeEventEffects(
        [
          {
            kind: 'add-pbi',
            pbi: {
              id: 'new-1',
              title: 'New work',
              kind: 'customer',
              effort: 2,
              effortRevealed: 2,
              value: 100,
              satisfies: [],
              requires: [],
            },
          },
        ],
        state(),
      ),
    ).toEqual([{ dir: 'flat', label: 'new backlog item' }]);
    expect(summarizeEventEffects([{ kind: 'add-pattern', tag: 'skips_refinement' }], state())).toEqual([
      { dir: 'flat', label: 'notes a pattern' },
    ]);
  });

  it('names the roster role in a person-trust hint', () => {
    expect(
      summarizeEventEffects([{ kind: 'person-trust', personId: 'person-eng-lead', delta: 4 }], state()),
    ).toEqual([{ dir: 'up', label: 'Engineering Lead trust' }]);
    // Unknown/unmapped person id still degrades gracefully, never throws.
    expect(
      summarizeEventEffects([{ kind: 'person-trust', personId: 'person-unknown', delta: -1 }], state()),
    ).toEqual([{ dir: 'down', label: 'teammate trust' }]);
  });

  it('reads board-confidence direction (Sim 2.0 W2-C addition)', () => {
    expect(summarizeEventEffects([{ kind: 'board-confidence', delta: 5 }], state())).toEqual([
      { dir: 'up', label: 'board confidence' },
    ]);
    expect(summarizeEventEffects([{ kind: 'board-confidence', delta: -5 }], state())).toEqual([
      { dir: 'down', label: 'board confidence' },
    ]);
  });

  it('produces one hint per effect, in order, for a multi-effect option', () => {
    const hints = summarizeEventEffects(
      [
        { kind: 'morale', delta: -1 },
        { kind: 'trust', stakeholderId: 'dana', delta: 2 },
      ],
      state(),
    );
    expect(hints).toEqual([
      { dir: 'down', label: 'team morale' },
      { dir: 'up', label: 'Dana trust' },
    ]);
  });
});
