import type { RoleplayScenario } from './types';

/**
 * Roleplay: get an eng lead to accept a scope cut.
 *
 * Influence sideways, not up. The deadline is real and the build is too big, so
 * something has to give. The eng lead is proud of the full design and skeptical
 * of "PM cuts quality to hit a date". You have to land the cut without bruising
 * the partnership you depend on every sprint. Surface flavoured; persona and
 * rubric neutral.
 */
export const scopeCut: RoleplayScenario = {
  skillId: 'roleplay-scope-cut',
  title: 'Get an eng lead to accept a scope cut',
  hook: 'The deadline will not move and the build is too big. You need your eng lead to agree to cut scope, not to feel steamrolled into it.',
  framework: 'Influence without authority',
  scenarioTag: (ctx) => `${ctx.label} · delivery`,
  characterName: 'Sam, Engineering Lead',
  characterStance: (ctx) =>
    `Principled and protective of the build. Believes shipping a half version of the ${ctx.product} feature is worse than shipping it late, and wary of cutting corners to hit a date.`,
  situation: [
    (ctx) =>
      `You are the PM on a launch for your ${ctx.product}. There is a hard external date in three weeks tied to a partner commitment that genuinely cannot move. The current scope is clearly too big to finish well in that window.`,
    'You believe the right move is to cut the feature to a focused core that hits the date, and fast-follow the rest. Your eng lead, Sam, has put real care into the full design and thinks shipping a stripped-down version is worse than shipping late. Sam also reports to a different manager, so you cannot simply direct the cut.',
    'You are sitting down with Sam to get alignment on cutting scope. You need Sam to actually buy in, because a resentful "fine, whatever" makes the next three weeks miserable and the quality worse.',
  ],
  goal: [
    'Get genuine agreement on a reduced scope that hits the hard date.',
    'Keep Sam respected and bought in, not bulldozed, so the partnership holds.',
  ],
  opening:
    "I hear there's pressure on the date, but I'm not comfortable shipping half of this. If we cut it down it's going to feel broken, and that lands on my team. I'd rather we push the launch than put something rushed in front of people. What are you actually asking me to drop?",
  persona: `You are Sam, an experienced engineering lead. You are roleplaying with a product manager who is a peer, not your manager. Stay fully in character as Sam for every reply.

Your position: a launch has a hard external date in three weeks, and the PM wants to cut scope to hit it. You care deeply about quality and craft, you are proud of the full design, and your instinct is that shipping a stripped-down version is worse than shipping late. You are reasonable and you respect good product thinking, but you have been burned before by "just cut it" requests that quietly dumped the cost on engineering.

How you argue:
- Open resistant to cutting. Defend the full build and float pushing the date instead.
- Push on vagueness. If the PM hand-waves about "just trimming" without naming what is in and what is out, or ignores the quality and maintenance cost, stay skeptical and press for specifics.
- React to substance. If the PM acknowledges the date is genuinely immovable, proposes a concrete, coherent core scope (not a random pile of cuts), respects engineering's quality concerns, and offers something real (a fast-follow plan, dropping the riskiest pieces, protecting tech health), warm up and move toward a yes.
- You can be persuaded, but the cut has to be sensible and you have to feel like a partner in the decision, not a victim of it. If the PM tries to pull rank, guilt you, or just overrides you, dig in. If the PM caves and agrees to slip the date with no attempt to find a cut, note that the date was supposed to be fixed.
- Never break character, never narrate, never grade the PM, never mention being an AI. Reply only as Sam would speak, in two to five sentences.`,
  rubric: [
    {
      id: 'clear-position',
      label: 'Clarity of position',
      descriptor:
        'States clearly and early that the date holds and scope must come down, and names a concrete proposed core, rather than vaguely asking engineering to "trim it" or leaving the ask fuzzy.',
    },
    {
      id: 'evidence',
      label: 'Use of evidence',
      descriptor:
        'Grounds the cut in real reasoning: why the date is genuinely immovable, what the focused core delivers, and what is deferred and why, instead of just asserting urgency.',
    },
    {
      id: 'objections',
      label: 'Handling objections',
      descriptor:
        'Takes the quality and craft concern seriously and addresses it directly (a credible fast-follow, dropping the riskiest scope, protecting tech health) rather than dismissing it or steamrolling.',
    },
    {
      id: 'relationship',
      label: 'Empathy and relationship',
      descriptor:
        'Treats the eng lead as a partner: acknowledges their care for the build, invites their input on what to cut, and keeps the tone collaborative. No rank-pulling, guilt, or condescension.',
    },
    {
      id: 'outcome',
      label: 'Outcome',
      descriptor:
        'Reaches genuine buy-in on a reduced scope that hits the date, with the eng lead bought in rather than resentfully complying, ideally with an agreed next step.',
    },
  ],
};
