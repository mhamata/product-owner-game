'use client';

import { useState } from 'react';
import { GradeDisplay, useLLMGrade } from './LLMGrade';

const SCENARIOS = [
  {
    id: 'priya-trialer',
    label: 'Priya (New trialer, evaluating Hubflow this week)',
    context:
      "Priya just started a free trial of Hubflow, a B2B team-collaboration SaaS. She is comparing it to two competitors. She has never set up SSO or invited a team before. She skims onboarding emails and lives in her existing tools — she will churn silently if first-run value isn't obvious.",
  },
  {
    id: 'darren-eng-lead',
    label: 'Darren (Engineering Lead, 12 years shipping software)',
    context:
      'Darren is an engineering lead whose team of 14 relies on Hubflow daily. They spend ~60% of their time wiring up integrations and chasing flaky dashboards and reliability issues. He has seen three "platform rebuilds" promise the world. He wants to get home for dinner.',
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
            placeholder="e.g., I start a trial on Friday and need to show my team something useful by Monday standup"
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
            placeholder="e.g., get my team collaborating in the new tool without a long setup project"
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
            placeholder="e.g., look decisive to my team instead of like I picked the wrong tool"
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
