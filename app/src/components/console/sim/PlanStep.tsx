'use client';

import type { Action, GameState, PBI } from '@/engine/types';
import { cn } from '@/lib/cn';
import {
  CircleIcon,
  DollarIcon,
  GaugeIcon,
  ListIcon,
  MinusIcon,
  PlusIcon,
  RocketIcon,
  TrendingUpIcon,
  UsersIcon,
  CheckIcon,
} from '../Icon';
import { Coachmark } from './Coachmark';
import { StepHeader } from './StepHeader';
import { capacityBreakdown, telegraphImpacts } from './explain';
import { projectIteration } from './projection';

const effortOf = (p: PBI) => p.effortRevealed ?? p.effort;

/**
 * PLAN: choose the sprint backlog.
 *
 * Sim 2.0 (W2-D): this is no longer a standalone step in a linear flow — it is
 * reused WHOLESALE as the body of InboxTurn's Plan decision sheet ("what will
 * you build this sprint?"). Full backlog-UX redesign is a later slice; this
 * component is intentionally unchanged apart from hiding the old "Step 1 of
 * 6" badge (see `hideStepBadge` below).
 *
 * Wiring to the engine (no game logic lives here):
 *   - toggling a normal item dispatches add-to-iteration / remove-from-iteration
 *   - toggling the Release card dispatches place-release-card (index = end, or null)
 * Everything rendered (capacity range, committed points, forecast) is read from
 * GameState + the engine's pure read functions (calculateCapacityRange via the
 * capacityBreakdown / projectIteration helpers).
 */
export function PlanStep({
  state,
  dispatch,
  firstSprint,
}: {
  state: GameState;
  dispatch: (a: Action) => void;
  firstSprint: boolean;
}) {
  const breakdown = capacityBreakdown(state);
  const projection = projectIteration(state);

  // selected = iterationBacklog (minus the release card, shown separately);
  // available = productBacklog. The release card is tracked via its presence in
  // the iteration backlog.
  const releaseSelected = state.iterationBacklog.some((p) => p.kind === 'release-card');
  const committed = projection.committed;

  // Scale for the capacity bar: keep the band comfortably inside the track.
  const scaleMax = Math.max(20, breakdown.upper + 4);
  const toPct = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;
  const over = committed > breakdown.upper;

  // The Release card is synthetic until placed (engine builds it on dispatch),
  // so we render a fixed descriptor here that mirrors engine/step.ts.
  const releaseCost = state.tech.releaseCost;

  function toggleItem(pbi: PBI, selected: boolean) {
    dispatch(
      selected
        ? { type: 'remove-from-iteration', pbiId: pbi.id }
        : { type: 'add-to-iteration', pbiId: pbi.id },
    );
  }

  function toggleRelease() {
    dispatch({ type: 'place-release-card', index: releaseSelected ? null : state.iterationBacklog.length });
  }

  // Items shown in the picker: everything available plus everything selected
  // (so a chosen item stays visible, checked, in place). The engine moves items
  // between backlogs; we present a single unified, ordered list.
  const selectedReal = state.iterationBacklog.filter((p) => p.kind !== 'release-card');
  const pickerItems: Array<{ pbi: PBI; selected: boolean }> = [
    ...selectedReal.map((pbi) => ({ pbi, selected: true })),
    ...state.productBacklog.map((pbi) => ({ pbi, selected: false })),
  ];

  return (
    <section aria-labelledby="plan-title">
      <StepHeader
        stepIndex={0}
        totalSteps={6}
        name="Plan"
        eyebrow="Commit your sprint"
        title={<span id="plan-title">What will the team build this sprint?</span>}
        sub="Pick the work to commit. Watch capacity and the live forecast as you go. You can't build everything."
        hideStepBadge
      />

      <Coachmark id="capacity" tag="Capacity" active={firstSprint}>
        Your team&apos;s capacity is a <b>range, not a promise</b>. You can&apos;t build everything.
        Commit close to the likely line and leave a little slack.
      </Coachmark>

      <div className="mt-[22px] grid grid-cols-1 gap-[18px]">
        {/* capacity panel */}
        <div className="rounded-console-lg border border-[var(--px-line)] bg-[var(--px-card)] p-[18px]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="mono inline-flex items-center gap-[7px] text-[11px] uppercase tracking-[0.12em] text-[var(--px-dimmer)]">
              <GaugeIcon size={14} className="text-[var(--px-dim)]" />
              Capacity this sprint
            </span>
            <span className="mono tnum text-[13px] font-semibold text-[var(--px-ink)]">
              {breakdown.lower}-{breakdown.upper} pts · likely{' '}
              <b className="text-[var(--px-accent)]">{breakdown.expected}</b>
            </span>
          </div>

          {/* range bar */}
          <div className="relative mt-4 h-[38px]" aria-hidden="true">
            <div className="absolute inset-x-0 top-3.5 h-2.5 rounded-full bg-[var(--px-line)]" />
            <div
              className="absolute top-3.5 h-2.5 rounded-[2px] border-x-[1.5px] border-[var(--px-accent)] bg-[repeating-linear-gradient(45deg,color-mix(in_srgb,var(--px-accent)_28%,transparent),color-mix(in_srgb,var(--px-accent)_28%,transparent)_5px,color-mix(in_srgb,var(--px-accent)_12%,transparent)_5px,color-mix(in_srgb,var(--px-accent)_12%,transparent)_10px)]"
              style={{ left: toPct(breakdown.lower), width: toPct(breakdown.upper - breakdown.lower) }}
            />
            <div className="absolute top-1.5 h-[26px] w-[1.5px] bg-[var(--px-dim)]" style={{ left: toPct(breakdown.expected) }} />
            <div
              className="mono absolute top-[-2px] -translate-x-1/2 whitespace-nowrap text-[9.5px] text-[var(--px-dim)]"
              style={{ left: toPct(breakdown.expected) }}
            >
              likely {breakdown.expected}
            </div>
            <div
              className={cn(
                'absolute top-3.5 left-0 h-2.5 rounded-full transition-[width,background] duration-500',
                over ? 'bg-[var(--px-crit)]' : 'bg-[var(--px-accent)]',
              )}
              style={{ width: toPct(committed) }}
            />
            <div
              className={cn(
                'mono absolute top-7 -translate-x-1/2 whitespace-nowrap text-[9.5px] font-semibold transition-[left] duration-500',
                over ? 'text-[var(--px-crit)]' : 'text-[var(--px-accent)]',
              )}
              style={{ left: toPct(committed) }}
            >
              {committed} pts
            </div>
          </div>

          {/* capacity "why" breakdown */}
          <div className="mt-[18px] flex flex-wrap gap-2 border-t border-dashed border-[var(--px-line)] pt-[15px]">
            <span className="mono mr-0.5 self-center text-[10px] uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
              Why
            </span>
            {breakdown.contributions.map((c, i) => (
              <span
                key={i}
                className={cn(
                  'mono tnum inline-flex items-center gap-1.5 rounded-full border px-[9px] py-1 text-[11.5px]',
                  c.kind === 'penalty'
                    ? 'border-[var(--px-crit)] bg-[color-mix(in_srgb,var(--px-crit)_10%,transparent)] text-[var(--px-crit)]'
                    : c.kind === 'bonus'
                      ? 'border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_10%,transparent)] text-[var(--px-good)]'
                      : 'border-[var(--px-line)] bg-[var(--px-ground)] text-[var(--px-ink)]',
                )}
              >
                {c.kind === 'base' ? (
                  <CircleIcon size={12} />
                ) : c.kind === 'penalty' ? (
                  <MinusIcon size={12} />
                ) : (
                  <PlusIcon size={12} />
                )}
                {c.kind === 'base'
                  ? `Base ${Math.round(c.delta)}`
                  : `${Math.abs(Math.round(c.delta))} · ${c.label}`}
              </span>
            ))}
          </div>
          {breakdown.varianceNotes.length > 0 && (
            <p className="mt-2.5 text-[12px] leading-[1.5] text-[var(--px-dim)]">
              {capitalize(breakdown.varianceNotes.join('; '))}.
            </p>
          )}
        </div>

        {/* backlog picker */}
        <div>
          <div className="mb-0.5 flex items-baseline justify-between gap-3">
            <span className="mono text-[11px] uppercase tracking-[0.12em] text-[var(--px-dimmer)]">Backlog</span>
            <span className="text-[12.5px] text-[var(--px-dimmer)]">Tap to add · effort &amp; telegraphed impact shown</span>
          </div>

          <div role="group" aria-label="Backlog items, tap to add to the sprint">
            {pickerItems.map(({ pbi, selected }) => (
              <BacklogItem
                key={pbi.id}
                pbi={pbi}
                selected={selected}
                over={over && selected}
                isNew={state.newlyDiscoveredIds.includes(pbi.id)}
                customers={state.customers}
                onToggle={() => toggleItem(pbi, selected)}
              />
            ))}

            {/* the unmissable Release card */}
            <ReleaseCard cost={releaseCost} selected={releaseSelected} onToggle={toggleRelease} />
          </div>

          {/* live forecast */}
          <div
            className="mt-3.5 flex flex-wrap items-center gap-4 rounded-console-lg border border-[var(--px-line)] bg-[var(--px-ground)] p-[14px_16px]"
            role="status"
            aria-live="polite"
          >
            <span className="mono inline-flex items-center gap-[7px] text-[10px] uppercase tracking-[0.12em] text-[var(--px-dimmer)]">
              <TrendingUpIcon size={14} className="text-[var(--px-accent)]" />
              Live forecast
            </span>
            <div className="flex flex-auto flex-wrap items-center gap-2">
              {/* committed vs likely */}
              <span
                className={cn(
                  'mono tnum inline-flex items-center gap-1.5 text-[12px]',
                  projection.overCommitted ? 'text-[var(--px-crit)]' : 'text-[var(--px-body)]',
                )}
              >
                <ListIcon size={13} />
                <b className={cn('font-semibold', projection.overCommitted ? 'text-[var(--px-crit)]' : 'text-[var(--px-ink)]')}>
                  {committed}
                </b>{' '}
                / {breakdown.expected} pts
              </span>
              <span className="h-3.5 w-px bg-[var(--px-line)]" aria-hidden="true" />
              {/* revenue if released */}
              <span
                className={cn(
                  'mono tnum inline-flex items-center gap-1.5 text-[12px]',
                  projection.hasRelease && projection.revenueIfReleased > 0 ? 'text-[var(--px-good)]' : 'text-[var(--px-body)]',
                )}
              >
                <DollarIcon size={13} />
                {projection.hasRelease
                  ? projection.revenueIfReleased > 0
                    ? `+$${projection.revenueIfReleased.toLocaleString()} if released`
                    : 'Release ready · ship finished work'
                  : 'add a Release to earn'}
              </span>
              <span className="h-3.5 w-px bg-[var(--px-line)]" aria-hidden="true" />
              {/* team impact */}
              <span
                className={cn(
                  'mono inline-flex items-center gap-1.5 text-[12px]',
                  projection.teamImpact === 'down'
                    ? 'text-[var(--px-crit)]'
                    : projection.teamImpact === 'up'
                      ? 'text-[var(--px-good)]'
                      : 'text-[var(--px-body)]',
                )}
              >
                <UsersIcon size={13} />
                {projection.teamImpact === 'down'
                  ? 'Team strained'
                  : projection.teamImpact === 'up'
                    ? 'Team energised'
                    : 'Team steady'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BacklogItem({
  pbi,
  selected,
  over,
  isNew,
  customers,
  onToggle,
}: {
  pbi: PBI;
  selected: boolean;
  over: boolean;
  isNew: boolean;
  customers: GameState['customers'];
  onToggle: () => void;
}) {
  const impacts = telegraphImpacts(pbi, customers);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        'mt-[9px] flex w-full items-start gap-[13px] rounded-console border bg-[var(--px-card)] p-[13px_14px] text-left transition-[border-color,background,box-shadow,transform] duration-150 hover:border-[var(--px-line-strong)] active:translate-y-px',
        selected
          ? 'border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] shadow-[inset_0_0_0_1px_var(--px-accent)]'
          : 'border-[var(--px-line)]',
        over && 'border-[var(--px-crit)]',
      )}
    >
      <span
        className={cn(
          'mt-px inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-console-sm border-[1.5px] text-[var(--px-on-accent)] transition-[border-color,background] duration-150',
          selected ? 'border-[var(--px-accent)] bg-[var(--px-accent)]' : 'border-[var(--px-line)] bg-[var(--px-card)]',
        )}
        aria-hidden="true"
      >
        <CheckIcon size={14} className={selected ? 'opacity-100' : 'opacity-0'} />
      </span>
      <span className="min-w-0 flex-auto">
        <span className="flex flex-wrap items-center gap-x-[9px] gap-y-1 text-[14.5px] font-semibold leading-[1.3] text-[var(--px-ink)]">
          {pbi.title}
          <span className="mono whitespace-nowrap rounded-full border border-[var(--px-line)] bg-[var(--px-ground)] px-[7px] py-0.5 text-[11px] font-semibold text-[var(--px-dim)]">
            {effortOf(pbi)} pts{pbi.effortUncertain ? '?' : ''}
          </span>
          {isNew && (
            <span className="mono whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--px-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] px-[7px] py-0.5 text-[9.5px] uppercase tracking-[0.1em] text-[var(--px-accent)]">
              New
            </span>
          )}
        </span>
        {impacts.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1.5">
            {impacts.map((imp, i) => (
              <span
                key={i}
                className={cn(
                  'mono inline-flex items-center gap-1 text-[11px] tracking-[0.02em]',
                  imp.tone === 'good'
                    ? 'text-[var(--px-good)]'
                    : imp.tone === 'bad'
                      ? 'text-[var(--px-crit)]'
                      : imp.tone === 'accent'
                        ? 'text-[var(--px-accent)]'
                        : 'text-[var(--px-dim)]',
                )}
              >
                {imp.label}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * The Release card gets a deliberately UNMISSABLE treatment (accent identity +
 * an explicit "finished features only earn revenue when you Ship a Release"
 * tagline). This is the #1 confusion the redesign exists to fix.
 */
function ReleaseCard({
  cost,
  selected,
  onToggle,
}: {
  cost: number;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        'mt-[9px] flex w-full items-start gap-[13px] rounded-console border bg-gradient-to-b from-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] to-[var(--px-card)] p-[13px_14px] text-left transition-[border-color,background,box-shadow,transform] duration-150 hover:border-[var(--px-accent)] active:translate-y-px',
        selected
          ? 'border-[var(--px-accent)] !bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] shadow-[inset_0_0_0_1px_var(--px-accent)]'
          : 'border-[color-mix(in_srgb,var(--px-accent)_30%,transparent)]',
      )}
    >
      <span
        className={cn(
          'mt-px inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-console-sm border-[1.5px] text-[var(--px-on-accent)] transition-[border-color,background] duration-150',
          selected ? 'border-[var(--px-accent)] bg-[var(--px-accent)]' : 'border-[var(--px-line)] bg-[var(--px-card)]',
        )}
        aria-hidden="true"
      >
        <CheckIcon size={14} className={selected ? 'opacity-100' : 'opacity-0'} />
      </span>
      <span className="min-w-0 flex-auto">
        <span className="flex flex-wrap items-center gap-x-[9px] gap-y-1 text-[14.5px] font-semibold leading-[1.3] text-[var(--px-accent)]">
          <RocketIcon size={15} className="text-[var(--px-accent)]" />
          Ship a Release
          <span className="mono whitespace-nowrap rounded-full border border-[var(--px-line)] bg-[var(--px-ground)] px-[7px] py-0.5 text-[11px] font-semibold text-[var(--px-dim)]">
            {cost} pts
          </span>
        </span>
        <span className="mono mt-1.5 flex items-center gap-1 text-[11px] text-[var(--px-accent)]">
          turns finished work into revenue
        </span>
        <span className="mt-[7px] block text-[12px] italic text-[var(--px-dimmer)]">
          Finished features only earn money when you release.
        </span>
      </span>
    </button>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
