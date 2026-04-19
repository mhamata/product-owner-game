'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

type Bucket = 'M' | 'S' | 'C' | 'W' | null;
interface Item {
  id: string;
  name: string;
  correct: Exclude<Bucket, null>;
  why: string;
}

const ITEMS: Item[] = [
  {
    id: 'tfsa',
    name: 'TFSA Account Support',
    correct: 'M',
    why: 'Without this, Canadian mainstream segment churns. "Must" is defined by "release fails without it."',
  },
  {
    id: 'ciro-compliance',
    name: 'CIRO Rule 2600 Trade Surveillance',
    correct: 'M',
    why: 'Regulatory non-negotiable. Launch without it = audit failure.',
  },
  {
    id: 'push-notifs',
    name: 'Push Notifications for Canadian Market Hours',
    correct: 'S',
    why: 'Important for retention but not blocking launch. Fix post-launch if needed.',
  },
  {
    id: 'social-feed',
    name: 'Canadian Social Feed',
    correct: 'C',
    why: 'Nice differentiation but not required. Could ship in a later release.',
  },
  {
    id: 'crypto-tab',
    name: 'Crypto Trading Tab',
    correct: 'W',
    why: 'Explicitly out of scope for this release. Provincial regs vary; no team expertise. Name it Won\'t so it stops coming up.',
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    correct: 'S',
    why: 'Used to be Could; has become Should in 2024+ (Kano temporal decay). Missing it gets roasted in reviews.',
  },
  {
    id: 'chat-support',
    name: 'In-App Chat Support',
    correct: 'C',
    why: 'Would help activation but email support is acceptable for launch.',
  },
  {
    id: 'partner-api',
    name: 'Partner API for Third-Party Portfolio Tools',
    correct: 'W',
    why: 'Not a Canadian-launch concern. Explicitly out of scope to keep team focused.',
  },
];

const BUCKETS: Array<{ key: Exclude<Bucket, null>; label: string; description: string; color: string }> = [
  { key: 'M', label: 'Must', description: 'Launch blocker', color: 'border-rose-400 bg-rose-50' },
  {
    key: 'S',
    label: 'Should',
    description: 'Important, not blocking',
    color: 'border-amber-400 bg-amber-50',
  },
  {
    key: 'C',
    label: 'Could',
    description: 'Nice to have',
    color: 'border-blue-400 bg-blue-50',
  },
  {
    key: 'W',
    label: 'Won\'t',
    description: 'Explicitly out',
    color: 'border-gray-400 bg-gray-50',
  },
];

export function MoscowDrill() {
  const [assignments, setAssignments] = useState<Record<string, Bucket>>({});
  const [revealed, setRevealed] = useState(false);

  const score = ITEMS.reduce(
    (s, it) => s + (assignments[it.id] === it.correct ? 1 : 0),
    0,
  );
  const allAssigned = ITEMS.every((it) => assignments[it.id]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Context: you are scoping the <strong>Moomoo Canada v1 launch</strong>. Assign each
        feature to a MoSCoW bucket.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {BUCKETS.map((b) => (
          <div key={b.key} className={cn('p-2 rounded border-2', b.color)}>
            <div className="font-bold">{b.label}</div>
            <div className="text-gray-600">{b.description}</div>
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
                'bg-white p-2 rounded border-2 flex items-center gap-3',
                revealed && correct && 'border-emerald-400',
                revealed && wrong && 'border-rose-400',
                !revealed && 'border-gray-200',
              )}
            >
              <div className="flex-1 text-sm font-medium">{it.name}</div>
              <div className="flex gap-1">
                {BUCKETS.map((b) => (
                  <button
                    key={b.key}
                    disabled={revealed}
                    onClick={() => setAssignments({ ...assignments, [it.id]: b.key })}
                    className={cn(
                      'w-8 h-8 rounded border text-sm font-bold',
                      ans === b.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-gray-300 hover:bg-gray-50',
                      revealed && ans !== b.key && 'opacity-40',
                    )}
                  >
                    {b.key}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {revealed && (
        <div className="space-y-2 pt-2">
          {ITEMS.filter((it) => assignments[it.id] !== it.correct).map((it) => (
            <div key={it.id} className="text-xs p-2 bg-amber-50 border border-amber-200 rounded">
              <strong>{it.name}</strong> → correct: <strong>{it.correct}</strong>. {it.why}
            </div>
          ))}
        </div>
      )}

      {!revealed ? (
        <button
          disabled={!allAssigned}
          onClick={() => setRevealed(true)}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Reveal answers
        </button>
      ) : (
        <div className="bg-white p-3 rounded border">
          <div className="text-lg font-semibold">
            Score: {score} / {ITEMS.length}
          </div>
          <p className="text-sm mt-1 text-gray-700">
            Common mistake: putting everything in Must. A healthy MoSCoW has 2-3 items max in Must
            covering ~60% of capacity.
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
