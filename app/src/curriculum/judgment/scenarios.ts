import type { JudgmentScenario } from './types';

/**
 * The judgment deck: pre-authored PM decision scenarios reviewed on a
 * forgetting-curve schedule. No API calls, no generated content; everything
 * here is hand-written so the feature works with no API key.
 *
 * Authoring rules (kept tight on purpose):
 *  - The situation is 2-4 sentences and concrete. The surface can be flavoured
 *    to the learner's industry via the `ctx` callback; the decision underneath
 *    is the same in every industry.
 *  - Every option is something a competent PM might genuinely consider. No straw
 *    men, no joke answers. The skill being taught is choosing the *best* call
 *    among reasonable ones, not spotting an obviously wrong one.
 *  - The `why` names the principle and explains the tradeoff. It is
 *    industry-neutral: judgment does not change because the product changed.
 *  - Ids are stable forever. The scheduler tracks progress by id, so renaming or
 *    renumbering an id silently resets a learner's history for that card.
 *
 * Coverage (two scenarios per competency, 16 total):
 *   prioritization · scope-quality · discovery-delivery · stakeholder-influence
 *   metrics · build-buy · ethics · ship-polish
 */
export const JUDGMENT_SCENARIOS: JudgmentScenario[] = [
  /* ------------------------------------------------------------------
     PRIORITIZATION TRADEOFFS
     ------------------------------------------------------------------ */
  {
    id: 'prioritization-loud-customer',
    competency: 'prioritization',
    title: 'The loudest customer',
    situation: (ctx) =>
      `Your largest ${ctx.label} customer emails the CEO demanding a niche feature, and the CEO forwards it to you with "can we do this?". Your roadmap for the quarter targets an onboarding fix that data shows would lift activation for thousands of ${ctx.user}s. The requested feature would help this one account and a handful like it.`,
    options: [
      { id: 'a', label: 'Build the requested feature first; a request from your biggest account through the CEO is the clearest signal you will get.' },
      { id: 'b', label: 'Decline and stay on the onboarding fix, but reply to the CEO and customer with the reasoning and the reach numbers behind the call.' },
      { id: 'c', label: 'Quietly keep your roadmap and let the request sit; the CEO will forget about it in a week.' },
      { id: 'd', label: 'Split the team so half builds the feature and half continues onboarding, satisfying everyone.' },
    ],
    bestOptionId: 'b',
    why: 'Prioritize by expected impact across all users, not by who shouts loudest or sits highest. The onboarding fix helps far more people, so it stays. The judgment is not just the decision but making it legible: show the CEO and customer the reach and tradeoff so the no is trusted, not resented. Going silent (c) burns trust, and splitting the team (d) halves throughput on both bets.',
    principle: 'Impact over volume; make the tradeoff visible',
  },
  {
    id: 'prioritization-quick-wins-vs-platform',
    competency: 'prioritization',
    title: 'Quick wins vs the platform debt',
    situation: (ctx) =>
      `You can spend the next two sprints shipping five small, visible improvements to your ${ctx.product}, or paying down a platform limitation that is quietly slowing every future feature. The quick wins would demo well at the next review. The platform work shows nothing on the surface but compounds.`,
    options: [
      { id: 'a', label: 'Ship the five quick wins; visible momentum keeps stakeholders confident and the team motivated.' },
      { id: 'b', label: 'Do the platform work now while it is still cheap, and frame it to stakeholders as the thing that unlocks faster delivery later.' },
      { id: 'c', label: 'Always defer infrastructure work until it actually breaks in production.' },
      { id: 'd', label: 'Ask engineering to do the platform work on nights and weekends so the roadmap stays clean.' },
    ],
    bestOptionId: 'b',
    why: 'Deferring compounding work to chase visible wins is how teams accumulate the debt that eventually halts them. The call is to invest while the cost is low and the leverage is high, then communicate it in outcome terms so it reads as enabling speed, not stalling. Waiting for a break (c) trades a cheap fix for an expensive emergency, and off-hours work (d) hides cost and burns the team.',
    principle: 'Invest in leverage before it becomes a tax',
  },

  /* ------------------------------------------------------------------
     SCOPE VS QUALITY
     ------------------------------------------------------------------ */
  {
    id: 'scope-quality-deadline-cut',
    competency: 'scope-quality',
    title: 'The deadline will not move',
    situation: (ctx) =>
      `A committed launch date for your ${ctx.product} is two weeks out and the full scope will not fit. The feature has a clear core that delivers most of the value, plus several secondary capabilities. Cutting corners on the core to keep everything would mean shipping all of it at low quality.`,
    options: [
      { id: 'a', label: 'Keep the full scope and lower the quality bar across the board so everything ships by the date.' },
      { id: 'b', label: 'Cut the secondary capabilities, ship the core at full quality on the date, and put the rest on a fast follow.' },
      { id: 'c', label: 'Hold the full scope and quality, and let the date slip as far as it needs to.' },
      { id: 'd', label: 'Ship everything at the date and fix the quality problems in patches afterward.' },
    ],
    bestOptionId: 'b',
    why: 'When time is fixed, scope is the variable you control; quality is not a safe thing to trade because the cost of low quality is paid forever, by every user and every future change. Cut to a coherent core that stands on its own, ship it well, and fast-follow the rest. Lowering the bar everywhere (a, d) ships fragility, and slipping with no scope discipline (c) ignores a real commitment.',
    principle: 'Flex scope, protect quality',
  },
  {
    id: 'scope-quality-edge-cases',
    competency: 'scope-quality',
    title: 'How many edge cases',
    situation: (ctx) =>
      `A new flow in your ${ctx.product} handles the common path well, but there are a dozen rare edge cases. Handling every one would roughly double the build time. Telemetry suggests the common path covers the large majority of real usage, and the rare cases fail safely rather than dangerously.`,
    options: [
      { id: 'a', label: 'Handle every edge case before launch; a flow that is not exhaustive is not really done.' },
      { id: 'b', label: 'Ship the common path now since rare cases fail safely, instrument the edges, and handle them if real usage shows they matter.' },
      { id: 'c', label: 'Ship the common path and never revisit the edge cases; rare means irrelevant.' },
      { id: 'd', label: 'Block the rare cases entirely so users cannot reach them, then call the flow complete.' },
    ],
    bestOptionId: 'b',
    why: 'Quality means safe and good where it counts, not exhaustive everywhere regardless of value. Because the edges are rare and fail safely, the right move is to ship the high-value common path, measure the edges, and let evidence pull the remaining work. Gold-plating every case (a) burns time on usage that may never happen; never revisiting (c) ignores the signal you set up to collect; hard-blocking users (d) degrades the experience to avoid work.',
    principle: 'Right-size quality to real usage and risk',
  },

  /* ------------------------------------------------------------------
     DISCOVERY VS DELIVERY PRESSURE
     ------------------------------------------------------------------ */
  {
    id: 'discovery-delivery-skip-research',
    competency: 'discovery-delivery',
    title: 'Skip the research?',
    situation: (ctx) =>
      `Leadership wants a redesigned ${ctx.product} flow shipped this quarter and is pushing to start building immediately. The team has a strong opinion about the solution but has not talked to a single ${ctx.user} about the actual problem. A week of discovery would delay the build start by a week.`,
    options: [
      { id: 'a', label: 'Start building now; a week of delay on a committed quarter is a week you cannot afford, and the team already has a strong hypothesis.' },
      { id: 'b', label: 'Run a tight, time-boxed week of discovery to validate the problem and de-risk the solution before committing weeks of build.' },
      { id: 'c', label: 'Run open-ended discovery until the team feels fully certain, however long that takes.' },
      { id: 'd', label: 'Skip discovery but add a big round of user testing after the full build is done.' },
    ],
    bestOptionId: 'b',
    why: 'The most expensive thing a team can do is build the wrong thing efficiently. A short, time-boxed discovery is cheap insurance against weeks of misdirected delivery, and a strong opinion is exactly the thing worth testing before you bet on it. Building blind (a) risks the whole quarter; unbounded discovery (c) is its own failure mode; testing only after the build (d) finds the problem when it is most expensive to fix.',
    principle: 'De-risk before you commit, but time-box it',
  },
  {
    id: 'discovery-delivery-continuous',
    competency: 'discovery-delivery',
    title: 'Discovery while delivering',
    situation: (ctx) =>
      `Your team is heads-down delivering a committed ${ctx.product} roadmap and has no discovery running at all. The backlog is full for the next two quarters. A teammate worries you are building a long list of features with no fresh evidence that they are still the right ones.`,
    options: [
      { id: 'a', label: 'Focus purely on delivery until the committed roadmap is done, then restart discovery with a clean slate.' },
      { id: 'b', label: 'Run a small, continuous stream of discovery alongside delivery so the backlog keeps getting tested against real evidence.' },
      { id: 'c', label: 'Pause delivery entirely and put the whole team on discovery until the backlog is re-validated.' },
      { id: 'd', label: 'Trust the original plan; a committed roadmap should not be second-guessed mid-flight.' },
    ],
    bestOptionId: 'b',
    why: 'Discovery and delivery are continuous parallel tracks, not sequential phases. A small steady stream of evidence keeps a long backlog honest without stopping shipping, so you catch a dead bet before you build it rather than after. Going dark on discovery (a, d) lets the plan drift from reality; halting delivery entirely (c) overcorrects and stalls committed work.',
    principle: 'Continuous discovery alongside delivery',
  },

  /* ------------------------------------------------------------------
     STAKEHOLDER / INFLUENCE DILEMMA
     ------------------------------------------------------------------ */
  {
    id: 'stakeholder-influence-exec-pet-feature',
    competency: 'stakeholder-influence',
    title: "The exec's pet feature",
    situation: (ctx) =>
      `A senior executive is personally attached to a feature for your ${ctx.product} that your evidence says will not move the metric you both care about. They have authority over your roadmap but not deep context on the data. Flatly refusing risks the relationship; building it wastes a sprint you do not have.`,
    options: [
      { id: 'a', label: 'Build it; they outrank you, and arguing with an executive over their own idea is not a fight worth having.' },
      { id: 'b', label: 'Refuse outright and tell them the data says no; your job is to defend the roadmap.' },
      { id: 'c', label: 'Share your evidence, understand the outcome they actually want, and propose a cheaper test or alternative that gets there faster.' },
      { id: 'd', label: 'Agree in the meeting, then quietly deprioritize it and hope they lose interest.' },
    ],
    bestOptionId: 'c',
    why: 'Influence without authority is the core PM skill: you change the decision by changing the shared understanding, not by pulling rank you do not have or capitulating to rank you cannot move. Surface the evidence, get to the underlying goal, and offer a faster or cheaper path to it. Caving (a) ships a known waste; flat refusal (b) spends trust and rarely persuades; agreeing then sandbagging (d) is dishonest and destroys credibility when discovered.',
    principle: 'Lead with shared goals and evidence, not rank',
  },
  {
    id: 'stakeholder-influence-eng-disagree',
    competency: 'stakeholder-influence',
    title: 'Engineering disagrees with the plan',
    situation: (ctx) =>
      `Your tech lead pushes back hard on the next ${ctx.product} feature, arguing the approach is risky and the sequencing is wrong. You believe in the plan and have the authority to direct it. The team is watching how you handle the disagreement.`,
    options: [
      { id: 'a', label: 'Direct the team to proceed as planned; you own the roadmap and cannot let every objection stall it.' },
      { id: 'b', label: 'Hear out the specific risks, separate the technical concerns from the prioritization call, and adjust the plan where the tech lead is right.' },
      { id: 'c', label: 'Defer entirely to the tech lead; engineering knows best on anything technical.' },
      { id: 'd', label: 'Escalate to your manager to settle who is right so you do not have to.' },
    ],
    bestOptionId: 'b',
    why: 'A strong objection from the people closest to the build is signal, not insubordination. The judgment is to disagree well: take the technical risks seriously, keep ownership of the prioritization, and change your mind where the evidence warrants. Overriding reflexively (a) wastes your best source of risk information and signals you do not listen; abdicating (c) confuses technical input with product ownership; escalating first (d) skips the conversation that builds trust.',
    principle: 'Disagree and commit; treat objections as signal',
  },

  /* ------------------------------------------------------------------
     METRICS INTERPRETATION
     ------------------------------------------------------------------ */
  {
    id: 'metrics-correlation-causation',
    competency: 'metrics',
    title: 'Correlation is not causation',
    situation: (ctx) =>
      `Analysis shows ${ctx.user}s who use a particular feature in your ${ctx.product} retain far better than those who do not. A teammate proposes pushing every user into that feature to lift retention. The users who adopted it may simply be your most engaged ones already.`,
    options: [
      { id: 'a', label: 'Push everyone into the feature; the retention gap is large and the correlation is unambiguous.' },
      { id: 'b', label: 'Treat it as a hypothesis, then run a controlled experiment to see whether the feature actually causes retention before forcing adoption.' },
      { id: 'c', label: 'Dismiss the finding; retention is too complex to ever attribute to one feature.' },
      { id: 'd', label: 'Make the feature mandatory for new users only, since they have no habits yet.' },
    ],
    bestOptionId: 'b',
    why: 'A correlation between feature use and retention does not mean the feature drives retention; the engaged users may have self-selected into both. The move is to treat it as a hypothesis and test causation with a controlled experiment before betting the roadmap on it. Acting on the raw correlation (a, d) risks forcing a feature that does nothing while degrading the experience; dismissing it outright (c) throws away a real lead worth testing.',
    principle: 'Correlation vs causation; test before you bet',
  },
  {
    id: 'metrics-vanity-metric',
    competency: 'metrics',
    title: 'The number that only goes up',
    situation: (ctx) =>
      `A leader wants the team to optimize total registered accounts on your ${ctx.product}, a number that only ever goes up and looks great in board decks. Meanwhile, the share of ${ctx.user}s who come back each week has been flat. You can chase either.`,
    options: [
      { id: 'a', label: 'Optimize total registered accounts; it is the metric leadership is asking for and it reliably climbs.' },
      { id: 'b', label: 'Steer toward an actionable metric like weekly active share, and reframe registrations as context rather than the goal.' },
      { id: 'c', label: 'Track both equally and let the team optimize whichever moves more easily this quarter.' },
      { id: 'd', label: 'Stop reporting registrations entirely so no one is tempted by it.' },
    ],
    bestOptionId: 'b',
    why: 'Total registrations is a vanity metric: it only goes up, rarely reflects real value, and cannot tell you whether a change helped. An actionable metric like weekly active share can move in both directions and ties to whether users keep getting value. The job is to steer the team toward the metric that informs decisions. Chasing the vanity number (a, c) optimizes the scoreboard, not the product; hiding it (d) avoids the metric instead of reframing it.',
    principle: 'Actionable over vanity metrics',
  },

  /* ------------------------------------------------------------------
     BUILD VS BUY
     ------------------------------------------------------------------ */
  {
    id: 'build-buy-commodity',
    competency: 'build-buy',
    title: 'Build it or buy it',
    situation: (ctx) =>
      `Your ${ctx.product} needs a capability that is essentially a solved, commodity problem, available off the shelf from mature vendors. Engineering is keen to build it in-house because it would be a fun project. It is not part of what makes your product distinctive.`,
    options: [
      { id: 'a', label: 'Build it in-house; owning the whole stack avoids vendor lock-in and keeps the team sharp.' },
      { id: 'b', label: 'Buy the off-the-shelf solution and spend the saved engineering time on what actually differentiates the product.' },
      { id: 'c', label: 'Always buy whenever a vendor exists; building anything yourself is wasted effort.' },
      { id: 'd', label: 'Build a slightly different version in-house so it is technically custom and not a commodity.' },
    ],
    bestOptionId: 'b',
    why: 'Build what differentiates you; buy what does not. Engineering time is your scarcest resource, so spending it to re-create a commodity is a real opportunity cost paid against your actual edge. Buy the solved problem and aim the team at the differentiated work. Building for fun (a, d) burns scarce capacity on undifferentiated work; an absolute always-buy rule (c) ignores that some capabilities genuinely are your moat and should be owned.',
    principle: 'Build your differentiation, buy the commodity',
  },
  {
    id: 'build-buy-core-dependency',
    competency: 'build-buy',
    title: 'A vendor for the core',
    situation: (ctx) =>
      `A vendor offers a fast, cheap way to deliver the single capability that is the heart of your ${ctx.product} and your main differentiation. Using it would ship months sooner. It would also put the thing your product is best at behind someone else's roadmap and pricing.`,
    options: [
      { id: 'a', label: 'Use the vendor; shipping months sooner almost always beats building it yourself.' },
      { id: 'b', label: 'Build the core capability in-house even though it is slower, because owning your differentiation is worth the cost.' },
      { id: 'c', label: 'Use the vendor permanently; if it works today there is no reason to ever bring it in-house.' },
      { id: 'd', label: 'Use the vendor and avoid building any in-house competence in this area to keep the team lean.' },
    ],
    bestOptionId: 'b',
    why: 'The same build-versus-buy lens cuts the other way for your core: when a capability is your differentiation, renting it puts your competitive edge behind another company\'s priorities, price changes, and outages. Speed is real, but strategic control of the thing you win on is worth building for. Renting the core (a, c, d) trades a short-term gain for long-term dependence on exactly the part you cannot afford to lose control of.',
    principle: 'Own your core; do not rent your moat',
  },

  /* ------------------------------------------------------------------
     ETHICS / DARK-PATTERN CALL
     ------------------------------------------------------------------ */
  {
    id: 'ethics-hard-to-cancel',
    competency: 'ethics',
    title: 'The hard-to-cancel flow',
    situation: (ctx) =>
      `Growth proposes making it noticeably harder to cancel on your ${ctx.product}: extra confirmation steps, a hidden link, and a required phone call. Early tests show it would measurably reduce churn this quarter. Some ${ctx.user}s would stay only because leaving is a hassle.`,
    options: [
      { id: 'a', label: 'Ship it; the churn reduction is real and measurable, and competitors use the same playbook.' },
      { id: 'b', label: 'Refuse the friction pattern and instead reduce churn by fixing the reasons users leave, keeping cancellation easy.' },
      { id: 'c', label: 'Ship a milder version of the friction so it is technically less aggressive but still works.' },
      { id: 'd', label: 'Ship it as a time-limited experiment and revisit the ethics later if anyone complains.' },
    ],
    bestOptionId: 'b',
    why: 'Retention that depends on trapping users is a dark pattern: it borrows against trust and brand, invites regulatory and reputational risk, and masks the real problem instead of fixing it. The durable move is to make leaving easy and earn the stay by addressing why users churn. A measurable short-term win (a, c, d) does not justify a deceptive design; "competitors do it" and "softer version" are rationalizations, not a defense.',
    principle: 'Earn retention; never trap the user',
  },
  {
    id: 'ethics-default-opt-in',
    competency: 'ethics',
    title: 'The pre-checked box',
    situation: (ctx) =>
      `To grow a new data-sharing program, a teammate suggests defaulting every ${ctx.user} into it with a pre-checked box most people will not notice. It is technically legal in your market and would boost enrolment dramatically. Users who understood it might well decline.`,
    options: [
      { id: 'a', label: 'Use the pre-checked default; it is legal, it works, and users can always opt out later.' },
      { id: 'b', label: 'Default to opt-out and make the value clear, so anyone who enrols is genuinely choosing it.' },
      { id: 'c', label: 'Pre-check the box but bury a clear explanation in the terms of service to stay defensible.' },
      { id: 'd', label: 'Pre-check it for new users only, since they have not formed an opinion yet.' },
    ],
    bestOptionId: 'b',
    why: 'Engineering consent through a default people will not notice is a dark pattern even when it is legal: it manufactures agreement the user did not actually give. Real consent means defaulting off and making the value clear enough that a yes is a true choice. Exploiting the default (a, c, d) trades durable trust for an enrolment number, and "legal" is a floor, not the bar a product you want people to trust should clear.',
    principle: 'Informed consent over engineered defaults',
  },

  /* ------------------------------------------------------------------
     SHIP NOW VS POLISH
     ------------------------------------------------------------------ */
  {
    id: 'ship-polish-learn-faster',
    competency: 'ship-polish',
    title: 'Ship now or polish first',
    situation: (ctx) =>
      `A new ${ctx.product} feature works and solves the core problem, but it is rough in places only attentive ${ctx.user}s would notice. You could ship now and learn from real usage, or spend two more weeks polishing before anyone sees it. The core value is already there and nothing is broken or embarrassing.`,
    options: [
      { id: 'a', label: 'Polish for two weeks first; shipping anything rough cheapens the product and the brand.' },
      { id: 'b', label: 'Ship now to start learning from real usage, then let that evidence direct where the polish actually matters.' },
      { id: 'c', label: 'Ship now and treat the feature as finished; polish is a luxury you rarely get back to.' },
      { id: 'd', label: 'Keep iterating privately until the team agrees it is perfect, then launch.' },
    ],
    bestOptionId: 'b',
    why: 'When the core works and nothing is embarrassing, shipping buys you the most valuable thing: real usage that tells you where polish actually pays off, instead of guessing. Polishing first (a, d) risks two weeks spent perfecting things users never notice while you learn nothing; shipping and walking away (c) abandons the feature before the usage data can guide the work that matters.',
    principle: 'Ship to learn, then polish where it counts',
  },
  {
    id: 'ship-polish-first-impression',
    competency: 'ship-polish',
    title: 'When rough is too rough',
    situation: (ctx) =>
      `A flagship ${ctx.product} feature is your one shot at a first impression with a wave of new ${ctx.user}s arriving for a launch. It mostly works, but a visible part feels broken and would be the first thing they touch. Shipping on time means they meet it rough; a short slip means they meet it solid.`,
    options: [
      { id: 'a', label: 'Ship on time regardless; a date is a date, and you can fix the rough part right after launch.' },
      { id: 'b', label: 'Slip briefly to fix the visibly broken part, because a botched first impression with new users is hard to undo.' },
      { id: 'c', label: 'Ship on time but hide the rough part behind a flag so new users cannot reach it at all.' },
      { id: 'd', label: 'Cancel the launch entirely until the whole feature is flawless end to end.' },
    ],
    bestOptionId: 'b',
    why: 'Ship-to-learn does not mean ship anything: when the rough edge is visible, central, and meeting users at a one-shot first impression, the cost of shipping broken outweighs the cost of a short slip. First impressions with a new audience are expensive to reverse, so a brief slip to land it solid is the right tradeoff. Shipping broken (a) spends a moment you will not get again; hiding the core (c) ships a hollow launch; cancelling for perfection (d) overcorrects and forfeits the moment entirely.',
    principle: 'Match the quality bar to the stakes of the moment',
  },
];
