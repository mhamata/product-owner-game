'use client';
/**
 * SUPERSEDED — part of the legacy GameView simulation, kept (not deleted) per
 * the repo's no-silent-deletion rule. This is a backlog-card used only by the old ProductBacklog/IterationBacklog.
 * No route imports this anymore; the Guided Flow sim under
 * src/components/console/sim/ is the live capstone. Safe to remove once the
 * old flow is confirmed retired.
 */

import type { PBI } from '@/engine/types';
import { cn } from '@/lib/cn';

const kindStyles: Record<PBI['kind'], string> = {
  customer: 'border-l-blue-500',
  tech: 'border-l-purple-500',
  regulatory: 'border-l-red-500',
  'release-card': 'border-l-green-500 bg-green-50',
};

const kindLabel: Record<PBI['kind'], string> = {
  customer: 'CUST',
  tech: 'TECH',
  regulatory: 'REG',
  'release-card': 'RELEASE',
};

export function PBICard({
  pbi,
  onClick,
  actionLabel,
  disabled,
  isNew,
}: {
  pbi: PBI;
  onClick?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  isNew?: boolean;
}) {
  return (
    <div
      className={cn(
        'border bg-white border-l-4 rounded p-3 shadow-sm hover:shadow transition-shadow',
        kindStyles[pbi.kind],
        isNew && 'ring-2 ring-amber-300',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[9px] font-bold tracking-wider text-gray-500">
              {kindLabel[pbi.kind]}
            </span>
            <span className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
              {pbi.effortRevealed !== null ? pbi.effort : `${pbi.effort}?`} pts
            </span>
            {isNew && (
              <span className="text-[9px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">
                NEW {pbi.source === 'event' ? '· EVENT' : '· DISCOVERY'}
              </span>
            )}
            {pbi.satisfies.length > 0 && (
              <span className="text-[10px] text-gray-500 truncate">
                → {pbi.satisfies.join(', ')}
              </span>
            )}
          </div>
          <div className="text-sm font-medium leading-snug">{pbi.title}</div>
        </div>
        {onClick && actionLabel && (
          <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'text-xs px-2 py-1 rounded border whitespace-nowrap',
              disabled
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-blue-300 text-blue-700 hover:bg-blue-50',
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
