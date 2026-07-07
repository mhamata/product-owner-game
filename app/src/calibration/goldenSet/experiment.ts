import type { GoldenItem } from '../types';

/**
 * GOLDEN SET — Experiment plan (SYNTHETIC SEED).
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
export const EXPERIMENT_GOLDEN: GoldenItem[] = [
  {
    "id": "exp-01",
    "artifactSkillId": "experiment-plan",
    "industry": "fintech",
    "targetBand": "excellent",
    "submission": "## Hypothesis\nMaking the step-3 profile fields (employment status, income range, source of funds) optional will increase full sign-up flow completion by at least 3pp absolute (from 61% to 64%+), because step 3 is our single largest drop-off point (38% of abandons happen there) and exit surveys rank \"too many questions\" as the #1 reason for quitting. If completion doesn't move by at least that much, the friction story is wrong and we should stop blaming the form.\n\n## Primary metric\nSign-up flow completion rate: % of users who start step 1 and reach the \"account created\" screen, measured per assigned user. One metric, and it's the one that settles the decision. I deliberately did NOT pick step-3 completion — of course step 3 gets easier when we remove its required fields; that would be grading our own homework. Whole-flow completion is what the hypothesis actually claims will improve.\n\n## Guardrail metrics\n1. Funded-account rate within 14 days of sign-up. If optional fields let in accounts that never fund, the completion lift is hollow. Must not drop more than 1pp absolute.\n2. KYC failure + manual-review rate. We pre-fill parts of identity verification from these fields today, so deferring them may just push abandonment (and ops cost) downstream into KYC. Watching this catches a local win that quietly breaks something later.\n\n## Design and decision rule\n- Variants: control = current required fields; treatment = identical step 3 with all three fields marked optional and a visible \"Skip for now\" action.\n- Exposure: 50/50 random assignment at first entry to the flow, all new web + iOS sign-up starts (~9,000/week).\n- Duration: minimum 14 days, fixed in advance. Our data partner sized this at roughly two weeks to detect a 3pp change at 80% power. No readouts before day 14 — we have burned ourselves peeking before, and I'd rather wait than rationalize a lucky Tuesday.\n- Decision rule, committed now: SHIP if completion is up ≥3pp at 95% confidence AND both guardrails hold. KILL if completion is flat/negative, or if funded-account rate drops >1pp regardless of the lift. ITERATE (try deferring fields to a post-signup prompt instead of making them optional) if completion improves but KYC review rate degrades.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 3,
          "single-primary-metric": 3,
          "guardrails": 3,
          "decision-rule": 3
        },
        "pass": true,
        "notes": "Uniformly excellent: quantified falsifiable hypothesis with explicit kill condition, one primary metric with anti-gaming rationale, two mechanism-backed guardrails with a threshold, and a fully pre-committed ship/kill/iterate rule including power awareness and an explicit no-peeking commitment."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 3,
          "single-primary-metric": 3,
          "guardrails": 3,
          "decision-rule": 3
        },
        "pass": true,
        "notes": "Exemplary: quantified falsifiable hypothesis, one deliberately chosen whole-funnel metric, two mechanism-backed guardrails, and a powered, pre-committed ship/kill/iterate rule with an explicit no-peeking window."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-02",
    "artifactSkillId": "experiment-plan",
    "industry": "saas",
    "targetBand": "solid",
    "submission": "## Hypothesis\nIf we make the step-3 profile fields (company size, role, use case) optional, sign-up completion for new admins will go up by roughly 4pp (baseline is 52%), because 31% of our funnel drop-off happens on that exact step and session recordings show admins stalling on those fields specifically. If completion doesn't move, friction wasn't the real problem and we've disproven the idea.\n\n## Primary metric\nOverall sign-up completion rate: started step 1 → workspace created. Just this one. It's the metric the hypothesis makes a claim about, and it's what we'd actually make the call on. Activation was tempting as a co-primary but I'm not doing that — one decision metric, everything else is context.\n\n## Guardrail metrics\nHonestly less sure here — probably churn? Or maybe support tickets? We should keep an eye on whether accounts created without profile info stick around. Will ask the data partner what we can realistically pull.\n\n## Design and decision rule\n- A/B test, 50/50: control = required fields, treatment = same fields but optional with a skip link.\n- Exposure: all new admin sign-ups on web, ~1,200/week. Run 3 weeks so we have enough data — data partner to confirm the exact number, but we don't call it before the 3 weeks are up even if week 1 looks great.\n- Rule (setting it now so we don't argue later): ship if completion is up at least 2pp and it's statistically significant; if it's flat, negative, or below that, we don't ship.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 3,
          "single-primary-metric": 3,
          "guardrails": 1,
          "decision-rule": 2
        },
        "pass": true,
        "notes": "Jagged profile: quantified falsifiable hypothesis and a disciplined single primary metric earn 3s, but the guardrail section is a vague hedge with no committed metric or mechanism (1), and the decision rule is pre-committed with no-peek awareness but binary and thinner than the rest (2); total 9, narrow pass."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 3,
          "single-primary-metric": 3,
          "guardrails": 1,
          "decision-rule": 3
        },
        "pass": true,
        "notes": "Crisp evidence-backed hypothesis, disciplined single metric, and a fixed 3-week pre-committed 2pp ship threshold; only the guardrail section is hand-wavy ('probably churn? maybe support tickets?')."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-03",
    "artifactSkillId": "experiment-plan",
    "industry": "consumer",
    "targetBand": "weak",
    "submission": "## Hypothesis\nMaking the extra profile questions on step 3 optional will make sign-up feel way less annoying, so more people will finish signing up and we'll grow membership faster. Basically less friction = more conversions, which should be better for everyone.\n\n## Primary metric\nMostly sign-up completions, but we should also look at daily actives, how many people come back and fill out their profile later, and maybe app store ratings too since sign-up frustration definitely shows up in reviews. Completions is the main one though.\n\n## Guardrail metrics\nOne thing I'm actually worried about: we use those profile details to power recommendations, so if nobody fills them in the feed gets generic and people might not come back. So we should track week-1 retention for new members and make sure it doesn't drop.\n\n## Design and decision rule\nSplit new users into two groups, one gets the optional version and one gets what we have now. Run it for a week or two and see how it looks — if the numbers are up we ship, if it's unclear we can run it a bit longer. We'll keep checking the dashboard as we go so we catch anything weird early.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 1,
          "single-primary-metric": 1,
          "guardrails": 2,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "Earnest but under the bar: hypothesis is directional but vague and unquantified (1), the primary metric hedges into a laundry list (1), the decision rule has variants but no pre-committed thresholds and explicitly endorses peeking (1); the one bright spot is genuine guardrail thinking linking skipped fields to worse recommendations and week-1 retention (2)."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 1,
          "single-primary-metric": 1,
          "guardrails": 2,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "One genuinely good guardrail (retention via degraded recommendations) can't rescue a vague 'less friction = better' hypothesis, a hedged metric list, and an explicit run-longer-if-unclear, watch-the-dashboard peeking plan."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-04",
    "artifactSkillId": "experiment-plan",
    "industry": "healthcare",
    "targetBand": "poor",
    "submission": "## Hypothesis\nRemoving the required fields from step 3 will improve the patient onboarding experience and boost our numbers. Patients today expect frictionless digital experiences, so streamlining this step should be a win for everyone.\n\n## Primary metric\nWe'll measure success holistically: sign-up numbers, engagement, patient satisfaction (NPS), and time-to-complete. Together these will paint the full picture of whether the change worked.\n\n## Guardrail metrics\nSame as above — we'll monitor all of our key metrics in the dashboard to make sure everything stays healthy across the board.\n\n## Design and decision rule\nLaunch the streamlined version and compare this month's numbers to last month's. If the team feels good about the results we keep it, and if not we can always roll back, so the risk is low.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 1,
          "single-primary-metric": 0,
          "guardrails": 0,
          "decision-rule": 0
        },
        "pass": false,
        "notes": "Empty-calorie throughout: the hypothesis names the change with only a vague unfalsifiable claim (1), the primary metric is an explicit multi-metric hedge (0), the guardrail section names nothing and shows no downstream-harm thinking (0), and the design is a before/after month comparison decided by team vibes with no variants or rule (0)."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 0,
          "single-primary-metric": 0,
          "guardrails": 0,
          "decision-rule": 0
        },
        "pass": false,
        "notes": "Not an experiment: unfalsifiable 'win for everyone' claim, 'holistic' metric soup, 'monitor all metrics' as guardrails, and a month-over-month comparison decided by team vibes."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-05",
    "artifactSkillId": "experiment-plan",
    "industry": "marketplace",
    "targetBand": "solid",
    "submission": "## Hypothesis\nMaking the step-3 profile fields (shipping preferences, interests, phone number) optional will increase buyer sign-up completion rate, because step 3 is where we lose roughly a third of buyers who start the flow, and none of those fields are actually required to browse or place a first order. If those fields aren't the blocker, completion won't move and we'll know.\n\n## Primary metric\nBuyer sign-up completion rate: share of users who start sign-up and reach a created account, measured per assigned visitor. This is the single decision metric. I considered adding first-purchase rate as a co-primary and rejected it — it's downstream of too many things we're not touching (inventory, pricing, search) and would muddy the readout. It belongs as a guardrail, not a second primary.\n\n## Guardrail metrics\n1. First-purchase rate within 7 days of sign-up. If optional fields mostly let in low-intent sign-ups who never buy, the completion lift is a vanity win and we shouldn't ship it.\n2. Maybe also something around delivery/support issues, since shipping preferences feed into that — TBD with the data team.\n\n## Design and decision rule\n1. Variants: control (required fields) vs. treatment (same fields, optional, with skip).\n2. Exposure: 50/50 random split of all new buyer sign-up starts, web and app.\n3. Duration: at least two full weeks so we cover weekday/weekend cycles rather than reacting to a single good day.\n4. After the two weeks, we sit down with the data partner, look at the results together, and decide whether to ship. My instinct is we ship if completion is up and purchases aren't down, but I'd want to align on the exact thresholds once we see how much traffic we actually get.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 2,
          "single-primary-metric": 3,
          "guardrails": 2,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "Polished-looking trap item with a jagged profile: excellent single-metric discipline including an explicit co-primary rejection (3), solid hypothesis without quantification (2), one mechanism-backed guardrail plus a TBD (2), but the decision rule is explicitly deferred to after the readout — the classic peek-and-rationalize failure — despite good duration reasoning (1); total 8, narrow fail."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 2,
          "single-primary-metric": 3,
          "guardrails": 2,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "Strong metric discipline (explicitly rejects a co-primary) and a solid purchase guardrail, but the hypothesis lacks a magnitude and the plan explicitly defers thresholds until after seeing results — the exact post-hoc rationalization the rule should prevent."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-06",
    "artifactSkillId": "experiment-plan",
    "industry": "consumer",
    "targetBand": "excellent",
    "submission": "## Hypothesis\nMaking the step-3 profile fields (age, interests, photo) optional will increase full sign-up completion rate by at least 8% relative (from ~61% to ~66%), because 24% of members who reach step 3 abandon there, and session recordings show people stalling on the photo upload specifically. If completion doesn't move by roughly that much, the friction story is wrong — or step 3 isn't the real blocker — and we look elsewhere.\n\n## Primary metric\nSign-up completion rate: members who finish the full flow / members who start step 1. One metric, measured across the whole funnel rather than step 3 alone, so we catch it if drop-off just shifts to a later step. It's the metric the hypothesis is about, and it settles the ship decision on its own.\n\n## Guardrail metrics\n- Day-7 retention of new members. Empty profiles could make the first session worse (weaker recommendations, emptier feed), so a sign-up lift that costs D7 retention is not a win.\n- Profile backfill within 14 days (% of new members who eventually complete the optional fields). If almost nobody backfills, we've traded away data our personalization relies on — worth knowing before full rollout even if we still ship.\n\n## Design and decision rule\nTwo variants, 50/50 split on new sign-up starts: control (current required fields) vs. treatment (same fields marked optional, with a \"skip for now\" link). New members only; returning users never re-exposed. Run 14 full days to cover two weekly cycles — data partner sized this at ~40k starts per arm, enough to detect a 5% relative lift at our baseline. No decision-peeking before day 14; we monitor only for breakage.\nDecision, committed now:\n- Ship if completion is up ≥5% relative at 95% confidence AND D7 retention is down no more than 1pt.\n- Kill if completion is flat or down, or if D7 retention drops >1pt regardless of the completion lift.\n- Iterate (one follow-up test — e.g., defer the fields to post-signup instead of making them optional) if completion is up but 14-day backfill lands under 20%.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 3,
          "single-primary-metric": 3,
          "guardrails": 3,
          "decision-rule": 3
        },
        "pass": true,
        "notes": "Quantified, falsifiable hypothesis with an explicit wrong-answer condition, a single full-funnel primary with a reason, two guardrails tied to concrete downstream harms, and a pre-committed ship/kill/iterate rule with sample-size and no-peeking awareness — earns 3s across the board (12/12)."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 3,
          "single-primary-metric": 3,
          "guardrails": 3,
          "decision-rule": 3
        },
        "pass": true,
        "notes": "Excellent across the board: quantified falsifiable hypothesis, one whole-funnel metric chosen to catch drop-off shifting, two sharp guardrails (D7 retention, backfill), and a powered, pre-committed ship/kill/iterate rule with no decision-peeking."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-07",
    "artifactSkillId": "experiment-plan",
    "industry": "marketplace",
    "targetBand": "solid",
    "submission": "## Hypothesis\nIf we make the step-3 profile fields (company name, category preferences, avatar) optional, buyer sign-up completion will go up by at least 5 points from today's ~55%, because 30% of all funnel drop-off happens on step 3 and none of those fields are needed to browse or buy. If completion doesn't move, friction on step 3 isn't the real problem and we should stop blaming the form.\n\n## Primary metric\nBuyer sign-up completion rate (finished flow / started flow). Picking just this one — it's the thing the change is supposed to move. Everything else is secondary.\n\n## Guardrail metrics\nFirst purchase within 30 days of sign-up. If optional profiles mean worse seller matching, or lower-intent buyers slipping through, this is where it would show up.\n\n## Design and decision rule\n50/50 split, control vs. optional-fields variant, new buyer sign-ups only. Run it about two weeks so we're not reacting to one weird weekend. After that we'll look at the results together — if completion is meaningfully up and purchases look fine, we ship; if it's murky, we'll get the data team's read and figure out next steps from there.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 3,
          "single-primary-metric": 2,
          "guardrails": 2,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "Excellent quantified hypothesis and a clean single primary with one real guardrail, but the decision rule is the soft spot — variants, exposure, and rough duration are there, yet \"meaningfully up / figure it out if murky\" is a post-hoc judgment call, not a pre-committed rule (8/12, narrow fail)."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 3,
          "single-primary-metric": 3,
          "guardrails": 2,
          "decision-rule": 1
        },
        "pass": true,
        "notes": "Crisp quantified hypothesis, a single committed metric, and one real guardrail clear the bar overall, but the readout is soft — 'meaningfully up and purchases look fine, we ship; if murky, figure it out' is not a pre-committed rule."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-08",
    "artifactSkillId": "experiment-plan",
    "industry": "fintech",
    "targetBand": "weak",
    "submission": "## Hypothesis\nWe believe that making the extra profile fields on step 3 optional will reduce friction in our sign-up flow and that more account holders will make it through to the end. People generally don't like filling out long forms, especially on mobile, so giving them the option to skip should help things.\n\n## Primary metric\nThe main metrics we'll look at are sign-up completion rate, drop-off on step 3 specifically, and average time to finish sign-up. Together these should tell us whether the flow actually got easier for people.\n\n## Guardrail metrics\nIdentity verification (KYC) pass rate. Some of the step-3 fields feed our verification checks, so if people skip them now we could see more accounts stuck in manual review or failing verification a week later — a sign-up win that creates frozen accounts is worse than what we have today. We'd also want to watch funded-account rate at 30 days for the same reason.\n\n## Design and decision rule\nStandard A/B test — half of new sign-ups get the optional version, half keep the current one. We'll run it for a week or two and keep an eye on the dashboard daily so we can react quickly if something looks off. If the numbers are trending in the right direction we should feel comfortable rolling it out to 100%.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 1,
          "single-primary-metric": 1,
          "guardrails": 2,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "Jagged profile: genuinely good fintech guardrail thinking (KYC pass rate with a concrete downstream-harm story), but the hypothesis is generic with no data or magnitude, the \"primary metric\" is three co-primaries, and the design invites daily peeking with a \"trending positive\" ship call (5/12)."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 1,
          "single-primary-metric": 1,
          "guardrails": 3,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "The guardrail thinking (KYC pass rate, funded accounts, frozen-account risk) is the best part of the plan, but the hypothesis is a generic belief, three 'main metrics' hedge the decision, and daily dashboard-watching with 'roll out if trending right' is a peeking recipe."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-09",
    "artifactSkillId": "experiment-plan",
    "industry": "healthcare",
    "targetBand": "weak",
    "submission": "## Hypothesis\nOur analytics show that a large share of patients abandon registration on step 3, where we ask for extra profile details like insurance information and health history. We think making these fields optional will increase the percentage of patients who complete registration, because the drop-off is concentrated exactly where the burden on the patient is highest. Registration is stressful enough for people who may not be feeling well, and this is the heaviest part of it.\n\n## Primary metric\nRegistration completion rate is the main one we'll look at. That said, what we ultimately care about is patients actually booking a first appointment, so we'll be watching that just as closely as a key outcome of the test.\n\n## Guardrail metrics\nHonestly we don't expect much downside from asking patients for less, but to be safe we'll keep an eye on overall app usage after sign-up and monitor support tickets in case anyone gets confused by the new flow.\n\n## Design and decision rule\nWe'd show the optional version to half of new patients and keep the current version for the other half, and let it run for two or three weeks so we get a reasonable amount of data. Once it's done, we'll bring the results to the product and clinical teams, review everything together, and decide as a group whether to roll it out more broadly.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 2,
          "single-primary-metric": 1,
          "guardrails": 1,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "Solid analytics-grounded hypothesis (no magnitude, so a 2), but it hedges into two co-primaries, the guardrail section says \"we don't expect downside\" and misses the obvious harm of losing insurance/health data, and the decision is deferred to a post-hoc group review with no pre-committed rule (5/12)."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 2,
          "single-primary-metric": 1,
          "guardrails": 1,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "Reasonable directional hypothesis grounded in drop-off data, but booking is elevated to a de facto co-primary, the guardrails are generic ('don't expect downside, watch tickets'), and the readout is a post-hoc group deliberation with no pre-set rule."
      }
    ],
    "provenance": "synthetic-seed"
  },
  {
    "id": "exp-10",
    "artifactSkillId": "experiment-plan",
    "industry": "saas",
    "targetBand": "poor",
    "submission": "## Hypothesis\nMaking the step-3 profile fields optional will streamline onboarding and improve our conversion overall. Less friction = more happy admins signing up. This feels like a quick win.\n\n## Primary metric\nWe'll track everything so we get the full picture: sign-ups, activation rate, weekly active admins, NPS, and churn. More data = better decisions.\n\n## Guardrail metrics\nDon't think we really need any here — removing required fields can only make things easier for users. Nothing should get worse.\n\n## Design and decision rule\nRoll the new version out to a portion of new users and monitor the dashboards. If the numbers improve, we ship it to everyone.",
    "raters": [
      {
        "raterId": "seed-author",
        "criteria": {
          "falsifiable-hypothesis": 1,
          "single-primary-metric": 0,
          "guardrails": 0,
          "decision-rule": 1
        },
        "pass": false,
        "notes": "Earnest but empty-calorie: a vague \"improve conversion overall\" hypothesis with no metric or reason, a track-everything laundry list instead of a primary, an explicit refusal to name guardrails, and a \"ship if numbers improve\" rule with no duration or pre-commitment (2/12)."
      },
      {
        "raterId": "seed-blind",
        "criteria": {
          "falsifiable-hypothesis": 0,
          "single-primary-metric": 0,
          "guardrails": 0,
          "decision-rule": 0
        },
        "pass": false,
        "notes": "Off-track on every criterion: 'quick win' vibes for a hypothesis, 'track everything' instead of a primary metric, an explicit refusal to name guardrails, and 'ship if numbers improve' with no control, duration, or thresholds."
      }
    ],
    "provenance": "synthetic-seed"
  }
];
