'use client';

import { useState } from 'react';
import { GradeDisplay, useLLMGrade } from './LLMGrade';

const PROJECT = `Moomoo Canada will rebuild the clearing & settlement platform from a batch architecture to an event-driven architecture. Target: 2 quarters. Team: 4 engineers + 1 QA. Success = 60% reduction in break rate, zero settlement fails during cutover, CIRO audit passes. The batch system currently runs the entire post-trade flow — any cutover risk is existential.`;

export function PreMortemDrill() {
  const [failures, setFailures] = useState<string[]>(['', '', '', '']);
  const { grade, result, loading, reset } = useLLMGrade('pre-mortem');

  const joined = failures
    .map((f, i) => `${i + 1}. ${f}`)
    .filter((l) => l.split('. ')[1].length > 5)
    .join('\n');

  return (
    <div className="space-y-4">
      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-sm">
        <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1">
          The project
        </div>
        <p className="text-indigo-950">{PROJECT}</p>
      </div>
      <p className="text-sm text-gray-700">
        Imagine it is 6 months from now. We launched. It failed. <strong>List 4 ways it could have
        gone wrong.</strong> Aim for breadth (technical, organizational, stakeholder, market,
        regulatory).
      </p>

      <div className="space-y-2">
        {failures.map((f, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-xs font-bold text-gray-500 mt-2">#{i + 1}</span>
            <textarea
              value={f}
              rows={2}
              onChange={(e) => {
                const next = [...failures];
                next[i] = e.target.value;
                setFailures(next);
              }}
              placeholder="e.g., HQ platform team blocked a required API change and we were stuck on a forked version for 6 weeks"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => grade(joined, { project: PROJECT })}
          disabled={loading || failures.some((f) => f.trim().length < 10)}
          className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Grading…' : 'Grade coverage with Claude'}
        </button>
        {result && (
          <button
            onClick={() => {
              setFailures(['', '', '', '']);
              reset();
            }}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset
          </button>
        )}
      </div>

      <GradeDisplay result={result} loading={loading} />
    </div>
  );
}
