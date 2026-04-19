'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

type Category = 'basic' | 'performance' | 'delighter' | 'indifferent';

interface Item {
  id: string;
  name: string;
  correct: Category;
  why: string;
}

const ITEMS: Item[] = [
  {
    id: 'login',
    name: 'Secure login with MFA',
    correct: 'basic',
    why: 'Must-have. Missing = angry users + CIRO flag. Present = nobody notices.',
  },
  {
    id: 'exec-speed',
    name: 'Order execution speed',
    correct: 'performance',
    why: 'More is better. Traders compare brokers on ms-level latency.',
  },
  {
    id: 'social-investing',
    name: 'Curated Canadian finfluencer social feed',
    correct: 'delighter',
    why: 'Absence unnoticed by most users. Presence creates surprise for Priya-archetype.',
  },
  {
    id: 'chart-colors',
    name: 'Custom chart color themes',
    correct: 'indifferent',
    why: 'Almost nobody cares. Engineering effort with minimal impact on either axis.',
  },
  {
    id: 'darkmode',
    name: 'Dark mode',
    correct: 'basic',
    why:
      '2024+ classification — used to be Delighter (2016), then Performance. Now Basic: missing triggers complaints.',
  },
  {
    id: 'free-l2',
    name: 'Free Level 2 market data',
    correct: 'performance',
    why: 'More quality = more active-trader satisfaction. Scales linearly.',
  },
];

const CATEGORIES: Array<{ key: Category; label: string; color: string }> = [
  {
    key: 'basic',
    label: 'Basic / Must-have',
    color: 'border-rose-400 bg-rose-50 text-rose-900',
  },
  {
    key: 'performance',
    label: 'Performance',
    color: 'border-blue-400 bg-blue-50 text-blue-900',
  },
  {
    key: 'delighter',
    label: 'Delighter',
    color: 'border-amber-400 bg-amber-50 text-amber-900',
  },
  {
    key: 'indifferent',
    label: 'Indifferent',
    color: 'border-gray-400 bg-gray-50 text-gray-900',
  },
];

export function KanoDrill() {
  const [assignments, setAssignments] = useState<Record<string, Category | undefined>>({});
  const [revealed, setRevealed] = useState(false);

  const score = ITEMS.reduce((s, it) => s + (assignments[it.id] === it.correct ? 1 : 0), 0);
  const allAssigned = ITEMS.every((it) => assignments[it.id]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Target segment: <strong>Moomoo Canada users (2024, mainstream)</strong>. Classify each
        feature on the Kano model.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {CATEGORIES.map((c) => (
          <div key={c.key} className={cn('p-2 rounded border-2', c.color)}>
            {c.label}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {ITEMS.map((it) => {
          const ans = assignments[it.id];
          const correct = revealed && ans === it.correct;
          const wrong = revealed && ans != null && !correct;
          return (
            <div
              key={it.id}
              className={cn(
                'bg-white p-2 rounded border-2',
                revealed && correct && 'border-emerald-400',
                revealed && wrong && 'border-rose-400',
                !revealed && 'border-gray-200',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{it.name}</div>
                <div className="flex gap-1 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      disabled={revealed}
                      onClick={() => setAssignments({ ...assignments, [it.id]: c.key })}
                      className={cn(
                        'text-[10px] px-2 py-1 rounded border',
                        ans === c.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-300 hover:bg-gray-50',
                      )}
                    >
                      {c.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              {revealed && (
                <div className="text-xs text-gray-700 mt-1">
                  <strong>{it.correct}:</strong> {it.why}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!revealed ? (
        <button
          disabled={!allAssigned}
          onClick={() => setRevealed(true)}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Reveal
        </button>
      ) : (
        <div className="bg-white p-3 rounded border">
          <div className="text-lg font-semibold">Score: {score} / {ITEMS.length}</div>
          <p className="text-sm mt-1 text-gray-700">
            Dark mode is the classic "category drift" example — watch for Delighters decaying
            into Basics over time.
          </p>
          <button
            onClick={() => {
              setAssignments({});
              setRevealed(false);
            }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
