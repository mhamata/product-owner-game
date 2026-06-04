'use client';

import Link from 'next/link';
import type { Skill } from '@/curriculum/types';
import { COMPETENCIES } from '@/curriculum/types';
import { getUnitForSkill, getLevel } from '@/curriculum/data';
import { Topbar } from '../Topbar';
import { ModalityIcons } from '../skillMeta';
import { ArrowRightIcon, ChevronRightIcon, ClockIcon } from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * Placeholder for `coming-soon` skills — every new ladder skill plus the
 * specialization tracks. It names the level/unit, the competency the skill
 * builds, and the planned practice modalities, then offers a jump to the linked
 * method (when one exists) so the screen isn't a dead end.
 */
export function ComingSoonLesson({ skill }: { skill: Skill }) {
  const unit = getUnitForSkill(skill.id);
  const level = skill.level ? getLevel(skill.level) : undefined;
  const competency = COMPETENCIES[skill.competency].label;

  const context = unit
    ? `${level ? `${level.label} · ` : ''}Unit ${padIndex(unit.number)}`
    : 'Specialization track';

  return (
    <>
      <Topbar />
      <main className="flex-auto">
        <div className="mx-auto flex max-w-[720px] flex-col items-start px-6 pt-16">
          <span className="mono inline-flex items-center gap-2 rounded-console-sm border border-line bg-panel-2 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-mute">
            <ClockIcon size={12} />
            {context} · {skill.title}
          </span>

          <h1 className="mt-4 text-[28px] font-bold tracking-[-0.02em] text-ink">
            Lesson coming soon
          </h1>
          <p className="mt-2 max-w-[52ch] text-[15px] text-slate">
            The practice loop for{' '}
            <b className="font-semibold text-ink">{skill.title}</b> is on the
            roadmap. It builds the{' '}
            <span className="mono text-[13.5px] text-accent">{competency}</span>{' '}
            competency. Meanwhile, the playable drills across Discovery,
            Prioritization, Estimation, and Launch are live on the map.
          </p>

          <div className="mt-5 flex items-center gap-2.5">
            <span className="mono text-[11px] uppercase tracking-[0.12em] text-faint">
              Planned formats
            </span>
            <ModalityIcons modalities={skill.modalities} />
          </div>

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
