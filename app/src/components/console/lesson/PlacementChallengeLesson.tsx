'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PLACEMENT_PASS_RATIO, type PlacementChallenge } from '@/curriculum/placement';
import { isLevelUnlocked, levels } from '@/curriculum/data';
import { INDUSTRIES, INDUSTRY_NOUNS, type IndustryId } from '@/curriculum/industries';
import {
  type IndustryContext,
  type ResolvedQuestion,
  isFillCorrect,
  resolveQuestion,
} from '@/curriculum/lessons/types';
import { useLearnStore } from '@/store/learnStore';
import { Topbar } from '../Topbar';
import { CheckQuestionCard } from './CheckQuestionCard';
import { ProgressRing } from '../ProgressRing';
import {
  ArrowRightIcon,
  CapIcon,
  CheckIcon,
  ChevronRightIcon,
  XIcon,
} from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');
const PASS_PCT = Math.round(PLACEMENT_PASS_RATIO * 100);

/** Build the small industry context the questions resolve against. */
function industryContext(id: IndustryId): IndustryContext {
  const label = INDUSTRIES.find((i) => i.id === id)?.label ?? id;
  const nouns = INDUSTRY_NOUNS[id];
  return { id, label, product: nouns.product, user: nouns.user };
}

/**
 * The flow has three visible phases:
 *  - intro:  what this is, the honesty contract, and the pass bar. One CTA begins.
 *  - answer: all questions at once; GRADE stays disabled until each is answered.
 *  - result: pass or fail. A PASS records the level's skills mastered and offers
 *            a return to the map (now certified, next level unlocked). A FAIL
 *            records nothing, says so plainly, and routes the learner to learn
 *            the level normally.
 */
type Phase = 'intro' | 'answer' | 'result';

/**
 * ADAPTIVE TEST-OUT: a learner demonstrates a whole level at once.
 *
 * It reuses the lesson chrome (Topbar, progress rail, the shared CheckQuestionCard,
 * the fixed dock) rather than inventing a parallel styling, and grades with the
 * exact predicate the concept-lesson check uses. Passing (>= 80 percent) is
 * demonstrated competence, so it records the level's ready skills as mastered via
 * learnStore, which certifies the level and unlocks the next. A fail records
 * nothing.
 */
export function PlacementChallengeLesson({
  challenge,
  industry,
}: {
  challenge: PlacementChallenge;
  industry: IndustryId;
}) {
  const router = useRouter();
  const recordPlacementPass = useLearnStore((s) => s.recordPlacementPass);

  const [phase, setPhase] = useState<Phase>('intro');
  // answers: question uid -> chosen option id (choice) or typed string (fill).
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Latch the pass/fail outcome and the recording exactly once, when graded.
  const [outcome, setOutcome] = useState<{ correct: number; passed: boolean } | null>(null);

  const ctx = useMemo(() => industryContext(industry), [industry]);

  // Resolve each question's flavoured fields once, keyed by its composite uid so
  // grading and rendering both speak plain strings.
  const resolved = useMemo<{ uid: string; skillTitle: string; q: ResolvedQuestion }[]>(
    () =>
      challenge.questions.map((pq) => ({
        uid: pq.uid,
        skillTitle: pq.skillTitle,
        q: resolveQuestion(pq.question, ctx),
      })),
    [challenge.questions, ctx],
  );

  const total = resolved.length;

  const isCorrect = (item: { uid: string; q: ResolvedQuestion }): boolean => {
    const a = answers[item.uid];
    if (a == null) return false;
    return item.q.kind === 'choice' ? a === item.q.correctId : isFillCorrect(a, item.q.accept);
  };
  const everyAnswered = resolved.every((item) => {
    const a = answers[item.uid];
    return item.q.kind === 'choice' ? Boolean(a) : Boolean(a && a.trim());
  });

  const locked = phase === 'result';
  const progressPct = phase === 'intro' ? 8 : phase === 'answer' ? 55 : 100;

  const setAnswer = (uid: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [uid]: value }));

  function grade() {
    if (!everyAnswered) return;
    const correct = resolved.filter(isCorrect).length;
    const passed = correct >= challenge.passMark;
    // HONEST RECORDING: only a pass writes mastery. A fail records nothing.
    if (passed) recordPlacementPass(challenge.coveredSkillIds);
    setOutcome({ correct, passed });
    setPhase('result');
    requestAnimationFrame(() => {
      document.getElementById('placement-result-top')?.scrollIntoView({ block: 'start' });
    });
  }

  function handlePrimary() {
    if (phase === 'intro') {
      setPhase('answer');
      requestAnimationFrame(() => {
        document.getElementById('placement-questions')?.scrollIntoView({ block: 'start' });
      });
      return;
    }
    if (phase === 'answer') grade();
  }

  const goHome = () => router.push('/');

  const primaryLabel = phase === 'intro' ? 'Begin challenge' : 'Grade challenge';
  const primaryDisabled = phase === 'answer' && !everyAnswered;

  return (
    <>
      <Topbar
        context="test-out"
        right={
          <button
            type="button"
            onClick={goHome}
            aria-label="Leave the test-out and return to the path"
            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <XIcon size={16} />
          </button>
        }
      />

      <main className="flex-auto">
        <div className="mx-auto max-w-[720px] px-6">
          {/* slim progress rail, identical chrome to the lesson loop */}
          <div className="sticky top-[49px] z-10 flex items-center gap-4 bg-background py-[18px] pb-4 max-[560px]:top-[45px]">
            <div className="h-[7px] flex-auto overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mono tnum whitespace-nowrap text-[11px] text-slate">
              {phase === 'intro'
                ? `${padIndex(total)} Q`
                : `${padIndex(total)} / ${padIndex(total)}`}
            </span>
          </div>

          <div className="pb-[220px] pt-2">
            {/* eyebrow + title */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                Test out · {challenge.levelLabel}
              </span>
              <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-line bg-panel-2 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-mute">
                <CapIcon size={12} />
                Placement challenge
              </span>
            </div>

            <h2 className="mt-4 text-[23px] font-bold leading-[1.3] tracking-[-0.015em] text-ink max-[560px]:text-[20px]">
              Prove {challenge.levelLabel} without the lessons
            </h2>

            {/* INTRO: the honesty contract + the bar. */}
            {phase === 'intro' && (
              <div className="mt-5 grid gap-4">
                <p className="text-[15px] leading-[1.6] text-ink-2">
                  Answer {total} questions drawn from this level. Score{' '}
                  <b className="font-semibold text-ink">{PASS_PCT}% or higher</b> and
                  every skill in {challenge.levelLabel} is marked mastered: the level
                  is certified and the next one unlocks. This is the same standard the
                  lessons hold you to, so passing is real demonstrated competence.
                </p>
                <div className="rounded-console-lg border border-line bg-panel p-[16px_18px]">
                  <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-faint">
                    How it scores
                  </div>
                  <ul className="mt-2 grid gap-2 text-[14px] leading-[1.55] text-ink-2">
                    <li className="flex gap-2.5">
                      <CheckIcon size={16} className="mt-0.5 flex-none text-good" />
                      <span>
                        <b className="font-semibold text-ink">Pass ({PASS_PCT}%+):</b> the
                        whole level is certified. No need to repeat the lessons.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <ArrowRightIcon size={16} className="mt-0.5 flex-none text-slate" />
                      <span>
                        <b className="font-semibold text-ink">Below the bar:</b> nothing
                        is recorded. You start the level and learn it the usual way.
                      </span>
                    </li>
                  </ul>
                </div>
                <p className="mono text-[11.5px] text-faint">
                  Need {challenge.passMark} of {total} correct to pass.
                </p>
              </div>
            )}

            {/* QUESTIONS */}
            {phase !== 'intro' && (
              <section id="placement-questions" className="mt-7 scroll-mt-[110px]">
                <div className="flex items-center gap-2">
                  <span className="mono rounded-console-sm border border-line bg-paper px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-ink-2">
                    Challenge
                  </span>
                  <span className="mono text-[11px] text-faint">
                    {locked ? 'Review your answers' : 'Answer all to grade'}
                  </span>
                </div>

                <div className="mt-4 grid gap-4">
                  {resolved.map((item, qi) => (
                    <div key={item.uid}>
                      <CheckQuestionCard
                        question={item.q}
                        index={qi}
                        total={total}
                        answer={answers[item.uid]}
                        locked={locked}
                        correct={locked && isCorrect(item)}
                        onAnswer={(v) => setAnswer(item.uid, v)}
                        showWhy={false}
                        groupId={item.uid}
                      />
                      <p className="mono mt-1.5 pl-1 text-[10px] uppercase tracking-[0.08em] text-faint">
                        From · {item.skillTitle}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* fixed dock: result bar (after grading) + primary button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[720px] px-6 pb-5">
            {phase === 'result' && outcome && (
              <div
                id="placement-result-top"
                role="status"
                aria-live="polite"
                className={[
                  'pointer-events-auto mb-3 rounded-console-lg border p-[14px_18px] shadow-console-lg transition-[transform,opacity] duration-300',
                  outcome.passed
                    ? 'border-good-line bg-good-050'
                    : 'border-bad-line bg-bad-050',
                ].join(' ')}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={[
                      'inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-white',
                      outcome.passed ? 'bg-good' : 'bg-bad',
                    ].join(' ')}
                  >
                    {outcome.passed ? <CheckIcon size={17} /> : <XIcon size={17} />}
                  </span>
                  <div>
                    <span
                      className={[
                        'mono text-[13px] font-semibold uppercase tracking-[0.06em]',
                        outcome.passed ? 'text-good' : 'text-bad',
                      ].join(' ')}
                    >
                      {outcome.passed
                        ? `Passed · ${outcome.correct} / ${total}`
                        : `${outcome.correct} / ${total} correct · not yet`}
                    </span>
                    <p className="mt-0.5 text-[13px] leading-[1.5] text-ink-2">
                      {outcome.passed
                        ? `${challenge.levelLabel} is certified. Every skill in it is now marked mastered.`
                        : `That is below the ${PASS_PCT}% bar, so nothing was recorded. Start the level and learn it the usual way.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {phase !== 'result' && (
              <button
                type="button"
                disabled={primaryDisabled}
                onClick={handlePrimary}
                className={[
                  'mono pointer-events-auto inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px',
                  primaryDisabled
                    ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none'
                    : 'bg-accent text-white hover:bg-accent-700',
                ].join(' ')}
              >
                {primaryLabel}
                {phase === 'intro' && <ChevronRightIcon size={16} />}
              </button>
            )}
          </div>
        </div>
      </main>

      {phase === 'result' && outcome && (
        <PlacementResultOverlay
          levelId={challenge.levelId}
          levelLabel={challenge.levelLabel}
          passed={outcome.passed}
          correct={outcome.correct}
          total={total}
          firstSkillId={challenge.coveredSkillIds[0] ?? null}
          onClose={goHome}
        />
      )}
    </>
  );
}

/**
 * Terminal overlay, mirroring the lesson CompletionOverlay's modal pattern (focus
 * trapped to one action, ESC + backdrop dismiss). A PASS celebrates certification
 * and routes home (the map shows the new "Certified" badge + unlocked next
 * level); a FAIL states plainly that nothing was recorded and offers to start
 * learning the level.
 */
function PlacementResultOverlay({
  levelId,
  levelLabel,
  passed,
  correct,
  total,
  firstSkillId,
  onClose,
}: {
  levelId: string;
  levelLabel: string;
  passed: boolean;
  correct: number;
  total: number;
  firstSkillId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const actionRef = useRef<HTMLButtonElement>(null);

  // The next level that just unlocked, for the pass message.
  const masteredIds = useLearnStore((s) => s.masteredIds);
  const nextLevelLabel = useMemo(() => {
    if (!passed) return null;
    const ids = masteredIds();
    const order = levels.find((l) => l.id === levelId)?.order ?? 0;
    const next = levels
      .filter((l) => l.order > order && l.branch === 'core')
      .sort((a, b) => a.order - b.order)
      .find((l) => isLevelUnlocked(l.id, ids));
    return next?.label ?? null;
  }, [passed, levelId, masteredIds]);

  useEffect(() => {
    actionRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        e.preventDefault();
        actionRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const startLevel = () => {
    if (firstSkillId) router.push(`/learn/${firstSkillId}`);
    else onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="placementResultTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-panel/75 p-6 backdrop-blur-[3px]"
    >
      <div className="w-full max-w-[440px] rounded-[14px] border border-line bg-paper px-7 pb-[26px] pt-[30px] text-center shadow-console-lg">
        <div className="relative mx-auto h-24 w-24">
          <ProgressRing
            value={total === 0 ? 0 : correct / total}
            size={96}
            strokeWidth={6}
            colorClass={passed ? 'text-good' : 'text-bad'}
            animate
          />
          <div
            className={['absolute inset-0 flex items-center justify-center', passed ? 'text-good' : 'text-bad'].join(
              ' ',
            )}
          >
            {passed ? <CheckIcon size={34} /> : <XIcon size={32} />}
          </div>
        </div>

        <span
          className={[
            'mono mx-auto mt-[18px] inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]',
            passed ? 'border-good-line bg-good-050 text-good' : 'border-bad-line bg-bad-050 text-bad',
          ].join(' ')}
        >
          {passed ? <CheckIcon size={13} /> : <XIcon size={13} />}
          {passed ? `${levelLabel} Certified` : 'Not certified yet'}
        </span>

        <h3
          id="placementResultTitle"
          className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-ink"
        >
          {correct} of {total} correct
        </h3>

        <p className="mx-auto mt-2.5 max-w-[320px] text-[13.5px] leading-[1.55] text-ink-2">
          {passed ? (
            <>
              You demonstrated {levelLabel}. Every skill in it is marked mastered
              {nextLevelLabel ? (
                <>
                  {' '}
                  and <b className="font-semibold text-ink">{nextLevelLabel}</b> is now
                  unlocked.
                </>
              ) : (
                '.'
              )}
            </>
          ) : (
            <>
              Nothing was recorded. No shortcut this time: start {levelLabel} and learn
              it the usual way. You can test out again later.
            </>
          )}
        </p>

        {passed ? (
          <button
            ref={actionRef}
            type="button"
            onClick={onClose}
            className="mono mt-[22px] w-full rounded-console border-0 bg-good py-[13px] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-[background,transform] duration-150 hover:bg-good-700 active:translate-y-px"
          >
            Back to the map
          </button>
        ) : (
          <div className="mt-[22px] grid gap-2.5">
            <button
              ref={actionRef}
              type="button"
              onClick={startLevel}
              className="mono w-full rounded-console border-0 bg-accent py-[13px] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-[background,transform] duration-150 hover:bg-accent-700 active:translate-y-px"
            >
              Start the level
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mono w-full rounded-console border border-line bg-paper py-[11px] text-[12.5px] font-semibold uppercase tracking-[0.07em] text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
            >
              Back to the map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
