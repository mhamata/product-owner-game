// Sim 2.0 W1-A: the People roster (design-sim-2.0.md §2.1).
//
// A generic, always-5-role cast (eng lead / design / data / sales & CS /
// CEO-board rep), generated deterministically from a scenario id + seed (+
// optional industry flavour) so the SAME inputs always produce the SAME
// roster — same guarantee the rest of the engine's PRNG-driven state relies
// on for replays/challenge-links. See engine/types.ts for why this is net-new
// state rather than an extension of StakeholderState.
//
// Deliberately dependency-free of `@/curriculum/industries` (or anything else
// outside `engine/`): the engine stays a self-contained package that scenarios
// depend on, never the reverse. `industry` is accepted here as a plain string
// so callers (e.g. createGame, threaded from the UI's IndustryId) can pass
// their own type without this module importing it.

import type { EventCard, PBIKind, PersonMood, PersonRole, PersonState } from './types';
import { createPRNG } from './prng';

/** Every roster role, in the stable order the roster is generated/rendered. */
export const PERSON_ROLES: PersonRole[] = ['eng-lead', 'design', 'data', 'sales-cs', 'exec'];

/** Max PersonMemoryEntry count kept per person; oldest drops off (FIFO). */
export const PERSON_MEMORY_CAP = 8;

/**
 * Minimum |delta| a `person-trust` effect needs (post-clamp, actual change)
 * before it's worth burning a memory slot on. Small day-to-day drift doesn't
 * become a "consequence flag" — only swings a player would plausibly recall.
 */
export const PERSON_MEMORY_TRUST_THRESHOLD = 12;

/** Trust every generated person starts a run at (neutral-leaning-positive). */
export const PERSON_INITIAL_TRUST = 60;

const ROLE_LABELS: Record<PersonRole, string> = {
  'eng-lead': 'Engineering Lead',
  design: 'Design Lead',
  data: 'Data / Analytics',
  'sales-cs': 'Sales & Customer Success',
  exec: 'CEO / Board Rep',
};

export function roleLabel(role: PersonRole): string {
  return ROLE_LABELS[role];
}

// Name pools are deliberately disjoint from the customer/stakeholder names
// used in scenario display packs (maya/darren/priya/wei/aisha, ...) so a
// roster person is never confusable with a scenario-authored character.
const FIRST_NAMES: Record<PersonRole, string[]> = {
  'eng-lead': ['Sanjay', 'Elin', 'Marcus', 'Noor', 'Kofi', 'Ilya'],
  design: ['Yuki', 'Renata', 'Theo', 'Amara', 'Sven', 'Junko'],
  data: ['Priti', 'Owen', 'Lin', 'Bashir', 'Freya', 'Nadia'],
  'sales-cs': ['Carlos', 'Bianca', 'Trevor', 'Aiko', 'Femi', 'Rosa'],
  exec: ['Diane', 'Harlan', 'Simone', 'Otis', 'Greta', 'Reza'],
};

const LAST_NAMES = [
  'Okafor',
  'Lindqvist',
  'Petrova',
  'Nakamura',
  'Alvarez',
  'Fitzgerald',
  'Haddad',
  'Chen',
  'Kowalski',
  'Duarte',
  'Osei',
  'Berg',
];

const AGENDAS: Record<PersonRole, string[]> = {
  'eng-lead': [
    'Wants tech debt paid down before it compounds.',
    'Pushing for sustainable pace over heroics.',
    'Wants a real on-call rotation in place.',
  ],
  design: [
    'Wants research before another pivot.',
    'Fighting scope creep on the core flow.',
    'Wants a design system instead of one-offs.',
  ],
  data: [
    'Wants instrumentation before the next launch.',
    'Pushing to define the north-star metric.',
    'Wants a cohort view before the next big bet.',
  ],
  'sales-cs': [
    'Chasing the enterprise logo in the pipeline.',
    'Wants churn triaged before new features.',
    'Pushing for a public roadmap for prospects.',
  ],
  exec: [
    'Watching runway and the next board update.',
    'Wants a visible win before the quarter closes.',
    'Pushing for a clear story for investors.',
  ],
};

function pick<T>(pool: readonly T[], prng: () => number): T {
  const idx = Math.min(pool.length - 1, Math.floor(prng() * pool.length));
  return pool[idx];
}

function personId(role: PersonRole): string {
  return `person-${role}`;
}

/**
 * Deterministically generate the 5-person roster for a run. Same
 * scenarioId + seed (+ industry) always yields the same names/agendas; a
 * different seed (near-)always yields different ones. Pure — no I/O, no
 * mutation of inputs, safe to call repeatedly (e.g. lazily from step()).
 */
export function generatePeopleRoster(
  scenarioId: string,
  seed: string,
  industry?: string,
): Record<string, PersonState> {
  const roster: Record<string, PersonState> = {};
  for (const role of PERSON_ROLES) {
    const prng = createPRNG(`${scenarioId}::${seed}::${industry ?? 'default'}::person::${role}`);
    const first = pick(FIRST_NAMES[role], prng);
    const last = pick(LAST_NAMES, prng);
    const agenda = pick(AGENDAS[role], prng);
    const id = personId(role);
    roster[id] = {
      id,
      name: `${first} ${last}`,
      role,
      trust: PERSON_INITIAL_TRUST,
      mood: 'steady',
      agenda,
      memory: [],
    };
  }
  return roster;
}

/** `state.people` if present, else the deterministic roster for this run. */
export function ensurePeopleRoster(
  people: Record<string, PersonState> | undefined,
  scenarioId: string,
  seed: string,
  industry?: string,
): Record<string, PersonState> {
  return people ?? generatePeopleRoster(scenarioId, seed, industry);
}

/** Append a memory entry, capping at PERSON_MEMORY_CAP with FIFO eviction. */
export function appendMemory(
  memory: PersonState['memory'],
  entry: PersonState['memory'][number],
): PersonState['memory'] {
  const next = [...memory, entry];
  return next.length > PERSON_MEMORY_CAP ? next.slice(next.length - PERSON_MEMORY_CAP) : next;
}

/** Trust-swing-driven mood: only a decisive delta moves the needle. */
export function deriveMoodFromDelta(current: PersonMood, delta: number): PersonMood {
  if (delta <= -10) return 'strained';
  if (delta >= 10) return 'energized';
  return current;
}

// ---------------------------------------------------------------------------
// Sender derivation — "who does this decision/event come through," for the
// W2-D inbox UI. Pure, deterministic *mappings* (not seeded randomness): the
// same category/kind always resolves to the same role. An authored
// `EventCard.senderId` always wins; these are the generic fallback so every
// card resolves to *someone* even if the scenario author didn't set one.
// ---------------------------------------------------------------------------

/**
 * First-pass heuristic: capacity/backlog and infra live with eng; customer
 * and market signal reach the seller/CS lens; anything board/compliance-scale
 * escalates to the exec. Easy to tune per-category later without touching
 * callers (they only see the resolved person id).
 */
export function deriveSenderRoleForCategory(category: EventCard['category']): PersonRole {
  switch (category) {
    case 'team':
    case 'tech':
    case 'vendor':
      return 'eng-lead';
    case 'customer':
      return 'sales-cs';
    case 'market':
      return 'data';
    case 'stakeholder':
    case 'strategic':
    case 'regulatory':
      return 'exec';
    default:
      return 'exec';
  }
}

/** capacity/backlog PBIs read as coming from the eng lead; customer asks from
 * sales & CS; regulatory/release-timing decisions escalate to exec. */
export function deriveSenderRoleForPBIKind(kind: PBIKind): PersonRole {
  switch (kind) {
    case 'tech':
      return 'eng-lead';
    case 'customer':
      return 'sales-cs';
    case 'regulatory':
      return 'exec';
    case 'release-card':
      return 'eng-lead';
    default:
      return 'eng-lead';
  }
}

function findByRole(
  people: Record<string, PersonState> | undefined,
  role: PersonRole,
): PersonState | null {
  if (!people) return null;
  for (const id in people) {
    if (people[id].role === role) return people[id];
  }
  return null;
}

/** Resolve the roster person id an event category should be attributed to. */
export function deriveSenderIdForCategory(
  category: EventCard['category'],
  people: Record<string, PersonState> | undefined,
): string | null {
  return findByRole(people, deriveSenderRoleForCategory(category))?.id ?? null;
}

/** Resolve the roster person id a PBI kind should be attributed to. */
export function deriveSenderIdForPBI(
  kind: PBIKind,
  people: Record<string, PersonState> | undefined,
): string | null {
  return findByRole(people, deriveSenderRoleForPBIKind(kind))?.id ?? null;
}

/**
 * Resolve the sender for an event card: its authored `senderId` if set (and
 * present in the roster), else the category-derived fallback.
 */
export function deriveSenderIdForEvent(
  card: Pick<EventCard, 'category' | 'senderId'>,
  people: Record<string, PersonState> | undefined,
): string | null {
  if (card.senderId && people?.[card.senderId]) return card.senderId;
  return deriveSenderIdForCategory(card.category, people);
}
