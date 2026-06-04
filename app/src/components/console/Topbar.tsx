import Link from 'next/link';
import type { ReactNode } from 'react';
import { CapIcon } from './Icon';

/**
 * Sticky top utility bar with the `praxis.` mono wordmark, matching the
 * mockup's `.topbar`. `right` lets each screen slot in its own controls
 * (e.g. the lesson's close affordance) without a screen-toggle that doesn't
 * apply to a routed app.
 *
 * When no `right` is given, the bar shows the default nav: a link to the
 * Progress / profile view (level certifications + competency matrix). Screens
 * that need their own right-hand control (a lesson's close X, the profile's
 * "Map" link) pass `right` to replace it.
 *
 * `context` is the wordmark suffix after "v0 ·", "console" on the learning
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
        {right ?? (
          <Link
            href="/progress"
            className="mono inline-flex items-center gap-1.5 rounded-console border border-line bg-paper px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <CapIcon size={13} />
            Progress
          </Link>
        )}
      </div>
    </header>
  );
}
