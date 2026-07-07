# Completeness & Contradiction Audit — Praxis 2.0 Package

**Meta-finding first: the research brief is missing.** The package literally contains `undefined` where the brief should be, yet BUSINESS cites it ("the 42% benchmark you cited") and GAMEDESIGN's north-star metrics presumably derive from it. Every downstream number is currently unverifiable. Fix: attach the brief and re-audit all cited benchmarks against it before any of the four proposals is treated as grounded.

---

## P0 — Contradictions that break the combined product (must arbitrate before any build)

**1. The rating is simultaneously free and paywalled.**
- CURRICULUM: rating earned free via Weekly Gauntlet, placement, first-attempt sims.
- GAMEDESIGN: ranked judgment cards in the *free daily warm-up* move rating; but the paywall feature list sells "ranked mode" as paid.
- BUSINESS: "Never let the rating be earnable free" — rating only via the $149 cert.
These are three mutually exclusive designs of the flagship asset. If the rating is cert-only (BUSINESS), GAMEDESIGN's Rating Reveal on day 5 and the entire ranked-card economy die. If it's free (CURRICULUM/GAMEDESIGN), the $149 "get rated" SKU has no product.
**Fix:** free *provisional* rating (drives the day-5 reveal + LinkedIn envy), paid *verified* rating via cert exam (drives the $149 SKU). CURRICULUM's "Verified mark only attaches to cert-backed ratings" already implies this — make it the explicit ruling and rewrite BUSINESS §1 accordingly.

**2. Two incompatible certification product lines.**
- CURRICULUM: three certs $99/$199/$299, retake $49 + 2-week lockout, 2-year currency, $29 refresh, human grading COGS $25 on PCS.
- BUSINESS: one cert "Praxis Rated" $149, free retake within 90 days, 12-month visibility decay, COGS $3–5 (no human grading).
Price, count, retake policy, currency window, and COGS all conflict. BUSINESS's M6 launch and $33k cert revenue line is modeled on a product CURRICULUM doesn't specify.
**Fix:** ship BUSINESS's single $149 cert first (solo-founder feasible), position CURRICULUM's three-tier ladder as Year 2. Re-run the P&L with one SKU and pick ONE retake/decay policy.

**3. Judgment cards: rated daily (GAMEDESIGN) vs. explicitly never rated when retryable (CURRICULUM).**
CURRICULUM's core integrity rule — "what never feeds it: anything doable with unlimited retries" — is violated by GAMEDESIGN's warm-up cards being "ranked by default" (including a deliberately easy layup, which would inflate everyone's rating). AI-NATIVE adds a third model: revision grades move rating at discounted K, which CURRICULUM also forbids.
**Fix:** adopt CURRICULUM's rule (it's the one defensible to recruiters); GAMEDESIGN's daily cards award Cred only; ranked play happens in the Gauntlet/community scenario.

**4. Three different rating architectures.**
One headline Glicko-2 starting 1000±350 with 4 dimension sub-ratings (CURRICULUM) vs. one 800–2200 display with band skins, seasonal 10% squish toward 1500, no decay (GAMEDESIGN) vs. **twelve** per-competency Elos starting 1200 plus a separate `interview_readiness` (AI-NATIVE). Decay policy conflicts three ways (RD widens at 60 days / "rusty" at 14 days / BUSINESS's 12-month cert decay). Seasonal squish (GAMEDESIGN) directly contradicts "1400 means the same thing in 2027" (CURRICULUM) — you cannot both compress ratings quarterly and sell them as a stable hiring signal.
**Fix:** one canonical spec: headline Glicko-2 + 4 sub-ratings (CURRICULUM's, it's the hiring-credible one); 12 competency ratings become internal scheduler state (AI-NATIVE §5.1 keeps working), never displayed as Elo. Kill the seasonal squish; keep seasons cosmetic.

**5. Pricing/tier chaos: three price books, three free tiers.**
- GAMEDESIGN: $12.99/mo, $79.99/yr, trial on annual only.
- BUSINESS: Core $14.99/$99, Pro $29.99/$199.
- AI-NATIVE: Pro $15, Max $30 — and its **free tier includes the full curriculum**, while BUSINESS's free tier locks everything past Level 1, and GAMEDESIGN's free tier is "daily standup + 1 sim turn/week."
Voice roleplay allowances conflict (BUSINESS Pro: 15/mo; AI-NATIVE: Pro 2/mo, Max 2/day) — and BUSINESS's Pro COGS of $2.40 is arithmetically wrong under its own tier sheet: 15 voice sessions × $0.25–0.35 (AI-NATIVE's costing) is $4–5 before Opus reviews.
**Fix:** one tier sheet owned by BUSINESS, allowances validated against AI-NATIVE's per-feature COGS table. Decide the free-tier philosophy (content-gated vs. AI-metered) — AI-NATIVE's "full curriculum free, meter the AI" and BUSINESS's "Level 1 only" produce completely different funnels and ASO retention.

**6. Entrepreneurs — the segment the founder explicitly asked about — appear in zero proposals.**
Both onboarding quizzes ("break in / get promoted / interview prep / sharpen up"; "Interviewing / New to PM / Leveling up / Exploring") omit founders. Worse, GAMEDESIGN's entire meaning engine — titles, promotions, comp bands, "your cohort" — is an *employment* fantasy that is irrelevant or alienating to a founder building their own product. The zero-to-one track (2 skills) is the only nod.
**Fix:** add a "Founder/Building my own product" quiz path that reskins the fiction (titles → company stages: Garage → Seed → Series A; comp band → valuation/ARR band), leads with the sim + AI-NATIVE's "your real product" personalization (§4.2, which is *perfect* for founders and currently buried), and fast-tracks zero-to-one + monetization tracks. Cheap to do; the fiction layer was designed to be a skin.

**7. Solo-founder scope is 4 uncoordinated roadmaps totaling multiple team-years.**
CURRICULUM needs 36 new skills, 6 new modalities, 40 rubrics, 12 hand-built teardowns, and *explicitly assumes "~2 editors"*. GAMEDESIGN needs a **native iOS app** (Live Activities, Dynamic Island, on-device SFSpeechRecognizer, haptics, Handoff, widgets) — the current stack is a Next.js web app; nobody budgets the platform rewrite or names the framework (Swift? RN? Capacitor gets you none of the signature features). AI-NATIVE adds a realtime voice edge service on Fly.io, Supabase migration, eval harness, and a 13-week plan. BUSINESS puts accounts+sync+RevenueCat+paywall in Month 1. Four "P0"s, no arbiter, and the three build orders (Q1–Q3 / P0–P3 / weeks 1–13 / M1–M12) don't reference each other.
**Fix:** a fifth document — the integrated roadmap — that names the mobile platform, sequences ONE spine (accounts/sync → grading v2 → daily loop → paywall → cert), and explicitly defers: leagues, guilds, seasons, Watch, multi-party meetings, 3-tier certs, teams B2B. Rule of thumb: if two proposals disagree on when something ships, it ships in the later slot or not at all in Year 1.

---

## P1 — Legal/compliance stones unturned (any one can kill the launch or the credential)

**8. EU AI Act / employment-screening exposure — completely unaddressed.**
CURRICULUM's "employer mode" (hiring teams send candidates rated assessments), BUSINESS's "hire from the leaderboard," and AI-NATIVE's recruiter-facing portfolio put Praxis squarely in AI-for-employment-decisions territory — Annex III high-risk under the EU AI Act, and NYC Local Law 144 (bias audits for automated employment decision tools) in the US. An LLM grading humans for hiring, with no bias audit, no adverse-impact analysis, no human-review guarantee, is a regulatory and PR landmine.
**Fix:** geo-fence employer mode away from the EU at launch; commit to a bias audit before any B2B hiring product; add "advisory, not an employment decision tool" framing to portfolio/cert pages; get this into the B2B prerequisites list in BUSINESS §4.

**9. GDPR contradictions built into the architecture.**
(a) AI-NATIVE's server-signed **hash chain** on portfolio artifacts vs. right-to-erasure — immutable verification chains and Article 17 need an explicit design (e.g., store hashes of deleted content, tombstone the artifact). (b) **Keystroke/paste telemetry** (§3.4 process signals) is behavioral monitoring requiring disclosure and a lawful basis; nobody mentions consent UX. (c) BUSINESS's Teams tier exposes individual employees' skill radars to managers — employee-monitoring rules and works-council issues in DACH/FR; needs aggregate-only views or explicit employee consent. (d) No age gate anywhere: a gamified career app will attract students under 16 (GDPR consent age) and possibly under 13 (COPPA); one screen fixes this — it appears in no onboarding flow.
**Fix:** add age gate (16+), a data-processing disclosure step before the editor instruments keystrokes, erasure-compatible verification design, and manager-view consent rules to the Teams prereqs.

**10. "Certification," percentiles, and comp bands are deceptive-claims exposure.**
- GAMEDESIGN shows "top 34% of product operators" at day-5 reveal; CURRICULUM says percentiles only after N>5,000 rated users. At launch N≈hundreds — the percentile is fiction. Direct contradiction AND an FTC-style honesty problem on a product whose entire moat is claimed to be honesty.
- Comp bands in the promotion ceremony ("$142K–$168K — 75th percentile") need a licensed data source (Levels.fyi/Payscale aren't free to republish) and skirt earnings-claims territory if users read them as outcomes.
- "Certification"/"proctored-style"/"exam-grade" language: CURRICULUM at least flags the honesty issue; BUSINESS says "proctored-ish" in marketing. No proposal checks trademark/accreditation-implication risk (e.g., anything resembling "Certified Product Manager" collides with existing cert-mill marks).
**Fix:** percentiles display as "of Praxis users" with N shown, suppressed below N=1,000; comp bands sourced+licensed+labeled "market data, not a promise"; a trademark search on cert names before M6.

**11. App Store rejection risks nobody owns.**
(a) BUSINESS sells the $149 cert as IAP, but GAMEDESIGN's device tiering marks cert exams ❌ on iPhone — purchasable-but-unusable-in-app content invites 4.x review rejection and 1-star reviews. (b) The hard paywall with "tiny link below the fold" plus web link-out strategy assumes the May 2025 Epic injunction holds; there's no fallback if it's narrowed on appeal (BUSINESS's margin math moves ~7 points). (c) Peer Design Review free-text + guild/org names + public handles = UGC, triggering Guideline 1.2 requirements (report/block/moderate) — GAMEDESIGN deferred chat "for moderation cost" but shipped UGC anyway via peer review and org names. (d) Streak Wager (staking earned currency) is probably fine but is exactly the mechanic reviewers slow-lane; have a kill switch.
**Fix:** cert exam gets an iPhone-capable format or IAP purchase is web-only; injunction-reversal contingency in the P&L; minimal UGC moderation (report + profanity filter + human queue) shipped WITH peer review, not after.

**12. Real-company content risk is under-engineered.** Teardowns of Boeing MAX MCAS (deaths), Cambridge Analytica, and a weekly news mode grading live corporate decisions carry defamation/securities-adjacent risk with only "extra review" as mitigation, and no proposal budgets legal review or an insurance line (E&O). BUSINESS's LinkedIn content engine — "AI grades a famous public PRD" — is the same exposure in marketing form.
**Fix:** written editorial policy (public facts only, sourced, no scienter claims), E&O insurance in the opex line, and drop Boeing from the launch 12 — the pedagogy doesn't need a mass-casualty case in a gamified app with a plasma streak flame.

---

## P2 — Cold-start, retention, and economics gaps

**13. Social liquidity math fails against BUSINESS's own funnel.** Leagues of 30 bracketed by rating band, weekly community scenarios ("12,431 PMs"), peer review queues, and guilds all need thousands of DAU. BUSINESS projects ~6,000 installs by M6 → low hundreds of DAU. Day-4 league placement will be a ghost town of 6 people; peer review will starve (no reviewers → no feedback → the feature's promise breaks). No proposal has a bot/backfill/threshold plan.
**Fix:** gate leagues and community scenarios behind a DAU threshold (feature-flag at ~2k DAU); until then, "compete against last week's you" + ghost runs of the challenge-link seeds (the deterministic engine makes ghosts free). Peer review launches only inside guilds/bootcamp cohorts where liquidity is imported.

**14. IRT calibration cold-start.** CURRICULUM requires 200 unrated-shadow exposures per item before rating eligibility and weekly Gauntlet rotation with 3-week retirement. At 300 DAU, a 5-item weekly Gauntlet burns calibrated items far faster than the population can calibrate new ones. The self-calibrating rating doesn't work below a population floor nobody computes.
**Fix:** compute the floor; until then ratings are explicitly "provisional beta," Gauntlet rotates biweekly, and author-priors carry more weight (wider RD).

**15. The wedge and the curriculum roadmap are six months out of sync.** BUSINESS's entire acquisition story (ads, ASO title "PM Interview & Skills," SEO, affiliates) is interview prep, live from M3–M4. CURRICULUM ships the interview track in **Quarter 3**; AI-NATIVE ships voice mocks at week ~12 at the earliest. You'd be buying interview-intent installs into a product with no interview mode. Also: BUSINESS's day-0 magic moment is "a real Sonnet-graded PRD within 20 minutes of install" — on a phone, where GAMEDESIGN bans artifact authoring (handoff-to-iPad only) and instead opens with judgment cards. The two onboarding flows (and the two day-by-day trial scripts, and the two different quizzes) cannot both exist.
**Fix:** either pull a minimal text mock-interview + interview-flavored judgment pack into Q1 to honor the marketing, or launch marketing on the "first app that grades you" angle and hold interview ASO until the track ships. Merge the two onboarding scripts into one owned document; the day-0 graded moment should be GAMEDESIGN's judgment cards (mobile-true) followed by BUSINESS's graded *micro-drill* (one line of text, phone-typeable), not a PRD.

**16. Two competing daily-session brains.** GAMEDESIGN's deterministic 3-act Standup (sim cliffhanger as the retention engine) vs. AI-NATIVE's Mentor morning brief with scheduler-picked slots (mentor memory as the retention moat) vs. CURRICULUM's queue (maintenance reps first, sim not mentioned). Also GAMEDESIGN's "max 1 push/day" vs. AI-NATIVE's brief push + debrief nudges + retro push + review-ready push. Nobody reconciles whose scheduler runs the day or who spends the notification budget.
**Fix:** one scheduler: CURRICULUM's queue priorities inside GAMEDESIGN's 3-act shell, narrated by the Mentor (AI-NATIVE's Haiku wrapper). One push/day, content chosen by priority (cliffhanger > streak > retro).

**17. Trial→paid assumptions diverge 3.5×** — BUSINESS models 42%, GAMEDESIGN's north star is ≥12% (while its own §6.2 funnel says 40%). Break-even moves from M13–15 to beyond M18 across that range; BUSINESS admits 30% pushes break-even to M18 but nobody stress-tests 12%.
**Fix:** re-run the P&L at 15/30/42% and set the go/no-go runway decision points now.

**18. Retention risks glossed:** (a) the sim cliffhanger is single-point-of-failure — users who dislike the sim (or finish scenarios) lose the whole Act-3 hook; no non-sim cliffhanger alternative exists. (b) CURRICULUM's "stale skills queue for refresh" plus GAMEDESIGN's Cred grind plus leagues risks the daily session becoming 100% maintenance by month 4 — nobody models the review-debt curve at 96 skills. (c) The career fiction's failure mode (senior PMs finding fake promotions condescending) is unexamined; there's no "professional mode" toggle that mutes the fiction while keeping the loop — cheap insurance for the exact segment (employed Senior PMs, the Dev persona) whose LinkedIn shares you need.

**19. Missing entirely, package-wide:** Android (even a timeline); internationalization (comp bands, USD pricing, GDPR — yet nothing localizes); accessibility of the app itself (ironic, given `accessibility-nonoptional` is a Level-3 skill); security posture/SOC2 for the M9 Teams tier (they'll ask in the first sales call); offline behavior for AI-graded content on the "subway session" GAMEDESIGN designs for; refund policy; grader-appeal flow economics (BUSINESS's moat §6 cites "user appeals/regrade signals" as a data asset — no proposal designs the appeal feature); and any definition of who arbitrates when these four documents disagree — which, per the above, is constantly.

---

### Top 5 actions in order
1. Rule on the rating (free-provisional / paid-verified split) and rewrite all four proposals' rating sections against one spec (#1, #3, #4).
2. Publish one tier sheet + one cert SKU + one onboarding script; re-run the P&L (#2, #5, #15, #17).
3. Write the integrated Year-1 roadmap that names the mobile platform and cuts the social layer behind a DAU flag (#7, #13).
4. Legal sprint before soft launch: age gate, percentile honesty, comp-band licensing, cert naming search, UGC moderation minimum, EU geo-fence on employer surfaces (#8–#12).
5. Add the founder/entrepreneur onboarding path and a fiction-mute "professional mode" (#6, #18c).
