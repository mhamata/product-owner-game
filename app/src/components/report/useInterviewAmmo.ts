'use client';

import { useCallback, useState } from 'react';
import { authHeaders } from '@/lib/supabase/client';
// Type-only: erased at compile time, so this hook does not pull the store's
// runtime (zustand/persist) into whatever bundles import just the type.
import type { DecisionLogEntry } from '@/store/decisionLogStore';

/**
 * Client hook for the interview-ammo round-trip (the Career File's "Draft
 * interview stories" button — design-sim-2.0.md §2.4). Mirrors `useInterview`'s
 * shape: `authHeaders()` spread in for the bearer token when signed in, and the
 * same three-way outcome every AI modality in this app uses — a success
 * payload, a calm NON-error `unavailable` (no key / at capacity / allowance
 * spent), or a real `error` to retry. Nothing here is persisted; the caller
 * (`CareerFileSection`) owns saving a successful draft into `decisionLogStore`.
 */

/** One mentor-drafted STAR story, as the route returns it. */
export interface DraftedStory {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  sprints: number[];
}

export type DraftStoriesResult =
  | { kind: 'stories'; stories: DraftedStory[] }
  | { kind: 'unavailable'; message: string }
  | { kind: 'error'; message: string };

interface AmmoApiResponse {
  stories?: DraftedStory[] | null;
  raw?: string;
  unavailable?: boolean;
  message?: string;
  error?: string;
}

export function useInterviewAmmo() {
  const [drafting, setDrafting] = useState(false);

  const draftStories = useCallback(
    async (
      runId: string,
      scenarioTitle: string,
      entries: DecisionLogEntry[],
    ): Promise<DraftStoriesResult> => {
      setDrafting(true);
      try {
        const r = await fetch('/api/interview-ammo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Bearer token when signed in (empty spread when anonymous/unconfigured).
            ...(await authHeaders()),
          },
          body: JSON.stringify({ runId, scenarioTitle, entries }),
        });
        const data = (await r.json().catch(() => ({}))) as AmmoApiResponse;

        if (!r.ok) {
          return {
            kind: 'error',
            message:
              data.error ??
              (r.status === 429
                ? 'You are drafting too quickly. Please wait a moment and try again.'
                : `Could not draft interview stories (HTTP ${r.status}).`),
          };
        }
        if (data.unavailable) {
          return {
            kind: 'unavailable',
            message: data.message ?? 'Interview-story drafting is unavailable.',
          };
        }
        if (data.stories && data.stories.length > 0) {
          return { kind: 'stories', stories: data.stories };
        }
        // The model replied but not as parseable JSON, or every story was
        // dropped by normalization (e.g. nothing usable to draft from yet).
        return {
          kind: 'error',
          message:
            'Nothing usable came back to draft from. Log a rationale on your next sprint and try again.',
        };
      } catch (e) {
        return { kind: 'error', message: e instanceof Error ? e.message : 'Request failed' };
      } finally {
        setDrafting(false);
      }
    },
    [],
  );

  return { drafting, draftStories };
}
