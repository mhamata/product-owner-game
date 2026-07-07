import { describe, expect, it } from 'vitest';
import {
  ALL_INTERVIEW_CASES,
  INTERVIEW_CASES,
  canInterviewReply,
  countCandidateTurns,
  hiringBand,
  MAX_CANDIDATE_TURNS,
  MIN_CANDIDATE_TURNS_TO_SCORE,
} from '../index';
import type { InterviewMessage } from '../types';

const interviewer = (text: string): InterviewMessage => ({ role: 'interviewer', text });
const candidate = (text: string): InterviewMessage => ({ role: 'candidate', text });

describe('interview turn accounting', () => {
  it('counts only candidate turns', () => {
    const transcript = [interviewer('q'), candidate('a'), interviewer('probe'), candidate('b')];
    expect(countCandidateTurns(transcript)).toBe(2);
  });

  it('allows replies up to the cap and refuses beyond it', () => {
    const atCap: InterviewMessage[] = [interviewer('q')];
    for (let i = 0; i < MAX_CANDIDATE_TURNS; i++) atCap.push(candidate(`turn ${i}`), interviewer('probe'));
    expect(canInterviewReply(atCap).allowed).toBe(true);

    atCap.push(candidate('one too many'));
    expect(canInterviewReply(atCap).allowed).toBe(false);
    expect(canInterviewReply(atCap).cap).toBe(MAX_CANDIDATE_TURNS);
  });

  it('keeps the score-minimum below the cap so every session can be scored', () => {
    expect(MIN_CANDIDATE_TURNS_TO_SCORE).toBeLessThan(MAX_CANDIDATE_TURNS);
  });
});

describe('hiring bands', () => {
  it('maps the 0-3 band onto the four committee verdicts', () => {
    expect(hiringBand(0)).toBe('no-hire signal');
    expect(hiringBand(1)).toBe('lean no');
    expect(hiringBand(2)).toBe('lean hire');
    expect(hiringBand(3)).toBe('strong hire');
  });

  it('clamps out-of-range scores instead of crashing', () => {
    expect(hiringBand(-2)).toBe('no-hire signal');
    expect(hiringBand(9)).toBe('strong hire');
    expect(hiringBand(1.6)).toBe('lean hire');
  });
});

describe('case registry integrity', () => {
  it('registers every authored case under a unique id', () => {
    expect(Object.keys(INTERVIEW_CASES)).toHaveLength(ALL_INTERVIEW_CASES.length);
  });

  it('covers both launch formats', () => {
    const kinds = new Set(ALL_INTERVIEW_CASES.map((c) => c.kind));
    expect(kinds).toEqual(new Set(['product-sense', 'execution']));
  });

  it('every case is fully authored', () => {
    for (const c of ALL_INTERVIEW_CASES) {
      expect(c.setup.length, `${c.id} setup`).toBeGreaterThanOrEqual(2);
      expect(c.opening.length, `${c.id} opening`).toBeGreaterThan(80);
      // The brief is the case script; a thin one produces a hollow interview.
      expect(c.brief.length, `${c.id} brief`).toBeGreaterThan(1500);
      expect(c.dimensions.length, `${c.id} dimensions`).toBeGreaterThanOrEqual(4);
      expect(c.dimensions.length, `${c.id} dimensions`).toBeLessThanOrEqual(5);
      const ids = new Set(c.dimensions.map((d) => d.id));
      expect(ids.size, `${c.id} dimension ids unique`).toBe(c.dimensions.length);
      for (const d of c.dimensions) {
        expect(d.descriptor.length, `${c.id}/${d.id} descriptor`).toBeGreaterThan(60);
      }
    }
  });

  it('briefs never leak into candidate-visible fields', () => {
    // The setup/opening are shown to the candidate; the brief holds answers.
    // Guard against copy-paste: no candidate-visible field may contain the
    // give-away phrases used only in briefs.
    for (const c of ALL_INTERVIEW_CASES) {
      const visible = [c.title, c.hook, ...c.setup, c.opening].join(' ').toLowerCase();
      expect(visible).not.toContain('root cause');
      expect(visible).not.toContain('reveal');
      expect(visible).not.toContain('red flags');
    }
  });
});
