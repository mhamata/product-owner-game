'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Skill } from '@/curriculum/types';
import type { IndustryId } from '@/curriculum/industries';
import { INDUSTRIES, INDUSTRY_NOUNS } from '@/curriculum/industries';
import type { IndustryContext } from '@/curriculum/lessons/types';
import {
  type ArtifactContent,
  type ArtifactValues,
  composeSubmission,
  isSubmittable,
  resolveArtifact,
} from '@/curriculum/artifacts';
import { getNextSkill, getUnitForSkill, TOTAL_SKILLS } from '@/curriculum/data';
import { useLearnStore } from '@/store/learnStore';
import { Topbar } from '../Topbar';
import { ProgressRing } from '../ProgressRing';
import { CompletionOverlay } from './CompletionOverlay';
import {
  type CriterionVerdict,
  useArtifactGrade,
} from './useArtifactGrade';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleIcon,
  FileIcon,
  InfoIcon,
  RestartIcon,
  XIcon,
} from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * Phases of the artifact loop:
 *  - write:    the learner reads the brief + rubric and drafts. Submit is gated
 *              until the draft clears a minimum bar (`isSubmittable`).
 *  - graded:   the rubric verdict is shown (per-criterion band + comment,
 *              strengths, gaps, overall). A passing verdict offers Continue
 *              (records mastery); a non-passing one offers Revise; the
 *              grading-unavailable fallback offers both Revise and Continue with
 *              the draft preserved.
 *  - complete: the exit screen, which tells the truth about what happened. A
 *              genuine pass (mastery recorded) shows the shared "Skill mastered"
 *              celebration; a sub-pass or "Continue anyway" path recorded nothing
 *              and shows an honest "draft saved, not yet mastered" screen with the
 *              count unchanged.
 */
type Phase = 'write' | 'graded' | 'complete';

/** Passing bar mirrors the server's: overallScore >= 70 (also `verdict.passed`). */
const PASS_SCORE = 70;

/** Build the small industry context an authored artifact resolves against. */
function industryContext(id: IndustryId): IndustryContext {
  const label = INDUSTRIES.find((i) => i.id === id)?.label ?? id;
  const nouns = INDUSTRY_NOUNS[id];
  return { id, label, product: nouns.product, user: nouns.user };
}

/** Band metadata for a 0-3 criterion score: paired color + icon + word. */
function bandMeta(score: number): {
  label: string;
  tone: 'good' | 'warn' | 'bad';
} {
  if (score >= 3) return { label: 'Excellent', tone: 'good' };
  if (score === 2) return { label: 'Solid', tone: 'good' };
  if (score === 1) return { label: 'Needs work', tone: 'warn' };
  return { label: 'Missing', tone: 'bad' };
}

const TONE_TEXT: Record<'good' | 'warn' | 'bad', string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
};
const TONE_DOT: Record<'good' | 'warn' | 'bad', string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
};

export function ArtifactLesson({
  skill,
  content,
  industry,
}: {
  skill: Skill;
  content: ArtifactContent;
  industry: IndustryId;
}) {
  const router = useRouter();
  const recordResult = useLearnStore((s) => s.recordResult);
  const streak = useLearnStore((s) => s.streak);
  const masteredCountNow = useLearnStore((s) => s.masteredCount);
  const alreadyMastered = useLearnStore((s) => s.isMastered(skill.id));

  const ctx = useMemo(() => industryContext(industry), [industry]);
  const resolved = useMemo(() => resolveArtifact(content, ctx), [content, ctx]);
  const briefText = useMemo(() => resolved.brief.join('\n\n'), [resolved.brief]);

  const [values, setValues] = useState<ArtifactValues>({});
  const [phase, setPhase] = useState<Phase>('write');
  const [rubricOpen, setRubricOpen] = useState(true);
  const { verdict, unavailable, error, loading, grade, reset } = useArtifactGrade();

  const unit = useMemo(() => getUnitForSkill(skill.id), [skill.id]);
  const nextSkill = useMemo(() => getNextSkill(skill.id), [skill.id]);

  const stepInfo = useMemo(() => {
    if (!unit) return { index: 1, total: 1 };
    const idx = unit.skills.findIndex((s) => s.id === skill.id);
    return { index: idx === -1 ? 1 : idx + 1, total: unit.skills.length };
  }, [unit, skill.id]);

  // The count to show on the completion screen.
  //  - On a genuine pass we record mastery, so the celebratory overlay shows the
  //    incremented count (this skill now counts, unless it was already mastered).
  //  - On a sub-pass or the "Continue anyway" path nothing is recorded, so the
  //    honest overlay must show the UNCHANGED count: no phantom +1.
  const masteredCountAfterPass = masteredCountNow() + (alreadyMastered ? 0 : 1);
  const ready = isSubmittable(resolved, values);
  const locked = phase !== 'write';
  const progressPct = phase === 'write' ? 40 : phase === 'graded' ? 70 : 100;

  // A passing verdict is the only path that records mastery on Continue. The
  // unavailable fallback and a sub-pass verdict still let the learner move on
  // (the draft + feedback are preserved either way), matching the free-text
  // drills, but only a genuine pass writes competence to the store.
  const passed = verdict ? verdict.passed || verdict.overallScore >= PASS_SCORE : false;

  const setField = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  async function handleSubmit() {
    if (!ready || loading) return;
    const submission = composeSubmission(resolved, values);
    await grade(resolved, briefText, submission);
    setPhase('graded');
  }

  function handleRevise() {
    reset();
    setPhase('write');
  }

  function handleContinue() {
    if (passed) recordResult(skill.id, 1);
    setPhase('complete');
  }

  const goHome = () => router.push('/');

  return (
    <>
      <Topbar
        right={
          <button
            type="button"
            onClick={goHome}
            aria-label="Close and return to the path"
            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <XIcon size={16} />
          </button>
        }
      />

      <main className="flex-auto">
        <div className="mx-auto max-w-[760px] px-6">
          {/* slim progress rail */}
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

          {/* body */}
          <div className="pb-[280px] pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                <FileIcon size={12} />
                Artifact
              </span>
              <span className="mono rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate">
                {unit ? `Unit ${padIndex(unit.number)}` : 'Skill'} · {skill.title}
              </span>
              <span className="eyebrow">{resolved.scenarioTag}</span>
            </div>

            <h2 className="mt-4 text-[24px] font-bold leading-[1.25] tracking-[-0.015em] text-ink max-[560px]:text-[21px]">
              {resolved.title}
            </h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-slate">{resolved.hook}</p>
            {resolved.framework && (
              <p className="mono mt-1 text-[11px] uppercase tracking-[0.08em] text-faint">
                {resolved.framework}
              </p>
            )}

            {/* the brief */}
            <section
              aria-labelledby="artifact-brief-heading"
              className="mt-[20px] rounded-console-lg border border-line bg-panel p-[17px_19px]"
            >
              <div
                id="artifact-brief-heading"
                className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute"
              >
                The brief
              </div>
              <div className="mt-2 grid gap-2.5">
                {resolved.brief.map((para, i) => (
                  <p key={i} className="text-[14px] leading-[1.65] text-ink-2">
                    {para}
                  </p>
                ))}
              </div>

              <div className="mt-4 border-t border-dashed border-line pt-3">
                <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
                  What to produce
                </div>
                <ul className="mt-2 grid gap-1.5">
                  {resolved.whatToProduce.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-[13.5px] leading-[1.55] text-ink-2"
                    >
                      <CheckIcon size={15} className="mt-[3px] flex-none text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* the visible rubric: the learner sees the bar before writing */}
            <section
              aria-labelledby="artifact-rubric-heading"
              className="mt-[14px] rounded-console-lg border border-line bg-paper"
            >
              <button
                type="button"
                aria-expanded={rubricOpen}
                onClick={() => setRubricOpen((v) => !v)}
                className="flex w-full items-center gap-2 rounded-console-lg px-[19px] py-[14px] text-left transition-colors duration-150 hover:bg-panel/60"
              >
                <span
                  id="artifact-rubric-heading"
                  className="mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink"
                >
                  How this is graded
                </span>
                <span className="mono rounded-full bg-panel-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-slate">
                  {resolved.rubric.length} criteria
                </span>
                <ChevronRightIcon
                  size={15}
                  className={`ml-auto flex-none text-faint transition-transform duration-200 ${
                    rubricOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {rubricOpen && (
                <ol className="grid gap-3 border-t border-line px-[19px] pb-[17px] pt-[15px]">
                  {resolved.rubric.map((c, i) => (
                    <li key={c.id} className="flex gap-3">
                      <span className="mono tnum mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent-050 text-[10.5px] font-semibold text-accent">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-[13.5px] font-semibold text-ink">
                          {c.label}
                        </div>
                        <p className="mt-0.5 text-[13px] leading-[1.55] text-slate">
                          {c.descriptor}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* the writing area */}
            <div className="mt-[20px] grid gap-[16px]">
              {resolved.fields.map((field) => {
                const inputId = `artifact-${skill.id}-${field.key}`;
                return (
                  <div key={field.key}>
                    <label
                      htmlFor={inputId}
                      className="mono mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-slate"
                    >
                      {field.label}
                    </label>
                    {field.hint && (
                      <p className="mb-1.5 text-[12px] leading-[1.5] text-faint">
                        {field.hint}
                      </p>
                    )}
                    <textarea
                      id={inputId}
                      rows={field.rows}
                      value={values[field.key] ?? ''}
                      disabled={locked}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full resize-y rounded-console border border-line bg-paper px-3.5 py-3 text-[14px] leading-[1.6] text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-050)] disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-slate"
                    />
                  </div>
                );
              })}
              {phase === 'write' && !ready && (
                <p className="text-[12px] leading-[1.5] text-faint">
                  Write a real draft in each section to enable grading. Aim for substance over length.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* fixed dock: verdict + primary action */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[760px] px-6 pb-5">
            {phase === 'graded' && (
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-auto mb-3 max-h-[56vh] overflow-y-auto rounded-console-lg border border-line bg-paper p-[16px_18px] shadow-console-lg"
              >
                {error ? (
                  <UnavailableOrError
                    tone="bad"
                    title="Grading unavailable"
                    body={error}
                    note="Your draft is saved above. You can revise and try again."
                  />
                ) : unavailable ? (
                  <UnavailableOrError
                    tone="warn"
                    title="Grading unavailable"
                    body={unavailable}
                    note="Your draft is saved above. Without grading this skill cannot be marked mastered, but you can keep the draft and move on, or revise it."
                  />
                ) : verdict ? (
                  <Verdict verdict={verdict} passed={passed} />
                ) : null}
              </div>
            )}

            {phase !== 'complete' && (
              <div className="pointer-events-auto flex gap-2.5">
                {phase === 'graded' && (
                  <button
                    type="button"
                    onClick={handleRevise}
                    className="mono inline-flex flex-none items-center justify-center gap-2 rounded-console border border-line bg-paper px-[18px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-slate shadow-console-md transition-colors duration-150 hover:border-faint hover:text-ink active:translate-y-px"
                  >
                    <RestartIcon size={14} />
                    Revise
                  </button>
                )}

                {/* Submit (write phase) OR Continue (graded phase). When grading
                    errored with no draft to keep, the only forward action is
                    Revise above, so we hide Continue on a hard error. */}
                {!(phase === 'graded' && error) && (
                  <button
                    type="button"
                    disabled={phase === 'write' && (!ready || loading)}
                    onClick={phase === 'write' ? handleSubmit : handleContinue}
                    className={[
                      'mono inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px',
                      phase === 'write' && (!ready || loading)
                        ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none'
                        : phase === 'graded' && passed
                          ? 'bg-good text-white hover:bg-good-700'
                          : 'bg-accent text-white hover:bg-accent-700',
                    ].join(' ')}
                  >
                    {phase === 'write' ? (
                      loading ? (
                        <>
                          <Spinner />
                          Grading your draft
                        </>
                      ) : (
                        'Submit for grading'
                      )
                    ) : passed ? (
                      <>
                        Continue
                        <ChevronRightIcon size={16} />
                      </>
                    ) : (
                      <>
                        Continue anyway
                        <ChevronRightIcon size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* On completion, the screen must tell the truth. Only a genuine pass
          (verdict cleared the bar AND mastery was recorded) earns the celebratory
          "Skill mastered" overlay with the bumped count and the kept streak.
          A sub-pass verdict or the "Continue anyway" / grading-unavailable path
          recorded nothing, so it gets an honest "draft saved, not yet mastered"
          screen with the UNCHANGED count and a clear way back. */}
      {phase === 'complete' &&
        (passed ? (
          <CompletionOverlay
            skillTitle={skill.title}
            masteredCount={masteredCountAfterPass}
            totalSkills={TOTAL_SKILLS}
            streak={streak}
            nextSkillTitle={nextSkill?.title ?? null}
            nextSkillIndex={nextSkill?.index ?? null}
            onContinue={goHome}
          />
        ) : (
          <DraftSavedOverlay
            skillTitle={skill.title}
            masteredCount={masteredCountNow()}
            totalSkills={TOTAL_SKILLS}
            onContinue={goHome}
          />
        ))}
    </>
  );
}

/* ------------------------------------------------------------------
   The HONEST non-mastery exit. Shown when a learner moves on from a draft that
   did not clear the bar, or when grading was unavailable and they continued.
   Nothing was recorded, so this screen makes NO mastery claim: no "Skill
   mastered" badge, no "+1", no "streak kept", and the count is unchanged. It is
   a calm acknowledgement that the draft is kept and the skill is still open,
   with a single clear way back. Mirrors CompletionOverlay's modal mechanics
   (focus moves to the action, ESC + backdrop dismiss, focus trapped).
   ------------------------------------------------------------------ */
function DraftSavedOverlay({
  skillTitle,
  masteredCount,
  totalSkills,
  onContinue,
}: {
  skillTitle: string;
  /** Mastered count, UNCHANGED by this draft (nothing was recorded). */
  masteredCount: number;
  totalSkills: number;
  onContinue: () => void;
}) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onContinue();
      if (e.key === 'Tab') {
        e.preventDefault();
        continueRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onContinue]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="draftSavedTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinue();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-panel/75 p-6 backdrop-blur-[3px]"
    >
      <div className="w-full max-w-[420px] rounded-[14px] border border-line bg-paper px-7 pb-[26px] pt-[30px] text-center shadow-console-lg">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-line bg-panel text-slate">
            <FileIcon size={30} />
          </div>
        </div>

        <span className="mono mx-auto mt-[18px] inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
          <FileIcon size={13} />
          Draft saved
        </span>

        <h3
          id="draftSavedTitle"
          className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-ink"
        >
          {skillTitle}
        </h3>

        <p className="mx-auto mt-2.5 max-w-[320px] text-[13.5px] leading-[1.6] text-slate">
          This draft did not clear the bar yet, so the skill is not mastered.
          Your writing is kept. Come back and revise to earn it.
        </p>

        <div className="mx-auto mt-4 grid max-w-[280px] gap-2 text-left">
          <div className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
            <CircleIcon size={13} className="flex-none text-faint" />
            <span>Not yet mastered</span>
            <span className="mono ml-auto text-[11px] uppercase tracking-[0.06em] text-faint">
              {padIndex(masteredCount)} / {padIndex(totalSkills)}
            </span>
          </div>
        </div>

        <button
          ref={continueRef}
          type="button"
          onClick={onContinue}
          className="mono mt-[22px] inline-flex w-full items-center justify-center gap-2 rounded-console border-0 bg-accent py-[13px] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-[background,transform] duration-150 hover:bg-accent-700 active:translate-y-px"
        >
          Back to the path
          <ArrowRightIcon size={15} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   The rubric verdict: overall score ring + per-criterion bands +
   strengths/gaps. Semantic color is ALWAYS paired with an icon + word.
   ------------------------------------------------------------------ */
function Verdict({
  verdict,
  passed,
}: {
  verdict: {
    criteria: CriterionVerdict[];
    strengths: string[];
    gaps: string[];
    overall: string;
    overallScore: number;
  };
  passed: boolean;
}) {
  const ringTone = passed ? 'text-good' : 'text-warn';
  const headlineTone = passed ? 'text-good' : 'text-warn';

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative h-[46px] w-[46px] flex-none">
          <ProgressRing
            value={Math.max(0, Math.min(1, verdict.overallScore / 100))}
            size={46}
            strokeWidth={4}
            colorClass={ringTone}
            animate
          />
          <span className="mono tnum absolute inset-0 flex items-center justify-center text-[12px] font-bold text-ink">
            {verdict.overallScore}
          </span>
        </div>
        <div>
          <div
            className={`mono inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] ${headlineTone}`}
          >
            {passed ? <CheckIcon size={15} /> : <AlertTriangleIcon size={15} />}
            {passed ? 'Meets the bar' : 'Not there yet'}
          </div>
          <div className="text-[12.5px] text-slate">
            Rubric feedback from Claude · {verdict.overallScore} / 100
          </div>
        </div>
      </div>

      {/* per-criterion bands */}
      <ul className="mt-3.5 grid gap-2.5">
        {verdict.criteria.map((c) => {
          const meta = bandMeta(c.score);
          return (
            <li
              key={c.id}
              className="border-t border-dashed border-line pt-2.5 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`h-2 w-2 flex-none rounded-full ${TONE_DOT[meta.tone]}`}
                />
                <span className="text-[13px] font-semibold text-ink">{c.label}</span>
                <span
                  className={`mono ml-auto flex-none text-[11px] font-semibold uppercase tracking-[0.06em] ${TONE_TEXT[meta.tone]}`}
                >
                  {meta.label} · {c.score}/3
                </span>
              </div>
              {c.comment && (
                <p className="mt-1 pl-4 text-[13px] leading-[1.55] text-ink-2">
                  {c.comment}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* strengths + gaps */}
      <div className="mt-3.5 grid gap-3 border-t border-dashed border-line pt-3 sm:grid-cols-2">
        <VerdictList
          tone="good"
          title="Strengths"
          items={verdict.strengths}
          icon={<CheckIcon size={13} />}
        />
        <VerdictList
          tone="warn"
          title="Gaps to close"
          items={verdict.gaps}
          icon={<CircleIcon size={11} />}
        />
      </div>

      {verdict.overall && (
        <div className="mt-3 flex gap-2 border-t border-dashed border-line pt-3">
          <InfoIcon size={14} className="mt-0.5 flex-none text-slate" />
          <p className="text-[13px] leading-[1.6] text-ink-2">{verdict.overall}</p>
        </div>
      )}
    </>
  );
}

/** A small titled list (strengths / gaps), color paired with title + icon. */
function VerdictList({
  tone,
  title,
  items,
  icon,
}: {
  tone: 'good' | 'warn';
  title: string;
  items: string[];
  icon: ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div
        className={`mono flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] ${TONE_TEXT[tone]}`}
      >
        {icon}
        {title}
      </div>
      <ul className="mt-1.5 grid gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-[1.55] text-ink-2">
            <span
              aria-hidden
              className={`mt-[7px] h-1 w-1 flex-none rounded-full ${TONE_DOT[tone]}`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The graceful "grading unavailable" / error card. Color paired with icon + text. */
function UnavailableOrError({
  tone,
  title,
  body,
  note,
}: {
  tone: 'warn' | 'bad';
  title: string;
  body: string;
  note: string;
}) {
  const chip = tone === 'bad' ? 'bg-bad' : 'bg-warn';
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-white ${chip}`}
        >
          <AlertTriangleIcon size={17} />
        </span>
        <span
          className={`mono text-[13px] font-semibold uppercase tracking-[0.06em] ${TONE_TEXT[tone]}`}
        >
          {title}
        </span>
      </div>
      <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-2">{body}</p>
      <p className="mt-2 text-[12.5px] leading-[1.55] text-slate">{note}</p>
    </>
  );
}

/** Inline grading spinner (CSS animation honors reduced-motion globally). */
function Spinner() {
  return (
    <span
      aria-hidden
      className="h-[15px] w-[15px] flex-none animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}
