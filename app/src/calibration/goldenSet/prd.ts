import type { GoldenItem } from '../types';

/**
 * GOLDEN SET — One-page PRD (SYNTHETIC SEED).
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
export const PRD_GOLDEN: GoldenItem[] = [
  {
    "id": "prd-01",
    "artifactSkillId": "prd-artifact",
    "industry": "saas",
    "targetBand": "excellent",
    "submission": "## Problem\nNew workspace admins on Meridian sign up, land on an empty dashboard, and leave. Of the 1,240 admin signups in May, only 19% created a first dashboard within 7 days — and admins who don't reach that step return at 6% in week 2, vs. 61% for those who do. Support logged 43 tickets last quarter tagged \"getting started / where do I begin,\" and in 12 of the 15 new-admin session recordings I watched, the admin opened the empty dashboard page, clicked around for under three minutes, and never connected a data source. The pain is specific: the first session offers no path from \"empty account\" to \"chart my own data.\"\n\n## Proposed solution\nReplace the empty dashboard state with one guided setup flow: a 3-step checklist pinned to dashboard home — (1) connect a data source (surfacing the top 4 connectors, which cover 87% of paid accounts), (2) auto-generate a starter dashboard from that source using our existing template engine, (3) invite one teammate. Until step 1 is done, the page also shows a read-only sample dashboard on demo data, so value is visible before any setup. This is one flow on one page, reusing the existing connector UI and template engine. Dana ballparked comparable checklist work at ~8 engineer-days when we scoped it informally, which fits the two-week window.\n\n## Success metrics\n- Primary: % of new admins who create (or auto-generate) a first dashboard within 7 days of signup — 19% → 30% within six weeks of launch.\n- Guardrail: week-2 return rate for new admin cohorts — 24% → 32%. If checklist completion rises but week-2 return doesn't move, we've built a chore, not an activation path, and we should stop.\n\n## Scope: in and out\nIn for v1: the checklist component, the empty-state sample dashboard, and auto-generated starter dashboards for the top 4 connectors only.\nOut, deliberately: the onboarding email sequence (lifecycle team owns it, and email can't fix an empty first session), role-based personalization of the checklist, the remaining 20+ connectors, and any changes to signup itself — signup conversion is fine; it's what happens after that's broken. If the primary metric moves, connectors 5–8 are the obvious v1.1.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 3,
          "measurable-success": 3,
          "scope-discipline": 3
        },
        "pass": true,
        "notes": "Hits the bar everywhere: quantified problem with a named moment and three evidence sources, one sized change reusing existing systems, an outcome metric plus a guardrail with baselines and targets, and reasoned cuts; total 12, clear pass."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 3,
          "measurable-success": 3,
          "scope-discipline": 3
        },
        "pass": true,
        "notes": "Exemplary: quantified problem with cohort and session-recording evidence, one sizeable flow, baseline-to-target outcome metric with a guardrail and a kill condition, and deliberate cuts with reasons."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-02",
    "artifactSkillId": "prd-artifact",
    "industry": "fintech",
    "targetBand": "solid",
    "submission": "## Problem\nNew Brightside users are dropping off before they ever fund their account. Support says most \"how do I get started\" tickets come from people stuck at bank linking, and sales hears the same thing on onboarding calls. Our funnel shows a drop-off between account creation and first deposit — honestly we haven't segmented it carefully yet, but the working theory is that micro-deposit verification (2–3 business days) kills momentum: people sign up, can't actually do anything with the account, and don't come back.\n\n## Proposed solution\nMake instant bank verification the default linking path, replacing micro-deposits as the primary flow. Concretely:\n- New \"link instantly\" option using Plaid Auth on the existing bank-linking screen (we already use Plaid for balance checks, so the client integration exists)\n- Micro-deposits remain as the fallback for the ~15% of banks Plaid doesn't cover\n- On successful link, land the user directly on the transfer screen with a pre-filled $25 starter amount\n\nOne focused change, and it should fit two weeks: mostly the Auth product flag, two new flow screens, and fallback handling.\n\n## Success metrics\nWe want more new users to actually fund their account in week one. We'll track activation and see if it improves after launch — the number that matters is first deposits going up. We'll also keep an eye on bank-link completion rate as a sanity check.\n\n## Scope: in and out\nIn: the instant verification flow, micro-deposit fallback, and the pre-filled first transfer screen.\nOut for v1: any changes to KYC/identity verification (compliance owns it and it's a different problem), onboarding emails or push reminders, and the \"savings goals\" setup step folks keep asking for — tempting, but it doesn't unblock funding.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 2,
          "solution-specificity": 3,
          "measurable-success": 1,
          "scope-discipline": 2
        },
        "pass": false,
        "notes": "Jagged solid: excellent, sizeable single solution (3) and a clear user/moment with admittedly thin, unsegmented evidence (2), but metrics name no baseline or target — 'see if it improves' — earning a 1, and scope makes real but lightly-argued cuts (2); total 8, narrow fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 2,
          "solution-specificity": 3,
          "measurable-success": 1,
          "scope-discipline": 3
        },
        "pass": true,
        "notes": "Concrete, well-scoped single change with honest evidence gaps, but the metrics section is hand-wavy — 'track activation and see' with no baseline or target keeps it at the bar rather than above it."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-03",
    "artifactSkillId": "prd-artifact",
    "industry": "marketplace",
    "targetBand": "weak",
    "submission": "## Problem\nActivation is low for new buyers on our marketplace. Support and sales keep flagging that people sign up, look around once, and don't come back. We think the first-run experience just isn't engaging enough — new buyers want a smoother onboarding that shows them the value of the marketplace faster. If we don't fix this we're basically wasting the money we spend on acquisition.\n\n## Proposed solution\nImprove the first-week experience for new buyers with a few connected improvements:\n- A welcome tour (3–4 tooltips) highlighting search, saved items, and messaging sellers\n- Personalized picks on the home screen based on categories selected at signup\n- A 10% first-purchase discount code shown at the end of the tour\n- A reminder email on day 3 if they haven't purchased yet\n\nTogether these should make the first week feel much more engaging and give buyers a real reason to come back.\n\n## Success metrics\n- More signups completing the welcome tour (target: 70%+)\n- An increase in overall engagement in week one (sessions, page views)\n- Hopefully an improvement in first purchases too — we can measure this after launch\n\n## Scope: in and out\nIn: the four items above.\nOut: redesigning search results, native app onboarding (web only for now), and loyalty points — we discussed points but it's too big for two weeks and probably its own project anyway.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 1,
          "solution-specificity": 1,
          "measurable-success": 1,
          "scope-discipline": 2
        },
        "pass": false,
        "notes": "Earnest but misses: the problem restates the brief with 'buyers want smoother onboarding' framing and zero evidence (1), the solution is a four-item laundry list despite the one-change instruction (1), metrics lead with tour completion and vague 'engagement' while the real outcome is an unmeasured afterthought (1), yet scope makes a genuine cut with a reason (2); total 5, fails."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 1,
          "solution-specificity": 1,
          "measurable-success": 1,
          "scope-discipline": 2
        },
        "pass": false,
        "notes": "'Users want smoother onboarding' framing with no data, a four-item laundry list instead of one change, and mostly output/vanity metrics ('hopefully' first purchases); only the explicit cuts show some judgment."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-04",
    "artifactSkillId": "prd-artifact",
    "industry": "consumer",
    "targetBand": "poor",
    "submission": "## Problem\nOur onboarding experience is not engaging enough for new members. In today's competitive consumer landscape, users expect a seamless, delightful experience from day one, and right now we're not delivering that wow factor. This is hurting our growth.\n\n## Proposed solution\nRevamp the entire first-week journey to be more modern and engaging. We'll refresh the onboarding screens with better visuals, add gamification elements to encourage exploration, personalize the experience using AI, and streamline the signup flow. The overall goal is to optimize the experience so members immediately understand our value proposition.\n\n## Success metrics\nSuccess looks like higher engagement and better retention. We should also see an increase in app store ratings and more social shares as members fall in love with the new experience.\n\n## Scope: in and out\nEverything described above is in scope for the first version. We can iterate and add more delight features later based on member feedback.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 1,
          "solution-specificity": 0,
          "measurable-success": 1,
          "scope-discipline": 0
        },
        "pass": false,
        "notes": "Empty-calorie but earnest: a generic 'not engaging enough' problem with no user, moment, or evidence (1), a revamp/refresh/optimize wish-list nobody could size (0), directional buzzwords plus vanity metrics with no targets (1), and a scope section that explicitly commits to everything (0); total 2, clear fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 0,
          "solution-specificity": 0,
          "measurable-success": 0,
          "scope-discipline": 0
        },
        "pass": false,
        "notes": "Pure buzzword padding: no user, no evidence, 'revamp everything' with vague verbs, vanity metrics (ratings, social shares), and an explicit refusal to cut anything."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-05",
    "artifactSkillId": "prd-artifact",
    "industry": "healthcare",
    "targetBand": "solid",
    "submission": "## Problem\nNew patients create a CareLoop account right after booking their first appointment — usually from the confirmation email — and then don't come back until, sometimes, the day of the visit. In June, 68% of new patient accounts had exactly one session in their first week. The moment of pain is concrete: a patient books, taps \"set up your patient portal,\" and lands on a home screen with no appointment details, no forms, and a \"no records yet\" message. They reasonably conclude there's nothing here for them. Our care coordinators confirm this on calls — I sat in on eight last month, and in five of them the coordinator ended up reading intake instructions over the phone that the portal was supposed to deliver. Front-desk staff then re-collect insurance and history on paper at the visit, which is the downstream cost of that empty first session.\n\n## Proposed solution\nMake the first-week portal experience revolve around the upcoming appointment. When a new patient logs in before their first visit, the home screen becomes an appointment-prep view: date, time, location, and provider name pulled from the scheduling system, plus a short task list — complete intake forms, upload an insurance card photo, add the visit to their calendar. We'd also send one reminder notification 48 hours before the visit if forms aren't done. The intake forms already exist in our intake tool, so the build is the new home-screen view, the scheduling-system pull, and the reminder.\n\n## Success metrics\n- % of new patients who complete intake forms in the portal before their first visit: currently 22%, target 45% within two months of launch. This is the outcome that matters — it means the first session gave the patient something worth doing.\n- Portal logins per new patient in week one, which we'd expect to roughly double.\n\n## Scope: in and out\nIn for v1: the pre-visit home screen, the intake task list, insurance card upload, and the single 48-hour reminder.\nOut: secure messaging with the care team and test-results display — both are real patient asks, but each is bigger than two weeks (messaging needs clinical-response staffing, results need a compliance review). Also out: any changes for returning patients; this is strictly the pre-first-visit window. If the timeline slips, the reminder is the piece we'd drop to v1.1.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 2,
          "measurable-success": 2,
          "scope-discipline": 2
        },
        "pass": true,
        "notes": "Strong-problem solid: excellent problem framing with a quantified moment and firsthand evidence (3); the solution is concrete but bundles a notification and hand-waves the scheduling-system integration (2); metrics pair one genuine outcome with baseline and target against a usage-count metric (2); scope makes explicit reasoned cuts without going further (2); total 9, narrow pass."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 3,
          "measurable-success": 3,
          "scope-discipline": 3
        },
        "pass": true,
        "notes": "Vivid, evidenced moment of pain (empty portal, 68% single-session, coordinator calls), one focused pre-visit view an engineer can size, a 22%-to-45% outcome target, and principled cuts with a named drop-first item."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-06",
    "artifactSkillId": "prd-artifact",
    "industry": "marketplace",
    "targetBand": "excellent",
    "submission": "## Problem\nNew buyers on our secondhand home-goods marketplace sign up, scroll a generic trending feed once, and leave. Of the 4,100 buyers who signed up in May, 62% ran zero searches after their first session and 71% never returned in week 1 (Amplitude funnel, pulled 6/24). Support has tagged 31 tickets in the last 60 days as \"can't find anything relevant,\" and sales hears the same on onboarding calls. The painful moment is minute one: the homepage shows whatever is trending network-wide — mostly categories the new buyer doesn't care about — so they leave with no reason to believe we stock their thing. This is a relevance problem, not a tutorial problem.\n\n## Proposed solution\nOne change: capture buying intent at signup and use it to seed the first feed.\n- After account creation, one mandatory screen: \"What are you shopping for?\" — pick 1–3 of our top 12 category chips (optional free-text field, stored but unused in v1).\n- For the buyer's first 14 days, the homepage feed boosts listings from their picked categories using the existing category-boost parameter in the ranking service. No new ML, no new feed infra.\n- Picks are stored on the profile so lifecycle emails can use them later (the emails themselves are not in this build).\nEng shape: one onboarding screen (web + mobile web), one profile field, one ranking-parameter change, experiment wiring. Lead eng has looked at this and agrees it fits in two weeks.\n\n## Success metrics\n- Primary: % of new buyers who watch, save, or message a seller about at least one listing within 7 days of signup — currently 19%, target 26% for the test cohort. This is our strongest leading indicator of first purchase.\n- Guardrail: signup completion must not drop more than 2 points, since we are adding a mandatory step.\n\n## Scope: in and out\nIn v1: the intent screen, the 14-day category boost, a 50/50 A/B test on new signups.\nDeliberately out: native apps (web is 70% of new signups — we validate there first), personalized email and push (needs lifecycle infra we don't have), free-text-to-category mapping (chips only), and any seller-side changes. If the test wins, intent-driven email is the obvious next slice.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 3,
          "measurable-success": 3,
          "scope-discipline": 3
        },
        "pass": true,
        "notes": "Uniformly strong (12/12): specific cohort evidence and a named pain moment, one engineer-sizeable change with explicit eng shape, an outcome metric with baseline/target plus a guardrail, and reasoned cuts with a stated next slice."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 3,
          "measurable-success": 3,
          "scope-discipline": 3
        },
        "pass": true,
        "notes": "Sharp diagnosis ('a relevance problem, not a tutorial problem') backed by funnel data, one eng-verified change reusing existing infra, a baselined outcome metric plus a guardrail, and disciplined deliberate cuts."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-07",
    "artifactSkillId": "prd-artifact",
    "industry": "healthcare",
    "targetBand": "solid",
    "submission": "## Problem\nOur patients mostly arrive because a clinician recommended the app for managing type 2 diabetes between visits. They sign up, land on a dashboard that says \"No data yet,\" and get asked to complete a 23-field health profile before anything works. In the Q2 cohort, 71% of new patients never finished that profile, and only 18% opened the app again within 7 days (Mixpanel). Support logged 44 tickets last quarter that boil down to \"I signed up but I don't know what to do next.\" The moment of pain is the first five minutes: we ask a newly diagnosed, often anxious patient to do paperwork before we show them any value.\n\n## Proposed solution\nCut the intake down to a minimum viable profile so patients reach something useful in their first session. Concretely: reduce the mandatory signup intake from 23 fields to the 4 we actually need on day one (name, date of birth, diagnosis type, medication yes/no), and unlock the glucose logging screen immediately after. The remaining 19 fields move to contextual prompts — for example, we only ask for insurance details when the patient tries to message a coach. We'd probably also want a small progress indicator so patients know what's left, and possibly a reminder notification if the profile stalls, though that may be a stretch for this sprint.\n\n## Success metrics\nWe'll track profile completion rate (which should go up once it's only 4 fields) and how many patients log at least one glucose reading in their first session. Longer term we'd hope week-1 return rate improves too. I don't have a firm target yet — I'd want a baseline week first — but directionally all three should rise.\n\n## Scope: in and out\nIn: the 4-field intake, immediate unlock of glucose logging, the contextual prompt for insurance fields.\nOut for v1: reminder push notifications (needs notification infra we don't have), any changes to the clinician-facing portal, and redesigning the dashboard itself. Compliance review of the shortened intake is already booked for next week, so it shouldn't block the sprint.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 2,
          "measurable-success": 1,
          "scope-discipline": 2
        },
        "pass": false,
        "notes": "Jagged solid (8/12): excellent problem framing with real evidence, a mostly concrete solution slightly muddied by 'probably also want' creep, clean cuts — but metrics are the soft spot (output metric first, no targets, explicitly deferred), so it narrowly fails."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 3,
          "measurable-success": 2,
          "scope-discipline": 3
        },
        "pass": true,
        "notes": "Strong evidenced problem and a concrete 23-to-4-field intake cut with clean scope calls; loses points only for naming good outcome metrics with direction but deferring all targets to a baseline week."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-08",
    "artifactSkillId": "prd-artifact",
    "industry": "saas",
    "targetBand": "weak",
    "submission": "## Problem\nNew admins aren't activating. They sign up for a trial, click around for a few minutes, and most never come back — support and sales both flag this constantly. Honestly the issue is that we don't give them any onboarding: there's no product tour, no checklist, no sample data, so the workspace is just empty and confusing. Admins want guidance and right now we give them a blank screen.\n\n## Proposed solution\nBuild a proper onboarding experience for new admins:\n- Interactive product tour highlighting the 5 core features\n- A getting-started checklist in the sidebar (create a project, invite a teammate, connect an integration, etc.)\n- Pre-populated sample project so the workspace isn't empty\n- Contextual tooltips on the main dashboard\n- A welcome email sequence to pull people back in\nTogether these should make the first week way less confusing and improve activation across the board.\n\n## Success metrics\nActivation rate should go up. We'll also track how many admins complete the tour, checklist completion, and NPS from the in-app survey. More signups converting to paid would be the ultimate sign this worked.\n\n## Scope: in and out\nIn v1 (the two-week sprint): the product tour and the getting-started checklist only.\nOut for now: the sample project, tooltips, and the welcome email sequence — those are v2 once we see how the tour performs. Mobile is also out; this is desktop web only.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 1,
          "solution-specificity": 1,
          "measurable-success": 1,
          "scope-discipline": 2
        },
        "pass": false,
        "notes": "Weak with one bright spot (5/12): solution-first 'admins want guidance' framing with no numbers, a five-item laundry list, and 'should go up' metrics padded with tour completions and NPS — but the scope section makes a genuine explicit cut, earning its lone 2."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 1,
          "solution-specificity": 2,
          "measurable-success": 1,
          "scope-discipline": 2
        },
        "pass": false,
        "notes": "Solution-shaped problem statement ('the issue is we don't give them onboarding') with zero data, a five-item wishlist only rescued by the v1 narrowing to tour plus checklist, and untargeted output-heavy metrics."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-09",
    "artifactSkillId": "prd-artifact",
    "industry": "fintech",
    "targetBand": "weak",
    "submission": "## Problem\nNew account holders clear KYC and then stall. Funnel data from March–May: 58% of users who pass identity verification never fund their account. Support's most common new-user contact is some version of \"I got approved — now what?\" The drop happens right after approval, when we land people on the main dashboard with a $0 balance and no direction.\n\n## Proposed solution\nStreamline the funding experience so new users get money in faster. We should make the bank-linking flow smoother, reduce friction in the Plaid connection step, improve the copy on the funding screen so the next step is obvious, and generally optimize the approval-to-funded path. Faster funding = activated users.\n\n## Success metrics\nThe number to move is funded accounts — more users funding, and funding sooner after KYC approval. We'd also expect app store ratings to improve as the experience gets less confusing.\n\n## Scope: in and out\nV1 covers the approval-to-funding path end to end. Nothing major is out of scope — this flow is the whole product for a new user, so we should get all of it right. Some visual polish can slip if the two weeks get tight.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 2,
          "solution-specificity": 1,
          "measurable-success": 1,
          "scope-discipline": 1
        },
        "pass": false,
        "notes": "Jagged weak (5/12): a genuinely solid problem statement with a funnel stat and pain moment, then it collapses — 'streamline/smoother/optimize' with no single concrete change, an outcome metric with direction but no target plus app-rating vanity, and an explicit refusal to cut anything real."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 3,
          "solution-specificity": 1,
          "measurable-success": 1,
          "scope-discipline": 0
        },
        "pass": false,
        "notes": "Crisp, evidenced problem (58% post-KYC never fund) squandered on 'streamline/smooth/optimize' vagueness an engineer cannot size, no targets, and 'nothing major is out of scope' — the opposite of a cut."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "prd-10",
    "artifactSkillId": "prd-artifact",
    "industry": "consumer",
    "targetBand": "poor",
    "submission": "## Problem\nActivation is low and users aren't sticking around. Studies show most apps lose the majority of new users in the first week, so this is a common problem. Basically users want a better onboarding experience and right now ours isn't exciting enough to bring them back.\n\n## Proposed solution\nRevamp the first-run experience to wow new members from day one. Ideas: a fresh set of welcome screens, a short personality quiz, gamified streaks to build habit, and possibly AI-powered recommendations so the feed feels personal. The overall vibe should be fun and modern.\n\n## Success metrics\nSuccess looks like happier members and more buzz — better engagement across the board. We can keep an eye on downloads and app store ratings.\n\n## Scope: in and out\nMost of the above is doable in v1 and we can iterate from there. Out of scope for now: Android tablet support.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "problem-clarity": 0,
          "solution-specificity": 1,
          "measurable-success": 0,
          "scope-discipline": 1
        },
        "pass": false,
        "notes": "Poor (2/12): pure 'users want X' framing with a generic industry stat as evidence, a vibes-driven idea list, no real metric (downloads and ratings, no targets), and a token non-sequitur cut while committing to 'most of the above' in v1."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "problem-clarity": 0,
          "solution-specificity": 1,
          "measurable-success": 0,
          "scope-discipline": 1
        },
        "pass": false,
        "notes": "Generic 'studies show' problem with the forbidden 'users want better onboarding' framing, a 'possibly'-hedged idea list, buzz-and-downloads vanity metrics, and a token Android-tablet cut that defers nothing real."
      }
    ],
    "provenance": "synthetic-seed"
  }
];
