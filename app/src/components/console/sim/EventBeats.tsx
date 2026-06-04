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
    <div className="flex items-start gap-[13px] rounded-console-lg border border-line bg-paper p-[15px_16px]">
      <span
        className={cn(
          'inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-base',
          beat.tone === 'good'
            ? 'border border-good-line bg-good-050'
            : beat.tone === 'bad'
              ? 'border border-bad-line bg-bad-050'
              : 'border border-line bg-panel',
        )}
        aria-hidden="true"
      >
        {beat.glyph}
      </span>
      <div className="min-w-0 flex-auto">
        <span className="flex flex-wrap items-baseline gap-2 text-[14.5px] font-semibold leading-[1.35] text-ink">
          {beat.effect}
          {beat.delta && (
            <span
              className={cn(
                'mono whitespace-nowrap rounded-full border px-2 py-0.5 text-[12px] font-semibold',
                beat.tone === 'good'
                  ? 'border-good-line bg-good-050 text-good'
                  : beat.tone === 'bad'
                    ? 'border-bad-line bg-bad-050 text-bad'
                    : 'border-line bg-panel text-slate',
              )}
            >
              {beat.delta}
            </span>
          )}
        </span>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-slate">
          <span className="mono mr-1.5 text-[10px] uppercase tracking-[0.12em] text-mute">Because</span>
          {beat.because}
        </p>
      </div>
    </div>
  );
}
