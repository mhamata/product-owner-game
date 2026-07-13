'use client';

import { useEffect, useState } from 'react';
import type { GameState, IterationOutcome } from '@/engine/types';
import { cn } from '@/lib/cn';
import { CheckIcon, DollarIcon, XIcon } from '../Icon';
import { StepHeader } from './StepHeader';
import { deriveOutcomeBeats, type OutcomeBeat } from './explain';
import { useReducedMotion } from './useReducedMotion';
import { useReveal } from './useReveal';
import { useCalibrationStore } from '@/store/calibrationStore';
import { useDecisionLogStore, runIdFor, deriveOutcomeSummary } from '@/store/decisionLogStore';

/**
 * STEP 4 · OUTCOME: reveal cause → effect, one beat at a time.
 *
 * Every change the engine recorded in `outcome` gets a plain-language "BECAUSE"
 * derived (in explain.ts) from the SAME rule conditions the engine applied. The
 * reasons are not invented: morale from the commit ratio, tech debt from the
 * DoD / no-tech rules, happiness from served/partial/nothing, revenue from a
 * released product reaching non-churned customers.
 *
 * `preState` is the snapshot taken right before execute-iteration ran, needed
 * for the commit ratio and the pre-change happiness baseline.
 */
export function OutcomeStep({
  outcome,
  preState,
  postState,
}: {
  outcome: IterationOutcome;
  preState: GameState;
  postState: GameState;
}) {
  const reduced = useReducedMotion();
  const beats = deriveOutcomeBeats(outcome, preState, postState.customers);
  // Reveal each beat, then a trailing slot for the revenue banner (+1).
  const shown = useReveal(outcome.iteration, beats.length + 1, 520, reduced);

  // Resolve the player's calibration call for this sprint against reality, once.
  // After resolve() the pending call is cleared, so a re-render is a no-op; we
  // keep the resolved call in local state to render the readout.
  const pending = useCalibrationStore((s) => s.pending);
  const resolve = useCalibrationStore((s) => s.resolve);
  const calPredictions = useCalibrationStore((s) => s.predictions);
  const calHits = useCalibrationStore((s) => s.hits);
  const [call, setCall] = useState<{ predicted: boolean; actual: boolean } | null>(null);
  useEffect(() => {
    if (pending && pending.iteration === outcome.iteration) {
      const actual = outcome.notDone.length === 0;
      setCall({ predicted: pending.allShip, actual });
      resolve(actual);
    }
  }, [pending, resolve, outcome.iteration, outcome.notDone.length]);
  const calAccuracy = calPredictions > 0 ? Math.round((calHits / calPredictions) * 100) : null;

  // Attach a short, factual outcome summary (derived only from `outcome`, no
  // invented numbers) to this sprint's decision-log entry, once the roll has
  // resolved. Overwrite-safe (see attachOutcomePure), so a re-render is a
  // no-op rather than a duplicate.
  const attachOutcome = useDecisionLogStore((s) => s.attachOutcome);
  useEffect(() => {
    attachOutcome(runIdFor(postState.scenarioId, postState.seed), {
      summary: deriveOutcomeSummary(outcome),
    });
  }, [attachOutcome, postState.scenarioId, postState.seed, outcome]);

  const revenueBefore = preState.economy.revenue;
  const revenueAfter = postState.economy.revenue;
  const revenueDelta = outcome.revenueEarned;

  return (
    <section aria-labelledby="outcome-title">
      <StepHeader
        stepIndex={3}
        totalSteps={6}
        name="Outcome"
        eyebrow="Cause → effect"
        title={<span id="outcome-title">Here&apos;s why the numbers moved.</span>}
        sub="Every change has a reason. Read each beat. This is the judgment the sim is teaching."
      />

      {/* shipped / didn't-fit summary */}
      <div className="mt-5 flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-console-lg border border-line bg-panel p-[14px_16px]">
        {outcome.done.filter((p) => p.kind !== 'release-card').length === 0 &&
        outcome.notDone.length === 0 ? (
          <span className="mono text-[12px] text-mute">An empty sprint. Nothing was committed.</span>
        ) : (
          <>
            {outcome.done
              .filter((p) => p.kind !== 'release-card')
              .map((p) => (
                <span key={p.id} className="mono inline-flex items-center gap-[7px] text-[12px] text-ink-2">
                  <CheckIcon size={14} className="flex-none text-good" />
                  <b className="font-semibold text-ink">{p.title}</b>
                </span>
              ))}
            {outcome.notDone.map((p) => (
              <span key={p.id} className="mono inline-flex items-center gap-[7px] text-[12px] text-ink-2">
                <XIcon size={14} className="flex-none text-bad" />
                Didn&apos;t fit: <b className="font-semibold text-ink">{p.title}</b>
              </span>
            ))}
          </>
        )}
      </div>

      {/* calibration: the player's pre-roll call against what actually shipped */}
      {call && (
        <div
          className={cn(
            'mt-3 flex items-center gap-3 rounded-console-lg border p-[13px_16px]',
            call.predicted === call.actual ? 'border-good-line bg-good-050' : 'border-bad-line bg-bad-050',
          )}
        >
          <span
            className={cn(
              'inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-white',
              call.predicted === call.actual ? 'bg-good' : 'bg-bad',
            )}
            aria-hidden="true"
          >
            {call.predicted === call.actual ? <CheckIcon size={15} /> : <XIcon size={15} />}
          </span>
          <span className="text-[13.5px] leading-snug text-ink-2">
            You called{' '}
            <b className="font-semibold text-ink">
              {call.predicted ? 'all of it ships' : 'some would slip'}
            </b>
            , and {call.actual ? 'it all shipped' : 'some slipped'}.{' '}
            {call.predicted === call.actual ? 'Good read.' : 'Off this time.'}
          </span>
          {calAccuracy !== null && (
            <span className="mono ml-auto whitespace-nowrap text-[12px] text-slate">
              Calibration <b className="font-semibold text-ink">{calAccuracy}%</b>
            </span>
          )}
        </div>
      )}

      {/* beats */}
      <div className="mt-[18px] grid gap-3">
        {beats.length === 0 ? (
          <p className="text-[13px] text-mute">
            No measurable changes this sprint, a quiet one. Keep an eye on revenue: it only moves
            when you release finished work.
          </p>
        ) : (
          beats.map((beat, i) => <Beat key={beat.id} beat={beat} visible={i < shown} />)
        )}
      </div>

      {/* revenue change banner (only when revenue actually moved) */}
      {revenueDelta > 0 && (
        <div
          className={cn(
            'mt-4 flex items-center gap-3 rounded-console-lg border border-good-line bg-good-050 p-[15px_16px] transition-[opacity,transform] duration-300',
            shown > beats.length ? 'translate-y-0 opacity-100' : 'translate-y-2.5 opacity-0',
          )}
        >
          <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-good text-white" aria-hidden="true">
            <DollarIcon size={17} />
          </span>
          <span className="text-[14px] text-ink-2">
            Revenue this sprint:{' '}
            <b className="mono tnum font-bold text-ink">${revenueBefore.toLocaleString()}</b> →{' '}
            <b className="mono tnum font-bold text-ink">${revenueAfter.toLocaleString()}</b>
          </span>
          <span className="mono tnum ml-auto whitespace-nowrap text-[18px] font-semibold text-good">
            +${revenueDelta.toLocaleString()}
          </span>
        </div>
      )}
    </section>
  );
}

function Beat({ beat, visible }: { beat: OutcomeBeat; visible: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start gap-[13px] rounded-console-lg border border-line bg-paper p-[15px_16px] transition-[opacity,transform] duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2.5 opacity-0',
      )}
    >
      <span
        className={cn(
          'inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-base',
          beat.tone === 'good'
            ? 'border border-good-line bg-good-050'
            : beat.tone === 'bad'
              ? 'border border-bad-line bg-bad-050'
              : 'border border-line bg-panel',
        )}
        aria-hidden="true"
      >
        {beat.glyph}
      </span>
      <div className="min-w-0 flex-auto">
        <span className="flex flex-wrap items-baseline gap-2 text-[14.5px] font-semibold leading-[1.35] text-ink">
          {beat.effect}
          {beat.delta && (
            <span
              className={cn(
                'mono whitespace-nowrap rounded-full border px-2 py-0.5 text-[12px] font-semibold',
                beat.tone === 'good'
                  ? 'border-good-line bg-good-050 text-good'
                  : beat.tone === 'bad'
                    ? 'border-bad-line bg-bad-050 text-bad'
                    : 'border-line bg-panel text-slate',
              )}
            >
              {beat.delta}
            </span>
          )}
        </span>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-slate">
          <span className="mono mr-1.5 text-[10px] uppercase tracking-[0.12em] text-mute">Because</span>
          {beat.because}
        </p>
      </div>
    </div>
  );
}
