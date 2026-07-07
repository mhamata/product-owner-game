# Praxis 2.0 — Complete Curriculum Architecture

**Blueprint, grounded in the current codebase** (`app/src/curriculum/data.ts`: 6 levels, 60 ladder skills + 16 track skills across 12 competencies + 5 cross-cutting threads; 7 modalities: lesson, drill, artifact, roleplay, judgment, placement, sim). Everything below is specified to the level of skill IDs, counts, and example content, so it can be seeded directly into the existing `LEVEL_UNITS` / `TRACK_SEEDS` structure.

---

## Design principles (the learning-science spine)

Every decision below traces to five commitments:

1. **Deliberate practice, not exposure.** Every skill has a practice modality with a pass bar and targeted feedback (Ericsson: effortful, feedback-rich, just beyond current ability). Lessons never grant mastery — this is already Praxis doctrine; 2.0 makes it true for 100% of skills instead of ~40%.
2. **Retrieval and spacing beat re-study.** Mastery decays; the review deck is the retention engine, and *every* modality feeds it, not just judgment cards.
3. **Transfer requires varied surface, constant deep structure.** The industry-reskinning system is the transfer mechanism: same rubric, five industry skins, interleaved. 2.0 extends reskinning from drills to all modalities.
4. **Assessment must be performance-based to be credible.** The rating (PM Elo) only counts *performances under constraint* — timed, cold, first-attempt. Practice is free; rating events are earned.
5. **Novices and experts need different scaffolding.** Worked examples and high structure at Foundations; unscaffolded, ill-structured, time-pressured problems at Staff+. The same skill can appear twice at different scaffold levels.

---

# 1. The Skill Ladder Redesign

## What to keep

- **The 6-level career-ladder frame** (Foundations → Associate → PM → Senior → Staff/Director branch). It maps to real job ladders, which is what makes certification legible to hiring managers. Keep the IC/management branch split at level 5–6.
- **The 12-competency / 4-dimension spine** (execution, insight, strategy, influence) — it matches Ravi Mehta's competency model that hiring rubrics already use. Keep the 5 cross-cutting threads (business, technical, design, communication, ethics) but **promote three of them to first-class competencies** (below).
- **Skill IDs and drill wiring** for the 21 live skills (`jtbd`, `rice`, `pr-faq`, etc.) — preserve exactly as `data.ts` already does, so nothing breaks.
- **Off-ladder specialization tracks** unlocking at Senior certification.
- **The mastery-denominator rule** (only `ready` skills count; `coming-soon` never blocks).

## What changes

- **Competency spine grows 12 → 16.** Promote `communication`, `design` (as **design-collaboration**), and `ethics` from cross-cutting tags to real competencies with their own skill lines, and add `product-ops`. Revised groups:
  - Execution: feature-spec, **delivery**, quality, **release-mgmt** *(new — split from delivery)*
  - Insight: data-fluency, voice-of-customer, ux, **analytics-depth** *(new)*
  - Strategy: business-outcome, vision-roadmap, strategic-impact
  - Influence: stakeholder-mgmt, team-leadership, managing-up, **communication** *(promoted)*
  - Craft (new group): **design-collaboration**, **ethics**, **product-ops** *(all promoted/new)*
  - Cross-cutting threads remaining: business, technical.
- **Ladder grows 60 → 96 skills** (units grow from 17 to 26). Every level gets its slice of the six audit holes so ethics/communication/etc. are *threads*, not a ghetto unit someone skips.
- **Every skill gets exactly one primary practice modality** with a pass bar; `lesson`-only skills are eliminated as a category (each current `SOON_LESSON` skill gets a paired drill, artifact, or card set).

## The 96-skill ladder, level by level

Legend for new modalities (fully specified in §2): **teardown** (case-study analysis), **critique** (fix-this-bad-artifact), **fermi** (estimation drill), **dataread** (dashboard-interpretation drill), **incident** (crisis sim), **writing** (inline-AI-feedback composition), **interview** (mock interview).

### Level 1 — Foundations (12 skills, 4 units)

| Unit | Skills (competency / primary modality) |
|---|---|
| U1 The Role | `what-pm-is` (business/lesson+judgment) · `product-lifecycle` (business-outcome/lesson+judgment) · `four-big-risks` (business/judgment) *(all existing)* |
| U2 Working in a Team | `working-with-eng-design` (team-leadership/lesson) · `roleplay-scope-cut` (roleplay) · `agile-scrum` (delivery/drill) · **`design-crit-basics`** (design-collaboration/critique) — *NEW: read a mock design crit thread, identify which PM comments help vs. harm* |
| U3 Literacy | `technical-literacy` (technical/drill) · `metrics-literacy` (data-fluency/dataread) · **`fermi-basics`** (analytics-depth/fermi) — *NEW: "How many support tickets does a 50k-MAU app generate weekly?"* |
| U4 Saying It Clearly *(NEW unit)* | **`writing-for-busy-people`** (communication/writing: rewrite a 400-word update into 80 words that lead with the ask) · **`ethics-first-principles`** (ethics/judgment: dark-patterns spot-check cards) |

### Level 2 — Associate PM (16 skills, 5 units)

| Unit | Skills |
|---|---|
| U1 Writing It Down | `prds-and-specs` · `prd-artifact` · `user-stories` *(existing)* · **`fix-this-prd`** (feature-spec/critique) — *NEW: a deliberately flawed PRD with 9 seeded defects; find ≥7* |
| U2 Running the Backlog | `backlog-sprints-kanban` · `story-mapping` *(existing)* · **`grooming-under-pressure`** (delivery/incident: mid-sprint scope explosion micro-sim) |
| U3 Shipping Well | `estimation` (t-shirt, existing) · `quality-and-delivery` · **`release-management`** (release-mgmt/drill: sequence a release checklist — feature flags, staged rollout %, rollback criteria) · **`launch-comms`** (release-mgmt/writing: internal launch note + status update) *(NEW: fills delivery/release hole)* |
| U4 Working With Design *(NEW unit — fills design hole)* | **`reading-a-design`** (design-collaboration/critique: annotate a Figma-style mock — what's missing for build?) · **`usability-basics`** (ux/lesson+drill) · **`design-tradeoff-roleplay`** (roleplay: designer wants 3 more weeks for polish; ship date is fixed) |
| U5 Communicating Status *(NEW unit)* | **`status-updates`** (communication/writing) · **`meeting-hygiene`** (communication/judgment cards: "the exec asked a question you can't answer — pick your move") |

### Level 3 — Product Manager (24 skills, 7 units)

| Unit | Skills |
|---|---|
| U1 Continuous Discovery | `jtbd` · `user-interviews` · `problem-framing` · `opportunity-solution-trees` *(existing; OST gains an artifact: build one from supplied interview snippets)* |
| U2 Prioritization | `value-vs-effort` · `rice` · `kano-moscow` · `cost-of-delay` *(existing)* |
| U3 Metrics & North Star | `aarrr-funnel` (gains dataread drill) · `activation-retention` (gains dataread) · `north-star` · `north-star-tree` *(existing artifact)* |
| U4 Experimentation | `ab-test-design` · `experiment-plan` · `reading-results` (gains dataread: "here's an A/B readout with a novelty effect and an SRM warning — ship, iterate, or extend?") *(existing skills, upgraded)* |
| U5 Analytics Depth *(NEW unit — fills data hole)* | **`sql-for-pms`** (analytics-depth/drill: read/fix 5 queries, no writing from scratch) · **`funnel-forensics`** (analytics-depth/dataread: dashboard shows activation drop — find which of 4 segments explains it) · **`forecasting-fermi`** (analytics-depth/fermi: "estimate Q3 revenue impact of a 2% churn reduction") |
| U6 Roadmapping & Positioning | `roadmapping` (gains artifact: Now/Next/Later from a messy input set) · `positioning-basics` · `positioning-statement` *(existing)* |
| U7 Responsible Product *(NEW unit — fills ethics hole)* | **`privacy-by-design`** (ethics/judgment) · **`accessibility-nonoptional`** (ethics+ux/critique: audit a signup flow against 6 WCAG-derived checks) · **`metrics-vs-manipulation`** (ethics/teardown: the case where engagement optimization went wrong — see §2 for the actual teardown) |

### Level 4 — Senior PM (20 skills, 6 units)

| Unit | Skills |
|---|---|
| U1 Strategy & Vision | `product-strategy-stack` · `strategy-memo` · `product-vision` *(existing)* · **`strategy-teardown`** (strategic-impact/teardown: Netflix's 2011 Qwikster split — what did the strategy stack miss?) |
| U2 Growth & Monetization | `growth-loops-retention` (gains drill) · `monetization-pricing` (gains drill: price a 3-tier SaaS package from unit-economics inputs) *(existing, upgraded)* |
| U3 Go-to-Market | `pr-faq` · `pre-mortem` *(existing)* · **`launch-incident`** (release-mgmt/incident: launch day, error rate climbing, exec pinging — 15-minute timed sim) |
| U4 Influence | `stakeholder-management` · `influence-without-authority` · `roleplay-defend-roadmap` · `managing-up` *(existing)* · **`writing-the-decision-memo`** (communication/writing: one-pager for an exec decision with options + recommendation) |
| U5 Cross-Functional Mastery *(NEW unit)* | **`design-strategy-partnership`** (design-collaboration/roleplay: co-own a vision sprint with a design director who disagrees on target user) · **`analytics-partnership`** (analytics-depth/dataread: your DS says the experiment is underpowered; decide what to do) |
| U6 Product Ops *(NEW unit — fills ops hole)* | **`intake-and-cadence`** (product-ops/drill: design an intake process for a 40-person org; grade against anti-bureaucracy rubric) · **`tooling-and-insight-loops`** (product-ops/lesson+judgment) · **`okr-operations`** (product-ops/critique: fix a bad OKR set — 8 seeded defects) |

### Level 5 — Staff/Principal (12 skills, 4 units)

| Unit | Skills |
|---|---|
| U1 Judgment | `judgment-under-ambiguity` · `framing-problems` · `hard-tradeoffs` *(existing)* |
| U2 Scope & Leverage | `multi-team-strategy` · `platform-portfolio-thinking` · `force-multiplier-influence` · `roleplay-customer-escalation` *(existing)* |
| U3 Deciding With Incomplete Data *(NEW unit)* | **`bet-sizing`** (strategic-impact/fermi: expected-value a portfolio of 5 bets under uncertainty) · **`teardown-sunset`** (teardown: Google Reader / Stadia-class shutdown decisions — when is killing right, when is it trust-destroying?) |
| U4 Crisis Leadership *(NEW unit)* | **`sev1-command`** (release-mgmt/incident: multi-turn sev-1 with legal, comms, and eng threads) · **`ethics-escalation`** (ethics/roleplay: your growth lead proposes a retention tactic you believe is deceptive; they have the CEO's ear) · **`writing-the-postmortem`** (communication/writing: blameless postmortem, graded on causal depth not blame language alone) |

### Level 6 — Director/VP (12 skills, 4 units)

| Unit | Skills |
|---|---|
| U1 Leading Teams | `empowered-teams` · `org-design` · `hiring-coaching-pms` · `roleplay-say-no` *(existing)* · **`interview-the-pm`** (team-leadership/interview, seat reversed: *you* run a PM interview against an AI candidate with seeded red flags; graded on signal extraction) |
| U2 The Operating Model | `product-operating-model` · `pnl-business-acumen` (gains dataread: read a product P&L, find the margin problem) *(existing, upgraded)* · **`portfolio-ops`** (product-ops/drill: allocate 60 engineers across 4 bets given strategy memo) |
| U3 Culture & The Top Job | `product-culture` · `cpo-transition` *(existing)* |
| U4 Accountability *(NEW unit)* | **`board-narrative`** (communication/writing: quarterly product section of a board memo) · **`ethics-at-scale`** (ethics/teardown: a Cambridge-Analytica-class case; what governance would have caught it at which level?) |

**Ladder totals: 12 + 16 + 24 + 20 + 12 + 12 = 96 skills, 26 units.** Existing 60 skills preserved (some upgraded with additional modalities); 36 new. Hole coverage: ethics 6 skills across 5 levels, communication 7, design-collaboration 5, release-mgmt/delivery 6, analytics-depth 6, product-ops 5.

### Specialization tracks: 7 → 9, deepened to 4–6 skills each (~40 track skills)

Keep the existing 7 (growth, platform-api, ai-ml, monetization, marketplace, b2b-b2c, zero-to-one) and deepen each from 2 to 4 skills (e.g., growth adds `track-growth-model-artifact` and `track-viral-loops-dataread`). Add two:

- **`data-analytics`** track (4 skills): experiment-platform literacy, metric-tree design, causal-inference judgment cards, dashboard-design critique.
- **`pm-interview-prep`** track (6 skills): product-sense interview, analytical/execution interview, behavioral (STAR) interview, strategy interview, take-home teardown, offer-negotiation roleplay. *This is the acquisition wedge — see §4.*

---

# 2. New Modalities (7 → 13)

The current 7 (lesson, drill, artifact, roleplay, judgment, placement, sim) cover teach → apply → defend → integrate, but everything is *generative from a blank page* or *selective from options*. The gap is **evaluative and reactive practice** — the actual texture of PM work (react to a dashboard, a bad doc, an outage, a question you didn't prepare for). Six additions:

### 2.1 Teardown (case-study analysis of real product decisions)
- **Format:** 8–12 min. Read a 500-word neutral case brief (real, public, well-documented decision). Answer 3 structured prompts *before* seeing what happened: (1) What was the actual decision to be made? (2) What would you have needed to know? (3) Predict the outcome and the mechanism. Then the reveal + expert commentary + a "transfer question" mapping the pattern to the learner's home industry.
- **Why:** contrasting-cases research; prediction-before-reveal creates the "hypercorrection" memory effect for wrong predictions.
- **Launch library (12):** Qwikster split, Instagram Stories fast-follow, Google Reader shutdown, Slack's freemium 10k-message wall, Amazon PR-FAQ for AWS, Superhuman's PMF-survey pivot, Apple's App Tracking Transparency (ethics), Zillow Offers shutdown (data/forecasting), Boeing MAX MCAS (ethics/quality — handled soberly), Figma multiplayer bet, OpenAI ChatGPT free launch, HQ Trivia collapse (growth-loop decay).
- **Grading:** rubric-scored free text (existing artifact grader); the *prediction* is scored on reasoning quality, not on matching history.

### 2.2 Critique ("fix this bad artifact")
- **Format:** 5–8 min. A flawed artifact (PRD, OKR set, experiment plan, dashboard, roadmap slide) with **N seeded defects from a defect taxonomy**. Learner highlights/annotates defects; pass = find ≥70% of seeded defects with ≤2 false positives; then writes the one-sentence fix for the two worst.
- **Why:** evaluation precedes generation in skill acquisition (novices can't self-monitor their own PRDs until they can spot defects in others'); it's also cheap to grade — defects are pre-registered, so grading is near-deterministic with LLM assist only for the fix sentences.
- **Defect taxonomy (shared across critique content):** solution-masquerading-as-problem, unmeasurable success criteria, missing non-goals, hidden dependency, vanity metric, unpowered experiment, roadmap-as-feature-list, OKR-as-task-list, ambiguous owner, no rollback plan. 10 defect classes × industry skins = a generator.
- **Example — `fix-this-prd`:** "One-tap reorder" PRD for a food-delivery app. Seeded defects: success metric is "usage of the button" (vanity), no guest-account edge case, "fast" as acceptance criterion (unmeasurable), payment-token dependency unstated, no experiment plan, non-goals absent, persona contradicts the data cited, launch date but no rollout plan, ignores refund flow.

### 2.3 Fermi / estimation drill
- **Format:** 3–5 min, mobile-perfect. Structured decomposition UI: learner picks decomposition factors, enters ranged estimates per factor, gets scored on (a) decomposition sensibility (rubric), (b) whether the true value falls in their stated 80% interval (calibration), (c) interval tightness. **Calibration is tracked longitudinally** — a personal calibration curve is a profile stat.
- **Why:** PMs make quantitative judgments constantly with no feedback loop; calibration training is one of the best-evidenced trainable judgment skills (Tetlock).
- **Example — `forecasting-fermi`:** "Your fintech app has 800k MAU, 2.1% monthly churn, $14 ARPU. A retention feature is projected to cut churn by 0.3pp. Estimate 12-month revenue impact. Give an 80% interval." Grader has the analytic answer; scoring rewards the decomposition and the interval honesty, not point-precision.

### 2.4 Dataread (dashboard-interpretation drill)
- **Format:** 4–6 min. A rendered dashboard (static SVG/chart components, seeded from a scenario generator so numbers are internally consistent) + a situation line. Two-step answer: (1) "What is the most important thing this data says?" (choice from 5, exactly one best + one defensible), (2) "What do you do next?" (free text, rubric-graded). Distractors are engineered around the classic traps: Simpson's paradox, seasonality, denominator shifts, novelty effects, sample-ratio mismatch.
- **Example — `funnel-forensics`:** Activation dashboard shows a 6pp weekly drop. Segments reveal: overall drop driven entirely by a marketing campaign flooding low-intent signups; per-segment activation actually improved. Best answer identifies mix shift; the trap answers propose "fix onboarding."
- **Why:** this is the single highest-frequency real PM task with zero coverage in Praxis 1.0 and near-zero coverage in the whole market.

### 2.5 Incident (crisis/incident response sim)
- **Format:** 10–15 min timed, multi-turn. A situation unfolds in 4–6 beats (new information arrives whether or not you acted). Each beat: choose/compose an action (post to the incident channel, message the exec, decide rollback, draft the customer comm). Uses the roleplay engine's turn machinery + the sim's state model. Scored on: triage order, communication cadence (did you send the exec update *before* being asked twice?), decision quality, and the written comms themselves.
- **Example — `sev1-command`:** Payments failing for 12% of checkouts, 40 minutes before your biggest sales day of the year. Beat 3 introduces: rollback fixes payments but reverts a compliance change legal required by today. There is no clean answer; scoring is on how you surface and sequence the tradeoff.
- **Why:** high-stakes, time-pressured performance is where "knowing" and "doing" diverge most; nothing in the current stack applies time pressure.

### 2.6 Writing (composition with inline AI feedback)
- **Format:** distinct from `artifact` (end-scored deliverable). Writing drills are short (80–300 words), scored on the *communication* rubric (lead with the ask, one idea per paragraph, quantify, cut hedges), and give **sentence-anchored inline feedback** plus a model rewrite the learner then diffs against their own. Two-round structure: submit → inline feedback → revise → final score on the *revision delta* (rewarding uptake of feedback, which is itself the meta-skill).
- **Example — `status-updates`:** "Your feature slipped two weeks because a dependency team repriotized. Write the update to your director (≤120 words)." Rubric: bad news first, cause without blame, new date with confidence level, what you need from them.

### 2.7 Interview (mock PM interview)
- **Format:** 20–30 min voice-or-text roleplay against an AI interviewer running a real interview format (product sense, analytical, strategy, behavioral), followed by a hiring-committee-style debrief scored against public rubrics (Meta/Google-style product-sense bars). Lives primarily in the `pm-interview-prep` track; also the engine behind certification orals (§3).
- **Why the wedge matters:** interview prep is the one PM-learning category with proven willingness-to-pay (Exponent et al.); it imports users at their moment of maximum motivation, and Praxis converts them to the ladder afterward.

**Retired/absorbed:** none — but `reading`/`reference` stop being modalities and become lesson attachments. Final modality set (13): lesson, drill, artifact, roleplay, judgment, placement, sim, teardown, critique, fermi, dataread, incident, writing, interview — with `placement` and `sim` as meta-modalities.

**Modality-mix rule per level (enforced in the seed linter):** every unit ≥2 modalities; every level ≥6; time-pressured modalities (incident, interview) appear from Senior up; critique appears before its generative sibling in every artifact family (spot bad PRDs before writing one is *unlocked-parallel*, recommended-first).

---

# 3. Mastery, Rating, and Certification

## 3.1 Per-skill mastery: from boolean to a decaying strength

Replace the current mastered/not flag with a **memory-model strength** per skill (FSRS-style, coarse-grained):

- `strength ∈ [0,1]`, set by performance quality on the skill's pass event (barely passed → 0.7; clean pass → 0.9; exceptional → 1.0).
- **Decay half-life depends on modality class:** knowledge skills (lesson+judgment) 21 days initial; procedural drills 45 days; generative artifacts/roleplays 90 days (production practice encodes deeper). Each successful refresh multiplies half-life by ~1.8 (expanding schedule).
- A skill drops to **"stale"** below 0.55 — it stays *mastered for gating* (never re-lock the map; that punishes progress and is motivationally toxic) but stops counting toward *certification currency* and gets queued for refresh.
- **Refreshes are micro, not full replays:** a 90-second "maintenance rep" — one judgment card, one mini-critique (find 2 defects), or one fermi — drawn from the skill's variant pool with a *different industry skin than last time* (spacing + variation = transfer).
- The existing Leitner judgment deck becomes the delivery channel: the review queue interleaves judgment cards with maintenance reps from all modalities. Daily review session stays 5–8 minutes.

## 3.2 The Praxis Rating (PM Elo)

The identified market gap: no chess-style, performance-based PM skill rating exists. Design:

**What it is.** One headline rating (e.g., 1420) plus four dimension sub-ratings (Execution / Insight / Strategy / Influence), Glicko-2 (rating + RD "uncertainty" + volatility), displayed as `1420 ± 90`. New users start 1000 ± 350.

**What feeds it — rated events only:**

| Event | Weight | Why it's honest |
|---|---|---|
| **Weekly Gauntlet** (opt-in, 12 min, 5 mixed timed items: 2 dataread, 1 fermi, 1 critique, 1 judgment; same items for everyone that week, first attempt only, one sitting) | High | Time-boxed, cold, common items → cross-user comparability; items are the "opponents," parameterized by IRT difficulty |
| **Certification exams** (§3.3) | High | Proctored-grade constraints |
| Placement / test-out attempts | Medium | First-attempt, adaptive |
| First attempt at any *sim* scenario or *incident* | Medium | Can't be practiced first by definition |
| First attempt at rated roleplays/interviews | Low-medium | LLM-scored → wider assumed error, lower K |

**What never feeds it:** lessons, repeated attempts, review/maintenance reps, anything doable with unlimited retries. Practice is a safe space; the rating is earned under constraint. (This separation is also what protects intrinsic motivation.)

**How items get difficulty ratings.** Every rated item is itself a Glicko entity. Author sets a prior (Foundations item ≈ 1000, Staff item ≈ 1700); learner-vs-item results update both. Items whose empirical difficulty drifts far from their prior get flagged to content review. This is chess-vs-field, and it means the rating self-calibrates as the population grows.

**How it stays honest:**
1. **Rated = constrained.** Timed, first-attempt, no mid-item navigation away (client-enforced; server-validated timing on submit).
2. **LLM-graded events carry inflated RD** — a roleplay result moves you less per point than a deterministic dataread, acknowledging grader noise.
3. **Anti-gaming:** per-week rated-event caps (rating can't be ground); item-exposure control (each learner sees an item once, ever); Gauntlet items rotate weekly and retire after 3 weeks; anomaly flags (answer-speed distribution, jump detection) shift an account to "provisional" display.
4. **Decay is honest too:** RD widens with inactivity (Glicko does this natively) — after 60 days idle your rating shows `1490 ± 210`, which reads exactly as it should: "was good, currently unverified."
5. **Population re-anchoring** quarterly so 1400 means the same thing in 2027 as 2026.

**How it becomes a hiring signal:**
- **Verified public profile page** (opt-in): rating + RD, dimension radar, level certifications with dates, *and three anonymized graded work samples* (best strategy memo, best incident transcript, calibration curve). A number alone is dismissible; a number attached to inspectable work is a screening tool.
- **Percentile framing** ("top 8% of 21,000 rated PMs on Insight") once N > ~5,000.
- **Employer mode** (later): a hiring team sends a candidate a standardized 45-min rated assessment; Praxis returns the report. That's the B2B revenue line the rating unlocks — but only after the consumer-side rating has volume and trust.

## 3.3 Certification: beating CSPO on credibility at $99–299

CSPO's weakness is precise: it certifies *attendance* (2-day course, no exam). Praxis certifies *performance*. Three certificates:

| Certificate | Bar | Price |
|---|---|---|
| **Praxis Certified Associate PM (PCA)** | All Foundations+Associate skills current (strength ≥0.55) + **90-min proctored-style exam**: 20 adaptive items (judgment/dataread/critique/fermi) + 1 timed artifact (one-page PRD, 35 min) graded on rubric by AI **with human spot-audit on 10% + all borderline scores** | $99 |
| **Praxis Certified PM (PCP)** | Through PM level current + 2-hr exam: adaptive battery + timed experiment-plan artifact + **1 live 20-min rated roleplay** (stakeholder scenario, unseen) + 1 sim scenario ≥ threshold score | $199 |
| **Praxis Certified Senior PM (PCS)** | Through Senior current + 3-hr exam: battery + timed strategy memo + incident sim + roleplay; **human grader reviews the memo** (COGS ~$25, priced in) | $299 |

Credibility mechanics: published exam blueprints and rubrics (like the bar exam, unlike CSPO); pass rates published (target 60–70% — a cert everyone passes is worth nothing); verifiable credential URL with the exam date, score band, and rating-at-certification; 2-year currency window after which the credential shows "lapsed" unless refreshed by a 30-min mini-exam ($29). Retakes $49 with a 2-week lockout. Time-boxed + unseen-item + variant-pool design is the anti-cheating stance; be honest in marketing that this is "exam-grade," not biometric proctoring, until volume justifies a proctored tier.

---

# 4. The Beginner-to-Expert Journey

## 4.1 Session architecture (the daily loop)

A daily session is assembled from a queue with strict priority: (1) due maintenance reps (≤3 min), (2) the active new-skill step, (3) optional stretch (one teardown or the weekly Gauntlet). Mobile sessions are 5–15 min; artifacts/roleplays/sims are flagged "desk work" and scheduled, not forced into the commute slot. **Adaptive difficulty:** each drill family has 3 scaffold tiers (worked-example → faded → cold); two clean passes promote a tier, two misses demote; industry skin rotates on every rep after first mastery (interleaving for transfer).

## 4.2 First 7 days — total novice ("Maya," career-switcher)

- **Day 1 (12 min):** Skip placement (self-identified "new to PM" → placement offers a 3-question confidence check instead of the adaptive battery, avoiding a demoralizing cold test). `what-pm-is` lesson → 3 judgment cards → first "streak seed." Ends with the map zoomed out: "96 skills to Senior. Today: 1."
- **Day 2 (10 min):** `product-lifecycle` + first *teardown-lite* (Instagram Stories, heavily scaffolded: predictions are multiple-choice). First taste of the marquee modality inside 48 hours.
- **Day 3 (10 min):** `four-big-risks` judgment set + first review reps (day-1 cards return — the spacing engine visibly working, which is itself taught in a 30-second interstitial: "why we re-ask").
- **Day 4 (12 min):** Team unit: `working-with-eng-design` → first roleplay, low-stakes tier (the eng lead is *agreeable*; the goal is learning the interface, not surviving pushback).
- **Day 5 (8 min):** `fermi-basics` — first calibration data point, profile shows a calibration curve stub ("come back in 20 fermis").
- **Day 6 (10 min):** Reviews + `writing-for-busy-people` round 1 (submit → inline feedback → revise). The revision-delta score teaches the feedback loop.
- **Day 7 (12 min):** Reviews → Foundations U1 unit-complete moment → **provisional rating unlock offer**: "Take your first mini-Gauntlet (5 items, 8 min) to get your starting Praxis Rating." Rating shown as `1050 ± 300` — deliberately provisional-looking. Week-1 recap: skills touched, cards banked, calibration stub, projected date to Associate at current pace.
- Design intent: by day 7 Maya has touched 6 of 13 modalities, has a visible retention system, a rating, and a concrete pace-projection. No artifact yet — blank-page generation before enough input is where novices bounce.

## 4.3 First 7 days — practicing PM ("Dev," 4 years in, senior-title-hunting)

- **Day 1 (25 min):** Full adaptive placement: 12–18 items (IRT-adaptive judgment/dataread/critique across levels) + one 10-min timed micro-artifact. Output: provisional rating `1380 ± 220`, test-out credit for Foundations + most of Associate (mastered with `strength 0.8`, flagged "placement-verified — will be spot-checked in review"), and a **gap map**: "Strong: prioritization, specs. Thin: analytics depth, influence under pressure."
- **Day 2 (12 min):** Straight to a thin spot at full difficulty: `funnel-forensics` dataread, cold tier. Experienced users must hit *hard* material immediately or they dismiss the product; a wrong answer on a well-designed Simpson's-paradox trap is the retention moment.
- **Day 3 (10 min):** `fix-this-prd` critique — finds 6 of 9 defects; the 3 missed defects each link to the micro-lesson that covers them (remediation is pull, not push).
- **Day 4 (15 min):** First full roleplay (`roleplay-defend-roadmap`, hard tier — the VP interrupts, anchors, and escalates). Scored transcript with rubric annotations.
- **Day 5 (8 min, mobile):** Review reps + `bet-sizing`-style fermi. Placement-verified skills begin surfacing as maintenance reps here — this is the honesty check on test-out.
- **Day 6 (20 min, desk):** First rated sim scenario or `strategy-teardown`.
- **Day 7 (12 min):** **First real Weekly Gauntlet** → rating firms to `1410 ± 140`. Recap frames the arc: "You're operating at PM level with Senior-level strategy instincts. Path to PCS certification: 9 skills, ~6 weeks at your pace." The certification becomes the explicit goal-gradient.
- **Alternative entry for Dev:** the `pm-interview-prep` track is a first-class onboarding path ("I have an interview in 3 weeks") — placement optional, straight to mock interviews, with the ladder cross-sold via the gap map the interviews generate.

---

# 5. Content Production Strategy (3–5x output, quality held)

## 5.1 The core move: separate invariant structure from generated surface

Praxis 1.0 already proves the pattern: drills key off skill IDs and industry resolvers reskin them. 2.0 industrializes it. Every content item = **(skill × modality template × rubric × scenario seed × industry skin)**. Humans own the invariants (templates, rubrics, defect taxonomies, difficulty anchors); AI generates the variable surface (scenarios, personas, numbers, distractors); a validation pipeline gates everything.

## 5.2 Three human-owned libraries (the quality substrate)

1. **Rubric library (~40 rubrics).** One canonical rubric per artifact/writing/roleplay family (PRD, strategy memo, experiment plan, status update, postmortem, decision memo…), each with 4–6 criteria × 4 anchor levels, **each anchor illustrated with a real graded exemplar**. Rubrics are versioned; every graded item stores its rubric version (so regrades and rating math stay coherent).
2. **Scenario template library (~30 templates).** A template = situation skeleton + parameter slots + constraint set + trap specification. E.g., dataread template "mix-shift masquerading as regression": slots for metric, segments, magnitude, industry; constraint "segment-level trend must contradict aggregate"; the trap is *structural*, so every instantiation is pedagogically identical.
3. **Defect taxonomy (~10 classes × exemplars)** for all critique content, per §2.2.

## 5.3 The generation pipeline (per item)

1. **Generate:** LLM instantiates a template into a target industry skin (5 skins per scenario by default — marginal cost near zero).
2. **Self-check:** a second model pass verifies internal consistency (do the dashboard numbers add up? does the seeded defect actually violate the rubric criterion? is the "best answer" defensibly best?). For quantitative items (fermi, dataread), a **deterministic checker** recomputes every number — no LLM math trusted.
3. **Adversarial solve:** a third pass *attempts the item cold* three times. If the model can't reach the intended answer from the presented information, or finds an unintended second correct answer, the item bounces. (This catches ~the majority of bad distractors before a human ever looks.)
4. **Human review:** editor reviews at ~10–15 min/item against a 10-point checklist. Humans approve; they don't draft.
5. **Live calibration:** first 200 learner exposures run "unrated-shadow"; item difficulty, discrimination, and distractor performance are measured; items with negative discrimination (strong learners miss it more) auto-retire to review.

**Throughput math:** a human authoring a dataread drill from scratch ≈ 4–6 hrs. Template + pipeline + review ≈ 45–60 min of human time per *shipped, calibrated* item — and each item ships with 5 industry skins. That's the 3–5x, conservatively, with quality *higher* than hand-authoring because calibration is built in.

## 5.4 What stays fully human

- All 40 rubrics and their exemplar anchors.
- Teardown case briefs (real events — factual accuracy and fairness are reputational; AI drafts, human verifies every claim against sources, legal-sensitive cases get extra review).
- Certification exam items (human-authored, pipeline-validated, never in the practice pool).
- Roleplay character bibles (the *persona spec* — objection trees, escalation triggers — is human; per-industry reskin is generated).

## 5.5 Grading QA loop

Because half the modalities are LLM-graded: maintain a **golden-transcript regression set** (~30 graded submissions per rubric spanning the score range, human-consensus-scored); every grader-prompt or model change must reproduce golden scores within tolerance before deploy (this slots into the existing Vitest suite). Weekly human audit of a 5% sample of live grades, oversampling borderline and high-stakes (rated/cert) events; grader-drift metrics on the ops dashboard.

## 5.6 Production roadmap

- **Quarter 1:** rubric library + defect taxonomy + critique/dataread/fermi pipelines (highest volume-to-effort). Ship Associate+PM new units. 12 teardowns hand-built.
- **Quarter 2:** writing + incident modalities; Senior new units; Weekly Gauntlet live (needs the item pool from Q1); PCA cert.
- **Quarter 3:** interview track (wedge launch), PCP/PCS certs, deepened specialization tracks; rating goes public-profile.
- Steady state: ~2 editors + pipeline sustain 30–40 new calibrated items/week plus maintenance-rep variant pools — enough to keep the Gauntlet rotating and the review deck fresh indefinitely.

---

## Summary of the deltas

| Dimension | Praxis 1.0 | Praxis 2.0 |
|---|---|---|
| Ladder | 6 levels, 60 skills, 17 units | 6 levels, **96 skills, 26 units** (+ 9 tracks, ~40 track skills) |
| Competencies | 12 + 5 threads | **16** + 2 threads (communication, design-collab, ethics, product-ops promoted; analytics-depth, release-mgmt added) |
| Modalities | 7 | **13** (+teardown, critique, fermi, dataread, incident, writing, interview) |
| Mastery | boolean, permanent | **decaying strength (FSRS-style), micro-refresh via unified review deck** |
| Rating | none | **Glicko-2 Praxis Rating, rated-events-only, item-as-opponent, hiring-facing profile** |
| Certification | level-completion badge | **3 exam-based certs at $99/$199/$299, published blueprints and pass rates, 2-yr currency** |
| Onboarding | one path | **novice path (no cold test, teardown by day 2) vs. practitioner path (adaptive placement, hard material by day 2, Gauntlet by day 7) + interview-prep wedge entry** |
| Content ops | hand-authored | **template × rubric × skin pipeline: adversarial-solve validation, live IRT calibration, golden-transcript grader QA — 3–5x throughput** |
