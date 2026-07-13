'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { GameState, Scenario } from '@/engine/types';
import { computeExpectationStatus } from '@/engine/board';
import { cn } from '@/lib/cn';
import { useLearnStore } from '@/store/learnStore';
import { FOG_GATES, isFogGateUnlocked, type FogGate } from '@/lib/fogOfWar';
import { LockIcon, XIcon } from '../Icon';
import { useDecisionLogStore, runIdFor, selectEntriesForRun } from '@/store/decisionLogStore';
import {
  useMetricsHistoryStore,
  selectHistoryForRun,
  type MetricKey,
  type MetricsSnapshot,
} from '@/store/metricsHistoryStore';
import {
  annotatedPoints,
  deriveDecisionAnnotations,
  deriveDistricts,
  deriveMetricTrend,
  districtDebtAttribution,
  districtFactsLine,
  districtStatusLine,
  isFlatSeries,
  polylineFor,
  sparklineSeries,
  type DecisionAnnotation,
  type District,
} from './productMap';
import {
  allCohortSprints,
  cohortLinePoints,
  cohortPolylineFor,
  deriveCohortSegments,
  hasCohortTrend,
} from './cohortCurves';

/**
 * ProductMapScreen: the Sim 2.0 "Product" tab (design-sim-2.0.md §3, mocked in
 * praxis-sim2-mockup.html's `#scr-product`). Pure visualization — every tile
 * and district reads straight off engine state (via `productMap.ts`'s
 * derivation helpers) plus the two player-facing stores (decisionLogStore for
 * rationale annotations, metricsHistoryStore for per-sprint numeric history).
 * No engine simulation happens here.
 */
export function ProductMapScreen({
  state,
  scenario,
}: {
  state: GameState;
  scenario: Scenario;
}) {
  const runId = runIdFor(state.scenarioId, state.seed);
  // Subscribe to the STORE'S RAW ARRAYS (stable references that only change
  // when the store actually mutates), not to a selector that calls
  // `entriesForRun`/`historyForRun` — those build a brand-new filtered array
  // on every call, which looks like "the snapshot changed" to Zustand's
  // useSyncExternalStore on every render and infinite-loops. Filter down to
  // this run with the pure selectors + useMemo instead.
  const allEntries = useDecisionLogStore((s) => s.entries);
  const allHistory = useMetricsHistoryStore((s) => s.history);
  const entries = useMemo(() => selectEntriesForRun(allEntries, runId), [allEntries, runId]);
  const history = useMemo(() => selectHistoryForRun(allHistory, runId), [allHistory, runId]);

  const annotations = deriveDecisionAnnotations(entries);
  const districts = deriveDistricts(state, scenario);

  // Fog of war (W4-G, @/lib/fogOfWar.ts): read live mastery straight off
  // learnStore. `isMastered` is monotonic (see fogOfWar.ts's file header),
  // so this is already the permanent "unlocked forever once earned" signal
  // the design doc calls for — no separate bookkeeping needed here.
  const isMastered = useLearnStore((s) => s.isMastered);
  const cohortUnlocked = isFogGateUnlocked(FOG_GATES['cohort-curves'], isMastered);
  const annotationHistoryUnlocked = isFogGateUnlocked(FOG_GATES['decision-annotations-history'], isMastered);

  const [openDistrict, setOpenDistrict] = useState<District | null>(null);
  const [openAnnotation, setOpenAnnotation] = useState<{ sprint: number; rationale: string } | null>(null);

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-4">
      <SectionLabel>This run</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <MetricTile
          label="Revenue"
          history={history}
          metricKey="revenue"
          format={(v) => `$${Math.round(v).toLocaleString()}`}
          warn={computeExpectationStatus('revenue', state, scenario) !== 'on-track'}
          onAnnotationTap={setOpenAnnotation}
          annotations={annotations}
        />
        <MetricTile
          label="Team morale"
          history={history}
          metricKey="morale"
          format={(v) => `${round1(v)}/10`}
          warn={state.team.morale < 4}
          onAnnotationTap={setOpenAnnotation}
          annotations={annotations}
        />
        <MetricTile
          label="Tech debt"
          history={history}
          metricKey="techDebt"
          format={(v) => `${Math.round(v)}/100`}
          warn={computeExpectationStatus('product', state, scenario) !== 'on-track'}
          onAnnotationTap={setOpenAnnotation}
          annotations={annotations}
        />
        <MetricTile
          label="Reliability"
          history={history}
          metricKey="reliability"
          format={(v) => `${round1(v)}/10`}
          warn={false}
          staticCaption="Scenario baseline — doesn't move this run."
          onAnnotationTap={setOpenAnnotation}
          annotations={annotations}
        />
      </div>
      {annotations.length > 0 && (
        <p className="mx-1 mt-2 text-[10.5px] leading-[1.5] text-[var(--px-dim)]">
          <AmberDotLegend /> = a sprint you logged a reason for your call — tap it to read why.
        </p>
      )}

      <SectionLabel>The product</SectionLabel>
      <div className="grid grid-cols-6 auto-rows-[58px] gap-1.5">
        {districts.map((d) => (
          <DistrictTile key={d.id} district={d} onOpen={() => setOpenDistrict(d)} />
        ))}
      </div>
      <p className="mx-1 mt-2 text-[10.5px] leading-[1.5] text-[var(--px-dim)]">
        Red hatching marks visible tech debt · dim tiles are backlog items no one has started.
      </p>

      <SectionLabel>Locked until earned</SectionLabel>
      <FogGatePanel gate={FOG_GATES['cohort-curves']} unlocked={cohortUnlocked}>
        <CohortCurvesContent history={history} scenario={scenario} />
      </FogGatePanel>
      <FogGatePanel gate={FOG_GATES['decision-annotations-history']} unlocked={annotationHistoryUnlocked}>
        <DecisionAnnotationHistoryContent annotations={annotations} onAnnotationTap={setOpenAnnotation} />
      </FogGatePanel>

      <DetailSheet
        open={openDistrict !== null}
        onClose={() => setOpenDistrict(null)}
        title={openDistrict?.name}
      >
        {openDistrict && (
          <div className="space-y-2 text-[13px] leading-[1.5] text-[var(--px-body)]">
            <p>{districtStatusLine(openDistrict)}</p>
            <p>{districtFactsLine(openDistrict, scenario)}</p>
            {(() => {
              const attribution = districtDebtAttribution(state);
              return attribution && openDistrict.primaryKind !== 'tech' ? (
                <p className="text-[var(--px-warn)]">{attribution}</p>
              ) : null;
            })()}
          </div>
        )}
      </DetailSheet>

      <DetailSheet
        open={openAnnotation !== null}
        onClose={() => setOpenAnnotation(null)}
        title={openAnnotation ? `Sprint ${openAnnotation.sprint} — why` : undefined}
      >
        {openAnnotation && (
          <p className="text-[13px] leading-[1.5] text-[var(--px-body)]">“{openAnnotation.rationale}”</p>
        )}
      </DetailSheet>
    </div>
  );
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono mb-2 mt-5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
      {children}
    </p>
  );
}

function AmberDotLegend() {
  return <span className="inline-block h-[7px] w-[7px] rounded-full bg-[var(--px-warn)] align-middle" aria-hidden="true" />;
}

/* ============================================================
   Metric tiles
   ============================================================ */

function MetricTile({
  label,
  history,
  metricKey,
  format,
  warn,
  staticCaption,
  annotations,
  onAnnotationTap,
}: {
  label: string;
  history: MetricsSnapshot[];
  metricKey: MetricKey;
  format: (v: number) => string;
  warn: boolean;
  staticCaption?: string;
  annotations: ReturnType<typeof deriveDecisionAnnotations>;
  onAnnotationTap: (a: { sprint: number; rationale: string } | null) => void;
}) {
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const value = latest ? (latest[metricKey] ?? null) : null;
  const points = sparklineSeries(history, metricKey);
  const dots = annotatedPoints(points, annotations);
  const trend = deriveMetricTrend(history, metricKey);
  const flat = isFlatSeries(history, metricKey);

  const caption = staticCaption
    ? staticCaption
    : trend.delta === null
      ? 'first sprint recorded'
      : trend.delta === 0
        ? 'steady'
        : `${trend.direction === 'up' ? '▲' : '▼'} ${formatDelta(metricKey, trend.delta)} vs Sprint ${trend.previousSprint}`;

  const strokeVar = warn ? 'var(--px-warn)' : 'var(--px-good)';

  return (
    <div className="relative rounded-[12px] border border-[var(--px-line)] bg-[var(--px-card)] p-[10px_12px]">
      <span className="mono text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--px-dimmer)]">
        {label}
      </span>
      <div
        className={cn(
          'mono mt-[3px] text-[19px] font-semibold tabular-nums',
          warn ? 'text-[var(--px-warn)]' : 'text-[var(--px-ink)]',
        )}
      >
        {value === null ? '—' : format(value)}
      </div>
      <span className="text-[10.5px] text-[var(--px-dim)]">{caption}</span>
      {points.length > 1 && !flat && (
        <svg
          viewBox="0 0 56 22"
          className="absolute right-[10px] top-[26px] h-[22px] w-[56px]"
          aria-hidden="true"
        >
          <polyline points={polylineFor(points)} fill="none" stroke={strokeVar} strokeWidth={1.5} />
          {dots.map((d) => (
            <circle
              key={d.sprint}
              cx={d.x}
              cy={d.y}
              r={3}
              fill="var(--px-warn)"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                const a = annotations.find((x) => x.sprint === d.sprint);
                if (a) onAnnotationTap({ sprint: a.sprint, rationale: a.rationale });
              }}
            >
              <title>{`Sprint ${d.sprint}: tap for rationale`}</title>
            </circle>
          ))}
        </svg>
      )}
    </div>
  );
}

function formatDelta(key: MetricKey, delta: number): string {
  if (key === 'revenue') return `$${Math.abs(Math.round(delta)).toLocaleString()}`;
  if (key === 'morale' || key === 'reliability') return `${round1(Math.abs(delta))}`;
  return `${Math.abs(Math.round(delta))}`;
}

/* ============================================================
   District map
   ============================================================ */

const SPAN_CLASS: Record<District['span'], string> = {
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
};

function DistrictTile({ district, onOpen }: { district: District; onOpen: () => void }) {
  const dim = district.status === 'queued';
  const healthClass =
    district.status === 'queued'
      ? 'bg-[var(--px-dimmer)]'
      : district.healthPct >= 65
        ? 'bg-[var(--px-good)]'
        : district.healthPct >= 35
          ? 'bg-[var(--px-warn)]'
          : 'bg-[var(--px-crit)]';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'relative overflow-hidden rounded-[10px] border border-[var(--px-line)] bg-[var(--px-card)] p-[9px_10px_16px] text-left transition-colors hover:border-[var(--px-line-strong)]',
        SPAN_CLASS[district.span],
        dim && 'opacity-60',
      )}
    >
      {district.debtLevel !== 'none' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: district.debtLevel === 'high' ? 0.5 : 0.4,
            backgroundImage: `repeating-linear-gradient(-45deg, transparent 0 7px, ${
              district.debtLevel === 'high' ? 'var(--px-crit)' : 'var(--px-warn)'
            } 7px 12px)`,
            filter: 'opacity(0.3)',
          }}
        />
      )}
      <span className="relative z-[2] block truncate text-[12px] font-semibold text-[var(--px-ink)]">
        {district.name}
      </span>
      <span className="mono relative z-[2] mt-0.5 block truncate text-[10px] tabular-nums text-[var(--px-dim)]">
        {statusMeta(district)}
      </span>
      <span className="absolute bottom-2 left-[10px] z-[2] h-[3px] w-[40%] overflow-hidden rounded-full bg-[var(--px-line)]">
        <span className={cn('block h-full rounded-full', healthClass)} style={{ width: `${district.healthPct}%` }} />
      </span>
    </button>
  );
}

function statusMeta(d: District): string {
  if (d.status === 'queued') return 'not built';
  if (d.status === 'investing') return 'investing';
  if (d.debtLevel === 'high') return 'debt rising';
  if (d.debtLevel === 'medium') return 'aging quietly';
  return 'healthy';
}

/* ============================================================
   Fog-of-war panels (W4-G, @/lib/fogOfWar.ts).

   FogGatePanel is the one visual treatment: locked renders the mockup's fog
   (blurred lines + lock + unlock hint linking to the unlocking skill's learn
   route), unlocked renders whatever real content the caller passes as
   children. See fogOfWar.ts for gate selection/permanence, cohortCurves.ts
   for what CohortCurvesContent actually shows.
   ============================================================ */

function FogGatePanel({
  gate,
  unlocked,
  children,
}: {
  gate: FogGate;
  unlocked: boolean;
  children: React.ReactNode;
}) {
  if (!unlocked) {
    return (
      <div className="relative mt-2.5 overflow-hidden rounded-[12px] border border-dashed border-[var(--px-line-strong)] bg-[var(--px-raised)]/60 p-[12px_14px]">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-[var(--px-dim)]">{gate.label}</span>
          <LockIcon size={14} className="text-[var(--px-dim)]" />
        </div>
        <div aria-hidden="true" className="mt-2 space-y-1.5">
          <div className="h-[7px] w-full rounded-[4px] bg-[var(--px-line)] opacity-70 blur-[2px]" />
          <div className="h-[7px] w-[82%] rounded-[4px] bg-[var(--px-line)] opacity-70 blur-[2px]" />
          <div className="h-[7px] w-[64%] rounded-[4px] bg-[var(--px-line)] opacity-70 blur-[2px]" />
        </div>
        <Link
          href={`/learn/${gate.unlockSkillOrCompetency}`}
          className="mt-2 block text-[10.5px] font-semibold text-[var(--px-warn)] underline decoration-dotted underline-offset-2"
        >
          {gate.unlockHint}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mt-2.5 rounded-[12px] border border-[var(--px-line)] bg-[var(--px-card)] p-[12px_14px]">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-[var(--px-ink)]">{gate.label}</span>
        <span className="mono text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--px-good)]">
          Unlocked
        </span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Unlocked content for the `cohort-curves` gate — see cohortCurves.ts's file header for exactly what this derives and what it does NOT claim to be. */
function CohortCurvesContent({ history, scenario }: { history: MetricsSnapshot[]; scenario: Scenario }) {
  const segments = deriveCohortSegments(history, scenario);
  if (!hasCohortTrend(segments)) {
    return (
      <p className="text-[11.5px] leading-[1.5] text-[var(--px-dim)]">
        Not enough sprints recorded yet this run to draw a trend — this fills in as you play (history is only recorded from the moment this pane unlocked).
      </p>
    );
  }
  const sprintDomain = allCohortSprints(segments);
  const colors = [
    'var(--px-accent)',
    'var(--px-good)',
    'var(--px-warn)',
    'var(--px-crit)',
    'var(--px-ink)',
    'var(--px-dim)',
  ];
  return (
    <div>
      <svg
        viewBox="0 0 220 64"
        className="h-16 w-full"
        role="img"
        aria-label="Average customer happiness by segment, per sprint"
      >
        {segments.map((seg, i) => {
          const line = cohortLinePoints(seg.points, sprintDomain, 220, 64);
          if (line.length < 2) return null;
          return (
            <polyline
              key={seg.archetype}
              points={cohortPolylineFor(line)}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((seg, i) => (
          <span key={seg.archetype} className="mono flex items-center gap-1 text-[10px] text-[var(--px-dim)]">
            <span
              aria-hidden="true"
              className="inline-block h-[6px] w-[6px] rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            {seg.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10.5px] leading-[1.5] text-[var(--px-dim)]">
        Average happiness (0–10) by customer segment, sprint by sprint — recorded from the moment this run started
        tracking it. Not classic signup-cohort retention (this engine has no signup-date concept); this is the
        closest honest read the data supports.
      </p>
    </div>
  );
}

/** Unlocked content for the `decision-annotations-history` gate: every logged sprint rationale, in one place, tap to reread — reuses the same derived `annotations` the metric tiles' amber dots already surface one sprint at a time. */
function DecisionAnnotationHistoryContent({
  annotations,
  onAnnotationTap,
}: {
  annotations: DecisionAnnotation[];
  onAnnotationTap: (a: { sprint: number; rationale: string } | null) => void;
}) {
  if (annotations.length === 0) {
    return (
      <p className="text-[11.5px] leading-[1.5] text-[var(--px-dim)]">
        No rationale logged yet this run — add a one-line reason next time you commit a sprint, and it shows up
        here.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {annotations.map((a) => (
        <li key={a.sprint}>
          <button
            type="button"
            onClick={() => onAnnotationTap({ sprint: a.sprint, rationale: a.rationale })}
            className="w-full text-left text-[12px] leading-[1.4] text-[var(--px-body)]"
          >
            <span className="mono font-semibold text-[var(--px-dim)]">Sprint {a.sprint}</span> — “{a.rationale}”
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ============================================================
   Bottom sheet (local copy of InboxTurn's pattern — see InboxTurn.tsx's
   `Sheet`; duplicated here rather than importing so this slice never touches
   InboxTurn's file, per the "shell wraps, it does not fork" instruction).
   ============================================================ */

function DetailSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[86vh] w-full max-w-[480px] overflow-y-auto rounded-t-[24px] border-t border-[var(--px-line-strong)] bg-[var(--px-card)] p-[18px_18px_28px] shadow-[0_-10px_32px_rgba(0,0,0,0.35)]"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--px-line-strong)]" aria-hidden="true" />
        {title && <h2 className="text-[16px] font-bold text-[var(--px-ink)]">{title}</h2>}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[var(--px-dim)]"
        >
          <XIcon size={15} />
        </button>
        <div className={cn(title ? 'mt-3.5' : '')}>{children}</div>
      </div>
    </>
  );
}
