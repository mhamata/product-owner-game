import { describe, it, expect } from 'vitest';
import type { GameState, Scenario } from '@/engine/types';
import { createGame, step, calculateScore } from '@/engine';
import { INDUSTRIES, type IndustryId } from '@/curriculum/industries';
import { getScenario, getScenarioForIndustry, registeredScenarioIds } from '..';
import { SIM_LADDER } from '../ladder';

const industries: IndustryId[] = INDUSTRIES.map((i) => i.id);

/**
 * Assert an assembled scenario is structurally complete: every display string
 * landed (no `undefined` titles/labels from a missing pack entry) and every
 * cross-reference (satisfies, trust/happiness effects) points at a real id.
 * This is the runtime backstop behind the per-scenario strict display types.
 */
function assertComplete(s: Scenario, ctx: string) {
  const customerIds = new Set(s.customers.map((c) => c.id));
  const stakeholderIds = new Set(s.stakeholders.map((x) => x.id));
  const allPbis = [...s.initialBacklog, ...(s.discoveryPool ?? [])];

  expect(s.totalIterations, `${ctx}: totalIterations`).toBeGreaterThan(0);
  expect(s.targetRevenue, `${ctx}: targetRevenue`).toBeGreaterThan(0);

  for (const pbi of allPbis) {
    expect(typeof pbi.title, `${ctx}: pbi ${pbi.id} title type`).toBe('string');
    expect((pbi.title ?? '').length, `${ctx}: pbi ${pbi.id} title non-empty`).toBeGreaterThan(0);
    for (const cid of pbi.satisfies) {
      expect(customerIds.has(cid), `${ctx}: pbi ${pbi.id} satisfies unknown customer ${cid}`).toBe(true);
    }
  }

  for (const c of s.customers) {
    expect((c.name ?? '').length, `${ctx}: customer ${c.id} name`).toBeGreaterThan(0);
  }
  for (const st of s.stakeholders) {
    expect((st.name ?? '').length, `${ctx}: stakeholder ${st.id} name`).toBeGreaterThan(0);
    expect((st.role ?? '').length, `${ctx}: stakeholder ${st.id} role`).toBeGreaterThan(0);
  }

  for (const ev of s.eventDeck) {
    expect((ev.narrative ?? '').length, `${ctx}: event ${ev.id} narrative`).toBeGreaterThan(0);
    expect(ev.options.length, `${ctx}: event ${ev.id} has options`).toBeGreaterThan(0);
    if (ev.trigger === 'forced') {
      expect(typeof ev.forcedAtIteration, `${ctx}: forced event ${ev.id} has iteration`).toBe('number');
    }
    for (const opt of ev.options) {
      expect((opt.label ?? '').length, `${ctx}: ${ev.id}/${opt.id} label`).toBeGreaterThan(0);
      expect(opt.label, `${ctx}: ${ev.id}/${opt.id} label not literally "undefined"`).not.toBe('undefined');
      expect(typeof opt.visibleConsequence, `${ctx}: ${ev.id}/${opt.id} consequence`).toBe('string');
      for (const eff of opt.effects) {
        if (eff.kind === 'trust') {
          expect(stakeholderIds.has(eff.stakeholderId), `${ctx}: ${ev.id}/${opt.id} trust -> ${eff.stakeholderId}`).toBe(true);
        }
        if (eff.kind === 'happiness') {
          expect(customerIds.has(eff.customerId), `${ctx}: ${ev.id}/${opt.id} happiness -> ${eff.customerId}`).toBe(true);
        }
        if (eff.kind === 'add-pbi') {
          expect((eff.pbi.title ?? '').length, `${ctx}: ${ev.id}/${opt.id} add-pbi ${eff.pbi.id} title`).toBeGreaterThan(0);
        }
      }
    }
  }
}

/**
 * Drive a scenario through the real engine to completion with a fixed seed,
 * always picking the first couple of backlog items and the first option on any
 * event. This exercises capacity, execution, events, discovery, and scoring on
 * every scenario, so a structurally valid but runtime-broken scenario fails here
 * rather than in a player's hands.
 */
function playToCompletion(scenario: Scenario): GameState {
  let s = createGame(scenario, 'smoke-seed');
  let guard = 0;
  while (s.phase !== 'complete' && guard < 80) {
    guard++;
    if (s.phase === 'planning') {
      for (const id of s.productBacklog.slice(0, 2).map((p) => p.id)) {
        s = step(s, { type: 'add-to-iteration', pbiId: id }, scenario);
      }
      s = step(s, { type: 'commit-iteration' }, scenario);
    } else if (s.phase === 'committed') {
      s = step(s, { type: 'execute-iteration' }, scenario);
    } else if (s.phase === 'review') {
      if (s.pendingEvents.length > 0) {
        const evId = s.pendingEvents[0];
        const card = scenario.eventDeck.find((e) => e.id === evId);
        s = card
          ? step(s, { type: 'respond-to-event', eventId: evId, optionId: card.options[0].id }, scenario)
          : { ...s, pendingEvents: s.pendingEvents.filter((x) => x !== evId) };
      } else {
        s = step(s, { type: 'advance-iteration' }, scenario);
      }
    }
  }
  return s;
}

describe('scenario ladder', () => {
  it('every ladder rung is a registered, resolvable scenario', () => {
    for (const rung of SIM_LADDER) {
      expect(registeredScenarioIds.includes(rung.scenarioId), `rung ${rung.scenarioId} registered`).toBe(true);
      expect(getScenario(rung.scenarioId), `rung ${rung.scenarioId} resolves`).toBeTruthy();
    }
  });

  it('assembles completely for every registered scenario in every industry', () => {
    for (const id of registeredScenarioIds) {
      for (const industry of industries) {
        const s = getScenarioForIndustry(id, industry);
        expect(s, `${id} @ ${industry} resolves`).toBeTruthy();
        if (s) assertComplete(s, `${id}@${industry}`);
      }
    }
  });

  it('produces structurally identical games across industries (same balance)', () => {
    // Two industries must differ only in copy, never in balance: same iteration
    // count, target, backlog efforts/values, and event triggers for a given id.
    for (const id of registeredScenarioIds) {
      const a = getScenarioForIndustry(id, industries[0]);
      const b = getScenarioForIndustry(id, industries[industries.length - 1]);
      if (!a || !b) continue;
      expect(a.totalIterations).toBe(b.totalIterations);
      expect(a.targetRevenue).toBe(b.targetRevenue);
      expect(a.initialBacklog.map((p) => `${p.id}:${p.effort}:${p.value}`)).toEqual(
        b.initialBacklog.map((p) => `${p.id}:${p.effort}:${p.value}`),
      );
      expect(a.eventDeck.map((e) => `${e.id}:${e.trigger}:${e.forcedAtIteration ?? '-'}`)).toEqual(
        b.eventDeck.map((e) => `${e.id}:${e.trigger}:${e.forcedAtIteration ?? '-'}`),
      );
    }
  });
});

describe('scenario engine smoke', () => {
  it('runs every registered scenario through the engine to completion with finite scores', () => {
    for (const id of registeredScenarioIds) {
      const scenario = getScenario(id);
      expect(scenario, `${id} resolves`).toBeTruthy();
      if (!scenario) continue;
      const end = playToCompletion(scenario);
      expect(end.phase, `${id} reaches complete`).toBe('complete');
      const score = calculateScore(end, scenario);
      for (const [k, v] of Object.entries(score)) {
        if (typeof v === 'number') {
          expect(Number.isFinite(v), `${id} score.${k} finite`).toBe(true);
        }
      }
    }
  });
});
