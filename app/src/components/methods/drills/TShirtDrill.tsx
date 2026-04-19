'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface Story {
  id: string;
  title: string;
  description: string;
  correct: Size;
  why: string;
}

const STORIES: Story[] = [
  {
    id: 'cad-toggle',
    title: 'CAD currency display toggle',
    description: 'Add a preference to default the UI to CAD instead of USD.',
    correct: 'S',
    why: 'Small but touches every price display component. 2-3 days of careful work.',
  },
  {
    id: 'tfsa',
    title: 'TFSA Account Support',
    description:
      'New account type: CRA integration, contribution tracking, T5 tax reporting, transfer-in flow.',
    correct: 'L',
    why: 'Regulatory integration + multiple flows + tax edge cases. ~2 sprints.',
  },
  {
    id: 'push',
    title: 'Push notification timezone fix',
    description: 'Notifications currently fire at US market times. Fix for Canadian users.',
    correct: 'XS',
    why: 'Config change + backend test. ~1 day.',
  },
  {
    id: 'us-options',
    title: 'US Options Trading with Canadian tax reporting',
    description:
      'Full options chain UI, OCC integration, margin calculations, Canadian T5008 tax handling.',
    correct: 'XXL',
    why: 'Multi-quarter. Break down before any sprint commitment — options clearing alone is L.',
  },
  {
    id: 'social-feed',
    title: 'Canadian social feed (v1)',
    description: 'Scoped regional feed with post/comment, compliance moderation rules.',
    correct: 'M',
    why: 'One sprint of focused work. Compliance review adds scope vs a typical social feed.',
  },
];

export function TShirtDrill() {
  const [guesses, setGuesses] = useState<Record<string, Size | undefined>>({});
  const [revealed, setRevealed] = useState(false);

  const score = STORIES.reduce(
    (s, st) => s + (guesses[st.id] === st.correct ? 1 : 0),
    0,
  );
  const allAssigned = STORIES.every((st) => guesses[st.id]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Size each story. XS ≈ 1 day · S ≈ 2-3 days · M ≈ 1 sprint · L ≈ 2 sprints · XL ≈ 1 quarter
        · XXL = break this down first.
      </p>
      <div className="space-y-3">
        {STORIES.map((st) => {
          const ans = guesses[st.id];
          const correct = revealed && ans === st.correct;
          const wrong = revealed && ans != null && !correct;
          return (
            <div
              key={st.id}
              className={cn(
                'bg-white p-3 rounded border-2',
                revealed && correct && 'border-emerald-400',
                revealed && wrong && 'border-rose-400',
                !revealed && 'border-gray-200',
              )}
            >
              <h4 className="font-semibold text-sm">{st.title}</h4>
              <p className="text-xs text-gray-600 mt-0.5">{st.description}</p>
              <div className="flex gap-1 mt-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    disabled={revealed}
                    onClick={() => setGuesses({ ...guesses, [st.id]: s })}
                    className={cn(
                      'text-xs px-3 py-1 rounded border font-semibold',
                      ans === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {revealed && (
                <div className="text-xs text-gray-700 mt-2">
                  <strong>{st.correct}:</strong> {st.why}
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
          <div className="text-lg font-semibold">Score: {score} / {STORIES.length}</div>
          <p className="text-sm mt-1 text-gray-700">
            Rule of thumb: anything bigger than M should be broken down before entering a sprint.
          </p>
          <button
            onClick={() => {
              setGuesses({});
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
