'use client';

import { cn } from '@/lib/cn';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icon';

/**
 * The fixed bottom action dock: optional Back, a centered helper hint, and the
 * primary CTA. Mirrors sim-b.html's `.dock`. Purely presentational — the runner
 * owns the step logic and passes labels, gating, and handlers.
 */
export function SimDock({
  primaryLabel,
  hint,
  onPrimary,
  primaryDisabled,
  primaryTone = 'accent',
  showBack,
  onBack,
}: {
  primaryLabel: string;
  hint?: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryTone?: 'accent' | 'good';
  showBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-panel from-[38%] to-transparent">
      <div className="pointer-events-auto mx-auto flex max-w-[880px] items-center gap-3 px-6 pb-5 pt-[18px] max-[560px]:px-4 max-[560px]:pb-4">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="mono inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-console border border-line bg-paper px-[18px] py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate transition-[border-color,color,background] duration-150 hover:border-faint hover:text-ink"
          >
            <ChevronLeftIcon size={15} />
            Back
          </button>
        )}

        {hint && (
          <span className="min-w-0 flex-auto px-2 text-center text-[12.5px] text-mute max-[560px]:hidden">
            {hint}
          </span>
        )}

        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className={cn(
            'mono inline-flex flex-none items-center justify-center gap-2.5 whitespace-nowrap rounded-console border-0 px-[22px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] text-white shadow-console-md transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px max-[560px]:flex-auto',
            primaryDisabled
              ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none'
              : primaryTone === 'good'
                ? 'bg-good hover:bg-good-700'
                : 'bg-accent hover:bg-accent-700',
          )}
        >
          {primaryLabel}
          {!primaryDisabled && <ChevronRightIcon size={16} />}
        </button>
      </div>
    </div>
  );
}
