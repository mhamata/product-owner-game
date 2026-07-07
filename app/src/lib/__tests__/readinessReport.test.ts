import { describe, it, expect } from 'vitest';
import {
  assembleReport,
  parseArtifactEntry,
  parseInterviewEntry,
  summarize,
  type ArtifactEntry,
  type InterviewEntry,
  type ReadableStorage,
} from '../readinessReport';
import type { InterviewScorecard } from '@/components/interview/useInterview';
import type { ArtifactVerdictV2 } from '../artifactGraderV2';
import type { HiringBand } from '@/curriculum/interview';

/**
 * The readiness-report assembly is the one place the credential is composed, so
 * its keep/skip rules, ordering, and defensive parsing are pinned here rather
 * than through the (React) renderer. Every case runs against an injected
 * storage-like map — no DOM — matching the pure-lib contract.
 */

/* ------------------------------------------------------------------
   FIXTURES.
   ------------------------------------------------------------------ */

/** A minimal committee scorecard carrying just the fields assembly reads. */
function scorecard(recommendation: HiringBand, overallScore: number): InterviewScorecard {
  return {
    dimensions: [],
    strengths: [],
    gaps: [],
    committee: 'The committee discussed the candidate.',
    recommendation,
    overallScore,
    passed: recommendation === 'lean hire' || recommendation === 'strong hire',
  };
}

/** A minimal V2 verdict carrying just the fields assembly reads. */
function verdict(overallScore: number, passed: boolean): ArtifactVerdictV2 {
  return {
    criteria: [],
    annotations: [],
    topFix: '',
    strengths: [],
    gaps: [],
    overall: '',
    overallScore,
    passed,
  };
}

/** A raw interview save string, with or without a persisted scorecard. */
function interviewSave(opts: {
  scorecard?: InterviewScorecard;
  scoredAt?: number;
  messages?: { role: 'interviewer' | 'candidate'; text: string }[];
}): string {
  return JSON.stringify({
    version: 1,
    messages: opts.messages ?? [{ role: 'interviewer', text: 'Opening question.' }],
    ended: opts.scorecard != null,
    ...(opts.scorecard ? { scorecard: opts.scorecard, scoredAt: opts.scoredAt ?? 0 } : {}),
  });
}

/** A raw artifact version-history save string. */
function artifactSave(
  skillId: string,
  versions: { submission: string; verdict: ArtifactVerdictV2 | null; gradedAt: number }[],
): string {
  return JSON.stringify({ skillId, versions });
}

/** Build a `ReadableStorage` over a plain entries map. */
function storageOf(entries: Record<string, string>): ReadableStorage {
  return {
    keys: () => Object.keys(entries),
    getItem: (key) => (key in entries ? entries[key] : null),
  };
}

/* ------------------------------------------------------------------
   INTERVIEW PARSING.
   ------------------------------------------------------------------ */

describe('parseInterviewEntry', () => {
  it('keeps a save that carries a scorecard', () => {
    const raw = interviewSave({ scorecard: scorecard('lean hire', 72), scoredAt: 1000 });
    const entry = parseInterviewEntry('ps-renter-maintenance', raw);
    expect(entry).not.toBeNull();
    expect(entry!.caseId).toBe('ps-renter-maintenance');
    expect(entry!.scorecard.overallScore).toBe(72);
    expect(entry!.scoredAt).toBe(1000);
  });

  it('skips an in-progress save with no scorecard', () => {
    const raw = interviewSave({});
    expect(parseInterviewEntry('ps-renter-maintenance', raw)).toBeNull();
  });

  it('skips a corrupt JSON save', () => {
    expect(parseInterviewEntry('ps-renter-maintenance', '{not json')).toBeNull();
  });

  it('skips a null value', () => {
    expect(parseInterviewEntry('ps-renter-maintenance', null)).toBeNull();
  });

  it('defaults a legacy save with no scoredAt timestamp to zero', () => {
    const raw = JSON.stringify({
      version: 1,
      messages: [],
      ended: true,
      scorecard: scorecard('strong hire', 88),
    });
    const entry = parseInterviewEntry('ex-dau-drop', raw);
    expect(entry!.scoredAt).toBe(0);
  });
});

/* ------------------------------------------------------------------
   ARTIFACT PARSING.
   ------------------------------------------------------------------ */

describe('parseArtifactEntry', () => {
  it('keeps a history whose latest version has a real verdict', () => {
    const raw = artifactSave('prd-artifact', [
      { submission: 'draft one', verdict: verdict(64, false), gradedAt: 1 },
      { submission: 'draft two', verdict: verdict(78, true), gradedAt: 2 },
    ]);
    const entry = parseArtifactEntry('prd-artifact', raw);
    expect(entry).not.toBeNull();
    expect(entry!.trajectory).toEqual([64, 78]);
    expect(entry!.latestVerdict!.overallScore).toBe(78);
    expect(entry!.latestVersion.submission).toBe('draft two');
  });

  it('skips a history with no stored versions', () => {
    expect(parseArtifactEntry('prd-artifact', artifactSave('prd-artifact', []))).toBeNull();
  });

  it('skips a history whose only versions came back unparseable', () => {
    const raw = artifactSave('prd-artifact', [
      { submission: 'draft', verdict: null, gradedAt: 1 },
    ]);
    expect(parseArtifactEntry('prd-artifact', raw)).toBeNull();
  });

  it('keeps a history with a null latest verdict as long as an earlier one graded', () => {
    const raw = artifactSave('prd-artifact', [
      { submission: 'draft one', verdict: verdict(70, true), gradedAt: 1 },
      { submission: 'draft two', verdict: null, gradedAt: 2 },
    ]);
    const entry = parseArtifactEntry('prd-artifact', raw);
    expect(entry).not.toBeNull();
    expect(entry!.latestVerdict).toBeNull();
    expect(entry!.trajectory).toEqual([70, null]);
  });

  it('skips a corrupt JSON save', () => {
    expect(parseArtifactEntry('prd-artifact', '{bad')).toBeNull();
  });
});

/* ------------------------------------------------------------------
   SUMMARY.
   ------------------------------------------------------------------ */

describe('summarize', () => {
  it('counts scored interviews and graded artifacts', () => {
    const interviews = [
      { caseId: 'a', scorecard: scorecard('lean no', 40), scoredAt: 1, messages: [] },
    ] as InterviewEntry[];
    const artifacts = [
      {
        skillId: 'prd-artifact',
        history: { skillId: 'prd-artifact', versions: [{ version: 1, submission: 'x', verdict: verdict(80, true), gradedAt: 1 }] },
        latestVerdict: verdict(80, true),
        latestVersion: { version: 1, submission: 'x', verdict: verdict(80, true), gradedAt: 1 },
        trajectory: [80],
      },
    ] as ArtifactEntry[];
    const summary = summarize(interviews, artifacts);
    expect(summary.interviewsScored).toBe(1);
    expect(summary.artifactsGraded).toBe(1);
  });

  it('sums every artifact submission as a revision count', () => {
    const artifacts = [
      {
        skillId: 'prd-artifact',
        history: {
          skillId: 'prd-artifact',
          versions: [
            { version: 1, submission: 'a', verdict: verdict(60, false), gradedAt: 1 },
            { version: 2, submission: 'b', verdict: verdict(75, true), gradedAt: 2 },
          ],
        },
        latestVerdict: verdict(75, true),
        latestVersion: { version: 2, submission: 'b', verdict: verdict(75, true), gradedAt: 2 },
        trajectory: [60, 75],
      },
    ] as ArtifactEntry[];
    expect(summarize([], artifacts).revisionsSubmitted).toBe(2);
  });

  it('counts only artifacts whose latest verdict passed', () => {
    const passing = {
      skillId: 'p',
      history: { skillId: 'p', versions: [{ version: 1, submission: 'a', verdict: verdict(80, true), gradedAt: 1 }] },
      latestVerdict: verdict(80, true),
      latestVersion: { version: 1, submission: 'a', verdict: verdict(80, true), gradedAt: 1 },
      trajectory: [80],
    };
    const failing = {
      skillId: 'f',
      history: { skillId: 'f', versions: [{ version: 1, submission: 'a', verdict: verdict(50, false), gradedAt: 1 }] },
      latestVerdict: verdict(50, false),
      latestVersion: { version: 1, submission: 'a', verdict: verdict(50, false), gradedAt: 1 },
      trajectory: [50],
    };
    expect(summarize([], [passing, failing] as ArtifactEntry[]).artifactsPassed).toBe(1);
  });

  it('reports the strongest interview band as the best result', () => {
    const interviews = [
      { caseId: 'a', scorecard: scorecard('lean no', 40), scoredAt: 1, messages: [] },
      { caseId: 'b', scorecard: scorecard('strong hire', 90), scoredAt: 2, messages: [] },
      { caseId: 'c', scorecard: scorecard('lean hire', 70), scoredAt: 3, messages: [] },
    ] as InterviewEntry[];
    expect(summarize(interviews, []).bestInterviewBand).toBe('strong hire');
  });

  it('has no best band when no interview was scored', () => {
    expect(summarize([], []).bestInterviewBand).toBeNull();
  });
});

/* ------------------------------------------------------------------
   ASSEMBLY.
   ------------------------------------------------------------------ */

describe('assembleReport', () => {
  it('reports empty when there is nothing graded', () => {
    const report = assembleReport(storageOf({}));
    expect(report.isEmpty).toBe(true);
    expect(report.interviews).toEqual([]);
    expect(report.artifacts).toEqual([]);
    expect(report.summary.bestInterviewBand).toBeNull();
  });

  it('reports empty when storage is unavailable', () => {
    const report = assembleReport(null);
    expect(report.isEmpty).toBe(true);
  });

  it('collects only graded interviews and artifacts, skipping ungraded ones', () => {
    const report = assembleReport(
      storageOf({
        'praxis:interview:ps-renter-maintenance': interviewSave({
          scorecard: scorecard('lean hire', 72),
          scoredAt: 500,
        }),
        'praxis:interview:ex-dau-drop': interviewSave({}), // in progress → skipped
        'praxis:artifact-v2:prd-artifact': artifactSave('prd-artifact', [
          { submission: 'a', verdict: verdict(80, true), gradedAt: 10 },
        ]),
        'praxis:artifact-v2:strategy-memo': artifactSave('strategy-memo', [
          { submission: 'a', verdict: null, gradedAt: 11 }, // unparseable → skipped
        ]),
        'praxis-learn-v2': '{"state":{}}', // unrelated key → ignored
      }),
    );
    expect(report.isEmpty).toBe(false);
    expect(report.interviews.map((i) => i.caseId)).toEqual(['ps-renter-maintenance']);
    expect(report.artifacts.map((a) => a.skillId)).toEqual(['prd-artifact']);
  });

  it('orders interviews most recently scored first', () => {
    const report = assembleReport(
      storageOf({
        'praxis:interview:older': interviewSave({ scorecard: scorecard('lean no', 40), scoredAt: 100 }),
        'praxis:interview:newer': interviewSave({ scorecard: scorecard('lean hire', 70), scoredAt: 200 }),
      }),
    );
    expect(report.interviews.map((i) => i.caseId)).toEqual(['newer', 'older']);
  });

  it('orders artifacts by their latest submission time, most recent first', () => {
    const report = assembleReport(
      storageOf({
        'praxis:artifact-v2:older': artifactSave('older', [
          { submission: 'a', verdict: verdict(80, true), gradedAt: 100 },
        ]),
        'praxis:artifact-v2:newer': artifactSave('newer', [
          { submission: 'a', verdict: verdict(80, true), gradedAt: 300 },
        ]),
      }),
    );
    expect(report.artifacts.map((a) => a.skillId)).toEqual(['newer', 'older']);
  });

  it('ignores a malformed interview key with an empty case id', () => {
    const report = assembleReport(
      storageOf({
        'praxis:interview:': interviewSave({ scorecard: scorecard('lean hire', 70) }),
      }),
    );
    expect(report.interviews).toEqual([]);
    expect(report.isEmpty).toBe(true);
  });
});
