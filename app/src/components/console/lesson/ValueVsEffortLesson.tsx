'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Skill } from '@/curriculum/types';
import { getNextSkill, TOTAL_SKILLS } from '@/curriculum/data';
import { DEFAULT_INDUSTRY, type IndustryId } from '@/curriculum/industries';
import { resolveValueVsEffortDrill } from '@/curriculum/drills';
import { useLearnStore } from '@/store/learnStore';
import { Topbar } from '../Topbar';
import { CompletionOverlay } from './CompletionOverlay';
import {
  CheckIcon,
  ChevronRightIcon,
  InfoIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  XIcon,
} from '../Icon';

type Phase = 'select' | 'checked' | 'complete';

function LevelCell({ level }: { level: 'high' | 'low' }) {
  // Color is always paired with an icon + text label (never color alone).
  if (level === 'high') {
    return (
      <span className="mono inline-flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-good">
        <TriangleUpIcon size={13} />
        High
      </span>
    );
  }
  return (
    <span className="mono inline-flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-mute">
      <TriangleDownIcon size={13} />
      Low
    </span>
  );
}

/**
 * The fully working Console drill loop for "Value vs Effort".
 *
 * State machine: select → checked → complete.
 *  - select:  pick one option; CHECK is disabled until a selection exists.
 *  - checked: options lock + reveal correctness; a slide-up feedback bar shows
 *             Correct!/Not quite (icon + label + explanation, A always revealed);
 *             the primary button morphs CHECK → CONTINUE colored by result.
 *  - complete: a restrained "Skill mastered" overlay; CONTINUE writes mastery
 *              to the learn store and returns home.
 *
 * Mastery is awarded on completing the loop. This phase always grants full
 * competence once the learner continues (the answer is revealed either way);
 * a later phase can scale the score by first-try correctness so the map can
 * resurface weak skills for reinforcement.
 */
export function ValueVsEffortLesson({
  skill,
  industry = DEFAULT_INDUSTRY,
}: {
  skill: Skill;
  /** Home industry to theme the drill copy with. Defaults to SaaS. */
  industry?: IndustryId;
}) {
  const router = useRouter();
  const recordResult = useLearnStore((s) => s.recordResult);
  const streak = useLearnStore((s) => s.streak);
  const masteredCountNow = useLearnStore((s) => s.masteredCount);

  // Resolve the drill for the active industry: the value/effort answer key is
  // shared, only the feature names change, so the correct quick win is the same.
  const drill = useMemo(() => resolveValueVsEffortDrill(industry), [industry]);
  const { rows, options, correctOptionId, scenario } = drill;

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);

  const isCorrect = selectedId === correctOptionId;
  const nextSkill = useMemo(() => getNextSkill(skill.id), [skill.id]);

  // Snapshot the post-completion mastered count for the overlay. If this skill
  // wasn't already mastered, completing it adds one.
  const alreadyMastered = useLearnStore((s) => s.isMastered(skill.id));
  const completedCount = masteredCountNow() + (alreadyMastered ? 0 : 1);

  const progressPct = phase === 'select' ? 40 : phase === 'checked' ? 60 : 100;

  function handleSelect(id: string) {
    if (phase !== 'select') return;
    setSelectedId(id);
  }

  function handleCheck() {
    if (!selectedId) return;
    setPhase('checked');
  }

  function handleContinue() {
    // The loop always reveals the correct answer and lets the learner reach
    // mastery this phase, so completing it awards full competence regardless of
    // the first pick. (A later phase can scale this by first-try correctness.)
    recordResult(skill.id, 1);
    setPhase('complete');
  }

  function handleClose() {
    router.push('/');
  }

  function handleFinish() {
    router.push('/');
  }

  return (
    <>
      <Topbar
        right={
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close drill and return to the path"
            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <XIcon size={16} />
          </button>
        }
      />

      <main className="flex-auto">
        <div className="mx-auto max-w-[720px] px-6">
          {/* slim progress */}
          <div className="sticky top-[49px] z-10 flex items-center gap-4 bg-background py-[18px] pb-4 max-[560px]:top-[45px]">
            <div className="h-[7px] flex-auto overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mono tnum whitespace-nowrap text-[11px] text-slate">
              02 / 05
            </span>
          </div>

          {/* body */}
          <div className="pb-[200px] pt-2">
            <div className="flex items-center gap-2">
              <span className="mono rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                Unit 02 · {skill.title}
              </span>
              <span className="eyebrow">Scenario · {scenario}</span>
            </div>

            <h2 className="mt-4 text-[23px] font-bold leading-[1.3] tracking-[-0.015em] text-ink max-[560px]:text-[20px]">
              Your team can ship one thing this sprint. Which is the best{' '}
              <b className="font-bold text-accent">quick win</b>?
            </h2>

            {/* decision table */}
            <div className="mt-[22px] overflow-hidden rounded-console-lg border border-line bg-paper">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Feature', 'Value', 'Effort'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="mono border-b border-line bg-panel px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.12em] text-mute"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.tag}>
                      <td
                        className={[
                          'px-4 py-[13px] align-middle text-[14px] font-semibold text-ink max-[560px]:px-3',
                          i < rows.length - 1 ? 'border-b border-line-2' : '',
                        ].join(' ')}
                      >
                        <span className="mono mr-2.5 text-[11px] text-faint max-[560px]:mr-0 max-[560px]:block max-[560px]:mb-0.5">
                          {row.tag}
                        </span>
                        {row.feature}
                      </td>
                      <td
                        className={[
                          'px-4 py-[13px] align-middle max-[560px]:px-3',
                          i < rows.length - 1 ? 'border-b border-line-2' : '',
                        ].join(' ')}
                      >
                        <LevelCell level={row.value} />
                      </td>
                      <td
                        className={[
                          'px-4 py-[13px] align-middle max-[560px]:px-3',
                          i < rows.length - 1 ? 'border-b border-line-2' : '',
                        ].join(' ')}
                      >
                        <LevelCell level={row.effort} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* options */}
            <div
              role="group"
              aria-label="Choose the best quick win"
              className="mt-[22px] grid gap-2.5"
            >
              {options.map((opt) => {
                const pressed = selectedId === opt.id;
                const locked = phase !== 'select';
                const revealCorrect = locked && opt.id === correctOptionId;
                const revealWrong =
                  locked && pressed && opt.id !== correctOptionId;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={pressed}
                    disabled={locked}
                    onClick={() => handleSelect(opt.id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-console border px-[15px] py-3.5 text-left transition-[border-color,background,box-shadow,transform] duration-150 active:translate-y-px disabled:cursor-default',
                      revealCorrect
                        ? 'border-good bg-good-050 shadow-[0_0_0_1px_var(--color-good)_inset]'
                        : revealWrong
                          ? 'border-bad bg-bad-050 shadow-[0_0_0_1px_var(--color-bad)_inset]'
                          : pressed
                            ? 'border-accent bg-accent-050 shadow-[0_0_0_1px_var(--color-accent)_inset]'
                            : 'border-line bg-paper hover:border-faint',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'mono inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-console-sm border text-[12px] font-semibold transition-[inherit]',
                        revealCorrect
                          ? 'border-good bg-good text-white'
                          : revealWrong
                            ? 'border-bad bg-bad text-white'
                            : pressed
                              ? 'border-accent bg-accent text-white'
                              : 'border-line bg-panel text-slate',
                      ].join(' ')}
                    >
                      {opt.keyLabel}
                    </span>
                    <span className="text-[14.5px] font-medium text-ink">
                      {opt.label}
                    </span>
                    <span
                      className={[
                        'ml-auto flex-none transition-opacity duration-150',
                        revealCorrect
                          ? 'text-good opacity-100'
                          : revealWrong
                            ? 'text-bad opacity-100'
                            : pressed
                              ? 'text-accent opacity-100'
                              : 'opacity-0',
                      ].join(' ')}
                    >
                      <CheckIcon size={18} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* fixed dock: feedback bar + primary button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[720px] px-6 pb-5">
            {/* feedback bar */}
            {phase === 'checked' && (
              <div
                role="status"
                aria-live="polite"
                className={[
                  'pointer-events-auto mb-3 rounded-console-lg border p-[16px_18px] shadow-console-lg transition-[transform,opacity] duration-300',
                  isCorrect
                    ? 'border-good-line bg-good-050'
                    : 'border-bad-line bg-bad-050',
                ].join(' ')}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={[
                      'inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-white',
                      isCorrect ? 'bg-good' : 'bg-bad',
                    ].join(' ')}
                  >
                    {isCorrect ? <CheckIcon size={17} /> : <XIcon size={17} />}
                  </span>
                  <span
                    className={[
                      'mono text-[13px] font-semibold uppercase tracking-[0.06em]',
                      isCorrect ? 'text-good' : 'text-bad',
                    ].join(' ')}
                  >
                    {isCorrect ? 'Correct!' : 'Not quite'}
                  </span>
                </div>
                <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-2">
                  A quick win is <b className="font-semibold text-ink">HIGH value, LOW effort</b>{' '}
                  — Feature A. (B is a high-value &ldquo;big bet&rdquo;; C is
                  &ldquo;maybe later.&rdquo;)
                </p>
                <button
                  type="button"
                  aria-expanded={explainOpen}
                  onClick={() => setExplainOpen((v) => !v)}
                  className="mono mt-2.5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[12px] text-accent underline underline-offset-2 hover:text-accent-700"
                >
                  <InfoIcon size={13} />
                  Explain my answer
                </button>
                {explainOpen && (
                  <div className="mt-2.5 border-t border-dashed border-line pt-[11px] text-[13px] leading-[1.6] text-slate">
                    <p className="mb-1.5">
                      <span className="mono text-[11px] tracking-[0.05em] text-mute">
                        VALUE AXIS
                      </span>{' '}
                      — how much it moves activation, retention, or revenue.
                    </p>
                    <p className="mb-1.5">
                      <span className="mono text-[11px] tracking-[0.05em] text-mute">
                        EFFORT AXIS
                      </span>{' '}
                      — engineering + design cost to ship it.
                    </p>
                    <p>
                      <b className="font-semibold text-ink">Quick wins</b> sit
                      top-left: maximum value for minimum effort. Ship them first
                      to build momentum and earn the right to attempt the big bets.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* primary button: CHECK -> CONTINUE */}
            {phase !== 'complete' && (
              <button
                type="button"
                disabled={phase === 'select' && !selectedId}
                onClick={phase === 'select' ? handleCheck : handleContinue}
                className={[
                  'mono pointer-events-auto inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px',
                  phase === 'select' && !selectedId
                    ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none'
                    : phase === 'checked'
                      ? isCorrect
                        ? 'bg-good text-white hover:bg-good-700'
                        : 'bg-bad text-white hover:bg-bad-700'
                      : 'bg-accent text-white hover:bg-accent-700',
                ].join(' ')}
              >
                {phase === 'select' ? (
                  'Check'
                ) : (
                  <>
                    Continue
                    <ChevronRightIcon size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {phase === 'complete' && (
        <CompletionOverlay
          skillTitle={skill.title}
          masteredCount={completedCount}
          totalSkills={TOTAL_SKILLS}
          streak={streak}
          nextSkillTitle={nextSkill?.title ?? null}
          nextSkillIndex={nextSkill?.index ?? null}
          onContinue={handleFinish}
        />
      )}
    </>
  );
}
