'use client';

import Link from 'next/link';
import { useState } from 'react';
import { COMPETENCIES } from '@/curriculum/types';
import { resolveScenario, judgmentIndustryContext } from '@/curriculum/judgment';
import { INDUSTRIES } from '@/curriculum/industries';
import type { SkillNodeView } from '@/lib/skillTree';
import { buildRefreshSession } from '@/lib/skillRefresh';
import { useActiveIndustry } from '@/store/industryStore';
import { useLearnStore } from '@/store/learnStore';
import { useReviewStore, type ReviewResult } from '@/store/reviewStore';
import { RefreshCard } from './RefreshCard';
import { XIcon, RestartIcon, ChevronRightIcon, LockIcon } from '../Icon';

/** Context line under the node title, per state. */
function contextLine(node: SkillNodeView): string {
  switch (node.state) {
    case 'done':
      return `Mastered · ${node.strengthPct}% strength.`;
    case 'rusty':
      return `Going stale — strength has decayed to ${node.strengthPct}%. It never re-locks; it just rusts.`;
    case 'next':
      return "Up next — this is the single active skill on your ladder right now.";
    case 'locked':
      return node.skill.status === 'coming-soon'
        ? 'Planned — not buildable yet.'
        : 'Locked — reach the active skill first to open this one.';
    default:
      return '';
  }
}

function barColor(node: SkillNodeView): string {
  if (node.state === 'rusty') return 'var(--px-warn)';
  if (node.state === 'done') return 'var(--px-good)';
  return 'var(--px-line-strong)';
}

/**
 * The 90-second refresh wizard: up to two maintenance judgment cards in a
 * different industry skin (see `@/lib/skillRefresh`). Completing it restamps
 * `lastPracticedAt` via `recordMaintenanceRep`, resetting the decay clock —
 * see masteryDecay.ts's recovery-rule doc comment for why this doesn't
 * require a perfect score.
 */
function RefreshFlow({ node, onDone }: { node: SkillNodeView; onDone: () => void }) {
  const industry = useActiveIndustry();
  const review = useReviewStore((s) => s.review);
  const recordMaintenanceRep = useLearnStore((s) => s.recordMaintenanceRep);

  const session = buildRefreshSession(node.skill.competency, industry);
  const industryLabel = INDUSTRIES.find((i) => i.id === session.industry)?.label ?? session.industry;
  const ctx = judgmentIndustryContext(session.industry);

  const [cursor, setCursor] = useState(0);
  const [answer, setAnswer] = useState<string | undefined>(undefined);
  const [revealed, setRevealed] = useState(false);
  const [complete, setComplete] = useState(false);

  if (session.scenarios.length === 0) {
    return (
      <p className="mt-3 text-[12.5px] text-[var(--px-dim)]">
        No refresh cards are authored for this competency yet.
      </p>
    );
  }

  if (complete) {
    return (
      <div className="mt-3 rounded-[14px] border border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_10%,transparent)] p-[14px_16px]">
        <p className="text-[13px] font-semibold text-[var(--px-ink)]">Rust polished — strength back to 100%.</p>
        <p className="mt-1 text-[11.5px] leading-[1.5] text-[var(--px-dim)]">
          Spacing plus a different industry is what makes it stick, not just a fresh coat.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mono mt-3 inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--px-accent)] px-3.5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[var(--px-on-accent)]"
        >
          Done
        </button>
      </div>
    );
  }

  const raw = session.scenarios[cursor];
  const scenario = resolveScenario(raw, ctx);
  const isLast = cursor >= session.scenarios.length - 1;

  function handlePrimary() {
    if (!revealed) {
      if (!answer) return;
      const result: ReviewResult = answer === scenario.bestOptionId ? 'correct' : 'wrong';
      review(scenario.id, result);
      setRevealed(true);
      return;
    }
    if (isLast) {
      recordMaintenanceRep(node.skill.id);
      setComplete(true);
      return;
    }
    setCursor((c) => c + 1);
    setAnswer(undefined);
    setRevealed(false);
  }

  return (
    <div className="mt-3">
      <p className="mono mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
        Refresh · {industryLabel} skin · card {cursor + 1} of {session.scenarios.length}
      </p>
      <RefreshCard scenario={scenario} answer={answer} revealed={revealed} onAnswer={setAnswer} />
      <button
        type="button"
        disabled={!revealed && !answer}
        onClick={handlePrimary}
        className="mono mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: 'var(--px-accent)', color: 'var(--px-on-accent)' }}
      >
        {revealed ? (isLast ? 'Finish refresh' : 'Next call') : 'Reveal the call'}
      </button>
    </div>
  );
}

/** Body of the sheet for one node. Keyed by skill id from the parent so local wizard state resets per skill. */
function SkillNodeSheetBody({ node, onClose }: { node: SkillNodeView; onClose: () => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const { skill, state } = node;
  const barWidth = node.strengthPct ?? (state === 'next' ? 8 : 4);
  const competencyLabel = COMPETENCIES[skill.competency].label;

  const canPractice = state === 'done' || state === 'rusty' || state === 'next';
  const ctaLabel =
    state === 'done' || state === 'rusty'
      ? 'Practice again (keeps it warm)'
      : state === 'next'
        ? 'Start now'
        : skill.status === 'coming-soon'
          ? 'Coming soon'
          : 'Locked — reach the active skill first';

  return (
    <>
      <p className="mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--px-dimmer)]">
        {competencyLabel}
      </p>
      <h2 className="mt-1 text-[17px] font-bold text-[var(--px-ink)]">{skill.title}</h2>
      <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--px-body)]">{contextLine(node)}</p>

      <div className="mt-3.5 h-[6px] overflow-hidden rounded-full bg-[var(--px-line)]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${barWidth}%`, background: barColor(node) }}
        />
      </div>

      <ul className="mt-3.5 flex flex-col gap-1.5 pl-0">
        <li className="flex items-start gap-1.5 text-[12.5px] leading-[1.5] text-[var(--px-body)]">
          <span aria-hidden="true" className="mt-[3px] flex-none" style={{ color: 'var(--px-accent)' }}>
            {node.unlock.kind === 'sim' ? '🔓' : '·'}
          </span>
          <span>
            <b className="text-[var(--px-ink)]">
              {node.unlock.kind === 'sim' ? 'Unlocks: ' : ''}
            </b>
            {node.unlock.text}
          </span>
        </li>
      </ul>

      {refreshing ? (
        <RefreshFlow node={node} onDone={onClose} />
      ) : (
        <>
          {canPractice ? (
            <Link
              href={`/learn/${skill.id}`}
              className="mono mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] no-underline"
              style={{ background: 'var(--px-accent)', color: 'var(--px-on-accent)' }}
            >
              {ctaLabel}
              <ChevronRightIcon size={13} />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mono mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-[10px] border border-[var(--px-line)] px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--px-dimmer)]"
            >
              <LockIcon size={12} />
              {ctaLabel}
            </button>
          )}

          {node.offersRefresh && (
            <button
              type="button"
              onClick={() => setRefreshing(true)}
              className="mono mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em]"
              style={{ borderColor: 'var(--px-line-strong)', color: 'var(--px-accent)' }}
            >
              <RestartIcon size={13} />
              90-second refresh
            </button>
          )}
        </>
      )}
    </>
  );
}

export function SkillNodeSheet({ node, onClose }: { node: SkillNodeView | null; onClose: () => void }) {
  if (!node) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label={`${node.skill.title} detail`}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[86vh] w-full max-w-[480px] overflow-y-auto rounded-t-[24px] border-t border-[var(--px-line-strong)] bg-[var(--px-card)] p-[18px_18px_28px] shadow-[0_-10px_32px_rgba(0,0,0,0.35)]"
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--px-line-strong)]" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[var(--px-dim)]"
        >
          <XIcon size={15} />
        </button>
        <SkillNodeSheetBody key={node.skill.id} node={node} onClose={onClose} />
      </div>
    </>
  );
}
