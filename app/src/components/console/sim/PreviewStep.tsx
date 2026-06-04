'use client';

import type { GameState } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { cn } from '@/lib/cn';
import {
  InfoIcon,
  TrendingUpIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  UsersIcon,
} from '../Icon';
import { StepHeader } from './StepHeader';
import { DIMENSIONS } from './dimensions';
import { previewForecast, projectIteration, type Direction } from './projection';

/**
 * STEP 2 · PREVIEW: projected consequences BEFORE committing.
 *
 * This step is read-only: it dispatches nothing. It shows a non-mutating
 * projection (directional dimension forecast + per-customer reactions) so the
 * player previews the trade-off. The commit happens when they press the dock's
 * "Ship it" (the runner dispatches commit-iteration then advances to Ship).
 */
export function PreviewStep({ state, score }: { state: GameState; score: GameScore }) {
  const forecast = previewForecast(state);
  const projection = projectIteration(state);

  return (
    <section aria-labelledby="preview-title">
      <StepHeader
        stepIndex={1}
        totalSteps={6}
        name="Preview"
        eyebrow="Before you commit"
        title={<span id="preview-title">Here&apos;s what will likely happen if you ship this.</span>}
        sub="A projection, not a guarantee. Capacity still rolls within its range on the next step. Review, then decide."
      />

      <div className="mt-[22px] grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
        {/* projected dimension directions */}
        <div className="rounded-console-lg border border-line bg-paper p-4">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUpIcon size={14} className="text-slate" />
            <span className="mono text-[11px] uppercase tracking-[0.12em] text-mute">
              Projected scoreboard
            </span>
          </div>
          {DIMENSIONS.map(({ key, flatLabel }) => {
            const dir = forecast.dimensions.find((d) => d.key === key)?.direction ?? 'steady';
            const base = Math.round(score[key]);
            return (
              <div
                key={key}
                className="flex items-center gap-3 border-b border-line-2 py-2.5 last:border-b-0"
              >
                <span className="w-[116px] flex-none text-[13.5px] text-ink-2">{flatLabel}</span>
                <span className="relative h-1.5 flex-auto overflow-hidden rounded-full bg-line">
                  <span
                    className="absolute top-0 h-full rounded-full bg-faint"
                    style={{ width: `${base}%` }}
                  />
                </span>
                <DirectionChip direction={dir} />
              </div>
            );
          })}
        </div>

        {/* character reactions */}
        <div className="rounded-console-lg border border-line bg-paper p-4">
          <div className="mb-1 flex items-center gap-2">
            <UsersIcon size={14} className="text-slate" />
            <span className="mono text-[11px] uppercase tracking-[0.12em] text-mute">
              How people react
            </span>
          </div>
          {forecast.customers.map((c) => (
            <div key={c.id} className="flex items-start gap-[11px] border-b border-line-2 py-[11px] last:border-b-0">
              <span
                className="mono inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-[13px] font-semibold text-white"
                style={{ background: avatarColor(c.id) }}
                aria-hidden="true"
              >
                {c.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{c.name}</span>
                  <ReactionLabel direction={c.direction} />
                </div>
                <p className="mt-[3px] text-[12px] leading-[1.45] text-mute">{c.why}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* contextual note: leads with the release lesson */}
      <div className="mt-4 flex items-start gap-2.5 rounded-console border border-dashed border-line bg-panel p-[12px_14px] text-[13px] text-slate [&_b]:font-semibold [&_b]:text-ink">
        <InfoIcon size={15} className="mt-px flex-none text-mute" />
        <span>
          {projection.bankedWithoutRelease ? (
            <>
              Heads up: <b>no Release selected</b>. You&apos;ll bank the finished work, but no revenue
              moves this sprint. Add a Release on the Plan step to cash it in.
            </>
          ) : projection.overCommitted ? (
            <>
              You&apos;ve committed <b>{projection.committed} pts</b> against a likely{' '}
              <b>{projection.likely}</b>. Expect some work to not fit when capacity rolls, and a hit
              to team health.
            </>
          ) : projection.hasRelease ? (
            <>
              Looks balanced. A <b>Release</b> is included, so finished work will pay out. Capacity
              still rolls within {projection.lower}-{projection.upper} on the next step.
            </>
          ) : (
            <>
              Nothing committed yet earns revenue without a <b>Release</b>. Capacity still rolls
              within {projection.lower}-{projection.upper} on the next step.
            </>
          )}
        </span>
      </div>
    </section>
  );
}

function DirectionChip({ direction }: { direction: Direction }) {
  if (direction === 'steady') {
    return (
      <span className="mono w-[58px] flex-none text-right text-[12px] font-semibold text-faint">
        steady
      </span>
    );
  }
  const up = direction === 'up';
  return (
    <span
      className={cn(
        'mono inline-flex w-[58px] flex-none items-center justify-end gap-0.5 text-[12px] font-semibold',
        up ? 'text-good' : 'text-bad',
      )}
    >
      {up ? <TriangleUpIcon size={11} /> : <TriangleDownIcon size={11} />}
      {up ? 'rises' : 'falls'}
    </span>
  );
}

function ReactionLabel({ direction }: { direction: Direction }) {
  if (direction === 'steady') {
    return (
      <span className="mono inline-flex items-center gap-1 text-[11px] font-semibold text-faint">
        no change
      </span>
    );
  }
  const up = direction === 'up';
  return (
    <span
      className={cn(
        'mono inline-flex items-center gap-1 text-[11px] font-semibold',
        up ? 'text-good' : 'text-bad',
      )}
    >
      {up ? <TriangleUpIcon size={11} /> : <TriangleDownIcon size={11} />}
      {up ? 'warms up' : 'cools off'}
    </span>
  );
}

/** Deterministic avatar tint from the customer id, stable across renders. */
function avatarColor(id: string): string {
  const palette = ['#7C3AED', '#0891B2', '#DB2777', '#0F766E', '#B45309', '#4F46E5'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
