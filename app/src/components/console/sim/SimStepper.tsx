'use client';

import { cn } from '@/lib/cn';
import { CheckIcon } from '../Icon';
import { SIM_STEPS } from './steps';

/**
 * The sticky stepper progress bar. A step is "done" once we're past it,
 * "current" when active. Steps are clickable only when `canNavigateTo` allows
 * it; back-navigation is permitted inside the planning window (Plan ⇄ Preview)
 * but never after the sprint is committed, because the engine is one-directional.
 * Keyboard: each navigable node is a button with a visible focus ring.
 */
export function SimStepper({
  current,
  canNavigateTo,
  onNavigate,
}: {
  current: number;
  canNavigateTo: (index: number) => boolean;
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="sticky top-[49px] z-20 border-b border-line bg-panel max-[560px]:top-[45px]">
      <nav
        className="mx-auto flex max-w-[1180px] items-center gap-1.5 px-6 py-3.5 max-[720px]:gap-0.5 max-[720px]:overflow-x-auto max-[560px]:px-4"
        aria-label="Sprint progress"
      >
        {SIM_STEPS.map((name, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const navigable = canNavigateTo(i);
          return (
            <div key={name} className="contents">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-[1.5px] min-w-2 flex-auto rounded-full transition-colors duration-300 max-[720px]:min-w-3.5 max-[720px]:flex-none max-[720px]:basis-3.5',
                    i <= current ? 'bg-good' : 'bg-line',
                  )}
                />
              )}
              <button
                type="button"
                // Use aria-disabled (not the native `disabled` attribute) for
                // non-navigable nodes: native disabled prunes the node from the
                // accessibility tree, which would suppress the current step's
                // aria-current announcement and make it unfocusable on review
                // steps. aria-disabled keeps it in the tree and focusable while
                // the guarded onClick stays a no-op.
                aria-disabled={!navigable || undefined}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${i + 1} of ${SIM_STEPS.length}: ${name}${
                  isCurrent ? ', current' : done ? ', done' : ''
                }`}
                onClick={() => {
                  if (navigable) onNavigate(i);
                }}
                className={cn(
                  'inline-flex flex-1 items-center gap-[9px] rounded-console-sm bg-transparent p-0 max-[720px]:flex-none',
                  navigable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'mono inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border-[1.5px] text-[11px] font-semibold transition-all duration-200',
                    done && 'border-good bg-good text-white',
                    isCurrent && 'border-accent bg-accent-050 text-accent shadow-[0_0_0_3px_var(--color-accent-050)]',
                    !done && !isCurrent && 'border-line bg-paper text-faint',
                  )}
                >
                  {done ? <CheckIcon size={12} /> : i + 1}
                </span>
                <span
                  className={cn(
                    'mono overflow-hidden text-ellipsis whitespace-nowrap text-[12px] tracking-[0.02em] max-[720px]:hidden',
                    isCurrent ? 'font-medium text-ink' : done ? 'text-slate' : 'text-faint',
                  )}
                >
                  {name}
                </span>
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
