/**
 * INTERVIEW MODALITY: the mock PM interview — the acquisition wedge.
 *
 * Where a roleplay practises influence against an adversary, an interview
 * practises performing under evaluation: an AI interviewer runs a real
 * interview format (product sense, execution), probes with follow-ups,
 * reveals case data only when the candidate asks the right questions, and
 * withholds approval the way real interviewers do. Afterwards the full
 * transcript is scored like a hiring committee would score it.
 *
 * AUTHORING MODEL (mirrors roleplay)
 * ----------------------------------
 * Content is plain data, one file per case under `src/curriculum/interview/`,
 * barrel-exported by case id. Cases are deliberately NOT industry-flavoured:
 * a mock interview should feel like a real interview at a company you don't
 * work at, and identical cases keep scores comparable across every candidate.
 *
 * SCORING CONTRACT
 * ----------------
 * Dimensions are scored on the same 0-3 band as every other Praxis grader,
 * mapped onto the four verdicts real committees use:
 *   0 = no-hire signal · 1 = lean no · 2 = lean hire · 3 = strong hire
 * The score action additionally anchors evidence to NUMBERED candidate turns
 * (the transcript is numbered server-side before grading), so feedback points
 * at the exact moment, not a vibe.
 */

/* ------------------------------------------------------------------
   CONVERSATION CONTRACT + SERVER-ENFORCED CAPS (shared client/server, exactly
   like roleplay/types.ts — one definition so UI and cost guardrail never drift).
   ------------------------------------------------------------------ */

/** Who authored a turn. `interviewer` is the AI; `candidate` is the learner. */
export type InterviewRole = 'interviewer' | 'candidate';

/** One turn in the transcript. Kept tiny so it crosses the wire cheaply. */
export interface InterviewMessage {
  role: InterviewRole;
  text: string;
}

/**
 * Hard cap on candidate turns per session, enforced SERVER-SIDE in the `reply`
 * action. Interviews run deeper than roleplays (a real screen is 25-40
 * minutes), so the cap is higher; it is still the guardrail that stops a
 * public endpoint from being looped into unbounded model spend.
 */
export const MAX_CANDIDATE_TURNS = 12;

/**
 * Minimum candidate turns before "End interview and get scored" enables. Less
 * than a few real exchanges is not an interview performance worth a verdict
 * (it is force-enabled once the turn cap is hit).
 */
export const MIN_CANDIDATE_TURNS_TO_SCORE = 4;

/** Per-message length clamp (server + client). Bounds input cost per call. */
export const MAX_INTERVIEW_MESSAGE_CHARS = 2000;

/** Count the candidate's turns in a transcript (pure; unit-testable). */
export function countCandidateTurns(messages: readonly InterviewMessage[]): number {
  return messages.reduce((n, m) => (m.role === 'candidate' ? n + 1 : n), 0);
}

/**
 * The server's decision for a `reply` request: may the candidate have another
 * interviewer response, or is it time to wrap up and be scored? Pure, so the
 * turn-cap guardrail is testable without standing up the route.
 */
export function canInterviewReply(messages: readonly InterviewMessage[]): {
  allowed: boolean;
  candidateTurns: number;
  cap: number;
} {
  const candidateTurns = countCandidateTurns(messages);
  return {
    allowed: candidateTurns <= MAX_CANDIDATE_TURNS,
    candidateTurns,
    cap: MAX_CANDIDATE_TURNS,
  };
}

/* ------------------------------------------------------------------
   SCORING DIMENSIONS.
   ------------------------------------------------------------------ */

/**
 * One hiring-committee dimension. `descriptor` is the bar: shown to the
 * candidate in the debrief AND handed to the grader (rubric-aligned prompting,
 * same rule as artifacts and roleplay).
 */
export interface InterviewDimension {
  /** Stable id, unique within the case; echoed back in the scorecard. */
  id: string;
  /** Short label, e.g. "Structure". */
  label: string;
  /** What a strong-hire performance on this dimension looks like, concretely. */
  descriptor: string;
}

/** The four committee verdicts the 0-3 band maps onto, weakest first. */
export const HIRING_BANDS = ['no-hire signal', 'lean no', 'lean hire', 'strong hire'] as const;
export type HiringBand = (typeof HIRING_BANDS)[number];

/** Map a 0-3 band score onto its committee verdict label. */
export function hiringBand(score: number): HiringBand {
  const index = Math.max(0, Math.min(3, Math.round(score)));
  return HIRING_BANDS[index];
}

/* ------------------------------------------------------------------
   THE CASE.
   ------------------------------------------------------------------ */

export type InterviewKind = 'product-sense' | 'execution';

export interface InterviewCase {
  /** Stable case id, e.g. 'ps-renter-maintenance'. */
  id: string;
  kind: InterviewKind;
  /** Short case name shown on the picker, e.g. "Design for renters". */
  title: string;
  /** One-line "what this practises" hook. */
  hook: string;
  /** The interviewer's display name/role, e.g. "Alex, Group PM". */
  interviewerName: string;
  /** Rough real-interview length, for the picker (display only). */
  durationMin: number;
  /**
   * What the candidate sees before starting: the format, what is being
   * evaluated, and any ground rules — the equivalent of the interviewer's
   * "here's how this will work" minute. Authored as paragraphs.
   */
  setup: string[];
  /** The interviewer's opening message: the actual question. */
  opening: string;
  /**
   * The interviewer brief handed to the `reply` action: persona, the follow-up
   * ladder, the probe areas, the case data to reveal ONLY when asked, and the
   * red flags to press on. Never shown to the candidate. This is the case
   * script — the quality of the interview lives here.
   */
  brief: string;
  /** The committee scorecard dimensions: 4-5, from public hiring rubrics. */
  dimensions: InterviewDimension[];
}
