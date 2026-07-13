'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Skill } from '@/curriculum/types';
import type { FreeTextDrill, FreeTextValues } from '@/curriculum/drills';
import { getNextSkill, getUnitForSkill, TOTAL_SKILLS } from '@/curriculum/data';
import { useLearnStore } from '@/store/learnStore';
import { emitExerciseEvent } from '@/lib/telemetry/exerciseEvents';
import { useLLMGrade } from '@/components/methods/drills/LLMGrade';
import { Topbar } from '../Topbar';
import { ProgressRing } from '../ProgressRing';
import { CompletionOverlay } from './CompletionOverlay';
import { CheckIcon, ChevronRightIcon, InfoIcon, XIcon } from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/** answer → checked → complete, like LessonFrame, but grading is async. */
type Phase = 'answer' | 'checked' | 'complete';

/** Humanise a rubric JSON key, e.g. "coverage_gaps" → "Coverage gaps". */
function humaniseKey(key: string): string {
  const spaced = key.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** A single rubric section: a string paragraph or a bulleted list. */
function GradeSection({ label, value }: { label: string; value: unknown }) {
  const isList = Array.isArray(value);
  if (isList && (value as unknown[]).length === 0) return null;
  return (
    <div className="border-t border-dashed border-line pt-3 first:border-t-0 first:pt-0">
      <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
        {label}
      </div>
      {isList ? (
        <ul className="mt-1.5 grid gap-1.5">
          {(value as unknown[]).map((item, i) => (
            <li
              key={i}
              className="flex gap-2 text-[13.5px] leading-[1.55] text-ink-2"
            >
              <span aria-hidden className="mt-[7px] h-1 w-1 flex-none rounded-full bg-faint" />
              <span>{String(item)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[13.5px] leading-[1.6] text-ink-2">
          {String(value)}
        </p>
      )}
    </div>
  );
}

/**
 * Console lesson body for the free-text, LLM-graded skills (JTBD, User
 * Interviews/Mom Test, Pre-Mortem, PR-FAQ).
 *
 * Mirrors the deterministic LessonFrame loop and chrome (Topbar, sticky
 * progress rail, fixed dock, "Skill mastered" overlay) but the CHECK step is
 * ASYNCHRONOUS: it POSTs to /api/grade and renders the returned rubric verdict
 * (score + strengths/issues/rewrite) in the Console feedback style. If the key
 * is missing the route returns an error, which we surface in a bad-styled card
 * with a Retry, the same graceful degradation as the legacy LLMGrade path.
 *
 * Mastery, like the deterministic loop, is awarded on Continue (the answer +
 * model feedback are revealed either way); the model's 0-10 score is shown as
 * feedback, not used as a gate.
 */
export function FreeTextGradeLesson({
  skill,
  drill,
}: {
  skill: Skill;
  drill: FreeTextDrill;
}) {
  const router = useRouter();
  const recordResult = useLearnStore((s) => s.recordResult);
  const streak = useLearnStore((s) => s.streak);
  const masteredCountNow = useLearnStore((s) => s.masteredCount);
  const alreadyMastered = useLearnStore((s) => s.isMastered(skill.id));

  const [values, setValues] = useState<FreeTextValues>({});
  const [phase, setPhase] = useState<Phase>('answer');
  const [detailOpen, setDetailOpen] = useState(false);
  const { grade, result, loading, reset } = useLLMGrade(drill.drillId);

  const unit = useMemo(() => getUnitForSkill(skill.id), [skill.id]);
  const nextSkill = useMemo(() => getNextSkill(skill.id), [skill.id]);
  const scenarioTag = `Scenario · ${drill.scenario.split(' · ')[0]}`;

  const stepInfo = useMemo(() => {
    if (!unit) return { index: 1, total: 1 };
    const idx = unit.skills.findIndex((s) => s.id === skill.id);
    return { index: idx === -1 ? 1 : idx + 1, total: unit.skills.length };
  }, [unit, skill.id]);

  const completedCount = masteredCountNow() + (alreadyMastered ? 0 : 1);
  const ready = drill.isReady(values);
  const locked = phase !== 'answer';
  const progressPct = phase === 'answer' ? 40 : phase === 'checked' ? 60 : 100;

  // Parsed rubric fields (when grading succeeded and returned JSON).
  const parsed =
    result && !result.error && result.parsed
      ? (result.parsed as Record<string, unknown>)
      : null;
  const score = typeof parsed?.score === 'number' ? parsed.score : null;
  const errored = Boolean(result?.error);

  const setField = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const previewText = drill.preview?.(values);

  async function handleSubmit() {
    if (!ready || loading) return;
    await grade(drill.composeInput(values), drill.buildContext?.(values));
    setPhase('checked');
  }

  function handleRetry() {
    reset();
    setPhase('answer');
  }

  function handleContinue() {
    // Match the deterministic loop: completing the loop awards full competence.
    recordResult(skill.id, 1);
    // Shared learner model v0: fire-and-forget, silent no-op when signed out.
    // The rubric score (0-10) is a small number, never the graded text itself.
    emitExerciseEvent({
      kind: 'drill',
      skillId: skill.id,
      competency: skill.competency,
      score: 1,
      payload: { skillId: skill.id, graded: !errored, aiScore: score },
    });
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
            aria-label="Close drill and return to the path"
            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <XIcon size={16} />
          </button>
        }
      />

      <main className="flex-auto">
        <div className="mx-auto max-w-[720px] px-6">
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
          <div className="pb-[260px] pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                {unit ? `Unit ${padIndex(unit.number)}` : 'Skill'} · {skill.title}
              </span>
              <span className="eyebrow">{scenarioTag}</span>
            </div>

            <h2 className="mt-4 text-[23px] font-bold leading-[1.3] tracking-[-0.015em] text-ink max-[560px]:text-[20px]">
              {drill.prompt}
            </h2>

            {/* brief / assignment card */}
            <div className="mt-[18px] rounded-console-lg border border-line bg-panel p-[15px_17px]">
              <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
                {drill.briefTitle}
              </div>
              <p className="mt-1.5 text-[13.5px] leading-[1.6] text-ink-2">
                {drill.brief}
              </p>
            </div>

            {/* fields */}
            <div className="mt-[18px] grid gap-[14px]">
              {drill.fields.map((field) => {
                const inputId = `ft-${skill.id}-${field.key}`;
                const shared =
                  'w-full rounded-console border border-line bg-paper px-3 py-2.5 text-[14px] leading-[1.55] text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-050)] disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-slate';
                return (
                  <div key={field.key}>
                    <label
                      htmlFor={inputId}
                      className="mono mb-1.5 block text-[11px] uppercase tracking-[0.06em] text-slate"
                    >
                      {field.label}
                    </label>
                    {field.multiline ?? true ? (
                      <textarea
                        id={inputId}
                        rows={field.rows ?? 3}
                        value={values[field.key] ?? ''}
                        disabled={locked}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={`${shared} resize-y`}
                      />
                    ) : (
                      <input
                        id={inputId}
                        type="text"
                        value={values[field.key] ?? ''}
                        disabled={locked}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={shared}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* live composed preview (e.g. the JTBD sentence) */}
            {previewText && (
              <div className="mt-[14px] rounded-console border border-dashed border-line bg-panel-2 px-3.5 py-3">
                <div className="mono mb-1 text-[10px] uppercase tracking-[0.1em] text-faint">
                  Your statement
                </div>
                <p className="text-[14px] italic leading-[1.55] text-ink-2">
                  {previewText}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* fixed dock: feedback bar + primary button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[720px] px-6 pb-5">
            {phase === 'checked' && (
              <div
                role="status"
                aria-live="polite"
                className={[
                  'pointer-events-auto mb-3 max-h-[52vh] overflow-y-auto rounded-console-lg border p-[16px_18px] shadow-console-lg',
                  errored
                    ? 'border-bad-line bg-bad-050'
                    : 'border-accent-100 bg-accent-050',
                ].join(' ')}
              >
                {errored ? (
                  <>
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-bad text-white">
                        <XIcon size={17} />
                      </span>
                      <span className="mono text-[13px] font-semibold uppercase tracking-[0.06em] text-bad">
                        Grading unavailable
                      </span>
                    </div>
                    <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-2">
                      {result?.error}
                    </p>
                    <p className="mt-2 text-[12.5px] leading-[1.55] text-slate">
                      Your answer is saved below. You can still continue and mark
                      this skill complete, or set{' '}
                      <code className="mono rounded bg-panel px-1 py-0.5 text-[11.5px] text-ink-2">
                        ANTHROPIC_API_KEY
                      </code>{' '}
                      to get live feedback.
                    </p>
                  </>
                ) : (
                  <FeedbackVerdict
                    score={score}
                    parsed={parsed}
                    detailOpen={detailOpen}
                    onToggleDetail={() => setDetailOpen((v) => !v)}
                  />
                )}
              </div>
            )}

            {phase !== 'complete' && (
              <div className="pointer-events-auto flex gap-2.5">
                {phase === 'checked' && errored && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mono inline-flex flex-none items-center justify-center rounded-console border border-line bg-paper px-[18px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-slate shadow-console-md transition-colors duration-150 hover:border-faint hover:text-ink active:translate-y-px"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  disabled={(phase === 'answer' && (!ready || loading)) || (phase === 'checked' && loading)}
                  onClick={phase === 'answer' ? handleSubmit : handleContinue}
                  className={[
                    'mono inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform,box-shadow,opacity] duration-150 active:translate-y-px',
                    phase === 'answer' && (!ready || loading)
                      ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none'
                      : 'bg-accent text-white hover:bg-accent-700',
                  ].join(' ')}
                >
                  {phase === 'answer' ? (
                    loading ? (
                      <>
                        <Spinner />
                        Grading…
                      </>
                    ) : (
                      'Submit for grading'
                    )
                  ) : (
                    <>
                      Continue
                      <ChevronRightIcon size={16} />
                    </>
                  )}
                </button>
              </div>
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

/** The success verdict: score ring + headline + rubric sections + rewrite. */
function FeedbackVerdict({
  score,
  parsed,
  detailOpen,
  onToggleDetail,
}: {
  score: number | null;
  parsed: Record<string, unknown> | null;
  detailOpen: boolean;
  onToggleDetail: () => void;
}): ReactNode {
  // Split the rubric into "primary" sections (always shown) and the
  // interview-angle, which we tuck behind the existing "Explain" affordance.
  const entries = parsed
    ? Object.entries(parsed).filter(([k]) => k !== 'score')
    : [];
  const primary = entries.filter(([k]) => k !== 'interview_angle');
  const interviewAngle = parsed?.interview_angle;

  return (
    <>
      <div className="flex items-center gap-3">
        {score !== null ? (
          <div className="relative h-[44px] w-[44px] flex-none">
            <ProgressRing
              value={Math.max(0, Math.min(1, score / 10))}
              size={44}
              strokeWidth={4}
              colorClass="text-accent"
              animate
            />
            <span className="mono tnum absolute inset-0 flex items-center justify-center text-[12px] font-bold text-ink">
              {score}
            </span>
          </div>
        ) : (
          <span className="inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-accent text-white">
            <CheckIcon size={17} />
          </span>
        )}
        <div>
          <div className="mono text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
            {score !== null ? `Graded · ${score} / 10` : 'Graded'}
          </div>
          <div className="text-[12.5px] text-slate">
            Coached feedback from Claude
          </div>
        </div>
      </div>

      {parsed ? (
        <div className="mt-3 grid gap-3">
          {primary.map(([key, value]) => (
            <GradeSection key={key} label={humaniseKey(key)} value={value} />
          ))}
          {interviewAngle != null && (
            <>
              <button
                type="button"
                aria-expanded={detailOpen}
                onClick={onToggleDetail}
                className="mono inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[12px] text-accent underline underline-offset-2 hover:text-accent-700"
              >
                <InfoIcon size={13} />
                Interview angle
              </button>
              {detailOpen && (
                <div className="border-t border-dashed border-line pt-3 text-[13px] leading-[1.6] text-slate">
                  {String(interviewAngle)}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Model replied but not as JSON: show the raw text rather than nothing.
        <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-[1.6] text-ink-2">
          {/* raw is carried on the result; parent only passes parsed, so this
              branch is effectively the "no structured fields" fallback. */}
          Feedback received, but it wasn’t structured. Continue when ready.
        </p>
      )}
    </>
  );
}

/** Small inline spinner for the grading button (honors reduced-motion via CSS). */
function Spinner() {
  return (
    <span
      aria-hidden
      className="h-[15px] w-[15px] flex-none animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}
