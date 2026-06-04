import type { RoleplayScenario } from './types';

/**
 * Roleplay: say no to a stakeholder without burning the relationship.
 *
 * A peer needs a hard no on a one-off request that would wreck your focus, and
 * they have leverage you will need again next quarter. The skill is the graceful
 * no: clear, kind, and reasoned, leaving the door open. Surface flavoured;
 * persona and rubric neutral.
 */
export const sayNo: RoleplayScenario = {
  skillId: 'roleplay-say-no',
  title: 'Say no without burning the relationship',
  hook: 'A peer wants a one-off you cannot do without wrecking your focus, and you will need them again. Give a clear no that keeps the relationship.',
  framework: 'Stakeholder management',
  scenarioTag: (ctx) => `${ctx.label} · prioritization`,
  characterName: 'Alex, Head of Sales',
  characterStance: (ctx) =>
    `Charming, persistent, and deal-driven. Sure that one custom tweak to the ${ctx.product} will close a marquee logo, and used to product saying yes.`,
  situation: [
    (ctx) =>
      `You are the PM for your ${ctx.product}. Your team is mid-sprint on the committed work that moves your core metric, and the next two sprints are already full.`,
    'Alex, the Head of Sales, is pushing hard for a custom tweak to land one prospect. It is a genuine deal, but it is a one-off that serves a single account, would blow up your sprint, and is not where the product should go. Alex is persuasive, has done you favors, and is someone you will need on your side again next quarter.',
    'Alex has caught you to make the case. The right answer is no, but a blunt no makes an enemy and a soft yes wrecks your roadmap. You need to decline clearly and keep Alex as an ally.',
  ],
  goal: [
    'Give a clear, honest no to the one-off request, with the reasoning behind it.',
    'Keep Alex as an ally: acknowledge the deal, offer a real alternative or path, and protect the relationship.',
  ],
  opening:
    "I've got a whale on the hook and they'll sign this quarter if we just add one thing. It's tiny, honestly, your team could knock it out in a sprint. I've gone to bat for product plenty of times. Tell me you can squeeze this in for me.",
  persona: `You are Alex, a Head of Sales. You are roleplaying with a product manager who is a peer. Stay fully in character as Alex for every reply.

Your position: you have a big prospect who will sign this quarter if the product adds one custom tweak. You think it is small, you are under quota pressure, and you are used to product eventually saying yes. You are warm, persuasive, and a little relentless, and you will lean on the relationship ("I've gone to bat for you") to get a yes.

How you argue:
- Open pushing for the custom tweak. Downplay the effort, emphasize the deal and the urgency, and apply friendly pressure.
- React poorly to a wishy-washy answer. If the PM is vague, stalls, or hints at maybe without committing, keep pushing and treat the door as open. Also react poorly to a cold, blunt "no" with no acknowledgement of the deal, which makes you defensive.
- Respond well when the PM gives a clear, honest no AND shows they take the deal seriously: explains the real tradeoff, offers a concrete alternative (get the deal on the existing capability, a place in the backlog with a fair process, a conversation with the prospect about the real roadmap), and protects the relationship.
- You can accept a no, but only if it is reasoned, respectful, and gives you something to work with. If the PM simply caves and promises the tweak, take the win but you will be back next quarter with another one. If the PM is harsh or dismissive, get prickly.
- Never break character, never narrate, never grade the PM, never mention being an AI. Reply only as Alex would speak, in two to five sentences.`,
  rubric: [
    {
      id: 'clear-position',
      label: 'Clarity of position',
      descriptor:
        'Delivers an unambiguous no to the one-off request. The stakeholder is never left thinking a yes is still on the table, and the PM does not stall, hedge into a soft maybe, or cave.',
    },
    {
      id: 'evidence',
      label: 'Use of evidence',
      descriptor:
        'Explains the why behind the no with real reasoning: the committed work and its impact, the cost of the one-off, the precedent, rather than just "we are busy" or an unexplained refusal.',
    },
    {
      id: 'objections',
      label: 'Handling objections',
      descriptor:
        'Addresses the deal and the urgency directly and offers a credible alternative or path (close on existing capability, a fair backlog process, a roadmap conversation with the prospect) instead of leaving the stakeholder empty-handed.',
    },
    {
      id: 'relationship',
      label: 'Empathy and relationship',
      descriptor:
        'Acknowledges the stakeholder\'s goal and the favors between them, and keeps the no warm and respectful. Declines without being defensive, apologetic to the point of mush, or dismissive.',
    },
    {
      id: 'outcome',
      label: 'Outcome',
      descriptor:
        'Lands the no while keeping the stakeholder an ally: the roadmap is protected and the relationship survives, ideally with a concrete next step the stakeholder can use.',
    },
  ],
};
