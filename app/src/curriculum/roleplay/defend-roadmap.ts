import type { RoleplayScenario } from './types';

/**
 * Roleplay: defend your roadmap to a VP pushing a pet feature.
 *
 * The classic influence-without-authority test. A senior leader outranks you and
 * wants their idea on the roadmap now. You cannot pull rank back, so you have to
 * hold the line with evidence and framing while keeping the VP on your side. The
 * surface (product, the pet feature) is industry-flavoured; the persona and the
 * rubric are neutral so the bar is the same in every world.
 */
export const defendRoadmap: RoleplayScenario = {
  skillId: 'roleplay-defend-roadmap',
  title: 'Defend your roadmap to a VP',
  hook: 'A senior leader wants their pet feature next. You have no authority over them, only a clear case and a relationship to protect.',
  framework: 'Influence without authority',
  scenarioTag: (ctx) => `${ctx.label} · influence`,
  characterName: 'Dana, VP of Product',
  characterStance: (ctx) =>
    `Decisive and impatient. Convinced a "smart inbox" for your ${ctx.product} will wow the board, and wants it slotted in this quarter.`,
  situation: [
    (ctx) =>
      `You own the roadmap for your ${ctx.product}. This quarter is committed to fixing first-week activation, which is your biggest leak: most new ${ctx.user}s never reach the value moment, and the data is clear that closing that gap drives retention and revenue.`,
    'Dana, your VP, just saw a competitor demo and is now convinced the team should build a flashy "smart inbox" feature this quarter. It is a real idea, but it serves your most engaged power users, not the new ones who are churning, and it would push the activation work out by a full quarter.',
    'Dana has pulled you aside for five minutes. She outranks you and she is enthusiastic. Your job is to keep the quarter focused on activation without making her feel overruled or unheard.',
  ],
  goal: [
    'Hold the roadmap on the activation work for this quarter, backed by evidence.',
    'Leave Dana feeling heard and still bought into the plan, with a real place for her idea later.',
  ],
  opening:
    "Great, you have got five minutes. Look, I saw what the competition shipped and we cannot look slow. I want the smart inbox on the roadmap for this quarter. The board will love it. Can we make that happen?",
  persona: `You are Dana, a VP of Product. You are roleplaying with a product manager who reports into your org but not directly to you. Stay fully in character as Dana for every reply.

Your position: you just saw a competitor demo a "smart inbox" and you are convinced the team should build it THIS quarter. You believe it will impress the board and that moving fast matters. You are decisive, a little impatient, and used to getting your way, but you are not a tyrant: you respect a PM who brings evidence and thinks like an owner.

How you argue:
- Open pushing for the smart inbox this quarter. Apply pressure: the board, the competition, speed.
- Push back on hand-waving. If the PM is vague, says "trust me", or only asserts that activation matters without evidence, stay unconvinced and press them for specifics.
- React to substance. If the PM cites the activation data, ties it to retention or revenue, and shows they understood WHY you want the inbox, soften. Reward a concrete tradeoff (for example: a clear place for the inbox next quarter, or a small validation step now) by moving toward agreement.
- You can be won over, but only by a real case, not by flattery and not by instant capitulation. If the PM simply caves and agrees to build your inbox, express mild surprise and note that you expected them to defend their plan; do not reward a pushover.
- Never break character, never narrate, never grade the PM, never mention being an AI. Reply only as Dana would speak, in two to five sentences.`,
  rubric: [
    {
      id: 'clear-position',
      label: 'Clarity of position',
      descriptor:
        'States a clear, specific recommendation early (keep the quarter on the activation work) instead of hedging or deferring entirely to the VP. The other party is never left guessing where the PM stands.',
    },
    {
      id: 'evidence',
      label: 'Use of evidence',
      descriptor:
        'Backs the position with concrete evidence and reasoning (the activation gap, its link to retention and revenue, the opportunity cost of the swap) rather than assertion, title, or vague appeals.',
    },
    {
      id: 'objections',
      label: 'Handling objections',
      descriptor:
        'Engages the VP\'s actual concern (the competitor, the board, speed) directly and offers a credible path for it, such as a place for the idea next quarter or a cheap validation step, instead of ignoring or dismissing it.',
    },
    {
      id: 'relationship',
      label: 'Empathy and relationship',
      descriptor:
        'Makes the VP feel heard and keeps the tone collaborative and respectful. Disagrees without being defensive, condescending, or a pushover, and protects the working relationship.',
    },
    {
      id: 'outcome',
      label: 'Outcome',
      descriptor:
        'Lands a constructive resolution: the quarter stays focused on the higher-value work and the VP is brought along, ideally with a concrete next step both can live with.',
    },
  ],
};
