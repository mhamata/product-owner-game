'use client';

import { useState } from 'react';
import type { Action, EventCard } from '@/engine/types';
import { MethodTagPicker } from './MethodTagPicker';

export function EventModal({
  event,
  dispatch,
}: {
  event: EventCard;
  dispatch: (a: Action) => void;
}) {
  const [method, setMethod] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <header className="px-5 py-3 border-b">
          <div className="text-[10px] font-bold tracking-widest text-amber-700 uppercase">
            Event · {event.category}
          </div>
          <h2 className="text-base font-semibold mt-1">An event demands a response</h2>
        </header>
        <div className="px-5 py-4 overflow-y-auto">
          <p className="text-sm text-gray-800 leading-relaxed">{event.narrative}</p>
        </div>
        <div className="px-5 pb-3 border-t bg-gray-50 py-3">
          <MethodTagPicker value={method} onChange={setMethod} context="event" />
        </div>
        <div className="px-5 pb-5 pt-3 space-y-2">
          {event.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() =>
                dispatch({
                  type: 'respond-to-event',
                  eventId: event.id,
                  optionId: opt.id,
                  methodId: method ?? undefined,
                })
              }
              className="w-full text-left p-3 border border-gray-200 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{opt.visibleConsequence}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
