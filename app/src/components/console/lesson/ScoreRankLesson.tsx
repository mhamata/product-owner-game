'use client';

import { useState } from 'react';
import type { Skill } from '@/curriculum/types';
import {
  gradeRanking,
  rankRows,
  type ScoreRankDrill,
  type ScoreRow,
} from '@/curriculum/drills';
import { LessonFrame, type DrillResult, type LessonPhase } from './LessonFrame';
import {
  CheckIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  XIcon,
} from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

function formatFactor(value: number, format: 'int' | 'percent' | 'months') {
  if (format === 'percent') return `${Math.round(value * 100)}%`;
  if (format === 'months') return `${value} pm`;
  return value.toLocaleString();
}

/**
 * Console lesson body for score-and-rank drills (RICE, WSJF). The learner reads
 * each row's factors, then orders the rows best-first using accessible up/down
 * controls (keyboard-operable; no drag required). CHECK grades the ordering
 * against the canonical ranking and reveals each row's computed score.
 */
export function ScoreRankLesson({
  skill,
  drill,
  scenarioTag,
}: {
  skill: Skill;
  drill: ScoreRankDrill;
  scenarioTag: string;
}) {
  // Start in given order; the learner rearranges toward best-first.
  const [order, setOrder] = useState<string[]>(drill.rows.map((r) => r.id));

  const rowById = (id: string) => drill.rows.find((r) => r.id === id) as ScoreRow;

  function move(index: number, dir: -1 | 1) {
    setOrder((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function grade(): DrillResult {
    const { correct, total, score, allCorrect } = gradeRanking(drill, order);
    const canonical = rankRows(drill);

    return {
      correct: allCorrect,
      score,
      headline: allCorrect ? 'Perfect ranking!' : `${correct} / ${total} in place`,
      explanation: allCorrect ? (
        <>{drill.insight}</>
      ) : (
        <>
          {correct} of {total} rows are in the right slot. {drill.insight}
        </>
      ),
      detail: (
        <div className="grid gap-2">
          <div className="mono text-[11px] uppercase tracking-[0.06em] text-mute">
            Correct ranking · {drill.formula}
          </div>
          <ol className="grid gap-1.5">
            {canonical.map((r, i) => (
              <li key={r.id}>
                <b className="font-semibold text-ink">
                  {padIndex(i + 1)}. {r.name}
                </b>{' '}
                <span className="mono text-accent">
                  = {drill.score(r).toFixed(1)}
                </span>
                <span className="block text-slate">{r.reasoning}</span>
              </li>
            ))}
          </ol>
        </div>
      ),
    };
  }

  return (
    <LessonFrame
      skill={skill}
      scenarioTag={scenarioTag}
      heading={drill.prompt}
      canCheck
      onCheck={grade}
    >
      {(phase: LessonPhase) => {
        const locked = phase !== 'answer';
        const canonical = rankRows(drill);
        const canonicalSlot = (id: string) =>
          canonical.findIndex((r) => r.id === id);

        return (
          <>
            <p className="mono mt-3 text-[12px] text-mute">
              Formula · {drill.formula}
            </p>

            <div
              role="list"
              aria-label="Rank the rows, highest priority first"
              className="mt-[18px] grid gap-2.5"
            >
              {order.map((id, i) => {
                const row = rowById(id);
                // After grading: this slot is right if its canonical position
                // matches (ties handled by gradeRanking, but display by index).
                const inPlace = locked && canonicalSlot(id) === i;
                const outOfPlace = locked && !inPlace;

                return (
                  <div
                    key={id}
                    role="listitem"
                    className={[
                      'rounded-console-lg border bg-paper p-[14px_15px] transition-[border-color,box-shadow] duration-150',
                      inPlace
                        ? 'border-good shadow-[0_0_0_1px_var(--color-good)_inset]'
                        : outOfPlace
                          ? 'border-bad shadow-[0_0_0_1px_var(--color-bad)_inset]'
                          : 'border-line',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      {/* rank index + reorder controls */}
                      <div className="flex flex-none flex-col items-center gap-1">
                        <span className="mono tnum text-[15px] font-semibold text-ink">
                          {padIndex(i + 1)}
                        </span>
                        {!locked && (
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              aria-label={`Move ${row.name} up`}
                              disabled={i === 0}
                              onClick={() => move(i, -1)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-console-sm border border-line bg-panel text-slate transition-colors hover:border-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <TriangleUpIcon size={13} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${row.name} down`}
                              disabled={i === order.length - 1}
                              onClick={() => move(i, 1)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-console-sm border border-line bg-panel text-slate transition-colors hover:border-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <TriangleDownIcon size={13} />
                            </button>
                          </div>
                        )}
                        {locked &&
                          (inPlace ? (
                            <CheckIcon size={15} className="text-good" />
                          ) : (
                            <XIcon size={15} className="text-bad" />
                          ))}
                      </div>

                      <div className="min-w-0 flex-auto">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-[14.5px] font-semibold text-ink">
                            {row.name}
                          </h3>
                          {locked && (
                            <span className="mono text-[12px] text-accent">
                              {drill.score(row).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12.5px] leading-[1.5] text-slate">
                          {row.context}
                        </p>

                        {/* factor readout */}
                        <div className="mono mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-mute">
                          {drill.factors.map((f) => (
                            <span key={f.key}>
                              {f.label}:{' '}
                              <b className="font-semibold text-ink-2">
                                {formatFactor(row.factors[f.key], f.format)}
                              </b>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      }}
    </LessonFrame>
  );
}
