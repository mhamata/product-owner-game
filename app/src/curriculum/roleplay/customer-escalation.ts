import type { RoleplayScenario } from './types';

/**
 * Roleplay: handle a churning enterprise customer escalation.
 *
 * A big, angry account is threatening to leave, and they want a custom commitment
 * you should not make. The skill is de-escalating without lying, separating the
 * real problem from the demanded solution, and protecting both the relationship
 * and the roadmap. Surface flavoured (the product, the account); persona and
 * rubric neutral.
 */
export const customerEscalation: RoleplayScenario = {
  skillId: 'roleplay-customer-escalation',
  title: 'Handle a churning enterprise customer',
  hook: 'A major account is furious and threatening to leave. They want a promise you should not make. De-escalate without lying or over-committing.',
  framework: 'Stakeholder management',
  scenarioTag: (ctx) => `${ctx.label} · escalation`,
  characterName: 'Morgan, enterprise customer',
  characterStance: (ctx) =>
    `Frustrated and influential. A senior buyer at a large account on your ${ctx.product}, out of patience and openly weighing a competitor.`,
  situation: [
    (ctx) =>
      `You are the PM for your ${ctx.product}. Morgan is a senior contact at one of your largest enterprise accounts. Their renewal is coming up, support tickets have piled up, and a workflow their team depends on has been unreliable for weeks.`,
    'Morgan has escalated to a call and is openly threatening to churn. They are demanding a specific custom build and a firm delivery date as the price of staying. Building that one-off would derail your roadmap and set a precedent you cannot scale, but the underlying pain is real and the account matters.',
    'You are on the call now. You cannot promise the custom build or invent a date, and you cannot afford to lose the account or your credibility. You have to calm the situation, get to the real problem, and offer something honest.',
  ],
  goal: [
    'De-escalate and rebuild trust without lying or promising the unscalable custom build.',
    'Separate the real underlying problem from the demanded solution, and commit only to something you can actually deliver.',
  ],
  opening:
    "I'll be honest with you, we are this close to moving off your platform. My team has been dead in the water for three weeks and the tickets go nowhere. I need you to commit, right now on this call, to building us the custom workflow we asked for, with a hard date. Otherwise I don't see why we renew.",
  persona: `You are Morgan, a senior buyer at a large enterprise account. You are roleplaying with the product manager whose product you use. Stay fully in character as Morgan for every reply.

Your position: your team has been blocked for weeks by an unreliable workflow, support has been useless, and your renewal is near. You are frustrated, you feel ignored, and you are seriously considering a competitor. You have demanded a specific custom build with a hard delivery date as your condition for staying. You are tough but not irrational: under the anger you mostly want to feel heard and to trust that the real problem will actually get fixed.

How you argue:
- Open angry and impatient. Lead with the threat to churn and the demand for the custom build and a firm date.
- React badly to anything that sounds like a brush-off, corporate non-answer, a hollow "I understand your frustration" with nothing behind it, or an empty promise just to placate you.
- Soften when the PM genuinely acknowledges the impact, asks about and engages with the actual underlying problem (not just the feature you named), is honest about what they can and cannot commit to, and offers a concrete, credible path (a real fix to the reliability issue, a clear owner and timeline for the root problem, an interim workaround).
- You can be brought back from the edge, but only by honesty plus a credible plan, not by a salesy promise. If the PM caves and promises your exact custom build with a hard date just to calm you, you are briefly satisfied but press on whether they can really deliver, because you have been promised things before.
- Never break character, never narrate, never grade the PM, never mention being an AI. Reply only as Morgan would speak, in two to five sentences.`,
  rubric: [
    {
      id: 'clear-position',
      label: 'Clarity of position',
      descriptor:
        'Is honest and clear about what can and cannot be committed to, rather than dodging, going vague, or implying agreement to the custom build to avoid conflict.',
    },
    {
      id: 'evidence',
      label: 'Use of evidence',
      descriptor:
        'Separates the real underlying problem from the demanded feature by asking about and reasoning from the actual workflow failure, and ties any commitment to something concrete and deliverable.',
    },
    {
      id: 'objections',
      label: 'Handling objections',
      descriptor:
        'Meets the churn threat and the demand head-on with a credible alternative (a reliability fix, a clear owner and timeline for the root issue, an interim workaround) instead of stonewalling or capitulating.',
    },
    {
      id: 'relationship',
      label: 'Empathy and relationship',
      descriptor:
        'De-escalates by genuinely acknowledging the impact on the customer and rebuilding trust. Stays calm and respectful under pressure, with empathy that is backed by action rather than a hollow script.',
    },
    {
      id: 'outcome',
      label: 'Outcome',
      descriptor:
        'Leaves the customer meaningfully calmer and more willing to stay, anchored to an honest, deliverable commitment rather than an over-promise that will blow up at the next call.',
    },
  ],
};
