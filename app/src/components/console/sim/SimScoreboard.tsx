'use client';

import type { GameScore } from '@/engine/score';
import { cn } from '@/lib/cn';
import { TriangleDownIcon, TriangleUpIcon } from '../Icon';
import { DIMENSIONS, type DimensionKey } from './dimensions';

export type DimensionDeltas = Partial<Record<DimensionKey, number>>;

/**
 * The compact live 5-dimension scoreboard shown in the persistent context rail.
 * `score` is always passed in fresh from `calculateScore(state, scenario)` — the
 * engine read function is the single source of truth; this component only paints.
 *
 * `deltas` optionally tints each gauge with a signed change (used on Plan to
 * *hint* the projected move, and after Outcome to show the realised move). A
 * delta is never colour-alone: it pairs an up/down triangle icon with a signed
 * number and an aria-label.
 *
 * `tense` controls how the delta is phrased for screen readers: 'realised'
 * (default) reads "up 3 this sprint"; 'projected' reads "projected up 3" so a
 * Plan-step hint is never mistaken for a committed movement.
 */
export function SimScoreboard({
  score,
  deltas,
  tense = 'realised',
}: {
  score: GameScore;
  deltas?: DimensionDeltas;
  tense?: 'projected' | 'realised';
}) {
  return (
    <div
      className="flex gap-2 max-[1080px]:w-full max-[1080px]:justify-between max-[560px]:flex-wrap"
      role="group"
      aria-label="Live scoreboard, five dimensions out of 100"
    >
      {DIMENSIONS.map(({ key, label, flatLabel, Icon }) => {
        const value = Math.round(score[key]);
        const delta = deltas?.[key];
        const hasDelta = typeof delta === 'number' && Math.round(delta) !== 0;
        const rounded = hasDelta ? Math.round(delta as number) : 0;
        return (
          <div
            key={key}
            className="flex w-[78px] flex-col items-center gap-1.5 rounded-console border border-line bg-panel px-2 pb-2 pt-[9px] text-center max-[1080px]:w-auto max-[1080px]:flex-1 max-[560px]:min-w-0 max-[560px]:basis-[28%]"
          >
            <Icon size={15} className="text-slate" />
            <span
              className="mono tnum inline-flex items-baseline gap-[3px] text-[15px] font-semibold leading-none text-ink"
              aria-label={`${flatLabel}: ${value} out of 100${
                hasDelta
                  ? tense === 'projected'
                    ? `, projected ${rounded > 0 ? 'up' : 'down'} ${Math.abs(rounded)}`
                    : `, ${rounded > 0 ? 'up' : 'down'} ${Math.abs(rounded)} this sprint`
                  : ''
              }`}
            >
              {value}
              {hasDelta && (
                <span
                  className={cn(
                    'mono inline-flex items-center text-[9.5px] font-semibold leading-none',
                    rounded > 0 ? 'text-good' : 'text-bad',
                  )}
                  aria-hidden="true"
                >
                  {rounded > 0 ? <TriangleUpIcon size={9} /> : <TriangleDownIcon size={9} />}
                  {Math.abs(rounded)}
                </span>
              )}
            </span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-line">
              <div
                className={cn(
                  'h-full rounded-full transition-[width,background] duration-700',
                  hasDelta && rounded < 0 ? 'bg-bad' : 'bg-accent',
                )}
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
              />
            </div>
            <span className="mono text-[8.5px] uppercase leading-[1.2] tracking-[0.06em] text-mute">
              {label[0]}
              <br />
              {label[1]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
