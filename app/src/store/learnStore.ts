'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { masterableSkills } from '@/curriculum/data';
import { strengthOf, isRusty, type DecayRecord } from '@/lib/masteryDecay';

/**
 * Per-skill mastery record.
 *
 * Gamification principle: progress is demonstrated COMPETENCE, never a
 * lesson/attempt tally. `mastery` is a 0-1 score; a skill counts as mastered
 * once it crosses MASTERY_THRESHOLD. We keep `attempts` only for internal
 * pacing; it is never surfaced as "progress".
 *
 * `lastPracticedAt` (W4-H, additive): epoch ms of the most recent rep —
 * lesson/drill/artifact/roleplay attempt OR a maintenance-refresh rep (see
 * `recordMaintenanceRep`). Feeds the pure decay model in `@/lib/masteryDecay`
 * for tech-tree strength display and scheduler weighting; it never gates
 * anything mastery itself gates (see masteryDecay.ts's ruling comment).
 * Skills mastered before this field existed simply lack it — `masteryDecay`
 * falls back to `masteredAt` for those, so old persisted state (this store's
 * `partialize` only persists plain data, no migration function needed for an
 * additive optional field) keeps loading and rendering sanely.
 */
export interface SkillProgress {
  mastery: number; // 0..1 demonstrated competence
  attempts: number;
  masteredAt?: number; // epoch ms, set the first time mastery is reached
  lastPracticedAt?: number; // epoch ms, set on every rep (see masteryDecay.ts)
}

/** A skill is "mastered" at or above this competence score. */
export const MASTERY_THRESHOLD = 1;

interface LearnState {
  /** skillId -> progress. Absent = not started. */
  progress: Record<string, SkillProgress>;
  /**
   * Flexible "consistency" streak: a habit counter, not a guilt mechanic.
   * `streak` is the running count; `lastActiveDay` is an ISO yyyy-mm-dd marker
   * used to decide whether the next mastery extends or resets the streak.
   */
  streak: number;
  lastActiveDay: string | null;
  /** Set true once persisted state has rehydrated (avoids SSR mismatch). */
  hasHydrated: boolean;
}

interface LearnActions {
  /**
   * Record a demonstrated result for a skill. `score` is 0-1 competence for
   * this attempt; mastery takes the best score seen so far. Crossing the
   * threshold for the first time keeps the consistency streak warm.
   */
  recordResult: (skillId: string, score: number) => void;
  /** Convenience: mark a skill fully mastered (score = 1). */
  masterSkill: (skillId: string) => void;
  /**
   * Record a passing PLACEMENT (test-out) result for a whole level: mark every
   * given skill mastered. This is legitimate because passing the placement
   * challenge demonstrates the same competence the lessons gate on (see
   * src/curriculum/placement.ts). A FAIL must never call this: it records
   * nothing, by design. Skills already mastered are left untouched (no double
   * streak credit), so re-testing a level you've certified is a no-op.
   */
  recordPlacementPass: (skillIds: readonly string[]) => void;
  /** True if the skill is at/above the mastery threshold. */
  isMastered: (skillId: string) => boolean;
  /** Set of mastered skill ids: the input to curriculum state derivation. */
  masteredIds: () => Set<string>;
  /** Count of mastered skills (the headline "competence" number). */
  masteredCount: () => number;
  /**
   * Record a completed 90-second maintenance rep (see `@/lib/skillRefresh`):
   * stamps `lastPracticedAt` to now, which resets the skill's decay clock to
   * full strength (see `@/lib/masteryDecay`'s recovery-rule doc comment).
   * Deliberately does NOT touch `mastery`, `attempts`, or the streak — a
   * refresh is upkeep on an already-demonstrated skill, not a new
   * demonstration of it. A no-op for a skill that was never mastered (there
   * is nothing to refresh yet); guards against a stray call reviving a
   * progress record that shouldn't exist.
   */
  recordMaintenanceRep: (skillId: string) => void;
  /** A skill's current decay-adjusted strength, 0-100 (0 if never mastered). See `@/lib/masteryDecay`. */
  strengthOf: (skillId: string, now?: number) => number;
  /** True if a mastered skill has decayed below the rusty threshold. See `@/lib/masteryDecay`. */
  isRusty: (skillId: string, now?: number) => boolean;
  /** Reset all learning progress (dev/testing aid). */
  resetProgress: () => void;
  _setHydrated: () => void;
}

export type LearnStore = LearnState & LearnActions;

/** Local day marker (yyyy-mm-dd) for the flexible streak. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/* ------------------------------------------------------------------
   Seed state.

   A new player starts at the BEGINNING: no skills mastered, a cold streak,
   so Unit 01 / Skill 01 is the first active node and everything else is
   locked. (An earlier build seeded Unit 01 as already-mastered with a
   12-day streak to match the static mockup; that made the live game look
   already-played, so it's removed.)
   ------------------------------------------------------------------ */
function buildSeed(): Pick<LearnState, 'progress' | 'streak' | 'lastActiveDay'> {
  return { progress: {}, streak: 0, lastActiveDay: null };
}

const seed = buildSeed();

export const useLearnStore = create<LearnStore>()(
  persist(
    (set, get) => ({
      progress: seed.progress,
      streak: seed.streak,
      lastActiveDay: seed.lastActiveDay,
      hasHydrated: false,

      recordResult: (skillId, score) => {
        const clamped = Math.max(0, Math.min(1, score));
        set((s) => {
          const prev = s.progress[skillId] ?? { mastery: 0, attempts: 0 };
          const wasMastered = prev.mastery >= MASTERY_THRESHOLD;
          const nextMastery = Math.max(prev.mastery, clamped);
          const nowMastered = nextMastery >= MASTERY_THRESHOLD;

          const next: SkillProgress = {
            mastery: nextMastery,
            attempts: prev.attempts + 1,
            masteredAt: prev.masteredAt ?? (nowMastered ? Date.now() : undefined),
            // Every recorded result is a rep, whether or not it moves mastery
            // (redoing an already-mastered skill still counts as practice for
            // the decay clock — see masteryDecay.ts).
            lastPracticedAt: Date.now(),
          };

          // Extend the consistency streak only on a *newly* mastered skill,
          // and only once per day (flexible: no guilt, no double-count).
          let { streak, lastActiveDay } = s;
          if (nowMastered && !wasMastered) {
            const day = today();
            if (lastActiveDay === null) {
              streak = 1;
            } else if (lastActiveDay !== day) {
              const gap = dayDiff(lastActiveDay, day);
              streak = gap === 1 ? streak + 1 : 1;
            }
            lastActiveDay = day;
          }

          return {
            progress: { ...s.progress, [skillId]: next },
            streak,
            lastActiveDay,
          };
        });
      },

      masterSkill: (skillId) => get().recordResult(skillId, 1),

      recordPlacementPass: (skillIds) => {
        set((s) => {
          const progress = { ...s.progress };
          let { streak, lastActiveDay } = s;
          let masteredAnyNew = false;

          // Mark each skill fully mastered. We mirror recordResult's per-skill
          // bookkeeping (best-score, masteredAt) but extend the streak only ONCE
          // for the whole batch and only if something newly crossed the bar, so
          // testing out of a level is one consistency credit, not one per skill.
          for (const id of skillIds) {
            const prev = progress[id] ?? { mastery: 0, attempts: 0 };
            const wasMastered = prev.mastery >= MASTERY_THRESHOLD;
            if (!wasMastered) masteredAnyNew = true;
            progress[id] = {
              mastery: MASTERY_THRESHOLD,
              attempts: prev.attempts + 1,
              masteredAt: prev.masteredAt ?? Date.now(),
              lastPracticedAt: Date.now(),
            };
          }

          if (masteredAnyNew) {
            const day = today();
            if (lastActiveDay === null) {
              streak = 1;
            } else if (lastActiveDay !== day) {
              const gap = dayDiff(lastActiveDay, day);
              streak = gap === 1 ? streak + 1 : 1;
            }
            lastActiveDay = day;
          }

          return { progress, streak, lastActiveDay };
        });
      },

      isMastered: (skillId) =>
        (get().progress[skillId]?.mastery ?? 0) >= MASTERY_THRESHOLD,

      // Only `ready` (masterable) skills can be mastered. `coming-soon` skills
      // carry no progress and never enter this set, so `deriveSkillState`'s
      // one remaining content gate (coming-soon) is driven purely by playable
      // work — mastery itself is feedback, never a progression key.
      masteredIds: () => {
        const { progress } = get();
        return new Set(
          masterableSkills
            .filter((s) => (progress[s.id]?.mastery ?? 0) >= MASTERY_THRESHOLD)
            .map((s) => s.id),
        );
      },

      masteredCount: () => get().masteredIds().size,

      recordMaintenanceRep: (skillId) => {
        set((s) => {
          const prev = s.progress[skillId];
          // No-op if the skill was never mastered: nothing to refresh yet.
          if (!prev || prev.mastery < MASTERY_THRESHOLD) return s;
          return {
            progress: {
              ...s.progress,
              [skillId]: { ...prev, lastPracticedAt: Date.now() },
            },
          };
        });
      },

      strengthOf: (skillId, now) => {
        const p = get().progress[skillId];
        const record: DecayRecord | undefined = p
          ? { mastery: p.mastery, lastPracticedAt: p.lastPracticedAt, masteredAt: p.masteredAt }
          : undefined;
        return strengthOf(record, now);
      },

      isRusty: (skillId, now) => {
        const p = get().progress[skillId];
        const record: DecayRecord | undefined = p
          ? { mastery: p.mastery, lastPracticedAt: p.lastPracticedAt, masteredAt: p.masteredAt }
          : undefined;
        return isRusty(record, now);
      },

      resetProgress: () =>
        set({ progress: {}, streak: 0, lastActiveDay: null }),

      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      // v2: the seed no longer pre-masters Unit 1, so discard any old v1 state
      // (which carried the demo "already played" progress) and start fresh.
      name: 'praxis-learn-v2',
      storage: createJSONStorage(() => localStorage),
      // Only persist real progress, not derived/transient flags.
      partialize: (s) => ({
        progress: s.progress,
        streak: s.streak,
        lastActiveDay: s.lastActiveDay,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
