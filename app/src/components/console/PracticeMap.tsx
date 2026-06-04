'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  levels,
  tracks,
  getUnitsForLevel,
  TOTAL_SKILLS,
  TOTAL_LADDER_SKILLS,
  deriveSkillState,
  isLevelComplete,
  isLevelCurrent,
  isLevelUnlocked,
} from '@/curriculum/data';
import type { Level } from '@/curriculum/types';
import { useLearnStore } from '@/store/learnStore';
import { useIndustryStore } from '@/store/industryStore';
import { INDUSTRIES, DEFAULT_INDUSTRY, isIndustryId } from '@/curriculum/industries';
import { Topbar } from './Topbar';
import { SkillCard } from './SkillCard';
import { ProgressRing } from './ProgressRing';
import { ModalityIcons } from './skillMeta';
import {
  ArrowRightIcon,
  BuildingIcon,
  CaretDownIcon,
  CheckIcon,
  CircleDotIcon,
  ClockIcon,
  FlameIcon,
  LayersIcon,
  LockIcon,
} from './Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/* ------------------------------------------------------------------
   Branch labels for the post-senior fork.
   ------------------------------------------------------------------ */
const BRANCH_NOTE: Record<Level['branch'], string | null> = {
  core: null,
  ic: 'IC track · post-senior',
  management: 'Management track · post-senior',
};

/**
 * One LEVEL on the Practice Map: a labelled header (locked / active / complete),
 * then its units, each a sub-header over a grid of skill cards. Locked levels
 * collapse to a one-line "locknote" listing their units so the map stays
 * scannable — exactly the pattern the old per-unit map used, lifted up a tier.
 */
function LevelSection({
  level,
  masteredIds,
  progress,
}: {
  level: Level;
  masteredIds: ReadonlySet<string>;
  progress: Record<string, { mastery: number }>;
}) {
  const units = getUnitsForLevel(level.id);
  const unlocked = isLevelUnlocked(level.id, masteredIds);
  const done = isLevelComplete(level.id, masteredIds);
  const current = isLevelCurrent(level.id, masteredIds);
  // "Locked" = not yet reachable. An unlocked level that isn't current/done is
  // still shown open (it's the next thing, or all coming-soon) so learners can
  // see what's ahead; only truly gated levels collapse.
  const collapsed = !unlocked;
  const branchNote = BRANCH_NOTE[level.branch];

  const statusPill = done
    ? { cls: 'border-good-line bg-good-050 text-good', icon: <CheckIcon size={13} />, label: 'Complete' }
    : current
      ? { cls: 'border-accent-100 bg-accent-050 text-accent', icon: <CircleDotIcon size={13} />, label: 'In progress' }
      : unlocked
        ? { cls: 'border-line bg-panel-2 text-slate', icon: <ClockIcon size={13} />, label: 'Available' }
        : { cls: 'border-line bg-panel-2 text-mute', icon: <LockIcon size={13} />, label: 'Locked' };

  return (
    <section className="mt-11 first:mt-6">
      {/* level header */}
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-line pb-3">
        <span
          className={[
            'mono whitespace-nowrap rounded-console-sm border px-[10px] py-1 text-[11px] uppercase tracking-[0.14em]',
            done
              ? 'border-good-line bg-good-050 text-good'
              : current
                ? 'border-accent-100 bg-accent-050 text-accent'
                : 'border-line bg-panel-2 text-mute',
          ].join(' ')}
        >
          Level {padIndex(level.order)}
        </span>
        <span
          className={[
            'text-[19px] font-extrabold tracking-[-0.02em]',
            collapsed ? 'text-mute' : 'text-ink',
          ].join(' ')}
        >
          {level.label}
        </span>
        {branchNote && (
          <span className="mono rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-faint">
            {branchNote}
          </span>
        )}
        <span
          className={`mono ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] ${statusPill.cls}`}
        >
          {statusPill.icon}
          {statusPill.label}
        </span>
      </div>

      {/* level summary */}
      <p className={['mt-3 max-w-[64ch] text-[14px]', collapsed ? 'text-mute' : 'text-slate'].join(' ')}>
        {level.summary}
      </p>

      {collapsed ? (
        <div className="mt-3 flex items-start gap-2.5 text-[13px] text-mute">
          <LockIcon size={15} className="mt-0.5 flex-none text-faint" />
          <span>
            Unlocks as you master earlier levels ·{' '}
            <span className="mono text-[11.5px] tracking-[0.02em] text-faint">
              {units.map((u) => u.title).join(' · ')}
            </span>
          </span>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-7">
          {units.map((unit) => (
            <div key={unit.id}>
              {/* unit sub-header */}
              <div className="flex items-baseline gap-2.5">
                <span className="mono whitespace-nowrap text-[10.5px] uppercase tracking-[0.14em] text-faint">
                  Unit {padIndex(unit.number)}
                </span>
                <span className="text-[14.5px] font-bold tracking-[-0.01em] text-ink">
                  {unit.title}
                </span>
              </div>
              <p className="mono mt-1 text-[11.5px] text-faint">{unit.blurb}</p>

              <div className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-3.5 max-[560px]:grid-cols-1">
                {unit.skills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    state={deriveSkillState(skill.id, masteredIds)}
                    mastery={progress[skill.id]?.mastery ?? 0}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * The Console "Practice Map" home: topbar, a status bar (consistency streak +
 * mastery ring + home-industry chip), a curriculum header with an overall
 * progress meter, then the six career LEVELS rendered as labelled sections of
 * units → skill cards. Below the ladder sit the Capstone simulation entry and a
 * specialization-tracks section (off-ladder depth, coming soon).
 */
export function PracticeMap() {
  const progress = useLearnStore((s) => s.progress);
  const streak = useLearnStore((s) => s.streak);
  const hasHydrated = useLearnStore((s) => s.hasHydrated);

  // Home industry — persisted, SSR-safe. Before hydration we show the default
  // so server + first client paint agree (mirrors the streak gating above).
  const industry = useIndustryStore((s) => s.industry);
  const industryHydrated = useIndustryStore((s) => s.hasHydrated);
  const setIndustry = useIndustryStore((s) => s.setIndustry);
  const selectedIndustry = industryHydrated ? industry : DEFAULT_INDUSTRY;

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
            title="Mastery — demonstrated competence across the playable curriculum"
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
              value={selectedIndustry}
              onChange={(e) => {
                if (isIndustryId(e.target.value)) setIndustry(e.target.value);
              }}
              className="cursor-pointer appearance-none border-0 bg-transparent pr-4 text-[13px] font-semibold text-ink focus:outline-none"
            >
              {INDUSTRIES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
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
                <p className="mt-2 max-w-[56ch] text-[15px] text-slate">
                  A zero-to-expert path across {levels.length} career levels and{' '}
                  {TOTAL_LADDER_SKILLS} skills. Earn mastery by proving the
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

          {/* the career ladder */}
          <div className="pt-7">
            {levels.map((level) => (
              <LevelSection
                key={level.id}
                level={level}
                masteredIds={masteredIds}
                progress={progress}
              />
            ))}
          </div>

          {/* Capstone — entry point to the existing live simulation */}
          <section className="mt-11">
            <div className="flex items-center gap-3 border-b-2 border-line pb-3">
              <span className="mono whitespace-nowrap rounded-console-sm border border-line bg-panel-2 px-[10px] py-1 text-[11px] uppercase tracking-[0.14em] text-mute">
                Capstone
              </span>
              <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">
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

          {/* Specialization tracks — off-ladder depth (coming soon) */}
          <section className="mt-11 pb-16">
            <div className="flex flex-wrap items-center gap-3 border-b-2 border-line pb-3">
              <span className="mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-console-sm border border-line bg-panel-2 px-[10px] py-1 text-[11px] uppercase tracking-[0.14em] text-mute">
                <LayersIcon size={13} />
                Tracks
              </span>
              <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">
                Specializations
              </span>
              <span className="mono ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-panel-2 px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] text-mute">
                <ClockIcon size={13} />
                Coming soon
              </span>
            </div>
            <p className="mt-3 max-w-[64ch] text-[14px] text-slate">
              Go deep on a domain once you reach Senior. These run beside the
              ladder, not on it.
            </p>

            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3.5 max-[560px]:grid-cols-1">
              {tracks.map((track) => {
                const modalities = Array.from(
                  new Set(track.skills.flatMap((s) => s.modalities)),
                );
                return (
                  <div
                    key={track.id}
                    className="flex flex-col gap-2.5 rounded-console-lg border border-dashed border-line bg-panel/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                        {track.label}
                      </span>
                      <LayersIcon size={15} className="flex-none text-faint" />
                    </div>
                    <p className="text-[12.5px] leading-snug text-slate">
                      {track.summary}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-faint">
                        {track.skills.length} skills
                      </span>
                      <ModalityIcons modalities={modalities} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
