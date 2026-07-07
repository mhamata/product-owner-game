# Praxis 2.0 — Game & Retention Design Spec (iOS)

**Author role:** Lead game designer, mobile learning games
**Grounding:** Built against the actual Praxis codebase — the 6-level ladder (Foundations → VP), 12-competency spine, Leitner judgment deck (`reviewStore`), AI-graded artifacts, roleplay, the deterministic capacity/tech-debt/stakeholder sim engine (`engine_algorithms.md`, `gameStore`), 5 industries, 7 specialization tracks, placement/certification, and the difficulty ladder in `scenarios/ladder.ts`. Everything below maps onto systems that already exist; the mobile work is packaging, pacing, and retention scaffolding, not new pedagogy.

**North-star metrics:** D1 ≥ 55%, D7 ≥ 30%, D30 ≥ 15%, median session 5–7 min, 1.6 sessions/day for streak holders, trial→paid ≥ 12%.

---

## 0. The One Design Thesis

Praxis's unfair advantage over Duolingo-for-X clones is that **the career is the game**. Nobody fantasizes about "Unit 12: Prioritization." Everybody fantasizes about getting promoted. So every system below is skinned as a career: XP is "credibility," levels are job titles, the season pass is a "performance cycle," leagues are "your cohort of peers," the sim is "your product," and the paywall is framed as "your promotion case." The player isn't studying PM — they're *living a sped-up PM career* where a promotion that takes 2 years in real life takes 6 weeks of daily reps.

Mechanical consequence: **one currency of truth (PM Rating), one currency of effort (XP/"Cred"), one currency of luck/generosity (Focus Tokens)**. Nothing else. No gems, no hearts-as-lives (hearts punish learning; we punish *absence*, never *wrongness*).

---

## 1. Core Loop Redesign for Mobile

### 1.1 The daily session: "The Standup" — second-by-second

Target: 4:30–5:30, completable one-handed, portrait, on a subway. Structure is **warm-up → workload → cliffhanger**, a fixed 3-act ritual so the habit has a shape.

**0:00–0:04 — Launch.** Cold start < 2s. No splash video. First frame is your **Title Card**: name, current title ("Product Manager II"), PM Rating (1387), streak flame (day 23), and one line of "inbox" flavor: *"3 items need your judgment today."* One button: **Start Standup**. (Home screen has other tabs, but the daily path is one thumb-tap from launch. Zero decisions before the first rep.)

**0:04–0:45 — Act 1: Warm-up (2 judgment cards).** Two cards from the Leitner deck (`reviewStore` due queue), always starting with one the player is *likely to get right* (mastery ≥ 0.7) — a "layup" for immediate competence feeling — followed by one due card at real difficulty. Format: scenario text (≤ 60 words, industry-skinned), 2–4 tap options, swipe-up to commit. On answer: instant verdict stamp (**SOUND CALL** / **RISKY CALL**), one-line rationale, +XP ticker. ~18 seconds per card. These cards count toward spaced repetition *and* warm the brain up.

**0:45–3:45 — Act 2: The Workload (one focused block, ~3 min).** The engine picks ONE of the following per day based on the skill map's weakest live competency (rotation guarantees variety, max 2 consecutive days of the same mode):

- **Drill Set** (Mon-ish): 5 drills on the current lesson skill, 25–35s each. Existing drill content, re-chunked to one question per screen, big tap targets, no typing.
- **Micro-Roleplay** (2×/week): a 4-exchange stakeholder pushback. Mobile redesign: the AI character speaks; the player composes replies by **tapping stance + evidence chips** ("Hold the date" + "cite churn data" + "offer scope cut") rather than free-typing. Free-type is an optional "say it your way" button for power users. This keeps roleplay on-phone without keyboard hell, and the chip choices are gradeable deterministically with AI grading the optional free-type.
- **Judgment Gauntlet** (1×/week): 7 cards, escalating difficulty, timer *visible but soft* (no fail on timeout, but "decisive" bonus XP under 15s — trains the real PM skill of deciding with incomplete information).
- **Artifact Sprint** (1×/week, phone version): NOT full PRD-writing. Phone artifacts are **critique & repair**: shown a flawed PRD section / experiment plan, tap the weakest claim, choose the fix, reorder the priority list by drag. Full artifact *authoring* is iPad/web (see 1.3), and the phone session ends with a handoff card: "Draft due: your Q3 strategy memo. Continue on iPad or web →" (deep link, Handoff support).

**3:45–4:40 — Act 3: The Cliffhanger (one sim turn).** Every daily session ends with **exactly one turn of your ongoing simulation run** (the persistent save, see §5). You see last turn's consequences land (revenue tick, a stakeholder message, capacity range for next sprint), you commit ONE sprint plan (drag 3–5 backlog cards into the sprint, place the release card), tap **Commit Sprint** — and the results are **withheld until tomorrow's session**. The closing screen literally says: *"Sprint 7 is running. Results at your next standup."* This is the single most important retention mechanic in the design: the Zeigarnik hook is a *consequence you authored*, not a puzzle someone else made. (Engine already supports this — `phase: 'committed'` is a natural save point; execution resolves on next open.)

**4:40–5:00 — Debrief screen.** XP earned (+140 Cred), rating delta if any ranked cards were played (+6 → 1393), streak tick with flame animation, progress bar to next title ("PM II → Senior PM: 62%"), and ONE forward tease chosen by priority: promotion proximity > league position > sim cliffhanger > new unlock. Single CTA: **Done** (or "One more gauntlet?" if session < 4 min).

### 1.2 Session variants

- **Lite Standup (streak-saver):** 90 seconds — 3 judgment cards + view sim results (no new commit). Offered automatically after 9pm local if streak is unextended. Counts for streak, awards 40% XP. Protects the streak without devaluing it.
- **Deep Work session:** user-initiated, 15–25 min — full gauntlet + 3 sim turns back-to-back + a roleplay. Capped at 3 sim turns/day so the cliffhanger economy survives binge players (soft cap: turns 4+ earn 0 XP and show "Your team needs to actually build this — come back tomorrow," which is also *thematically correct*).

### 1.3 Device tiering (honest modality mapping)

| Mode | iPhone | iPad | Web |
|---|---|---|---|
| Judgment cards / drills | ✅ primary home | ✅ | ✅ |
| Sim (turn-based) | ✅ primary home | ✅ enhanced (full dashboard view) | ✅ |
| Roleplay | ✅ chip-composer + voice input | ✅ chip or full text | ✅ full text |
| Artifact critique/repair | ✅ | ✅ | ✅ |
| Artifact authoring (PRD, memo) | ❌ handoff card only | ✅ split-view + Pencil annotation of AI feedback | ✅ primary |
| Certification exams | ❌ | ✅ | ✅ primary |

Rule: the phone never offers a degraded version of a deep mode; it offers a **complete small version** (critique instead of authoring) plus a handoff. Cross-device continuity via account sync (this forces the move off local-only Zustand persistence to a synced backend — the one hard engineering prerequisite for everything in this doc).

---

## 2. Progression & Reward Systems

### 2.1 XP → "Cred" and the Career Ladder

XP is renamed **Cred** (credibility — thematically, the real currency of PM careers). Earn rates:

| Action | Cred |
|---|---|
| Judgment card correct | 10 (+5 decisive bonus <15s) |
| Judgment card wrong | 3 ("you learned something") — never zero |
| Drill correct | 12 |
| Roleplay exchange, strong | 25 |
| Sim turn committed | 30 |
| Sim milestone (release shipped, scenario complete) | 100–400 |
| Artifact graded ≥ competent | 150 |
| Daily 3-act session complete | 50 completion bonus |

Typical daily session ≈ 180–250 Cred.

**The Career Ladder** (maps to existing 6 levels, subdivided for mobile pacing — a level-up every 3–7 days early, stretching later):

| Title | Cred threshold (cumulative) | Also requires |
|---|---|---|
| Intern | 0 | — |
| Associate PM I / II | 500 / 1,500 | — |
| PM I / II / III | 3,000 / 5,500 / 9,000 | L2 certification (existing test-out) |
| Senior PM I / II | 14,000 / 20,000 | L3 cert + 1 sim scenario cleared |
| Staff / Principal PM | 28,000 / 38,000 | L4 cert + 1 specialization track started + rating ≥ 1500 |
| Group PM → Director → VP Product | 50k / 65k / 85k | L5–L6 certs + rating gates (1650/1800) + turnaround scenario cleared |

Cred alone never promotes you past PM III — **certifications and rating gate the senior titles**, so the title stays credible (crucial for the shareable rating card, §4.4). Cred is the *pace* layer; competence is the *gate* layer. This dual-key design is what lets us be generous with XP without inflating the credential.

**Promotion Ceremony** (the visceral bit): full-screen takeover, 8 seconds. Your old title card physically *tears away* to reveal the new one (haptic: heavy impact). A "promotion packet" slides in: new title, new **comp band** ("$142K–$168K — 75th percentile, US market" — sourced from real salary data, updated yearly; this is the score-as-salary mechanic and it is *electric* because it's real), a one-line performance review generated from your actual stats ("Promoted for consistently strong prioritization under uncertainty; watch area: stakeholder trust"), and one **unlock** (see 2.4). Then a pre-composed share card. Comp is display-only — never a spendable currency (spending "salary" breaks the fiction and invites dark-pattern accusations).

### 2.2 The Streak System (designed properly)

Streak = consecutive days with a completed Standup (full or Lite). The flame is on the title card, the widget, and the icon badge.

- **Grace window:** streak day rolls at 3:59am local (late-night sessions count for "today").
- **Streak Freezes:** renamed **PTO days** (again — career fiction does the work). Hold max 2. Earn 1 free at day 5; buy with Cred afterward (300 Cred, price doubles each purchase in a 30-day window: 300 → 600 → 1200, resets monthly — prevents freeze-hoarding from making streaks meaningless). Auto-applies on a missed day; push notification next morning: *"You took a PTO day. 1 remaining. Streak intact: 34 days."*
- **Streak repair:** one-time-per-90-days "weekend catch-up" — do a double session within 48h of breaking to restore. After that, it's gone. (Sparingly forgiving beats infinitely forgiving; Duolingo's over-forgiveness has measurably cheapened its streak.)
- **Streak Wager (opt-in, weekly):** Monday prompt: "Commit to 5 sessions this week?" Stake 200 Cred. Complete → 500 Cred + a wager badge tier (bronze→silver→gold→onyx at 4/12/26/52 successful weeks). Fail → lose stake, no other penalty. Loss-aversion for those who opt in; invisible to those who don't.
- **Milestones:** day 7 (badge + 1 PTO day), 14, 30 (animated flame upgrade: orange→blue), 50, 100 (flame→**plasma** + exclusive title-card frame), 365 ("Iron Year" — permanent profile laurel + free month of subscription). Milestone screens are share-card-ready.
- **Streak ≠ XP multiplier.** Streaks gate *cosmetics and PTO*, not learning velocity — multiplier streaks make breaks feel like losing a compounding asset and produce rage-quits.

### 2.3 Leagues — "Cohorts"

Weekly leagues of 30, bracketed by rating band so you compete with peers (Duolingo's biggest league flaw is mixing tourists with grinders). Skinned as **your APM cohort / PM cohort / Senior cohort…**, matching your title band.

- Score = weekly Cred. Monday 00:00 UTC → Sunday reset.
- Top 5 promote to the next cohort tier (Bronze→Silver→Gold→Sapphire→Ruby→**Boardroom**, top tier). Bottom 5 demote. Tiers 1–2 have no demotion (protect fragile new users).
- Rewards: cosmetic frames + Cred bonuses (100/250/500 for top 15/5/1). Never rating. Leagues measure *effort*, rating measures *skill* — keeping these separate is non-negotiable.
- Anti-degenerate cap: only the first 600 Cred/day counts toward league score, so leagues can't be won by 4-hour grind sessions, only by consistency.
- Opt-out exists in settings, buried one level (competition-averse users are real; ~15% will use it and retain *better* for it).

### 2.4 Achievements & unlockables

Achievements = **Performance Review badges**, organized by the 12 competencies (e.g., *"Scope Surgeon" — cut scope in the sim 10 times without losing a champion customer*; *"Truth to Power" — win 5 roleplays against VP-archetype characters*; *"Debt Collector" — take tech debt from >70 to <30 in one scenario*). Each badge has bronze/silver/gold tiers and shows on the public profile. Target: 60 badges at launch; each one is a *specific behavior we want to train*, not "log in 10 times."

Unlockables (all earnable, none purchasable — cosmetics are progression trophies, not a store, at least for v1):
- **Title card frames & backgrounds** (streaks, league finishes, certs).
- **Industries as unlocks:** you start with your chosen home industry; each additional industry skin (Fintech, Healthcare…) unlocks at title milestones — replays the same skills with fresh flavor, which is disguised spaced repetition.
- **Specialization tracks** (existing system): unlock at Senior cert, presented as "choose your career specialty" with a dramatic pick screen.
- **Sim difficulty modifiers** (§5.4) unlock by clearing scenarios.
- **Roleplay characters:** tougher archetypes (the Chaos CEO, the Silent CTO) unlock via roleplay badges.

---

## 3. PM Rating (the Elo) as a Game Mechanic

### 3.1 What rates you

A single **PM Rating**, Glicko-2 under the hood (rating + deviation RD + volatility), displayed 800–2200. Only **ranked instruments** move it:

1. **Ranked judgment cards** — each card has a difficulty rating (calibrated continuously from the population's answer data, item-response-theory style: the card is the "opponent"). Cards in the daily warm-up are ranked by default.
2. **Ranked sim scenarios** — a completed scenario run scores against difficulty-adjusted expected outcome bands (the deterministic engine makes this clean: same seed + scenario = comparable runs). Beating the expected band = "win" vs. the scenario's rating.
3. **Certification exams** — big rating events, low RD afterward.
4. **Weekly Community Scenario** (§5.5) — percentile finish converts to a rating adjustment.

Drills, lessons, and casual sim runs are **unrated practice** — always labeled, always available, so there's a pressure-free space. Roleplay and artifacts stay unrated in v1 (AI grading isn't yet consistent enough to move a number users will put on LinkedIn; revisit when grader reliability is proven).

### 3.2 Placement — "The Assessment Week"

New users (post-onboarding) enter with hidden rating 1000, RD max. The existing adaptive `placement.ts` becomes **5 placement days**: each of the first 5 daily sessions includes a "placement block" (6 adaptive ranked cards). Rating is shown as `~1240?` (tilde + question mark) until day 5, then a **Rating Reveal ceremony**: needle animation sweeping to your number, percentile ("top 34% of product operators"), and your weakest/strongest competency. This is deliberately the emotional peak of week 1 and is timed for day 5 = trial-reminder day (§6.4).

### 3.3 Rating bands, gates, decay, seasons

| Band | Rating | Skin |
|---|---|---|
| Bronze | <1100 | "Building fundamentals" |
| Silver | 1100–1349 | "Solid operator" |
| Gold | 1350–1549 | "Strong operator" |
| Platinum | 1550–1749 | "Senior operator" |
| Diamond | 1750–1949 | "Elite operator" |
| **Praxis Master** | 1950+ | top ~0.5%, name on global board |

- **Gates:** Staff+ titles require rating floors (§2.1); Nightmare-tier sim modifiers require Platinum; the Master community scenario bracket requires Diamond. Gating *content by rating* creates aspiration; gating *core learning* by rating would create despair — so gates only apply to prestige/hard content, never lessons or the deck.
- **Decay:** no true decay (punishing rust on a *learning* app is hostile). Instead, RD inflates after 14 idle days — the rating displays as `1520 (rusty)` with a widened band, and the first session back includes a 5-card "knock the rust off" recalibration that can move it fast either way. Feels fair, is fair, still creates return pressure.
- **Seasons:** quarterly, matching the sim season (§5.3). Rating carries over but gets a soft squish toward 1500 (10% compression) + fresh placement-lite (one gauntlet) each season start. Season-end: your **Performance Cycle Report** — peak rating, competency radar, badges earned — rendered as a share card. Seasonal peak ratings are archived on the profile ("S1: 1487 · S2: 1592 · S3: 1610") so long-term growth is visible, which is the entire product promise in one row of numbers.

### 3.4 Integrity

Ratings people put on résumés will be gamed. Mitigations: ranked cards are drawn from a large rotating pool with per-user no-repeat windows (90 days); sim ranked runs use server-side seeds; certification exams (the biggest rating movers) are time-boxed, tab-blur-detected on web, and one-attempt-per-14-days; the "Verified" mark on share cards (§4.4) only attaches to cert-backed ratings.

---

## 4. Social & Multiplayer (all async — no live sync needed in v1)

### 4.1 Challenge runs — "Beat my quarter"

Any completed sim run generates a **challenge link**: same scenario, same seed, same event schedule (deterministic engine makes this literally replayable — this feature is almost free given the architecture). Recipient plays the identical quarter; the app renders a turn-by-turn comparison ("Turn 4: Maya shipped the release. You banked capacity.") and a final score diff. Works user→user via share sheet, and via the weekly community scenario. Non-users who tap the link hit a web-playable 3-turn teaser of the same scenario → App Store. **This is the referral loop with actual gameplay in it.**

### 4.2 Peer review as a mechanic — "Design Review"

Artifacts (iPad/web) can be submitted to **Design Review**: you review 2 peer artifacts against a guided rubric (tap-to-annotate the weakest sections, pick from rubric verdicts — 4 min per review, phone-friendly!) to earn 1 peer review of your own artifact. Reviewer quality is itself scored (agreement with AI grade + author helpfulness rating) into a **Reviewer Rep** score; high-Rep reviewers earn the "Mentor" badge track and their reviews get priority routing. This turns the pedagogically-best activity (evaluating others' work) into the price of a coveted good (human feedback), and it scales AI-grading trust with a human layer.

### 4.3 Guilds — "Product Orgs"

5–20 person groups (invite or discovery). Features, in priority order: (1) org-only leaderboard tab; (2) **Org Goal** — weekly collective target (e.g., 40 sessions org-wide) → everyone gets a Cred bonus + org banner cosmetic; (3) shared challenge runs ("this week the org plays seed #4471, internal ladder"); (4) org chat limited to structured messages + emoji reactions in v1 (full chat = moderation cost, defer). Target use case: actual work teams and PM communities onboarding together — B2B seeding disguised as a guild feature.

### 4.4 Share cards

Every ceremony pre-composes a 9:16 + 1:1 card: **Rating Reveal** ("PM Rating 1487 — top 34%", competency radar, subtle Praxis wordmark), **Promotion** (new title + comp band), **Streak milestones**, **Season Report**, **Community Scenario finish** ("Top 8% of 12,431 PMs this week"). Cert-backed cards carry a **Verified** checkmark + QR to a public verification page (praxis.app/v/{hash}) — this is the LinkedIn play, and LinkedIn is where our audience lives. One-tap share to LinkedIn/X/Instagram Stories; every card's deep link opens the 3-turn sim teaser.

### 4.5 Referrals

"Refer a colleague": both parties get 1 month of Plus when the referee finishes placement week (not on install — pays on *activation*). Referrer also gets an exclusive "Talent Magnet" badge tier at 3/10/25 activated referrals. No cash, no gem bribes — status and subscription time only.

---

## 5. The Simulation as Flagship Game

The engine (`step(state, action)`, seeded PRNG, capacity ranges, customer engagement ladders, stakeholder trust, tech debt curves) is genuinely good turn-based game material — comparable bones to a light 4X. The mobile job is **pacing it like Polytopia, not like a dashboard.**

### 5.1 Turn structure on phone (one turn ≈ 60–90s)

1. **Results phase (~20s):** last sprint resolves as a *feed*, not a table — capacity roll revealed as a satisfying range-collapse animation (you planned against 12–18, you rolled 14), items completing with checkmark haptics, then 1–2 consequence cards (a customer message in-fiction: *"Maya @ Meridian: still waiting on exports. We're evaluating alternatives." — trust −1*).
2. **Situation phase (~15s):** next sprint's capacity range, any event card (team member out sick, stakeholder demand, regulatory deadline — all existing engine events), inbox badge if a stakeholder needs a reply.
3. **Decision phase (~40s):** drag PBIs from backlog into the sprint slot machine, place the release card or don't, optionally write/pick a sprint goal (chips). Item cards show effort, value, who it satisfies (customer avatars), dependency locks. The `effort: 5?` uncertain-cost items get a shimmering "?" — beautiful risk texture the engine already supports.
4. **Commit** — slab button, heavy haptic, "Sprint 8 running…" and either results-now (Deep Work) or the daily cliffhanger cut (§1.1).

**Save/resume:** state serializes at every phase boundary (engine is a pure function over state — trivial). A run survives app kills, device switches, and weeks of neglect. Returning to an old run shows a "previously on your product…" recap screen (3 bullets generated from `eventLog`).

### 5.2 Run lengths

- **Scenario runs:** 8–12 turns (existing scenarios: launch, scaling crunch, regulated launch, turnaround, zero-to-one) = 8–12 days at cliffhanger pace, or one sitting in Deep Work. This dual pacing is the key design: dailies nibble, weekends binge.
- **The Long Game (post-VP endgame):** a persistent 40-turn "founding PM to IPO" mega-scenario, unlocked at Director title. One turn/day only, no binge option. This is the retention endgame for month-3+ users.

### 5.3 Seasons of scenarios

Quarterly seasons aligned with rating seasons. Each season ships: 1 new scenario family (new market/crisis theme), 1 new event pack injected into existing scenarios, 1 new stakeholder character, ~12 weekly community scenarios. Season theme is fictional-topical (S1: "The Funding Winter" — budget-constraint scenarios; S2: "The AI Rush" — hype-vs-debt tradeoffs). Content cost is bounded because scenarios are data (`*.structure.ts` + `*.display.ts`), not code.

### 5.4 Difficulty modifiers — "Operating Conditions"

Unlockable toggles applied pre-run for score multipliers (leverages existing `difficulty.ts`):

| Modifier | Effect | Score mult |
|---|---|---|
| Fog of Roadmap | all efforts shown as ranges | ×1.2 |
| Brittle Codebase | tech debt accrues 1.5× | ×1.2 |
| Impatient Board | stakeholder trust decays each quiet turn | ×1.3 |
| Skeleton Crew | −20% capacity baseline | ×1.3 |
| **Nightmare Quarter** | all of the above (Platinum-gated) | ×2.0 |

Modifier finishes get badge laurels ("cleared Turnaround ▸ Impatient Board"). This is Slay-the-Spire Ascension for PM skills, and it makes replaying old scenarios (= re-practicing skills) the prestige activity.

### 5.5 Weekly Community Scenario

Every Monday 00:00 UTC: one scenario, one seed, one attempt, everyone. 8 turns, playable across the week (turn-per-day or one sitting). Sunday close → percentile leaderboard (global, cohort-tier bracket, and guild views), rating adjustment, top-1% "Operator of the Week" laurels, and a **designer's retro** published Monday showing the optimal line vs. the population's choices ("71% of you shipped in turn 3; the top decile banked capacity and shipped turn 4 — here's why it dominated"). That retro doubles as free content marketing. One attempt + shared seed + deterministic engine = perfectly fair, cheap to run, endlessly discussable.

---

## 6. Onboarding: Install → Aha → Paywall, and the Scripted First 7 Days

### 6.1 First session (target: aha < 3 minutes, total ≤ 8 minutes)

1. **0:00 Cold open — no signup.** Screen 1: *"You're the PM. The CEO wants the launch moved up two weeks. Engineering says the codebase will crack. What's your call?"* — 3 tap options. The user is *playing within 10 seconds of first launch*. Answer → verdict + rationale + "+10 Cred" (their first number goes up).
2. **Cards 2–3:** two more judgment calls, escalating juice (haptics, stamps). By 0:50 they've made 3 PM decisions and been told *why* they were sound or risky. **That's the aha: "this thing evaluates my judgment, and it's fun."**
3. **1:00 Quiz frame begins** (the researched onboarding-quiz → paywall pattern, but every question does double duty as personalization): current role (student / adjacent / junior PM / senior / manager) → goal (break in / get promoted / interview prep / sharpen up) → home industry picker (existing 5, nice icons) → daily commitment (5/10/15 min — sets session template & notification tone) → *"Where do you want to be in 12 months?"* (title picker — this becomes their **stated goal** and the paywall's emotional anchor).
4. **3:30 Mini-placement:** 5 adaptive cards, framed as "let's calibrate your starting title." Progress bar labeled *Calibrating…*
5. **4:45 Payoff screen:** *"Starting title: **Associate PM**. Provisional rating ~1140. Fastest path to Senior PM: 11 weeks at 10 min/day."* Personal plan renders (their industry, their goal-title as the summit of the skill map).
6. **5:15 Account creation** (Sign in with Apple, one tap) — placed *after* value, *before* paywall, framed as "save your rating."
7. **5:30 HARD PAYWALL.** Full screen: their plan, their goal title at the top, 7-day free trial → $12.99/mo or $79.99/yr (highlighted, "save 48%", trial on annual only — the researched pattern). Copy: *"Your promotion plan is ready."* Feature list: unlimited sim, ranked mode, certifications, all industries. **Reminder promise up front:** "We'll remind you 2 days before the trial ends" (Blinkist-pattern; measurably improves trial starts and reduces refund anger). Below the fold in small text: *"Continue with the free daily standup"* — free tier = daily session with 1 sim turn/week, no ranked, no certs. (Hard-ish paywall: monetize the motivated majority at the moment of peak intent, keep a thin free path for the long-tail-conversion and virality.)
8. **6:00 Post-paywall (either outcome):** first real Standup begins — Act 3 gives them **sim turn 1** of the tutorial scenario (existing scenario01), and the session ends on their first cliffhanger + notification permission ask, perfectly timed: *"Your sprint results land tomorrow morning. Want to know when?"* → **Allow**. (Asking for push at the moment the user has a concrete reason to want it: expect 70%+ grant vs ~40% cold.)

### 6.2 Days 2–7 script (every day has a designed job)

| Day | Scripted beat | Retention job |
|---|---|---|
| 1 (install) | Cliffhanger set; push granted | Reason to return |
| 2 | Sprint 1 results (engine guarantees a *mixed* outcome on tutorial seed — one win, one consequence); placement block 2/5; first wrong-card returns in warm-up ("remember this one?") — spaced repetition made visible | Prove consequences are real; prove the deck remembers |
| 3 | First micro-roleplay (gentle archetype); "APM I" promotion fires (~1,300 Cred by now — first ceremony, first share card) | First status jump |
| 4 | Judgment Gauntlet debut; league placement announcement ("You've been placed in an APM cohort — week starts Monday"); streak day 4 flame notice | Introduce competition socially, not scarily |
| 5 | **Rating Reveal ceremony** (placement complete) + percentile + share card. **Trial reminder push lands this morning** (required by our promise; App Store-compliant), deliberately the same day as the reveal: the reminder arrives hours after the emotional peak of "I have a real rating now." Evening: paywall re-present for trial users with plan recap. | **The conversion day.** Peak value demo + honest reminder = the researched day-5 conversion spike |
| 6 | First "PTO day" freeze granted free ("everyone needs PTO — here's yours"); sim tutorial scenario reaches its crisis event | Insurance gift = reciprocity + streak armor before the fragile first weekend |
| 7 | Tutorial scenario finale + first **Retro** (existing AI retro, mobile-formatted) + Week 1 Report card (rating, Cred, streak 7 badge, radar) + first league week concludes Sunday | Weekly ritual established; day-7 = they've seen every core loop once |

Instrumentation: every beat above is an analytics event; the funnel is install → first card (target 95%) → quiz complete (80%) → placement complete (70%) → trial start (35% of placements) → D5 return (60% of trial starts) → paid (40% of trials).

### 6.3 Win-back scripting

Lapsed day 2–3: push leads with the *cliffhanger* ("Sprint 3 results are waiting — Meridian made a decision about your product"), never with guilt. Lapsed day 7+: "rusty rating" email + a 90-second Lite Standup deep link. Lapsed day 30: season-start amnesty ("New performance cycle. Everyone's rating re-calibrates — clean slate Monday").

---

## 7. Notifications & Widgets

### 7.1 Push strategy — voice: your (kind) chief of staff, never a nag

Global rules: max 1 push/day default (user can enable league/social extras), ML-timed to each user's historical open window (fallback: their stated commitment time), every push deep-links to a ≤ 2-tap action, and **every push contains state, not sentiment** — a fact from *their* game, never "We miss you!"

| Trigger | Timing | Example copy |
|---|---|---|
| Daily (cliffhanger primary) | user's window | "Sprint 9 resolved: capacity came in low. Maya escalated. Your move." |
| Daily (no active run) | user's window | "3 judgment cards due. Your PM II case needs 240 more Cred." |
| Streak at risk | 9:00pm local, only if streak ≥ 3 and unextended | "Day 23 ends in 3 hours. 90-second Lite Standup keeps it." |
| PTO auto-used | next morning | "PTO day used — streak intact at 24. One left." |
| League, final day | Sunday ~5pm | "You're 6th. Top 5 promote to the Senior cohort. ~200 Cred gap." |
| Community scenario open | Monday 9am (opt-in class) | "This week: 'The Migration.' 12,000 PMs, one seed. One attempt." |
| Trial reminder | Day 5, morning (promised) | "Heads up as promised: trial ends Thursday. Your rating so far: 1288 — top 41%." |
| Social (opt-in) | event-driven, ≤1/day | "Dana beat your Turnaround run by $210K. Rematch link inside." |

Explicit non-negotiables: no guilt copy, no sad-mascot pattern, no fake urgency ("last chance!" only if literally true, e.g., league close), and streak-risk pushes stop after 2 ignored cycles (auto-downgrade to weekly digest — respecting disengagement is a long-term retention play and an App Store review play).

### 7.2 Widgets

- **Small (home screen):** flame + day count + a subtle ring showing today's session state (empty → done). Tap → straight into Standup. Ring turns amber after 6pm if unextended — ambient streak pressure without a single notification.
- **Medium:** streak + rating + "due today" line ("2 cards · 1 sim turn · Sprint 9 results in") + league position arrow. This is the daily dashboard for committed users.
- **Lock Screen widgets:** circular flame/ring; inline text "Sprint 9 results waiting."
- **Live Activity (the signature move):** when the user commits a sprint, a Live Activity runs for the "sprint in progress" window until their next eligible session — Dynamic Island shows a tiny sprint progress tick and then **"Results ready" state the next morning**. The cliffhanger literally lives on the Lock Screen. Also used for: community scenario final-day countdown, and league final-3-hours. (Judicious: max 1 concurrent, auto-dismisses, user toggle.)
- **Icon badging:** off by default except streak-at-risk evenings (badge = 1). Red dots erode trust; we spend that budget on exactly one thing.
- **Apple Watch (fast follow, not v1):** 3-card judgment complication session — "one good call from your wrist" — feeds streak Lite credit.

---

## 8. Build Order (what unlocks what)

1. **P0 — the spine:** synced accounts (kills local-only Zustand persistence), 3-act Standup, cliffhanger sim turns w/ save-resume, streak + PTO, Cred + career ladder + promotion ceremony, onboarding flow + hard paywall + day-5 reminder, daily push + small widget. *This alone is a shippable, retaining v1.*
2. **P1 — the game:** placement week + Rating Reveal, ranked cards, leagues, share cards, Live Activity, difficulty modifiers.
3. **P2 — the community:** weekly community scenario + retro, challenge links + web teaser, guilds, peer Design Review, referral program.
4. **P3 — the endgame:** seasons, The Long Game, Watch app, Verified cert pages.

The single highest-leverage insight to protect through all of it: **the sim cliffhanger is the retention engine, the rating is the status engine, and the career fiction is the meaning engine.** Every future feature should be tested against which of the three it feeds; if it feeds none, cut it.
