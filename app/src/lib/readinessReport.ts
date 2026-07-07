// Import from the LEAF `interview/types` module, never the `interview` barrel.
// The barrel pulls in `ALL_INTERVIEW_CASES` — the authored cases, each carrying
// its hidden `brief` (the case's answers). This module is reachable from the
// `/report` CLIENT component, so importing the band constants through the barrel
// would bundle every brief into the browser. The leaf module has no case content.
import type { InterviewMessage, HiringBand } from '@/curriculum/interview/types';
import { HIRING_BANDS } from '@/curriculum/interview/types';
import type { InterviewScorecard } from '@/components/interview/useInterview';
import type { ArtifactVerdictV2 } from './artifactGraderV2';
import {
  coerceVersionHistory,
  type StoredVersion,
  type VersionHistory,
} from './artifactVersionsV2';

/**
 * PURE report-assembly for the readiness report (Slice C).
 *
 * The readiness report is the shareable credential: it aggregates the AI-graded
 * work a learner has actually produced — scored mock interviews and graded
 * artifacts — into one inspectable record. This module owns the assembly: it
 * reads the two raw localStorage families the interview + artifact loops write
 * (`praxis:interview:<caseId>`, `praxis:artifact-v2:<skillId>`), keeps only the
 * entries that carry a real grade, and derives a small summary.
 *
 * DESIGN INTENT + CONSTRAINTS
 * ---------------------------
 * - REACT-FREE and node-testable: assembly runs against an injected storage-like
 *   map (or `window.localStorage` in the browser), so the keep/skip rules, the
 *   ordering, and the corrupt-input handling are pinned by unit tests without a
 *   DOM. The `/report` client component is a thin renderer over `assembleReport`.
 * - DERIVED, NEVER INVENTED: the summary is counts + bands read straight off the
 *   grades. There is deliberately NO composite "readiness rating" — this
 *   product's credibility rule is that numbers are earned. The honest credential
 *   is the attached work, not a manufactured score.
 * - DEFENSIVE: every parse is guarded; a corrupt or half-written entry is
 *   skipped, never allowed to throw the whole report away.
 */

/* ------------------------------------------------------------------
   STORAGE SEAM. The two raw families the report reads. Both are already on the
   sync allowlist (`praxis:interview:*`, `praxis:artifact-v2:*`), so a signed-in
   learner's graded history is present locally to assemble from.
   ------------------------------------------------------------------ */

const INTERVIEW_PREFIX = 'praxis:interview:';
const ARTIFACT_PREFIX = 'praxis:artifact-v2:';

/**
 * The minimal storage surface `assembleReport` needs: enumerate the keys and
 * read a value. `window.localStorage` satisfies this, and so does a plain object
 * or a `Map`-backed stub in tests — so assembly never touches a real DOM.
 */
export interface ReadableStorage {
  /** All keys currently stored (order need not be stable). */
  keys(): string[];
  /** The raw string for a key, or null when absent. */
  getItem(key: string): string | null;
}

/**
 * Wrap the browser `window.localStorage` as a `ReadableStorage`, or return null
 * off the server / when storage is unavailable. Guarded so a private-mode throw
 * degrades to "no report data" rather than crashing the render.
 */
export function browserStorage(): ReadableStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    const ls = window.localStorage;
    return {
      keys: () => {
        const out: string[] = [];
        for (let i = 0; i < ls.length; i += 1) {
          const k = ls.key(i);
          if (k !== null) out.push(k);
        }
        return out;
      },
      getItem: (key) => ls.getItem(key),
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------
   REPORT SHAPE.
   ------------------------------------------------------------------ */

/** One scored mock interview, ready to render. Only cases WITH a grade appear. */
export interface InterviewEntry {
  /** The case id (e.g. 'ps-renter-maintenance'), used to resolve public metadata. */
  caseId: string;
  /** The committee scorecard that was persisted when the interview was graded. */
  scorecard: InterviewScorecard;
  /** When it was graded (ms epoch); 0 when a legacy save lacked the timestamp. */
  scoredAt: number;
  /** The full transcript, so the report can attach the numbered work sample. */
  messages: InterviewMessage[];
}

/** One graded artifact skill, ready to render. Only skills WITH a grade appear. */
export interface ArtifactEntry {
  /** The skill id (e.g. 'prd-artifact'), used to resolve the artifact title. */
  skillId: string;
  /** The full stored version history (every submission + verdict). */
  history: VersionHistory;
  /** The latest verdict, or null when the most recent grading was unparseable. */
  latestVerdict: ArtifactVerdictV2 | null;
  /** The latest stored submission (the version whose verdict is `latestVerdict`). */
  latestVersion: StoredVersion;
  /** The overall-score at each version, in order (null where unparseable). */
  trajectory: (number | null)[];
}

/**
 * The derived summary strip. Every field is a plain count or a band read off the
 * grades — nothing here is a composite "rating". `bestInterviewBand` is the
 * strongest committee recommendation across scored interviews (or null when
 * none), so the strip can honestly say "your best result was a lean hire"
 * without averaging incomparable cases into a fake number.
 */
export interface ReportSummary {
  interviewsScored: number;
  artifactsGraded: number;
  /** Total artifact submissions across all skills (v1 + revisions). */
  revisionsSubmitted: number;
  /** How many graded artifacts cleared the pass bar (verdict.passed). */
  artifactsPassed: number;
  /** The strongest interview recommendation earned, or null when none scored. */
  bestInterviewBand: HiringBand | null;
}

/** The fully-assembled report the renderer consumes. */
export interface ReadinessReport {
  interviews: InterviewEntry[];
  artifacts: ArtifactEntry[];
  summary: ReportSummary;
  /** True when nothing at all has been graded (drives the calm empty state). */
  isEmpty: boolean;
}

/* ------------------------------------------------------------------
   INTERVIEW ASSEMBLY.
   ------------------------------------------------------------------ */

/**
 * Parse one `praxis:interview:<caseId>` value into an entry, or null to skip.
 * Kept only when it carries a real scorecard (an in-progress, ungraded save has
 * no credential value here). Fully defensive: corrupt JSON or a missing
 * scorecard yields null, never a throw.
 */
export function parseInterviewEntry(caseId: string, raw: string | null): InterviewEntry | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const record = parsed as Record<string, unknown>;

  const messages = Array.isArray(record.messages)
    ? (record.messages as InterviewMessage[])
    : [];
  const scorecard = record.scorecard;
  if (!isScorecardLike(scorecard)) return null;

  const scoredAt = typeof record.scoredAt === 'number' ? record.scoredAt : 0;
  return { caseId, scorecard, scoredAt, messages };
}

/**
 * A structural check that a value is a usable `InterviewScorecard`. We do not
 * re-validate every nested field (the score action already normalized it before
 * it was persisted); we only confirm the shape the renderer relies on so a
 * half-written blob is skipped rather than rendered as blanks.
 */
function isScorecardLike(value: unknown): value is InterviewScorecard {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    Array.isArray(s.dimensions) &&
    typeof s.recommendation === 'string' &&
    typeof s.overallScore === 'number'
  );
}

/** The caseId embedded in a `praxis:interview:<caseId>` key, or null. */
function interviewCaseId(key: string): string | null {
  if (!key.startsWith(INTERVIEW_PREFIX)) return null;
  const id = key.slice(INTERVIEW_PREFIX.length);
  return id.length > 0 ? id : null;
}

/* ------------------------------------------------------------------
   ARTIFACT ASSEMBLY.
   ------------------------------------------------------------------ */

/** The skillId embedded in a `praxis:artifact-v2:<skillId>` key, or null. */
function artifactSkillId(key: string): string | null {
  if (!key.startsWith(ARTIFACT_PREFIX)) return null;
  const id = key.slice(ARTIFACT_PREFIX.length);
  return id.length > 0 ? id : null;
}

/**
 * Parse one `praxis:artifact-v2:<skillId>` value into an entry, or null to skip.
 * Reuses `coerceVersionHistory` (the same defensive coercion the artifact lib
 * uses on load) so the version cap + empty-submission dropping stay identical.
 * Kept only when at least one stored version has a NON-null verdict — a skill
 * whose only submissions came back unparseable has no grade to attest to.
 */
export function parseArtifactEntry(skillId: string, raw: string | null): ArtifactEntry | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const history = coerceVersionHistory(skillId, parsed);
  if (history.versions.length === 0) return null;
  // Require at least one real (parseable) verdict in the history.
  const hasVerdict = history.versions.some((v) => v.verdict !== null);
  if (!hasVerdict) return null;

  const latestVersion = history.versions[history.versions.length - 1];
  return {
    skillId,
    history,
    latestVerdict: latestVersion.verdict,
    latestVersion,
    trajectory: history.versions.map((v) => v.verdict?.overallScore ?? null),
  };
}

/* ------------------------------------------------------------------
   SUMMARY.
   ------------------------------------------------------------------ */

/** Rank of a hiring band, weakest 0 → strongest 3, for picking the best. */
function bandRank(band: HiringBand): number {
  const i = HIRING_BANDS.indexOf(band);
  return i < 0 ? 0 : i;
}

/**
 * Derive the summary strip from the assembled entries. Every field is a direct
 * count or the strongest earned band — there is no averaging into a composite
 * rating, by design.
 */
export function summarize(
  interviews: InterviewEntry[],
  artifacts: ArtifactEntry[],
): ReportSummary {
  const revisionsSubmitted = artifacts.reduce((n, a) => n + a.history.versions.length, 0);
  const artifactsPassed = artifacts.filter((a) => a.latestVerdict?.passed === true).length;

  let bestInterviewBand: HiringBand | null = null;
  for (const entry of interviews) {
    const band = entry.scorecard.recommendation;
    if (bestInterviewBand === null || bandRank(band) > bandRank(bestInterviewBand)) {
      bestInterviewBand = band;
    }
  }

  return {
    interviewsScored: interviews.length,
    artifactsGraded: artifacts.length,
    revisionsSubmitted,
    artifactsPassed,
    bestInterviewBand,
  };
}

/* ------------------------------------------------------------------
   ASSEMBLY.
   ------------------------------------------------------------------ */

/**
 * Assemble the full report from a storage source. Interviews are ordered most
 * recent first by `scoredAt` (a legacy 0 timestamp sorts last, which is the
 * honest place for an entry with no known grading time). Artifacts are ordered
 * by their latest submission time, likewise most recent first.
 *
 * Returns the empty-report shape when there is nothing graded — the caller shows
 * the calm empty state rather than a header over blank sections.
 */
export function assembleReport(storage: ReadableStorage | null): ReadinessReport {
  const interviews: InterviewEntry[] = [];
  const artifacts: ArtifactEntry[] = [];

  if (storage) {
    for (const key of storage.keys()) {
      const caseId = interviewCaseId(key);
      if (caseId) {
        const entry = parseInterviewEntry(caseId, storage.getItem(key));
        if (entry) interviews.push(entry);
        continue;
      }
      const skillId = artifactSkillId(key);
      if (skillId) {
        const entry = parseArtifactEntry(skillId, storage.getItem(key));
        if (entry) artifacts.push(entry);
      }
    }
  }

  // Most recent grade first, stable by id on a tie so ordering is deterministic.
  interviews.sort((a, b) => b.scoredAt - a.scoredAt || a.caseId.localeCompare(b.caseId));
  artifacts.sort(
    (a, b) =>
      b.latestVersion.gradedAt - a.latestVersion.gradedAt ||
      a.skillId.localeCompare(b.skillId),
  );

  const summary = summarize(interviews, artifacts);
  const isEmpty = interviews.length === 0 && artifacts.length === 0;
  return { interviews, artifacts, summary, isEmpty };
}
