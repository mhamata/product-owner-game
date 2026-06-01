import type { Method } from './types';

export const methods: Method[] = [
  // ────────────── Prioritization ──────────────
  {
    id: 'rice',
    name: 'RICE Scoring',
    category: 'prioritization',
    isCommon: true,
    tldr: "Intercom's prioritization formula. Reach × Impact × Confidence ÷ Effort.",
    formula: 'RICE = (Reach × Impact × Confidence) / Effort',
    whenToUse:
      "When several features compete for one team's time and you can estimate reach + impact with some data.",
    whenNotToUse:
      'When items are strategically non-negotiable (compliance, platform migration) or at early ideation when no data exists yet.',
    benefits: [
      'Forces you to name a reach estimate — often reveals which features only help a sliver of users',
      'The confidence factor explicitly bakes in uncertainty instead of pretending you know',
      'Gives product/eng/stakeholders a shared vocabulary when ranking',
    ],
    limitations: [
      'False precision — multiplying guesses creates authoritative-looking numbers that still came from guesses',
      'Effort in person-months is often wrong; treat as order-of-magnitude',
      'Doesn\'t handle dependencies or cost-of-delay',
    ],
    pitfalls: [
      'Gaming the confidence factor to rescue a pet feature',
      'Ignoring the denominator — a score of 40 on a 6-month feature is not 2× better than 20 on a 1-month one',
    ],
    example: {
      title: 'SaaS onboarding: SSO vs In-app Checklist',
      body:
        'SSO / SAML login: Reach 15k users/qtr, Impact 3 (Massive — blocks enterprise deals), Confidence 80%, Effort 12 pm → (15000 × 3 × 0.8) / 12 = 3,000.\nIn-app onboarding checklist: Reach 8k, Impact 2, Confidence 80%, Effort 6 → (8000 × 2 × 0.8) / 6 = 2,133.\nSSO wins — but the confidence gap is what matters: you have signed deals gated on SSO, only survey signal on the checklist.',
    },
    relatedScenarios: ['01-canadian-launch'],
    drill: 'rice',
  },
  {
    id: 'ice',
    name: 'ICE Scoring',
    category: 'prioritization',
    tldr: "Sean Ellis's simpler RICE — Impact × Confidence × Ease, each 1-10.",
    formula: 'ICE = Impact × Confidence × Ease',
    whenToUse: 'High-volume idea triage, growth experiments, hackathon ideation where speed matters and data is thin.',
    whenNotToUse: 'Items that require precise effort estimation or cross-team dependencies.',
    benefits: [
      'Fast — you can score 30 ideas in a meeting',
      'Low cognitive overhead; no person-months to argue about',
    ],
    limitations: [
      'Even more false precision than RICE',
      'Ease on a 1-10 scale conflates complexity with duration',
    ],
  },
  {
    id: 'wsjf',
    name: 'WSJF — Weighted Shortest Job First',
    category: 'prioritization',
    isCommon: true,
    tldr: 'SAFe framework. Cost of Delay ÷ Job Size. Tiny-but-urgent items rise to the top.',
    formula:
      'WSJF = (User/Business Value + Time Criticality + Risk Reduction/Opportunity Enablement) / Job Size\nEach factor scored 1, 2, 3, 5, 8, 13 (Fibonacci).',
    whenToUse:
      'When urgency varies across the backlog — regulatory deadlines, seasonal features, competitive windows, expiry-day cycles.',
    whenNotToUse:
      'Team is new to scoring (too many variables; risk of false precision) or items have low time-sensitivity variance.',
    benefits: [
      'Explicit about cost-of-delay — the argument that kills "we\'ll get to that later" for regulatory work',
      'Small-but-urgent items bubble up instead of getting buried',
      'The scoring conversation itself surfaces hidden time constraints',
    ],
    limitations: [
      'Four factors to score per item means slow to apply across 50+ items',
      'Fibonacci scales encourage midpoint bunching (everything becomes a 5)',
      'Time Criticality is often the same as Cost of Delay in disguise; avoid double-counting',
    ],
    pitfalls: [
      'Scoring Job Size as days rather than Fibonacci — breaks the ratio',
      'Using WSJF for truly small items (<1 week) where coordination cost dominates',
    ],
    example: {
      title: 'Platform work: SOC 2 Audit vs Error Dashboard',
      body:
        'SOC 2 Audit Prep: Value 8, Time Criticality 13 (hard Q3 deadline tied to enterprise renewals), Risk 8, Size 13 → (8+13+8)/13 = 2.23.\nError Dashboard: Value 8, Time Criticality 3, Risk 3, Size 8 → (8+3+3)/8 = 1.75.\nThe audit wins despite similar raw value, because the compliance deadline compounds delay cost. This is the exact shape of reasoning a senior PM interview will probe.',
    },
    relatedScenarios: ['01-canadian-launch'],
    drill: 'wsjf',
  },
  {
    id: 'moscow',
    name: 'MoSCoW',
    category: 'prioritization',
    isCommon: true,
    tldr: 'Bucket features into Must / Should / Could / Won\'t for a specific release.',
    whenToUse:
      'Scoping a release with stakeholders who want to classify everything as "critical." Forces explicit trade-offs.',
    whenNotToUse:
      'Ongoing continuous delivery with no release boundary — the buckets lose meaning without a deadline.',
    benefits: [
      'Four buckets are easy to explain to non-PM stakeholders',
      'The Won\'t category is powerful — it\'s the only framework where "not doing this" is explicit',
      'Forces conversation about what "done enough to ship" means',
    ],
    limitations: [
      'Everyone wants everything in Must. Requires discipline to push back',
      'Doesn\'t handle effort — a Must that takes a quarter is very different from one that takes a day',
    ],
    pitfalls: [
      'Must items consuming 100% of capacity. If nothing fits in Should, your Musts aren\'t Musts — they\'re your entire backlog with one label.',
      'Never revisiting Won\'t after a release ships',
    ],
    example: {
      title: 'Rule of thumb',
      body:
        'Must items should fit in ~60% of capacity. Should fills another ~25%. The remaining 15% is buffer for surprises. If your list has Must items totaling 110% of capacity, you are lying to yourself — some are actually Should.',
    },
    drill: 'moscow',
  },
  {
    id: 'kano',
    name: 'Kano Model',
    category: 'prioritization',
    isCommon: true,
    tldr: 'Classify features by how satisfaction changes: Must-have, Performance, Delighter, Indifferent, Reverse.',
    whenToUse:
      'Designing differentiation strategy; positioning against competitors; deciding where to over-invest.',
    whenNotToUse:
      'Pure infrastructure work — Kano is a customer-satisfaction model, not an internal tooling one.',
    benefits: [
      'Reveals where additional investment creates delight (Performance) vs where it\'s wasted (Must-have)',
      'The temporal decay insight — Delighters become Must-haves over time — is a powerful roadmap lens',
      'Helps argue for cutting features you\'ve over-invested in (they\'ve become commoditized)',
    ],
    limitations: [
      'Requires customer research to categorize honestly; without data it becomes internal opinion',
      'Reverse features are rare and often controversial',
    ],
    pitfalls: [
      'Classifying based on what the team wants users to care about, not what users actually care about',
      'Forgetting temporal decay — last year\'s Delighter is this year\'s Must-have',
    ],
    example: {
      title: 'Dark Mode Over Time',
      body:
        '2016: Delighter (Twitter clip showcase).\n2019: Performance (users compare apps by dark-mode quality).\n2024: Must-have (a launch without it gets roasted).\nPlan your investments knowing this decay will happen to whatever you ship.',
    },
    relatedScenarios: ['01-canadian-launch'],
    drill: 'kano',
  },
  {
    id: 'value-vs-effort',
    name: 'Value vs Effort Matrix (2×2)',
    category: 'prioritization',
    tldr: 'Simplest prioritization tool — 2×2 of value and effort. Quick Wins, Big Bets, Fill-ins, Time Sinks.',
    whenToUse: 'Drawing on a whiteboard for non-PM stakeholders; initial triage of a long list.',
    whenNotToUse: 'When you need defensible scores or the list has 20+ items (gets visually crowded).',
    benefits: ['Instantly legible to anyone', 'Low cognitive load for a 5-minute exercise'],
    limitations: ['No confidence factor', 'Binary axes hide nuance'],
  },
  {
    id: 'opportunity-scoring',
    name: 'Opportunity Scoring',
    category: 'prioritization',
    tldr: "Tony Ulwick's method: survey users on Importance and Satisfaction. Gaps = opportunities.",
    formula: 'Opportunity = Importance + max(Importance − Satisfaction, 0)',
    whenToUse: 'Entering an existing market and hunting for the underserved-need wedge.',
    benefits: ['Quantitative signal from users instead of internal opinion', 'Surfaces where competitors are weak'],
    limitations: ['Requires enough users to survey meaningfully', 'Respondents conflate Satisfaction with general happiness'],
  },
  {
    id: 'cost-of-delay',
    name: 'Cost of Delay',
    category: 'prioritization',
    isCommon: true,
    tldr: 'Ask what missing the next sprint would cost. Four patterns: urgency-sensitive, time-decaying, fixed-date, standard.',
    whenToUse:
      'Comparing priority with stakeholders who speak business value — especially regulated, operational, or seasonal work.',
    whenNotToUse: 'Pure internal tooling where delay cost is diffuse and hard to quantify.',
    benefits: [
      'Turns "high priority" into dollars, which stakeholders actually respond to',
      'The four patterns force you to classify honestly',
      'Foundation concept behind WSJF — understanding CoD makes WSJF defensible',
    ],
    limitations: [
      'Quantifying delay cost is itself a research exercise',
      'Works best for hard deadlines; weakens for "eventually" work',
    ],
    pitfalls: [
      'Treating all deadlines as fixed-date when they\'re actually urgency-sensitive',
      'Ignoring Cost of Delay for infrastructure — the bill comes due with interest',
    ],
    example: {
      title: 'Manual billing reconciliation',
      body:
        'Postponing billing automation = urgency-sensitive + fixed-date hybrid. Every month it slips = ~$X in manual finance-ops time AND a growing backlog of invoice errors. When you frame it as "we pay $Y/month to not automate," the conversation stops being about priority and starts being about economics.',
    },
    relatedScenarios: ['01-canadian-launch'],
  },

  // ────────────── Estimation ──────────────
  {
    id: 't-shirt',
    name: 'T-Shirt Sizing',
    category: 'estimation',
    isCommon: true,
    tldr: 'Abstract sizing XS/S/M/L/XL/XXL. Relative, not absolute. Best for early-stage.',
    whenToUse: 'Roadmap planning, epic-level items, stakeholder conversations where precision would be fake.',
    whenNotToUse: 'Sprint-level planning (use story points or days).',
    benefits: [
      'Fast to apply',
      'Obviously imprecise, which reduces the temptation to treat it as a commitment',
      'XXL is a useful tell — if something is XXL, break it down before promising anything',
    ],
    limitations: [
      'Not useful for capacity math',
      'Two people\'s "M" may differ by 5×',
    ],
    example: {
      title: 'Rough conversion',
      body: 'XS ≈ 1 day · S ≈ 2-3 days · M ≈ 1 sprint · L ≈ 2 sprints · XL ≈ 1 quarter · XXL = "break this down first"',
    },
    drill: 't-shirt',
  },
  {
    id: 'story-points',
    name: 'Story Points (Fibonacci)',
    category: 'estimation',
    tldr: '1, 2, 3, 5, 8, 13, 21 — captures complexity + risk + effort combined, not time.',
    whenToUse: 'Team has consistent membership and is calibrated on relative sizing.',
    whenNotToUse:
      'Newly-formed team (no baseline), or stakeholders try to convert points → hours (they aren\'t time).',
    benefits: ['Abstracts time away so velocity can stabilize', 'Fibonacci gaps force relative comparison, not absolute'],
    limitations: ['Takes ~6 sprints to calibrate', 'Comparing velocity across teams is meaningless (and people always try)'],
  },
  {
    id: 'planning-poker',
    name: 'Planning Poker',
    category: 'estimation',
    tldr: 'Team estimates simultaneously with cards. Divergence surfaces hidden assumptions.',
    whenToUse: 'Complex stories, new team, or when mid-sprint surprises keep happening.',
    benefits: [
      'The conversation is the product, not the number',
      'Extreme values reveal who is missing information',
    ],
    limitations: ['Slow (20-30 min per handful of stories)', 'Anchor bias: whoever reveals first often sets the room'],
  },
  {
    id: 'three-point',
    name: 'Three-Point Estimates (PERT)',
    category: 'estimation',
    tldr: 'Expected = (Optimistic + 4×Most Likely + Pessimistic) / 6. Forces naming the range.',
    formula: 'Expected = (O + 4M + P) / 6',
    whenToUse: 'Roadmap commitments where a single-point estimate would be misleading.',
    benefits: ['Makes uncertainty visible', 'The pessimistic estimate often exposes risks you\'d have missed'],
    limitations: ['Three numbers to argue about instead of one', 'Teams tend to pick a Pessimistic that\'s only 1.5× Optimistic, underestimating tail risk'],
  },
  {
    id: 'no-estimates',
    name: '#NoEstimates',
    category: 'estimation',
    tldr: 'Stop sizing individual stories. Measure throughput, forecast via Monte Carlo.',
    whenToUse: 'Team has good flow discipline and stable story sizes.',
    whenNotToUse: 'Stakeholders require roadmap commitments with fixed dates.',
    benefits: ['Removes the estimation ceremony tax', 'Throughput numbers are empirical, not guessed'],
    limitations: ['Requires stable story sizes (the invisible estimation that happens via slicing)', 'Hard to sell to execs used to Gantt charts'],
  },

  // ────────────── Discovery ──────────────
  {
    id: 'jtbd',
    name: 'Jobs-to-be-Done (JTBD)',
    category: 'discovery',
    isCommon: true,
    tldr: 'Users "hire" products to do a job. Frame needs in: when [situation], I want to [motivation], so I can [outcome].',
    formula: 'When [situation], I want to [motivation], so I can [expected outcome].',
    whenToUse:
      'Entering a new market, repositioning, or when your personas feel shallow and interchangeable.',
    whenNotToUse: 'Purely technical/infrastructure decisions where no "user" exists in the classical sense.',
    benefits: [
      'Moves away from demographics (25-year-old urban millennials) toward causality (what made them switch today?)',
      'The milkshake insight: same product, multiple jobs. Morning-commute milkshake ≠ dessert milkshake.',
      'Reveals competitors you hadn\'t named — if the job is "stay occupied during my commute," your competitor is podcasts, not other milkshakes',
    ],
    limitations: [
      'Feels abstract; takes discipline to stay out of solution-space',
      'Over-applied — every tiny feature doesn\'t need a JTBD statement',
    ],
    pitfalls: [
      'Writing the job as the feature ("When I want a CSV export, I want the export button") — tautology',
      'Naming the outcome as what the product does, not what the user gains',
    ],
    example: {
      title: 'Analytics tool: Maya (marketing analyst)',
      body:
        '"When it is Monday morning and my VP needs the campaign report before standup, I want to pull the numbers together once and trust they are right, so I can walk in without scrambling or second-guessing."\n\nNote what this tells you: the competitors are the spreadsheet AND doing nothing. The killer feature = trustworthy one-click reporting, not more chart types.',
    },
    relatedScenarios: ['01-canadian-launch'],
    drill: 'jtbd',
  },
  {
    id: 'mom-test',
    name: 'User Interviews (Mom Test)',
    category: 'discovery',
    isCommon: true,
    tldr: "Rob Fitzpatrick's rules for interviews: ask about past behavior, not hypothetical futures.",
    whenToUse: 'Exploring problem space, validating pain, before writing PRDs.',
    whenNotToUse:
      'Confirming a decision you\'ve already made — the Mom Test is for learning, not selling.',
    benefits: [
      'Cuts through the politeness that makes user interviews confirm whatever you want',
      'Specific past behavior is evidence; hypothetical future behavior is opinion',
      'The "talk about their life, not your idea" rule is the single biggest ROI in discovery',
    ],
    limitations: [
      'Harder than it looks — even experienced PMs lead the witness',
      'Behavioral past-tense questions are awkward to phrase on the fly',
    ],
    pitfalls: [
      'Asking "would you use this?" — worthless, everyone says yes',
      'Accepting compliments as signal ("love it!" tells you nothing)',
      'Pitching mid-interview; switches the dynamic from learning to selling',
    ],
    example: {
      title: 'Three rewrites',
      body:
        '❌ "Would you pay for a tool that tracks your team\'s tasks?"\n✅ "When was the last time you checked where a project stood? Walk me through how you did it."\n\n❌ "Do you like having a shared dashboard?"\n✅ "Tell me about the last status update someone asked you for. What did you do to put it together?"\n\n❌ "Would this feature be useful?"\n✅ "Show me how you currently do this. What\'s the annoying part?"',
    },
    relatedScenarios: ['01-canadian-launch'],
    drill: 'mom-test',
  },
  {
    id: 'opportunity-solution-tree',
    name: 'Opportunity Solution Tree (Torres)',
    category: 'discovery',
    tldr: 'Hierarchical: Desired Outcome → Opportunities → Solutions → Experiments. No orphan features.',
    whenToUse: 'Continuous discovery practice; keeping team anchored to outcomes.',
    benefits: [
      'Every solution must trace back to a measurable outcome',
      'Makes "pet features" visible as orphans',
      'Encourages multiple solutions per opportunity (combats first-idea bias)',
    ],
    limitations: ['Requires ongoing maintenance — the tree is a practice, not a doc', 'Can become performative if not used for actual decision-making'],
  },
  {
    id: 'five-whys',
    name: '5 Whys',
    category: 'discovery',
    isCommon: true,
    tldr: 'Ask "why" five times. From symptom to root cause. Toyota origin.',
    whenToUse: 'Investigating bugs, churn reasons, team dysfunction, post-mortems.',
    whenNotToUse:
      'Truly ambiguous problems with multiple parallel causes (use fishbone/Ishikawa instead).',
    benefits: [
      'Disarmingly simple — stops you from fixing symptoms',
      'Often reveals process or organizational root causes hiding behind technical ones',
    ],
    limitations: [
      'Linear — assumes a single causal chain where many problems have branching causes',
      '"Five" is arbitrary — sometimes 3 whys, sometimes 8',
    ],
    pitfalls: [
      'Stopping at the first human-error cause ("the dev made a mistake") — that\'s never the root',
      'Leading the whys toward a predetermined answer',
    ],
    example: {
      title: 'Sync job failure',
      body:
        'Why did the nightly data sync fail? → The records didn\'t match the schema.\nWhy didn\'t they match? → A third-party API changed its payload format.\nWhy didn\'t we know? → We weren\'t subscribed to their changelog.\nWhy not? → No one owns vendor-integration comms.\nWhy not? → Integrations were never staffed when we launched the feature.\n→ Root cause is organizational, not technical. The fix is ownership, not a patch.',
    },
    drill: 'five-whys',
  },
  {
    id: 'pre-mortem',
    name: 'Pre-mortem',
    category: 'discovery',
    isCommon: true,
    tldr: 'Write the post-mortem before building. "It\'s 6 months out and this failed — why?"',
    whenToUse: 'Big strategic bets, major launches, high-stakes decisions where you have one shot.',
    whenNotToUse: 'Small reversible decisions — overhead exceeds value.',
    benefits: [
      'Surfaces assumptions that nobody was willing to voice in optimism mode',
      'The "prospective hindsight" framing reduces politeness bias',
      'Creates an early-warning list you can actually monitor during execution',
    ],
    limitations: [
      'Requires psychological safety — if the team fears being seen as a downer, it becomes theatrical',
      '~45-minute exercise — skip for small decisions',
    ],
    pitfalls: [
      'Only gathering failures instead of asking "what would we have done differently?"',
      'Not writing down the top-3 failure modes so you can monitor them',
    ],
    example: {
      title: 'The exercise',
      body:
        '1. "Imagine it\'s 6 months from now. We shipped this feature and it failed. What happened?" (10 min silent writing, each person)\n2. Share all failure modes; dedupe.\n3. Vote on top 3 most probable.\n4. For each, define a leading indicator you\'ll monitor.\n5. Assign an owner to each indicator.\nThe output isn\'t a list of fears — it\'s a dashboard.',
    },
    relatedScenarios: ['01-canadian-launch'],
    drill: 'pre-mortem',
  },
  {
    id: 'journey-mapping',
    name: 'Customer Journey Mapping',
    category: 'discovery',
    tldr: "Map the customer's actions, thoughts, and pain points end-to-end. Reveals cross-feature friction.",
    whenToUse: 'End-to-end product design, activation/retention gaps, onboarding investigation.',
    benefits: ['Exposes hand-offs that break between teams', 'The emotion track reveals moments a feature alone won\'t fix'],
    limitations: ['Takes a full workshop to do well', 'Often kept as a poster, never revisited'],
  },

  // ────────────── Strategy ──────────────
  {
    id: 'north-star',
    name: 'North Star Metric',
    category: 'strategy',
    tldr: 'One number that captures core value delivery. Airbnb = nights booked. Spotify = time spent listening.',
    whenToUse: 'Aligning a team around a shared outcome; filtering noise from dashboards.',
    benefits: [
      'Single number clarifies "are we winning" conversations',
      'Leading indicator (unlike revenue) so team can act on it',
    ],
    limitations: ['Wrong North Star is catastrophic — you optimize the wrong thing for months', 'Doesn\'t capture health metrics (retention, quality)'],
  },
  {
    id: 'okrs',
    name: 'OKRs',
    category: 'strategy',
    isCommon: true,
    tldr: 'Objectives (qualitative, aspirational) + Key Results (3-5 measurable outcomes). Quarterly.',
    whenToUse: 'Aligning cross-functional teams of ~8+ people on outcomes.',
    whenNotToUse: 'Team under 8 — OKRs become bureaucracy. Use a simpler list.',
    benefits: [
      'Forces "what does success look like" before starting',
      'KRs measure outcomes, not output — the single most important rule',
      'Quarterly cadence matches decision speed for most orgs',
    ],
    limitations: [
      'Abused constantly: KRs become task lists or vanity metrics',
      'The "graded 0-1, 0.7 is success" culture is hard to maintain — teams game to hit 1.0',
    ],
    pitfalls: [
      'Writing KRs as outputs ("Ship the checkout redesign") instead of outcomes ("Checkout completion rate from 58% → 70%")',
      'Making them annual (kills adaptability) or weekly (kills focus)',
    ],
    example: {
      title: 'Good vs bad KRs',
      body:
        '❌ "Launch the self-serve onboarding flow" (output, binary, no outcome)\n✅ "Grow weekly active users from 22k → 60k" (outcome)\n✅ "Day-14 retention from 34% → 50%" (outcome, measurable)\nThe onboarding flow is the bet that might move the KR — but shipping it isn\'t the KR.',
    },
  },
  {
    id: 'heart',
    name: 'HEART Framework (Google)',
    category: 'strategy',
    tldr: 'Happiness, Engagement, Adoption, Retention, Task success. UX quality measurement.',
    whenToUse: 'Measuring UX quality over time; post-launch feature evaluation.',
    benefits: ['Covers both behavioral and attitudinal dimensions', 'Adoption-Retention split prevents "users came once" celebration'],
    limitations: ['Five metrics is a lot to track per feature', 'Happiness is attitudinal — expensive to measure continuously'],
  },
  {
    id: 'aarrr',
    name: 'Pirate Metrics (AARRR)',
    category: 'strategy',
    tldr: "Dave McClure's funnel: Acquisition → Activation → Retention → Revenue → Referral.",
    whenToUse: 'Early-stage consumer growth diagnosis.',
    benefits: ['Simple to explain', 'Reveals which stage leaks — the stage that\'s broken is where to focus'],
    limitations: ['B2B and enterprise don\'t fit cleanly', 'Later-stage companies outgrow it — health metrics don\'t fit'],
  },
  {
    id: 'vision-board',
    name: 'Product Vision Board',
    category: 'strategy',
    tldr: "Roman Pichler's one-pager: Target Group, Needs, Product, Business Goals.",
    whenToUse: 'Early product definition or when the team has drifted from the "why."',
    benefits: ['Forces one-page discipline', 'Lives on the wall — visible artifact beats buried doc'],
    limitations: ['Low fidelity — can feel too abstract for execution teams'],
  },
  {
    id: 'lean-canvas',
    name: 'Lean Canvas (Maurya)',
    category: 'strategy',
    tldr: 'One-page business model: problem, solution, key metrics, UVP, channels, segments, economics.',
    whenToUse: 'Early-stage validation; forcing product + economics thinking together.',
    benefits: ['Catches "great product, no business" early', 'Unfair Advantage box is the hardest question — and the most valuable'],
    limitations: ['Nine blocks in one page = shallow by design', 'Not useful for mature products'],
  },
  {
    id: 'pr-faq',
    name: 'Amazon Working Backwards (PR-FAQ)',
    category: 'strategy',
    isCommon: true,
    tldr: 'Write the press release + FAQ for the finished product before writing code.',
    whenToUse: 'Forcing clarity of vision before implementation; funding conversations.',
    whenNotToUse: 'Small incremental features — overkill.',
    benefits: [
      'The press release discipline forces customer-centric articulation',
      'FAQs surface uncomfortable questions stakeholders were avoiding',
      'Amazon uses it to kill bad ideas before any code is written',
    ],
    limitations: [
      'Takes days to write well',
      'Easy to produce aspirational fiction that doesn\'t match feasibility',
    ],
    pitfalls: [
      'Writing the PR in feature-speak instead of customer-benefit-speak',
      'Skipping the "frequently-asked but uncomfortable" questions — that\'s where the value lives',
    ],
    example: {
      title: 'The structure',
      body:
        'PRESS RELEASE (1 page):\n• Headline — benefit, not feature\n• Subtitle — who it\'s for\n• Summary paragraph — problem it solves\n• Problem paragraph — what\'s broken today\n• Solution paragraph — how we fix it\n• Leader quote — internal exec endorsement (why this matters strategically)\n• How to get started — user quote + simple instructions\n\nFAQ (2 pages):\n• External: what users will ask\n• Internal: what the board will ask — pricing, risk, dependencies, what we\'re NOT doing',
    },
    drill: 'pr-faq',
  },

  // ────────────── Decision ──────────────
  {
    id: 'daci',
    name: 'DACI',
    category: 'decision',
    tldr: 'Driver, Approver, Contributors, Informed. Clarifies who decides.',
    whenToUse: 'Decisions keep getting muddy because nobody knows who decides.',
    benefits: ['Prevents the "8-person meeting where nothing gets decided" pattern', 'Named Approver accepts accountability'],
    limitations: ['Requires the org to respect the framework — in political cultures the real Approver ignores the doc'],
  },
  {
    id: 'raci',
    name: 'RACI',
    category: 'decision',
    tldr: 'Responsible, Accountable, Consulted, Informed. Execution-focused sibling of DACI.',
    whenToUse: 'Cross-functional execution where hand-offs are breaking.',
    benefits: ['Common in ops and project management', 'Accountable ≠ Responsible distinction is the useful part'],
    limitations: ['Easy to get every cell tagged "all" — which is the same as nothing'],
  },
  {
    id: 'disagree-commit',
    name: 'Disagree and Commit',
    category: 'decision',
    tldr: 'Voice disagreement openly in the meeting. Once decided, commit fully — no undermining.',
    whenToUse: 'Reversible decisions where the team is stuck in endless debate.',
    benefits: [
      'Prevents the "I never really agreed" sabotage pattern',
      'Speeds decisions without faking consensus',
    ],
    limitations: ['Requires real psychological safety to voice disagreement', 'Easy to weaponize against legitimate concerns'],
  },
  {
    id: 'one-way-doors',
    name: 'One-Way vs Two-Way Doors',
    category: 'decision',
    isCommon: true,
    tldr: 'Reversible (two-way) → decide fast. Irreversible (one-way) → deliberate carefully.',
    whenToUse: 'Every decision — the meta-framework.',
    benefits: [
      'The single most velocity-unlocking decision frame',
      'Legitimizes fast decisions on reversible things',
      'Forces real rigor where it matters — one-way doors',
    ],
    limitations: [
      'Classifying a door correctly is harder than it looks',
      'Politically-fraught decisions are often two-way technically but one-way socially',
    ],
    pitfalls: [
      'Treating every decision as one-way — the default that kills velocity',
      'Treating actually-one-way decisions as two-way ("we can always change it later" when you can\'t)',
    ],
    example: {
      title: 'Door classification',
      body:
        'Pricing experiment → two-way (can roll back)\nPublic pricing change after launch → one-way (can\'t unhear)\nAuth migration → one-way (data committed)\nFeature-flag a new flow to 5% → two-way\nHire a senior PM → one-way socially (even if legally reversible)\n\nAsk: if this fails, what\'s the cost to reverse vs the cost to decide slowly?',
    },
  },
  {
    id: 'cost-of-inaction',
    name: 'Cost of Inaction',
    category: 'decision',
    tldr: 'Ask what NOT doing X costs — especially for infrastructure, tech debt, discovery.',
    whenToUse: 'Making the case for platform investment, compliance work, or team health.',
    benefits: [
      'Reveals invisible debt',
      'Flips the conversation from "why should we?" to "what do we pay every quarter we don\'t?"',
    ],
    limitations: ['Hard to quantify for diffuse costs', 'Easy to exaggerate — discipline required'],
  },

  // ────────────── Design & Testing ──────────────
  {
    id: 'hypothesis-cards',
    name: 'Hypothesis Cards',
    category: 'design-testing',
    tldr: 'We believe [persona] will [behavior] because [reason]. We\'ll know it worked when [metric].',
    formula: 'We believe [persona] will [behavior] because [reason]. We will know when [measurable signal].',
    whenToUse: 'Before any experiment — forces a falsifiable prediction.',
    benefits: ['The "we\'ll know when" forces you to pre-commit to a success signal', 'Prevents after-the-fact rationalization'],
    limitations: ['Vague metrics make the card useless', 'Overhead for very small experiments'],
  },
  {
    id: 'fake-door',
    name: 'Fake-Door Test',
    category: 'design-testing',
    tldr: 'Put a button for a feature that doesn\'t exist. Measure clicks. Apologize to clickers.',
    whenToUse: 'Validating demand before investing engineering.',
    benefits: ['Fastest way to measure intent', 'Forces a decision between "build it" and "kill it"'],
    limitations: ['User trust cost — apology experience matters', 'Ethics questions in regulated contexts'],
  },
  {
    id: 'wizard-of-oz',
    name: 'Wizard of Oz',
    category: 'design-testing',
    tldr: 'User sees a "working" feature; humans are behind the curtain. Test UX before building automation.',
    whenToUse: 'Proving demand for automation-heavy features (AI, matching, recommendations).',
    benefits: ['Skip building the automation until demand is proven', 'Learn exact workflow before hard-coding it'],
    limitations: ['Doesn\'t scale past ~100 users', 'Operational cost of running the wizard'],
  },
  {
    id: 'concierge-mvp',
    name: 'Concierge MVP',
    category: 'design-testing',
    tldr: 'Deliver the service manually for the first 10 customers. Learn the workflow, then automate.',
    whenToUse: 'Early-stage service products; learning the real workflow before codifying it.',
    benefits: [
      'You discover what you\'d have gotten wrong in the product spec',
      'Builds genuine empathy with ops workload',
    ],
    limitations: ['Doesn\'t scale', 'Team must love talking to users'],
  },
  {
    id: 'mlp',
    name: 'Minimum Lovable Product',
    category: 'design-testing',
    tldr: 'Ship something small that users love, not something minimum they tolerate.',
    whenToUse: 'Competitive markets where MVPs get ignored in the noise.',
    benefits: ['A loved small feature drives word-of-mouth; a tolerated one does nothing'],
    limitations: ['"Lovable" is subjective — risks over-polishing before validating demand'],
  },
  {
    id: 'shape-up',
    name: 'Shape Up (Basecamp)',
    category: 'design-testing',
    tldr: '6-week cycles. Upfront shaping (PM + senior eng). Pitches. Appetite-driven scope.',
    whenToUse: 'Small teams with senior ICs, bias toward larger pieces of work.',
    whenNotToUse: 'Large orgs, shallow ICs, or heavy external dependencies — Shape Up assumes autonomy.',
    benefits: ['Appetite framing prevents scope creep — "we\'re willing to spend 6 weeks on this, not 12"', 'Shaping forces resolution of big unknowns before commitment'],
    limitations: ['Requires senior engineering + product judgment to work', 'Not compatible with quarterly OKRs (cycle lengths mismatch)'],
  },
];

export function getMethod(id: string): Method | null {
  return methods.find((m) => m.id === id) ?? null;
}

export function getMethodsByCategory(category: string): Method[] {
  return methods.filter((m) => m.category === category);
}

export function getCommonMethods(): Method[] {
  return methods.filter((m) => m.isCommon);
}
