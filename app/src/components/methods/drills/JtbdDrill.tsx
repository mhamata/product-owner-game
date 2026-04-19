'use client';

import { useState } from 'react';
import { GradeDisplay, useLLMGrade } from './LLMGrade';

const SCENARIOS = [
  {
    id: 'priya-investor',
    label: 'Priya (24, first-time investor, $2K to invest)',
    context:
      'Priya is 24, Vancouver, recent grad. Has $2K to invest. Spends time on r/CanadianInvestor. Follows finfluencers on TikTok. Has never had a brokerage account. Sees ads for Wealthsimple, Questrade, and now Moomoo.',
  },
  {
    id: 'darnell-ops',
    label: 'Darnell (Ops Team Lead, 12 years brokerage ops)',
    context:
      'Darnell leads a team of 14 ops analysts at Moomoo Canada. His team spends ~60% of their time on reconciliations and break resolution. He has seen three "platform rebuilds" promise the world. He wants to get home for dinner.',
  },
];

export function JtbdDrill() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const [situation, setSituation] = useState('');
  const [motivation, setMotivation] = useState('');
  const [outcome, setOutcome] = useState('');
  const { grade, result, loading, reset } = useLLMGrade('jtbd');

  const statement = `When ${situation || '[situation]'}, I want to ${
    motivation || '[motivation]'
  }, so I can ${outcome || '[outcome]'}.`;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Pick a user
        </label>
        <select
          value={scenarioId}
          onChange={(e) => setScenarioId(e.target.value)}
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-600 mt-2">{scenario.context}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            When…（situation)
          </label>
          <input
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g., I get my first real paycheque and my friends are posting investment gains"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            …I want to（motivation — the job, not the feature)
          </label>
          <input
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g., start investing my $2K without needing a finance degree"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            …so I can（outcome — what user gains)
          </label>
          <input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g., feel like I'm doing the grown-up thing"
          />
        </div>
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm italic">
        {statement}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => grade(statement, { persona: scenario.context })}
          disabled={loading || !situation || !motivation || !outcome}
          className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Grading…' : 'Grade with Claude'}
        </button>
        {result && (
          <button
            onClick={() => {
              setSituation('');
              setMotivation('');
              setOutcome('');
              reset();
            }}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset
          </button>
        )}
      </div>

      <GradeDisplay result={result} loading={loading} />

      {!process.env.NEXT_PUBLIC_HAS_KEY && (
        <p className="text-xs text-gray-500">
          Requires <code className="bg-gray-100 px-1">ANTHROPIC_API_KEY</code> in{' '}
          <code className="bg-gray-100 px-1">.env.local</code>.
        </p>
      )}
    </div>
  );
}
