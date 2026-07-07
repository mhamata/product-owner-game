'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  appendVersion,
  canSubmitAnother,
  latestVersion,
  loadVersionHistory,
  MAX_VERSIONS,
  nextVersionNumber,
  saveVersionHistory,
  type VersionHistory,
} from '@/lib/artifactVersionsV2';
import { useLearnStore } from '@/store/learnStore';
import { Topbar } from '../Topbar';
import { CompletionOverlay } from './CompletionOverlay';
import { useArtifactGradeV2 } from './useArtifactGradeV2';
// Shared AI-graded-modality UI (also used by RoleplayLesson): the graceful
// unavailable/error card, the honest "not yet mastered" overlay, and the inline
// spinner. The V2 verdict pieces live in verdictV2Ui.
import { DraftSavedOverlay, Spinner, UnavailableOrError } from './verdictUi';
import { AnnotatedSubmission, VerdictV2 } from './verdictV2Ui';
import {
  CheckIcon,
  ChevronRightIcon,
  FileIcon,
  RestartIcon,
  XIcon,
} from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * Phases of the artifact loop (V2: inline annotations + revise-and-resubmit):
 *  - write:    the learner reads the brief + rubric and drafts. Submit is gated
 *              until the draft clears a minimum bar (`isSubmittable`). On a
 *              REVISE, we return here with the same values pre-filled; the next
 *              submit carries the previous submission + verdict so the grade
 *              reports the delta.
 *  - graded:   the V2 verdict is shown (topFix + rubric bands + inline
 *              annotations pinned to numbered blocks + the delta view on a
 *              revision). Passing offers Continue (records mastery); otherwise
 *              "Revise & resubmit" reopens the editor, up to MAX_VERSIONS total.
 *  - complete: the honest exit screen (celebration only on a genuine pass).
 *
 * Versions are persisted to localStorage per skillId so the trajectory (v1 → v2)
 * survives a reload. Grading degrades gracefully: when the verdict is null or
 * grading is unavailable, the draft is preserved and the learner can move on.
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
  // Version history is persisted per skill; hydrated on mount so a reload keeps
  // the trajectory. Starts empty on the server to avoid a hydration mismatch.
  const [history, setHistory] = useState<VersionHistory>({
    skillId: skill.id,
    versions: [],
  });
  const { verdict, unavailable, error, loading, grade, reset } = useArtifactGradeV2();

  // Hydrate the persisted version history on mount. Deferred into an animation
  // frame so the effect body never calls setState synchronously
  // (react-hooks/set-state-in-effect), matching the sim's ShipStep pattern; the
  // server render starts from the empty history, avoiding a hydration mismatch.
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setHistory(loadVersionHistory(skill.id));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [skill.id]);

  const unit = useMemo(() => getUnitForSkill(skill.id), [skill.id]);
  const nextSkill = useMemo(() => getNextSkill(skill.id), [skill.id]);

  const stepInfo = useMemo(() => {
    if (!unit) return { index: 1, total: 1 };
    const idx = unit.skills.findIndex((s) => s.id === skill.id);
    return { index: idx === -1 ? 1 : idx + 1, total: unit.skills.length };
  }, [unit, skill.id]);

  // The count to show on the completion screen (see the honest-completion note
  // at the bottom): +1 only on a genuine pass this attempt records.
  const masteredCountAfterPass = masteredCountNow() + (alreadyMastered ? 0 : 1);
  const ready = isSubmittable(resolved, values);
  const locked = phase !== 'write';
  const progressPct = phase === 'write' ? 40 : phase === 'graded' ? 70 : 100;

  // A passing verdict is the only path that records mastery on Continue.
  const passed = verdict ? verdict.passed || verdict.overallScore >= PASS_SCORE : false;

  // How many versions have been graded, and whether a revision is still allowed.
  const versionCount = history.versions.length;
  const revisionsLeft = canSubmitAnother(history);
  const nextVersion = nextVersionNumber(history);

  const setField = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  async function handleSubmit() {
    if (!ready || loading) return;
    const composed = composeSubmission(resolved, values);

    // On the second+ attempt, carry the previous submission + verdict so the
    // grader can report the delta. `previousVerdict` sends only the parts the
    // grader replays (criteria + annotations + score).
    const prev = latestVersion(history);
    const revision =
      prev && prev.verdict
        ? {
            previousSubmission: prev.submission,
            previousVerdict: {
              criteria: prev.verdict.criteria,
              annotations: prev.verdict.annotations,
              overallScore: prev.verdict.overallScore,
            },
          }
        : undefined;

    const graded = await grade(resolved, briefText, composed, revision);
    setPhase('graded');

    // Persist this version (verdict may be null on an unparseable grade; we still
    // record the submission so the trajectory and revise-cap stay honest).
    setHistory((current) => {
      const next = appendVersion(current, composed, graded, Date.now());
      saveVersionHistory(next);
      return next;
    });
  }

  function handleRevise() {
    // Keep `values` (the editor is pre-filled with the same draft) and return to
    // the write phase. The next submit will attach the previous version as the
    // revision context.
    reset();
    setPhase('write');
  }

  function handleContinue() {
    if (passed) recordResult(skill.id, 1);
    setPhase('complete');
  }

  const goHome = () => router.push('/');

  // The submission whose annotations we render inline: the latest graded one.
  const gradedVersion = latestVersion(history);
  const showAnnotated =
    phase === 'graded' && verdict !== null && gradedVersion !== undefined;

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
              {versionCount > 0 && (
                <span className="mono tnum rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate">
                  v{Math.min(nextVersion, MAX_VERSIONS)} / {MAX_VERSIONS}
                </span>
              )}
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
              {phase === 'write' && ready && versionCount > 0 && revisionsLeft && (
                <p className="text-[12px] leading-[1.5] text-slate">
                  Revising version {versionCount}. Your next grade will show what changed.
                </p>
              )}
            </div>

            {/* the marked-up draft: numbered blocks + inline annotations, pinned
                to the block they reference. Rendered in the scrollable body (not
                the dock) because it is tall. */}
            {showAnnotated && (
              <section className="mt-[22px]">
                <AnnotatedSubmission
                  submission={gradedVersion!.submission}
                  annotations={verdict!.annotations}
                />
              </section>
            )}
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
                  <VerdictV2 verdict={verdict} passed={passed} history={history} />
                ) : null}
              </div>
            )}

            {phase !== 'complete' && (
              <div className="pointer-events-auto flex gap-2.5">
                {/* Revise & resubmit: available in the graded phase whenever a
                    revision is still allowed (under the MAX_VERSIONS cap) and the
                    draft was preserved (hidden on a hard error with no draft). */}
                {phase === 'graded' && revisionsLeft && !(error && !verdict) && (
                  <button
                    type="button"
                    onClick={handleRevise}
                    className="mono inline-flex flex-none items-center justify-center gap-2 rounded-console border border-line bg-paper px-[18px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-slate shadow-console-md transition-colors duration-150 hover:border-faint hover:text-ink active:translate-y-px"
                  >
                    <RestartIcon size={14} />
                    Revise &amp; resubmit
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
                      ) : versionCount > 0 ? (
                        `Submit version ${nextVersion} for grading`
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
