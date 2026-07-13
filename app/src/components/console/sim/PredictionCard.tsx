'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TargetIcon } from '../Icon';

/**
 * SUPERSEDED by InboxTurn (W2-D), kept for reference this wave. This card was
 * only ever rendered from PreviewStep (also superseded); the new inbox flow's
 * commit gating is simply "at least one backlog item is committed" (matching
 * the mockup), so the calibration predict-then-see-the-gap loop is not part
 * of the new turn's critical path this slice. `calibrationStore` itself is
 * untouched (its pure predict/resolve logic still has its own tests); it is
 * just not exercised by the live UI until/unless a future slice re-wires it.
 *
 * STEP 2 add-on: the calibration prompt.
 *
 * Before the capacity roll is revealed on Ship, the player calls whether
 * everything they committed will actually ship. The Outcome step then shows the
 * call against reality and updates a lifetime calibration read. This is the
 * predict-then-see-the-gap loop: the engine already computes the result, so the
 * value is entirely in committing to a prediction first.
 */
export function PredictionCard({
  committed,
  lower,
  upper,
  value,
  accuracy,
  onPredict,
}: {
  committed: number;
  lower: number;
  upper: number;
  value: boolean | null;
  accuracy: number | null;
  onPredict: (allShips: boolean) => void;
}) {
  return (
    <div className="mb-[22px] rounded-console-lg border border-accent-100 bg-accent-050 p-4">
      <div className="flex items-center gap-2">
        <TargetIcon size={14} className="text-accent" />
        <span className="mono text-[11px] uppercase tracking-[0.12em] text-accent">
          Make the call
        </span>
        {accuracy !== null && (
          <span className="mono ml-auto text-[11px] text-slate">
            Calibration <b className="font-semibold text-ink">{accuracy}%</b>
          </span>
        )}
      </div>
      <p className="mt-2 text-[13.5px] leading-[1.5] text-ink-2">
        You committed <b className="font-semibold text-ink">{committed} pts</b>. Capacity rolls
        somewhere between <b className="font-semibold text-ink">{lower}</b> and{' '}
        <b className="font-semibold text-ink">{upper}</b> this sprint. Before you see the roll, does
        all of it ship?
      </p>
      <div className="mt-3 flex gap-2.5">
        <PredictButton selected={value === true} onClick={() => onPredict(true)}>
          Yes, it all ships
        </PredictButton>
        <PredictButton selected={value === false} onClick={() => onPredict(false)}>
          No, some slips
        </PredictButton>
      </div>
    </div>
  );
}

function PredictButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'mono flex-1 rounded-console border px-3 py-2.5 text-[12.5px] font-semibold transition-colors',
        selected
          ? 'border-accent bg-accent text-white'
          : 'border-line bg-paper text-slate hover:border-faint hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
