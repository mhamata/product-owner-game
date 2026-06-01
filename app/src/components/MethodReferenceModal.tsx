'use client';
/**
 * SUPERSEDED — part of the legacy GameView simulation, kept (not deleted) per
 * the repo's no-silent-deletion rule. This is a helper used only by the old GameHeader.
 * No route imports this anymore; the Guided Flow sim under
 * src/components/console/sim/ is the live capstone. Safe to remove once the
 * old flow is confirmed retired.
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { methods, CATEGORY_META, type MethodCategory } from '@/methods';
import { cn } from '@/lib/cn';

export function MethodReferenceModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MethodCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return methods.filter(
      (m) =>
        (category === 'all' || m.category === category) &&
        (q === '' ||
          m.name.toLowerCase().includes(q) ||
          m.tldr.toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">PM Methods Reference</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900"
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="px-5 py-3 border-b space-y-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search methods…"
            className="w-full border rounded px-3 py-2 text-sm"
            autoFocus
          />
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setCategory('all')}
              className={cn(
                'text-xs px-2 py-1 rounded border',
                category === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50',
              )}
            >
              All ({methods.length})
            </button>
            {(Object.keys(CATEGORY_META) as MethodCategory[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'text-xs px-2 py-1 rounded border',
                  category === c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50',
                )}
              >
                {CATEGORY_META[c].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filtered.map((m) => (
            <Link
              key={m.id}
              href={`/methods/${m.id}`}
              target="_blank"
              className="block p-3 rounded border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm">{m.name}</h3>
                <div className="flex gap-1">
                  {m.isCommon && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 rounded">
                      COMMON
                    </span>
                  )}
                  {m.drill && (
                    <span className="text-[9px] font-bold bg-blue-100 text-blue-900 px-1.5 rounded">
                      DRILL
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{m.tldr}</p>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-500 italic text-center py-8">
              No methods match &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>
        <footer className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-600 flex justify-between">
          <span>Click a method to open full detail + drill in a new tab.</span>
          <Link href="/methods" className="text-blue-600 hover:underline">
            Full library →
          </Link>
        </footer>
      </div>
    </div>
  );
}
