import type {
  Annotation,
  AnnotationSeverity,
  ArtifactVerdictV2,
} from './artifactGraderV2';

/**
 * Pure helpers for the V2 revise-and-resubmit UI: version bookkeeping (persisted
 * to localStorage per skill), the score trajectory, and the small display maps
 * the inline annotations lean on. Kept free of React so the numbering, the
 * version cap, and the persistence round-trip are unit-testable in the node
 * test env — the lesson component is a thin renderer over these.
 */

/** The most versions a learner may submit for one artifact (v1 → v2 → v3). */
export const MAX_VERSIONS = 3;

/** localStorage key namespace for persisted artifact versions, per skill. */
const STORAGE_PREFIX = 'praxis:artifact-v2:';

/** The stored form of a single graded submission. */
export interface StoredVersion {
  /** 1-based version number (1 = first submission). */
  version: number;
  /** The composed submission text that was graded. */
  submission: string;
  /** The verdict returned for it (null if grading came back unparseable). */
  verdict: ArtifactVerdictV2 | null;
  /** When it was graded (ms epoch), for ordering/debugging. */
  gradedAt: number;
}

/** The full persisted record for one artifact skill. */
export interface VersionHistory {
  skillId: string;
  versions: StoredVersion[];
}

/** Compose the per-skill storage key. Exported so tests can assert the shape. */
export function storageKey(skillId: string): string {
  return `${STORAGE_PREFIX}${skillId}`;
}

/**
 * True when the learner may submit another version. The FIRST submission always
 * counts as version 1, so a fresh history (0 stored) can submit, and we stop
 * once MAX_VERSIONS have been graded.
 */
export function canSubmitAnother(history: VersionHistory): boolean {
  return history.versions.length < MAX_VERSIONS;
}

/** The version number the NEXT submission will take (1-based). */
export function nextVersionNumber(history: VersionHistory): number {
  return history.versions.length + 1;
}

/** The most recent stored version, or undefined when none has been graded. */
export function latestVersion(history: VersionHistory): StoredVersion | undefined {
  return history.versions[history.versions.length - 1];
}

/**
 * Append a graded version, returning a NEW history (never mutates the input) so
 * React state updates stay predictable. Silently ignores appends past the cap so
 * a double-submit cannot overflow the trajectory.
 */
export function appendVersion(
  history: VersionHistory,
  submission: string,
  verdict: ArtifactVerdictV2 | null,
  gradedAt: number,
): VersionHistory {
  if (history.versions.length >= MAX_VERSIONS) return history;
  const version: StoredVersion = {
    version: history.versions.length + 1,
    submission,
    verdict,
    gradedAt,
  };
  return { ...history, versions: [...history.versions, version] };
}

/**
 * The overall-score at each version, in order, for the "v1 → v2" trajectory.
 * Versions whose grading came back unparseable (verdict null) contribute null,
 * so the caller can render a gap rather than a fake zero.
 */
export function scoreTrajectory(history: VersionHistory): (number | null)[] {
  return history.versions.map((v) => v.verdict?.overallScore ?? null);
}

/* ------------------------------------------------------------------
   PERSISTENCE. Guarded so a private-mode / disabled-storage browser degrades to
   an in-memory session rather than throwing.
   ------------------------------------------------------------------ */

/** Read the persisted history for a skill, or an empty one when absent/corrupt. */
export function loadVersionHistory(skillId: string): VersionHistory {
  const empty: VersionHistory = { skillId, versions: [] };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(storageKey(skillId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as unknown;
    return coerceHistory(skillId, parsed);
  } catch {
    return empty;
  }
}

/** Persist the history for a skill. No-ops (and never throws) when storage fails. */
export function saveVersionHistory(history: VersionHistory): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(history.skillId), JSON.stringify(history));
  } catch {
    // Storage full or blocked (private mode): fall back to session-only memory.
  }
}

/** Clear the persisted history for a skill (used by "start over"). */
export function clearVersionHistory(skillId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey(skillId));
  } catch {
    // ignore
  }
}

/** Defensively coerce parsed JSON back into a VersionHistory, capping length. */
function coerceHistory(skillId: string, parsed: unknown): VersionHistory {
  const empty: VersionHistory = { skillId, versions: [] };
  if (!parsed || typeof parsed !== 'object') return empty;
  const rawVersions = (parsed as { versions?: unknown }).versions;
  if (!Array.isArray(rawVersions)) return empty;

  const versions: StoredVersion[] = [];
  for (const raw of rawVersions) {
    if (versions.length >= MAX_VERSIONS) break;
    if (!raw || typeof raw !== 'object') continue;
    const v = raw as Record<string, unknown>;
    const submission = typeof v.submission === 'string' ? v.submission : '';
    if (submission.length === 0) continue;
    versions.push({
      version: versions.length + 1,
      submission,
      verdict: (v.verdict as ArtifactVerdictV2 | null) ?? null,
      gradedAt: typeof v.gradedAt === 'number' ? v.gradedAt : 0,
    });
  }
  return { skillId, versions };
}

/* ------------------------------------------------------------------
   DISPLAY. The severity → (label, tone) map the inline annotations render with.
   Colour is always paired with a word + icon in the component; this is the
   single source of that pairing, so the mapping is testable.
   ------------------------------------------------------------------ */

/** Semantic tone tokens shared with the rest of the verdict UI. */
export type AnnotationTone = 'bad' | 'warn' | 'good';

/** Metadata for one annotation severity: the tone token + the human word. */
export interface SeverityMeta {
  tone: AnnotationTone;
  label: string;
}

export function severityMeta(severity: AnnotationSeverity): SeverityMeta {
  switch (severity) {
    case 'major':
      return { tone: 'bad', label: 'Major' };
    case 'minor':
      return { tone: 'warn', label: 'Minor' };
    case 'praise':
      return { tone: 'good', label: 'Praise' };
  }
}

/**
 * Group annotations by the block they anchor to, preserving annotation order
 * within a block, so the UI can render each block once with all its notes
 * beneath it. Returns a Map keyed by 1-based block index.
 */
export function annotationsByBlock(
  annotations: Annotation[],
): Map<number, Annotation[]> {
  const byBlock = new Map<number, Annotation[]>();
  for (const a of annotations) {
    const list = byBlock.get(a.block) ?? [];
    list.push(a);
    byBlock.set(a.block, list);
  }
  return byBlock;
}
