'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_INDUSTRY, type IndustryId } from '@/curriculum/industries';

/**
 * The learner's "home industry": the theme applied to the capstone simulation.
 *
 * Persisted (so the choice sticks across sessions) and SSR-safe: like the learn
 * store, a `hasHydrated` flag flips true only after rehydration, so components
 * can render the default on the server + first client paint and avoid a
 * hydration mismatch. Only `industry` is persisted; `hasHydrated` is transient.
 */
interface IndustryState {
  industry: IndustryId;
  /** Set true once persisted state has rehydrated (avoids SSR mismatch). */
  hasHydrated: boolean;
}

interface IndustryActions {
  /** Set the active home industry. */
  setIndustry: (industry: IndustryId) => void;
  _setHydrated: () => void;
}

export type IndustryStore = IndustryState & IndustryActions;

export const useIndustryStore = create<IndustryStore>()(
  persist(
    (set) => ({
      industry: DEFAULT_INDUSTRY,
      hasHydrated: false,

      setIndustry: (industry) => set({ industry }),

      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-industry-v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist the choice itself, not the transient hydration flag.
      partialize: (s) => ({ industry: s.industry }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);

/**
 * The active home industry, read SSR-safely. Returns `DEFAULT_INDUSTRY` on the
 * server and the first client paint (before the persisted store rehydrates),
 * then the learner's stored choice, so industry-themed content never causes a
 * hydration mismatch. This is the one-liner SimRunner and the lesson/methods
 * surfaces share for resolving industry-aware drills.
 */
export function useActiveIndustry(): IndustryId {
  const hasHydrated = useIndustryStore((s) => s.hasHydrated);
  const industry = useIndustryStore((s) => s.industry);
  return hasHydrated ? industry : DEFAULT_INDUSTRY;
}
