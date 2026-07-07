'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from 'react';
// VALUE imports must come from the LEAF `interview/types`, never the barrel:
// the barrel pulls in the authored cases, whose hidden `brief` fields (the case
// ANSWERS) would be bundled into this client chunk. Type-only imports are erased
// at compile time, but they live on the leaf too so no one "just adds a value"
// to a barrel import line here.
import type { InterviewCase, InterviewMessage } from '@/curriculum/interview/types';
import {
  countCandidateTurns,
  MAX_CANDIDATE_TURNS,
  MAX_INTERVIEW_MESSAGE_CHARS,
  MIN_CANDIDATE_TURNS_TO_SCORE,
} from '@/curriculum/interview/types';
import Link from 'next/link';
import { Topbar } from '@/components/console/Topbar';
import { useReducedMotion } from '@/components/console/sim/useReducedMotion';
import { useHydrated } from '@/components/console/sim/useHydrated';
import { UnavailableOrError, Spinner } from '@/components/console/lesson/verdictUi';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  ClockIcon,
  RestartIcon,
  UsersIcon,
  XIcon,
} from '@/components/console/Icon';
import { Scorecard } from './Scorecard';
import { useInterview, type InterviewScorecard } from './useInterview';
import { notifySyncKeyChanged } from '@/lib/sync/notify';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * The candidate-visible slice of a case. The full `InterviewCase` carries the
 * `brief` (the case's answers), which must NEVER reach the client — the server
 * page hands us this `Omit` so the leak is impossible by construction, not just
 * by discipline.
 */
export type PublicInterviewCase = Omit<InterviewCase, 'brief'>;

/**
 * localStorage schema version, so a future shape change can invalidate stale
 * saves cleanly rather than deserializing garbage into the transcript.
 */
const PERSIST_VERSION = 1;
const persistKey = (caseId: string) => `praxis:interview:${caseId}`;

interface PersistedSession {
  version: number;
  /** The transcript so far, including the interviewer's opening line. */
  messages: InterviewMessage[];
  /** Whether the candidate had already ended the interview when it was saved. */
  ended: boolean;
  /**
   * The committee scorecard, once the transcript has been graded. OPTIONAL and
   * added at PERSIST_VERSION 1 (no bump): older saves simply lack it and still
   * parse + resume unchanged. The readiness report reads this to aggregate a
   * candidate's scored interviews without a re-grade round-trip.
   */
  scorecard?: InterviewScorecard;
  /** When the scorecard was produced (ms epoch), for ordering in the report. */
  scoredAt?: number;
}

/**
 * A referentially-stable snapshot cache for the resume read. `useSyncExternalStore`
 * requires `getSnapshot` to return the SAME reference when nothing changed, or it
 * loops; `JSON.parse` would mint a new object every render. So we cache the parsed
 * value against the raw string it came from, and only re-parse when the raw
 * localStorage string actually differs.
 */
const resumeCache = new Map<string, { raw: string | null; value: PersistedSession | null }>();

/**
 * Read a resumable saved session for a case, or null, with a stable reference.
 * "Resumable" means: current schema version, a real transcript, and at least one
 * candidate answer past the opening (an untouched opening is not worth a resume
 * prompt). SSR-safe: returns null when there is no window.
 */
function readResumableSession(caseId: string): PersistedSession | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(persistKey(caseId));
  } catch {
    return null;
  }
  const cached = resumeCache.get(caseId);
  if (cached && cached.raw === raw) return cached.value;

  let value: PersistedSession | null = null;
  if (raw) {
    try {
      const saved = JSON.parse(raw) as PersistedSession;
      if (
        saved.version === PERSIST_VERSION &&
        Array.isArray(saved.messages) &&
        countCandidateTurns(saved.messages) > 0
      ) {
        value = saved;
      }
    } catch {
      // Corrupt or unreadable save: treat as nothing to resume.
    }
  }
  resumeCache.set(caseId, { raw, value });
  return value;
}

/**
 * Read the resumable saved session through `useSyncExternalStore`, so the value
 * is null on the server and first client paint (matching SSR) then the real save
 * once mounted — with NO setState-in-effect, the same pattern `useHydrated`
 * uses. The store is read-once here (writes happen only after the resume decision
 * is already behind us), so the subscribe is a no-op.
 */
const noopSubscribe = () => () => {};
function useResumableSession(caseId: string): PersistedSession | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => readResumableSession(caseId),
    () => null,
  );
}

/**
 * Phases of the interview loop:
 *  - pre-start: the candidate reads the setup (format, what's evaluated, ground
 *    rules) and the visible dimension bar, then presses Start. If a saved
 *    in-progress transcript exists, a Resume / Start-over choice shows here.
 *  - running:   the live chat with the AI interviewer. "End interview & get
 *    scorecard" enables after MIN_CANDIDATE_TURNS_TO_SCORE real answers and is
 *    forced once the server-enforced turn cap is hit.
 *  - scored:    the committee scorecard over the full transcript, with evidence
 *    chips that jump to the numbered candidate turns above.
 */
type Phase = 'pre-start' | 'running' | 'scored';

export function InterviewSession({ interviewCase }: { interviewCase: PublicInterviewCase }) {
  const reducedMotion = useReducedMotion();
  // False on the server and first client paint, true once mounted — gates the
  // localStorage read and the Start button so the first paint matches the server
  // (no setState-in-effect, matching the persisted-store pattern elsewhere).
  const hydrated = useHydrated();
  const { sending, scoring, sendReply, score } = useInterview();

  // The transcript is seeded with the interviewer's opening line, which is part
  // of the `messages` payload the API scores. It renders locally on the client;
  // the API is never asked to generate it.
  const [messages, setMessages] = useState<InterviewMessage[]>(() => [
    { role: 'interviewer', text: interviewCase.opening },
  ]);
  const [draft, setDraft] = useState('');
  const [phase, setPhase] = useState<Phase>('pre-start');

  // A saved in-progress transcript, read SSR-safely from localStorage. Drives the
  // Resume / Start-over choice on the pre-start screen. `resumeDismissed` hides
  // that choice once the candidate has picked (resumed, or started over).
  const savedSession = useResumableSession(interviewCase.id);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const resumable = resumeDismissed ? null : savedSession;

  // Terminal states for the two round-trips. `unavailable` is the calm no-key /
  // at-capacity / allowance fallback (NON-error); `error` is a real, retryable
  // failure. Both preserve the transcript. `scorecard` is the graded result.
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<InterviewScorecard | null>(null);
  // True once the server (or the client pre-check) has signalled the turn cap, so
  // the input locks and only "end interview" remains.
  const [turnCapHit, setTurnCapHit] = useState(false);

  const candidateTurns = countCandidateTurns(messages);
  const atTurnCap = turnCapHit || candidateTurns >= MAX_CANDIDATE_TURNS;
  // Scoring normally needs a few real answers so there is a performance worth a
  // verdict. The no-key `unavailable` path is the exception: there is nothing to
  // grade and the input is locked, so we still let the candidate end the
  // interview (it routes straight to the calm "try again" scorecard state).
  const canScore = candidateTurns >= MIN_CANDIDATE_TURNS_TO_SCORE || unavailable !== null;
  // The input is open only while running, not at the cap, and not mid-request.
  const inputOpen = phase === 'running' && !atTurnCap && !sending && !scoring;
  const trimmedDraft = draft.trim();
  const overCharLimit = draft.length >= MAX_INTERVIEW_MESSAGE_CHARS;

  /* ------------------------------------------------------------------
     Persistence: the resumable save is read SSR-safely by `useResumableSession`
     above (no mount effect needed). `persist` writes the transcript on every
     change while an interview is live, so an accidental reload does not throw away
     a 20-minute session; guarded for SSR (no window) and private-mode throws.
     ------------------------------------------------------------------ */

  const persist = useCallback(
    (
      next: InterviewMessage[],
      ended: boolean,
      // The graded result, passed only on a successful score. Omitting it (the
      // common per-turn write) leaves the fields absent, so a live save never
      // carries a scorecard and the readiness report only ever sees real grades.
      scored?: { scorecard: InterviewScorecard; scoredAt: number },
    ) => {
      if (typeof window === 'undefined') return;
      try {
        const payload: PersistedSession = {
          version: PERSIST_VERSION,
          messages: next,
          ended,
          ...(scored
            ? { scorecard: scored.scorecard, scoredAt: scored.scoredAt }
            : {}),
        };
        window.localStorage.setItem(persistKey(interviewCase.id), JSON.stringify(payload));
        // Back the transcript up to the account when signed in (no-op otherwise).
        notifySyncKeyChanged(persistKey(interviewCase.id));
      } catch {
        // Storage full or blocked (private mode): the session still works in
        // memory, it just will not survive a reload. Nothing to surface.
      }
    },
    [interviewCase.id],
  );

  const clearPersisted = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(persistKey(interviewCase.id));
      // Propagate the clear as a tombstone when signed in (no-op otherwise).
      notifySyncKeyChanged(persistKey(interviewCase.id));
    } catch {
      // Best-effort; a stale save is harmless (it only offers a resume).
    }
  }, [interviewCase.id]);

  /* ------------------------------------------------------------------
     Auto-scroll: keep the newest turn in view as the thread grows or the typing
     indicator appears. In an effect (not render) so there is no side effect in
     the render path; reduced-motion gets an instant jump. The aria-live log
     handles the announcement for assistive tech.
     ------------------------------------------------------------------ */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase !== 'running') return;
    messagesEndRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [messages.length, sending, reducedMotion, phase]);

  /* ------------------------------------------------------------------
     Evidence chips: clicking one scrolls to the referenced candidate turn and
     flashes a highlight ring on it, so feedback points at the exact moment.
     ------------------------------------------------------------------ */
  const [highlightedTurn, setHighlightedTurn] = useState<number | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleEvidenceClick = useCallback(
    (turn: number) => {
      const el = document.getElementById(`candidate-turn-${turn}`);
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
      setHighlightedTurn(turn);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightedTurn(null), 1600);
    },
    [reducedMotion],
  );
  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    };
  }, []);

  /* ------------------------------------------------------------------
     Actions.
     ------------------------------------------------------------------ */
  function startFresh() {
    // A clean start: drop any saved transcript and seed a new one with just the
    // opening. The candidate explicitly chose this over resuming.
    clearPersisted();
    const seed: InterviewMessage[] = [{ role: 'interviewer', text: interviewCase.opening }];
    setMessages(seed);
    setResumeDismissed(true);
    setUnavailable(null);
    setError(null);
    setScorecard(null);
    setTurnCapHit(false);
    setPhase('running');
    persist(seed, false);
  }

  function resumeSaved() {
    if (!resumable) return;
    setMessages(resumable.messages);
    setResumeDismissed(true);
    setPhase('running');
  }

  async function handleSend() {
    if (!inputOpen || !trimmedDraft) return;
    setError(null);
    const candidateMsg: InterviewMessage = {
      role: 'candidate',
      text: trimmedDraft.slice(0, MAX_INTERVIEW_MESSAGE_CHARS),
    };
    // Optimistic append: the candidate's turn shows immediately, then we ask the
    // interviewer for its next probe.
    const next = [...messages, candidateMsg];
    setMessages(next);
    setDraft('');
    persist(next, false);

    const result = await sendReply(interviewCase.id, next);
    if (result.kind === 'reply') {
      const withReply = [...next, { role: 'interviewer' as const, text: result.text }];
      setMessages(withReply);
      persist(withReply, false);
    } else if (result.kind === 'unavailable') {
      // No key / at capacity / allowance spent: keep the candidate's turn in the
      // thread, show the calm fallback, and lock further sending (there is nothing
      // to talk to). The transcript is preserved.
      setUnavailable(result.message);
      setTurnCapHit(true);
    } else {
      // Real error. If it is the server turn cap, force the wrap-up; otherwise show
      // the error and let them retry (their typed turn stays in the thread).
      setError(result.message);
      if (result.turnLimitReached) setTurnCapHit(true);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline. Keyboard-operable by design.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  async function handleEnd() {
    if (!canScore || scoring) return;
    setError(null);
    const result = await score(interviewCase.id, messages);
    if (result.kind === 'scorecard') {
      setScorecard(result.scorecard);
      setUnavailable(null);
      setPhase('scored');
      // Persist the scorecard + when it was graded alongside the transcript, so
      // the readiness report can aggregate this scored interview. This is still
      // the single `persist` write path (and so it syncs for free).
      persist(messages, true, { scorecard: result.scorecard, scoredAt: Date.now() });
    } else if (result.kind === 'unavailable') {
      setUnavailable(result.message);
      setScorecard(null);
      setPhase('scored');
      persist(messages, true);
    } else {
      // A hard scoring error keeps us running so the transcript is not lost and the
      // candidate can try to end again.
      setError(result.message);
    }
  }

  function handleRetake() {
    // From the scorecard: wipe the save and reset to a fresh pre-start so the
    // candidate can sit the same case again.
    clearPersisted();
    setMessages([{ role: 'interviewer', text: interviewCase.opening }]);
    setDraft('');
    setUnavailable(null);
    setError(null);
    setScorecard(null);
    setTurnCapHit(false);
    setHighlightedTurn(null);
    setPhase('pre-start');
  }

  // Number each candidate turn so evidence anchors ([1], [2], …) make sense. The
  // map is index-in-messages -> candidate turn number, computed once per render.
  const candidateTurnNumbers = useMemo(() => {
    const map = new Map<number, number>();
    let n = 0;
    messages.forEach((m, i) => {
      if (m.role === 'candidate') {
        n += 1;
        map.set(i, n);
      }
    });
    return map;
  }, [messages]);

  return (
    <>
      <Topbar
        right={
          <Link
            href="/interview"
            aria-label="Leave the interview and return to the case picker"
            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <XIcon size={16} />
          </Link>
        }
      />

      <main className="flex-auto">
        <div className="mx-auto max-w-[760px] px-6">
          {/* body */}
          <div className={phase === 'pre-start' ? 'pb-24 pt-6' : 'pb-[320px] pt-6'}>
            {/* case header (always visible) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                <UsersIcon size={12} />
                {interviewCase.kind === 'product-sense' ? 'Product sense' : 'Execution'}
              </span>
              <span className="mono inline-flex items-center gap-1 rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate">
                <ClockIcon size={12} />
                {interviewCase.durationMin} min
              </span>
            </div>

            <h1 className="mt-4 text-[24px] font-bold leading-[1.25] tracking-[-0.015em] text-ink max-[560px]:text-[21px]">
              {interviewCase.title}
            </h1>
            <p className="mt-2 text-[14px] leading-[1.6] text-slate">{interviewCase.hook}</p>

            {/* interviewer identity */}
            <div className="mt-4 flex items-center gap-2.5">
              <span className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-line bg-panel text-slate">
                <UsersIcon size={17} />
              </span>
              <div>
                <div className="text-[14px] font-semibold text-ink">
                  {interviewCase.interviewerName}
                </div>
                <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
                  Your interviewer
                </div>
              </div>
            </div>

            {phase === 'pre-start' ? (
              <PreStart
                setup={interviewCase.setup}
                dimensions={interviewCase.dimensions}
                resumable={resumable}
                hydrated={hydrated}
                onStart={startFresh}
                onResume={resumeSaved}
              />
            ) : (
              <>
                {/* the visible dimension bar during the interview: the candidate
                    keeps sight of what's being scored (the descriptors are held
                    back until the debrief, matching a real screen). */}
                <div className="mt-[18px] flex flex-wrap gap-1.5">
                  {interviewCase.dimensions.map((d) => (
                    <span
                      key={d.id}
                      className="mono rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-slate"
                    >
                      {d.label}
                    </span>
                  ))}
                </div>

                {/* the transcript */}
                <section aria-label="Interview transcript" className="mt-[20px]">
                  <div className="mono mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-[0.1em] text-mute">
                    <span>Transcript</span>
                    <span className="tnum">
                      Turn {padIndex(Math.min(candidateTurns, MAX_CANDIDATE_TURNS))} of{' '}
                      {padIndex(MAX_CANDIDATE_TURNS)}
                    </span>
                  </div>

                  {/* aria-live log: each new bubble is announced to assistive tech. */}
                  <div role="log" aria-live="polite" aria-relevant="additions" className="grid gap-2.5">
                    {messages.map((m, i) => (
                      <ChatBubble
                        key={i}
                        role={m.role}
                        text={m.text}
                        interviewerName={interviewCase.interviewerName}
                        turnNumber={candidateTurnNumbers.get(i)}
                        highlighted={
                          m.role === 'candidate' && candidateTurnNumbers.get(i) === highlightedTurn
                        }
                      />
                    ))}
                    {sending && <TypingBubble name={interviewCase.interviewerName} />}
                    <div ref={messagesEndRef} />
                  </div>
                </section>
              </>
            )}
          </div>
        </div>

        {/* fixed dock: the running input + the scored card + primary actions.
            Hidden entirely on the pre-start screen (Start lives inline there). */}
        {phase !== 'pre-start' && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
            <div className="mx-auto max-w-[760px] px-6 pb-5">
              {/* the graded scorecard / unavailable card */}
              {phase === 'scored' && (
                <div
                  role="status"
                  aria-live="polite"
                  className="pointer-events-auto mb-3 max-h-[60vh] overflow-y-auto rounded-console-lg border border-line bg-paper p-[16px_18px] shadow-console-lg"
                >
                  {unavailable ? (
                    <UnavailableOrError
                      tone="warn"
                      title="Scoring unavailable"
                      body={unavailable}
                      note="Your transcript is saved above. Without scoring there is no committee verdict, but you can re-read the interview or take it again."
                    />
                  ) : scorecard ? (
                    <Scorecard scorecard={scorecard} onEvidenceClick={handleEvidenceClick} />
                  ) : null}
                </div>
              )}

              {/* the graceful unavailable / error banner DURING the interview (a
                  failed reply keeps the transcript and explains what happened). */}
              {phase === 'running' && (unavailable || error) && (
                <div
                  role="status"
                  aria-live="assertive"
                  className="pointer-events-auto mb-3 rounded-console-lg border border-line bg-paper p-[14px_16px] shadow-console-md"
                >
                  <UnavailableOrError
                    tone={unavailable ? 'warn' : 'bad'}
                    title={unavailable ? 'Interview unavailable' : 'Message not sent'}
                    body={unavailable ?? error ?? ''}
                    note={
                      unavailable
                        ? 'This needs an API key. Your transcript is saved. You can end the interview and we will show what we have.'
                        : atTurnCap
                          ? 'You have reached the turn limit. End the interview to get your scorecard.'
                          : 'Your transcript is saved. Try sending again in a moment.'
                    }
                  />
                </div>
              )}

              {/* the input row (running phase only) */}
              {phase === 'running' && (
                <div className="pointer-events-auto rounded-console-lg border border-line bg-paper p-2.5 shadow-console-lg">
                  <label htmlFor="interview-input" className="sr-only">
                    Your answer to {interviewCase.interviewerName}
                  </label>
                  <textarea
                    id="interview-input"
                    rows={2}
                    value={draft}
                    disabled={!inputOpen}
                    maxLength={MAX_INTERVIEW_MESSAGE_CHARS}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      atTurnCap
                        ? 'Turn limit reached. End the interview to get your scorecard.'
                        : unavailable
                          ? 'The interview is unavailable in this environment.'
                          : `Answer ${interviewCase.interviewerName}. Think out loud.`
                    }
                    className="w-full resize-none rounded-console border-0 bg-transparent px-2 py-1.5 text-[14px] leading-[1.6] text-ink placeholder:text-faint focus:outline-none disabled:cursor-not-allowed disabled:text-slate"
                  />
                  <div className="mt-1 flex items-center gap-2.5 px-1">
                    <span
                      className={[
                        'mono text-[10.5px] uppercase tracking-[0.08em]',
                        overCharLimit ? 'text-warn' : 'text-faint',
                      ].join(' ')}
                    >
                      {atTurnCap ? (
                        'Turn limit reached'
                      ) : (
                        <span className="tnum">
                          {draft.length} / {MAX_INTERVIEW_MESSAGE_CHARS}
                        </span>
                      )}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleEnd}
                        disabled={!canScore || scoring}
                        title={
                          canScore
                            ? 'End interview and get your scorecard'
                            : `Answer at least ${MIN_CANDIDATE_TURNS_TO_SCORE} questions first`
                        }
                        className={[
                          'mono inline-flex flex-none items-center justify-center gap-2 rounded-console border px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150',
                          canScore && !scoring
                            ? 'border-line bg-paper text-slate hover:border-faint hover:text-ink active:translate-y-px'
                            : 'cursor-not-allowed border-line bg-panel-2 text-faint',
                        ].join(' ')}
                      >
                        {scoring ? (
                          <>
                            <Spinner />
                            Deliberating
                          </>
                        ) : (
                          'End interview & get scorecard'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!inputOpen || !trimmedDraft}
                        aria-label="Send answer"
                        className={[
                          'mono inline-flex flex-none items-center justify-center gap-2 rounded-console border-0 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform,opacity] duration-150 active:translate-y-px',
                          inputOpen && trimmedDraft
                            ? 'bg-accent text-white hover:bg-accent-700'
                            : 'cursor-not-allowed bg-panel-2 text-faint shadow-none',
                        ].join(' ')}
                      >
                        {sending ? <Spinner /> : <ArrowRightIcon size={15} />}
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* scored phase: take the case again. */}
              {phase === 'scored' && (
                <div className="pointer-events-auto flex gap-2.5">
                  <Link
                    href="/interview"
                    className="mono inline-flex flex-none items-center justify-center gap-2 rounded-console border border-line bg-paper px-[18px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink active:translate-y-px"
                  >
                    All cases
                  </Link>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="mono inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 bg-accent px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] text-white shadow-console-md transition-[background,transform] duration-150 hover:bg-accent-700 active:translate-y-px"
                  >
                    <RestartIcon size={16} />
                    Take it again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/* ------------------------------------------------------------------
   Pre-start screen: setup paragraphs, the visible dimension bar, and the Start
   button — plus a Resume / Start-over choice when a saved transcript exists.
   ------------------------------------------------------------------ */
function PreStart({
  setup,
  dimensions,
  resumable,
  hydrated,
  onStart,
  onResume,
}: {
  setup: string[];
  dimensions: PublicInterviewCase['dimensions'];
  resumable: PersistedSession | null;
  hydrated: boolean;
  onStart: () => void;
  onResume: () => void;
}) {
  const resumeTurns = resumable ? countCandidateTurns(resumable.messages) : 0;

  return (
    <>
      {/* how this works */}
      <section
        aria-labelledby="interview-setup-heading"
        className="mt-[20px] rounded-console-lg border border-line bg-panel p-[17px_19px]"
      >
        <div id="interview-setup-heading" className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
          How this works
        </div>
        <div className="mt-2.5 grid gap-2.5">
          {setup.map((para, i) => (
            <p key={i} className="text-[13.5px] leading-[1.65] text-ink-2">
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* the visible bar: what the committee scores (labels only; the descriptors
          arrive in the debrief, matching a real interview). */}
      <section aria-labelledby="interview-dims-heading" className="mt-[14px] rounded-console-lg border border-line bg-paper p-[17px_19px]">
        <div id="interview-dims-heading" className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
          What the committee scores
        </div>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {dimensions.map((d) => (
            <li
              key={d.id}
              className="mono rounded-console-sm border border-line bg-panel px-2 py-1 text-[10.5px] uppercase tracking-[0.08em] text-slate"
            >
              {d.label}
            </li>
          ))}
        </ul>
      </section>

      {/* Resume / Start over, only when a saved transcript is available. The
          `hydrated` gate avoids a start-button flash before localStorage is read. */}
      <div className="mt-[22px] grid gap-2.5">
        {resumable && (
          <div className="rounded-console-lg border border-accent-100 bg-accent-050 p-[15px_17px]">
            <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-accent">
              Interview in progress
            </div>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">
              You have a saved interview for this case with{' '}
              <span className="tnum font-semibold text-ink">{resumeTurns}</span>{' '}
              answer{resumeTurns === 1 ? '' : 's'} so far. Pick up where you left off, or start over.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="mono inline-flex items-center justify-center gap-2 rounded-console border-0 bg-accent px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white shadow-console-md transition-[background,transform] duration-150 hover:bg-accent-700 active:translate-y-px"
              >
                Resume
                <ChevronRightIcon size={15} />
              </button>
              <button
                type="button"
                onClick={onStart}
                className="mono inline-flex items-center justify-center gap-2 rounded-console border border-line bg-paper px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink active:translate-y-px"
              >
                <RestartIcon size={14} />
                Start over
              </button>
            </div>
          </div>
        )}

        {!resumable && (
          <button
            type="button"
            onClick={onStart}
            disabled={!hydrated}
            className={[
              'mono inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[16px] text-[14px] font-semibold uppercase tracking-[0.08em] text-white shadow-console-md transition-[background,transform,opacity] duration-150 active:translate-y-px',
              hydrated ? 'bg-accent hover:bg-accent-700' : 'cursor-wait bg-panel-2 text-faint shadow-none',
            ].join(' ')}
          >
            Start the interview
            <ArrowRightIcon size={16} />
          </button>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------
   One chat bubble. The interviewer and candidate are distinguished by alignment,
   colour, AND a text label (never colour alone), so the thread is legible without
   relying on hue. The interviewer sits left in a panel; the candidate sits right
   in the accent tint. Candidate turns carry a visible [n] number and an anchor id
   so evidence chips can jump to them, plus a flash-highlight when targeted.
   ------------------------------------------------------------------ */
function ChatBubble({
  role,
  text,
  interviewerName,
  turnNumber,
  highlighted,
}: {
  role: InterviewMessage['role'];
  text: string;
  interviewerName: string;
  /** The [n] candidate turn number; undefined for interviewer turns. */
  turnNumber?: number;
  highlighted: boolean;
}) {
  const isCandidate = role === 'candidate';
  return (
    <div
      id={isCandidate && turnNumber ? `candidate-turn-${turnNumber}` : undefined}
      className={`flex scroll-mt-24 ${isCandidate ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[86%] ${isCandidate ? 'items-end' : 'items-start'}`}>
        <div
          className={`mono mb-1 flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.1em] ${
            isCandidate ? 'justify-end text-accent' : 'text-mute'
          }`}
        >
          {isCandidate && turnNumber && (
            <span className="tnum rounded-console-sm bg-accent-050 px-1 py-px text-accent">
              [{turnNumber}]
            </span>
          )}
          {isCandidate ? 'You' : interviewerName}
        </div>
        <div
          className={[
            'rounded-console-lg px-3.5 py-2.5 text-[13.5px] leading-[1.6] whitespace-pre-wrap transition-shadow duration-300',
            isCandidate
              ? 'rounded-tr-sm border border-accent-100 bg-accent-050 text-ink'
              : 'rounded-tl-sm border border-line bg-panel text-ink-2',
            highlighted ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : '',
          ].join(' ')}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

/** The "interviewer is thinking" placeholder while a reply is in flight. */
function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[86%]">
        <div className="mono mb-1 text-[9.5px] uppercase tracking-[0.1em] text-mute">{name}</div>
        <div className="inline-flex items-center gap-1.5 rounded-console-lg rounded-tl-sm border border-line bg-panel px-3.5 py-3">
          <span className="sr-only">{name} is responding</span>
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </div>
      </div>
    </div>
  );
}

/** One bouncing dot in the typing indicator (animation honours reduced-motion). */
function Dot({ delay }: { delay: number }) {
  return (
    <span
      aria-hidden
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
