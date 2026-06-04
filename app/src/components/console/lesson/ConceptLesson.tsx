'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import type { Skill } from '@/curriculum/types';
import { getNextSkill, getUnitForSkill, getLevel, TOTAL_SKILLS } from '@/curriculum/data';
import { INDUSTRIES, INDUSTRY_NOUNS, type IndustryId } from '@/curriculum/industries';
import {
  type ConceptLessonContent,
  type IndustryContext,
  type ResolvedQuestion,
  isFillCorrect,
  resolveFlavoured,
  resolveFlavouredList,
  resolveQuestion,
} from '@/curriculum/lessons/types';
import { useLearnStore } from '@/store/learnStore';
import { Topbar } from '../Topbar';
import { CompletionOverlay } from './CompletionOverlay';
import {
  CapIcon,
  CheckIcon,
  ChevronRightIcon,
  LightbulbIcon,
  StarIcon,
  XIcon,
} from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * The concept lesson runs in three visible phases:
 *  - read:    the teaching body (hook → sections → examples → takeaways). The
 *             dock CTA advances to the check.
 *  - check:   the comprehension questions. CHECK grades them; until every one is
 *             answered the button stays disabled.
 *  - checked: answers are revealed (right/wrong, with the "why"). If all correct,
 *             the dock offers Continue → mastery; if not, it offers "Try again"
 *             which returns to `check` so mastery is genuinely *demonstrated*.
 * `complete` is the terminal overlay state, matching the drill loop exactly.
 */
type Phase = 'read' | 'check' | 'checked' | 'complete';

/** Build the small industry context an authored lesson resolves against. */
function industryContext(id: IndustryId): IndustryContext {
  const label = INDUSTRIES.find((i) => i.id === id)?.label ?? id;
  const nouns = INDUSTRY_NOUNS[id];
  return { id, label, product: nouns.product, user: nouns.user };
}

export function ConceptLesson({
  skill,
  content,
  industry,
}: {
  skill: Skill;
  content: ConceptLessonContent;
  industry: IndustryId;
}) {
  const router = useRouter();
  const recordResult = useLearnStore((s) => s.recordResult);
  const streak = useLearnStore((s) => s.streak);
  const masteredCountNow = useLearnStore((s) => s.masteredCount);
  const alreadyMastered = useLearnStore((s) => s.isMastered(skill.id));

  const [phase, setPhase] = useState<Phase>('read');
  // answers: questionId -> chosen option id (choice) or typed string (fill).
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const ctx = useMemo(() => industryContext(industry), [industry]);
  const unit = useMemo(() => getUnitForSkill(skill.id), [skill.id]);
  const level = skill.level ? getLevel(skill.level) : undefined;
  const nextSkill = useMemo(() => getNextSkill(skill.id), [skill.id]);

  // Resolve every flavoured field once for the active industry.
  const sections = useMemo(
    () =>
      content.sections.map((s) => ({
        heading: s.heading,
        body: resolveFlavouredList(s.body, ctx),
        bullets: s.bullets ? resolveFlavouredList(s.bullets, ctx) : undefined,
      })),
    [content.sections, ctx],
  );
  const examples = useMemo(
    () =>
      content.examples.map((e) => ({
        title: resolveFlavoured(e.title, ctx),
        lines: resolveFlavouredList(e.lines, ctx),
        takeaway: e.takeaway ? resolveFlavoured(e.takeaway, ctx) : undefined,
      })),
    [content.examples, ctx],
  );
  const takeaways = useMemo(
    () => resolveFlavouredList(content.takeaways, ctx),
    [content.takeaways, ctx],
  );
  const questions = useMemo<ResolvedQuestion[]>(
    () => content.check.questions.map((q) => resolveQuestion(q, ctx)),
    [content.check.questions, ctx],
  );

  // Position within the unit, for the "0X / 0Y" readout in the progress rail.
  const stepInfo = useMemo(() => {
    if (!unit) return { index: 1, total: 1 };
    const idx = unit.skills.findIndex((s) => s.id === skill.id);
    return { index: idx === -1 ? 1 : idx + 1, total: unit.skills.length };
  }, [unit, skill.id]);

  const completedCount = masteredCountNow() + (alreadyMastered ? 0 : 1);

  // Grading is pure: a question is right when its answer matches.
  const isQuestionCorrect = (q: ResolvedQuestion): boolean => {
    const a = answers[q.id];
    if (a == null) return false;
    return q.kind === 'choice' ? a === q.correctId : isFillCorrect(a, q.accept);
  };
  const everyAnswered = questions.every((q) => {
    const a = answers[q.id];
    return q.kind === 'choice' ? Boolean(a) : Boolean(a && a.trim());
  });
  const allCorrect = questions.every(isQuestionCorrect);
  const correctCount = questions.filter(isQuestionCorrect).length;

  const progressPct =
    phase === 'read' ? 33 : phase === 'check' ? 66 : 100;

  const setAnswer = (qid: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [qid]: value }));

  function handlePrimary() {
    if (phase === 'read') {
      setPhase('check');
      // Jump focus to the check region so keyboard users land on the questions.
      requestAnimationFrame(() => {
        document.getElementById('concept-check')?.scrollIntoView({ block: 'start' });
      });
      return;
    }
    if (phase === 'check') {
      if (!everyAnswered) return;
      setPhase('checked');
      return;
    }
    if (phase === 'checked') {
      if (allCorrect) {
        // Same completion path as the drills: full competence on a passing check.
        recordResult(skill.id, 1);
        setPhase('complete');
      } else {
        // Demonstrated mastery: a miss sends them back to re-answer.
        setPhase('check');
      }
    }
  }

  const goHome = () => router.push('/');

  const primaryLabel =
    phase === 'read'
      ? 'Start the check'
      : phase === 'check'
        ? 'Check answers'
        : allCorrect
          ? 'Continue'
          : 'Try again';

  const primaryDisabled = phase === 'check' && !everyAnswered;
  const primaryTone =
    phase === 'checked' && !allCorrect ? 'bad' : phase === 'checked' ? 'good' : 'accent';

  return (
    <>
      <Topbar
        right={
          <button
            type="button"
            onClick={goHome}
            aria-label="Close lesson and return to the path"
            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <XIcon size={16} />
          </button>
        }
      />

      <main className="flex-auto">
        <div className="mx-auto max-w-[720px] px-6">
          {/* slim progress rail, identical chrome to the drill loop */}
          <div className="sticky top-[49px] z-10 flex items-center gap-4 bg-background py-[18px] pb-4 max-[560px]:top-[45px]">
            <div className="h-[7px] flex-auto overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mono tnum whitespace-nowrap text-[11px] text-slate">
              {padIndex(stepInfo.index)} / {padIndex(stepInfo.total)}
            </span>
          </div>

          <div className="pb-[220px] pt-2">
            {/* eyebrow + title + hook */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                {unit ? `Unit ${padIndex(unit.number)}` : 'Skill'} · {skill.title}
              </span>
              <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-line bg-panel-2 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-mute">
                <LightbulbIcon size={12} />
                Concept lesson
              </span>
            </div>

            <h2 className="mt-4 text-[23px] font-bold leading-[1.3] tracking-[-0.015em] text-ink max-[560px]:text-[20px]">
              {skill.title}
            </h2>
            <p className="mt-2.5 text-[15px] leading-[1.6] text-ink-2">{content.hook}</p>
            {content.framework && (
              <p className="mono mt-2 text-[11.5px] uppercase tracking-[0.06em] text-faint">
                Framework · {content.framework}
              </p>
            )}

            {/* READING BODY: always rendered; the check appends below it. */}
            <article className="mt-7 grid gap-7">
              {sections.map((section) => (
                <section key={section.heading}>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                    {section.heading}
                  </h3>
                  <div className="mt-2 grid gap-2.5">
                    {section.body.map((para, i) => (
                      <p key={i} className="text-[14.5px] leading-[1.65] text-ink-2">
                        {para}
                      </p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-2.5 grid gap-1.5">
                      {section.bullets.map((b, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 text-[14px] leading-[1.55] text-ink-2"
                        >
                          <span
                            aria-hidden
                            className="mt-[9px] h-1 w-1 flex-none rounded-full bg-accent"
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </article>

            {/* WORKED EXAMPLES */}
            <div className="mt-7 grid gap-3">
              {examples.map((ex, i) => (
                <div
                  key={i}
                  className="rounded-console-lg border border-line bg-panel p-[16px_18px]"
                >
                  <div className="mono flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.1em] text-accent">
                    <StarIcon size={12} />
                    Worked example {examples.length > 1 ? padIndex(i + 1) : ''}
                  </div>
                  <h4 className="mt-1.5 text-[14.5px] font-semibold text-ink">
                    {ex.title}
                  </h4>
                  <ul className="mt-2 grid gap-1.5">
                    {ex.lines.map((line, j) => (
                      <li
                        key={j}
                        className="flex gap-2.5 text-[13.5px] leading-[1.55] text-ink-2"
                      >
                        <span
                          aria-hidden
                          className="mt-[8px] h-1 w-1 flex-none rounded-full bg-faint"
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  {ex.takeaway && (
                    <p className="mt-2.5 border-t border-dashed border-line pt-2.5 text-[13.5px] leading-[1.55] text-slate">
                      <span className="font-semibold text-ink">So what: </span>
                      {ex.takeaway}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* KEY TAKEAWAYS */}
            <div className="mt-7 rounded-console-lg border border-accent-100 bg-accent-050 p-[16px_18px]">
              <div className="mono flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.1em] text-accent">
                <CapIcon size={13} />
                Key takeaways
              </div>
              <ul className="mt-2 grid gap-2">
                {takeaways.map((t, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-[14px] leading-[1.55] text-ink-2"
                  >
                    <CheckIcon size={15} className="mt-0.5 flex-none text-accent" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* COMPREHENSION CHECK: revealed once the learner advances. */}
            {phase !== 'read' && (
              <section id="concept-check" className="mt-9 scroll-mt-[110px]">
                <div className="flex items-center gap-2">
                  <span className="mono rounded-console-sm border border-line bg-paper px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-ink-2">
                    Check
                  </span>
                  <span className="mono text-[11px] text-faint">
                    Answer to master this skill
                  </span>
                </div>
                {content.check.intro && (
                  <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-2">
                    {content.check.intro}
                  </p>
                )}

                <div className="mt-4 grid gap-4">
                  {questions.map((q, qi) => (
                    <CheckQuestionCard
                      key={q.id}
                      question={q}
                      index={qi}
                      total={questions.length}
                      answer={answers[q.id]}
                      locked={phase === 'checked'}
                      correct={phase === 'checked' && isQuestionCorrect(q)}
                      onAnswer={(v) => setAnswer(q.id, v)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* fixed dock: feedback bar (after grading) + primary button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[720px] px-6 pb-5">
            {phase === 'checked' && (
              <div
                role="status"
                aria-live="polite"
                className={[
                  'pointer-events-auto mb-3 rounded-console-lg border p-[14px_18px] shadow-console-lg transition-[transform,opacity] duration-300',
                  allCorrect
                    ? 'border-good-line bg-good-050'
                    : 'border-bad-line bg-bad-050',
                ].join(' ')}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={[
                      'inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-white',
                      allCorrect ? 'bg-good' : 'bg-bad',
                    ].join(' ')}
                  >
                    {allCorrect ? <CheckIcon size={17} /> : <XIcon size={17} />}
                  </span>
                  <div>
                    <span
                      className={[
                        'mono text-[13px] font-semibold uppercase tracking-[0.06em]',
                        allCorrect ? 'text-good' : 'text-bad',
                      ].join(' ')}
                    >
                      {allCorrect
                        ? 'Check passed'
                        : `${correctCount} / ${questions.length} correct`}
                    </span>
                    <p className="mt-0.5 text-[13px] leading-[1.5] text-ink-2">
                      {allCorrect
                        ? 'You demonstrated the concept. Skill mastered on continue.'
                        : 'Review the explanations below, then try the check again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {phase !== 'complete' && (
              <button
                type="button"
                disabled={primaryDisabled}
                onClick={handlePrimary}
                className={[
                  'mono pointer-events-auto inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px',
                  primaryDisabled
                    ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none'
                    : primaryTone === 'good'
                      ? 'bg-good text-white hover:bg-good-700'
                      : primaryTone === 'bad'
                        ? 'bg-bad text-white hover:bg-bad-700'
                        : 'bg-accent text-white hover:bg-accent-700',
                ].join(' ')}
              >
                {primaryLabel}
                {(phase === 'read' || (phase === 'checked' && allCorrect)) && (
                  <ChevronRightIcon size={16} />
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
          onContinue={goHome}
        />
      )}
    </>
  );
}

/**
 * One comprehension question. Choice questions render as an accessible radio
 * group (native radios, fully keyboard-operable); fill questions render a text
 * input. After grading (`locked`), the correct answer + "why" are revealed and
 * correctness is shown with colour AND an icon AND text, never colour alone.
 */
function CheckQuestionCard({
  question,
  index,
  total,
  answer,
  locked,
  correct,
  onAnswer,
}: {
  question: ResolvedQuestion;
  index: number;
  total: number;
  answer: string | undefined;
  locked: boolean;
  correct: boolean;
  onAnswer: (value: string) => void;
}) {
  const groupName = `q-${question.id}`;
  const promptId = `${groupName}-prompt`;

  return (
    <div
      className={[
        'rounded-console-lg border bg-paper p-[16px_18px] transition-[border-color] duration-150',
        locked
          ? correct
            ? 'border-good shadow-[0_0_0_1px_var(--color-good)_inset]'
            : 'border-bad shadow-[0_0_0_1px_var(--color-bad)_inset]'
          : 'border-line',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <span className="mono mt-px text-[11px] text-faint">
          {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </span>
        <p id={promptId} className="text-[14.5px] font-medium leading-[1.5] text-ink">
          {question.prompt}
        </p>
        {locked && (
          <span className="ml-auto flex-none">
            {correct ? (
              <CheckIcon size={17} className="text-good" />
            ) : (
              <XIcon size={17} className="text-bad" />
            )}
          </span>
        )}
      </div>

      {question.kind === 'choice' ? (
        <fieldset className="mt-3" aria-describedby={promptId}>
          <legend className="sr-only">{`Question ${index + 1} options`}</legend>
          <div className="grid gap-2">
            {question.options.map((opt) => {
              const selected = answer === opt.id;
              const isCorrectOpt = locked && opt.id === question.correctId;
              const isWrongPick = locked && selected && opt.id !== question.correctId;
              return (
                <label
                  key={opt.id}
                  className={[
                    'flex cursor-pointer items-start gap-2.5 rounded-console border px-3 py-2.5 text-[14px] leading-[1.5] transition-[border-color,background] duration-150',
                    isCorrectOpt
                      ? 'border-good bg-good-050 text-ink'
                      : isWrongPick
                        ? 'border-bad bg-bad-050 text-ink'
                        : selected
                          ? 'border-accent bg-accent-050 text-ink'
                          : 'border-line bg-paper text-ink-2 hover:border-faint',
                    locked ? 'cursor-default' : '',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={opt.id}
                    checked={selected}
                    disabled={locked}
                    onChange={() => onAnswer(opt.id)}
                    className="mt-0.5 h-4 w-4 flex-none accent-accent"
                  />
                  <span className="flex-auto">{opt.label}</span>
                  {isCorrectOpt && (
                    <span className="mono flex-none text-[10px] uppercase tracking-[0.08em] text-good">
                      Correct
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <div className="mt-3">
          <label htmlFor={groupName} className="sr-only">
            {`Answer for question ${index + 1}`}
          </label>
          <input
            id={groupName}
            type="text"
            value={answer ?? ''}
            disabled={locked}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={question.placeholder ?? 'Type your answer'}
            aria-describedby={promptId}
            className="w-full rounded-console border border-line bg-paper px-3 py-2.5 text-[14px] leading-[1.5] text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-050)] disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-slate"
          />
          {locked && !correct && (
            <p className="mt-2 text-[13px] leading-[1.5] text-ink-2">
              <span className="font-semibold text-good">Answer: </span>
              {question.accept[0]}
            </p>
          )}
        </div>
      )}

      {locked && (
        <p className="mt-3 border-t border-dashed border-line pt-2.5 text-[13px] leading-[1.6] text-slate">
          {question.why}
        </p>
      )}
    </div>
  );
}
