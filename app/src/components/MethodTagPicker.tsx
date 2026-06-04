'use client';
/**
 * SUPERSEDED: part of the legacy GameView simulation, kept (not deleted) per
 * the repo's no-silent-deletion rule. This is a helper used only by the old IterationBacklog/EventModal.
 * No route imports this anymore; the Guided Flow sim under
 * src/components/console/sim/ is the live capstone. Safe to remove once the
 * old flow is confirmed retired.
 */

import { useState } from 'react';
import { methods } from '@/methods';
import { cn } from '@/lib/cn';

// Lightweight inline picker: user selects a method ID they claim to have
// used for this decision. Optional; null is valid.
export function MethodTagPicker({
  value,
  onChange,
  context,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  context: 'planning' | 'event';
}) {
  const [open, setOpen] = useState(false);
  const current = methods.find((m) => m.id === value);

  // Surface the most-common prioritization / discovery / decision methods first;
  // keeps the dropdown short for typical use.
  const suggested = methods.filter((m) => m.isCommon);
  const rest = methods.filter((m) => !m.isCommon);

  const label = context === 'planning' ? 'How did you prioritize?' : 'Which method informed this choice?';

  return (
    <div className="text-xs">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-gray-600">{label}</span>
        {current && (
          <button
            onClick={() => onChange(null)}
            className="text-gray-400 hover:text-gray-700"
          >
            clear
          </button>
        )}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full text-left px-2 py-1.5 border rounded',
          current
            ? 'border-blue-400 bg-blue-50 text-blue-900'
            : 'border-gray-300 hover:bg-gray-50',
        )}
      >
        {current ? `✓ ${current.name}` : 'Select a method (optional)'}
      </button>
      {open && (
        <div className="mt-1 border rounded bg-white shadow-lg max-h-64 overflow-y-auto">
          <div className="p-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1">
              Common in interviews
            </div>
            {suggested.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-blue-50"
              >
                <div className="font-medium text-xs">{m.name}</div>
                <div className="text-[10px] text-gray-500 line-clamp-1">{m.tldr}</div>
              </button>
            ))}
            <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1 mt-1">
              All methods
            </div>
            {rest.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-blue-50"
              >
                <div className="text-xs">{m.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
