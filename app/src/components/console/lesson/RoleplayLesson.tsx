'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Skill } from '@/curriculum/types';
import type { IndustryId } from '@/curriculum/industries';
import { INDUSTRIES, INDUSTRY_NOUNS } from '@/curriculum/industries';
import type { IndustryContext } from '@/curriculum/lessons/types';
import {
  type ResolvedRoleplay,
  type RoleplayMessage,
  type RoleplayScenario,
  countLearnerTurns,
  resolveRoleplay,
  MAX_LEARNER_TURNS,
  MAX_MESSAGE_CHARS,
  MIN_LEARNER_TURNS_TO_SCORE,
} from '@/curriculum/roleplay';
import { getNextSkill, getUnitForSkill, TOTAL_SKILLS } from '@/curriculum/data';
import { useLearnStore } from '@/store/learnStore';
import { useReducedMotion } from '../sim/useReducedMotion';
import { Topbar } from '../Topbar';
import { CompletionOverlay } from './CompletionOverlay';
import {
  type RoleplayVerdict,
  useRoleplay,
} from './useRoleplay';
import {
  DraftSavedOverlay,
  Spinner,
  UnavailableOrError,
  Verdict,
} from './verdictUi';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  MessageIcon,
  TargetIcon,
  UsersIcon,
  XIcon,
} from '../Icon';

const padIndex = (n: number) => String(n).padStart(2, '0');

/**
 * Phases of the roleplay loop:
 *  - chat:     the learner reads the setup (who they are talking to, the
 *              situation, the goal, the visible rubric) and exchanges messages
 *              with the in-character AI counterpart. "Wrap up and get scored"
 *              enables after a couple of real exchanges, and is forced once the
 *              server-enforced turn cap is hit.
 *  - scored:   the rubric verdict is shown (per-criterion band + comment,
 *              strengths, gaps, overall). A passing verdict offers Continue
 *              (records mastery); a non-passing one and the scoring-unavailable
 *              fallback let the learner move on with NOTHING recorded.
 *  - complete: the exit screen, which tells the truth. A genuine pass (mastery
 *              recorded) shows the shared "Skill mastered" celebration; a
 *              sub-pass or "unavailable / continue anyway" path recorded nothing
 *              and shows the honest "attempt saved, not yet mastered" screen with
 *              the count unchanged.
 */
type Phase = 'chat' | 'scored' | 'complete';

/** Passing bar mirrors the server's: overallScore >= 70 (also `verdict.passed`). */
const PASS_SCORE = 70;

/** Build the small industry context a scenario resolves against. */
function industryContext(id: IndustryId): IndustryContext {
  const label = INDUSTRIES.find((i) => i.id === id)?.label ?? id;
  const nouns = INDUSTRY_NOUNS[id];
  return { id, label, product: nouns.product, user: nouns.user };
}

export function RoleplayLesson({
  skill,
  scenario,
  industry,
}: {
  skill: Skill;
  scenario: RoleplayScenario;
  industry: IndustryId;
}) {
  const router = useRouter();
  const recordResult = useLearnStore((s) => s.recordResult);
  const streak = useLearnStore((s) => s.streak);
  const masteredCountNow = useLearnStore((s) => s.masteredCount);
  const alreadyMastered = useLearnStore((s) => s.isMastered(skill.id));
  const reducedMotion = useReducedMotion();

  const ctx = useMemo(() => industryContext(industry), [industry]);
  const resolved: ResolvedRoleplay = useMemo(
    () => resolveRoleplay(scenario, ctx),
    [scenario, ctx],
  );

  // The transcript is seeded with the character's opening line so the
  // conversation starts from their pushback, exactly like the scenario reads.
  const [messages, setMessages] = useState<RoleplayMessage[]>(() => [
    { role: 'character', text: resolved.opening },
  ]);
  const [draft, setDraft] = useState('');
  const [phase, setPhase] = useState<Phase>('chat');
  const [rubricOpen, setRubricOpen] = useState(true);

  // Terminal states for the two round-trips. `unavailable` is the calm no-key
  // fallback (NON-error); `error` is a real failure. Both preserve the
  // conversation. `verdict` is the scored result.
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<RoleplayVerdict | null>(null);
  // True once the server (or the client) has signalled the turn cap, so the
  // input is locked and only wrap-up remains.
  const [turnCapHit, setTurnCapHit] = useState(false);

  const { sending, scoring, sendReply, score } = useRoleplay();

  const unit = useMemo(() => getUnitForSkill(skill.id), [skill.id]);
  const nextSkill = useMemo(() => getNextSkill(skill.id), [skill.id]);
  const stepInfo = useMemo(() => {
    if (!unit) return { index: 1, total: 1 };
    const idx = unit.skills.findIndex((s) => s.id === skill.id);
    return { index: idx === -1 ? 1 : idx + 1, total: unit.skills.length };
  }, [unit, skill.id]);

  const learnerTurns = countLearnerTurns(messages);
  const atTurnCap = turnCapHit || learnerTurns >= MAX_LEARNER_TURNS;
  // Wrap-up normally needs a couple of real exchanges so there is something worth
  // grading. The no-key `unavailable` path is the exception: there is nothing to
  // grade and the input is locked, so we still let the learner wrap up (it routes
  // straight to the honest "attempt saved, not mastered" exit) rather than
  // stranding them with only the Close button.
  const canScore = learnerTurns >= MIN_LEARNER_TURNS_TO_SCORE || unavailable !== null;
  // The input is open only while chatting, not at the cap, and not mid-request.
  const inputOpen = phase === 'chat' && !atTurnCap && !sending && !scoring;
  const trimmedDraft = draft.trim();

  // Count for the completion screen.
  //  - A genuine pass records mastery, so the celebratory overlay shows the
  //    incremented count (unless already mastered).
  //  - A sub-pass / unavailable / continue-anyway path records nothing, so the
  //    honest overlay must show the UNCHANGED count: no phantom +1.
  const masteredCountAfterPass = masteredCountNow() + (alreadyMastered ? 0 : 1);
  const passed = verdict ? verdict.passed || verdict.overallScore >= PASS_SCORE : false;
  const progressPct = phase === 'chat' ? 45 : phase === 'scored' ? 75 : 100;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep the newest turn in view as the thread grows or the typing indicator
  // appears. Done in an effect (not during render) so there is no side effect in
  // the render path; reduced-motion gets an instant jump instead of a smooth
  // scroll. The aria-live log handles the announcement for assistive tech.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [messages.length, sending, reducedMotion]);

  async function handleSend() {
    if (!inputOpen || !trimmedDraft) return;
    setError(null);
    const learnerMsg: RoleplayMessage = {
      role: 'learner',
      text: trimmedDraft.slice(0, MAX_MESSAGE_CHARS),
    };
    const next = [...messages, learnerMsg];
    setMessages(next);
    setDraft('');

    const result = await sendReply(resolved, next);
    if (result.kind === 'reply') {
      setMessages((prev) => [...prev, { role: 'character', text: result.text }]);
    } else if (result.kind === 'unavailable') {
      // No key: keep the learner's turn in the thread, show the calm fallback,
      // and lock further sending (there is nothing to talk to). The conversation
      // is preserved; nothing is recorded.
      setUnavailable(result.message);
      setTurnCapHit(true);
    } else {
      // Real error. If it is the server turn cap, force wrap-up; otherwise show
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

  async function handleWrapUp() {
    if (!canScore || scoring) return;
    setError(null);
    const result = await score(resolved, messages);
    if (result.kind === 'verdict') {
      setVerdict(result.verdict);
      setUnavailable(null);
      setPhase('scored');
    } else if (result.kind === 'unavailable') {
      setUnavailable(result.message);
      setVerdict(null);
      setPhase('scored');
    } else {
      // A hard scoring error keeps us in chat so the conversation is not lost and
      // the learner can try to wrap up again.
      setError(result.message);
    }
  }

  function handleContinue() {
    // HONEST completion: only a genuine passing score records mastery. The
    // unavailable fallback and a sub-pass verdict still let the learner move on
    // (the conversation is preserved either way), but neither writes competence.
    if (phase === 'scored' && passed) recordResult(skill.id, 1);
    setPhase('complete');
  }

  const goHome = () => router.push('/');

  return (
    <>
      <Topbar
        right={
          <button
            type="button"
            onClick={goHome}
            aria-label="Close and return to the path"
            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-console border border-line bg-paper text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
          >
            <XIcon size={16} />
          </button>
        }
      />

      <main className="flex-auto">
        <div className="mx-auto max-w-[760px] px-6">
          {/* slim progress rail */}
          <div className="sticky top-[49px] z-10 flex items-center gap-4 bg-background py-[18px] pb-4 max-[560px]:top-[45px]">
            <div className="h-[7px] flex-auto overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mono tnum whitespace-nowrap text-[11px] text-slate">
              {padIndex(stepInfo.index)} / {padIndex(stepInfo.total)}
            </span>
          </div>

          {/* body */}
          <div className="pb-[300px] pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-accent-100 bg-accent-050 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-accent">
                <MessageIcon size={12} />
                Roleplay
              </span>
              <span className="mono rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate">
                {unit ? `Unit ${padIndex(unit.number)}` : 'Skill'} · {skill.title}
              </span>
              <span className="eyebrow">{resolved.scenarioTag}</span>
            </div>

            <h2 className="mt-4 text-[24px] font-bold leading-[1.25] tracking-[-0.015em] text-ink max-[560px]:text-[21px]">
              {resolved.title}
            </h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-slate">{resolved.hook}</p>
            {resolved.framework && (
              <p className="mono mt-1 text-[11px] uppercase tracking-[0.08em] text-faint">
                {resolved.framework}
              </p>
            )}

            {/* who you are talking to */}
            <section
              aria-labelledby="roleplay-character-heading"
              className="mt-[20px] rounded-console-lg border border-line bg-panel p-[17px_19px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-line bg-paper text-slate">
                  <UsersIcon size={17} />
                </span>
                <div>
                  <div
                    id="roleplay-character-heading"
                    className="text-[14px] font-semibold text-ink"
                  >
                    {resolved.characterName}
                  </div>
                  <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
                    Who you are talking to
                  </div>
                </div>
              </div>
              <p className="mt-2.5 text-[13.5px] leading-[1.6] text-ink-2">
                {resolved.characterStance}
              </p>

              <div className="mt-3.5 border-t border-dashed border-line pt-3">
                <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
                  The situation
                </div>
                <div className="mt-2 grid gap-2">
                  {resolved.situation.map((para, i) => (
                    <p key={i} className="text-[13.5px] leading-[1.65] text-ink-2">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 border-t border-dashed border-line pt-3">
                <div className="mono flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.1em] text-accent">
                  <TargetIcon size={13} />
                  Your goal
                </div>
                <ul className="mt-2 grid gap-1.5">
                  {resolved.goal.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-[13.5px] leading-[1.55] text-ink-2"
                    >
                      <span
                        aria-hidden
                        className="mt-[7px] h-1 w-1 flex-none rounded-full bg-accent"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* the visible rubric: the learner sees the bar before talking */}
            <section
              aria-labelledby="roleplay-rubric-heading"
              className="mt-[14px] rounded-console-lg border border-line bg-paper"
            >
              <button
                type="button"
                aria-expanded={rubricOpen}
                onClick={() => setRubricOpen((v) => !v)}
                className="flex w-full items-center gap-2 rounded-console-lg px-[19px] py-[14px] text-left transition-colors duration-150 hover:bg-panel/60"
              >
                <span
                  id="roleplay-rubric-heading"
                  className="mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink"
                >
                  How this is scored
                </span>
                <span className="mono rounded-full bg-panel-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-slate">
                  {resolved.rubric.length} criteria
                </span>
                <ChevronRightIcon
                  size={15}
                  className={`ml-auto flex-none text-faint transition-transform duration-200 ${
                    rubricOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {rubricOpen && (
                <ol className="grid gap-3 border-t border-line px-[19px] pb-[17px] pt-[15px]">
                  {resolved.rubric.map((c, i) => (
                    <li key={c.id} className="flex gap-3">
                      <span className="mono tnum mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent-050 text-[10.5px] font-semibold text-accent">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-[13.5px] font-semibold text-ink">{c.label}</div>
                        <p className="mt-0.5 text-[13px] leading-[1.55] text-slate">
                          {c.descriptor}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* the chat thread */}
            <section aria-label="Conversation" className="mt-[20px]">
              <div className="mono mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-[0.1em] text-mute">
                <span>Conversation</span>
                <span className="tnum">
                  Turn {padIndex(Math.min(learnerTurns, MAX_LEARNER_TURNS))} /{' '}
                  {padIndex(MAX_LEARNER_TURNS)}
                </span>
              </div>

              {/* aria-live log: each new bubble is announced to assistive tech. */}
              <div
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                className="grid gap-2.5"
              >
                {messages.map((m, i) => (
                  <ChatBubble key={i} role={m.role} text={m.text} name={resolved.characterName} />
                ))}
                {sending && <TypingBubble name={resolved.characterName} />}
                <div ref={messagesEndRef} />
              </div>
            </section>
          </div>
        </div>

        {/* fixed dock: input + verdict + primary action */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[760px] px-6 pb-5">
            {/* scored verdict / unavailable / error card */}
            {phase === 'scored' && (
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-auto mb-3 max-h-[56vh] overflow-y-auto rounded-console-lg border border-line bg-paper p-[16px_18px] shadow-console-lg"
              >
                {unavailable ? (
                  <UnavailableOrError
                    tone="warn"
                    title="Roleplay unavailable"
                    body={unavailable}
                    note="Your conversation is saved above. Without scoring this skill cannot be marked mastered, but you can keep the transcript and move on."
                  />
                ) : verdict ? (
                  <Verdict
                    verdict={verdict}
                    passed={passed}
                    sourceLabel="Rubric feedback from Claude"
                  />
                ) : null}
              </div>
            )}

            {/* The graceful unavailable / error banner DURING chat (a failed reply
                keeps the conversation and explains what happened). */}
            {phase === 'chat' && (unavailable || error) && (
              <div
                role="status"
                aria-live="assertive"
                className="pointer-events-auto mb-3 rounded-console-lg border border-line bg-paper p-[14px_16px] shadow-console-md"
              >
                <UnavailableOrError
                  tone={unavailable ? 'warn' : 'bad'}
                  title={unavailable ? 'Roleplay unavailable' : 'Message not sent'}
                  body={unavailable ?? error ?? ''}
                  note={
                    unavailable
                      ? 'This needs an API key. Your conversation is saved. You can wrap up and we will save the attempt without marking the skill mastered.'
                      : atTurnCap
                        ? 'You have reached the turn limit. Wrap up to get scored.'
                        : 'Your conversation is saved. Try sending again in a moment.'
                  }
                />
              </div>
            )}

            {/* the input row (chat phase only) */}
            {phase === 'chat' && (
              <div className="pointer-events-auto rounded-console-lg border border-line bg-paper p-2.5 shadow-console-lg">
                <label htmlFor="roleplay-input" className="sr-only">
                  Your reply to {resolved.characterName}
                </label>
                <textarea
                  id="roleplay-input"
                  rows={2}
                  value={draft}
                  disabled={!inputOpen}
                  maxLength={MAX_MESSAGE_CHARS}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    atTurnCap
                      ? 'Turn limit reached. Wrap up and get scored.'
                      : unavailable
                        ? 'Roleplay is unavailable in this environment.'
                        : `Reply to ${resolved.characterName}. Make your case.`
                  }
                  className="w-full resize-none rounded-console border-0 bg-transparent px-2 py-1.5 text-[14px] leading-[1.6] text-ink placeholder:text-faint focus:outline-none disabled:cursor-not-allowed disabled:text-slate"
                />
                <div className="mt-1 flex items-center gap-2.5 px-1">
                  <span className="mono text-[10.5px] uppercase tracking-[0.08em] text-faint">
                    {atTurnCap
                      ? 'Turn limit reached'
                      : 'Enter to send · Shift+Enter for a new line'}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleWrapUp}
                      disabled={!canScore || scoring}
                      title={
                        canScore
                          ? 'Wrap up and get scored'
                          : `Have at least ${MIN_LEARNER_TURNS_TO_SCORE} exchanges first`
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
                          Scoring
                        </>
                      ) : (
                        'Wrap up and get scored'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!inputOpen || !trimmedDraft}
                      aria-label="Send reply"
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

            {/* scored phase: Continue (records mastery only on a genuine pass). */}
            {phase === 'scored' && (
              <div className="pointer-events-auto flex gap-2.5">
                <button
                  type="button"
                  onClick={handleContinue}
                  className={[
                    'mono inline-flex w-full items-center justify-center gap-2.5 rounded-console border-0 px-[18px] py-[15px] text-[14px] font-semibold uppercase tracking-[0.08em] text-white shadow-console-md transition-[background,transform] duration-150 active:translate-y-px',
                    passed ? 'bg-good hover:bg-good-700' : 'bg-accent hover:bg-accent-700',
                  ].join(' ')}
                >
                  {passed ? (
                    <>
                      Continue
                      <ChevronRightIcon size={16} />
                    </>
                  ) : (
                    <>
                      Continue anyway
                      <ChevronRightIcon size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* On completion, the screen tells the truth. Only a genuine pass (verdict
          cleared the bar AND mastery was recorded) earns the celebratory overlay.
          A sub-pass verdict or the unavailable / continue-anyway path recorded
          nothing, so it gets the honest "attempt saved, not yet mastered" screen
          with the UNCHANGED count. */}
      {phase === 'complete' &&
        (passed ? (
          <CompletionOverlay
            skillTitle={skill.title}
            masteredCount={masteredCountAfterPass}
            totalSkills={TOTAL_SKILLS}
            streak={streak}
            nextSkillTitle={nextSkill?.title ?? null}
            nextSkillIndex={nextSkill?.index ?? null}
            onContinue={goHome}
          />
        ) : (
          <DraftSavedOverlay
            skillTitle={skill.title}
            masteredCount={masteredCountNow()}
            totalSkills={TOTAL_SKILLS}
            onContinue={goHome}
            badgeLabel="Attempt saved"
            body="This conversation did not clear the bar yet, so the skill is not mastered. Your transcript is kept. Come back and run it again to earn it."
          />
        ))}
    </>
  );
}

/* ------------------------------------------------------------------
   One chat bubble. The character and the learner are distinguished by alignment,
   color, AND a text label (never color alone), so the thread is legible without
   relying on hue. The character sits left in a panel; the learner sits right in
   the accent tint.
   ------------------------------------------------------------------ */
function ChatBubble({
  role,
  text,
  name,
}: {
  role: RoleplayMessage['role'];
  text: string;
  name: string;
}) {
  const isLearner = role === 'learner';
  return (
    <div className={`flex ${isLearner ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[86%] ${isLearner ? 'items-end' : 'items-start'}`}>
        <div
          className={`mono mb-1 text-[9.5px] uppercase tracking-[0.1em] ${
            isLearner ? 'text-right text-accent' : 'text-mute'
          }`}
        >
          {isLearner ? 'You' : name}
        </div>
        <div
          className={[
            'rounded-console-lg px-3.5 py-2.5 text-[13.5px] leading-[1.6] whitespace-pre-wrap',
            isLearner
              ? 'rounded-tr-sm border border-accent-100 bg-accent-050 text-ink'
              : 'rounded-tl-sm border border-line bg-panel text-ink-2',
          ].join(' ')}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

/** The "character is typing" placeholder while a reply is in flight. */
function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[86%]">
        <div className="mono mb-1 text-[9.5px] uppercase tracking-[0.1em] text-mute">{name}</div>
        <div className="inline-flex items-center gap-1.5 rounded-console-lg rounded-tl-sm border border-line bg-panel px-3.5 py-3">
          <span className="sr-only">{name} is replying</span>
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </div>
      </div>
    </div>
  );
}

/** One bouncing dot in the typing indicator (animation honors reduced-motion). */
function Dot({ delay }: { delay: number }) {
  return (
    <span
      aria-hidden
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
