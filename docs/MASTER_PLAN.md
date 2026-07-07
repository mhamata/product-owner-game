# Praxis 2.0 — Master Plan

**The reinvention of Praxis into the world's best product-management learning product, monetized as an iOS app.**

*Synthesized July 2026 from: a full codebase audit ([current-state-audit](research/current-state-audit.md)), market research ([market-research](research/market-research.md)), iOS/monetization research ([ios-monetization-research](research/ios-monetization-research.md)), four independent design proposals ([curriculum](research/design-curriculum.md), [game & retention](research/design-game-retention.md), [business & GTM](research/design-business-gtm.md), [AI-native layer](research/design-ai-native.md)), and two adversarial critiques ([completeness](research/critique-completeness.md), [red team](research/critique-red-team.md)). Where the proposals conflicted, this document is the ruling.*

---

## 1. The thesis

Every serious PM education product sells **theory at a premium** (Reforge $1,995/yr — reviewed as "too theoretical"; Product School $4,799/cert — "not focused or demanding") or **interview prep that churns at the job offer** (Exponent $79/mo). The practice-first challengers (GoPractice, ProductDo, Sandbox4PM) are desktop-bound, one-shot, and sub-scale. The only PM app on iOS is a quiz toy with one rating.

Meanwhile, the adjacent evidence is overwhelming: Duolingo monetizes AI roleplay at $29.99/mo ($1.04B revenue), chess.com turned a rating into identity (~$150M), Brilliant sells pure practice at ~$162/yr. Hiring managers openly discount certificates and ask for **demonstrated thinking**.

**Praxis 2.0 is the empty quadrant: mobile + gamified + practice-first + AI-graded.**

> **Positioning line: "The first PM trainer that grades you."**
> Acquisition message: *reps, not videos* — pass the interview by doing the job, not watching it.
> Retention message: *the PM gym* — a rating you want to defend and raise.
> Design thesis: **the career is the game.** Nobody fantasizes about "Unit 12: Prioritization." Everybody fantasizes about getting promoted — or about their own product taking off.

Praxis 1.0 already has the hardest parts: a rigorous 6-level/12-competency curriculum, a deterministic simulation engine with genuinely good game bones, rubric-aligned AI grading with production-grade cost controls, and elegant industry reskinning. What it lacks is everything around the pedagogy: accounts, mobile, onboarding, retention loops, a credential, and a business model. That is what this plan builds — **in an order that tests the riskiest assumption first.**

---

## 2. The riskiest assumption (and the go/no-go gate)

The red team's central finding, adopted in full:

> The business does not die on mobile, habit mechanics, or the rating. It dies if **AI grading doesn't feel credibly senior**. One "this feedback is wrong about my own artifact" moment and trust is unrecoverable — and senior users are the best at detecting it.

**Phase 0 is therefore a grading calibration study, before any other build:**

- Assemble a golden set: ~30 real artifacts (PRDs, experiment plans, strategy memos) + ~10 mock-interview/roleplay transcripts.
- Pay 3–5 actual senior PMs (recruit from r/ProductManagement / Lenny's community) to panel-grade them against the rubrics.
- Tune grader prompts (Sonnet-tier) until grader-vs-panel agreement is **publishable**. Wire the golden set into CI as a regression suite — every prompt/model change must reproduce golden scores within tolerance.
- **Go/no-go:** if agreement can't be reached on 3 artifact types in ~3 weeks, stop and rethink — that lesson costs 3 weeks, not 9 months. If it works, *publish the agreement rate*. "Our grader agrees with a senior-PM panel X% of the time" is simultaneously the moat, the marketing, and the credential.

Everything else in this plan assumes Phase 0 passes.

---

## 3. Product architecture — the five pillars

### Pillar 1 — Curriculum 2.0 (the content spine)

Full spec: [design-curriculum.md](research/design-curriculum.md). North star: a **96-skill ladder** across 6 levels and 26 units, with the competency spine grown 12 → 16 (communication, design-collaboration, ethics promoted to first-class; analytics-depth, release-mgmt, product-ops added). Every skill has a practice modality with a pass bar — lesson-only skills are eliminated.

**Six new modalities close the "evaluative & reactive practice" gap** (the actual texture of PM work, absent from 1.0 and from the whole market):

| Modality | What it is | Why it matters |
|---|---|---|
| **Critique** | "Fix this bad PRD" — find N seeded defects from a 10-class defect taxonomy | Evaluation precedes generation; near-deterministic grading (cheap); mobile-perfect |
| **Dataread** | Read this dashboard — what's really happening, what do you do? (Simpson's paradox, mix shifts, SRM traps) | Highest-frequency real PM task; zero market coverage |
| **Fermi** | Ranged estimation with longitudinal calibration curves | Best-evidenced trainable judgment skill (Tetlock) |
| **Teardown** | Real product decisions (Qwikster, Google Reader, Instagram Stories…), predict-before-reveal | Hypercorrection effect; endlessly shareable content |
| **Incident** | Timed multi-beat crisis sims (sev-1 on launch day) | Where knowing and doing diverge most |
| **Writing** | 80–300-word compositions with sentence-anchored inline AI feedback + revise-and-resubmit scored on the delta | The PM meta-skill; the revision loop teaches feedback uptake itself |

Plus a 7th: **Interview** (mock PM interviews — product sense, execution, behavioral — scored against public hiring rubrics). This is the acquisition wedge and ships early (see roadmap), not in Q3.

**Mastery model:** boolean mastery becomes a **decaying strength** (FSRS-style): skills go "stale" (never re-locked — motivationally toxic) and are refreshed with 90-second maintenance reps in a different industry skin, delivered through the existing Leitner review deck. Spacing + variation = retention + transfer.

**Content production:** human-owned invariants (≈40 rubrics with graded exemplar anchors, ≈30 scenario templates, the defect taxonomy) + AI-generated surface (scenarios, personas, numbers, distractors) + a validation pipeline (deterministic number-checking, adversarial solve, human spot-check, live shadow-calibration). ~45–60 min human time per shipped item × 5 industry skins each — a 3–5× throughput gain with quality *higher* than hand-authoring.

**Year-1 scope discipline (red-team ruling):** the 96-skill ladder is the map, not the Year-1 build. Year 1 ships: the existing 49 skills polished + the interview track + the three cheapest-highest-value new modalities (**critique, dataread, fermi**) + teardowns as a content-marketing ritual. Incident/writing modalities and the full ladder fill in as revenue funds them.

### Pillar 2 — The game & retention layer

Full spec: [design-game-retention.md](research/design-game-retention.md). The three engines, in priority order: **the sim cliffhanger is the retention engine, the rating is the status engine, the career fiction is the meaning engine.** Every feature must feed one of the three or get cut.

**The daily session — "The Standup" (4:30–5:30, one-handed, portrait):**
1. **Warm-up** (~45s): 2 judgment cards from the due queue (one likely-right layup, one at difficulty). Instant verdict stamps, +XP.
2. **Workload** (~3min): ONE focused block picked by the scheduler from the weakest live competency — drill set, micro-roleplay (chip-composer, no keyboard hell), critique/dataread, or judgment gauntlet.
3. **The Cliffhanger** (~60s): exactly **one turn of your ongoing simulation run**. Commit the sprint — results are withheld until tomorrow's session. The Zeigarnik hook is a *consequence you authored*. ("Sprint 7 is running. Results at your next standup.")

One scheduler runs the day (curriculum queue priorities inside the 3-act shell, narrated by the AI Mentor). One push notification per day, always containing *state from their game*, never guilt ("Sprint 9 resolved: capacity came in low. Maya escalated. Your move.").

**Progression:** one currency of effort (**Cred**), one of truth (**the rating**), one of generosity (**PTO days** = streak freezes, max 2, earn/buy with Cred). Career ladder titles (Intern → APM → PM I/II/III → Senior → Staff → Director → VP) paced for a level-up every 3–7 days early; **dual-key gating** — Cred sets the pace, but certifications and rating gate senior titles, keeping the credential honest. Streak mechanics: 3:59am rollover, streak repair once per 90 days, milestone flames at 7/30/100/365. **No hearts, no XP-multiplier streaks, no punishment for wrongness — only for absence.**

**Cut by ruling of both critics:** fake comp bands / salary ceremonies (deceptive-claims exposure + cringe risk with the exact segment whose LinkedIn shares we need), leagues/guilds/community scenarios **at launch** (social features are DAU-gated behind a ~2k-DAU feature flag; until then you compete against last-week's-you and deterministic ghost runs, which the seeded engine gives us for free). A **"professional mode" toggle** mutes the career fiction while keeping the loop — cheap insurance for senior users.

**Simulation as flagship:** turn-based phone pacing (60–90s/turn — results feed, situation, decision, commit with heavy haptic), save/resume at every phase boundary (the engine is a pure function — trivial), "previously on your product…" recaps, difficulty modifiers as unlockable "Operating Conditions" (Fog of Roadmap, Brittle Codebase, Skeleton Crew… Nightmare Quarter), challenge links (same scenario + seed → turn-by-turn comparison — the referral loop with gameplay in it), and eventually a 40-turn "founding PM to IPO" endgame scenario.

**Onboarding (install → aha < 3 min → paywall):** cold open with a judgment call in the first 10 seconds (no signup), 3 cards → "this thing evaluates my judgment", quiz (role/goal/industry/time budget — **with a Founder path**, see Pillar 5), mini-placement framed as "calibrating your starting title," personalized plan ("Fastest path to Senior PM: 11 weeks at 10 min/day"), Sign in with Apple, **hard paywall** (7-day trial on annual, default-selected, "we'll remind you before it ends"), then straight into sim turn 1 and the first cliffhanger — which is the moment to ask for push permission ("Your sprint results land tomorrow. Want to know when?" — expect ~70% grant).

### Pillar 3 — The AI-native layer

Full spec: [design-ai-native.md](research/design-ai-native.md). Strategic bet: **Haiku-priced practice at consumer scale, Sonnet-priced judgment where grades matter, Opus-priced moments you can market, and a Postgres-shaped memory that makes it all feel like one coach who knows you.**

- **The AI Mentor** — the retention moat. Not a chatbot: scheduled, templated, cheap calls over a learner model in Supabase (append-only `exercise_events` → rolled-up `competency_state` → distilled `mentor_memory` facts, ≤40 per user, maintained by the weekly retro's structured output). Surfaces: morning brief (Haiku, ~$0.005/day — narrates a plan chosen by deterministic scheduling; the LLM never picks exercise IDs), post-exercise debrief (fires only when there's a pattern to name: "third artifact in a row where success-metrics dragged you down — same miss as June 28"), weekly retro (Sonnet), quarterly Opus career review. Pro-tier Mentor cost: ~$0.60/user/mo.
- **Grading v2** — Sonnet replaces Haiku for artifacts; **block-anchored inline annotations** (max 8, at least one praise), `top_fix`, and **revise-and-resubmit loops** graded on the delta with a red-to-green annotation view (the single most motivating screen in the product). Revision grades update mastery at a discount (0.5×/0.25×, cap 3) so the meta is never "resubmit until the dice roll high."
- **Roleplay v2** — turn-numbered transcript annotations with a **pivotal-moment replay** ("branch from turn 4 and try a different line" — cache-warm, nearly free); **multi-party meetings** (one Sonnet call orchestrating three personas with hidden agendas — coherent disagreement, 3× cheaper than separate agents); **consequence flags** that persist across scenarios and into the sim ("it *remembered*" is the most shareable AI moment in the product).
- **Voice mode** (premium justifier, Duolingo-Max-style): cascaded pipeline — on-device Apple STT ($0) → Claude streaming (Haiku for stakeholders, Sonnet for interviews) → streaming TTS (Cartesia ~$0.02–0.04/min), sentence-boundary chunking, barge-in support, ≤1.3s voice-to-voice. **TTS dominates cost (~$0.25–0.35/session)** — gate by tier accordingly. Post-session scoring never sits in the latency path.
- **Mock interviews** — product sense / execution / behavioral, voice or text, scored by Opus with hiring-committee bands (no-hire → strong-hire per dimension) and an honest separate `interview_readiness` score ("your practice rating says senior; your interviews say mid — that gap is coachable").
- **Senior PM Review** — the named, scarce Opus product (~$0.16 COGS, sold at $2.99 à la carte / included in Pro): a staff-level design review with an exemplar rewrite of the weakest section only (full rewrites teach copying; section rewrites teach the move).
- **Integrity** — the editor is owned, so **process signals** (paste ratio, edit cadence vs personal baseline) are the primary AI-plagiarism defense, not unreliable text classifiers. Policy: *grade always, rate conditionally* — flagged work gets feedback but `rating_eligible = false`. All rating math server-side and replayable from the event log. Nightly grader-drift checks against frozen calibration sets.
- **Cost architecture** — per-tier model routing, frozen cacheable system prompts (lint-enforced), monthly **cost-normalized budgets** in Supabase with atomic reserve-and-settle, cheap surfaces (drills, cards) exempt from metering so *the learning loop never turns off* — only the expensive garnish meters. Fleet COGS ≈ $0.75/MAU at an 85/12/3 free/pro/max mix.

### Pillar 4 — The rating & the credential

The market gap: certs certify attendance; nobody certifies performance. But the critics' rulings apply:

- **Free provisional rating, paid verified rating.** Everyone gets a provisional Praxis Rating (Glicko-2: rating ± uncertainty; headline + 4 dimension sub-ratings; the 12 per-competency ratings stay internal scheduler state). It drives the day-5 Rating Reveal and the share cards. The **$149 "Praxis Rated" assessment** produces the *verified* rating: timed artifact + live roleplay defense + judgment gauntlet, fresh scenarios per attempt, one retake within 90 days.
- **What feeds the rating (curriculum ruling, the defensible one):** only performances under constraint — weekly gauntlet, placement, first-attempt sims/incidents, certification events. **Never** anything with unlimited retries. Daily cards award Cred only. Practice is a safe space; the rating is earned.
- **Credibility before scale (red-team ruling):** an Elo is credible at n=50,000; **an inspectable work sample is credible at n=1.** The launch credential is therefore the *assessment report* — scored artifacts + interview transcripts + rubric bands, attached, verifiable at a signed URL (praxis.app/v/{hash}). The living rating number grows into a hiring signal later; percentiles display only "of N Praxis users" and are suppressed below n=1,000. No seasonal rating compression — 1420 must mean the same thing in 2027.
- **Portfolio export:** graded artifacts + revision trajectories + integrity statement ("composed in-editor, process-verified") as a recruiter-facing page and PDF. Every portfolio link a job-seeker sends is an acquisition channel.

### Pillar 5 — The founder/entrepreneur path (previously missing everywhere)

Praxis explicitly serves aspiring **entrepreneurs**, not just PM job-seekers — and the completeness critic found this segment absent from every proposal. Ruling:

- **Onboarding quiz adds "Founder / building my own product"** as a first-class situation alongside Interviewing / New to PM / Leveling up.
- **The fiction reskins** (it was designed as a skin): titles become company stages (Garage → Pre-seed → Seed → Series A → Growth → IPO); the promotion ceremony becomes a funding/traction milestone; cohorts become "founder batches."
- **"Your real product" personalization is the founder killer feature:** a guided 200-word intake stores their actual product context; exercises reskin to it at selection time (Haiku, ~$0.003, answer-key invariance validated). A founder practicing pricing, positioning, and zero-to-one discovery *on their own company* is a product nobody else offers at any price.
- Founder path fast-tracks the **zero-to-one and monetization tracks** and weights the sim toward the zero-to-one and turnaround scenarios; the Mentor's career surface becomes a company-strategy surface.

---

## 4. Monetization — the canonical tier sheet

One price book (business doc owns it; allowances validated against the AI COGS table). IAP via RevenueCat at 15% (Small Business Program) + US web-checkout link-out on annual plans + all email/content traffic to Stripe web checkout.

| | **Free** | **Core — $14.99/mo · $99/yr** | **Pro — $29.99/mo · $199/yr** |
|---|---|---|---|
| Daily Standup loop (cards, drills, streak) | ✅ (10 cards/day) | ✅ Unlimited | ✅ Unlimited |
| Skill map | Foundations + first Associate unit | All levels | All levels |
| Sim | Demo scenario, 1 turn/week | 2 full runs/mo | Unlimited + modifiers |
| AI artifact grading (Sonnet, inline annotations) | 1/week | 30/mo | Unlimited* |
| Text roleplay / multi-party | 1 taste session | 20/mo | Unlimited* |
| **Voice roleplay** | 3-min demo, once | 2/mo taste | 2/day |
| **Mock interviews** | — | 1/mo text | 8/mo voice, Opus-scored |
| **Senior PM Review (Opus)** | — | 2/mo | 15/mo |
| AI Mentor | Brief 3×/week | Full (daily brief, debriefs, weekly retro) | Full + quarterly Opus career review |
| Portfolio export | — | — | ✅ |
| "Praxis Rated" verified assessment ($149 one-time, standalone SKU) | full price | $50 off | 1 credit/yr included |

*\*"Unlimited" = within the tier's monthly cost-normalized budget; drills/cards never meter.*

**Target COGS:** Free ≤$0.15 · Core ~$1–3 · Pro ~$6–13 worst-case (hard-capped by the budget gate) → ~79–84% gross margins. Global daily AI ceiling at 8% of trailing-30-day revenue with automatic degradation to Haiku, never an outage.

**Conversion machinery:** hard paywall after the quiz (10.7% vs 2.1% soft, identical 1-yr retention); 7-day trial on annual; day-0 = one graded rep within 20 minutes of install; day-2 = the voice-roleplay taste (the Pro upsell moment); day-5 = Rating Reveal in the morning + promised trial reminder + loss-framed re-present in the evening (their radar, their streak, their due cards); win-back ladder at day 3/14/30 post-lapse; interview-date users get a "interview week unlock" offer 7 days before their stated date.

**Unit economics — the conservative case is the plan (red-team ruling):** modeled at **half the optimistic installs and 25–30% trial→paid** (not the 42% benchmark), the business still works because the wedge buyer compares against $150/hr human mocks, not against Duolingo:
- ~14k Year-1 installs, ~6.5% → trial, ~28% → paid ⇒ ~250–350 paying subscribers + certs by Month 12 ≈ **$4–6k MRR run-rate** — ramen-adjacent, break-even Month 15–18.
- The optimistic case (28k installs, 42%) reaches ~730 subs / ~$12k monthly run-rate by M12. Plan spending against the conservative case; let the optimistic case be upside.
- Kill criteria at week 12 of the paid wedge: ≥5% of visitors who complete the sample graded drill pay; ≥40% of payers complete 5+ graded sessions; unsolicited "felt like a real senior PM" feedback. Miss all three → the market has answered cheaply.

**B2B second act (Month 9+ only, and only if consumer PMF signals: trial→paid ≥30%, M3 retention ≥55%):** Teams at $25–30/seat (the competency matrix as a management tool — "see your team's actual skill radar"), bootcamp/university cohort licensing ($2.5–5k/cohort — your rating is the outcomes metric they can't produce themselves), and eventually the talent marketplace (≥5,000 verified users prerequisite; announce early, build last).

---

## 5. iOS technical architecture

**Decision: Capacitor 8 wrapping the Next.js static export.** Not React Native (2–4 month rewrite, unjustified), not PWA (not a monetization path on iOS). One repo, one deploy, ~95% code reuse.

```
iPhone (Capacitor shell)                    Vercel                       Supabase
┌──────────────────────────┐    HTTPS    ┌──────────────────┐    ┌─────────────────────┐
│ Next.js static export     │──bearer──▶│ API routes:       │──▶│ Auth (Apple/Google/  │
│ (output:'export')         │    JWT     │  verify JWT       │    │  email + anon-       │
│ Zustand = runtime +       │            │  → entitlement    │    │  upgrade migration)  │
│  offline cache            │◀──sync────│  → budget reserve │    │ Postgres + RLS:      │
│ Native: push, haptics,    │            │  → Anthropic call │    │  progress sync,      │
│  offline drills, splash,  │            │  → usage settle   │    │  exercise_events,    │
│  streak widget (Swift)    │            └──────────────────┘    │  competency_state,   │
└──────────────────────────┘                                     │  mentor_memory,      │
        │ StoreKit                                               │  entitlements,       │
        ▼                                                        │  user_budgets        │
   RevenueCat ──webhooks──▶ Supabase Edge Function ─────────────▶│  (upsert)            │
   (logIn(supabaseUid))                                          └─────────────────────┘
   + Stripe web checkout ──▶ same entitlements table
```

Key implementation notes:
- `output: 'export'`, `images: { unoptimized: true }`, `webDir: 'out'`; absolute API base URL via env; CORS or Capacitor HTTP plugin; bearer tokens, not cookies. **Never** point the WebView at the live URL (guideline 4.2 bait).
- **App Review 4.2 armor:** push notifications, haptics on game events, offline drills with designed offline states, splash/status-bar/safe-area, the streak widget (small Swift extension; Live Activity for "sprint in progress" is the signature move), review notes describing an interactive AI training game + demo account.
- Anonymous sign-in → account upgrade migrates existing local Zustand state server-side on first login; the anonymous path also protects existing web users.
- The Anthropic key never ships in the client. Every AI route: JWT → entitlement → atomic budget reserve → call → settle → log. The existing 3-layer rate limiting stays as layers beneath.
- Existing web app remains live as the zero-commission channel and the SEO/content surface.

---

## 6. Go-to-market (solo-founder honest version)

**One channel, done properly (red-team ruling):** the product generates its own marketing. **Publicly grade famous PRDs and product decisions and post the scorecards** (LinkedIn + Reddit). Zero marginal cost, demonstrates the exact value proposition, and doubles as grading-credibility proof. Everything else (TikTok clips of the AI VP pushing back, ASO, affiliates at 30% via web checkout, SEO pages with embedded free graded drills) layers on *after* this is running.

Sequence:
1. **Beta (150 users)** from r/ProductManagement + Lenny's community — post the artifact, not the ad ("I built an AI that grades PRDs against a senior-PM rubric — here's what it said about a famous public PRD"). Calibration study doubles as the recruiting device.
2. **Soft launch** with the paywall live, no push; watch the funnel for 3–4 weeks. ASO: title "Praxis: PM Interview & Skills," screenshots lead with a scored PRD in red ink, 50+ ratings seeded from beta.
3. **Product Hunt** with the rating angle ("the first app that gives you a PM rating"), then the content engines weekly.
4. **Interview-prep Trojan horse:** the marketing wedge is interview prep (urgency, budget, deadline); the product converts them to career-long training via the gap map their mock interviews generate. **Ruling on the sync problem the critics caught:** a minimal text mock-interview + interview-flavored judgment pack ships in Phase 1 so the marketing message and the product agree from day one.

---

## 7. Legal & compliance checklist (before soft launch)

- **Age gate 16+** at onboarding (GDPR consent age / COPPA buffer).
- **Percentile honesty:** display "of N Praxis users," suppressed below n=1,000. No fake comp bands anywhere.
- **Editor telemetry disclosure** (process signals are behavioral monitoring — disclose, get consent).
- **Erasure-compatible verification:** signed hash chains must tombstone cleanly under GDPR Article 17.
- **UGC minimums ship WITH peer review, not after:** report + block + profanity filter + human queue (App Store guideline 1.2).
- **Employer-facing surfaces geo-fenced from the EU** at launch (EU AI Act Annex III / NYC LL144 exposure); "advisory, not an employment decision tool" framing everywhere; bias audit before any B2B hiring product.
- **Editorial policy for teardowns/news mode:** public facts only, sourced, 100% human review forever; no mass-casualty cases in the launch set; E&O insurance in the opex line.
- **Trademark search** on certification naming before the cert launches.
- **Cert exam is iPad/web-only → its IAP must not be purchasable-but-unusable on iPhone** (sell the cert on web + in-app only where usable).
- Refund policy, grader-appeal flow (also a data asset), and a contingency in the P&L for the Epic link-out ruling reversing (~7 points of margin).

---

## 8. Risk register (top 8, from the red team — each with its adopted mitigation)

| # | Failure mode | Adopted mitigation |
|---|---|---|
| 1 | Scope kills momentum before revenue | The phased plan below; Year-1 content capped; social DAU-gated; validate with the web wedge before the full iOS surface |
| 2 | AI grading feels generic → value prop collapses | **Phase 0 calibration study as the company gate**; golden-set CI; published agreement rates |
| 3 | Daily-habit assumption false for this audience | Sell to the deadline (interview sprint, promotion season, founder launch); habit mechanics are upside, not the model; episodic pricing exists ($149 assessment, win-back at interview date) |
| 4 | Content treadmill exceeds solo capacity | Year-1 cap: 49 existing skills + interview track + 3 cheap modalities; gauntlet item-economy deferred; the generation pipeline ships before the content it feeds |
| 5 | Funnel math fantasy → break-even slides past runway | Conservative case is the plan (25–30% trial→paid, half installs); charge more to fewer sooner; week-12 kill criteria |
| 6 | Rating never achieves hiring credibility | Inspectable assessment *report* first (credible at n=1); the Elo number grows later; percentile suppression |
| 7 | Career fiction reads as cringe to people with money | Comp bands killed; professional-mode toggle; coach tone, not theme park; sim cliffhanger keeps the earned tension |
| 8 | Distribution never materializes | One channel (public grading content) that the product generates; everything else deferred |

---

## 9. The roadmap

**Phase 0 — The gate (Weeks 1–3).** Grading calibration study (§2). In parallel, the substrate: Supabase project, auth (Apple/Google/email + anonymous-upgrade), `exercise_events` / `competency_state` / `entitlements` / `user_budgets` schema, JWT-gated AI routes with atomic budget reserve/settle, Zustand→Supabase sync layer. Nothing user-visible; everything depends on it.

**Phase 1 — The paid wedge, web-first (Weeks 3–12).** "Praxis Interview Gym" on the existing web app: text mock PM interview (roleplay engine + turn-anchored annotations + hiring-committee scorecard), grading v2 (inline annotations + one revise-resubmit loop) on 3 rubrics (PRD, experiment plan, strategy memo), the readiness-report PDF, Stripe checkout ($99 six-week Interview Sprint or $39/mo, 3-day trial), and the public-grading content channel. **Week-12 gates decide everything downstream.**

**Phase 2 — The iOS app (Months 4–6).** Capacitor shell + native layer (push, haptics, offline, widget); mobile-first UI for cards/drills/sim (chip-composer roleplay, turn-based sim pacing, save/resume); onboarding flow (cold-open judgment call → quiz with founder path → placement → hard paywall); the 3-act daily Standup with the sim cliffhanger; streaks/PTO; Cred + career ladder (professional-mode toggle; founder reskin); RevenueCat + tier sheet + day-5 choreography; App Store launch (soft → Product Hunt).

**Phase 3 — The moats (Months 6–12).** AI Mentor (brief → debrief → weekly retro → memory loop); voice roleplay + voice mock interviews (Pro tier complete); critique/dataread/fermi modalities + content pipeline + first teardowns; provisional rating + Rating Reveal + share cards; **"Praxis Rated" $149 verified assessment**; portfolio export; challenge links; win-back ladder; Teams pilot if PMF signals fire.

**Year 2 — The compounding assets.** Full 96-skill ladder + incident/writing modalities; weekly community scenario + leagues (DAU-gated); seasons + the Long Game endgame scenario; three-tier certification ladder; bootcamp licensing; multi-party voice meetings; news mode; the talent marketplace (the endgame: hiring happens against the rating → the rating must be maintained → recurring assessment revenue).

---

## 10. What makes this defensible

The features are copyable. Four assets compound and are not:

1. **Rubric calibration data** — every grade, appeal, and regrade sharpens an eval set no prompt-copier has. Publish the agreement rates; turn the black box into the credential.
2. **Rating/report credibility** — trust compounds through cohorts, bootcamp partners, and "we hired one and they were great" stories. Chess ratings weren't the best algorithm; they were the *agreed-upon* one.
3. **The scenario engine + competency spine** — a deterministic, seeded, industry-reskinnable simulation across 6 levels and 9 tracks is a multi-year content asset that raises the copy cost every quarter.
4. **Community/leaderboard liquidity** (later) — ratings create comparison → community → the marketplace → the reason ratings matter.

Exponent won't cannibalize its coaching marketplace to chase this; Duolingo's engine needs mass-market TAM; Sandbox4PM has no mobile loop, no rating, no distribution. The window is open — the plan above walks through it in the order that spends the least money to learn the most.

---

*Companion documents: [current-state-audit](research/current-state-audit.md) · [market-research](research/market-research.md) · [ios-monetization-research](research/ios-monetization-research.md) · [design-curriculum](research/design-curriculum.md) · [design-game-retention](research/design-game-retention.md) · [design-business-gtm](research/design-business-gtm.md) · [design-ai-native](research/design-ai-native.md) · [critique-completeness](research/critique-completeness.md) · [critique-red-team](research/critique-red-team.md)*
