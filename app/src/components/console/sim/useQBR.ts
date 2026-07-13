'use client';

import { useCallback, useState } from 'react';
import { authHeaders } from '@/lib/supabase/client';

/**
 * Client hook for the `/api/qbr` round-trip (the Season tab's "Convene the
 * QBR" button — design-sim-2.0.md §2.1/§2.4). Mirrors `useInterviewAmmo`'s
 * shape exactly: `authHeaders()` spread in for the bearer token when signed
 * in, and the same three-way outcome every AI modality in this app uses — a
 * success payload, a calm NON-error `unavailable` (no key / at capacity /
 * allowance spent), or a real `error` to retry. Nothing here is persisted;
 * the caller (`SeasonScreen`) owns saving a convened meeting into
 * `decisionLogStore`.
 */

export interface DraftedMeetingTurn {
  speakerId: string;
  text: string;
}

/** One convened QBR meeting, as the route returns it. */
export interface DraftedQBRMeeting {
  turns: DraftedMeetingTurn[];
  closingLine: string;
}

export type ConveneQBRResult =
  | { kind: 'meeting'; meeting: DraftedQBRMeeting }
  | { kind: 'unavailable'; message: string }
  | { kind: 'error'; message: string };

interface QBRApiResponse {
  meeting?: DraftedQBRMeeting | null;
  raw?: string;
  unavailable?: boolean;
  message?: string;
  error?: string;
}

/** The season-shaped payload SeasonScreen assembles for `/api/qbr`. */
export interface QBRSeasonInput {
  confidence: number;
  expectations: { id: string; label: string; status: string }[];
  scoreDims: {
    valueDelivered: number;
    customerLoyalty: number;
    teamHealth: number;
    stakeholderTrust: number;
    productIntegrity: number;
    total: number;
  };
  sprintFacts: unknown[];
}

export function useQBR() {
  const [convening, setConvening] = useState(false);

  const convene = useCallback(
    async (
      runId: string,
      scenarioTitle: string,
      roster: { id: string; name: string; roleLabel: string }[],
      season: QBRSeasonInput,
    ): Promise<ConveneQBRResult> => {
      setConvening(true);
      try {
        const r = await fetch('/api/qbr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Bearer token when signed in (empty spread when anonymous/unconfigured).
            ...(await authHeaders()),
          },
          body: JSON.stringify({ runId, scenarioTitle, roster, season }),
        });
        const data = (await r.json().catch(() => ({}))) as QBRApiResponse;

        if (!r.ok) {
          return {
            kind: 'error',
            message:
              data.error ??
              (r.status === 429
                ? 'You are convening too quickly. Please wait a moment and try again.'
                : `Could not convene the QBR (HTTP ${r.status}).`),
          };
        }
        if (data.unavailable) {
          return {
            kind: 'unavailable',
            message: data.message ?? 'The QBR meeting is unavailable.',
          };
        }
        if (data.meeting && data.meeting.turns.length > 0) {
          return { kind: 'meeting', meeting: data.meeting };
        }
        // The model replied but not as parseable JSON, or every turn was
        // dropped by normalization.
        return {
          kind: 'error',
          message: 'Nothing usable came back from the meeting. You can try convening it again.',
        };
      } catch (e) {
        return { kind: 'error', message: e instanceof Error ? e.message : 'Request failed' };
      } finally {
        setConvening(false);
      }
    },
    [],
  );

  return { convening, convene };
}
