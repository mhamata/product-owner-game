'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { CheckIcon, XIcon } from '../Icon';

/** One item-independent card in a deterministic drill stack (a classification bucket or a sizing pick). */
export interface DrillStackItem<C extends string> {
  id: string;
  title: string;
  description?: string;
  choices: { key: C; label: string }[];
  correct: C;
  /** One-line explanation shown after this item is answered, right or wrong. */
  why: string;
}

/**
 * DRILL PLAYER card-stack (W4-I, praxis-learn-mockup.html's jcard pattern
 * applied to the deterministic drills whose items are independently
 * gradable — classification (Kano/MoSCoW) and sizing (T-shirt/estimation),
 * where "is THIS one item right" is a real, standalone question, unlike the
 * relative-order drills (RICE/WSJF ranking, 5-Whys sequencing) which keep
 * their existing all-at-once reorder interaction.
 *
 * One item is shown at a time (peeking the next card behind it); picking a
 * choice reveals that item's own verdict stamp + one-line "why" immediately
 * — no waiting for a batch Check. This is purely a PRESENTATION/input layer:
 * it writes into the SAME `values` record the parent already threads into
 * `gradeClassification`/`gradeSizing`, so the parent's Check/Continue flow
 * (mastery recording, block summary) is completely unchanged by this stack;
 * only how the items are answered and revealed changed.
 */
export function DrillCardStack<C extends string>({
  items,
  values,
  onAnswer,
  ariaLabel,
}: {
  items: DrillStackItem<C>[];
  values: Record<string, C | undefined>;
  onAnswer: (id: string, choice: C) => void;
  ariaLabel: string;
}) {
  // `revealIndex` HOLDS the just-answered card on screen (with its stamp +
  // explanation) until the learner taps "Next card" — without this, the
  // moment `onAnswer` writes into the parent's `values` record, the derived
  // "first unanswered item" would already be the NEXT card and the stamp
  // would never actually render. Cleared (back to `null`, meaning "follow
  // the first unanswered item") on advance.
  const [revealIndex, setRevealIndex] = useState<number | null>(null);
  const firstUnanswered = items.findIndex((it) => values[it.id] === undefined);
  const activeIndex =
    revealIndex ?? (firstUnanswered === -1 ? items.length - 1 : firstUnanswered);
  const active = items[activeIndex];
  if (!active) return null;

  const picked = values[active.id];
  const revealed = revealIndex === activeIndex && picked !== undefined;
  const isCorrect = picked === active.correct;
  const peek = items[activeIndex + 1];
  const isLast = activeIndex === items.length - 1;

  function pick(choice: C) {
    onAnswer(active.id, choice);
    setRevealIndex(activeIndex);
  }

  return (
    <div className="relative mt-[18px]" aria-label={ariaLabel}>
      {/* peeking next card: purely decorative stack depth, no content leak */}
      {peek && (
        <div
          aria-hidden
          className="absolute inset-x-3 top-3 h-full rounded-[16px] border border-[var(--px-line)] bg-[var(--px-card)] opacity-60"
        />
      )}

      <div className="relative rounded-[16px] border border-[var(--px-line)] bg-[var(--px-card)] p-[16px_18px] shadow-[0_10px_28px_rgba(0,0,0,0.10)]">
        <div className="flex items-center justify-between gap-2">
          <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--px-dimmer)]">
            Card {activeIndex + 1} of {items.length}
          </span>
          {revealed && (
            <span
              role="status"
              aria-live="polite"
              className={cn(
                'motion-safe:animate-[stampIn_220ms_cubic-bezier(0.2,1.4,0.4,1)_forwards] inline-flex items-center gap-1 rounded-[8px] border-2 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.08em]',
                isCorrect
                  ? 'border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_10%,transparent)] text-[var(--px-good)]'
                  : 'border-[var(--px-crit)] bg-[color-mix(in_srgb,var(--px-crit)_10%,transparent)] text-[var(--px-crit)]',
              )}
            >
              {isCorrect ? <CheckIcon size={12} /> : <XIcon size={12} />}
              {isCorrect ? 'Sharp call' : 'Miss'}
            </span>
          )}
        </div>

        <h3 className="mt-2 text-[15px] font-semibold text-[var(--px-ink)]">{active.title}</h3>
        {active.description && (
          <p className="mt-1 text-[13px] leading-[1.5] text-[var(--px-body)]">{active.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={`Answer: ${active.title}`}>
          {active.choices.map((c) => {
            const isPicked = picked === c.key;
            const showCorrect = revealed && c.key === active.correct;
            return (
              <button
                key={c.key}
                type="button"
                disabled={revealed}
                aria-pressed={isPicked}
                onClick={() => pick(c.key)}
                className={cn(
                  'mono rounded-[10px] border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:cursor-default',
                  showCorrect
                    ? 'border-[var(--px-good)] bg-[var(--px-good)] text-[var(--px-on-accent)]'
                    : isPicked
                      ? isCorrect
                        ? 'border-[var(--px-accent)] bg-[var(--px-accent)] text-[var(--px-on-accent)]'
                        : 'border-[var(--px-crit)] bg-[var(--px-crit)] text-white'
                      : revealed
                        ? 'border-[var(--px-line)] text-[var(--px-dimmer)] opacity-60'
                        : 'border-[var(--px-line)] text-[var(--px-body)] hover:border-[var(--px-line-strong)] hover:text-[var(--px-ink)]',
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="mt-3 border-t border-dashed border-[var(--px-line)] pt-3">
            <p className="text-[12.5px] leading-[1.5] text-[var(--px-dim)]">{active.why}</p>
            {!isLast && (
              <button
                type="button"
                onClick={() => setRevealIndex(null)}
                className="mono mt-2.5 inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--px-accent)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--px-on-accent)]"
              >
                Next card
              </button>
            )}
            {isLast && (
              <p className="mono mt-2.5 text-[11px] uppercase tracking-[0.08em] text-[var(--px-good)]">
                All cards answered — check below
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
