'use client';

import Link from 'next/link';
import type { GameState, Scenario } from '@/engine/types';
import { AlertTriangleIcon } from '../Icon';
import { deriveFiredBeatFacts } from './season';

/**
 * FIRED BEAT: the calm, full-screen story beat SimTabs.tsx shows FIRST,
 * regardless of which tab was active, the moment a run reaches `phase ===
 * 'fired'` (Sim 2.0 W3-F, design-sim-2.0.md §2.3's ruling — "a story beat,
 * not a punishment screen"). The fact, the sprint, one line of what the
 * record still proves, then exactly two ways forward: into the (now open)
 * job market, or straight to the full Career File.
 *
 * This is the "sim surface" experience the ledger's W2-D fired placeholder
 * (InboxTurn.tsx, kept as a defensive fallback for any direct caller) was
 * always meant to be superseded by.
 */
export function FiredBeat({
  state,
  scenario,
  onSeeOffers,
}: {
  state: GameState;
  scenario: Scenario;
  onSeeOffers: () => void;
}) {
  const { sprint, proofLine } = deriveFiredBeatFacts(state, scenario);

  return (
    <main className="flex min-h-[100dvh] flex-auto items-center bg-[var(--px-ground)]">
      <div className="mx-auto flex max-w-[440px] flex-col items-center px-6 py-16 text-center">
        <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--px-crit)]/12 text-[var(--px-crit)]">
          <AlertTriangleIcon size={24} />
        </span>
        <span className="mono mt-4 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--px-dimmer)]">
          {scenario.name} · Sprint {sprint}
        </span>
        <h1 className="mt-2 text-[21px] font-bold leading-[1.25] tracking-[-0.02em] text-[var(--px-ink)]">
          The board let you go.
        </h1>
        <p className="mt-3 max-w-[38ch] text-[13.5px] leading-[1.6] text-[var(--px-body)]">{proofLine}</p>
        <p className="mono mt-2 max-w-[36ch] text-[11px] leading-[1.5] text-[var(--px-dimmer)]">
          Getting fired and rebuilding somewhere smaller is a good story too.
        </p>

        <div className="mt-8 flex w-full max-w-[280px] flex-col gap-2.5">
          <button
            type="button"
            onClick={onSeeOffers}
            className="mono flex w-full items-center justify-center rounded-[12px] bg-[var(--px-accent)] px-4 py-3 text-[13.5px] font-bold uppercase tracking-[0.05em] text-[var(--px-on-accent)]"
          >
            See your offers
          </button>
          <Link
            href="/report"
            className="mono flex w-full items-center justify-center rounded-[12px] border border-[var(--px-line-strong)] px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-[var(--px-accent)]"
          >
            View your Career File
          </Link>
        </div>
      </div>
    </main>
  );
}
