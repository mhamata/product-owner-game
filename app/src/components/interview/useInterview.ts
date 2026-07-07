'use client';

import { useCallback, useRef, useState } from 'react';
import type { HiringBand, InterviewMessage } from '@/curriculum/interview';

/**
 * Client hook for the mock-interview round-trips, mirroring `useRoleplay`'s shape
 * (per-session token, explicit tagged terminal states) against the two server
 * actions the `/api/interview` route exposes:
 *  - `sendReply(caseId, messages)`: post the transcript and get the interviewer's
 *    next probe.
 *  - `score(caseId, messages)`: grade the finished transcript into a hiring
 *    committee scorecard.
 *
 * ONE DELIBERATE DIFFERENCE FROM `useRoleplay`: the client sends only a `caseId`.
 * The interviewer brief holds the case's answers (the seeded root cause, the
 * follow-up ladder), so it is looked up SERVER-SIDE and must never leave the
 * server — the client never sees it and cannot substitute its own.
 *
 * Each call resolves to a small tagged result so the component can branch
 * cleanly. The three cross-cutting outcomes match the other AI modalities:
 *  - a success payload (`reply` text, or a `scorecard`),
 *  - `unavailable`: the modality is off (no API key, at capacity, or the monthly
 *    allowance is spent); a calm, NON-error fallback so the transcript is kept,
 *  - `error`: a real failure (rate limit, the server turn-cap 409, network, model).
 *
 * A per-session token is sent so the rate limiter budgets per candidate rather
 * than per shared office IP. It is a random id kept only in memory for this tab.
 */

/** One scored dimension of the hiring-committee scorecard (client shape). */
export interface DimensionVerdict {
  id: string;
  label: string;
  /** 0-3 band: 0 no-hire signal, 1 lean no, 2 lean hire, 3 strong hire. */
  score: number;
  /** The committee verdict label, derived server-side from the band. */
  band: HiringBand;
  comment: string;
  /** Candidate turn numbers ([1]-based) where the evidence lives. */
  evidenceTurns: number[];
}

/** The full committee scorecard the score action returns. */
export interface InterviewScorecard {
  dimensions: DimensionVerdict[];
  strengths: string[];
  gaps: string[];
  /** The "would this candidate advance" hiring-committee paragraph. */
  committee: string;
  /** Overall recommendation, one of the four hiring bands. */
  recommendation: HiringBand;
  /** 0-100 rollup, same scale as every other Praxis verdict. */
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
  | { kind: 'scorecard'; scorecard: InterviewScorecard }
  | { kind: 'unavailable'; message: string }
  | { kind: 'error'; message: string };

/** One stable random session id per mounted interview (memory only). */
function makeSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

interface InterviewApiResponse {
  reply?: string;
  scorecard?: InterviewScorecard | null;
  unavailable?: boolean;
  message?: string;
  error?: string;
  turnLimitReached?: boolean;
}

export function useInterview() {
  // `sending` covers a pending interviewer reply; `scoring` covers a pending
  // grade. They are tracked separately so the chat input and the "end interview"
  // button can show their own busy state without blocking each other.
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
    data: InterviewApiResponse;
  }> {
    // Reading the ref inside this async helper (not during render) is the allowed
    // pattern; the render-time guard above guarantees it is set, the fallback is
    // purely defensive so the header is never empty.
    const session = sessionId.current ?? makeSessionId();
    const r = await fetch('/api/interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-praxis-session': session,
      },
      body: JSON.stringify(payload),
    });
    const data = (await r.json().catch(() => ({}))) as InterviewApiResponse;
    return { ok: r.ok, status: r.status, data };
  }

  const sendReply = useCallback(
    async (caseId: string, messages: InterviewMessage[]): Promise<ReplyResult> => {
      setSending(true);
      try {
        const { ok, status, data } = await post({
          action: 'reply',
          caseId,
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
                data.error ?? 'The interview is over — end it and get your scorecard.',
            };
          }
          return {
            kind: 'error',
            message:
              data.error ??
              (status === 429
                ? 'You are sending messages too quickly. Please wait a moment and try again.'
                : `The interviewer could not respond (HTTP ${status}).`),
          };
        }

        if (data.unavailable) {
          return { kind: 'unavailable', message: data.message ?? 'Interviews are unavailable.' };
        }
        if (data.reply) {
          return { kind: 'reply', text: data.reply };
        }
        return { kind: 'error', message: 'The interviewer did not respond. Please try again.' };
      } catch (e) {
        return { kind: 'error', message: e instanceof Error ? e.message : 'Request failed' };
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const score = useCallback(
    async (caseId: string, messages: InterviewMessage[]): Promise<ScoreResult> => {
      setScoring(true);
      try {
        const { ok, status, data } = await post({
          action: 'score',
          caseId,
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
        if (data.scorecard) {
          return { kind: 'scorecard', scorecard: data.scorecard };
        }
        // The model replied but not as parseable JSON: a soft "try again" state,
        // transcript preserved (mirrors the route's `scorecard: null` fallback).
        return {
          kind: 'error',
          message: 'The scorecard came back in an unexpected format. Please try again.',
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
