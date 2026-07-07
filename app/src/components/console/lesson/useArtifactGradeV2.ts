'use client';

import { useCallback, useRef, useState } from 'react';
import { authHeaders } from '@/lib/supabase/client';
import type { ResolvedArtifact } from '@/curriculum/artifacts';
import type {
  ArtifactVerdictV2,
  PreviousVerdictSummary,
} from '@/lib/artifactGraderV2';

/**
 * Client hook for the V2 artifact grading round-trip (inline annotations +
 * revise-and-resubmit). Mirrors `useArtifactGrade` and shares the same
 * `/api/grade-artifact` endpoint, sending `v: 2` so the route takes the V2 path
 * and, on a revision, the previous submission + verdict so the grade can report
 * the delta.
 *
 * The three terminal states are the same as V1:
 *  - `verdict`:      a V2 rubric result (criteria + annotations + topFix + delta)
 *  - `unavailable`:  grading is off (no API key); a calm, NON-error fallback
 *  - `error`:        a real failure (rate limit, network, model error)
 */

export interface ArtifactGradeV2State {
  verdict: ArtifactVerdictV2 | null;
  /** Set when grading is off (no key). Carries the calm fallback message. */
  unavailable: string | null;
  /** Set on a real error (rate limit, network, model). */
  error: string | null;
  loading: boolean;
}

const INITIAL: ArtifactGradeV2State = {
  verdict: null,
  unavailable: null,
  error: null,
  loading: false,
};

/** One stable random session id per mounted lesson (memory only). */
function makeSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/** The optional previous-attempt context sent on a revision. */
export interface RevisionContext {
  previousSubmission: string;
  previousVerdict: PreviousVerdictSummary;
}

export function useArtifactGradeV2() {
  const [state, setState] = useState<ArtifactGradeV2State>(INITIAL);
  const sessionId = useRef<string | null>(null);
  if (sessionId.current == null) sessionId.current = makeSessionId();

  const grade = useCallback(
    async (
      resolved: ResolvedArtifact,
      brief: string,
      submission: string,
      revision?: RevisionContext,
    ) => {
      setState({ ...INITIAL, loading: true });
      try {
        const session = sessionId.current ?? makeSessionId();
        const r = await fetch('/api/grade-artifact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-praxis-session': session,
            // Bearer token when signed in (empty spread when anonymous/unconfigured).
            ...(await authHeaders()),
          },
          body: JSON.stringify({
            v: 2,
            skillId: resolved.skillId,
            artifactTitle: resolved.title,
            brief,
            rubric: resolved.rubric,
            graderInstructions: resolved.graderInstructions,
            submission,
            previousSubmission: revision?.previousSubmission,
            previousVerdict: revision?.previousVerdict,
          }),
        });

        const data = (await r.json()) as {
          verdict?: ArtifactVerdictV2 | null;
          unavailable?: boolean;
          message?: string;
          error?: string;
        };

        if (!r.ok) {
          setState({
            ...INITIAL,
            error:
              data.error ??
              (r.status === 429
                ? 'You are sending submissions too quickly. Please wait a moment and try again.'
                : `Grading failed (HTTP ${r.status}).`),
          });
          return null;
        }

        if (data.unavailable) {
          setState({ ...INITIAL, unavailable: data.message ?? 'Grading is unavailable.' });
          return null;
        }

        if (data.verdict) {
          setState({ ...INITIAL, verdict: data.verdict });
          return data.verdict;
        }

        // Model replied but not as parseable JSON: soft error so the learner can
        // retry, with their draft preserved.
        setState({
          ...INITIAL,
          error: 'Grading came back in an unexpected format. Please try again.',
        });
        return null;
      } catch (e) {
        setState({
          ...INITIAL,
          error: e instanceof Error ? e.message : 'Request failed',
        });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, grade, reset };
}
