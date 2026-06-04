'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns false during SSR and the first client render, then true once mounted.
 * Used to gate persisted-store reads (Zustand localStorage) so the first paint
 * matches the server and avoids a hydration mismatch.
 *
 * Implemented with useSyncExternalStore (server snapshot false, client snapshot
 * true) so there is no setState-in-effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
