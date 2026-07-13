'use client';

import { cn } from '@/lib/cn';
import type { OutcomeBeat } from './explain';

/**
 * Static renderer for a list of explained "BECAUSE" beats. Visually identical to
 * the Outcome step's animated beat card, but shown all at once (no reveal
 * tween), used by the Event step's post-choice confirmation, where the player
 * has just acted and wants the full consequence read immediately.
 *
 * Kept as its own small component so the Outcome and Event steps share one beat
 * style without coupling the Event flow to Outcome's reveal machinery.
 */
export function EventBeatList({ beats }: { beats: OutcomeBeat[] }) {
  return (
    <div className="grid gap-3">
      {beats.map((beat) => (
        <BeatCard key={beat.id} beat={beat} />
      ))}
    </div>
  );
}

function BeatCard({ beat }: { beat: OutcomeBeat }) {
  return (
    <div className="flex items-start gap-[13px] rounded-console-lg border border-[var(--px-line)] bg-[var(--px-card)] p-[15px_16px]">
      <span
        className={cn(
          'inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-base',
          beat.tone === 'good'
            ? 'border border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_10%,transparent)]'
            : beat.tone === 'bad'
              ? 'border border-[var(--px-crit)] bg-[color-mix(in_srgb,var(--px-crit)_10%,transparent)]'
              : 'border border-[var(--px-line)] bg-[var(--px-ground)]',
        )}
        aria-hidden="true"
      >
        {beat.glyph}
      </span>
      <div className="min-w-0 flex-auto">
        <span className="flex flex-wrap items-baseline gap-2 text-[14.5px] font-semibold leading-[1.35] text-[var(--px-ink)]">
          {beat.effect}
          {beat.delta && (
            <span
              className={cn(
                'mono whitespace-nowrap rounded-full border px-2 py-0.5 text-[12px] font-semibold',
                beat.tone === 'good'
                  ? 'border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_10%,transparent)] text-[var(--px-good)]'
                  : beat.tone === 'bad'
                    ? 'border-[var(--px-crit)] bg-[color-mix(in_srgb,var(--px-crit)_10%,transparent)] text-[var(--px-crit)]'
                    : 'border-[var(--px-line)] bg-[var(--px-ground)] text-[var(--px-dim)]',
              )}
            >
              {beat.delta}
            </span>
          )}
        </span>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--px-dim)]">
          <span className="mono mr-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--px-dimmer)]">Because</span>
          {beat.because}
        </p>
      </div>
    </div>
  );
}
