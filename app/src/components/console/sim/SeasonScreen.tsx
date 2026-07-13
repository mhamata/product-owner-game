'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { GameState, PersonState, Scenario } from '@/engine/types';
import {
  deriveJobMarketOffers,
  deriveSeasonSummary,
  ensureBoard,
  FIRING_FLOOR,
  type JobOffer,
} from '@/engine/board';
import { ensurePeopleRoster, PERSON_ROLES, roleLabel } from '@/engine/people';
import { cn } from '@/lib/cn';
import { ArrowRightIcon, BuildingIcon, LockIcon } from '../Icon';
import { DIMENSIONS } from './dimensions';
import { useDecisionLogStore, runIdFor, selectEntriesForRun } from '@/store/decisionLogStore';
import {
  careerFileSummary,
  deriveJobMarketVisibility,
  deriveSprintTimeline,
  offerCardMeta,
  verdictCopy,
  type TimelineSprint,
} from './season';

/**
 * SeasonScreen: the Sim 2.0 "Season" tab (design-sim-2.0.md §2.3, mocked in
 * praxis-sim2-mockup.html's `#scr-season`). Every number here is read
 * straight off the W2-C `board.ts` module's own selectors (confidence,
 * expectations, `deriveSeasonSummary`, `deriveJobMarketOffers`) or the
 * roster (`people.ts`) — nothing is recomputed. Replaces SimTabs.tsx's
 * `SeasonComingSoon` placeholder wholesale.
 */
export function SeasonScreen({
  state,
  scenario,
  industry,
}: {
  state: GameState;
  scenario: Scenario;
  industry: string | null;
}) {
  const runId = runIdFor(state.scenarioId, state.seed);
  // Same "subscribe to the raw store array, filter with useMemo" pattern
  // ProductMapScreen.tsx uses — a selector that calls selectEntriesForRun
  // inline would build a new array reference every render and infinite-loop
  // zustand's useSyncExternalStore.
  const allEntries = useDecisionLogStore((s) => s.entries);
  const interviewStories = useDecisionLogStore((s) => s.interviewStories);
  const entries = useMemo(() => selectEntriesForRun(allEntries, runId), [allEntries, runId]);
  const stories = interviewStories[runId] ?? [];

  const board = ensureBoard(state.board, scenario);
  const roster = ensurePeopleRoster(state.people, state.scenarioId, state.seed, industry ?? undefined);
  const people = PERSON_ROLES.map((role) => Object.values(roster).find((p) => p.role === role)).filter(
    (p): p is PersonState => !!p,
  );
  const timeline = deriveSprintTimeline(state);
  const summary = deriveSeasonSummary(state, scenario);
  const cfile = careerFileSummary(entries, stories.length);
  const jobMarketVisibility = deriveJobMarketVisibility(state.phase);

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-4">
      {/* QBR moment: only once the season is actually over on the final
          sprint. See summary.verdict / summary.score — both W2-C
          derivations, never recomputed here. */}
      {state.phase === 'complete' && <QBRCard summary={summary} />}

      <p className="mono mb-2 mt-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
        {scenario.name} · Sprint {state.iterationNumber} of {state.totalIterations}
      </p>
      <SprintTimeline sprints={timeline} />
      <p className="mx-0.5 mb-4 mt-2 text-[11.5px] leading-[1.5] text-[var(--px-dim)]">
        Sprint {state.totalIterations} = Quarterly Business Review. The board decides your season.
      </p>

      <BoardConfidenceCard confidence={board.confidence} expectations={board.expectations} />

      <SectionLabel>Your people</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {people.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>

      <SectionLabel>Career file</SectionLabel>
      <CareerFileCard summary={cfile} />

      <SectionLabel>The job market</SectionLabel>
      <JobMarketCard
        visibility={jobMarketVisibility}
        state={state}
        scenario={scenario}
        industry={industry}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono mb-2 mt-5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
      {children}
    </p>
  );
}

/* ============================================================
   QBR: end-of-season summary card, leading the Season tab once
   phase === 'complete'.
   ============================================================ */

function QBRCard({ summary }: { summary: ReturnType<typeof deriveSeasonSummary> }) {
  const copy = verdictCopy(summary.verdict);
  return (
    <div className="mb-4 rounded-[16px] border border-[var(--px-accent)]/35 bg-gradient-to-br from-[var(--px-accent)]/10 to-[var(--px-card)] p-[16px_16px]">
      <span className="mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--px-accent)]">
        Quarterly Business Review · Season complete
      </span>
      <h2 className="mt-1.5 text-[17px] font-bold tracking-[-0.01em] text-[var(--px-ink)]">{copy.heading}</h2>
      <p className="mt-1 text-[13px] leading-[1.5] text-[var(--px-body)]">{copy.line}</p>

      {/* Reuses DebriefStep's own 5-dimension score (DIMENSIONS + GameScore) —
          the exact scoreboard the player already saw there — rather than
          recomputing anything. No deltas here: the season is over, there is
          no "next sprint" to compare against. */}
      <div className="mt-3.5 grid grid-cols-5 gap-1.5 max-[380px]:grid-cols-3">
        {DIMENSIONS.map(({ key, label, Icon }) => (
          <div key={key} className="flex flex-col items-center gap-1 rounded-[10px] bg-[var(--px-card)]/70 p-[8px_4px]">
            <Icon size={13} className="text-[var(--px-dim)]" />
            <span className="mono text-[13px] font-bold tabular-nums text-[var(--px-ink)]">
              {Math.round(summary.score[key])}
            </span>
            <span className="mono text-center text-[8px] uppercase leading-[1.15] tracking-[0.04em] text-[var(--px-dimmer)]">
              {label[0]}
            </span>
          </div>
        ))}
      </div>

      {/* TODO(W5-J): the AI multi-party QBR meeting (design-sim-2.0.md's
          guardrail-stacked route) slots in right here — a live board
          conversation grounded in this same score/verdict, instead of this
          static summary. Not this slice's scope. */}
    </div>
  );
}

/* ============================================================
   Sprint timeline
   ============================================================ */

function SprintTimeline({ sprints }: { sprints: TimelineSprint[] }) {
  return (
    <div className="mx-0.5 flex gap-[5px]" role="list" aria-label="Season sprint timeline">
      {sprints.map((s) => (
        <span
          key={s.sprint}
          role="listitem"
          aria-label={`Sprint ${s.sprint}${s.isQBR ? ' — Quarterly Business Review' : ''}${
            s.isFiredAt ? ' — fired here' : ''
          }`}
          className={cn(
            'mono tnum flex h-[26px] flex-1 items-center justify-center rounded-[7px] border text-[10px]',
            s.status === 'now' &&
              'border-[var(--px-accent)] bg-[var(--px-accent)] font-bold text-[var(--px-on-accent)]',
            s.status === 'past' &&
              'border-[var(--px-line)] bg-[var(--px-raised)] text-[var(--px-dim)]',
            s.status === 'future' && 'border-[var(--px-line)] bg-[var(--px-card)] text-[var(--px-dimmer)]',
            s.isFiredAt && 'border-[var(--px-crit)] text-[var(--px-crit)]',
            s.isQBR && s.status !== 'now' && 'border-dashed border-[var(--px-line-strong)]',
          )}
        >
          {s.sprint}
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   Board confidence
   ============================================================ */

const STATUS_PILL: Record<string, string> = {
  'on-track': 'bg-[var(--px-good)]/14 text-[var(--px-good)]',
  'at-risk': 'bg-[var(--px-warn)]/14 text-[var(--px-warn)]',
  'off-track': 'bg-[var(--px-crit)]/14 text-[var(--px-crit)]',
};

const STATUS_LABEL: Record<string, string> = {
  'on-track': 'on track',
  'at-risk': 'at risk',
  'off-track': 'off track',
};

function BoardConfidenceCard({
  confidence,
  expectations,
}: {
  confidence: number;
  expectations: { id: string; label: string; status: string }[];
}) {
  const pct = Math.max(0, Math.min(100, confidence));
  return (
    <div className="rounded-[16px] border border-[var(--px-line)] bg-[var(--px-card)] p-[14px_15px]">
      <h4 className="text-[13.5px] font-bold text-[var(--px-ink)]">Board confidence</h4>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--px-line)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--px-crit), var(--px-warn) 55%, var(--px-good))',
          }}
        />
      </div>
      <div className="mono tnum mt-1.5 flex items-center justify-between text-[11px] text-[var(--px-dim)]">
        <span>{Math.round(confidence)} / 100</span>
        <span className="text-[var(--px-dimmer)]">fired below {FIRING_FLOOR}</span>
      </div>
      <ul className="mt-3 flex flex-col gap-[7px]">
        {expectations.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2.5 text-[12.5px] text-[var(--px-body)]">
            <span>{e.label}</span>
            <span
              className={cn(
                'mono flex-none rounded-full px-2 py-0.5 text-[10px] font-bold',
                STATUS_PILL[e.status] ?? STATUS_PILL['on-track'],
              )}
            >
              {STATUS_LABEL[e.status] ?? e.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   Roster
   ============================================================ */

const AVATAR_PALETTE = ['#e8a84c', '#7fa8e0', '#b48fd9', '#56b3a5', '#e0836f', '#8fd9b4', '#d98f9f'];

// Local copy of InboxTurn's avatar helpers — same "shell wraps, it does not
// fork" reasoning ProductMapScreen.tsx documents for its own DetailSheet:
// this slice never touches InboxTurn.tsx to export them.
function avatarColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function PersonCard({ person }: { person: PersonState }) {
  const lastMemory = person.memory.length > 0 ? person.memory[person.memory.length - 1] : null;
  return (
    <div className="rounded-[12px] border border-[var(--px-line)] bg-[var(--px-card)] p-[10px_11px]">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="mono flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[9px] text-[10.5px] font-bold text-[#10151d]"
          style={{ background: avatarColorFor(person.id) }}
          aria-hidden="true"
        >
          {initialsFor(person.name)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold leading-[1.15] text-[var(--px-ink)]">
            {person.name}
          </div>
          <div className="text-[10px] text-[var(--px-dim)]">{roleLabel(person.role)}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-[var(--px-dim)]">
        Trust
        <span className="h-1 flex-auto overflow-hidden rounded-full bg-[var(--px-line)]">
          <span
            className="block h-full rounded-full bg-[var(--px-accent)]"
            style={{ width: `${Math.max(0, Math.min(100, person.trust))}%` }}
          />
        </span>
        <span className="tabular-nums">{Math.round(person.trust)}</span>
      </div>
      <p className="mt-1.5 text-[10.5px] leading-[1.4] text-[var(--px-dim)]">
        wants: <b className="font-semibold text-[var(--px-body)]">{person.agenda}</b>
      </p>
      {lastMemory && (
        <p className="mt-1 text-[10.5px] leading-[1.4] text-[var(--px-dimmer)]">
          Remembers Sprint {lastMemory.sprint}: {lastMemory.note}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   Career File summary
   ============================================================ */

function CareerFileCard({ summary }: { summary: ReturnType<typeof careerFileSummary> }) {
  return (
    <div className="rounded-[16px] border border-[var(--px-line)] bg-[var(--px-card)] p-[14px_15px]">
      <h4 className="text-[13.5px] font-bold text-[var(--px-ink)]">Your evidence, so far this run</h4>
      <dl className="mt-2.5 flex flex-col gap-[6px]">
        <SummaryRow label="Decision log">
          {summary.sprintsLogged} {summary.sprintsLogged === 1 ? 'sprint' : 'sprints'} logged · {summary.withRationale}{' '}
          with rationale
        </SummaryRow>
        <SummaryRow label="Event calls">
          {summary.eventResponses} {summary.eventResponses === 1 ? 'response' : 'responses'} recorded
        </SummaryRow>
        <SummaryRow label="Interview stories">
          {summary.interviewStoriesDrafted > 0
            ? `${summary.interviewStoriesDrafted} drafted from this run`
            : 'None drafted yet'}
        </SummaryRow>
      </dl>
      <Link
        href="/report"
        className="mono mt-3 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[var(--px-line-strong)] bg-transparent px-4 py-2.5 text-[12px] font-semibold text-[var(--px-accent)]"
      >
        View full Career File <ArrowRightIcon size={13} />
      </Link>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2.5 text-[12px] tabular-nums text-[var(--px-body)]">
      <dt className="text-[var(--px-dim)]">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

/* ============================================================
   Job market
   ============================================================ */

function JobMarketCard({
  visibility,
  state,
  scenario,
  industry,
}: {
  visibility: 'locked' | 'open';
  state: GameState;
  scenario: Scenario;
  industry: string | null;
}) {
  if (visibility === 'locked') {
    return (
      <div className="flex items-start gap-2.5 rounded-[16px] border border-dashed border-[var(--px-line-strong)] bg-[var(--px-raised)]/60 p-[14px_15px] opacity-80">
        <LockIcon size={15} className="mt-0.5 flex-none text-[var(--px-dim)]" />
        <p className="text-[11.5px] leading-[1.5] text-[var(--px-dim)]">
          Offers open at season&rsquo;s end — matched to what this record proves, not what your resume claims.
          Finish strong, or get fired and rebuild somewhere smaller. Both make a story.
        </p>
      </div>
    );
  }

  const offers = deriveJobMarketOffers(state, scenario, industry ?? undefined);
  return (
    <div className="grid gap-2">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}

function OfferCard({ offer }: { offer: JobOffer }) {
  const meta = offerCardMeta(offer.level);
  return (
    <div className="rounded-[14px] border border-[var(--px-line)] bg-[var(--px-card)] p-[12px_14px]">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--px-ink)]">
          <BuildingIcon size={14} className="flex-none text-[var(--px-dim)]" />
          {offer.company}
        </span>
        <span className="mono flex-none text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--px-dim)]">
          {meta.arrow} {meta.levelLabel}
        </span>
      </div>
      <p className="mt-0.5 text-[11.5px] font-semibold text-[var(--px-accent)]">{offer.title}</p>
      <p className="mt-1 text-[12px] leading-[1.5] text-[var(--px-body)]">{offer.pitch}</p>
    </div>
  );
}
