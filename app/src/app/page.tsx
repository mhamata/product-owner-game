'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { scenarios } from '@/scenarios';
import { useGameStore } from '@/store/gameStore';

export default function Home() {
  const { state, scenarioId, newGame, abandon } = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">PRAXIS</h1>
          <p className="text-lg text-gray-600 mt-2">
            Product-management simulation — rehearse PM decisions before the interview.
          </p>
        </div>
        <Link
          href="/methods"
          className="px-4 py-2 bg-white border border-gray-300 rounded hover:border-blue-400 hover:shadow-sm text-sm font-medium"
        >
          📚 Methods Library
        </Link>
      </header>

      {hydrated && state && scenarioId && (
        <div className="mb-8 p-4 border border-amber-300 bg-amber-50 rounded">
          <p className="font-semibold">Game in progress</p>
          <p className="text-sm text-gray-700 mt-1">
            {scenarios[scenarioId]?.name} — iteration {state.iterationNumber} of{' '}
            {state.totalIterations} · phase: {state.phase}
          </p>
          <div className="flex gap-3 mt-3">
            <Link
              href={`/play/${scenarioId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Resume
            </Link>
            <button
              onClick={() => {
                if (confirm('Abandon current game?')) abandon();
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Abandon
            </button>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Scenarios</h2>
        <div className="grid gap-4">
          {Object.values(scenarios).map((s) => (
            <div
              key={s.id}
              className="p-5 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
            >
              <h3 className="text-lg font-semibold">{s.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{s.summary}</p>
              <p className="text-xs text-gray-500 mt-2">
                {s.totalIterations} iterations · {s.initialBacklog.length} backlog items ·{' '}
                {s.customers.length} personas
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/play/${s.id}`}
                  onClick={() => newGame(s.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Start new game
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 pt-6 border-t text-sm text-gray-500">
        <p>
          State persists to localStorage. Read the full design in{' '}
          <code className="bg-gray-100 px-1 rounded">/prd</code> and{' '}
          <code className="bg-gray-100 px-1 rounded">/engine</code>.
        </p>
      </footer>
    </main>
  );
}
