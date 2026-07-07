'use client';

import { useCallback, useRef, useState } from 'react';
import { authHeaders } from '@/lib/supabase/client';
import type { ResolvedRoleplay } from '@/curriculum/roleplay';
import type { RoleplayMessage } from '@/curriculum/roleplay';

/**
 * Client hook for the roleplay round-trips, mirroring `useArtifactGrade`'s shape
 * (per-session token, explicit terminal states) but covering the modality's two
 * server actions:
 *  - `sendReply(scenario, messages)`: post the conversation and get the
 *    character's next line.
 *  - `score(scenario, messages)`: grade the finished conversation.
 *
 * Each call resolves to a small tagged result so the component can branch
 * cleanly. The three cross-cutting outcomes match the artifact grader:
 *  - a success payload (`reply` text, or a `verdict`),
 *  - `unavailable`: the modality is off (no API key); a calm, NON-error fallback
 *    so the learner's conversation is preserved,
 *  - `error`: a real failure (rate limit, the server turn-cap 409, network, model).
 *
 * A per-session token is sent so the rate limiter budgets per learner rather than
 * per shared office IP. It is a random id kept only in memory for this tab.
 */

/** Per-criterion verdict returned by the score action. */
export interface CriterionVerdict {
  id: string;
  label: string;
  /** 0-3 band. */
  score: number;
  comment: string;
}

export interface RoleplayVerdict {
  criteria: CriterionVerdict[];
  strengths: string[];
  gaps: string[];
  overall: string;
  /** 0-100 rollup. */
  overallScore: number;
  passed: boolean;
}

/** Result of a `reply` round-trip. Exactly one of the outcome fields is set. */
export type ReplyResult =
  | { kind: 'reply'; text: string }
  | { kind: 'unavailable'; message: string }
  | { kind: 'error'; message: string; turnLimitReached?: boolean };

/** Result of a `score` round-trip. Exactly one of the outcome fields is set. */
export type ScoreResult =
  | { kind: 'verdict'; verdict: RoleplayVerdict }
  | { kind: 'unavailable'; message: string }
  | { kind: 'error'; message: string };

/** One stable random session id per mounted lesson (memory only). */
function makeSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

interface RoleplayApiResponse {
  reply?: string;
  verdict?: RoleplayVerdict | null;
  unavailable?: boolean;
  message?: string;
  error?: string;
  turnLimitReached?: boolean;
}

export function useRoleplay() {
  // `sending` covers a pending character reply; `scoring` covers a pending grade.
  // They are tracked separately so the chat input and the wrap-up button can show
  // their own busy state without blocking each other's affordance.
  const [sending, setSending] = useState(false);
  const [scoring, setScoring] = useState(false);
  // Lazy-init the per-tab session id exactly once. The `== null` guard is the
  // pattern react-hooks/refs expects for one-time ref initialization (a falsy
  // empty-string seed would trip the "no ref access during render" rule).
  const sessionId = useRef<string | null>(null);
  if (sessionId.current == null) sessionId.current = makeSessionId();

  async function post(payload: unknown): Promise<{
    ok: boolean;
    status: number;
    data: RoleplayApiResponse;
  }> {
    // Reading the ref inside this async helper (not during render) is the allowed
    // pattern; the render-time guard above guarantees it is set, the fallback is
    // purely defensive so the header is never empty.
    const session = sessionId.current ?? makeSessionId();
    const r = await fetch('/api/roleplay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-praxis-session': session,
        // Bearer token when signed in (empty spread when anonymous/unconfigured).
        ...(await authHeaders()),
      },
      body: JSON.stringify(payload),
    });
    const data = (await r.json().catch(() => ({}))) as RoleplayApiResponse;
    return { ok: r.ok, status: r.status, data };
  }

  const sendReply = useCallback(
    async (
      scenario: ResolvedRoleplay,
      messages: RoleplayMessage[],
    ): Promise<ReplyResult> => {
      setSending(true);
      try {
        const { ok, status, data } = await post({
          action: 'reply',
          skillId: scenario.skillId,
          persona: scenario.persona,
          characterName: scenario.characterName,
          messages,
        });

        if (!ok) {
          // 409 is the server turn cap: surface it as a distinct signal so the UI
          // can force the wrap-up instead of reading it as a generic error.
          if (status === 409 || data.turnLimitReached) {
            return {
              kind: 'error',
              turnLimitReached: true,
              message:
                data.error ?? 'You have reached the turn limit. Wrap up and get scored.',
            };
          }
          return {
            kind: 'error',
            message:
              data.error ??
              (status === 429
                ? 'You are sending messages too quickly. Please wait a moment and try again.'
                : `The character could not respond (HTTP ${status}).`),
          };
        }

        if (data.unavailable) {
          return { kind: 'unavailable', message: data.message ?? 'Roleplay is unavailable.' };
        }
        if (data.reply) {
          return { kind: 'reply', text: data.reply };
        }
        return { kind: 'error', message: 'The character did not respond. Please try again.' };
      } catch (e) {
        return { kind: 'error', message: e instanceof Error ? e.message : 'Request failed' };
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const score = useCallback(
    async (
      scenario: ResolvedRoleplay,
      messages: RoleplayMessage[],
    ): Promise<ScoreResult> => {
      setScoring(true);
      try {
        const { ok, status, data } = await post({
          action: 'score',
          skillId: scenario.skillId,
          scenarioTitle: scenario.title,
          goal: scenario.goal.join(' '),
          rubric: scenario.rubric,
          messages,
        });

        if (!ok) {
          return {
            kind: 'error',
            message:
              data.error ??
              (status === 429
                ? 'You are sending requests too quickly. Please wait a moment and try again.'
                : `Scoring failed (HTTP ${status}).`),
          };
        }
        if (data.unavailable) {
          return { kind: 'unavailable', message: data.message ?? 'Scoring is unavailable.' };
        }
        if (data.verdict) {
          return { kind: 'verdict', verdict: data.verdict };
        }
        return {
          kind: 'error',
          message: 'Scoring came back in an unexpected format. Please try again.',
        };
      } catch (e) {
        return { kind: 'error', message: e instanceof Error ? e.message : 'Request failed' };
      } finally {
        setScoring(false);
      }
    },
    [],
  );

  return { sending, scoring, sendReply, score };
}
