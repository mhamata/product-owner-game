import type { GoldenItem } from '../types';

/**
 * GOLDEN SET — Product strategy memo (SYNTHETIC SEED).
 *
 * GENERATED content: authored by model agents at controlled quality bands and
 * blind re-scored by an independent model rater. Two synthetic raters per item
 * ('seed-author', 'seed-blind') make the whole agreement pipeline runnable —
 * but this is a dress rehearsal, not evidence. The Phase-0 go/no-go requires
 * replacing/augmenting these scores with paid senior-PM panel scores and
 * flipping provenance to 'panel' (see docs/calibration/panel-guide.md).
 *
 * Do not hand-edit submissions: reference scores were assigned to THIS text.
 */
export const MEMO_GOLDEN: GoldenItem[] = [
  {
    "id": "memo-01",
    "artifactSkillId": "strategy-memo",
    "industry": "marketplace",
    "targetBand": "excellent",
    "submission": "Team,\n\nBlunt version first: we didn't stall because the rental market cooled. We stalled because we stopped being the best at anything.\n\nTwo years ago we won because our camera-gear depth was unmatched — a working photographer in Austin could find the exact lens she needed within 10 miles, same day. Since then we've launched six adjacent categories (drones, audio, lighting, event furniture, camping, power tools) plus a dozen half-built bets, and supply depth in the category that made us has quietly eroded: active pro lenders in camera/audio are down 18% year over year. Meanwhile GearFlow raised their Series B and put all of it into exactly two categories. Our win/loss notes from the last 30 lost head-to-heads say the same thing over and over: \"the item I needed wasn't available nearby.\" That is not a marketing problem or a pricing problem. It's a liquidity problem, and liquidity is won per-category, per-metro. We are trying to win it in six categories and 40 metros with a team sized for two and ten.\n\nSo, for the next two quarters: we are a camera and audio gear marketplace for working creatives in our top eight metros. That is the whole strategy.\n\nWhat we are explicitly not doing: we sunset event furniture, camping, and power tools (2% of GMV combined, roughly 30% of support tickets). We pause the ads product and the international waitlist. Drones and lighting go into maintenance mode — zero new investment until Q1.\n\nFour moves, all pointed at liquidity:\n1. Supply win-back — a dedicated pod re-onboards the ~400 lapsed pro lenders in the eight metros, backed by a 90-day earnings guarantee.\n2. Instant-book with real-time availability on our top 500 SKUs. This attacks the #1 loss reason directly.\n3. Poach GearFlow's top 50 lenders in our two strongest metros: white-glove onboarding plus a reduced take rate for six months.\n4. Redeploy the five engineers freed up by the sunsets onto search relevance and availability accuracy — nothing else.\n\nThe bet underneath all of this: depth beats breadth. A renter who finds the exact item nearby converts and returns at rates that compound faster than anything a seventh category would add. The risk is that I'm wrong about the cause — if the plateau is demand-side saturation rather than supply erosion, we'll fix availability and nothing will move. The tell: if fill rate in the eight metros clears 85% by end of Q3 and repeat GMV is still flat, this strategy is wrong, and we should say so out loud rather than push harder.\n\n— Dana",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 3,
          "clear-choice": 3,
          "coherent-actions": 3,
          "named-bet": 3
        },
        "pass": true,
        "notes": "Top anchor: evidence-backed root cause (supply liquidity erosion from over-expansion), a genuinely narrow where-to-play with named sunsets, four actions that all serve liquidity, and a bet with an explicit falsification signal — earns 3s across the board (12/12)."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 3,
          "clear-choice": 3,
          "coherent-actions": 3,
          "named-bet": 3
        },
        "pass": true,
        "notes": "Evidence-backed liquidity diagnosis, a genuinely narrow choice with named sunsets, four actions all pointed at the same bet, and a falsifiable tripwire — exemplary."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-02",
    "artifactSkillId": "strategy-memo",
    "industry": "healthcare",
    "targetBand": "solid",
    "submission": "Hi Priya,\n\nHere's my read on where we are and what I think we should do about it.\n\nDiagnosis first, because I think we've been misreading the plateau. It isn't that the market slowed — care-navigation budgets grew roughly 20% last year. The real problem is that we've been trying to sell one product to two completely different buyers. Health systems want deep EHR integration, referral-leakage analytics, and support through a 9-month enterprise cycle. Self-insured employers want fast deployment, engagement dashboards, and benefits-broker relationships. Every roadmap fight we've had this year was those two buyers pulling in opposite directions, and the result is a product that's mediocre for both. Wellfound sells to employers only, and that's exactly why they've beaten us in the last four head-to-head deals — their demo, pricing, and onboarding are all tuned for one buyer. We don't lose because their product is better. We lose because ours is unfocused.\n\nThe choice I'm recommending: for the next two quarters we build for mid-size health systems (2–10 hospitals) and specialty clinic networks, full stop. We deprioritize the employer channel — no new employer-facing features, and sales stops pursuing new employer logos. We'll keep supporting the eleven employer accounts we have, and honestly we can revisit that channel in 2027 if the health-system push works, but new investment goes to one buyer.\n\nConcretely:\n- Ship the Epic and Cerner integration work that's been stuck at 60% for two quarters. It is the #1 blocker cited in lost health-system deals.\n- Rebuild pricing and packaging around per-facility contracts instead of per-employee.\n- Retrain the sales team on clinical workflows and hire one clinical solutions lead.\n- Finish the patient mobile app redesign — it serves both segments and it's already half done, so we should land it.\n\nThe main assumption here is that the health-system market is big enough to restart growth on its own. The risk is mostly execution and timing — integrations are hard, and two quarters is tight.\n\nHappy to walk through the numbers behind any of this.\n— Marcus",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 3,
          "clear-choice": 2,
          "coherent-actions": 2,
          "named-bet": 1
        },
        "pass": false,
        "notes": "Jagged profile: the two-buyer diagnosis is genuinely insightful (3), the choice is real but hedged with a revisit clause (2), actions mostly reinforce except the sunk-cost mobile-app redesign bolted on (2), and the bet/risk collapses into generic 'execution and timing' with no sense of how the strategy breaks (1) — total 8, narrow fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 3,
          "clear-choice": 3,
          "coherent-actions": 2,
          "named-bet": 2
        },
        "pass": true,
        "notes": "Sharp two-buyers-one-product diagnosis and a real commitment to health systems with the employer channel dropped, but the 'serves both segments' mobile app is a sunk-cost bolt-on and the risk section is thin execution boilerplate."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-03",
    "artifactSkillId": "strategy-memo",
    "industry": "fintech",
    "targetBand": "weak",
    "submission": "Strategy memo — next two quarters\n\nWhere we are: growth has been flat for about three quarters now. Our main competitor (better funded than us) keeps winning deals head-to-head, and honestly the team is stretched thin — we have something like 12 projects in flight and most are under 50% done. Churn has also ticked up, and app store reviews keep mentioning that the app feels cluttered.\n\nI think the core issue is that we need to get back to growth by improving the product experience and re-engaging our existing users, while also making sure new users understand our value faster.\n\nWhere we should play: I believe we should focus on our core budgeting users — they're our biggest segment and the most loyal. At the same time we shouldn't ignore acquisition, since flat growth is partly a top-of-funnel problem, and credit builder is still a big opportunity we've already invested a lot in, so I don't think we should walk away from it. If anything I'd put slightly less emphasis on the crypto tab for now.\n\nPlan for the next two quarters:\n- Revamp onboarding so new users connect a bank account in their first session (today ~40% never do)\n- Weekly spending digest notifications to bring users back into the app\n- Simplify the home screen to address the clutter feedback\n- Launch the referral program (it's built, just needs QA)\n\nRisks: the competitor could outspend us on marketing no matter what we do, and there's always execution risk with this many workstreams. But I think if we execute well on the above, we can get growth moving again.\n\nOverall I feel it comes down to focus and execution.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 1,
          "clear-choice": 1,
          "coherent-actions": 2,
          "named-bet": 1
        },
        "pass": false,
        "notes": "Earnest but under the bar: the 'core issue' paragraph just restates the symptoms in a circle (1), the 'focus' claim keeps acquisition, credit builder, and only 'slightly less' crypto so nothing is really dropped (1), the four actions do hang together around activation/engagement and are the one bright spot (2), and risks are generic outspend/execution boilerplate (1) — total 5, fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 1,
          "clear-choice": 1,
          "coherent-actions": 1,
          "named-bet": 1
        },
        "pass": false,
        "notes": "Diagnosis restates symptoms, then hedges every direction (keep acquisition, keep credit builder, 'slightly less' crypto) — no real trade-off, generic risks, actions scattered across funnels."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-04",
    "artifactSkillId": "strategy-memo",
    "industry": "saas",
    "targetBand": "poor",
    "submission": "Product Strategy Memo — H2\n\nTeam, as we head into the second half of the year I want to align everyone around our strategic priorities. The last two quarters have been challenging: growth has flattened and the competitive landscape has intensified, with our main competitor winning several recent evaluations. The market is evolving quickly and we need to evolve with it.\n\nOur strategy is to double down on what makes us great while closing the gaps that are holding us back. We will strengthen our enterprise offering, continue improving the SMB experience, and accelerate our self-serve motion so that no segment is left behind. We should also keep pushing on AI features, since every competitor is investing there and we can't afford to fall behind.\n\nKey initiatives for the next two quarters:\n- Improve overall product quality and performance\n- Ship the AI assistant beta\n- Revamp the website and messaging\n- Deepen integrations with the tools our customers already use\n- Explore pricing and packaging updates\n- Continue the mobile app effort\n\nIf we execute with urgency and stay customer-obsessed, I'm confident we will return to growth. The opportunity in front of us is bigger than ever, and this team has what it takes to capture it.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 1,
          "clear-choice": 0,
          "coherent-actions": 1,
          "named-bet": 0
        },
        "pass": false,
        "notes": "Empty-calorie strategy: the diagnosis renames the symptoms with a nod to competition (1), 'no segment left behind' is the textbook everything-strategy with zero trade-offs (0), the six initiatives are a wish list reinforcing no particular bet (1), and there is no assumption or risk anywhere, just confidence (0) — total 2, clear fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 0,
          "clear-choice": 0,
          "coherent-actions": 0,
          "named-bet": 0
        },
        "pass": false,
        "notes": "'No segment left behind' plus a six-item laundry list is precisely the win-everywhere failure mode; no cause identified, nothing dropped, no assumption or risk named."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-05",
    "artifactSkillId": "strategy-memo",
    "industry": "consumer",
    "targetBand": "solid",
    "submission": "Strategy memo — Q3/Q4\n\nShort version: we stop trying to be a fitness app for everyone and become the best app for people who run at least three times a week. Everything else gets cut or paused.\n\nWhy. Growth has been flat for three quarters and PulseFit is out-raising and out-shipping us. But when I segment retention, one group looks nothing like the rest: users who log 3+ runs in week one retain at 41% at day 90, versus 9% overall, and they drive nearly all our subscription revenue. Casual users churn no matter what we ship for them — we tried four re-engagement features this year and D30 didn't move. I won't pretend I fully understand why casuals bounce (some of it is onboarding, some of it is that they were never really our users), but the pattern is clear enough to act on.\n\nThe choice: serious runners are our where-to-play. Concretely, that means we kill things — not pause, kill:\n- The social feed. Eighteen months in, under 6% weekly usage. Gone.\n- The nutrition-tracking beta. It's a different product for a different user.\n- Paid acquisition against 'general fitness' audiences. That budget moves to running communities, race sponsorships, and club partnerships.\n\nWhat we build instead, in order:\n1. Training plans that adapt to an actual race goal — the #1 request from our retained cohort for two years running\n2. Watch app parity. Serious runners live on their wrists, and this is PulseFit's biggest edge over us\n3. Race-day mode and club leaderboards, because runners recruit runners\n4. Finish the sleep-tracking integration — it's 80% done and it'd be a shame to throw that work away\n\nThe bet is that depth of love beats breadth of installs — that serious runners recruit other runners through their clubs faster than paid ever brought us casuals. The risk: we shrink the funnel and just end up a smaller flat business. I think the math works, but I'll admit the word-of-mouth coefficient is a guess.\n\n— Jules",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 2,
          "clear-choice": 3,
          "coherent-actions": 2,
          "named-bet": 2
        },
        "pass": true,
        "notes": "Jagged profile with courage as the strength: the choice kills three things by name and redirects spend (3); the diagnosis is solid segmentation but admits it doesn't fully explain why casuals churn and treats the competitor thinly (2); actions reinforce the bet except the sunk-cost sleep-tracking item bolted on (2); the bet and risk are named honestly but with no leading indicator or kill criterion (2) — total 9, passes."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 3,
          "clear-choice": 3,
          "coherent-actions": 2,
          "named-bet": 3
        },
        "pass": true,
        "notes": "Retention-cohort diagnosis with honest uncertainty, real kills (feed, nutrition, paid casual acquisition), and a candidly stated bet with its weak point admitted; the '80% done, shame to waste it' sleep integration is the one sunk-cost blemish."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-06",
    "artifactSkillId": "strategy-memo",
    "industry": "healthcare",
    "targetBand": "excellent",
    "submission": "To: Priya (VP Product)\nRe: Where we play for the next two quarters\n\nThe short version: we win mid-size specialty clinics on workflow depth and implementation speed, and we stop competing for enterprise health systems. Everything below follows from that.\n\nWhy we plateaued. It's not Meridian's funding and it's not the market. Two years ago we grew because our prior-auth workflow was 10x better than fax-and-phone for specialty clinics. Then we chased breadth: a telehealth module, patient billing, a payer analytics dashboard — twelve bets, none finished, none differentiated. Meridian didn't beat us; we vacated the position that was winning. The numbers say the same thing: our win rate against Meridian in 100+ provider deals is 18%; in sub-30-provider specialty deals it's 61%. Clinics that use prior-auth heavily renew at 94%; everyone else at 71%. We don't have a growth problem, we have a focus problem wearing a growth costume.\n\nThe choice. Where we play: specialty clinics (ortho, cardiology, GI), 5–30 providers. How we win: prior-auth and referral workflow depth, plus a 2-week implementation Meridian can't match at their price point. Where we don't play — and I want to be blunt here:\n- No enterprise. We decline RFPs above 100 providers for the next two quarters, including the two in pipeline now. Painful, but an 18% win rate means we're subsidizing Meridian's sales training.\n- Telehealth module and patient billing: parked. Code archived, zero maintenance allocation.\n- Payer analytics dashboard: killed. Only 7 accounts use it; we migrate them off by end of Q3.\n\nActions.\n1. Take prior-auth auto-approval from ~40% to 70% for our three verticals. This gets the majority of eng.\n2. Cut implementation from 6 weeks to 2 — slow go-live is the #1 stated reason for early churn in our onboarding survey.\n3. Ship the clinic-to-clinic referral loop, the one feature we have with a real network effect.\n4. Re-cut sales territories and comp around sub-30-provider specialty deals; retire the enterprise pipeline targets so nobody is paid to ignore this memo.\n\nThe bet, and where it breaks. The bet is that specialty clinics buy depth and time-to-value, not platform breadth — and that the segment (~22k US clinics) is big enough to double ARR. The main risk: Meridian launches a stripped-down mid-market tier and brand-plus-breadth beats our depth even downmarket. Tripwire: if our specialty win rate drops below 50% for a full quarter, or Meridian announces a mid-market SKU, we revisit — most likely by accelerating the referral network as a moat rather than re-broadening the product.\n\nI know parking telehealth will annoy the two customers who asked for it. That's the cost of having a strategy.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 3,
          "clear-choice": 3,
          "coherent-actions": 3,
          "named-bet": 3
        },
        "pass": true,
        "notes": "Genuinely strong across the board: evidence-backed diagnosis of lost focus (win-rate and renewal splits), an explicit segment choice with named kills including declining live RFPs, four actions that all reinforce the bet, and an assumption/risk/tripwire stated honestly — 12/12, clear pass."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 3,
          "clear-choice": 3,
          "coherent-actions": 3,
          "named-bet": 3
        },
        "pass": true,
        "notes": "Win-rate and renewal data expose the vacated position, enterprise RFPs are explicitly declined including pipeline, actions extend to sales comp so incentives match the memo, and the bet has a concrete tripwire — best of the set alongside memo-01."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-07",
    "artifactSkillId": "strategy-memo",
    "industry": "consumer",
    "targetBand": "solid",
    "submission": "Strategy memo — next two quarters (Loop)\n\nHonest starting point: our growth didn't stall because acquisition dried up — installs are basically flat but healthy. The problem is retention. D30 is sitting at 11%, casual users churn fast, and the people who actually stick around are the streak-and-accountability crowd. Meanwhile Habitat keeps out-shipping us on social/community stuff and we keep half-copying them — the feed, the creator marketplace, avatars — so we're spread across a dozen half-built things with a team of 14.\n\nSo, the choice: we stop trying to be a social app. Habitat has 4x our funding and social is a winner-take-most game we're losing. We go all-in on being the best tool for committed habit-builders: streaks, accountability groups, and the coach check-in loop.\n\nWhat we're dropping (actually dropping, not \"deprioritizing\"):\n- The social feed — killed, sunset in Q3\n- Creator marketplace — paused indefinitely, zero eng allocation\n- Avatars/cosmetics — killed\n\nWhat we're doing:\n- Rebuild streak mechanics + add streak insurance (top power-user request three quarters running)\n- Accountability groups v2: matching, group streaks, dropout-rescue nudges\n- Weekly coach check-in summary — the feature our retained users mention most\n- Also want to do a brand refresh and a TikTok creator push in Q4 to reposition us around \"serious habit people\" — feels like the right moment for it\n\nRisk: obviously there's a chance this doesn't work and the committed-user niche turns out too small to grow in. But I'd rather own a niche than lose the mainstream.\n\n— J.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 2,
          "clear-choice": 3,
          "coherent-actions": 2,
          "named-bet": 1
        },
        "pass": false,
        "notes": "Jagged solid profile: the choice is the standout (explicit kills, refuses the social race — 3), the diagnosis is directionally right but partly asserted rather than evidenced (2), the brand-refresh/TikTok push reads bolted onto an otherwise coherent action set (2), and the risk paragraph is a throwaway with no stated assumption (1) — 8/12, narrow fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 3,
          "clear-choice": 3,
          "coherent-actions": 2,
          "named-bet": 2
        },
        "pass": true,
        "notes": "Clear retention-not-acquisition diagnosis and genuine kills of the social bets, but the tacked-on brand refresh/TikTok push reads as a pet project and the risk paragraph is honest but shallow, with the key assumption left implicit."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-08",
    "artifactSkillId": "strategy-memo",
    "industry": "saas",
    "targetBand": "weak",
    "submission": "Subject: Product Strategy — H2\n\nTeam,\n\nWe've had an incredible two years of growth, and it's natural that things level off as the market matures. That said, we're facing real headwinds: growth is flat, Cascade is winning head-to-head deals against us, and — candidly — we have too many things in flight. By my count we have 12 active initiatives across 9 engineers, and very few of them have shipped in a complete state. I think this is a big part of why we feel stuck.\n\nGoing forward, I believe we need to focus on our core strengths and double down on customer value. My proposed strategy for the next two quarters:\n\n1. Improve the core product experience — polish, performance, and quality across the board.\n2. Strengthen enterprise readiness (SSO, audit logs, granular permissions), since that's where Cascade beats us most often.\n3. Improve self-serve onboarding to reduce time-to-value for smaller customers.\n4. Explore AI capabilities — every competitor is adding AI and we can't be left behind.\n5. Revisit pricing and packaging.\n6. Better sales enablement and competitive battlecards.\n\nI know this looks like a lot, but I believe these all ladder up to the same goal: a stronger, more competitive product. If we execute well on these fronts we should see growth re-accelerate by Q4.\n\nThe main risk is execution — we need to stay disciplined and not spread ourselves too thin, which has admittedly been our pattern. We should also keep an eye on Cascade's roadmap.\n\nHappy to discuss priorities at staff meeting — I'm open to cutting one or two of these if the team feels strongly.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 2,
          "clear-choice": 1,
          "coherent-actions": 1,
          "named-bet": 1
        },
        "pass": false,
        "notes": "Earnest miss: the diagnosis honestly names lack of focus as the cause (12 initiatives, 9 engineers — 2), but the 'strategy' keeps enterprise AND self-serve AND AI with nothing dropped (1), the six actions are a laundry list pulling in opposite directions (1), and 'the main risk is execution' is a generic non-bet (1) — 5/12, fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 2,
          "clear-choice": 1,
          "coherent-actions": 1,
          "named-bet": 1
        },
        "pass": false,
        "notes": "Correctly names the too-many-initiatives problem, then reproduces it: six workstreams spanning enterprise, self-serve, AI, and pricing with nothing cut and the trade-off deferred to a staff meeting; risk section admits the pattern without breaking it."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-09",
    "artifactSkillId": "strategy-memo",
    "industry": "marketplace",
    "targetBand": "weak",
    "submission": "STRATEGY MEMO — Q3/Q4\n\nWhere we are: growth flat for three quarters. Parcel raised a $90M Series C and is outspending us on both sides of the marketplace. Frankly the space has gotten a lot more crowded and paid channels have gotten expensive — CAC is up something like 40% — so it's not shocking that growth slowed. We also haven't had a big feature launch in a while, which hasn't helped.\n\nThe play: I'm confident the answer is supply density. We win where we have deep supply, period. So for the next two quarters we concentrate on our top 5 metros and turn them into fortress markets.\n\nPlan:\n- Supply incentives + white-glove seller onboarding in the top 5 metros\n- Launch a buyer referral program (two-sided credits) to juice demand nationally\n- Loyalty points pilot — I've wanted this for a while and I think it's a differentiator nobody else in the category has\n- Finish the AI pricing-suggestion tool we started in Q1 (it's 70% done, shame to waste it)\n\nThe other cities keep running as-is — we're not pulling out of anywhere, just not adding fuel. On the rest of the 12 initiatives, we can revisit after we see Q3 numbers; I don't think we need to formally kill anything yet.\n\nRisk: Parcel could just outspend us in those 5 metros too. But if we move fast I like our chances.\n\nLet's go.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 1,
          "clear-choice": 2,
          "coherent-actions": 1,
          "named-bet": 1
        },
        "pass": false,
        "notes": "Jagged weak profile: there is a real where-to-play instinct (top-5-metro supply density — 2) but it's undercut by refusing to kill anything, the diagnosis blames the market and CAC rather than finding the underlying cause (1), the actions contradict the metro-supply focus (national demand referral, pet loyalty pilot, sunk-cost AI tool — 1), and the risk line is superficial with no named assumption (1) — 5/12, fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 1,
          "clear-choice": 1,
          "coherent-actions": 1,
          "named-bet": 1
        },
        "pass": false,
        "notes": "Blames the market and CAC rather than any internal cause, names a fortress-metro play but refuses to kill anything ('revisit after Q3'), and the actions include a national referral program, an admitted pet loyalty pilot, and a sunk-cost AI tool that undercut the metro focus."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "memo-10",
    "artifactSkillId": "strategy-memo",
    "industry": "fintech",
    "targetBand": "poor",
    "submission": "Strategy Memo\n\nHi team, here are my thoughts on strategy for the next two quarters.\n\nThe last two years were amazing, but growth has flattened out and the fintech space is more competitive than ever. Novapay has more funding, but I truly believe we have the better product and the better team.\n\nMy view is that we need to be laser-focused on our customers and get back into growth mode. Priorities:\n\n- Keep improving the app experience\n- Ship features that users love\n- Increase marketing to get the word out\n- Look into partnerships and new revenue streams\n- Stay ahead on AI\n\nAt the end of the day, if we build a great product and stay customer-obsessed, growth will take care of itself. We have a huge opportunity in front of us — let's execute and win!\n\nHappy to go deeper on any of this.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "diagnosis": 0,
          "clear-choice": 0,
          "coherent-actions": 1,
          "named-bet": 0
        },
        "pass": false,
        "notes": "Empty-calorie but earnest: the diagnosis just restates flat growth and a competitive market (0), 'laser-focused on customers' commits to nothing and drops nothing (0), the priorities are a generic wish list that at least exists as a list (1), and there is no bet or risk anywhere (0) — 1/12, clear fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "diagnosis": 0,
          "clear-choice": 0,
          "coherent-actions": 0,
          "named-bet": 0
        },
        "pass": false,
        "notes": "Pure motivational padding — no diagnosis beyond 'growth flattened', no choice, five interchangeable bullet platitudes, and no assumption or risk of any kind."
      }
    ],
    "provenance": "synthetic-seed"
  }
];
