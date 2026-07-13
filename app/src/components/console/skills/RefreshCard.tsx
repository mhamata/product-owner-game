'use client';

import type { ResolvedScenario } from '@/curriculum/judgment';
import { cn } from '@/lib/cn';
import { CheckIcon, ScaleIcon } from '../Icon';

/**
 * A single 90-second-refresh judgment call, `--px-*`-styled so it lives
 * comfortably inside the tech-tree node sheet (see SkillNodeSheet.tsx).
 *
 * Deliberately a SEPARATE, smaller component from
 * `review/JudgmentCard.tsx` rather than a reuse of it: that component is
 * styled off the older `--color-*` Console tokens, which are hard-coded
 * light-only (see globals.css's "SCOPE DECISION" comment on `--px-*`) — reskinning
 * it here would either regress the existing /review screen's light-only
 * look or require a broader token migration outside this slice's scope. The
 * DATA/scoring machinery (ResolvedScenario, reviewStore.review) is still
 * fully shared; only the presentation is separate.
 */
export function RefreshCard({
  scenario,
  answer,
  revealed,
  onAnswer,
}: {
  scenario: ResolvedScenario;
  answer: string | undefined;
  revealed: boolean;
  onAnswer: (optionId: string) => void;
}) {
  const pickedBest = answer === scenario.bestOptionId;

  return (
    <div className="rounded-[14px] border border-[var(--px-line)] bg-[var(--px-raised)] p-[14px_16px]">
      <p className="text-[13px] font-semibold leading-tight text-[var(--px-ink)]">{scenario.title}</p>
      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[var(--px-body)]">{scenario.situation}</p>

      <div className="mt-3 grid gap-1.5">
        {scenario.options.map((opt) => {
          const selected = answer === opt.id;
          const isBest = revealed && opt.id === scenario.bestOptionId;
          const isWrongPick = revealed && selected && opt.id !== scenario.bestOptionId;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={revealed}
              onClick={() => onAnswer(opt.id)}
              className={cn(
                'rounded-[10px] border px-2.5 py-2 text-left text-[12px] leading-[1.45] transition-colors',
                isBest
                  ? 'border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_12%,transparent)] text-[var(--px-ink)]'
                  : isWrongPick
                    ? 'border-[var(--px-crit)] bg-[color-mix(in_srgb,var(--px-crit)_12%,transparent)] text-[var(--px-ink)]'
                    : selected
                      ? 'border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] text-[var(--px-ink)]'
                      : 'border-[var(--px-line)] text-[var(--px-body)]',
                revealed ? 'cursor-default' : 'cursor-pointer',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-3 flex items-start gap-2 border-t border-dashed border-[var(--px-line)] pt-3">
          <span
            className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-[var(--px-on-accent)]"
            style={{ background: pickedBest ? 'var(--px-good)' : 'var(--px-accent)' }}
          >
            {pickedBest ? <CheckIcon size={11} /> : <ScaleIcon size={11} />}
          </span>
          <p className="text-[11.5px] leading-[1.5] text-[var(--px-dim)]">{scenario.why}</p>
        </div>
      )}
    </div>
  );
}
