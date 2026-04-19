import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { Method } from '@/methods';
import { CATEGORY_META } from '@/methods';

export function MethodCard({ method, highlight }: { method: Method; highlight?: boolean }) {
  const meta = CATEGORY_META[method.category];
  return (
    <Link
      href={`/methods/${method.id}`}
      className={cn(
        'block p-3 rounded-lg border transition-all hover:shadow-md hover:border-blue-400',
        highlight ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200 bg-white',
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border',
            meta.color,
          )}
        >
          {meta.label}
        </span>
        {method.isCommon && (
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
            Common
          </span>
        )}
        {method.drill && (
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded">
            Drill
          </span>
        )}
      </div>
      <h3 className="font-semibold text-sm">{method.name}</h3>
      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{method.tldr}</p>
    </Link>
  );
}
