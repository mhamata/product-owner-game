'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IterationOutcome } from '@/engine/types';

/**
 * DECISION LOG: the Career File's raw material.
 *
 * Every sprint a player commits, we capture a small, factual record of the
 * call they made — the goal, what they chose to build, whether they released,
 * and (optionally) the one-line "why" — at the MOMENT of commit, not
 * reconstructed after the fact from other state. Event responses made during
 * that sprint's review, and a short outcome summary once the roll resolves,
 * are folded into the same entry so a sprint's whole story lives in one place.
 *
 * This is deliberately separate from `gameStore`'s `eventLog` (engine state,
 * reset on restart / not designed for cross-run history) and from
 * `simEvidenceStore` (a competency score, not a narrative record). The
 * decision log is display/interview material: design-sim-2.0.md §2.4's
 * "Evidence Engine" leans on exactly this shape for the Career File and the
 * interview-ammo generator.
 *
 * Persistence mirrors every other sim store (zustand + localStorage, a
 * `hasHydrated` flag for SSR-safe first paint). Storage is capped at
 * `MAX_ENTRIES` total, oldest-first eviction (FIFO), so a long play history
 * cannot grow localStorage unbounded — 400 entries is generous headroom (the
 * longest scenario today is 7 sprints; even dozens of full playthroughs stay
 * well under the cap) while still bounding worst-case size.
 *
 * `interviewStories` is the ONE piece of AI-touched state this store carries:
 * the STAR stories `/api/interview-ammo` drafts from a run's entries, keyed by
 * runId so `/report`'s Career File can persist a draft across navigation
 * without re-spending a model call. Everything else in this file stays pure
 * player data.
 */

/** Total entries kept across every run. Oldest entries are evicted first. */
export const MAX_ENTRIES = 400;

export interface DecisionLogEventResponse {
  /** What the event was, in the player's own read (its narrative). */
  event: string;
  /** The option label the player picked. */
  choice: string;
}

export interface DecisionLogOutcome {
  /** A short, factual line derived from the engine's IterationOutcome. */
  summary: string;
}

export interface DecisionLogEntry {
  /** Stable per-run id: scenarioId + seed (see `runIdFor`). */
  runId: string;
  scenarioId: string;
  industry: string | null;
  /** 1-based iteration number. */
  sprint: number;
  /** ISO timestamp, set at commit. */
  committedAt: string;
  sprintGoal: string | null;
  /** Committed backlog item titles (display titles; excludes the release card). */
  backlogTitles: string[];
  /** The release card's title if placed this sprint, else null. */
  releaseCard: string | null;
  eventResponses: DecisionLogEventResponse[];
  /** The optional one-line "why", captured at commit. */
  rationale: string | null;
  /** Filled after the review phase resolves; null until then. */
  outcome: DecisionLogOutcome | null;
  /**
   * Sim 2.0 W5-J: the optional in-sim "write the launch PRD" moment's graded
   * `overallScore` (0-100), when the player wrote and graded a PRD for this
   * sprint's release via the existing `/api/grade-artifact` v2 route. Additive
   * and optional — absent on every entry logged before this field existed,
   * and on any sprint that never released or where the player skipped the
   * moment. Purely a Career File record; the *engine* effect of this score
   * (engine/releasePrep.ts's `set-release-prep` action) is applied
   * separately, at commit time, and does not read this field back.
   */
  artifactGrade?: number;
}

/** The fields the caller supplies at commit; the rest are derived/defaulted. */
export type NewDecisionLogEntry = Pick<
  DecisionLogEntry,
  | 'runId'
  | 'scenarioId'
  | 'industry'
  | 'sprint'
  | 'sprintGoal'
  | 'backlogTitles'
  | 'releaseCard'
  | 'rationale'
  | 'artifactGrade'
>;

/** Stable per-run id: pairs a scenario with the seed that made the run unique. */
export function runIdFor(scenarioId: string, seed: string): string {
  return `${scenarioId}::${seed}`;
}

/**
 * PURE: append a new entry (committedAt defaults to now; eventResponses starts
 * empty; outcome starts null), capped at MAX_ENTRIES via oldest-first eviction.
 */
export function appendEntryPure(
  entries: DecisionLogEntry[],
  input: NewDecisionLogEntry,
  committedAt: string = new Date().toISOString(),
): DecisionLogEntry[] {
  const entry: DecisionLogEntry = {
    ...input,
    committedAt,
    eventResponses: [],
    outcome: null,
  };
  const next = [...entries, entry];
  return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
}

/** Index of the most recent entry belonging to a run, or -1 if it has none. */
function latestIndexForRun(entries: DecisionLogEntry[], runId: string): number {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i].runId === runId) return i;
  }
  return -1;
}

/**
 * PURE: append an event response to the latest entry of a run. A no-op
 * (returns the input array unchanged) when the run has no entries yet — never
 * throws, so a stale/mismatched runId never blocks the sim.
 */
export function recordEventResponsePure(
  entries: DecisionLogEntry[],
  runId: string,
  response: DecisionLogEventResponse,
): DecisionLogEntry[] {
  const idx = latestIndexForRun(entries, runId);
  if (idx === -1) return entries;
  const next = [...entries];
  next[idx] = { ...next[idx], eventResponses: [...next[idx].eventResponses, response] };
  return next;
}

/**
 * PURE: attach the resolved outcome summary to the latest entry of a run.
 * No-op when the run has no entries. Overwrites rather than appends, so
 * calling it more than once for the same sprint (e.g. a re-render) is safe.
 */
export function attachOutcomePure(
  entries: DecisionLogEntry[],
  runId: string,
  outcome: DecisionLogOutcome,
): DecisionLogEntry[] {
  const idx = latestIndexForRun(entries, runId);
  if (idx === -1) return entries;
  const next = [...entries];
  next[idx] = { ...next[idx], outcome };
  return next;
}

/** PURE: every entry belonging to a run, in commit order. */
export function selectEntriesForRun(entries: DecisionLogEntry[], runId: string): DecisionLogEntry[] {
  return entries.filter((e) => e.runId === runId);
}

/** PURE: drop every entry belonging to a run. */
export function clearRunPure(entries: DecisionLogEntry[], runId: string): DecisionLogEntry[] {
  return entries.filter((e) => e.runId !== runId);
}

/**
 * One mentor-drafted STAR story (design-sim-2.0.md §2.4's "interview-ammo
 * generator"), as returned by `/api/interview-ammo` and persisted here so a
 * learner does not lose a draft on navigation. `draftedAt` is stamped
 * client-side at save time (the route itself is stateless), purely for stable
 * display ordering — it is never sent back to the model.
 */
export interface InterviewStoryRecord {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  /** Sprint numbers (from this run) the story draws its facts from. */
  sprints: number[];
  /** ISO timestamp, set when the story set was saved. */
  draftedAt: string;
}

/**
 * PURE: replace the drafted story set for one run. A plain overwrite (not a
 * merge) — redrafting a run is meant to replace its stories with a fresh,
 * up-to-date set, not accumulate stale ones.
 */
export function setInterviewStoriesPure(
  stories: Record<string, InterviewStoryRecord[]>,
  runId: string,
  next: InterviewStoryRecord[],
): Record<string, InterviewStoryRecord[]> {
  return { ...stories, [runId]: next };
}

/** PURE: drop the story set for a run, e.g. alongside its decision-log entries. */
export function clearInterviewStoriesPure(
  stories: Record<string, InterviewStoryRecord[]>,
  runId: string,
): Record<string, InterviewStoryRecord[]> {
  if (!(runId in stories)) return stories;
  const next = { ...stories };
  delete next[runId];
  return next;
}

/**
 * One drafted multi-party QBR meeting (design-sim-2.0.md §2.1/§2.4's
 * "quarterly boss battle"), as returned by `/api/qbr` and persisted here so a
 * player does not lose the meeting — or re-spend a model call — on
 * navigation. Exactly one per run (a plain overwrite on redraft), mirroring
 * `interviewStories`'s per-run persistence but singular: a season has one
 * QBR, not an accumulating list. `speakerId`s are the run's own roster person
 * ids (`state.people`); the UI resolves display name/role from the roster at
 * render time, the same way `InterviewStoryRecord.sprints` are just numbers
 * the UI cross-references, not denormalized copies.
 */
export interface QBRMeetingTurn {
  speakerId: string;
  text: string;
}

export interface QBRMeetingRecord {
  turns: QBRMeetingTurn[];
  closingLine: string;
  /** ISO timestamp, set when the meeting was saved. */
  draftedAt: string;
}

/** PURE: replace the drafted QBR meeting for one run (redraft overwrites). */
export function setQbrMeetingPure(
  meetings: Record<string, QBRMeetingRecord>,
  runId: string,
  next: QBRMeetingRecord,
): Record<string, QBRMeetingRecord> {
  return { ...meetings, [runId]: next };
}

/** PURE: drop the drafted QBR meeting for a run, e.g. alongside its decision-log entries. */
export function clearQbrMeetingPure(
  meetings: Record<string, QBRMeetingRecord>,
  runId: string,
): Record<string, QBRMeetingRecord> {
  if (!(runId in meetings)) return meetings;
  const next = { ...meetings };
  delete next[runId];
  return next;
}

/**
 * PURE: a short, factual one-line outcome summary built only from data the
 * engine already computed on `IterationOutcome` — no invented numbers. Mirrors
 * the shipped/slipped/revenue language `OutcomeStep` already shows the player,
 * so the Career File entry reads consistent with the in-sim recap.
 */
export function deriveOutcomeSummary(outcome: IterationOutcome): string {
  // Both counts exclude the release card: "shipped"/"slipped" describe work
  // items, and a release that didn't fit already shows up as missing revenue.
  const shipped = outcome.done.filter((p) => p.kind !== 'release-card').length;
  const slipped = outcome.notDone.filter((p) => p.kind !== 'release-card').length;

  const parts: string[] = [shipped === 1 ? '1 item shipped' : `${shipped} items shipped`];
  if (slipped > 0) parts.push(slipped === 1 ? '1 slipped' : `${slipped} slipped`);
  if (outcome.revenueEarned > 0) parts.push(`+$${outcome.revenueEarned.toLocaleString()} revenue`);
  if (outcome.releasedProducts.length > 0) {
    parts.push(
      outcome.releasedProducts.length === 1
        ? '1 product released'
        : `${outcome.releasedProducts.length} products released`,
    );
  }
  return parts.join(', ');
}

interface DecisionLogState {
  entries: DecisionLogEntry[];
  /** Drafted interview-ammo STAR stories, keyed by runId. */
  interviewStories: Record<string, InterviewStoryRecord[]>;
  /** Drafted multi-party QBR meetings, keyed by runId (one per run). */
  qbrMeetings: Record<string, QBRMeetingRecord>;
  hasHydrated: boolean;
}

interface DecisionLogActions {
  /** Record a commit-time decision as a new entry. */
  appendEntry: (input: NewDecisionLogEntry) => void;
  /** Attach an event response to the current sprint's entry for a run. */
  recordEventResponse: (runId: string, response: DecisionLogEventResponse) => void;
  /** Attach the resolved outcome summary to the current sprint's entry. */
  attachOutcome: (runId: string, outcome: DecisionLogOutcome) => void;
  /** Every entry for a run, in commit order. */
  entriesForRun: (runId: string) => DecisionLogEntry[];
  /** Replace the drafted interview stories for a run (a fresh draft overwrites). */
  setInterviewStories: (runId: string, stories: InterviewStoryRecord[]) => void;
  /** The drafted interview stories for a run, or an empty array if none yet. */
  interviewStoriesForRun: (runId: string) => InterviewStoryRecord[];
  /** Replace the drafted QBR meeting for a run (a fresh convene overwrites). */
  setQbrMeeting: (runId: string, meeting: QBRMeetingRecord) => void;
  /** The drafted QBR meeting for a run, or null if none yet. */
  qbrMeetingForRun: (runId: string) => QBRMeetingRecord | null;
  /** Drop every entry belonging to a run (e.g. restarting a scenario). */
  clearRun: (runId: string) => void;
  reset: () => void;
  _setHydrated: () => void;
}

export type DecisionLogStore = DecisionLogState & DecisionLogActions;

export const useDecisionLogStore = create<DecisionLogStore>()(
  persist(
    (set, get) => ({
      entries: [],
      interviewStories: {},
      qbrMeetings: {},
      hasHydrated: false,

      appendEntry: (input) => set((s) => ({ entries: appendEntryPure(s.entries, input) })),

      recordEventResponse: (runId, response) =>
        set((s) => ({ entries: recordEventResponsePure(s.entries, runId, response) })),

      attachOutcome: (runId, outcome) =>
        set((s) => ({ entries: attachOutcomePure(s.entries, runId, outcome) })),

      entriesForRun: (runId) => selectEntriesForRun(get().entries, runId),

      setInterviewStories: (runId, stories) =>
        set((s) => ({ interviewStories: setInterviewStoriesPure(s.interviewStories, runId, stories) })),

      interviewStoriesForRun: (runId) => get().interviewStories[runId] ?? [],

      setQbrMeeting: (runId, meeting) =>
        set((s) => ({ qbrMeetings: setQbrMeetingPure(s.qbrMeetings, runId, meeting) })),

      qbrMeetingForRun: (runId) => get().qbrMeetings[runId] ?? null,

      // Clears the run's decisions AND any drafted stories/meeting built from
      // them, so a restarted scenario does not leave orphaned AI-drafted
      // content pointing at sprints that no longer exist in the log.
      clearRun: (runId) =>
        set((s) => ({
          entries: clearRunPure(s.entries, runId),
          interviewStories: clearInterviewStoriesPure(s.interviewStories, runId),
          qbrMeetings: clearQbrMeetingPure(s.qbrMeetings, runId),
        })),

      reset: () => set({ entries: [], interviewStories: {}, qbrMeetings: {} }),
      _setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'praxis-decision-log-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ entries: s.entries, interviewStories: s.interviewStories, qbrMeetings: s.qbrMeetings }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
