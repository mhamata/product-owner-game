'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

interface Quote {
  id: string;
  text: string;
  good: boolean;
  why: string;
}

const QUOTES: Quote[] = [
  {
    id: '1',
    text: '"I\'d definitely use something like that! When are you launching?"',
    good: false,
    why: 'Compliment + hypothetical future. Politeness noise. Zero signal about real behavior.',
  },
  {
    id: '2',
    text: '"Last Saturday I spent 40 minutes in Excel reconciling my TFSA contribution room. I ended up calling my sister who\'s an accountant."',
    good: true,
    why: 'Specific past behavior. Concrete time cost. Reveals workaround (asking sister) — a hint at real pain.',
  },
  {
    id: '3',
    text: '"That sounds like a great idea!"',
    good: false,
    why: 'Pure compliment. Could say this about anything. Nothing to act on.',
  },
  {
    id: '4',
    text: '"Last month I almost switched to Wealthsimple because I needed fractional shares for my daughter\'s RESP. I didn\'t switch because changing brokers is a hassle."',
    good: true,
    why: 'Specific past almost-action. Names the competitor and the specific use case. Ends with a switching-cost insight.',
  },
  {
    id: '5',
    text: '"I think people would pay $5/month for that."',
    good: false,
    why: 'Hypothetical about OTHER people. Even strong respondents are terrible at this. Ask what THEY pay for today.',
  },
  {
    id: '6',
    text: '"Yeah I tried the chart analysis feature in the app last week but I couldn\'t figure out how to save a study. I ended up taking a screenshot."',
    good: true,
    why: 'Specific past use. Named friction point. Named workaround. You could prototype the fix today.',
  },
];

export function MomTestDrill() {
  const [answers, setAnswers] = useState<Record<string, 'good' | 'bad' | null>>({});
  const [revealed, setRevealed] = useState(false);

  const score = QUOTES.reduce((s, q) => {
    const ans = answers[q.id];
    if (ans == null) return s;
    return s + (ans === (q.good ? 'good' : 'bad') ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Classify each customer quote. Does it give you a real behavioral signal
        (<strong>Good</strong>), or is it politeness/speculation (<strong>Bad</strong>)?
      </p>
      <div className="space-y-2">
        {QUOTES.map((q) => {
          const ans = answers[q.id];
          const correct = revealed && ans === (q.good ? 'good' : 'bad');
          const wrong = revealed && ans != null && !correct;
          return (
            <div
              key={q.id}
              className={cn(
                'bg-white p-3 rounded border-2',
                revealed && correct && 'border-emerald-400',
                revealed && wrong && 'border-rose-400',
                !revealed && 'border-gray-200',
              )}
            >
              <p className="text-sm italic">{q.text}</p>
              <div className="mt-2 flex gap-2">
                <button
                  disabled={revealed}
                  onClick={() => setAnswers({ ...answers, [q.id]: 'good' })}
                  className={cn(
                    'text-xs px-3 py-1 rounded border',
                    ans === 'good'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
                    revealed && 'opacity-60',
                  )}
                >
                  Good signal
                </button>
                <button
                  disabled={revealed}
                  onClick={() => setAnswers({ ...answers, [q.id]: 'bad' })}
                  className={cn(
                    'text-xs px-3 py-1 rounded border',
                    ans === 'bad'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'border-rose-300 text-rose-700 hover:bg-rose-50',
                    revealed && 'opacity-60',
                  )}
                >
                  Bad signal
                </button>
              </div>
              {revealed && (
                <div className="mt-2 text-xs p-2 rounded bg-gray-50 text-gray-700">
                  <strong>{q.good ? 'Good' : 'Bad'}:</strong> {q.why}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          disabled={Object.keys(answers).length < QUOTES.length}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Reveal answers ({Object.keys(answers).length}/{QUOTES.length} classified)
        </button>
      ) : (
        <div className="bg-white p-3 rounded border">
          <div className="text-lg font-semibold">
            Score: {score} / {QUOTES.length}
          </div>
          <p className="text-sm text-gray-700 mt-1">
            {score === QUOTES.length
              ? 'Perfect. You can spot politeness from behavior. This is the core Mom Test skill.'
              : score >= 4
              ? 'Solid. Watch out for compliments masquerading as signal.'
              : 'Re-read the Mom Test section — the rule is past behavior only.'}
          </p>
          <button
            onClick={() => {
              setAnswers({});
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
