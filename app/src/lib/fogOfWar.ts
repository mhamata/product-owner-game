import { getSkill, getUnit } from '@/curriculum/data';

/**
 * FOG OF WAR: the pure gate registry for competency-locked dashboard panes
 * (Sim 2.0 W4-G, design-sim-2.0.md §2.2 "fog of war" + §2.5 "skills unlock
 * capabilities, not checkmarks"). This module owns exactly one thing — the
 * list of gates and whether a given mastery signal satisfies one — so every
 * screen that needs a fog-of-war pane (today: `ProductMapScreen.tsx`) reads
 * off the SAME registry rather than re-deciding what's locked and why.
 *
 * PICKING THE UNLOCK SKILL (read before adding a gate)
 * ------------------------------------------------------------------
 * The mockup (`praxis-sim2-mockup.html`) names an aspirational skill,
 * "Cohort Analysis", that does not exist anywhere in the curriculum
 * (`src/curriculum/data.ts`). Per the W4-G build instruction ("read the
 * curriculum and pick the honest one"), each gate below maps to a REAL,
 * `ready` (playable-today) skill, chosen for being the most on-point match —
 * documented per gate, not asserted.
 *
 *  - `cohort-curves` -> `reading-results` ("Significance & Cohorts", Product
 *    Manager level, Experimentation unit, data-fluency competency). This is
 *    the only skill in the curriculum whose own title names cohorts — it
 *    teaches reading experiment results broken out by cohort, which is
 *    exactly the literacy the unlocked panel below asks the player to use.
 *    (The Product screen's OLD placeholder — see git history on
 *    `ProductMapScreen.tsx`'s pre-W4-G `TODO` — had guessed
 *    `activation-retention` instead; this slice replaces that guess with the
 *    more literal match now that the real registry exists.)
 *
 *  - `decision-annotations-history` -> `metrics-literacy` (Foundations
 *    level, Literacy unit, data-fluency competency). This is the
 *    curriculum's entry-level "read a metric and know what it's telling you"
 *    skill — the honest prerequisite for the pane's job, which is attributing
 *    a metric's movement to the rationale you logged for a specific sprint's
 *    call. Deliberately a lower bar than `cohort-curves`: this pane is a
 *    read of the player's OWN decision history, not a third-party analytics
 *    capability, so it should unlock earlier.
 *
 * Both current gates resolve to a single specific skill. The design doc's
 * documented fallback — gate on `competencyCoverage(competency, masteredIds)
 * crossing a threshold` when no single skill is genuinely on-point — is not
 * exercised by either gate here, so it is intentionally NOT implemented in
 * this module (no untested, unused code path). If a future gate needs it,
 * extend `FogGate` with a discriminated `kind` field rather than repurposing
 * `unlockSkillOrCompetency`.
 *
 * PERMANENCE (design-sim-2.0.md §2.5: "mastery decays, never re-locks")
 * ------------------------------------------------------------------
 * `isFogGateUnlocked` takes an `isMasteredSkill` PREDICATE, not a mastery
 * score or a timestamp, and does nothing with it besides a straight
 * pass-through — there is no freshness/recency check anywhere in this file
 * that could re-lock a pane. That is deliberate: `learnStore.isMastered()` /
 * `masteredIds()` are themselves permanent by construction — `mastery` is a
 * running MAX over every attempt (`learnStore.ts`'s `recordResult`), never
 * decremented, and W4-H's mastery-decay model (`@/lib/masteryDecay.ts`)
 * explicitly rules that decay is DISPLAY-ONLY and "never un-masters a skill,
 * never removes it from `masteredIds()`, and never re-locks anything gated
 * on mastery ... fog-of-war gates ... all keep reading the boolean
 * unchanged" (see that file's header comment). So wiring this module
 * straight to `useLearnStore((s) => s.isMastered(skillId))` already gives
 * fog-of-war gates the permanence the design doc requires, with no extra
 * "ever mastered" bookkeeping needed in this module or a new persisted
 * `unlockedGates` record — that would just duplicate a guarantee the store
 * already makes.
 */

export type FogGateId = 'cohort-curves' | 'decision-annotations-history';

export interface FogGate {
  id: FogGateId;
  /** Shown as the pane's title in both the locked (fog) and unlocked state. */
  label: string;
  /** The curriculum skill id whose mastery unlocks this pane (see file header for why each was chosen). */
  unlockSkillOrCompetency: string;
  /** "Unlocks with <skill title> — <unit title> track. Skills grant vision, permanently." */
  unlockHint: string;
}

/** Builds the unlock-hint copy straight from the curriculum, so it can never drift from the skill's real title/unit. */
function unlockHintFor(skillId: string): string {
  const skill = getSkill(skillId);
  const unit = skill ? getUnit(skill.unitId) : undefined;
  const skillTitle = skill?.title ?? skillId;
  const unitTitle = unit?.title ?? 'Curriculum';
  return `Unlocks with ${skillTitle} — ${unitTitle} track. Skills grant vision, permanently.`;
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

/**
 * PURE: is this gate unlocked? `isMasteredSkill` is normally
 * `useLearnStore((s) => s.isMastered)` bound in the caller — injected here
 * (rather than importing the store directly) so this module stays pure and
 * this predicate stays trivially unit-testable without a store/React harness.
 * See the file header for why a straight pass-through is exactly what
 * "permanent once earned" requires.
 */
export function isFogGateUnlocked(
  gate: FogGate,
  isMasteredSkill: (skillId: string) => boolean,
): boolean {
  return isMasteredSkill(gate.unlockSkillOrCompetency);
}
