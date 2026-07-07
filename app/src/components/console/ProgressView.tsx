'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  levels,
  readySkillIdsOfLevel,
  TOTAL_SKILLS,
  isLevelCertified,
  isLevelCurrent,
  isLevelUnlocked,
  dimensionCoverage,
  allCompetencyCoverage,
  type CoverageStat,
} from '@/curriculum/data';
import { canTestOut } from '@/curriculum/placement';
import {
  COMPETENCIES,
  DIMENSIONS,
  type Competency,
  type CompetencyGroup,
  type Level,
} from '@/curriculum/types';
import { useLearnStore } from '@/store/learnStore';
import { Topbar } from './Topbar';
import { ProgressRing } from './ProgressRing';
import { SimEvidenceBand } from './SimEvidenceBand';
import {
  ArrowRightIcon,
  CapIcon,
  CheckIcon,
  CircleDotIcon,
  ClockIcon,
  FileIcon,
  FlameIcon,
  LockIcon,
} from './Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/** The 4 core dimensions, then the cross-cutting bucket, in display order. */
const DIMENSION_ORDER: CompetencyGroup[] = [
  'execution',
  'insight',
  'strategy',
  'influence',
  'cross-cutting',
];

/* ------------------------------------------------------------------
   LEVEL CERTIFICATION ROW.
   ------------------------------------------------------------------ */
function LevelRow({
  level,
  masteredIds,
}: {
  level: Level;
  masteredIds: ReadonlySet<string>;
}) {
  const readyIds = readySkillIdsOfLevel(level.id);
  const certified = isLevelCertified(level.id, masteredIds);
  const current = isLevelCurrent(level.id, masteredIds);
  const unlocked = isLevelUnlocked(level.id, masteredIds);
  const masteredHere = readyIds.filter((id) => masteredIds.has(id)).length;
  const frac = readyIds.length === 0 ? 0 : masteredHere / readyIds.length;

  const status = certified
    ? { cls: 'border-good-line bg-good-050 text-good', icon: <CheckIcon size={13} />, label: `Level ${padIndex(level.order)} certified` }
    : current
      ? { cls: 'border-accent-100 bg-accent-050 text-accent', icon: <CircleDotIcon size={13} />, label: 'In progress' }
      : unlocked
        ? { cls: 'border-line bg-panel-2 text-slate', icon: <ClockIcon size={13} />, label: 'Available' }
        : { cls: 'border-line bg-panel-2 text-mute', icon: <LockIcon size={13} />, label: 'Locked' };

  const testable = !certified && (unlocked || isNextLocked(level, masteredIds)) && canTestOut(level.id);

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-3 rounded-console-lg border p-[14px_16px]',
        certified ? 'border-good-line bg-good-050/40' : 'border-line bg-paper',
      ].join(' ')}
    >
      <ProgressRing
        value={frac}
        size={34}
        strokeWidth={3.4}
        colorClass={certified ? 'text-good' : 'text-accent'}
        animate
        className="flex-none"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="mono text-[10.5px] uppercase tracking-[0.12em] text-faint">
            Level {padIndex(level.order)}
          </span>
          <span className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            {level.label}
          </span>
        </div>
        <span className="mono mt-0.5 block text-[11px] text-faint">
          {readyIds.length === 0
            ? 'No ready skills yet'
            : `${padIndex(masteredHere)} / ${padIndex(readyIds.length)} skills mastered`}
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {testable && (
          <Link
            href={`/learn/testout/${level.id}`}
            className="mono inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <CapIcon size={12} />
            Test out
          </Link>
        )}
        <span
          className={`mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] ${status.cls}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>
    </div>
  );
}

/**
 * True when this level is the immediate next CORE level to unlock: locked now,
 * but the level just before it (by order) is certified. That is the one locked
 * level it is fair to test out of (skip-ahead for an experienced learner).
 */
function isNextLocked(level: Level, masteredIds: ReadonlySet<string>): boolean {
  if (isLevelUnlocked(level.id, masteredIds)) return false;
  if (level.branch !== 'core') return false;
  const prev = levels.find((l) => l.branch === 'core' && l.order === level.order - 1);
  if (!prev) return false;
  return isLevelCertified(prev.id, masteredIds);
}

/* ------------------------------------------------------------------
   COMPETENCY COVERAGE CELL.
   ------------------------------------------------------------------ */
function CoverageCell({
  competency,
  stat,
}: {
  competency: Competency;
  stat: CoverageStat;
}) {
  const label = COMPETENCIES[competency].label;
  const full = stat.total > 0 && stat.mastered === stat.total;
  const pct = Math.round(stat.fraction * 100);

  return (
    <div className="flex items-center gap-3 rounded-console border border-line bg-paper p-3">
      <ProgressRing
        value={stat.fraction}
        size={30}
        strokeWidth={3.2}
        colorClass={full ? 'text-good' : 'text-accent'}
        animate
        className="flex-none"
      />
      <div className="min-w-0 flex-auto">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">
            {label}
          </span>
          {full && <CheckIcon size={13} className="flex-none text-good" />}
        </div>
        <span className="mono mt-0.5 block text-[10.5px] tracking-[0.04em] text-faint">
          {stat.total === 0 ? 'No ready skills' : `${stat.mastered} / ${stat.total} mastered`}
        </span>
      </div>
      <span className="mono tnum flex-none text-[11px] text-slate">
        {stat.total === 0 ? '-' : `${pct}%`}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------
   DIMENSION GROUP: a dimension header (with its own coverage) over the
   competency cells that roll into it.
   ------------------------------------------------------------------ */
function DimensionGroup({
  group,
  coverage,
  dimStat,
}: {
  group: CompetencyGroup;
  coverage: Record<Competency, CoverageStat>;
  dimStat: CoverageStat;
}) {
  const meta = DIMENSIONS[group];
  const members = (Object.keys(COMPETENCIES) as Competency[]).filter(
    (c) => COMPETENCIES[c].group === group,
  );
  const full = dimStat.total > 0 && dimStat.mastered === dimStat.total;

  return (
    <div>
      <div className="flex items-center gap-2.5 border-b border-line pb-2">
        <span
          className={[
            'mono inline-flex items-center gap-1.5 rounded-console-sm border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em]',
            full ? 'border-good-line bg-good-050 text-good' : 'border-line bg-panel-2 text-ink-2',
          ].join(' ')}
        >
          {full && <CheckIcon size={11} />}
          {meta.label}
        </span>
        <span className="mono text-[11px] text-faint">
          {dimStat.total === 0
            ? 'No ready skills'
            : `${dimStat.mastered} / ${dimStat.total} mastered`}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5 max-[560px]:grid-cols-1">
        {members.map((c) => (
          <CoverageCell key={c} competency={c} stat={coverage[c]} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   THE PROGRESS / PROFILE VIEW.
   ------------------------------------------------------------------ */
export function ProgressView() {
  const progress = useLearnStore((s) => s.progress);
  const streak = useLearnStore((s) => s.streak);
  const hasHydrated = useLearnStore((s) => s.hasHydrated);

  // Derive from persisted progress, SSR-safe: before hydration render the seed
  // (server + first client paint agree), exactly as the Practice Map does.
  const masteredIds = useMemo(
    () =>
      new Set(
        Object.entries(progress)
          .filter(([, p]) => p.mastery >= 1)
          .map(([id]) => id),
      ),
    [progress],
  );

  const coverage = useMemo(() => allCompetencyCoverage(masteredIds), [masteredIds]);

  const masteredCount = masteredIds.size;
  const overall = TOTAL_SKILLS > 0 ? masteredCount / TOTAL_SKILLS : 0;

  const certifiedCount = levels.filter((l) => isLevelCertified(l.id, masteredIds)).length;
  // The learner's current rung: the highest certified core level's label, or the
  // entry rung if nothing is certified yet.
  const currentRung = useMemo(() => {
    const certifiedCore = levels
      .filter((l) => l.branch === 'core' && isLevelCertified(l.id, masteredIds))
      .sort((a, b) => b.order - a.order)[0];
    return certifiedCore?.label ?? 'Not yet certified';
  }, [masteredIds]);

  return (
    <>
      <Topbar
        right={
          <Link
            href="/"
            className="mono inline-flex items-center gap-1.5 rounded-console border border-line bg-paper px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            Map
            <ArrowRightIcon size={13} />
          </Link>
        }
      />

      {/* status bar: streak + mastery + current rung */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-3.5 px-6 py-[18px]">
          <div
            className="inline-flex items-center gap-2.5 rounded-console border border-line bg-paper px-[13px] py-2"
            title="Flexible consistency streak: keep the habit, no guilt"
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

          <div
            className="inline-flex items-center gap-2.5 rounded-console border border-line bg-paper px-[13px] py-2"
            title="Mastery: demonstrated competence across the playable curriculum"
          >
            <ProgressRing value={overall} size={34} strokeWidth={3.4} animate className="flex-none" />
            <span>
              <span className="mono block text-[10px] uppercase leading-tight tracking-[0.14em] text-mute">
                Mastery
              </span>
              <span className="mono tnum block text-[15px] font-semibold leading-tight text-ink">
                {padIndex(masteredCount)} <span className="font-medium text-faint">/ {padIndex(TOTAL_SKILLS)}</span>
              </span>
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2.5 rounded-console border border-line bg-paper px-[13px] py-2"
            title="Your current certified rung on the ladder"
          >
            <CapIcon size={17} className="flex-none text-accent" />
            <span>
              <span className="mono block text-[10px] uppercase leading-tight tracking-[0.14em] text-mute">
                Current level
              </span>
              <span className="block text-[14px] font-semibold leading-tight text-ink">
                {hasHydrated ? currentRung : 'Not yet certified'}
              </span>
            </span>
          </div>
        </div>
      </div>

      <main className="flex-auto">
        <div className="mx-auto max-w-[1080px] px-6 pb-16">
          {/* heading */}
          <header className="pb-2 pt-9 max-[560px]:pt-[26px]">
            <p className="eyebrow">Profile · your standing</p>
            <h1 className="mt-2.5 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] max-[560px]:text-[25px]">
              Progress
            </h1>
            <p className="mt-2 max-w-[60ch] text-[15px] text-slate">
              What level you are, and where you are strong or thin. Certification is
              demonstrated competence, not lessons clicked: a level certifies once you
              have mastered every ready skill in it.
            </p>
          </header>

          {/* Entry point to the readiness report: the shareable record that
              aggregates scored interviews + graded artifacts, with the work
              samples attached. A calm link card, not a status metric. */}
          <Link
            href="/report"
            className="mt-5 flex flex-wrap items-center gap-3 rounded-console-lg border border-line bg-paper p-[14px_16px] no-underline transition-[border-color] duration-150 hover:border-faint"
          >
            <span className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-panel text-slate">
              <FileIcon size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-ink">
                Readiness report
              </span>
              <span className="mono block text-[11px] text-faint">
                Your scored interviews and graded artifacts, ready to share or print
              </span>
            </span>
            <ArrowRightIcon size={15} className="ml-auto flex-none text-faint" />
          </Link>

          {/* LEVEL CERTIFICATIONS */}
          <section className="mt-8">
            <div className="flex flex-wrap items-center gap-3 border-b-2 border-line pb-3">
              <span className="mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-console-sm border border-line bg-panel-2 px-[10px] py-1 text-[11px] uppercase tracking-[0.14em] text-mute">
                <CapIcon size={13} />
                Levels
              </span>
              <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">
                Certifications
              </span>
              <span className="mono ml-auto whitespace-nowrap text-[12px] text-faint">
                {padIndex(certifiedCount)} / {padIndex(levels.length)} certified
              </span>
            </div>
            <div className="mt-4 grid gap-2.5">
              {levels.map((level) => (
                <LevelRow key={level.id} level={level} masteredIds={masteredIds} />
              ))}
            </div>
          </section>

          {/* COMPETENCY MATRIX */}
          <section className="mt-11">
            <div className="flex flex-wrap items-center gap-3 border-b-2 border-line pb-3">
              <span className="mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-console-sm border border-line bg-panel-2 px-[10px] py-1 text-[11px] uppercase tracking-[0.14em] text-mute">
                Competencies
              </span>
              <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">
                The 12-competency matrix
              </span>
            </div>
            <p className="mt-3 max-w-[64ch] text-[14px] text-slate">
              Twelve competencies across four dimensions, plus the cross-cutting
              literacies. Each ring is the share of that competency&apos;s ready skills
              you have mastered: your strengths and your gaps at a glance.
            </p>

            <div className="mt-6 grid gap-7">
              {DIMENSION_ORDER.map((group) => (
                <DimensionGroup
                  key={group}
                  group={group}
                  coverage={coverage}
                  dimStat={dimensionCoverage(group, masteredIds)}
                />
              ))}
            </div>
          </section>

          <SimEvidenceBand />
        </div>
      </main>
    </>
  );
}
