'use client';

import Link from 'next/link';
import type { Skill } from '@/curriculum/types';
import { getUnitForSkill } from '@/curriculum/data';
import { Topbar } from '../Topbar';
import { ArrowRightIcon, ChevronRightIcon } from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * Placeholder for skills that map to an existing drill but don't yet have a
 * full Console lesson loop (everything except value-vs-effort in Phase 1).
 * When the skill links to a method, we offer a jump to its library drill so
 * the screen isn't a dead end.
 */
export function ComingSoonLesson({ skill }: { skill: Skill }) {
  const unit = getUnitForSkill(skill.id);

  return (
    <>
      <Topbar />
      <main className="flex-auto">
        <div className="mx-auto flex max-w-[720px] flex-col items-start px-6 pt-16">
          <span className="mono rounded-console-sm border border-line bg-panel-2 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-mute">
            {unit ? `Unit ${padIndex(unit.number)}` : 'Skill'} · {skill.title}
          </span>

          <h1 className="mt-4 text-[28px] font-bold tracking-[-0.02em] text-ink">
            Lesson coming soon
          </h1>
          <p className="mt-2 max-w-[48ch] text-[15px] text-slate">
            The Console lesson loop for <b className="font-semibold text-ink">{skill.title}</b> is
            being built. Today, only{' '}
            <span className="mono text-[13.5px] text-accent">Value vs Effort</span>{' '}
            ships the full interactive drill.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {skill.methodId && (
              <Link
                href={`/methods/${skill.methodId}`}
                className="mono inline-flex items-center gap-2 rounded-console border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink no-underline transition-colors hover:border-faint"
              >
                Read the method
                <ChevronRightIcon size={13} />
              </Link>
            )}
            <Link
              href="/"
              className="mono inline-flex items-center gap-2 rounded-console border-0 bg-accent px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white no-underline transition-colors hover:bg-accent-700"
            >
              Back to the map
              <ArrowRightIcon size={13} />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
