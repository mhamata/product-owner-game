import type {
  EventCard,
  EventEffect,
  EventOptionData,
  GameState,
  Scenario,
} from './types';
import { iterationPRNG } from './prng';
import { appendMemory, deriveMoodFromDelta, PERSON_MEMORY_TRUST_THRESHOLD } from './people';

export function selectEventsForIteration(state: GameState, scenario: Scenario): EventCard[] {
  const prng = iterationPRNG(state.seed, state.iterationNumber);
  const events: EventCard[] = [];

  const forced = scenario.eventDeck.filter(
    (e) => e.trigger === 'forced' && e.forcedAtIteration === state.iterationNumber,
  );
  events.push(...forced);

  const pool = scenario.eventDeck.filter(
    (e) => e.trigger === 'random' || e.trigger === 'weighted',
  );
  const firedIds = new Set(state.eventLog.map((l) => l.eventId));
  const available = pool.filter((e) => !firedIds.has(e.id));

  if (available.length > 0) {
    const weighted = available.map((e) => ({ event: e, weight: e.baseWeight }));
    const picked = weightedSample(weighted, prng);
    if (picked) events.push(picked);
  }

  return events;
}

function weightedSample<T>(
  items: Array<{ event: T; weight: number }>,
  prng: () => number,
): T | null {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total === 0) return null;
  let roll = prng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.event;
  }
  return items[items.length - 1].event;
}

export function applyEventEffects(state: GameState, effects: EventEffect[]): GameState {
  let next: GameState = {
    ...state,
    productBacklog: [...state.productBacklog],
    team: { ...state.team },
    tech: { ...state.tech, investmentsDone: [...state.tech.investmentsDone] },
    economy: { ...state.economy },
    customers: { ...state.customers },
    stakeholders: { ...state.stakeholders },
    // Optional: only clone if present. See types.ts GameState.people for why
    // this stays undefined-safe (old snapshots may not have a roster yet).
    people: state.people ? { ...state.people } : state.people,
    activePatterns: [...state.activePatterns],
    methodTags: [...state.methodTags],
  };

  for (const eff of effects) {
    switch (eff.kind) {
      case 'morale':
        next.team.morale = clamp(next.team.morale + eff.delta, 0, 10);
        break;
      case 'tech-debt':
        next.tech.techDebt = clamp(next.tech.techDebt + eff.delta, 0, 100);
        break;
      case 'trust': {
        const s = next.stakeholders[eff.stakeholderId];
        if (s) {
          next.stakeholders[eff.stakeholderId] = {
            ...s,
            trust: clamp(s.trust + eff.delta, 0, 10),
            lastInteraction: next.iterationNumber,
          };
        }
        break;
      }
      case 'person-trust': {
        const people = next.people;
        const p = people?.[eff.personId];
        if (people && p) {
          const before = p.trust;
          const trust = clamp(p.trust + eff.delta, 0, 100);
          const bigSwing = Math.abs(trust - before) >= PERSON_MEMORY_TRUST_THRESHOLD;
          const mood = deriveMoodFromDelta(p.mood, eff.delta);
          const memory = bigSwing
            ? appendMemory(p.memory, {
                sprint: next.iterationNumber,
                note:
                  trust > before
                    ? `Trust rose after iteration ${next.iterationNumber}.`
                    : `Trust dropped after iteration ${next.iterationNumber}.`,
              })
            : p.memory;
          next.people = { ...people, [eff.personId]: { ...p, trust, mood, memory } };
        }
        break;
      }
      case 'happiness': {
        const c = next.customers[eff.customerId];
        if (c) {
          next.customers[eff.customerId] = {
            ...c,
            happiness: clamp(c.happiness + eff.delta, 0, 10),
          };
        }
        break;
      }
      case 'revenue':
        next.economy.revenue += eff.delta;
        break;
      case 'capacity-baseline':
        next.tech.capacityBaseline = Math.max(5, next.tech.capacityBaseline + eff.delta);
        break;
      case 'headcount':
        next.team.headcount = Math.max(0, next.team.headcount + eff.delta);
        if (eff.delta > 0) next.team.onboarding += eff.delta;
        break;
      case 'add-pattern':
        next.activePatterns.push({
          tag: eff.tag,
          iteration: next.iterationNumber,
          confidence: 1.0,
          evidence: 'event-driven',
        });
        break;
      case 'add-pbi': {
        const exists = next.productBacklog.some((p) => p.id === eff.pbi.id);
        if (!exists) {
          next.productBacklog = [
            {
              ...eff.pbi,
              discoveredInIteration: next.iterationNumber,
              source: 'event',
            },
            ...next.productBacklog,
          ];
        }
        break;
      }
    }
  }
  return next;
}

export function findOption(card: EventCard, optionId: string): EventOptionData | null {
  return card.options.find((o) => o.id === optionId) ?? null;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
