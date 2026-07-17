'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  levels,
  tracks,
  getSkill,
  TOTAL_SKILLS,
  TOTAL_LADDER_SKILLS,
  isLevelCertified,
  isLevelCurrent,
} from '@/curriculum/data';
import { canTestOut } from '@/curriculum/placement';
import type { Level } from '@/curriculum/types';
import { useLearnStore, type SkillProgress } from '@/store/learnStore';
import { useIndustryStore } from '@/store/industryStore';
import { INDUSTRIES, DEFAULT_INDUSTRY, isIndustryId } from '@/curriculum/industries';
import { skillNodesForLevel, deriveSkillNode, levelMasteredCount } from '@/lib/skillTree';
import { Topbar } from './Topbar';
import { ProgressRing } from './ProgressRing';
import { ModalityIcons } from './skillMeta';
import { SkillTree } from './skills/SkillTree';
import { SkillNodeSheet } from './skills/SkillNodeSheet';
import { SIM_LADDER, pairedLevelLabel } from '@/scenarios/ladder';
import {
  ArrowRightIcon,
  BuildingIcon,
  CapIcon,
  CaretDownIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleDotIcon,
  ClockIcon,
  FlameIcon,
  FlaskIcon,
  LayersIcon,
  XIcon,
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
 * One LEVEL on the Practice Map: a labelled header (available / in progress /
 * certified), then its units, each a sub-header over a grid of skill cards.
 *
 * SELF-STUDY RULING (2026-07-16, Mike): every level renders fully expanded
 * from a cold start — there is no locked/collapsed state anymore. Mastery,
 * streaks, decay, and certification all survive as progress FEEDBACK, never
 * as keys.
 */
function LevelSection({
  level,
  masteredIds,
  progress,
  onSelectSkill,
}: {
  level: Level;
  masteredIds: ReadonlySet<string>;
  progress: Record<string, SkillProgress>;
  onSelectSkill: (skillId: string) => void;
}) {
  // W4-H: the tech-tree node list for this level — flattened across units in
  // curriculum order, per the mockup's level-grouped (not unit-grouped) tree
  // (praxis-learn-mockup.html's #scr-skills renders one flat <div class="tree">
  // per level). `decayFor` reads straight from the progress prop so this
  // derivation stays a thin call into the pure `@/lib/skillTree` module.
  const nodes = useMemo(
    () => skillNodesForLevel(level.id, masteredIds, (skillId) => progress[skillId]),
    [level.id, masteredIds, progress],
  );
  const masteredNodeCount = levelMasteredCount(nodes);
  const certified = isLevelCertified(level.id, masteredIds);
  const current = isLevelCurrent(level.id, masteredIds);
  const branchNote = BRANCH_NOTE[level.branch];

  // Certify-early is offered for any not-yet-certified level (prove it instead
  // of grinding), as long as a placement challenge can actually be assembled
  // for it — some levels may simply never have enough authored check-questions
  // (see canTestOut / MIN_QUESTIONS in curriculum/placement.ts).
  const testable = !certified && canTestOut(level.id);

  const statusPill = certified
    ? { cls: 'border-good-line bg-good-050 text-good', icon: <CapIcon size={13} />, label: 'Certified' }
    : current
      ? { cls: 'border-accent-100 bg-accent-050 text-accent', icon: <CircleDotIcon size={13} />, label: 'In progress' }
      : { cls: 'border-line bg-panel-2 text-slate', icon: <ClockIcon size={13} />, label: 'Available' };

  return (
    <section className="mt-11 first:mt-6">
      {/* level header */}
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-line pb-3">
        <span
          className={[
            'mono whitespace-nowrap rounded-console-sm border px-[10px] py-1 text-[11px] uppercase tracking-[0.14em]',
            certified
              ? 'border-good-line bg-good-050 text-good'
              : current
                ? 'border-accent-100 bg-accent-050 text-accent'
                : 'border-line bg-panel-2 text-mute',
          ].join(' ')}
        >
          Level {padIndex(level.order)}
        </span>
        <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">
          {level.label}
        </span>
        {branchNote && (
          <span className="mono rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-faint">
            {branchNote}
          </span>
        )}
        <div className="mono ml-auto flex flex-wrap items-center gap-2">
          {testable && (
            <Link
              href={`/learn/testout/${level.id}`}
              aria-label={`Certify ${level.label}`}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
            >
              <CapIcon size={12} />
              Certify this level
            </Link>
          )}
          <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] ${statusPill.cls}`}
          >
            {statusPill.icon}
            {statusPill.label}
          </span>
        </div>
      </div>

      {/* level summary, with a "Level N certified" affordance once earned */}
      {certified && (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-good">
          <CapIcon size={15} className="flex-none" />
          <span className="font-semibold">Level {padIndex(level.order)} certified</span>
          <span className="text-slate">· every ready skill mastered</span>
        </div>
      )}
      <p className="mt-3 max-w-[64ch] text-[14px] text-slate">{level.summary}</p>

      <div className="mt-5">
        {/* W4-H: the tech tree — level-grouped node cards with a connector
            rail, per praxis-learn-mockup.html's Skills tab. Replaces the
            old per-unit skill-card grid; unit context is folded into each
            node's competency eyebrow in the detail sheet instead. Every level
            renders this fully expanded — see the self-study ruling above. */}
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <span className="mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            Tech tree
          </span>
          <span className="mono text-[11px] text-faint">
            {masteredNodeCount} / {nodes.length} mastered
          </span>
        </div>
        <SkillTree nodes={nodes} onSelectSkill={onSelectSkill} />
      </div>
    </section>
  );
}

const HINT_DISMISS_KEY = 'praxis-testout-hint-dismissed';

/**
 * First-run self-placement nudge: a subtle, dismissible one-liner pointing an
 * experienced PM at the certification flow so they can place themselves
 * instead of starting at skill one — a suggestion, never a requirement
 * (nothing is locked either way). Shown only before any progress exists;
 * dismissal is remembered (localStorage) so it never nags. SSR-safe: hidden
 * on the server + first paint, revealed after we read the dismiss flag, so
 * there is no hydration flash.
 */
function TestOutHint({ targetLevelId }: { targetLevelId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Defer the reveal to the next frame so the state update is not synchronous
    // within the effect (mirrors ProgressRing's mount pattern) and stays
    // SSR-safe: the server + first paint render nothing, then we read the flag.
    const id = requestAnimationFrame(() => {
      let dismissed = false;
      try {
        dismissed = localStorage.getItem(HINT_DISMISS_KEY) === '1';
      } catch {
        dismissed = false;
      }
      if (!dismissed) setShow(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(HINT_DISMISS_KEY, '1');
    } catch {
      /* best-effort: dismissal just won't persist if storage is unavailable */
    }
    setShow(false);
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2.5 rounded-console-lg border border-line bg-panel px-4 py-3">
      <CapIcon size={16} className="flex-none text-accent" />
      <p className="text-[13.5px] leading-[1.5] text-ink-2">
        New to product, or already experienced? You can{' '}
        <Link
          href={`/learn/testout/${targetLevelId}`}
          className="font-semibold text-accent underline underline-offset-2 hover:text-accent-700"
        >
          certify a level
        </Link>{' '}
        to place yourself — or just start anywhere, nothing here is locked.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss the certify tip"
        className="ml-auto inline-flex h-7 w-7 flex-none items-center justify-center rounded-console border border-line bg-paper text-faint transition-[border-color,color] duration-150 hover:border-faint hover:text-slate"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}

/**
 * The Console "Practice Map" home: topbar, a status bar (consistency streak +
 * mastery ring + home-industry chip), a curriculum header with an overall
 * progress meter, then the six career LEVELS rendered as labelled sections of
 * units → skill cards. Below the ladder sit the Decision Simulations ladder
 * and a specialization-tracks section (off-ladder depth). Self-study ruling
 * (2026-07-16): every level, every sim rung, every track renders fully open
 * from a cold start — nothing here is a gate.
 */
export function PracticeMap() {
  const progress = useLearnStore((s) => s.progress);
  const streak = useLearnStore((s) => s.streak);
  const hasHydrated = useLearnStore((s) => s.hasHydrated);

  // Home industry: persisted, SSR-safe. Before hydration we show the default
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

  // W4-H: the tech-tree node detail sheet. Tracks only the tapped skill id;
  // the node view-model is re-derived on each render straight from live
  // store state, so the sheet's strength bar / rusty flag never goes stale
  // while it's open (e.g. right after completing a 90-second refresh).
  const [openSkillId, setOpenSkillId] = useState<string | null>(null);
  const openNode = useMemo(() => {
    if (!openSkillId) return null;
    const skill = getSkill(openSkillId);
    if (!skill) return null;
    return deriveSkillNode(skill, masteredIds, progress[openSkillId]);
  }, [openSkillId, masteredIds, progress]);

  return (
    <>
      <Topbar />

      {/* status bar */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-3.5 px-6 py-[18px]">
          {/* consistency streak: habit, not guilt */}
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

          {/* mastery: demonstrated competence, not lesson count */}
          <div
            className="inline-flex items-center gap-2.5 rounded-console border border-line bg-paper px-[13px] py-2"
            title="Mastery: demonstrated competence across the playable curriculum"
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
                  judgment, not by clearing checkboxes.
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

            {/* first-run self-placement nudge (only before any progress) */}
            {hasHydrated && masteredCount === 0 && (
              <TestOutHint targetLevelId={levels[0].id} />
            )}
          </header>

          {/* the career ladder */}
          <div className="pt-7">
            {levels.map((level) => (
              <LevelSection
                key={level.id}
                level={level}
                masteredIds={masteredIds}
                progress={progress}
                onSelectSkill={setOpenSkillId}
              />
            ))}
          </div>

          <SkillNodeSheet node={openNode} onClose={() => setOpenSkillId(null)} />

          {/* Simulations: the open scenario ladder. First Sprint is the
              tutorial; every rung is open and freely replayable from a cold
              start (self-study ruling, 2026-07-16) — "paired with" a level is
              a display hint only, never a requirement. */}
          <section className="mt-11">
            <div className="flex items-center gap-3 border-b-2 border-line pb-3">
              <span className="mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-console-sm border border-line bg-panel-2 px-[10px] py-1 text-[11px] uppercase tracking-[0.14em] text-mute">
                <FlaskIcon size={13} />
                Simulator
              </span>
              <span className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">
                Decision Simulations
              </span>
              <span className="mono ml-auto inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] uppercase tracking-[0.1em] text-mute">
                {SIM_LADDER.length} rungs · all open
              </span>
            </div>
            <p className="mt-3 max-w-[64ch] text-[14px] text-slate">
              Run a full product cycle under pressure. Each rung retunes the same
              engine for a higher altitude. Every rung is open from the start —
              replay any of them as often as you like.
            </p>

            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3.5 max-[560px]:grid-cols-1">
              {SIM_LADDER.map((rung) => {
                const pairing = pairedLevelLabel(rung);
                return (
                  <Link
                    key={rung.scenarioId}
                    href={`/play/${rung.scenarioId}`}
                    className="group flex flex-col gap-2.5 rounded-console-lg border border-line bg-paper p-4 no-underline transition-[border-color,box-shadow] hover:border-faint hover:shadow-console-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                        {rung.title}
                      </span>
                      <span className="mono flex-none rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-mute">
                        {rung.altitude}
                      </span>
                    </div>
                    <p className="text-[12.5px] leading-snug text-slate">{rung.tagline}</p>
                    {pairing && (
                      <span className="mono text-[10.5px] uppercase tracking-[0.08em] text-faint">
                        Paired with {pairing}
                      </span>
                    )}
                    <span className="mono mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
                      {pairing === null ? 'Start here' : 'Play'}
                      <ArrowRightIcon size={12} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Specialization tracks: off-ladder depth. Always open (self-study
              ruling, 2026-07-16) — each card links straight into its skills. */}
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
                <LayersIcon size={13} />
                Open
              </span>
            </div>
            <p className="mt-3 max-w-[64ch] text-[14px] text-slate">
              Go deep on a domain, any time — these run beside the ladder, not on
              it.
            </p>

            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3.5 max-[560px]:grid-cols-1">
              {tracks.map((track) => {
                const modalities = Array.from(
                  new Set(track.skills.flatMap((s) => s.modalities)),
                );

                // A live card whose skills each link straight into the lesson,
                // so a learner picks within the domain rather than being walked
                // across track boundaries by the linear "next" helper.
                return (
                  <div
                    key={track.id}
                    className="flex flex-col gap-2.5 rounded-console-lg border border-line bg-paper p-4"
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-faint">
                        {track.skills.length} skills
                      </span>
                      <ModalityIcons modalities={modalities} />
                    </div>
                    <div className="mt-1 flex flex-col gap-1.5">
                      {track.skills.map((s) => {
                        const mastered = masteredIds.has(s.id);
                        return (
                          <Link
                            key={s.id}
                            href={`/learn/${s.id}`}
                            className="group flex items-center justify-between gap-2 rounded-console border border-line bg-panel px-2.5 py-1.5 no-underline transition-[border-color,background-color] hover:border-faint hover:bg-panel-2"
                          >
                            <span className="text-[13px] font-medium tracking-[-0.01em] text-ink">
                              {s.title}
                            </span>
                            {mastered ? (
                              <CheckIcon size={14} className="flex-none text-good" />
                            ) : (
                              <ChevronRightIcon
                                size={14}
                                className="flex-none text-faint transition-colors group-hover:text-accent"
                              />
                            )}
                          </Link>
                        );
                      })}
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
