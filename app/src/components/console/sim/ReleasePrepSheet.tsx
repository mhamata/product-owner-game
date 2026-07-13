'use client';

import { useMemo, useState } from 'react';
import type { IndustryId } from '@/curriculum/industries';
import { DEFAULT_INDUSTRY, INDUSTRIES, INDUSTRY_NOUNS, isIndustryId } from '@/curriculum/industries';
import type { IndustryContext } from '@/curriculum/lessons/types';
import {
  type ArtifactValues,
  composeSubmission,
  isSubmittable,
  resolveArtifact,
} from '@/curriculum/artifacts';
import { onePagePrd } from '@/curriculum/artifacts/one-page-prd';
import { useArtifactGradeV2 } from '../lesson/useArtifactGradeV2';
import { releasePrepQualityFromScore } from '@/engine/releasePrep';
import type { ReleasePrepQuality } from '@/engine/types';
import { Sheet } from './InboxTurn';
import { CheckIcon, FileIcon } from '../Icon';

/**
 * Sim 2.0 W5-J: the optional in-sim "write the launch PRD" moment
 * (design-sim-2.0.md §2.4 — "at pivotal moments the sim asks for the real
 * artifact ... and the grade modulates execution risk in-engine"). Offered
 * from InboxTurn's commit sheet ONLY when the sprint being committed has a
 * release card placed.
 *
 * This is a compact, `--px-*`-styled sibling of `ArtifactLesson.tsx` — NOT a
 * reuse of it (same "don't retrofit a light-token component into the dark-
 * capable sim shell" call W4-H made for `RefreshCard.tsx` vs. the older
 * `JudgmentCard.tsx`). What genuinely IS reused, verbatim, is the v2 grading
 * MACHINERY: the `onePagePrd` artifact content, `resolveArtifact`/
 * `composeSubmission`/`isSubmittable`, and the `useArtifactGradeV2` hook —
 * the exact same client call this repo's artifact lessons make against the
 * EXISTING, unmodified `/api/grade-artifact` (v2) route. No new grading path.
 *
 * The returned `overallScore` is handed back to the caller (InboxTurn) via
 * `onGraded`, which both dispatches the bounded `set-release-prep` engine
 * action (engine/releasePrep.ts) and records `artifactGrade` on this sprint's
 * decision-log entry. This component never touches engine state itself.
 */

function industryContext(id: IndustryId): IndustryContext {
  const label = INDUSTRIES.find((i) => i.id === id)?.label ?? id;
  const nouns = INDUSTRY_NOUNS[id];
  return { id, label, product: nouns.product, user: nouns.user };
}

export function ReleasePrepSheet({
  open,
  onClose,
  onSkip,
  onGraded,
  industry,
}: {
  open: boolean;
  onClose: () => void;
  /** Player closes without writing/grading anything — the moment is skipped. */
  onSkip: () => void;
  /** A grade came back; `quality` is the band the caller will dispatch. */
  onGraded: (overallScore: number, quality: ReleasePrepQuality) => void;
  industry: string | null;
}) {
  const industryId: IndustryId = industry && isIndustryId(industry) ? industry : DEFAULT_INDUSTRY;
  const ctx = useMemo(() => industryContext(industryId), [industryId]);
  const resolved = useMemo(() => resolveArtifact(onePagePrd, ctx), [ctx]);
  const briefText = useMemo(() => resolved.brief.join(' '), [resolved.brief]);

  const [values, setValues] = useState<ArtifactValues>({});
  const { verdict, unavailable, error, loading, grade, reset } = useArtifactGradeV2();

  function handleClose() {
    reset();
    setValues({});
    onClose();
  }

  function handleSkip() {
    reset();
    setValues({});
    onSkip();
  }

  async function handleSubmit() {
    const submission = composeSubmission(resolved, values);
    await grade(resolved, briefText, submission);
  }

  function handleLockIn() {
    if (!verdict) return;
    const quality = releasePrepQualityFromScore(verdict.overallScore);
    onGraded(verdict.overallScore, quality);
    reset();
    setValues({});
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Write the launch PRD" subtitle={resolved.hook}>
      {verdict ? (
        <GradedResult overallScore={verdict.overallScore} onLockIn={handleLockIn} onSkip={handleSkip} />
      ) : unavailable ? (
        <CalmUnavailable message={unavailable} onSkip={handleSkip} />
      ) : (
        <div className="mt-1">
          {resolved.fields.map((field) => (
            <div key={field.key} className="mb-3">
              <label
                htmlFor={`release-prep-${field.key}`}
                className="mono block text-[10.5px] uppercase tracking-[0.08em] text-[var(--px-dimmer)]"
              >
                {field.label}
              </label>
              <textarea
                id={`release-prep-${field.key}`}
                rows={field.rows}
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="mono mt-1.5 w-full resize-none rounded-[10px] border border-[var(--px-line)] bg-[var(--px-ground)] px-3 py-2.5 text-[13px] leading-[1.5] text-[var(--px-ink)] placeholder:text-[var(--px-dimmer)] focus:border-[var(--px-accent)] focus:outline-none"
              />
            </div>
          ))}

          {error && (
            <p className="mb-2 text-[12px] leading-[1.5] text-[var(--px-crit)]">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !isSubmittable(resolved, values)}
            className="mono flex w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--px-accent)] px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--px-on-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileIcon size={14} />
            {loading ? 'Grading…' : 'Submit for grading'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="mono mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] border border-transparent px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[var(--px-dim)]"
          >
            Skip this moment
          </button>
        </div>
      )}
    </Sheet>
  );
}

const QUALITY_COPY: Record<ReleasePrepQuality, string> = {
  strong: 'A tightly-scoped PRD — this narrows the risk on this sprint’s capacity roll.',
  mixed: 'An adequate PRD — no change to this sprint’s risk.',
  weak: 'A vague PRD reads as scope-creep risk — this widens the capacity roll and leaves a little tech debt behind.',
};

function GradedResult({
  overallScore,
  onLockIn,
  onSkip,
}: {
  overallScore: number;
  onLockIn: () => void;
  onSkip: () => void;
}) {
  const quality = releasePrepQualityFromScore(overallScore);
  return (
    <div className="mt-1">
      <div className="flex items-center gap-3">
        <span className="mono flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full border border-[var(--px-line-strong)] text-[14px] font-bold text-[var(--px-ink)]">
          {overallScore}
        </span>
        <div>
          <div className="mono text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--px-accent)]">
            {quality === 'strong' ? 'Strong prep' : quality === 'mixed' ? 'Adequate prep' : 'Weak prep'}
          </div>
          <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--px-body)]">{QUALITY_COPY[quality]}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLockIn}
        className="mono mt-3.5 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--px-accent)] px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--px-on-accent)]"
      >
        <CheckIcon size={14} />
        Lock in release prep
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="mono mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] border border-transparent px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[var(--px-dim)]"
      >
        Discard and commit without this
      </button>
    </div>
  );
}

function CalmUnavailable({ message, onSkip }: { message: string; onSkip: () => void }) {
  return (
    <div className="mt-1">
      <p className="text-[12.5px] leading-[1.55] text-[var(--px-body)]">{message}</p>
      <button
        type="button"
        onClick={onSkip}
        className="mono mt-3.5 flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--px-line-strong)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--px-accent)]"
      >
        Continue to commit
      </button>
    </div>
  );
}
