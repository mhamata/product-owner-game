# Praxis 2.0 — Business Model & Go-To-Market Proposal
*Mobile-first, AI-graded PM trainer. Solo founder. Subscription-led with a certification wedge.*

---

## 0. Positioning First (everything else hangs off this)

**Wedge message: "Reps, not videos."** The interview-prep Trojan horse is the acquisition story; career-long training is the retention story. Concretely:

- **Acquisition framing (what the ad/ASO/App Store screenshot says):** *"Pass your PM interview by doing the job, not watching it. AI-graded PRDs, stakeholder roleplay, real scoring."* Interview-prep is the only PM-training moment with urgency, budget, and a deadline — it's where Exponent built a business. You win the install there.
- **Retention framing (what the product says after week 2):** *"The PM gym."* A mastery score across 12 competencies, a Leitner judgment deck, specialization tracks. The person who came for the Meta PM loop stays because they now have a rating they want to defend and raise.
- **The brand-level line:** **"The first PM trainer that grades you."** Nobody else can honestly say this. Exponent shows you videos of other people answering. Praxis scores *your* answer.

---

## 1. Tier Architecture

### Design principles
1. **Free tier = the loop, not the depth.** Users must *feel* AI grading before they'll pay for it. Free is generous on cheap/deterministic content, stingy on expensive AI.
2. **Meter the AI, don't hide it.** Allowances, not walls. "You've used your 3 graded artifacts this week" converts better than never showing the feature.
3. **Premium = a different model tier and a different modality**, not just "more." Voice + Opus-graded senior review must feel like hiring a coach, not raising a quota.

### The tiers

| Feature | **Free** | **Core — $14.99/mo, $99/yr** | **Praxis Pro — $29.99/mo, $199/yr** |
|---|---|---|---|
| Skill map access | Level 1 (Foundations) + first skill of Level 2 | All 6 levels | All 6 levels |
| Lessons & drills (deterministic/Haiku-graded) | Unlimited within unlocked levels | Unlimited | Unlimited |
| Judgment deck (spaced repetition) | 10 cards/day | Unlimited | Unlimited |
| **AI artifact grading** (Sonnet) | 1/week (+3 signup credits) | **30/month** | Unlimited |
| **Stakeholder roleplay** (text) | 1 full session (taste) | 20 sessions/month | Unlimited |
| **Voice roleplay** (speech-to-speech stakeholder pressure) | — | — | ✅ 15 sessions/month |
| **Senior Review** (Opus, line-by-line memo-grade feedback with rewrite suggestions) | — | 2/month | **15/month** |
| Decision simulation (capstone) | Demo scenario | 2 full runs/month | Unlimited |
| Specialization tracks (7 tracks) | Locked | Unlocked at Senior cert (matches current product logic) | Unlocked immediately + track-specific scenarios |
| Interview mode (company-flavored scenario packs: Meta/Google/Stripe-style loops) | — | Generic loop | ✅ Company packs, timed mock loops |
| Competency matrix | Preview (blurred percentiles) | Full | Full + percentile vs. cohort |
| Certification discount | — | $50 off | **1 certification credit/year included** |

**Why this split works:** Core is priced against Duolingo Super/Max territory ($12.99–$29.99) and captures the "I'm leveling up" user. Pro is priced against *one hour of a human PM coach* ($100–200) and captures the "I have an interview in 4 weeks" user. Voice roleplay is the Pro hero feature — practicing a hostile VP conversation *out loud* is the closest thing to a real interview that exists in an app, and it's genuinely hard to copy well.

**Annual anchoring:** $99/yr Core = 45% off monthly (industry-standard 40–50% annual discount). Default the paywall toggle to annual. Pro annual at $199 = "less than one session with a human coach, for a year."

### Certification: one-time purchase, coexists with subscriptions

**"Praxis Rated" — $149 one-time** (test at $99/$149/$199; I'd start at $149):

- Adaptive test-out: timed artifact writing + live roleplay defense + judgment gauntlet, graded by Opus with a published rubric.
- Output: a **numeric rating (like a chess Elo) + competency radar + shareable verified link** (praxis.app/r/mike-h) suitable for LinkedIn.
- Includes one retake within 90 days (kills purchase anxiety).
- Rating **decays visibility** after 12 months ("Rated 2024" vs "Rated 2026") → natural re-certification revenue.

**Coexistence rules (important):**
- Certification is purchasable **without any subscription** — it's a standalone SKU and a top-of-funnel product in its own right ("get rated" is shareable; "I subscribed to an app" is not).
- Subscribers get discounts (Core: $50 off; Pro: one credit/yr) so certification *reinforces* rather than cannibalizes the subscription.
- **Sell it on web** ($149 via Stripe, keep ~$144) and in-app at $149 IAP where required. The cert page is your best web-checkout asset because people arrive at it from LinkedIn, not from the app.
- Never let the rating be *earnable* free — credibility requires the assessment be controlled, proctored-ish (timed, fresh scenarios per attempt, anti-paste detection), and scarce.

---

## 2. Paywall & Conversion Design

### The flow (onboarding-quiz → plan → hard paywall)

This is the RevenueCat/Blinkist/Fitness-app playbook, adapted:

1. **Quiz (7 screens, ~60 seconds, no signup required):**
   - "What's your situation?" → *Interviewing soon / New to PM / Leveling up / Exploring PM* ← **this answer segments every downstream message**
   - Target role/level (APM → VP)
   - Home industry (SaaS/Fintech/Marketplace/Consumer/Healthcare — already in product)
   - Self-rated weak spots (pick 3 of the 12 competencies)
   - Time budget (10/20/30 min/day)
   - If "interviewing": company type + interview date ← **creates the deadline that powers everything**
2. **Commitment moment:** one *free graded micro-drill* inside onboarding ("Write a one-line problem statement for this scenario") → instant Haiku-graded score. This is the magic-moment before the paywall — they've now *been graded* once. Costs you ~$0.001.
3. **Personalized plan screen:** "Your path to **Senior PM readiness: 11 weeks**, 20 min/day. Week 1: Prioritization under constraint…" with their competency radar showing the 3 self-rated gaps. Loading animation ("Building your plan…") — the labor illusion measurably lifts conversion.
4. **Hard paywall with trial:** "Start your 7-day free trial" — annual pre-selected, monthly available, tiny "continue with limited version" link at the bottom (soft-hard hybrid: you keep the free tier for virality and ASO retention metrics, but 90%+ of onboarding traffic sees the paywall as the default path).

**Trial: 7 days, Core tier features + 3 Pro tastes** (one voice roleplay, one Senior Review, one company pack scenario). The 42% trial→paid benchmark you cited holds for 7+ day trials with hard paywalls; a 7-day trial also fits the "I have an interview soon" urgency better than 14.

### Day-by-day trial choreography

| Day | Tactic |
|---|---|
| **Day 0** | Immediately route into first graded artifact (not a lesson). Goal: one *real* Sonnet-graded PRD score within 20 minutes of install. Push notification opt-in framed as "Get your grade when it's ready." |
| **Day 1** | Judgment deck introduced — first Leitner cards due. Habit hook. |
| **Day 2** | Pro taste #1: prompt one **voice roleplay** ("Defend your Day-0 PRD to a skeptical eng lead — out loud"). This is the single biggest Pro-upsell moment. |
| **Day 3** | Progress email/notification: competency radar delta since Day 0. "Your Execution score moved from 34 → 41." |
| **Day 5** | **Trial-ending sequence:** notification + in-app sheet showing everything they'd lose (their radar, their streak, their deck of 23 due cards, their 4 graded artifacts). Loss framing beats feature framing. Offer annual with "lock in $99 (you'll pay $180 on monthly)." |
| **Day 6** | Last-chance: if no conversion signal, surface **downgrade-save**: "Not ready? Keep Core monthly" or a 30% intro offer on annual (IAP intro pricing / Stripe coupon). |
| **Day 7+ (lapsed)** | Win-back ladder: Day 3 post-lapse — 40% off first 3 months. Day 14 — free Senior Review of one artifact ("see what you're missing"). Day 30 — annual at $69 (30% off) one-time offer. Interview-date users get a special: 7 days before their stated interview date, "Interview week unlock: 50% off one month of Pro." That last one converts absurdly well because the deadline does the selling. |

### Web checkout strategy (US link-out)

Post-*Epic v. Apple* injunction (May 2025), US apps can link out to web checkout with **0% Apple commission**. Play it like this:

- **In-app paywall stays IAP-first** for frictionless conversion (Face ID beats a Stripe form; a 15% fee on a conversion that happens beats 0% on one that doesn't). You're under $1M revenue → Small Business Program → **15%, not 30%**.
- **Add a web link-out option on the US paywall** for the *annual* plans only: "Save with web checkout — $99/yr" (same price, you keep ~$93 vs ~$84). Annual buyers are considered purchasers; the form friction hurts less.
- **All email/LinkedIn/content traffic → web checkout by default.** Your win-back emails, cert landing page, and B2B pages never touch Apple. Realistic steady state: ~35–45% of revenue via web within 12 months (RevenueCat's web-billing cohort data suggests this is achievable when you control the email channel).
- Use **RevenueCat** from day one to unify IAP + Stripe entitlements, run paywall A/B tests, and get cohort LTV without building billing infra. Non-negotiable for a solo founder.

---

## 3. Launch Sequence — First 1,000 Users (Solo Founder)

### Phase 0 (Months 1–2): Private beta — 150 users
- Recruit from **r/ProductManagement** (1M+ members): don't post an ad; post the *artifact*. "I built an AI that grades PRDs against a senior-PM rubric — here's what it said about a famous public PRD" is content, not spam. Offer 50 beta slots in comments.
- **Lenny's community + PM Slack groups** (Product School Slack, Mind the Product): same play — give away 10 free "Senior Reviews" of members' real PRDs (anonymized) in exchange for feedback calls.
- Goal: 150 TestFlight users, 20 user interviews, calibrate grading against 3–5 real senior PMs' judgments (this calibration is moat — see §6), and instrument the quiz→paywall funnel.

### Phase 1 (Month 3): App Store soft launch
- Ship with paywall live but no marketing push. Watch install→trial and trial→paid for 3–4 weeks on organic + beta word-of-mouth.
- **ASO from day one** — this category has real search volume and weak competition:
  - Title: `Praxis: PM Interview & Skills`
  - Subtitle: `Product Manager Practice Gym`
  - Keyword field: `product manager interview, PM practice, PRD, product management course, case interview, APM`
  - Screenshots lead with the *grade*, not the map: a scored PRD with red-ink feedback is the thumb-stopper.
- Collect 50+ ratings from beta users in week one (rating prompts after a good grade, never after a bad one).

### Phase 2 (Month 4): Product Hunt + content ignition
- **Product Hunt launch** with the cert angle: "Praxis — the first app that gives you a PM Elo rating." Ratings/leaderboards are PH-native catnip. Realistic outcome: 500–1,500 installs, backlinks, and B2B inbound (PH is where your future team-plan buyers browse).
- Simultaneously start the **two content engines** you'll run all year:
  1. **LinkedIn (yours):** 3×/week. Format that works: "I had AI grade [famous product decision / public PRD / a viral PM take] against a senior rubric. Here's the scorecard." Screenshots of the actual grading output. This is zero-marginal-cost content because the product *generates* it.
  2. **TikTok/Reels/Shorts:** voice-roleplay clips. "POV: you tell the VP of Sales the feature is cut" — screen-record the AI stakeholder pushing back, show a human squirming. PM-career TikTok (Diary of a PM-style accounts) is an underpriced channel; also pitch 5–10 mid-size PM influencers (20k–100k followers) with **affiliate links (30% of first year via web checkout)** rather than flat fees you can't afford.

### Phase 3 (Months 5–6): Partnerships & the interview-prep Trojan horse
- **Interview-prep affiliates:** career coaches, resume reviewers, "break into PM" newsletter writers. Give them 30% recurring (web checkout makes this possible; you can't affiliate IAP). Ten coaches sending 10 signups/month each is a real channel.
- **Exponent-adjacent, not Exponent-competing content:** SEO pages "Meta PM interview questions — practice with AI grading," "PRD examples graded." These are long-tail queries Exponent ranks for with static content; you win with *interactive* content (embedded free graded drill on the web page → app install).
- **University/bootcamp seeding (free):** give Product School/Reforge-adjacent bootcamps and 5 university product clubs free Core for a cohort. This is B2B pipeline (§4), testimonial farming, and leaderboard liquidity.

### The 1,000-user math
| Channel | Installs by Month 6 |
|---|---|
| Beta + word of mouth | 400 |
| Product Hunt | 1,000 |
| Reddit/community content | 1,500 |
| ASO organic | 1,200 (growing 20%/mo once ratings >100) |
| LinkedIn/TikTok | 1,500 |
| Affiliates | 400 |
| **Total installs** | **~6,000** → at 6.5% trial, 42% trial→paid ≈ **160 paying subscribers by Month 6** — on track for the Year-1 model below. First 1,000 *users* (installs) happens in Month 4; first 1,000 *payers* is a Month 14–16 event, and that's fine. |

---

## 4. B2B Second Act — Sequencing & Prerequisites

**Rule: do not touch B2B until consumer PMF signals exist** (trial→paid ≥ 35%, month-3 subscriber retention ≥ 55%, NPS from the "leveling up" segment ≥ 40). B2B for a solo founder is a sales-time black hole if the product isn't pulling.

**Act 2a — Teams (Month 9+): $25/seat/mo, 5-seat minimum, annual only.**
- Buyer: Director/VP of Product at 20–200-person companies who currently spends $2k/head on Reforge and can't tell if anyone learned anything. Your pitch is the **competency matrix as a management tool**: "See your team's actual skill radar, assign tracks, watch scores move."
- Prereqs: SSO-lite (Google OAuth), an admin dashboard (read-only v1), centralized billing via Stripe. Note: current architecture is local-Zustand/no-accounts — **accounts + sync are the real prerequisite** and belong on the roadmap by Month 6 anyway (multi-device is a consumer retention feature too).
- Sales motion: 100% inbound + your LinkedIn. Every "my manager expensed it" consumer receipt is a lead.

**Act 2b — University & bootcamp licensing (Month 12+): $2,500–$5,000 per cohort/semester** (≈$50–80/student, they mark it into tuition).
- Bootcamps' dirty secret is they can't assess outcomes; your rating *is* an outcomes metric they can put in marketing. Prereqs: cohort admin view, CSV export, the certification product proven at consumer level.

**Act 2c — "Hire from the leaderboard" talent marketplace (Month 18–24, likely post-first-hire).**
- Prereqs are steep and honest: **≥5,000 certified users**, rating credibility (at least anecdotal "we hired a Praxis-2100 and they were great" stories), and anti-gaming maturity. Model: employers pay $500–1,000 per intro or a $10k/yr sourcing seat; candidates always free.
- This is the endgame moat (ratings become valuable because hiring happens against them → people must maintain ratings → recurring cert revenue) but it is a *different business*. Sequence it last; announce it early (the leaderboard existing at all makes the consumer rating feel consequential).

---

## 5. Unit Economics — Year-1 P&L Sketch

### Assumptions (defensible, slightly conservative)
- Installs ramp: 500/mo (M3) → 4,500/mo (M12); **Year-1 total ≈ 28,000 installs**
- Install → trial: **6.5%** | Trial → paid: **42%** → net install→paid ≈ 2.7%
- Mix: 70% Core / 30% Pro; 55% annual / 45% monthly
- Monthly-plan churn 9%/mo; annual month-12 renewal 40% (edu-app norms)
- Blended gross ARPU ≈ **$12.10/mo** (annuals amortized: Core $8.25, Pro $16.58; monthlies $14.99/$29.99)
- Store/processor fees: blended **13%** (15% Apple SBP on ~60% of revenue, ~3% Stripe on ~40%)
- **AI cost per subscriber/month** with model tiering:
  - Free user: ~$0.03 (Haiku drills + 1 Sonnet grade/wk cap)
  - Core: **~$0.65** (30 Sonnet gradings ≈ $0.45 + roleplay ≈ $0.15 + 2 Opus reviews ≈ $0.05 — most users use ~40% of allowance)
  - Pro: **~$2.40** (voice pipeline + Opus senior reviews dominate)
  - Blended paid: **~$1.20/sub/mo**; certification COGS ≈ $3–5/attempt (Opus-graded, multi-part)
- **API spend caps (already partially built — keep them):** per-user token caps, per-tier monthly allowances enforced server-side, and a **global daily ceiling set at 8% of trailing-30-day revenue** with automatic degradation to Haiku (never a hard outage) if breached. Budget alarm at $500/day.

### Year-1 monthly trajectory (paying subscribers, end of month)

| M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | M11 | M12 |
|---|---|---|---|---|---|---|---|---|---|
| 15 | 55 | 105 | 160 | 230 | 310 | 400 | 500 | 610 | **730** |

### Year-1 P&L

| Line | Amount |
|---|---|
| Subscription gross revenue (ramping to ~$8.8k MRR at M12) | **$52,000** |
| Certification (≈220 sold × $149, mostly H2) | **$33,000** |
| **Gross revenue** | **$85,000** |
| Store/processor fees (~13% blended) | –$11,000 |
| AI/API costs (free + paid + cert grading) | –$7,500 |
| Infra (Vercel, RevenueCat, Supabase/db, analytics) | –$3,600 |
| Tools/ASO/misc + small paid-test budget | –$5,000 |
| **Net contribution (pre-founder-salary)** | **≈ $58,000** |

**Gross margin on subscription revenue ≈ 84%** after fees and AI — model tiering is what keeps it there. The "AI apps have bad margins" fear is false at these prices: $1.20 COGS on $12.10 ARPU is a 90% AI-line margin.

### Break-even
- Solo-founder survival line at **$8k/mo personal + $1.5k/mo opex** ⇒ need ≈ **$11k MRR gross** ⇒ **≈ 900 blended subscribers** (or ~750 subs + 25 certs/mo). On this trajectory that's **Month 13–15**. Ramen-profitable ($5k/mo) at ~500 subs, Month 10–11.
- Sensitivity worth knowing: trial→paid at 30% instead of 42% pushes break-even to Month 18 — which is why the Day-5 loss-framing sequence and win-back ladder are not optional polish; they're the business.

---

## 6. Moat — Why Doesn't X Just Copy This?

**The honest answer first:** the *features* are copyable; the **calibration, credibility, and content spine** are not quickly copyable. Build accordingly.

| Would-be copier | Why they don't win |
|---|---|
| **Exponent** | Their DNA and margin structure is video courses + human mock-interview marketplace. AI grading *cannibalizes their coaching take rate* — the innovator's dilemma is real. They'll bolt on an AI grader eventually; it will be a feature on a course site, not a daily-rep mobile loop with spaced repetition and mastery progression. Different animal. |
| **Duolingo** | PM training is a rounding error against language/math/music TAM; their engine needs mass-market CEFR-style content. If they ever enter "career skills," it validates the category and you're the acquisition target, which is a fine outcome. |
| **Sandbox4PM / small PM-sim tools** | No mobile habit loop, no rating system, no distribution. You out-execute on the compounding loops below. |
| **A GPT wrapper someone builds this weekend** | Can prompt "grade my PRD," yes. Cannot replicate the four compounding assets: |

**What compounds:**
1. **Rubric calibration data.** Every grading you ship, plus beta calibration against real senior PMs, plus user appeals/regrade signals, becomes an eval set that makes *your* grader measurably better than a raw prompt. Publish grader-vs-human-panel agreement rates — turn the black box into a credential.
2. **Rating credibility (the real prize).** An Elo is worthless until people it labeled "senior" perform like seniors. Every cohort, every bootcamp partner, every "hired from the leaderboard" story compounds trust that no fast-follower can shortcut. Chess ratings weren't the best algorithm; they were the *agreed-upon* one.
3. **The scenario engine + 12-competency spine.** Industry-reskinnable scenarios across 6 levels × 7 specialization tracks is a multi-year content asset; each new track raises the copy cost and widens the "career-long" retention surface.
4. **Community/leaderboard liquidity.** Ratings create comparison; comparison creates community; community creates the talent marketplace, which creates the reason ratings matter. That loop, once spinning, is the durable business — the app is the front door.

---

## 7. Month-by-Month Year-1 Plan (condensed)

| Month | Focus | Key deliverables / targets |
|---|---|---|
| **M1** | Beta build | Accounts + sync (kills local-only state), RevenueCat integration, quiz→plan→paywall flow; recruit 50 beta users via r/ProductManagement |
| **M2** | Beta calibrate | 150 beta users; grader calibrated vs. 3–5 senior PMs; 20 interviews; funnel instrumented (PostHog) |
| **M3** | Soft launch | App Store live, ASO set, 50+ ratings, watch funnel; target 500 installs, 15 payers |
| **M4** | Product Hunt | PH launch + LinkedIn/TikTok engines start; 1,800 installs, 55 payers cumulative |
| **M5** | Conversion tuning | A/B paywall (annual anchor, Day-5 sequence), win-back ladder live; ship voice roleplay to Pro; 105 payers |
| **M6** | Certification launch | "Praxis Rated" $149 on web + IAP; cert landing page; LinkedIn shareable ratings; 160 payers, first 20 certs |
| **M7** | Affiliates | 10 coach/newsletter affiliates at 30% via web checkout; interview-date win-back offer live; 230 payers |
| **M8** | SEO + content depth | Interactive graded-drill web pages targeting "PM interview questions" queries; second specialization track content push; 310 payers |
| **M9** | Teams v1 | Admin read-only dashboard, Google SSO, $25/seat annual; sell to inbound only; 400 payers + 2–3 team pilots |
| **M10** | Retention sprint | Month-3 cohort retention work: streak repair, deck notifications, monthly "rating movement" reports; 500 payers |
| **M11** | Bootcamp pilots | 2 paid cohort licenses ($2.5k each); publish grader-agreement transparency report; 610 payers |
| **M12** | Consolidate | Annual-renewal flow for M3 cohort, pricing test ($14.99 vs $16.99 Core), Year-2 plan (marketplace prerequisites); **730 payers, ~$8.8k MRR + certs ≈ $12k total monthly revenue run-rate** |

**Year-1 exit state:** ~$85k revenue booked, ~$12k/mo run-rate, 84% gross margins, break-even in sight at M13–15, two B2B motions seeded, and the only AI PM grader anyone has heard of — with a rating people have started putting on LinkedIn. That last sentence is the company.
