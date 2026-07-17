import { getSkill } from '@/curriculum/data';

/**
 * PRODUCT-SCREEN "SHARPEN" REGISTRY (Sim 2.0 W4-G, design-sim-2.0.md §2.2 —
 * amended 2026-07-16, see §2.5's dated amendment note).
 *
 * SELF-STUDY RULING (2026-07-16, Mike): `isFogGateUnlocked` was DELETED and
 * both Product-screen panes render their real content UNCONDITIONALLY now —
 * "fog of war" (blur + lock icon until a skill is mastered) is gone. This
 * module still owns exactly one thing — the registry mapping each pane to
 * the curriculum skill that best sharpens the player's read of it — so every
 * screen that needs that mapping (today: `ProductMapScreen.tsx`'s hint chip,
 * and `skillUnlocks.ts`'s tech-tree copy) reads off the SAME registry rather
 * than re-deciding it. "Skills unlock capabilities" (the old design-doc
 * framing) is superseded by "skills sharpen reads": mastering the mapped
 * skill removes a small hint chip pointing at it, nothing more — the pane
 * was always there.
 *
 * PICKING THE SHARPEN SKILL (read before adding a gate)
 * ------------------------------------------------------------------
 * The mockup (`praxis-sim2-mockup.html`) names an aspirational skill,
 * "Cohort Analysis", that does not exist anywhere in the curriculum
 * (`src/curriculum/data.ts`). Per the W4-G build instruction ("read the
 * curriculum and pick the honest one"), each entry below maps to a REAL,
 * `ready` (playable-today) skill, chosen for being the most on-point match —
 * documented per gate, not asserted.
 *
 *  - `cohort-curves` -> `reading-results` ("Significance & Cohorts", Product
 *    Manager level, Experimentation unit, data-fluency competency). This is
 *    the only skill in the curriculum whose own title names cohorts — it
 *    teaches reading experiment results broken out by cohort, which is
 *    exactly the literacy the pane below asks the player to use.
 *
 *  - `decision-annotations-history` -> `metrics-literacy` (Foundations
 *    level, Literacy unit, data-fluency competency). This is the
 *    curriculum's entry-level "read a metric and know what it's telling you"
 *    skill — the honest prerequisite for the pane's job, which is attributing
 *    a metric's movement to the rationale you logged for a specific sprint's
 *    call. Deliberately a lower bar than `cohort-curves`.
 *
 * Both entries resolve to a single specific skill. The design doc's
 * documented fallback — key on `competencyCoverage(competency, masteredIds)
 * crossing a threshold` when no single skill is genuinely on-point — is not
 * exercised by either entry here, so it is intentionally NOT implemented in
 * this module (no untested, unused code path). If a future entry needs it,
 * extend `FogGate` with a discriminated `kind` field rather than repurposing
 * `unlockSkillOrCompetency`.
 */

export type FogGateId = 'cohort-curves' | 'decision-annotations-history';

export interface FogGate {
  id: FogGateId;
  /** Shown as the pane's title. */
  label: string;
  /** The curriculum skill id that best sharpens this pane's read (see file header for why each was chosen). */
  unlockSkillOrCompetency: string;
  /** "Sharpen this: <skill title>" — shown as a small hint chip until the skill is mastered. */
  unlockHint: string;
}

/** Builds the hint copy straight from the curriculum, so it can never drift from the skill's real title. */
function unlockHintFor(skillId: string): string {
  const skill = getSkill(skillId);
  const skillTitle = skill?.title ?? skillId;
  return `Sharpen this: ${skillTitle}`;
}

export const FOG_GATES: Record<FogGateId, FogGate> = {
  'cohort-curves': {
    id: 'cohort-curves',
    label: 'Cohort retention curves',
    unlockSkillOrCompetency: 'reading-results',
    unlockHint: unlockHintFor('reading-results'),
  },
  'decision-annotations-history': {
    id: 'decision-annotations-history',
    label: 'Decision-annotation history',
    unlockSkillOrCompetency: 'metrics-literacy',
    unlockHint: unlockHintFor('metrics-literacy'),
  },
};

/** Every gate, in a stable render order (object key order, which is insertion order for string keys). */
export const FOG_GATE_LIST: FogGate[] = Object.values(FOG_GATES);
