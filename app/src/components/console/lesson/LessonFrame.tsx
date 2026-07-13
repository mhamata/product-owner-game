'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import type { Skill } from '@/curriculum/types';
import { getNextSkill, getUnitForSkill } from '@/curriculum/data';
import { useLearnStore, type SkillProgress } from '@/store/learnStore';
import { deriveBlockSummary, type BlockTally } from '@/lib/blockSummary';
import { emitExerciseEvent } from '@/lib/telemetry/exerciseEvents';
import { Topbar } from '../Topbar';
import { BlockSummaryCard } from './BlockSummaryCard';
import { CheckIcon, ChevronRightIcon, InfoIcon, XIcon } from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/** Phase of the shared drill loop. */
export type LessonPhase = 'answer' | 'checked' | 'complete';

/** What a drill body reports back when the learner submits. */
export interface DrillResult {
  /** Did they get it (fully) right? Drives the green/red treatment. */
  correct: boolean;
  /**
   * Optional 0-1 partial score for the overlay/store. Defaults to 1 when
   * `correct`, else 0. The loop always reveals the answer and awards mastery on
   * continue (matching the Value vs Effort exemplar); this is kept for a future
   * phase that scales mastery by first-try accuracy.
   */
  score?: number;
  /**
   * Honest correct/total tally for THIS attempt, e.g. `{correct: 3, total: 4}`.
   * Additive (W4-I): every deterministic drill body already computes this from
   * its own `gradeX` call, so it is threaded through to the block-summary card
   * rather than re-derived (or approximated) from `correct`/`score` alone.
   */
  tally: BlockTally;
  /** Headline shown in the feedback bar, e.g. "Correct!" / "Not quite". */
  headline?: string;
  /** The plain-language explanation paragraph (always shown when checked). */
  explanation: ReactNode;
  /** Optional extra detail revealed by the "Explain my answer" toggle. */
  detail?: ReactNode;
}

interface LessonFrameProps {
  skill: Skill;
  /** Short scenario tag shown next to the unit chip, e.g. "Scenario · SaaS". */
  scenarioTag: string;
  /** The lesson question/heading (may include emphasised spans). */
  heading: ReactNode;
  /**
   * The drill interaction. `phase` lets the body lock its controls + reveal
   * correctness once checked.
   */
  children: (phase: LessonPhase) => ReactNode;
  /** CHECK stays disabled until the body has a gradeable answer. */
  canCheck: boolean;
  /** Grade the current answer. Called once when CHECK is pressed. */
  onCheck: () => DrillResult;
}

/**
 * Reusable deterministic-drill card-stack chrome (W4-I restyle of the
 * original Console `LessonFrame`, `--px-*`-tokened per praxis-learn-mockup.html
 * — see globals.css's "SCOPE DECISION" comment on `--px-*` being the opt-in
 * dark-capable system; this is the drill loop's turn to opt in). Every
 * consumer of this file is one of the four deterministic drill bodies
 * (ScoreRank/Classification/Sizing/Sequencing) — AI-graded free-text drills
 * (`FreeTextGradeLesson`) have their own independent chrome and are
 * untouched by this restyle.
 *
 *   answer → checked → complete
 *
 *  - answer:   the body's interaction is live; CHECK is disabled until canCheck.
 *  - checked:  the body locks + reveals correctness; a slide-up feedback bar
 *              shows Correct!/Not quite (icon + label + explanation; semantic
 *              colour ALWAYS paired with icon and text); CHECK morphs to
 *              CONTINUE, coloured by result.
 *  - complete: a BLOCK SUMMARY card (honest tally, real strength delta, a
 *              real "1 block closer" unlock line when one was actually
 *              earned) writes mastery to the learn store and returns to the
 *              path.
 *
 * The frame owns the chrome, the dock, focus/keyboard behaviour, and the store
 * write; drills own only their interaction and grading.
 */
export function LessonFrame({
  skill,
  scenarioTag,
  heading,
  children,
  canCheck,
  onCheck,
}: LessonFrameProps) {
  const router = useRouter();
  const recordResult = useLearnStore((s) => s.recordResult);
  const streak = useLearnStore((s) => s.streak);
  const afterProgress = useLearnStore((s) => s.progress[skill.id]);

  const [phase, setPhase] = useState<LessonPhase>('answer');
  const [result, setResult] = useState<DrillResult | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const [beforeProgress, setBeforeProgress] = useState<SkillProgress | undefined>(undefined);

  const unit = useMemo(() => getUnitForSkill(skill.id), [skill.id]);
  const nextSkill = useMemo(() => getNextSkill(skill.id), [skill.id]);

  // Position within the unit, for the "0X / 0Y" readout in the progress rail.
  const stepInfo = useMemo(() => {
    if (!unit) return { index: 1, total: 1 };
    const idx = unit.skills.findIndex((s) => s.id === skill.id);
    return { index: idx === -1 ? 1 : idx + 1, total: unit.skills.length };
  }, [unit, skill.id]);

  const isCorrect = result?.correct ?? false;
  const progressPct = phase === 'answer' ? 40 : phase === 'checked' ? 60 : 100;

  function handleCheck() {
    if (!canCheck) return;
    setResult(onCheck());
    setPhase('checked');
  }

  function handleContinue() {
    if (!result) return;
    // Snapshot progress BEFORE recordResult mutates it, so the block summary
    // can show a real before -> after strength delta (or honestly show none).
    const before = useLearnStore.getState().progress[skill.id];
    setBeforeProgress(before);
    // Mirror the exemplar: the answer is revealed either way, so completing the
    // loop awards competence up to this attempt's real score.
    const normalizedScore =
      result.score ?? (result.correct ? 1 : result.tally.correct / Math.max(1, result.tally.total));
    recordResult(skill.id, normalizedScore);
    // Shared learner model v0: fire-and-forget, silent no-op when signed out.
    emitExerciseEvent({
      kind: 'drill',
      skillId: skill.id,
      competency: skill.competency,
      score: normalizedScore,
      payload: { skillId: skill.id, correct: result.correct, tally: result.tally },
    });
    setPhase('complete');
  }

  const goHome = () => router.push('/');

  const summary = useMemo(() => {
    if (phase !== 'complete' || !result || !afterProgress) return null;
    return deriveBlockSummary({
      skill,
      tally: result.tally,
      before: beforeProgress,
      after: afterProgress,
    });
  }, [phase, result, afterProgress, beforeProgress, skill]);

  return (
    <>
      {/*
        The close button lives INSIDE the shared Topbar, which stays on the
        Console's light `--color-*` scale everywhere in the app (see
        Topbar.tsx — it never reads `--px-*`; StandupView.tsx set this same
        precedent for a `--px-*`-opted-in body under an unchanged light nav
        bar). Only the drill body below opts into `--px-*`.
      */}
      <Topbar
        right={
          <button
            type="button"
            onClick={goHome}
            aria-label="Close drill and return to the path"
            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <XIcon size={16} />
          </button>
        }
      />

      <main className="flex-auto bg-[var(--px-ground)]">
        <div className="mx-auto max-w-[720px] px-6">
          {/* slim progress rail */}
          <div className="sticky top-[49px] z-10 flex items-center gap-4 bg-[var(--px-ground)] py-[18px] pb-4 max-[560px]:top-[45px]">
            <div className="h-[7px] flex-auto overflow-hidden rounded-full bg-[var(--px-line)]">
              <div
                className="h-full rounded-full bg-[var(--px-accent)] transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mono tnum whitespace-nowrap text-[11px] text-[var(--px-dim)]">
              {padIndex(stepInfo.index)} / {padIndex(stepInfo.total)}
            </span>
          </div>

          {/* body */}
          <div className="pb-[220px] pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono rounded-[8px] border border-[var(--px-accent)] bg-[color-mix(in_srgb,var(--px-accent)_10%,transparent)] px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-[var(--px-accent)]">
                {unit ? `Unit ${padIndex(unit.number)}` : 'Skill'} · {skill.title}
              </span>
              <span className="mono text-[11px] uppercase tracking-[0.08em] text-[var(--px-dimmer)]">
                {scenarioTag}
              </span>
            </div>

            <h2 className="mt-4 text-[23px] font-bold leading-[1.3] tracking-[-0.015em] text-[var(--px-ink)] max-[560px]:text-[20px]">
              {heading}
            </h2>

            {children(phase)}
          </div>
        </div>

        {/* fixed dock: feedback bar + primary button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[720px] px-6 pb-5">
            {phase === 'checked' && result && (
              <div
                role="status"
                aria-live="polite"
                className={[
                  'pointer-events-auto mb-3 rounded-[14px] border p-[16px_18px] shadow-[0_10px_32px_rgba(0,0,0,0.18)] transition-[transform,opacity] duration-300',
                  isCorrect
                    ? 'border-[var(--px-good)] bg-[color-mix(in_srgb,var(--px-good)_10%,transparent)]'
                    : 'border-[var(--px-crit)] bg-[color-mix(in_srgb,var(--px-crit)_10%,transparent)]',
                ].join(' ')}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={[
                      'inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[var(--px-on-accent)]',
                      isCorrect ? 'bg-[var(--px-good)]' : 'bg-[var(--px-crit)]',
                    ].join(' ')}
                  >
                    {isCorrect ? <CheckIcon size={17} /> : <XIcon size={17} />}
                  </span>
                  <span
                    className={[
                      'mono text-[13px] font-semibold uppercase tracking-[0.06em]',
                      isCorrect ? 'text-[var(--px-good)]' : 'text-[var(--px-crit)]',
                    ].join(' ')}
                  >
                    {result.headline ?? (isCorrect ? 'Correct!' : 'Not quite')}
                  </span>
                </div>
                <div className="mt-2.5 text-[14px] leading-[1.6] text-[var(--px-body)]">
                  {result.explanation}
                </div>
                {result.detail && (
                  <>
                    <button
                      type="button"
                      aria-expanded={explainOpen}
                      onClick={() => setExplainOpen((v) => !v)}
                      className="mono mt-2.5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[12px] text-[var(--px-accent)] underline underline-offset-2"
                    >
                      <InfoIcon size={13} />
                      Explain my answer
                    </button>
                    {explainOpen && (
                      <div className="mt-2.5 border-t border-dashed border-[var(--px-line)] pt-[11px] text-[13px] leading-[1.6] text-[var(--px-dim)]">
                        {result.detail}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {phase !== 'complete' && (
              <button
                type="button"
                disabled={phase === 'answer' && !canCheck}
                onClick={phase === 'answer' ? handleCheck : handleContinue}
                className={[
                  'mono pointer-events-auto inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px',
                  phase === 'answer' && !canCheck
                    ? 'cursor-not-allowed bg-[var(--px-line)] text-[var(--px-dimmer)] shadow-none'
                    : phase === 'checked'
                      ? isCorrect
                        ? 'bg-[var(--px-good)] text-[var(--px-on-accent)]'
                        : 'bg-[var(--px-crit)] text-white'
                      : 'bg-[var(--px-accent)] text-[var(--px-on-accent)]',
                ].join(' ')}
              >
                {phase === 'answer' ? (
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

      {phase === 'complete' && summary && (
        <BlockSummaryCard
          summary={summary}
          streak={streak}
          nextSkillTitle={nextSkill?.title ?? null}
          nextSkillIndex={nextSkill?.index ?? null}
          onContinue={goHome}
        />
      )}
    </>
  );
}
