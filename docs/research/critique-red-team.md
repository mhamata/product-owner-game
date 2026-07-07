# Red-Team Verdict: This Plan Dies of Ambition Before It Dies of Anything Else

The four proposals are individually impressive and collectively lethal. Summed, they describe roughly 3–4 years of work for a 15-person company: 96 skills, 13 modalities, a Glicko rating system, three proctored certifications, a voice pipeline on Fly.io, leagues, guilds, seasons, Live Activities, a psychometric content pipeline, B2B dashboards, and a talent marketplace. The solo founder shipping cadence implied by the business plan (accounts + sync + RevenueCat + quiz funnel in Month 1) is fiction. Worse, the proposals contradict each other on pricing ($12.99 vs $14.99 vs $15/$30), on what feeds the rating (roleplay rated vs explicitly unrated), and on the free tier — meaning nobody has actually made the hard calls yet.

Here are the eight ways it dies, ranked by likelihood.

---

## The Top 8 Failure Modes

### 1. Scope kills momentum before anything is learned (near-certain on current plan)

**Why it kills:** Every proposal names accounts/server-sync as "the one prerequisite," then piles 10+ systems on top. P0 of the game design alone (sync, 3-act sessions, sim save-resume, streaks, career ladder, onboarding, paywall, push, widgets) is 4–6 months solo. You'd spend two quarters building infrastructure and ceremony before a single stranger pays you, and solo founders die of exactly this: 9 months in, no revenue signal, motivation and savings gone. Meanwhile the "AI grades your PM work" window is open to anyone with a weekend.

**Highest-leverage decision:** Kill the iOS app for now. Ship web-first (the codebase is already Next.js on Vercel). This deletes App Store review cycles, IAP integration, widgets, Live Activities, push infrastructure, and the hardest 60% of the game-design doc in one decision, and web checkout keeps 97% of revenue instead of 85%.

### 2. AI grading feels generic and the entire value proposition collapses (high)

**Why it kills:** Every proposal's spine is "the first PM trainer that grades you." But PM judgment grading is exactly where LLMs are weakest-feeling: plausible, rubric-shaped, vaguely encouraging feedback that a mid-level PM reads and thinks "ChatGPT could have told me this." One "this feedback is wrong about my own artifact" moment and trust is unrecoverable — and senior users (the ones with money) are the best at detecting it. Nobody has yet run the experiment the whole business depends on: do experienced PMs rate the grades as *senior-quality*? The business plan buries the calibration study in beta Month 2 as a checkbox. It's the whole company.

**Highest-leverage decision:** Do the calibration study *before* building anything else: 30 real artifacts, graded by 3–5 actual senior PMs and by the grader, measure agreement, iterate the rubric prompts until agreement is publishable. If you can't hit human-panel agreement on 3 artifact types, no amount of streaks, Elo, or voice pipeline saves the product — and you want to know that in week 3, not month 9.

### 3. The daily-habit assumption is false for this audience (high)

**Why it kills:** The entire game-design doc (streaks, PTO days, cliffhanger sim turns, D1 ≥ 55%) transplants Duolingo mechanics onto an audience with the opposite motivational shape. Language learners have diffuse, years-long motivation — perfect for habit scaffolding. PM skill demand is *episodic and deadline-driven*: an interview in 3 weeks, a promotion cycle, a new job's first 90 days. Between episodes, "practice PM daily" competes with an actual PM job that provides real reps all day. The audience is also small: PM interview prep is maybe 100–300k people/year in the US in active-deadline mode. Building a daily-habit engine for an episodic, niche audience means D30 collapses no matter how good the streak design is, and the subscription model quietly becomes a churn machine.

**Highest-leverage decision:** Sell to the deadline, not the habit. Structure the product and pricing around the episode ("6-week interview sprint," "promotion-packet season") with an expensive short-cycle price, and treat any daily engagement as a bonus, not the retention model. Duolingo mechanics get built only if cohort data later shows an actual daily-use population.

### 4. The content treadmill exceeds solo capacity — including the pipeline meant to fix it (high)

**Why it kills:** The curriculum doc waves at "45–60 min of human time per shipped item" but that's *after* building 40 rubrics with graded exemplar anchors, 30 scenario templates, a 10-class defect taxonomy, an adversarial-solve validator, golden-set CI, and IRT shadow-calibration. The pipeline is itself a 3–6 month product, and it presumes "2 editors" that don't exist. The Weekly Gauntlet alone demands a perpetual supply of fresh, calibrated, retiring items. Solo founders on content treadmills stop shipping product to feed the treadmill, then the treadmill stops too.

**Highest-leverage decision:** Cap the curriculum at ~25 skills (Foundations through PM level) and 3 modalities, and refuse the Gauntlet/rotating-item economy entirely until there's revenue to fund an editor. The 96-skill ladder is a Year-3 document; treat it as one.

### 5. The funnel math is fantasy and break-even slides past the runway (high)

**Why it kills:** The Year-1 model stacks best-case numbers: 28,000 organic installs (from one Product Hunt launch, unproven ASO, and a LinkedIn account with no audience), 6.5% install→trial, 42% trial→paid, 9% monthly churn. RevenueCat's own data puts median trial→paid nearer 25–30%, and niche-audience install ramps of 4,500/month organic with zero paid budget are not a plan, they're a wish. The plan's own sensitivity note admits 30% trial→paid pushes break-even to Month 18 — for a solo founder that's the difference between a business and a resignation letter. Every downstream commitment (B2B at M9, certs at M6) is scheduled against revenue that won't exist.

**Highest-leverage decision:** Rebuild the model at half the installs and 25% trial→paid, and price to survive it: the interview-prep buyer comparing against $150/hr human mocks will pay $79–149 for a bounded sprint. Charge more, to fewer, sooner — don't build a $12.99 volume business without volume.

### 6. The Elo/certification never achieves hiring credibility — and drags dev time down with it (medium-high)

**Why it kills:** A rating is a network-effects product: it means nothing at n=500, and employers won't trust it until other employers already do. The proposals themselves admit percentile framing needs n>5,000 and the marketplace needs 5,000 *certified* users. Meanwhile the plan spends enormous engineering on Glicko-2, item-response calibration, anti-cheat, proctoring-lite, verified profile pages — infrastructure for a credibility the product cannot have for 2+ years. And a "PM Elo" that hiring managers ignore is worse than nothing: it makes the product feel like a toy claiming to be a credential.

**Highest-leverage decision:** Descope the living rating to a *static assessment report*: "here is your scored mock-interview/artifact packet, benchmarked against our rubric bands, with the transcripts attached." Inspectable work samples are credible at n=1; an Elo is credible at n=50,000. Build the number only after employers start asking for it.

### 7. The career-fiction gamification reads as cringe to the people with money (medium)

**Why it kills:** "Cred," fake comp bands in promotion ceremonies, "PTO days," Boardroom leagues, plasma flames — designed for the fantasy of career progression, shipped to people living actual careers. The paying segment (interviewing PMs, seniors chasing promotions, managers expensing it) will screenshot the fake "$142K–$168K" promotion packet for the group chat, and not kindly. Duolingo gets away with whimsy because language learning is low-identity-stakes; professional competence is maximum-identity-stakes. One "this app for children thinks it can rate PMs" tweet from a PM influencer poisons the credential ambition (failure mode 6) permanently.

**Highest-leverage decision:** Strip the fiction to the two mechanics with evidence behind them — the spaced-repetition review deck and a simple streak — and keep the tone of a coach, not a theme park. The sim cliffhanger can stay (it's earned, consequence-based tension). The fake salary ceremony must die.

### 8. Distribution never materializes (medium — but fatal when combined with #5)

**Why it kills:** The plan assumes App Store search volume in a category that barely exists ("PM practice" is not "learn Spanish"), a Product Hunt spike, and content engines (LinkedIn 3×/week, TikTok skits, SEO pages, affiliate coaches) that are each a part-time job — all executed by the same person building the product. Solo founders reliably ship the product and starve the distribution. Six months in: great app, 200 installs/month, dead.

**Highest-leverage decision:** Pick exactly one channel and make the product generate it: publicly grading famous PRDs/product decisions and posting the scorecards (LinkedIn + Reddit). It's zero-marginal-cost, it demonstrates the exact value proposition, and it doubles as the grading-credibility proof from failure mode 2. Everything else (TikTok, affiliates, ASO) waits.

---

## The One Sequencing Recommendation

**Riskiest assumption:** *"PMs with a deadline will pay real money for AI grading/roleplay that feels credibly senior."* Not habit, not the rating, not mobile — willingness to pay for grading quality. Everything else is decoration on that bet.

**The 8–12 week MLP: "Praxis Interview Gym" — web only, no iOS, no accounts-sync epic, no Elo, no streaks, no sim changes.**

1. **Weeks 1–3 — calibration first.** Build the golden set: 30 artifacts + 10 mock-interview transcripts, panel-graded by 3–5 senior PMs recruited from r/ProductManagement (pay them). Tune grader prompts to publishable agreement. This is the go/no-go gate for the entire company; if it fails, you've spent 3 weeks, not 9 months.
2. **Weeks 3–8 — the wedge product, three surfaces only:** (a) text mock PM interview (product sense + execution) using the existing roleplay engine, with turn-anchored transcript annotations and a hiring-committee-style scorecard; (b) graded artifact with inline annotations and one revise-and-resubmit loop (PRD + experiment plan + strategy memo — three rubrics, not forty); (c) a final "readiness report" PDF with transcripts attached — the static credential from mitigation 6.
3. **Weeks 8–12 — charge money and run the distribution loop.** Stripe checkout, hard price: **$99 "Interview Sprint" (6 weeks access) or $39/mo**, 3-day trial max. Launch via the public-grading content play on LinkedIn/Reddit plus the beta list. No free tier beyond one sample graded drill.

**Success gates at week 12:** ≥5% of visitors who complete the sample drill pay; ≥40% of payers complete 5+ graded sessions; unsolicited "the feedback felt like a real senior PM" quotes; grader-vs-panel agreement rate you're willing to publish. Hit those, and *then* the mobile app, the review deck, the rating, and the curriculum ladder have something worth building on. Miss them, and you've spent 12 weeks and a few thousand dollars learning the market's answer — which is the cheapest this lesson will ever be.

Everything in the four proposals that isn't in that paragraph is Year 2.
