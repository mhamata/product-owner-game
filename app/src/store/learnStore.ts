'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { allSkills, getUnit } from '@/curriculum/data';

/**
 * Per-skill mastery record.
 *
 * Gamification principle: progress is demonstrated COMPETENCE, never a
 * lesson/attempt tally. `mastery` is a 0–1 score; a skill counts as mastered
 * once it crosses MASTERY_THRESHOLD. We keep `attempts` only for internal
 * pacing — it is never surfaced as "progress".
 */
export interface SkillProgress {
  mastery: number; // 0..1 demonstrated competence
  attempts: number;
  masteredAt?: number; // epoch ms, set the first time mastery is reached
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
   * Record a demonstrated result for a skill. `score` is 0–1 competence for
   * this attempt; mastery takes the best score seen so far. Crossing the
   * threshold for the first time keeps the consistency streak warm.
   */
  recordResult: (skillId: string, score: number) => void;
  /** Convenience: mark a skill fully mastered (score = 1). */
  masterSkill: (skillId: string) => void;
  /** True if the skill is at/above the mastery threshold. */
  isMastered: (skillId: string) => boolean;
  /** Set of mastered skill ids — the input to curriculum state derivation. */
  masteredIds: () => Set<string>;
  /** Count of mastered skills (the headline "competence" number). */
  masteredCount: () => number;
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

   The home must match the mockup on first load: Unit 01 fully mastered
   and "Value vs Effort" (start of Unit 02) as the active node. We derive
   the seed from the curriculum itself so it stays correct if U1 changes.
   ------------------------------------------------------------------ */
function buildSeed(): Pick<LearnState, 'progress' | 'streak' | 'lastActiveDay'> {
  const progress: Record<string, SkillProgress> = {};
  const unit1 = getUnit('u1');
  if (unit1) {
    for (const skill of unit1.skills) {
      progress[skill.id] = { mastery: 1, attempts: 1, masteredAt: 0 };
    }
  }
  // Yesterday so the streak is "warm" and today's mastery extends it.
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  return { progress, streak: 12, lastActiveDay: yesterday };
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
          };

          // Extend the consistency streak only on a *newly* mastered skill,
          // and only once per day (flexible — no guilt, no double-count).
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

      isMastered: (skillId) =>
        (get().progress[skillId]?.mastery ?? 0) >= MASTERY_THRESHOLD,

      masteredIds: () => {
        const { progress } = get();
        return new Set(
          allSkills
            .filter((s) => (progress[s.id]?.mastery ?? 0) >= MASTERY_THRESHOLD)
            .map((s) => s.id),
        );
      },

      masteredCount: () => get().masteredIds().size,

      resetProgress: () =>
        set({ progress: {}, streak: 0, lastActiveDay: null }),

      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-learn-v1',
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
