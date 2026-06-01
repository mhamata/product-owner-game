import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Sticky top utility bar with the `praxis.` mono wordmark, matching the
 * mockup's `.topbar`. `right` lets each screen slot in its own controls
 * (e.g. the lesson's close affordance) without a screen-toggle that doesn't
 * apply to a routed app.
 *
 * `context` is the wordmark suffix after "v0 ·" — "console" on the learning
 * path (default), "simulation" on the sim route (matches sim-b.html).
 */
export function Topbar({
  right,
  context = 'console',
}: {
  right?: ReactNode;
  context?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          aria-label="PRAXIS home"
          className="mono whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em] text-ink no-underline"
        >
          praxis<span className="text-accent">.</span>
          <span className="ml-1.5 text-[11px] font-medium text-faint max-[560px]:hidden">
            v0 · {context}
          </span>
        </Link>
        {right}
      </div>
    </header>
  );
}
