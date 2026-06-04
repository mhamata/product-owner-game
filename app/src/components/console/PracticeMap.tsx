'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  units,
  TOTAL_SKILLS,
  deriveSkillState,
  isUnitComplete,
  isUnitCurrent,
} from '@/curriculum/data';
import { useLearnStore } from '@/store/learnStore';
import { Topbar } from './Topbar';
import { SkillCard } from './SkillCard';
import { ProgressRing } from './ProgressRing';
import {
  ArrowRightIcon,
  BuildingIcon,
  CaretDownIcon,
  CheckIcon,
  CircleDotIcon,
  FlameIcon,
  LockIcon,
} from './Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * The Console "Practice Map" home: topbar, a status bar (consistency streak +
 * mastery ring + home-industry chip), the curriculum header with an overall
 * progress meter, and the 7 units rendered as labelled sections of skill cards.
 *
 * Locked units collapse to a one-line "locknote" listing their topics, exactly
 * like the mockup, so the whole map stays scannable.
 */
export function PracticeMap() {
  const progress = useLearnStore((s) => s.progress);
  const streak = useLearnStore((s) => s.streak);
  const hasHydrated = useLearnStore((s) => s.hasHydrated);

  // Derive everything from persisted progress. Before hydration we render the
  // seed-equivalent (server + first client paint agree → no mismatch flash).
  const masteredIds = useMemo(
    () =>
      new Set(
        Object.entries(progress)
          .filter(([, p]) => p.mastery >= 1)
          .map(([id]) => id),
      ),
    [progress],
  );

  const masteredCount = masteredIds.size;
  const overall = TOTAL_SKILLS > 0 ? masteredCount / TOTAL_SKILLS : 0;
  const overallPct = Math.round(overall * 100);

  return (
    <>
      <Topbar />

      {/* status bar */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-3.5 px-6 py-[18px]">
          {/* consistency streak — habit, not guilt */}
          <div
            className="inline-flex items-center gap-2.5 rounded-console border border-line bg-paper px-[13px] py-2"
            title="Flexible consistency streak — keep the habit, no guilt"
          >
            <FlameIcon size={17} className="flex-none text-flame" />
            <span>
              <span className="mono block text-[10px] uppercase leading-tight tracking-[0.14em] text-mute">
                Streak
              </span>
              <span className="mono tnum block text-[15px] font-semibold leading-tight text-ink">
                {hasHydrated ? streak : 0} <span className="font-medium text-faint">days</span>
              </span>
            </span>
          </div>

          {/* mastery — demonstrated competence, not lesson count */}
          <div
            className="inline-flex items-center gap-2.5 rounded-console border border-line bg-paper px-[13px] py-2"
            title="Mastery — demonstrated competence across skills"
          >
            <ProgressRing
              value={overall}
              size={34}
              strokeWidth={3.4}
              animate
              className="flex-none"
            />
            <span>
              <span className="mono block text-[10px] uppercase leading-tight tracking-[0.14em] text-mute">
                Mastery
              </span>
              <span className="mono tnum block text-[15px] font-semibold leading-tight text-ink">
                {padIndex(masteredCount)} <span className="font-medium text-faint">/ {padIndex(TOTAL_SKILLS)}</span>
              </span>
            </span>
          </div>

          <div className="h-0 flex-auto basis-full max-[560px]:basis-full md:h-auto md:basis-auto" />

          {/* home industry chip */}
          <label
            className="relative inline-flex items-center gap-2.5 rounded-console border border-line bg-paper px-3 py-2 transition-colors hover:border-faint"
            title="Your home industry tunes every scenario"
          >
            <BuildingIcon size={15} className="flex-none text-accent" />
            <span className="mono text-[10px] uppercase tracking-[0.14em] text-mute">
              Home industry
            </span>
            <select
              aria-label="Home industry"
              defaultValue="SaaS"
              className="cursor-pointer appearance-none border-0 bg-transparent pr-4 text-[13px] font-semibold text-ink focus:outline-none"
            >
              <option>SaaS</option>
              <option>Fintech</option>
              <option>Marketplace</option>
              <option>Consumer</option>
              <option>Healthcare</option>
            </select>
            <CaretDownIcon
              size={11}
              className="pointer-events-none absolute right-3 text-slate"
            />
          </label>
        </div>
      </div>

      <main className="flex-auto">
        <div className="mx-auto max-w-[1080px] px-6">
          {/* heading */}
          <header className="pb-2 pt-9 max-[560px]:pt-[26px]">
            <div className="flex items-baseline justify-between gap-4 max-[560px]:flex-col max-[560px]:gap-1.5">
              <div>
                <p className="eyebrow">Curriculum · product management</p>
                <h1 className="mt-2.5 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] max-[560px]:text-[25px]">
                  The Practice Map
                </h1>
                <p className="mt-2 max-w-[52ch] text-[15px] text-slate">
                  Seven units, {TOTAL_SKILLS} skills. Earn mastery by proving the
                  judgment — not by clearing checkboxes.
                </p>
              </div>
              <span className="mono whitespace-nowrap text-[12px] text-faint">
                {padIndex(masteredCount)} / {padIndex(TOTAL_SKILLS)} mastered
              </span>
            </div>

            <div className="mt-[22px] flex items-center gap-3.5" aria-hidden="true">
              <span className="eyebrow">Progress</span>
              <div className="h-1.5 flex-auto overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <span className="mono tnum text-[12px] text-slate">{overallPct}%</span>
            </div>
          </header>

          {/* units */}
          <div className="pb-16 pt-7">
            {units.map((unit) => {
              const done = isUnitComplete(unit.id, masteredIds);
              const current = isUnitCurrent(unit.id, masteredIds);
              const locked = !done && !current;

              return (
                <section key={unit.id} className="mt-[30px] first:mt-[22px]">
                  <div className="flex items-center gap-3 border-b border-line pb-3.5">
                    <span
                      className={[
                        'mono whitespace-nowrap rounded-console-sm border px-[9px] py-1 text-[11px] uppercase tracking-[0.14em]',
                        done
                          ? 'border-good-line bg-good-050 text-good'
                          : current
                            ? 'border-accent-100 bg-accent-050 text-accent'
                            : 'border-line bg-panel-2 text-mute',
                      ].join(' ')}
                    >
                      Unit {padIndex(unit.number)}
                    </span>
                    <span
                      className={[
                        'text-[17px] font-bold tracking-[-0.01em]',
                        locked ? 'text-mute' : 'text-ink',
                      ].join(' ')}
                    >
                      {unit.title}
                    </span>
                    <span
                      className={[
                        'mono ml-auto inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] uppercase tracking-[0.1em]',
                        done ? 'text-good' : current ? 'text-accent' : 'text-mute',
                      ].join(' ')}
                    >
                      {done ? (
                        <>
                          <CheckIcon size={13} />
                          Completed
                        </>
                      ) : current ? (
                        <>
                          <CircleDotIcon size={13} />
                          In progress
                        </>
                      ) : (
                        <>
                          <LockIcon size={13} />
                          Locked
                        </>
                      )}
                    </span>
                  </div>

                  {locked ? (
                    <div className="mt-3.5 flex items-center gap-2.5 text-[13.5px] text-mute">
                      <LockIcon size={15} className="flex-none text-faint" />
                      <span>
                        Unlocks earlier in the path ·{' '}
                        <span className="mono text-[11.5px] tracking-[0.02em] text-faint">
                          {unit.skills.map((s) => s.title).join(' · ')}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-3.5 max-[560px]:grid-cols-1">
                      {unit.skills.map((skill) => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          state={deriveSkillState(skill.id, masteredIds)}
                          mastery={progress[skill.id]?.mastery ?? 0}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Capstone — entry point to the existing live simulation */}
            <section className="mt-[30px]">
              <div className="flex items-center gap-3 border-b border-line pb-3.5">
                <span className="mono whitespace-nowrap rounded-console-sm border border-line bg-panel-2 px-[9px] py-1 text-[11px] uppercase tracking-[0.14em] text-mute">
                  Capstone
                </span>
                <span className="text-[17px] font-bold tracking-[-0.01em] text-ink">
                  Full Simulation
                </span>
                <span className="mono ml-auto inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] uppercase tracking-[0.1em] text-mute">
                  Preview
                </span>
              </div>
              <div className="mt-4">
                <Link
                  href="/play/01-canadian-launch"
                  className="group flex max-w-[480px] items-center justify-between gap-3 rounded-console-lg border border-line bg-paper p-4 no-underline transition-[border-color,box-shadow] hover:border-faint hover:shadow-console-sm"
                >
                  <span>
                    <span className="block text-[15px] font-semibold tracking-[-0.01em] text-ink">
                      Run a full product cycle
                    </span>
                    <span className="mono mt-0.5 block text-[11.5px] text-faint">
                      Apply every skill end-to-end · multi-iteration sim
                    </span>
                  </span>
                  <span className="mono inline-flex flex-none items-center gap-1.5 rounded-console border border-line bg-panel px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate transition-colors group-hover:border-faint group-hover:text-ink">
                    Open
                    <ArrowRightIcon size={13} />
                  </span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
