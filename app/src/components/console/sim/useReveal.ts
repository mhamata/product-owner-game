'use client';

import { useEffect, useState } from 'react';

/**
 * Drives a staggered "reveal N items one at a time" animation, keyed by `key`
 * (e.g. the sprint number) so it restarts cleanly each sprint. Returns the count
 * of items currently shown.
 *
 * Lint-clean: the effect never calls setState synchronously in its body; the
 * reset to 0 and each subsequent bump happen inside requestAnimationFrame /
 * setTimeout callbacks, which the react-hooks rule permits. When `reduced` is
 * set (prefers-reduced-motion), everything is shown immediately with no timers.
 */
export function useReveal(
  key: string | number,
  count: number,
  stepMs: number,
  reduced: boolean,
  initialDelayMs = 350,
): number {
  // Start fully revealed under reduced motion so the first paint is the end state.
  const [shown, setShown] = useState(reduced ? count : 0);

  useEffect(() => {
    const timers: number[] = [];
    // All state changes happen inside async callbacks (rAF / setTimeout), never
    // synchronously in the effect body, keeping the react-hooks rule happy.
    const raf = window.requestAnimationFrame(() => {
      if (reduced) {
        setShown(count);
        return;
      }
      setShown(0);
      for (let i = 0; i < count; i++) {
        timers.push(
          window.setTimeout(() => setShown((n) => Math.max(n, i + 1)), initialDelayMs + i * stepMs),
        );
      }
    });

    return () => {
      window.cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [key, count, stepMs, reduced, initialDelayMs]);

  return shown;
}
