'use client';

import { useEffect, useState } from 'react';
import type { GameState, IterationOutcome } from '@/engine/types';
import { cn } from '@/lib/cn';
import { CheckIcon, RocketIcon, XIcon } from '../Icon';
import { Coachmark } from './Coachmark';
import { StepHeader } from './StepHeader';
import { useReducedMotion } from './useReducedMotion';

/**
 * STEP 3 · SHIP — animate the capacity "roll".
 *
 * The engine has ALREADY rolled capacity (the runner dispatched execute-iteration
 * before showing this step), so the landing number is authoritative:
 * `outcome.capacityRolled`, within `outcome.capacityRange`. We animate a tween up
 * to that exact value, then reveal which committed items fit (outcome.done) vs
 * didn't (outcome.notDone). Nothing here is randomised — only the *reveal* is.
 */
export function ShipStep({
  state,
  firstSprint,
}: {
  state: GameState;
  firstSprint: boolean;
}) {
  const outcome = state.lastOutcome;
  const reduced = useReducedMotion();
  const rolled = outcome?.capacityRolled ?? 0;
  const range = outcome?.capacityRange ?? { lower: 0, expected: 0, upper: 0 };

  const [display, setDisplay] = useState(reduced ? rolled : 0);
  const [revealed, setRevealed] = useState(reduced);

  const scaleMax = Math.max(20, range.upper + 4);
  const toPct = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;

  useEffect(() => {
    if (!outcome) return;

    let interval: number | undefined;
    let settleTimer: number | undefined;
    // Defer the first state change to an animation frame so the effect body
    // never calls setState synchronously (react-hooks/set-state-in-effect).
    const raf = window.requestAnimationFrame(() => {
      if (reduced) {
        setDisplay(rolled);
        setRevealed(true);
        return;
      }
      // Tween through plausible in-range values, then settle on the real roll.
      setRevealed(false);
      let ticks = 0;
      interval = window.setInterval(() => {
        ticks += 1;
        const span = Math.max(1, range.upper - range.lower);
        setDisplay(range.lower + Math.floor(Math.random() * (span + 1)));
        if (ticks > 11) {
          if (interval !== undefined) window.clearInterval(interval);
          setDisplay(rolled);
          settleTimer = window.setTimeout(() => setRevealed(true), 420);
        }
      }, 70);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      if (interval !== undefined) window.clearInterval(interval);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
    };
    // Re-run only when the rolled outcome changes (i.e. a new sprint resolved).
  }, [outcome, rolled, range.lower, range.upper, reduced]);

  if (!outcome) {
    return (
      <section>
        <StepHeader
          stepIndex={2}
          totalSteps={6}
          name="Ship"
          eyebrow="Capacity rolls"
          title="Rolling the sprint…"
          sub="Preparing the sprint result."
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="ship-title">
      <StepHeader
        stepIndex={2}
        totalSteps={6}
        name="Ship"
        eyebrow="Capacity rolls"
        title={<span id="ship-title">The sprint runs…</span>}
        sub={`Your real capacity lands somewhere in the ${range.lower}–${range.upper} range. Let's see how many of your committed points actually fit.`}
      />

      <Coachmark id="release" tag="Releasing" active={firstSprint}>
        Finished features only earn revenue when you <b>Ship a Release</b>. Building without releasing
        banks the work — but no money moves yet.
      </Coachmark>

      <div className="mt-[30px] text-center">
        <div className="mx-auto max-w-[460px] rounded-[14px] border border-line bg-paper p-[28px_24px] shadow-console-md">
          <div className="mono text-[10.5px] uppercase tracking-[0.14em] text-mute">Capacity rolled</div>
          {/* The tween cycles ~12 random in-range values; announcing each one
              floods a screen reader. So the animating number is aria-hidden and
              the final value is announced once via the polite live region below. */}
          <div
            className="mono tnum mb-0.5 mt-2.5 text-[64px] font-semibold leading-none tracking-[-0.02em] text-accent max-[560px]:text-[52px]"
            aria-hidden="true"
          >
            {display}
          </div>
          <div className="mono text-[12px] text-faint">
            within {range.lower}–{range.upper} pts
          </div>

          <div className="relative mt-[22px] h-2.5 overflow-hidden rounded-full bg-line-2" aria-hidden="true">
            <div
              className="absolute top-0 h-full bg-[repeating-linear-gradient(45deg,var(--color-accent-100),var(--color-accent-100)_5px,var(--color-accent-050)_5px,var(--color-accent-050)_10px)]"
              style={{ left: toPct(range.lower), width: toPct(range.upper - range.lower) }}
            />
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-accent transition-[width] duration-700"
              style={{ width: toPct(display) }}
            />
          </div>

          {/* Single polite live region: stays empty during the tween, then
              announces the final rolled value + fit summary exactly once when
              the reveal lands. This replaces the per-tick flood. */}
          <div className="sr-only" aria-live="polite">
            {revealed
              ? `Capacity rolled ${rolled} points, within the ${range.lower} to ${range.upper} range. ${shipSummary(outcome)}`
              : ''}
          </div>

          <div
            className={cn(
              'mt-6 grid gap-2.5 text-left transition-opacity duration-300',
              revealed ? 'opacity-100' : 'opacity-0',
            )}
          >
            {revealed &&
              [...outcome.done.map((p) => ({ p, fit: true })), ...outcome.notDone.map((p) => ({ p, fit: false }))].map(
                ({ p, fit }) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2.5 rounded-console border p-[10px_12px] text-[13.5px] text-ink-2',
                      fit ? 'border-good-line bg-good-050' : 'border-bad-line bg-bad-050',
                    )}
                  >
                    {fit ? (
                      <CheckIcon size={16} className="flex-none text-good" />
                    ) : (
                      <XIcon size={16} className="flex-none text-bad" />
                    )}
                    <b className="font-semibold text-ink">
                      {p.kind === 'release-card' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <RocketIcon size={13} /> Release
                        </span>
                      ) : (
                        p.title
                      )}
                    </b>
                    <span className="text-mute">· {fit ? 'Shipped' : "Didn't fit"}</span>
                    <span className="mono ml-auto text-[11px] text-mute">
                      {p.effortRevealed ?? p.effort} pts
                    </span>
                  </div>
                ),
              )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Plain-language fit summary for the single polite live region — what actually
 * fit in the rolled capacity vs what spilled over. Counts committed items only
 * (release cards are summarised as "the release" when present).
 */
function shipSummary(outcome: IterationOutcome): string {
  const fitCount = outcome.done.length;
  const missCount = outcome.notDone.length;
  const fitWord = fitCount === 1 ? 'item' : 'items';
  const missWord = missCount === 1 ? 'item' : 'items';
  if (missCount === 0) {
    return `All ${fitCount} committed ${fitWord} fit and shipped.`;
  }
  if (fitCount === 0) {
    return `None of the ${missCount} committed ${missWord} fit this sprint.`;
  }
  return `${fitCount} ${fitWord} shipped; ${missCount} ${missWord} didn't fit.`;
}
