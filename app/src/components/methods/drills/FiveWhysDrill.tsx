'use client';

import { useState } from 'react';

const SYMPTOM = 'We failed to settle $2.3M of trades on the T+1 cycle last Tuesday.';

const CANONICAL = [
  {
    why: 'The trade-match file from DTCC contained unexpected field deltas.',
    hint: 'Technical cause. Not the root.',
  },
  {
    why: "DTCC's file format changed as part of their protocol release notes v42.",
    hint: "We didn't catch the change.",
  },
  {
    why: "We don't subscribe to DTCC's protocol update mailing list.",
    hint: 'Process cause — getting closer.',
  },
  {
    why: 'There is no designated owner for vendor protocol-change monitoring.',
    hint: 'Organizational cause.',
  },
  {
    why: 'Vendor management was never staffed in the Canada launch plan — HQ assumed HK ops would cover it.',
    hint: 'Root: organizational. Fix is hiring + process, not a patch.',
  },
];

export function FiveWhysDrill() {
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="p-3 bg-rose-50 border border-rose-200 rounded">
        <div className="text-xs font-bold text-rose-900 uppercase tracking-wide mb-1">
          Symptom to investigate
        </div>
        <p className="text-sm text-rose-950">{SYMPTOM}</p>
      </div>
      <p className="text-sm text-gray-700">
        Ask <em>why</em> five times, each time going deeper than the surface cause. Stop only
        when you reach an organizational or systemic root.
      </p>
      <div className="space-y-2">
        {answers.map((a, i) => (
          <div key={i} className="bg-white p-3 rounded border">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Why #{i + 1}
            </div>
            <textarea
              rows={2}
              disabled={revealed}
              value={a}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
              className="w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              placeholder={i === 0 ? 'Why did the symptom happen?' : 'Why did the previous cause happen?'}
            />
            {revealed && (
              <div className="mt-2 text-xs p-2 bg-gray-50 rounded text-gray-700">
                <div className="font-semibold text-gray-900">Canonical:</div>
                <p>{CANONICAL[i].why}</p>
                <p className="text-gray-500 italic mt-1">{CANONICAL[i].hint}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          disabled={answers.some((a) => a.trim().length < 5)}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Compare with canonical answer
        </button>
      ) : (
        <div className="bg-white p-3 rounded border">
          <p className="text-sm text-gray-700">
            The hardest discipline: not stopping at the first human-error cause (e.g.,
            "the dev missed it"). Root causes are almost always organizational or process-level.
            If your fifth why is still technical, go deeper.
          </p>
          <button
            onClick={() => {
              setAnswers(['', '', '', '', '']);
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
