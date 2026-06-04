'use client';

import Link from 'next/link';
import { useReviewStore } from '@/store/reviewStore';
import { ScaleIcon } from '../Icon';

/**
 * Topbar "Review" entry for the judgment deck. A client island so it can read
 * the persisted review store and show the live due count.
 *
 * Hydration-safe like the rest of the persisted Console: the count badge is only
 * rendered after the store rehydrates. Before that the link still renders (so the
 * nav is stable across SSR and first paint), just without a number, then the
 * badge appears once the real due count is known. The badge shows only when
 * something is actually due, so a caught-up learner sees a clean link.
 */
export function ReviewNavLink() {
  const hasHydrated = useReviewStore((s) => s.hasHydrated);
  const dueCount = useReviewStore((s) => s.dueCount);
  const count = hasHydrated ? dueCount() : 0;
  const showBadge = hasHydrated && count > 0;

  return (
    <Link
      href="/review"
      aria-label={
        showBadge
          ? `Judgment review, ${count} due`
          : 'Judgment review'
      }
      className="mono inline-flex items-center gap-1.5 rounded-console border border-line bg-paper px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
    >
      <ScaleIcon size={13} />
      Review
      {showBadge && (
        <span
          aria-hidden
          className="mono tnum ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1.5 py-px text-[10.5px] font-semibold leading-none text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
