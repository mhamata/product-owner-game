'use client';

import { useSyncExternalStore } from 'react';

/**
 * Reports the user's `prefers-reduced-motion` setting, updating live if it
 * changes. Sim animations (the capacity roll, staggered outcome beats) consult
 * this to present the end state instantly instead of animating.
 *
 * Implemented with useSyncExternalStore so there is no setState-in-effect: the
 * media query IS the external store. The server snapshot is `false` (animate by
 * default), corrected on the client's first commit.
 */
function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
