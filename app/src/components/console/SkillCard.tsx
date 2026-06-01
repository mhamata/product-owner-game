import Link from 'next/link';
import type { Skill, SkillState } from '@/curriculum/types';
import { ProgressRing } from './ProgressRing';
import {
  CheckIcon,
  CheckSquareIcon,
  ChevronRightIcon,
  LockIcon,
} from './Icon';

interface SkillCardProps {
  skill: Skill;
  state: SkillState;
  /** 0..1 demonstrated competence, used for the card foot ring/percentage. */
  mastery: number;
}

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * One skill node on the Practice Map.
 *
 * - mastered → calm card, check-square mark, "Mastered" badge (icon + label).
 * - active   → Von Restorff highlight; the whole card is a link to the lesson,
 *              showing only the START affordance + a mini progress ring.
 * - locked   → dashed, non-interactive, lock icon + "Locked" badge.
 *
 * Color is always paired with an icon and a text label — never color alone.
 */
export function SkillCard({ skill, state, mastery }: SkillCardProps) {
  const meta = `Skill ${padIndex(skill.index)}`;

  if (state === 'active') {
    return (
      <Link
        href={`/learn/${skill.id}`}
        aria-label={`Start the active skill: ${skill.title}`}
        className="group relative flex min-h-[132px] flex-col gap-3.5 rounded-console-lg border border-accent/45 bg-gradient-to-b from-accent-050 to-paper p-4 text-left shadow-console-sm no-underline transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-accent/70 hover:shadow-console-md active:translate-y-0"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-ink">
              {skill.title}
            </div>
            <div className="mono mt-0.5 text-[10.5px] uppercase tracking-[0.06em] text-faint">
              {meta} · current
            </div>
          </div>
          <ProgressRing
            value={mastery}
            size={26}
            strokeWidth={3}
            animate
            className="flex-none"
          />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2.5">
          <span className="mono inline-flex items-center gap-1.5 rounded-console border-0 bg-accent px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-white shadow-console-sm transition-colors group-hover:bg-accent-700">
            Start
            <ChevronRightIcon size={13} />
          </span>
          <span className="mono tnum text-[12px] text-slate">
            {Math.round(mastery * 100)}%
          </span>
        </div>
      </Link>
    );
  }

  if (state === 'mastered') {
    return (
      <div className="relative flex min-h-[132px] flex-col gap-3.5 rounded-console-lg border border-line bg-paper p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-ink">
              {skill.title}
            </div>
            <div className="mono mt-0.5 text-[10.5px] uppercase tracking-[0.06em] text-faint">
              {meta}
            </div>
          </div>
          <CheckSquareIcon size={18} className="flex-none text-good" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2.5">
          <span className="mono inline-flex items-center gap-1.5 rounded-full border border-good-line bg-good-050 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-good">
            <CheckIcon size={12} />
            Mastered
          </span>
          <span className="mono tnum text-[12px] text-slate">100%</span>
        </div>
      </div>
    );
  }

  // locked / available (rendered identically to keep the map scannable)
  return (
    <div className="relative flex min-h-[132px] flex-col gap-3.5 rounded-console-lg border border-dashed border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-mute">
            {skill.title}
          </div>
          <div className="mono mt-0.5 text-[10.5px] uppercase tracking-[0.06em] text-faint">
            {meta}
          </div>
        </div>
        <LockIcon size={15} className="flex-none text-faint" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-2.5">
        <span className="mono inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-mute">
          <LockIcon size={12} />
          Locked
        </span>
        <span className="mono text-[12px] text-slate">—</span>
      </div>
    </div>
  );
}
