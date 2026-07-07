import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  annotationsByBlock,
  appendVersion,
  canSubmitAnother,
  clearVersionHistory,
  latestVersion,
  loadVersionHistory,
  MAX_VERSIONS,
  nextVersionNumber,
  saveVersionHistory,
  scoreTrajectory,
  severityMeta,
  storageKey,
  type VersionHistory,
} from '../artifactVersionsV2';
import type { Annotation, ArtifactVerdictV2 } from '../artifactGraderV2';

/**
 * The version helpers own the revise-and-resubmit bookkeeping the UI leans on:
 * the cap that stops a fourth submission, the trajectory the delta view charts,
 * and the localStorage round-trip that survives a reload. These are pure (or
 * pure over an injected storage), so they are pinned here rather than through
 * the component.
 */

/** Build a minimal verdict carrying just the fields the helpers read. */
function verdict(overallScore: number): ArtifactVerdictV2 {
  return {
    criteria: [],
    annotations: [],
    topFix: '',
    strengths: [],
    gaps: [],
    overall: '',
    overallScore,
    passed: overallScore >= 70,
  };
}

const EMPTY: VersionHistory = { skillId: 'prd-artifact', versions: [] };

describe('storageKey', () => {
  it('namespaces per skill under the v2 prefix', () => {
    expect(storageKey('prd-artifact')).toBe('praxis:artifact-v2:prd-artifact');
  });
});

describe('appendVersion + the version cap', () => {
  it('numbers the first submission version 1 and does not mutate the input', () => {
    const next = appendVersion(EMPTY, 'draft one', verdict(60), 1000);
    expect(next.versions).toHaveLength(1);
    expect(next.versions[0].version).toBe(1);
    expect(EMPTY.versions).toHaveLength(0); // input untouched
  });

  it('allows exactly MAX_VERSIONS submissions', () => {
    let h = EMPTY;
    for (let i = 0; i < MAX_VERSIONS; i += 1) {
      expect(canSubmitAnother(h)).toBe(true);
      h = appendVersion(h, `draft ${i}`, verdict(50 + i), i);
    }
    expect(h.versions).toHaveLength(MAX_VERSIONS);
    expect(canSubmitAnother(h)).toBe(false);
  });

  it('silently ignores an append past the cap', () => {
    let h = EMPTY;
    for (let i = 0; i < MAX_VERSIONS; i += 1) {
      h = appendVersion(h, `d${i}`, verdict(50), i);
    }
    const overflow = appendVersion(h, 'one too many', verdict(90), 999);
    expect(overflow.versions).toHaveLength(MAX_VERSIONS);
  });

  it('reports the next version number', () => {
    expect(nextVersionNumber(EMPTY)).toBe(1);
    const h = appendVersion(EMPTY, 'a', verdict(50), 1);
    expect(nextVersionNumber(h)).toBe(2);
  });

  it('returns the latest version, or undefined when empty', () => {
    expect(latestVersion(EMPTY)).toBeUndefined();
    const h = appendVersion(appendVersion(EMPTY, 'a', verdict(50), 1), 'b', verdict(80), 2);
    expect(latestVersion(h)!.submission).toBe('b');
  });
});

describe('scoreTrajectory', () => {
  it('lists the overall score of each version in order', () => {
    let h = appendVersion(EMPTY, 'a', verdict(55), 1);
    h = appendVersion(h, 'b', verdict(72), 2);
    expect(scoreTrajectory(h)).toEqual([55, 72]);
  });

  it('yields null for a version whose grading was unparseable', () => {
    let h = appendVersion(EMPTY, 'a', null, 1);
    h = appendVersion(h, 'b', verdict(80), 2);
    expect(scoreTrajectory(h)).toEqual([null, 80]);
  });
});

describe('severityMeta', () => {
  it('maps each severity to a paired tone + word', () => {
    expect(severityMeta('major')).toEqual({ tone: 'bad', label: 'Major' });
    expect(severityMeta('minor')).toEqual({ tone: 'warn', label: 'Minor' });
    expect(severityMeta('praise')).toEqual({ tone: 'good', label: 'Praise' });
  });
});

describe('annotationsByBlock', () => {
  it('groups annotations under their block, preserving order', () => {
    const annotations: Annotation[] = [
      { block: 2, severity: 'major', comment: 'a' },
      { block: 1, severity: 'praise', comment: 'b' },
      { block: 2, severity: 'minor', comment: 'c' },
    ];
    const byBlock = annotationsByBlock(annotations);
    expect(byBlock.get(1)!.map((a) => a.comment)).toEqual(['b']);
    expect(byBlock.get(2)!.map((a) => a.comment)).toEqual(['a', 'c']);
  });

  it('returns an empty map for no annotations', () => {
    expect(annotationsByBlock([]).size).toBe(0);
  });
});

/* ------------------------------------------------------------------
   PERSISTENCE. Stub a minimal localStorage on globalThis so the round-trip is
   exercised without a DOM.
   ------------------------------------------------------------------ */
describe('persistence round-trip', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and reloads a history', () => {
    const h = appendVersion(EMPTY, 'draft one', verdict(64), 123);
    saveVersionHistory(h);
    const loaded = loadVersionHistory('prd-artifact');
    expect(loaded.versions).toHaveLength(1);
    expect(loaded.versions[0].submission).toBe('draft one');
    expect(loaded.versions[0].verdict!.overallScore).toBe(64);
  });

  it('returns an empty history when nothing is stored', () => {
    expect(loadVersionHistory('never-saved').versions).toEqual([]);
  });

  it('returns an empty history on corrupt JSON', () => {
    store.set(storageKey('prd-artifact'), '{not valid json');
    expect(loadVersionHistory('prd-artifact').versions).toEqual([]);
  });

  it('caps a reloaded history at MAX_VERSIONS and drops empty submissions', () => {
    const bloated = {
      skillId: 'prd-artifact',
      versions: [
        { submission: 'a', verdict: null, gradedAt: 1 },
        { submission: '', verdict: null, gradedAt: 2 }, // dropped: empty
        { submission: 'b', verdict: null, gradedAt: 3 },
        { submission: 'c', verdict: null, gradedAt: 4 },
        { submission: 'd', verdict: null, gradedAt: 5 },
      ],
    };
    store.set(storageKey('prd-artifact'), JSON.stringify(bloated));
    const loaded = loadVersionHistory('prd-artifact');
    expect(loaded.versions).toHaveLength(MAX_VERSIONS);
    expect(loaded.versions.map((v) => v.submission)).toEqual(['a', 'b', 'c']);
  });

  it('clears a stored history', () => {
    saveVersionHistory(appendVersion(EMPTY, 'a', verdict(50), 1));
    clearVersionHistory('prd-artifact');
    expect(loadVersionHistory('prd-artifact').versions).toEqual([]);
  });
});
