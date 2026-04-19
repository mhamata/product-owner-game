'use client';

import { useState } from 'react';
import { GradeDisplay, useLLMGrade } from './LLMGrade';

const PROMPT = `Write the press-release opener for the Moomoo Canada "Clearing Pipeline v2" platform — an event-driven post-trade system replacing the legacy batch architecture. Target audience for the PR: Moomoo Canada employees, brokerage ops leaders, CIRO, and financial-press readers.`;

export function PrFaqDrill() {
  const [headline, setHeadline] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const { grade, result, loading, reset } = useLLMGrade('pr-faq');

  const combined = `HEADLINE:\n${headline}\n\nSUBTITLE:\n${subtitle}\n\nSUMMARY:\n${summary}`;

  return (
    <div className="space-y-4">
      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-sm">
        <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1">
          Assignment
        </div>
        <p className="text-indigo-950">{PROMPT}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Headline (one line — customer benefit, not feature name)
          </label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder='e.g., "Moomoo Canada cuts settlement breaks in half — and gets ops analysts home on time"'
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Subtitle (who specifically)
          </label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder='e.g., "New event-driven platform serves 14-person Canadian ops team and 120K daily trades"'
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Summary (3-4 sentences — problem it solves, in customer voice)
          </label>
          <textarea
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Previously, post-trade processing relied on nightly batch runs..."
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => grade(combined, { assignment: PROMPT })}
          disabled={loading || !headline || !subtitle || summary.length < 50}
          className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Grading…' : 'Grade with Claude'}
        </button>
        {result && (
          <button
            onClick={() => {
              setHeadline('');
              setSubtitle('');
              setSummary('');
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
