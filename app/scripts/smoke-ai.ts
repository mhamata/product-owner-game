/**
 * AI-surface smoke runner (go-live step 2, docs/GO-LIVE-SMOKE.md).
 *
 * Hits all six AI surfaces of a RUNNING dev/prod server over HTTP with
 * realistic payloads and asserts the response shape. Two modes:
 *
 *   npm run smoke:ai -- --expect degrade   # no ANTHROPIC_API_KEY on the server:
 *                                          # every surface must return the calm
 *                                          # 200 { unavailable: true } shape.
 *   npm run smoke:ai -- --expect live      # real key on the server: every
 *                                          # surface must return its real
 *                                          # payload. ~6 Haiku calls, pennies.
 *
 * The script itself never calls Anthropic — it only talks to the app, so it
 * exercises the full route stack (rate limit → validate → degrade/spend →
 * normalize) exactly as the UI does.
 *
 * TRAP (documented in docs/PHASE2.md / the QA reports): dev servers spawned
 * through the Claude Code harness inherit a bogus injected ANTHROPIC_API_KEY
 * that shadows .env.local. Start the server from a plain terminal, or wrap:
 *   env -u ANTHROPIC_API_KEY -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN npm run dev
 * (with the vars unset, Next.js falls back to .env.local — so this wrapper is
 * correct for BOTH modes: it strips the bogus injection and lets the real key
 * in .env.local through.)
 *
 * BASE_URL env var overrides the target (default http://localhost:3000).
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

type Expect = 'degrade' | 'live';

function parseExpect(): Expect {
  const i = process.argv.indexOf('--expect');
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  if (v === 'degrade' || v === 'live') return v;
  console.error('Usage: npm run smoke:ai -- --expect degrade|live');
  process.exit(2);
}

interface CheckResult {
  surface: string;
  ok: boolean;
  note: string;
}

async function post(path: string, body: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    /* non-JSON body: leave empty, the status/shape assertions will fail loudly */
  }
  return { status: res.status, json };
}

/** Shared assertion: HTTP 200, no `error` key, and mode-specific shape. */
function judge(
  surface: string,
  expect: Expect,
  status: number,
  json: Record<string, unknown>,
  liveCheck: (j: Record<string, unknown>) => string | null, // null = pass, else failure note
): CheckResult {
  if (status !== 200) {
    return { surface, ok: false, note: `HTTP ${status}: ${JSON.stringify(json).slice(0, 120)}` };
  }
  if (typeof json.error === 'string') {
    return { surface, ok: false, note: `error leaked to client: ${json.error.slice(0, 120)}` };
  }
  if (expect === 'degrade') {
    return json.unavailable === true
      ? { surface, ok: true, note: `calm degrade: "${String(json.message ?? '').slice(0, 60)}..."` }
      : { surface, ok: false, note: `expected unavailable:true, got ${JSON.stringify(json).slice(0, 120)}` };
  }
  if (json.unavailable === true) {
    return { surface, ok: false, note: `unavailable in live mode (${String(json.reason ?? 'no key?')})` };
  }
  const failure = liveCheck(json);
  return failure
    ? { surface, ok: false, note: failure }
    : { surface, ok: true, note: 'live payload OK' };
}

/* ------------------------------------------------------------------
   Realistic payloads. Interview case ids are real authored cases; the
   rubric/decision-log/season shapes mirror what the UI actually sends
   (see each route's request interface).
   ------------------------------------------------------------------ */

const INTERVIEW_OPENING =
  'Thanks for coming in. Our rental-platform app gets complaints from renters about how maintenance requests are handled. How would you improve the maintenance-request experience?';

const RUBRIC = [
  { id: 'problem', label: 'Problem clarity', descriptor: 'Names the user, the pain, and why now; scopes what is out.' },
  { id: 'solution', label: 'Solution shape', descriptor: 'Describes the smallest coherent release and its user-visible behavior.' },
  { id: 'metrics', label: 'Success metrics', descriptor: 'Names 1-2 outcome metrics with a target and a guardrail.' },
];

const SUBMISSION = [
  'Problem: Renters wait days with no visibility after filing a maintenance request; 40% of support tickets are "what is the status". We will fix the visibility gap first, not dispatch speed.',
  'Solution: a status timeline on every request (filed -> assigned -> scheduled -> done) with push notification on each transition. Out of scope: contractor marketplace changes.',
  'Metrics: cut status-related support tickets 50% in 8 weeks; guardrail: request completion time does not regress.',
].join('\n\n');

const AMMO_ENTRIES = [
  {
    runId: 'smoke::run', scenarioId: '01-canadian-launch', industry: 'SaaS', sprint: 1,
    committedAt: new Date().toISOString(), sprintGoal: 'Ship the onboarding fix',
    backlogTitles: ['Self-serve team onboarding', 'Fix invite emails'], releaseCard: 'Release 1.1',
    eventResponses: [{ event: 'Biggest customer demanded a niche feature via the CEO', choice: 'Declined with reasoning and reach numbers' }],
    rationale: 'Onboarding lifts activation for thousands; the feature helps one account.',
    outcome: { summary: '2 items shipped, +$4,000 revenue, 1 product released' },
  },
  {
    runId: 'smoke::run', scenarioId: '01-canadian-launch', industry: 'SaaS', sprint: 2,
    committedAt: new Date().toISOString(), sprintGoal: 'Pay down deploy pipeline debt',
    backlogTitles: ['CI hardening'], releaseCard: null,
    eventResponses: [], rationale: 'Debt was inflating every estimate; paying it now buys back capacity.',
    outcome: { summary: '1 item shipped' },
  },
];

const QBR_BODY = {
  runId: 'smoke::run',
  scenarioTitle: 'Canadian Launch',
  roster: [
    { id: 'exec-1', name: 'Dana Whitfield', roleLabel: 'Exec chair' },
    { id: 'eng-1', name: 'Maya Chen', roleLabel: 'Eng lead' },
    { id: 'sales-1', name: 'Omar Reyes', roleLabel: 'Sales & CS' },
  ],
  season: {
    confidence: 58,
    expectations: [
      { id: 'e1', label: 'Ship two releases', status: 'on-track' },
      { id: 'e2', label: 'Hold churn under 5%', status: 'at-risk' },
      { id: 'e3', label: 'Keep team health above 6', status: 'on-track' },
    ],
    scoreDims: { valueDelivered: 62, customerLoyalty: 55, teamHealth: 70, stakeholderTrust: 48, productIntegrity: 66, total: 60 },
    sprintFacts: AMMO_ENTRIES,
  },
};

/* ------------------------------------------------------------------
   The six checks.
   ------------------------------------------------------------------ */

async function run(): Promise<void> {
  const expect = parseExpect();
  console.log(`Smoke: ${BASE_URL} · expect=${expect}\n`);
  const results: CheckResult[] = [];

  // 1) interview: reply
  {
    const { status, json } = await post('/api/interview', {
      action: 'reply',
      caseId: 'ps-renter-maintenance',
      messages: [
        { role: 'interviewer', text: INTERVIEW_OPENING },
        { role: 'candidate', text: 'Before I jump in: who files most maintenance requests today, and do we know where they drop off?' },
      ],
    });
    results.push(judge('interview:reply', expect, status, json, (j) =>
      typeof j.reply === 'string' && (j.reply as string).trim().length > 0 ? null : 'no reply text'));
  }

  // 2) interview: score
  {
    const { status, json } = await post('/api/interview', {
      action: 'score',
      caseId: 'ps-renter-maintenance',
      messages: [
        { role: 'interviewer', text: INTERVIEW_OPENING },
        { role: 'candidate', text: 'I would segment renters by urgency of request and focus on the emergency path first, since a burst pipe at midnight is where trust is won or lost.' },
        { role: 'interviewer', text: 'Interesting. How would you measure success?' },
        { role: 'candidate', text: 'Two metrics: median time-to-acknowledgement under 10 minutes for emergencies, and status-check support tickets down 50%. Guardrail: completion time must not regress.' },
      ],
    });
    results.push(judge('interview:score', expect, status, json, (j) => {
      const sc = j.scorecard as { dimensions?: unknown[] } | null;
      if (sc === null) return 'scorecard null (model JSON did not parse — rerun once before treating as a failure)';
      return Array.isArray(sc?.dimensions) && sc.dimensions.length > 0 ? null : 'scorecard has no dimensions';
    }));
  }

  // 3) grade-artifact v1 (the calibration-frozen path)
  {
    const { status, json } = await post('/api/grade-artifact', {
      skillId: 'prd-artifact', artifactTitle: 'One-page PRD',
      brief: 'Write a one-page PRD for improving the renter maintenance-request experience.',
      rubric: RUBRIC, submission: SUBMISSION,
    });
    results.push(judge('grade-artifact:v1', expect, status, json, (j) =>
      j.verdict ? null : 'no verdict'));
  }

  // 4) grade-artifact v2 (inline annotations)
  {
    const { status, json } = await post('/api/grade-artifact', {
      v: 2, skillId: 'prd-artifact', artifactTitle: 'One-page PRD',
      brief: 'Write a one-page PRD for improving the renter maintenance-request experience.',
      rubric: RUBRIC, submission: SUBMISSION,
    });
    results.push(judge('grade-artifact:v2', expect, status, json, (j) =>
      j.verdict ? null : 'no v2 verdict'));
  }

  // 5) interview-ammo (STAR stories from the decision log)
  {
    const { status, json } = await post('/api/interview-ammo', {
      runId: 'smoke::run', scenarioTitle: 'Canadian Launch', entries: AMMO_ENTRIES,
    });
    results.push(judge('interview-ammo', expect, status, json, (j) => {
      if (j.stories === null) return 'stories null (model JSON did not parse — rerun once before treating as a failure)';
      return Array.isArray(j.stories) ? null : 'no stories array';
    }));
  }

  // 6) qbr (multi-party meeting)
  {
    const { status, json } = await post('/api/qbr', QBR_BODY);
    results.push(judge('qbr', expect, status, json, (j) => {
      if (j.meeting === null) return 'meeting null (model JSON did not parse or every speaker was invented — rerun once)';
      const m = j.meeting as { turns?: unknown[] } | undefined;
      return Array.isArray(m?.turns) && m.turns.length > 0 ? null : 'meeting has no turns';
    }));
  }

  const width = Math.max(...results.map((r) => r.surface.length));
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.surface.padEnd(width)}  ${r.note}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} surfaces ${expect === 'degrade' ? 'degrade calmly' : 'serve live'}.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(`Smoke runner crashed (is the dev server up at ${BASE_URL}?):`, e);
  process.exit(1);
});
