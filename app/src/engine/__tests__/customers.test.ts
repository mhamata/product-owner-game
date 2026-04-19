import { describe, it, expect } from 'vitest';
import type { CustomerState, PBI } from '../types';
import { updateCustomerStates, demoteState, promoteState } from '../customers';
import { makeState } from './fixtures';

function c(overrides: Partial<CustomerState>): CustomerState {
  return {
    id: 'c1',
    name: 'X',
    archetype: 'mainstream',
    engagementState: 'interested',
    happiness: 5,
    ltv: 100,
    lastFullRelease: null,
    consecutivePartial: 0,
    consecutiveNothing: 0,
    ...overrides,
  };
}

describe('updateCustomerStates', () => {
  it('churns on happiness=0', () => {
    const state = makeState({ customers: { c1: c({ happiness: 1 }) } });
    const { customers } = updateCustomerStates(state, [], []);
    expect(customers.c1.happiness).toBe(0);
    expect(customers.c1.engagementState).toBe('churned');
  });

  it('promotes engagement on full release', () => {
    const state = makeState({
      customers: { c1: c({ engagementState: 'interested', happiness: 5 }) },
    });
    const pbi: PBI = {
      id: 'a',
      title: 'a',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 100,
      satisfies: ['c1'],
      requires: [],
      productId: 'p1',
    };
    const { customers } = updateCustomerStates(state, [pbi], ['p1']);
    expect(customers.c1.engagementState).toBe('active');
    expect(customers.c1.happiness).toBe(10);
  });

  it('partial delivery: 3 in a row drops happiness', () => {
    const state = makeState({
      customers: { c1: c({ consecutivePartial: 2, happiness: 5 }) },
    });
    const pbi: PBI = {
      id: 'a',
      title: 'a',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 100,
      satisfies: ['c1'],
      requires: [],
    };
    const { customers } = updateCustomerStates(state, [pbi], []);
    expect(customers.c1.happiness).toBe(4);
  });

  it('skeptic drops faster', () => {
    const state = makeState({
      customers: {
        c1: c({ archetype: 'skeptic', consecutivePartial: 1, happiness: 5 }),
      },
    });
    const pbi: PBI = {
      id: 'a',
      title: 'a',
      kind: 'customer',
      effort: 3,
      effortRevealed: 3,
      value: 100,
      satisfies: ['c1'],
      requires: [],
    };
    const { customers } = updateCustomerStates(state, [pbi], []);
    // skeptic: consecutivePartial now 2, archetype penalty fires (-1)
    expect(customers.c1.happiness).toBe(4);
  });

  it('promote at top stays', () => {
    expect(promoteState('champion')).toBe('champion');
  });
  it('demote at bottom goes to disengaged', () => {
    expect(demoteState('dormant')).toBe('disengaged');
  });
});
