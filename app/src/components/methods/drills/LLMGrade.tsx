'use client';

import { useState } from 'react';

export interface GradeResult {
  parsed?: Record<string, unknown> | null;
  raw?: string;
  error?: string;
}

export function useLLMGrade(drill: 'jtbd' | 'mom-test' | 'pre-mortem' | 'pr-faq') {
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function grade(input: string, context?: Record<string, unknown>) {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drill, input, context }),
      });
      const data = (await r.json()) as GradeResult;
      setResult(data);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : 'Request failed' });
    } finally {
      setLoading(false);
    }
  }

  return { grade, result, loading, reset: () => setResult(null) };
}

export function GradeDisplay({ result, loading }: { result: GradeResult | null; loading: boolean }) {
  if (loading) return <p className="text-sm text-gray-500 italic">Grading via Claude…</p>;
  if (!result) return null;
  if (result.error) {
    return (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-800">
        {result.error}
      </div>
    );
  }
  if (result.parsed) {
    const p = result.parsed as Record<string, unknown>;
    const score = typeof p.score === 'number' ? p.score : null;
    return (
      <div className="p-3 bg-white border rounded space-y-2 text-sm">
        {score !== null && (
          <div className="text-2xl font-bold text-blue-900">{score}/10</div>
        )}
        {Object.entries(p)
          .filter(([k]) => k !== 'score')
          .map(([k, v]) => (
            <div key={k}>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {k.replace(/_/g, ' ')}
              </div>
              {Array.isArray(v) ? (
                <ul className="list-disc pl-5 text-sm">
                  {(v as unknown[]).map((item, i) => (
                    <li key={i}>{String(item)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">{String(v)}</p>
              )}
            </div>
          ))}
      </div>
    );
  }
  return (
    <pre className="text-xs bg-gray-50 border rounded p-2 whitespace-pre-wrap">{result.raw}</pre>
  );
}
