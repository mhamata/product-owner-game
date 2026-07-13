'use client';

import type { ReactNode } from 'react';

/**
 * The per-step header: a "Step N of 6 · Name" pill, an eyebrow tagline, the big
 * step title, and a one-line sub. Matches sim-b.html's `.step-eyebrow` /
 * `.step-title` / `.step-sub`. Used by every panel for a consistent altitude.
 */
export function StepHeader({
  stepIndex,
  totalSteps,
  name,
  eyebrow,
  title,
  sub,
  hideStepBadge,
}: {
  stepIndex: number;
  totalSteps: number;
  name: string;
  eyebrow: string;
  title: ReactNode;
  sub: ReactNode;
  /**
   * The Sim 2.0 inbox rebuild (W2-D) reuses this header inside components that
   * no longer sit in a linear "Step N of 6" flow (the Plan sheet, the
   * post-cliffhanger Outcome/Debrief mini-flow). Set true to drop the "Step N
   * of Total" pill while keeping the eyebrow/title/sub, which still read fine
   * standalone. Defaults to false so every pre-existing call site is unchanged.
   */
  hideStepBadge?: boolean;
}) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-[9px]">
        {!hideStepBadge && (
          <span className="mono rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-[3px] text-[10.5px] uppercase tracking-[0.12em] text-accent">
            Step {stepIndex + 1} of {totalSteps} · {name}
          </span>
        )}
        <span className="eyebrow">{eyebrow}</span>
      </div>
      {/* tabIndex={-1} makes the heading programmatically focusable so the
          runner can move focus here on each step transition (without adding it
          to the tab order). data-step-heading lets the runner find it. */}
      <h1
        tabIndex={-1}
        data-step-heading
        className="mt-3.5 text-[25px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink outline-none max-[560px]:text-[21px]"
      >
        {title}
      </h1>
      <p className="mt-2 max-w-[60ch] text-[14.5px] text-slate">{sub}</p>
    </header>
  );
}
