import type { ArtifactContent } from './types';

/**
 * Artifact: a product strategy memo for the "Product Strategy Stack" skill.
 *
 * A single freeform field on purpose: a strategy memo is a connected argument,
 * not a form, and a senior PM is expected to structure it themselves. The rubric
 * supplies the structure (diagnosis, choice, coherent actions) so the bar is
 * clear without pre-filling sections for them.
 */
export const strategyMemo: ArtifactContent = {
  skillId: 'strategy-memo',
  title: 'Product strategy memo',
  hook: 'Strategy is a small set of hard choices, not a list of everything you could do. A good memo makes the choice and the logic behind it impossible to misread.',
  framework: 'Rumelt: diagnosis, guiding policy, coherent action',
  scenarioTag: (ctx) => `${ctx.label} · strategy`,
  brief: [
    (ctx) =>
      `You lead product for a ${ctx.product} that grew fast for two years and has now plateaued. Growth is flat, a better-funded competitor is winning head-to-head deals, and the team is spread thin across a dozen half-built bets.`,
    'Your VP has asked for a one-page strategy memo to align the team for the next two quarters. The whole point is focus: where will you play, where will you NOT play, and why.',
    'Write the memo. Make a clear strategic choice and defend it. A memo that tries to win everywhere is the failure mode to avoid.',
  ],
  whatToProduce: [
    'A diagnosis: the one or two things that actually explain the plateau',
    'A clear strategic choice (a focused bet) and, just as important, what you will stop or not do',
    'A short set of coherent actions that all reinforce that choice',
    'The key assumption or risk the strategy is betting on, named honestly',
  ],
  fields: [
    {
      key: 'memo',
      label: 'The memo',
      placeholder:
        'Open with the diagnosis (what is really going on), state the choice (where you will focus and what you will drop), then 3-4 actions that all point the same way. Close with the bet you are making and the main risk.',
      rows: 16,
      hint: 'Diagnosis, then one hard choice, then actions that reinforce it. Name what you are NOT doing.',
    },
  ],
  rubric: [
    {
      id: 'diagnosis',
      label: 'Honest diagnosis',
      descriptor:
        'Identifies the real underlying cause of the plateau (competition, weak retention, lack of focus) rather than restating symptoms. Shows insight, not a status update.',
    },
    {
      id: 'clear-choice',
      label: 'A real, focused choice',
      descriptor:
        'Commits to a specific where-to-play / where-to-win bet and explicitly names what will be dropped or deprioritized. A strategy that keeps every option open scores low here.',
    },
    {
      id: 'coherent-actions',
      label: 'Coherent actions',
      descriptor:
        'Proposes a small set of actions that visibly reinforce the chosen bet. The actions hang together; none contradicts the choice or reads as a pet project bolted on.',
    },
    {
      id: 'named-bet',
      label: 'Named bet and risk',
      descriptor:
        'States the key assumption the strategy depends on and the main risk if it is wrong, honestly. Shows the author knows where the strategy could break.',
    },
  ],
  graderInstructions:
    'Reward focus and the courage to say no to things. The classic failure is a "strategy" that is really a wish list with no trade-offs; score clear-choice low when nothing is given up. A vivid diagnosis that just renames the symptoms (for example, "the problem is growth is flat") is not insight.',
};
