'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { GameState, Scenario } from '@/engine/types';
import type { GameScore } from '@/engine/score';
import { useGameStore } from '@/store/gameStore';
import { useIndustryStore } from '@/store/industryStore';
import { DEFAULT_INDUSTRY } from '@/curriculum/industries';
import { cn } from '@/lib/cn';
import { Topbar } from '../Topbar';
import {
  ArrowRightIcon,
  CapIcon,
  DollarIcon,
  FlaskIcon,
  RestartIcon,
  TargetIcon,
} from '../Icon';
import { DIMENSIONS } from './dimensions';
import { deriveRunCompetencies, deriveArchetype } from './competency';
import { useSimEvidenceStore } from '@/store/simEvidenceStore';
import { COMPETENCIES, type Competency } from '@/curriculum/types';

/**
 * Console-styled end-of-game panel: the final 5-dimension scoreboard, the
 * revenue result against target, the decision log, and the AI retrospective.
 *
 * The retro reuses the existing /api/retro route (same request shape as the old
 * EndGamePanel). It DEGRADES GRACEFULLY without ANTHROPIC_API_KEY: the route
 * returns a 500 with an explanatory message, which we surface as a calm inline
 * note rather than an error state.
 */
export function SimEndPanel({
  state,
  scenario,
  score,
}: {
  state: GameState;
  scenario: Scenario;
  score: GameScore;
}) {
  const newGame = useGameStore((s) => s.newGame);
  // Restart should keep the player's home-industry theme; the assembled scenario
  // we already hold carries it, so we replay against the same scenario object.
  const industryHydrated = useIndustryStore((s) => s.hasHydrated);
  const storedIndustry = useIndustryStore((s) => s.industry);
  const industry = industryHydrated ? storedIndustry : DEFAULT_INDUSTRY;
  const [retro, setRetro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [missingKey, setMissingKey] = useState(false);
  // Calm note for the global at-capacity ceiling: the run is fine, the retro is
  // just deferred. Distinct from the missing-key note (different message) and
  // from a real error (different tone).
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fold this run's competency read into the simulator-evidence store, once.
  // The merge keeps the best score per competency, so re-recording is a no-op.
  const recordRun = useSimEvidenceStore((s) => s.recordRun);
  const runCompetencies = useMemo(
    () => deriveRunCompetencies(score, scenario.id),
    [score, scenario.id],
  );
  const sortedRun = useMemo(
    () =>
      (Object.entries(runCompetencies) as Array<[Competency, number]>).sort((a, b) => b[1] - a[1]),
    [runCompetencies],
  );
  useEffect(() => {
    recordRun(runCompetencies);
  }, [recordRun, runCompetencies]);
  const archetype = useMemo(() => deriveArchetype(score), [score]);

  async function generateRetro() {
    setLoading(true);
    setError(null);
    setMissingKey(false);
    setNotice(null);
    try {
      const r = await fetch('/api/retro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, scenarioId: scenario.id, score }),
      });
      if (!r.ok) {
        const text = await r.text();
        // The route returns this exact message when the key is absent.
        if (r.status === 500 && /ANTHROPIC_API_KEY/i.test(text)) {
          setMissingKey(true);
          return;
        }
        throw new Error(text || `HTTP ${r.status}`);
      }
      const data = await r.json();
      // A 200 can carry a calm "unavailable" payload (the global at-capacity
      // ceiling) instead of a retro. Show it as a quiet note, not an error.
      if (data.unavailable) {
        setNotice(data.message ?? 'The retrospective is unavailable right now.');
        return;
      }
      setRetro(data.retro);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const revenuePct = scenario.targetRevenue
    ? Math.min(100, (state.economy.revenue / scenario.targetRevenue) * 100)
    : 0;
  const hitTarget = state.economy.revenue >= scenario.targetRevenue;

  return (
    <>
      <Topbar
        context="simulation"
        right={
          <span className="mono inline-flex items-center gap-[9px] rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-slate">
            Simulation complete
          </span>
        }
      />

      <main className="flex-auto">
        <div className="mx-auto max-w-[880px] px-6 pb-24 pt-[30px] max-[560px]:px-4">
          <div className="flex flex-wrap items-center gap-[9px]">
            <span className="mono rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-[3px] text-[10.5px] uppercase tracking-[0.12em] text-accent">
              Capstone complete
            </span>
            <span className="eyebrow">{scenario.name}</span>
          </div>
          <h1 className="mt-3.5 text-[25px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink max-[560px]:text-[21px]">
            That&apos;s a wrap on {state.totalIterations} sprints.
          </h1>

          {/* the strategy you actually ran: reinforces that no line dominates */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-console-lg border border-line bg-panel p-[12px_14px]">
            <span className="mono inline-flex flex-none items-center gap-1.5 rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
              {archetype.label}
            </span>
            <span className="flex-1 text-[13px] leading-snug text-slate">{archetype.blurb}</span>
          </div>

          {/* total + revenue result */}
          <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-4 max-[560px]:grid-cols-1">
            <div className="flex flex-col justify-center rounded-console-lg border border-accent-100 bg-accent-050 p-5">
              <span className="mono text-[10px] uppercase tracking-[0.12em] text-accent">Overall</span>
              <span className="mono tnum text-[44px] font-semibold leading-none text-accent-700">
                {score.total.toFixed(1)}
              </span>
              <span className="mono mt-1 text-[11px] text-slate">out of 100</span>
            </div>
            <div className="flex flex-col justify-center rounded-console-lg border border-line bg-paper p-5">
              <span className="mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-mute">
                <DollarIcon size={13} className="text-slate" />
                Revenue vs target
              </span>
              <span className="mono tnum mt-2 text-[20px] font-semibold text-ink">
                ${state.economy.revenue.toLocaleString()}{' '}
                <span className="text-[14px] font-medium text-faint">
                  / ${scenario.targetRevenue.toLocaleString()}
                </span>
              </span>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className={cn('h-full rounded-full', hitTarget ? 'bg-good' : 'bg-accent')}
                  style={{ width: `${revenuePct}%` }}
                />
              </div>
              <span
                className={cn(
                  'mono mt-2 inline-flex items-center gap-1.5 text-[11px]',
                  hitTarget ? 'text-good' : 'text-mute',
                )}
              >
                <TargetIcon size={12} />
                {hitTarget ? 'Target reached' : `${Math.round(revenuePct)}% of target`}
              </span>
            </div>
          </div>

          {/* dimension breakdown */}
          <div className="mt-3 grid grid-cols-5 gap-3 max-[720px]:grid-cols-2 max-[560px]:grid-cols-1">
            {DIMENSIONS.map(({ key, label, flatLabel, Icon }) => {
              const value = Math.round(score[key]);
              return (
                <div key={key} className="flex flex-col gap-2.5 rounded-console-lg border border-line bg-paper p-[14px_12px]">
                  <div className="flex items-center gap-2">
                    <Icon size={15} className="flex-none text-slate" />
                    <span className="mono text-[9px] uppercase leading-[1.2] tracking-[0.05em] text-mute">
                      {label[0]}
                      <br />
                      {label[1]}
                    </span>
                  </div>
                  <span
                    className="mono tnum text-[24px] font-semibold leading-none text-ink"
                    aria-label={`${flatLabel}: ${value} out of 100`}
                  >
                    {value}
                  </span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* competency read: what this run demonstrated, saved to /progress */}
          {sortedRun.length > 0 && (
            <section className="mt-6 rounded-console-lg border border-line bg-paper p-5">
              <div className="flex items-center gap-2">
                <TargetIcon size={15} className="text-accent" />
                <span className="mono text-[11px] uppercase tracking-[0.12em] text-mute">
                  Competency read
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-[1.55] text-slate">
                What this run showed, scored 0 to 100. It is saved to your{' '}
                <Link
                  href="/progress"
                  className="font-semibold text-accent no-underline hover:underline"
                >
                  progress
                </Link>{' '}
                as evidence from the simulator, separate from skill mastery.
              </p>
              <div className="mt-3.5 grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">
                {sortedRun.map(([comp, value]) => (
                  <div
                    key={comp}
                    className="flex items-center justify-between gap-3 rounded-console border border-line bg-panel px-3 py-2"
                  >
                    <span className="text-[13px] text-ink-2">
                      {COMPETENCIES[comp]?.label ?? comp}
                    </span>
                    <span className="mono tnum text-[13px] font-semibold text-accent-700">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI retrospective */}
          <section className="mt-6 rounded-console-lg border border-line bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-mute">
                <CapIcon size={15} className="text-accent" />
                AI Retrospective
              </span>
              {!retro && !missingKey && (
                <button
                  type="button"
                  onClick={generateRetro}
                  disabled={loading}
                  className="mono inline-flex items-center gap-1.5 rounded-console border-0 bg-accent px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-white transition-[background,opacity] duration-150 hover:bg-accent-700 disabled:opacity-50"
                >
                  <FlaskIcon size={13} />
                  {loading ? 'Generating…' : 'Generate'}
                </button>
              )}
            </div>

            {retro ? (
              <div className="mt-3.5 whitespace-pre-wrap text-[13.5px] leading-[1.6] text-ink-2">
                {retro}
              </div>
            ) : missingKey ? (
              <p className="mt-3 text-[13px] leading-[1.6] text-slate">
                The AI retrospective needs an{' '}
                <code className="mono rounded bg-panel-2 px-1.5 py-0.5 text-[12px] text-ink">ANTHROPIC_API_KEY</code>{' '}
                in <code className="mono rounded bg-panel-2 px-1.5 py-0.5 text-[12px] text-ink">.env.local</code>.
                Your full decision log is below. Everything the retro would analyze is captured there.
              </p>
            ) : notice ? (
              <p className="mt-3 text-[13px] leading-[1.6] text-slate">{notice}</p>
            ) : error ? (
              <p className="mt-3 rounded-console border border-bad-line bg-bad-050 p-2.5 text-[12px] text-bad-700">
                Couldn&apos;t generate the retro: {error}
              </p>
            ) : !loading ? (
              <p className="mt-3 text-[13px] leading-[1.6] text-mute">
                Generate a senior-PM retrospective of your run: strengths, growth edges, and an
                interview-ready STAR story drawn from your decisions.
              </p>
            ) : null}
          </section>

          {/* decision log */}
          <section className="mt-6">
            <span className="mono text-[11px] uppercase tracking-[0.12em] text-mute">Decision log</span>
            <ul className="mt-3 grid gap-2">
              {state.eventLog.length === 0 ? (
                <li className="text-[13px] italic text-faint">No event decisions logged this run.</li>
              ) : (
                state.eventLog.map((e, i) => (
                  <li key={i} className="rounded-console border border-line bg-paper p-[10px_12px]">
                    <div className="mono text-[10px] uppercase tracking-[0.08em] text-faint">
                      Sprint {e.iteration}
                    </div>
                    <div className="mt-0.5 text-[13px] text-ink-2">{e.summary}</div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* actions */}
          <div className="mt-7 flex flex-wrap gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => newGame(scenario.id, { scenario, industry })}
              className="mono inline-flex items-center gap-2 rounded-console border-0 bg-accent px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-[background] duration-150 hover:bg-accent-700"
            >
              <RestartIcon size={14} />
              Play again
            </button>
            <Link
              href="/"
              className="mono inline-flex items-center gap-2 rounded-console border border-line bg-paper px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
            >
              Back to practice
              <ArrowRightIcon size={13} />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
