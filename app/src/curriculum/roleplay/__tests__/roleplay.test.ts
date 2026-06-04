import { describe, it, expect } from 'vitest';
import {
  ALL_ROLEPLAYS,
  ROLEPLAY_CONTENT,
  getRoleplayScenario,
  resolveRoleplay,
  countLearnerTurns,
  canReply,
  MAX_LEARNER_TURNS,
  MIN_LEARNER_TURNS_TO_SCORE,
  type RoleplayMessage,
  type RoleplayScenario,
} from '..';
import { getSkill } from '@/curriculum/data';
import { INDUSTRIES, INDUSTRY_NOUNS, type IndustryId } from '@/curriculum/industries';
import type { IndustryContext } from '@/curriculum/lessons/types';

/**
 * These tests guard the roleplay content layer the modality stands on, and the
 * server-enforced TURN CAP that keeps the public `reply` endpoint from being
 * looped without bound.
 *
 * Authoring a broken scenario (a skill id that does not exist, points at a
 * non-ready skill, a skill missing the 'roleplay' modality, or two scenarios
 * keyed to the same skill) should fail here, not surprise a learner. And the
 * turn-cap predicate is pinned directly, since it is the cost guardrail the route
 * relies on.
 */

const ALL_INDUSTRIES: IndustryId[] = INDUSTRIES.map((i) => i.id);
const DEFAULT_INDUSTRY: IndustryId = INDUSTRIES[0].id;

function ctxFor(id: IndustryId): IndustryContext {
  return {
    id,
    label: INDUSTRIES.find((i) => i.id === id)?.label ?? id,
    product: INDUSTRY_NOUNS[id].product,
    user: INDUSTRY_NOUNS[id].user,
  };
}

describe('roleplay registry', () => {
  it('keys ROLEPLAY_CONTENT by skillId and resolves via the helper', () => {
    for (const scenario of ALL_ROLEPLAYS) {
      expect(ROLEPLAY_CONTENT[scenario.skillId]).toBe(scenario);
      expect(getRoleplayScenario(scenario.skillId)).toBe(scenario);
    }
    expect(getRoleplayScenario('does-not-exist')).toBeUndefined();
  });

  it('ships the four influence scenarios', () => {
    const ids = ALL_ROLEPLAYS.map((r) => r.skillId).sort();
    expect(ids).toEqual(
      [
        'roleplay-customer-escalation',
        'roleplay-defend-roadmap',
        'roleplay-say-no',
        'roleplay-scope-cut',
      ].sort(),
    );
  });

  it('has no duplicate skill ids', () => {
    const ids = ALL_ROLEPLAYS.map((r) => r.skillId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects two scenarios keyed to the same skill id', () => {
    // The barrel builds its lookup by throwing on a duplicate skillId. Mirror that
    // reduction here and confirm it throws, so the guarantee is tested even though
    // the real ALL_ROLEPLAYS is (correctly) duplicate-free.
    const buildMap = (list: RoleplayScenario[]) => {
      const map: Record<string, RoleplayScenario> = {};
      for (const r of list) {
        if (map[r.skillId]) {
          throw new Error(`Duplicate roleplay for skillId "${r.skillId}"`);
        }
        map[r.skillId] = r;
      }
      return map;
    };

    const dupe = ALL_ROLEPLAYS[0];
    expect(() => buildMap([dupe, dupe])).toThrow(/Duplicate roleplay/);
    expect(() => buildMap(ALL_ROLEPLAYS)).not.toThrow();
  });
});

describe('roleplays map to real, ready, roleplay-modality skills', () => {
  it.each(ALL_ROLEPLAYS)(
    '$skillId is a ready skill whose modality includes roleplay',
    (scenario) => {
      const skill = getSkill(scenario.skillId);
      expect(skill).toBeDefined();
      expect(skill?.status).toBe('ready');
      expect(skill?.modalities).toContain('roleplay');
    },
  );

  it('does not collide with the influence concept lessons (separate skills)', () => {
    // Each roleplay is its OWN skill, distinct from the concept lessons that teach
    // the same influence topics, so both stay reachable through the router.
    const roleplayIds = new Set(ALL_ROLEPLAYS.map((r) => r.skillId));
    for (const lessonSibling of [
      'working-with-eng-design',
      'influence-without-authority',
      'stakeholder-management',
      'managing-up',
      'force-multiplier-influence',
      'hiring-coaching-pms',
    ]) {
      expect(roleplayIds.has(lessonSibling)).toBe(false);
      // And the sibling still exists as its own ready skill.
      expect(getSkill(lessonSibling)?.status).toBe('ready');
    }
  });
});

describe('every scenario has a well-formed body and rubric', () => {
  it.each(ALL_ROLEPLAYS)(
    '$skillId has an opening, a persona, situation, goal, and 3-5 rubric criteria',
    (scenario) => {
      const resolved = resolveRoleplay(scenario, ctxFor(DEFAULT_INDUSTRY));
      expect(resolved.opening.trim().length).toBeGreaterThan(0);
      expect(resolved.persona.trim().length).toBeGreaterThan(0);
      expect(resolved.situation.length).toBeGreaterThanOrEqual(1);
      expect(resolved.goal.length).toBeGreaterThanOrEqual(1);
      expect(resolved.rubric.length).toBeGreaterThanOrEqual(3);
      expect(resolved.rubric.length).toBeLessThanOrEqual(5);

      // Rubric criterion ids are unique within the scenario and each has a label
      // and a descriptor (the descriptor is both shown and used to grade).
      const ids = resolved.rubric.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const c of resolved.rubric) {
        expect(c.label.trim().length).toBeGreaterThan(0);
        expect(c.descriptor.trim().length).toBeGreaterThan(0);
      }
    },
  );
});

describe('flavoured content resolves for every industry', () => {
  it.each(ALL_INDUSTRIES)(
    'resolves all scenarios for industry "%s" without throwing',
    (industryId) => {
      const ctx = ctxFor(industryId);
      for (const scenario of ALL_ROLEPLAYS) {
        const resolved = resolveRoleplay(scenario, ctx);
        expect(typeof resolved.scenarioTag).toBe('string');
        expect(typeof resolved.characterName).toBe('string');
        expect(typeof resolved.characterStance).toBe('string');
        expect(typeof resolved.opening).toBe('string');
        for (const line of resolved.situation) expect(typeof line).toBe('string');
        for (const line of resolved.goal) expect(typeof line).toBe('string');
      }
    },
  );
});

describe('turn cap (the server-side reply guardrail)', () => {
  // Build a transcript that opens with the character, then alternates
  // character/learner for `turns` learner messages.
  function transcriptWith(turns: number): RoleplayMessage[] {
    const msgs: RoleplayMessage[] = [{ role: 'character', text: 'opening line' }];
    for (let i = 0; i < turns; i += 1) {
      msgs.push({ role: 'learner', text: `learner turn ${i + 1}` });
      msgs.push({ role: 'character', text: `reply ${i + 1}` });
    }
    return msgs;
  }

  it('counts only the learner turns in a transcript', () => {
    expect(countLearnerTurns(transcriptWith(0))).toBe(0);
    expect(countLearnerTurns(transcriptWith(3))).toBe(3);
    expect(countLearnerTurns(transcriptWith(MAX_LEARNER_TURNS))).toBe(MAX_LEARNER_TURNS);
  });

  it('allows a reply up to and including the learner-turn cap', () => {
    // A request to reply includes the just-typed learner message, so at the Nth
    // learner turn countLearnerTurns === N. Replies are allowed through the cap.
    for (let turn = 1; turn <= MAX_LEARNER_TURNS; turn += 1) {
      const justTyped: RoleplayMessage[] = [
        ...transcriptWith(turn - 1),
        { role: 'learner', text: 'newest' },
      ];
      const gate = canReply(justTyped);
      expect(gate.learnerTurns).toBe(turn);
      expect(gate.allowed).toBe(true);
      expect(gate.cap).toBe(MAX_LEARNER_TURNS);
    }
  });

  it('refuses a reply once the learner has exceeded the cap', () => {
    // One past the cap (a looping client trying to buy a 7th reply) is refused.
    const overCap: RoleplayMessage[] = [
      ...transcriptWith(MAX_LEARNER_TURNS),
      { role: 'learner', text: 'one too many' },
    ];
    expect(countLearnerTurns(overCap)).toBe(MAX_LEARNER_TURNS + 1);
    const gate = canReply(overCap);
    expect(gate.allowed).toBe(false);
  });

  it('keeps the score gate below the turn cap so wrap-up is always reachable', () => {
    // The learner can always reach the minimum-to-score before being forced to
    // wrap up at the cap, otherwise the loop could strand them.
    expect(MIN_LEARNER_TURNS_TO_SCORE).toBeGreaterThanOrEqual(1);
    expect(MIN_LEARNER_TURNS_TO_SCORE).toBeLessThan(MAX_LEARNER_TURNS);
  });
});
