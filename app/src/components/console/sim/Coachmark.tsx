'use client';

import type { ReactNode } from 'react';
import { useCoachStore } from '@/store/coachStore';
import { LightbulbIcon, XIcon } from '../Icon';

/**
 * A just-in-time coachmark. Appears only when not yet dismissed (dismissals are
 * persisted in coachStore) and only when `active` (the runner gates these to the
 * first sprint so Sprint 1 feels guided). Dismissing it never blocks play.
 *
 * Accessibility: role="note" with a labelled dismiss button; the lightbulb is
 * decorative (aria-hidden) and always paired with the "Coachmark" tag text.
 */
export function Coachmark({
  id,
  tag,
  active = true,
  children,
}: {
  id: string;
  tag: string;
  active?: boolean;
  children: ReactNode;
}) {
  const dismissed = useCoachStore((s) => s.dismissed[id]);
  const hasHydrated = useCoachStore((s) => s.hasHydrated);
  const dismiss = useCoachStore((s) => s.dismiss);

  // Until persisted state rehydrates we render nothing, to avoid a flash of a
  // coachmark the learner already dismissed.
  if (!hasHydrated || !active || dismissed) return null;

  return (
    <div
      role="note"
      className="relative mt-[18px] flex items-start gap-3 rounded-console-lg border border-[var(--px-line-strong)] bg-gradient-to-b from-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] to-[var(--px-card)] p-[13px_15px]"
    >
      <span
        className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--px-accent)] text-[var(--px-on-accent)]"
        aria-hidden="true"
      >
        <LightbulbIcon size={15} />
      </span>
      <div className="min-w-0">
        <span className="mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--px-accent)]">
          Coachmark · {tag}
        </span>
        <p className="mt-[3px] text-[13.5px] leading-[1.5] text-[var(--px-body)] [&_b]:font-semibold [&_b]:text-[var(--px-ink)]">
          {children}
        </p>
      </div>
      <button
        type="button"
        onClick={() => dismiss(id)}
        aria-label={`Dismiss ${tag} coachmark`}
        className="-mr-1.5 -my-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-console-sm bg-transparent text-[var(--px-dimmer)] transition-[color,background] duration-150 hover:bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] hover:text-[var(--px-dim)]"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}
