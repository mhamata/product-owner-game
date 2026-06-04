'use client';

import { useSimEvidenceStore } from '@/store/simEvidenceStore';
import { COMPETENCIES, type Competency } from '@/curriculum/types';
import { FlaskIcon } from './Icon';

/**
 * The progress page's simulator band: competencies the player has demonstrated
 * in the simulations, scored at their best run.
 *
 * This sits BELOW the 12-competency matrix and is deliberately a separate read:
 * the matrix is mastery of studied skills, this is judgment shown under pressure
 * in play. Keeping them apart is the honest design (a strong sim run is evidence,
 * not a substitute for the reps a skill is gated on).
 */
export function SimEvidenceBand() {
  const scores = useSimEvidenceStore((s) => s.scores);
  const hasHydrated = useSimEvidenceStore((s) => s.hasHydrated);

  const entries = (Object.entries(scores) as Array<[Competency, number]>)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <section className="mt-11">
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-line pb-3">
        <span className="mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-console-sm border border-line bg-panel-2 px-[10px] py-1 text-[11px] uppercase tracking-[0.14em] text-mute">
          <FlaskIcon size={13} />
          Simulator
        </span>
        <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">
          Evidence from the simulator
        </span>
      </div>
      <p className="mt-3 max-w-[64ch] text-[14px] text-slate">
        Competencies you have demonstrated under pressure in the simulations,
        scored 0 to 100 at your best run. This is judgment shown in play, kept
        separate from the skills you have mastered above.
      </p>

      {!hasHydrated || entries.length === 0 ? (
        <p className="mt-5 rounded-console-lg border border-dashed border-line bg-panel/60 p-4 text-[13.5px] text-slate">
          {hasHydrated
            ? 'No runs yet. Finish a simulation and your competency read lands here.'
            : 'Loading...'}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 max-[560px]:grid-cols-1">
          {entries.map(([comp, value]) => (
            <div
              key={comp}
              className="flex flex-col gap-2 rounded-console-lg border border-line bg-paper p-[14px_16px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink">
                  {COMPETENCIES[comp]?.label ?? comp}
                </span>
                <span className="mono tnum text-[15px] font-semibold text-accent-700">{value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
