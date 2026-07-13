'use client';

import type { ReviewShelf } from '@/store/reviewStore';
import { cn } from '@/lib/cn';

/** "today" / "1 day" / "N days" — matches `reviewStore.describeBoxMove`'s phrasing. */
function intervalLabel(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * The Leitner box shelf (W4-I, praxis-learn-mockup.html's shelf bullet): real
 * per-box counts + interval labels straight from `reviewStore.boxShelf`, with
 * the box(es) holding due cards highlighted. A never-reviewed card has no box
 * yet, so it gets its own honest "New" row rather than being folded silently
 * into Box 1.
 */
export function LeitnerShelf({ shelf }: { shelf: ReviewShelf }) {
  return (
    <div
      role="list"
      aria-label="Your review deck's Leitner shelf"
      className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4"
    >
      {shelf.unseen > 0 && (
        <ShelfCell
          role="listitem"
          label="New"
          sub="due now"
          total={shelf.unseen}
          due={shelf.unseen}
        />
      )}
      {shelf.rows.map((row) => (
        <ShelfCell
          key={row.box}
          role="listitem"
          label={`Box ${row.box + 1}`}
          sub={intervalLabel(row.intervalDays)}
          total={row.total}
          due={row.due}
        />
      ))}
    </div>
  );
}

function ShelfCell({
  label,
  sub,
  total,
  due,
  role,
}: {
  label: string;
  sub: string;
  total: number;
  due: number;
  role: 'listitem';
}) {
  const isDue = due > 0;
  return (
    <div
      role={role}
      className={cn(
        'rounded-[12px] border p-[9px_10px] text-center transition-colors',
        isDue
          ? 'border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)]'
          : 'border-[var(--px-line)] bg-[var(--px-raised)]',
      )}
    >
      <div className="mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--px-dimmer)]">
        {label}
      </div>
      <div className="mono tnum mt-1 text-[15px] font-bold text-[var(--px-ink)]">{total}</div>
      <div
        className={cn(
          'mono tnum mt-0.5 text-[9.5px] uppercase tracking-[0.06em]',
          isDue ? 'text-[var(--px-accent)]' : 'text-[var(--px-dimmer)]',
        )}
      >
        {isDue ? `${due} due` : sub}
      </div>
    </div>
  );
}
