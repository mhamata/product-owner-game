'use client';

import { useCallback, useRef, useState } from 'react';
import type { ResolvedArtifact } from '@/curriculum/artifacts';

/**
 * Client hook for the artifact grading round-trip, mirroring `useLLMGrade` but
 * typed to the `/api/grade-artifact` verdict shape.
 *
 * The three terminal states the UI cares about are explicit:
 *  - `verdict`:      a structured rubric result (criteria + strengths/gaps/overall)
 *  - `unavailable`:  grading is off (no API key in this environment); a calm,
 *                    NON-error fallback so the learner's draft is preserved
 *  - `error`:        a real failure (rate limit, network, model error)
 *
 * A per-session token is sent so the rate limiter can budget per learner rather
 * than per shared office IP. It is a random id kept only in memory for this tab.
 */

/** Per-criterion verdict returned by the grader. */
export interface CriterionVerdict {
  id: string;
  label: string;
  /** 0-3 band. */
  score: number;
  comment: string;
}

export interface ArtifactVerdict {
  criteria: CriterionVerdict[];
  strengths: string[];
  gaps: string[];
  overall: string;
  /** 0-100 rollup. */
  overallScore: number;
  passed: boolean;
}

export interface ArtifactGradeState {
  verdict: ArtifactVerdict | null;
  /** Set when grading is off (no key). Carries the calm fallback message. */
  unavailable: string | null;
  /** Set on a real error (rate limit, network, model). */
  error: string | null;
  loading: boolean;
}

const INITIAL: ArtifactGradeState = {
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

export function useArtifactGrade() {
  const [state, setState] = useState<ArtifactGradeState>(INITIAL);
  // Lazy-init the per-tab session id exactly once. The `== null` guard is the
  // pattern react-hooks/refs expects for one-time ref initialization (a falsy
  // empty-string seed would trip the "no ref access during render" rule).
  const sessionId = useRef<string | null>(null);
  if (sessionId.current == null) sessionId.current = makeSessionId();

  const grade = useCallback(
    async (resolved: ResolvedArtifact, brief: string, submission: string) => {
      setState({ ...INITIAL, loading: true });
      try {
        // Reading the ref inside the callback (not during render) is the allowed
        // pattern; the render-time guard above guarantees it is set, the fallback
        // is purely defensive so the header is never empty.
        const session = sessionId.current ?? makeSessionId();
        const r = await fetch('/api/grade-artifact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-praxis-session': session,
          },
          body: JSON.stringify({
            skillId: resolved.skillId,
            artifactTitle: resolved.title,
            brief,
            rubric: resolved.rubric,
            graderInstructions: resolved.graderInstructions,
            submission,
          }),
        });

        const data = (await r.json()) as {
          verdict?: ArtifactVerdict | null;
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
          return;
        }

        if (data.unavailable) {
          setState({ ...INITIAL, unavailable: data.message ?? 'Grading is unavailable.' });
          return;
        }

        if (data.verdict) {
          setState({ ...INITIAL, verdict: data.verdict });
          return;
        }

        // Model replied but not as parseable JSON: treat as a soft error so the
        // learner can retry, with their draft preserved.
        setState({
          ...INITIAL,
          error: 'Grading came back in an unexpected format. Please try again.',
        });
      } catch (e) {
        setState({
          ...INITIAL,
          error: e instanceof Error ? e.message : 'Request failed',
        });
      }
    },
    [],
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, grade, reset };
}
