import type { ArtifactContent } from './types';

/**
 * Artifact: a North Star metric plus its input-metrics tree for the
 * "North Star & OKRs" skill. The structured fields walk the learner from the
 * single North Star down to the 3-4 inputs teams can actually move, then force
 * the honesty check: name a way this metric could be gamed. A North Star that
 * cannot be gamed-checked usually is not measuring real value.
 */
export const northStarTree: ArtifactContent = {
  skillId: 'north-star-tree',
  title: 'North Star + input metrics',
  hook: 'A North Star metric captures the value customers get, in one number, and breaks down into a few inputs teams can actually move. Pick the wrong one and you optimize the wrong company.',
  framework: 'North Star + input metrics tree',
  scenarioTag: (ctx) => `${ctx.label} · metrics`,
  brief: [
    (ctx) =>
      `Leadership at your ${ctx.product} wants a single North Star metric to align the company, instead of every team chasing its own dashboard. Right now Sales watches new logos, Growth watches signups, and the product team watches weekly active users, and they pull in different directions.`,
    (ctx) =>
      `Your job: propose a North Star that reflects the real value a ${ctx.user} gets, then break it into the 3-4 input metrics teams can influence. Avoid a pure vanity metric (raw signups, registered accounts) that can rise while customers are getting less value.`,
    'Write it up so leadership can adopt it and so a team could see how their work rolls up.',
  ],
  whatToProduce: [
    'A single proposed North Star metric, defined precisely (what counts, over what period)',
    'Why it represents real delivered value, not vanity',
    'The 3-4 input metrics that drive it, and roughly who owns each',
    'One honest way the metric could be gamed, and how you would watch for it',
  ],
  fields: [
    {
      key: 'northstar',
      label: 'North Star metric',
      placeholder:
        'State it precisely: what action, by whom, counted how, over what window (e.g. "weekly active teams that complete a core workflow at least 3 times").',
      rows: 4,
      hint: 'A precise definition beats a catchy name.',
    },
    {
      key: 'value',
      label: 'Why it reflects real value',
      placeholder:
        'Argue why this number going up means customers are genuinely better off, not just that more accounts exist.',
      rows: 4,
    },
    {
      key: 'inputs',
      label: 'Input metrics (3-4)',
      placeholder:
        'The handful of metrics that drive the North Star and that teams can actually move. Note roughly who owns each (e.g. breadth, depth, frequency, retention).',
      rows: 5,
    },
    {
      key: 'gaming',
      label: 'How it could be gamed',
      placeholder:
        'Name one way a team could move this number WITHOUT creating real value, and what you would watch to catch it.',
      rows: 3,
    },
  ],
  rubric: [
    {
      id: 'value-not-vanity',
      label: 'Value, not vanity',
      descriptor:
        'The proposed North Star captures realized customer value (a meaningful repeated action or outcome) rather than a vanity count like raw signups or registered users that can rise as value falls.',
    },
    {
      id: 'precise-definition',
      label: 'Precise definition',
      descriptor:
        'Defines exactly what counts: the action, the subject, the counting method, and the time window. Someone could implement the metric from the definition without guessing.',
    },
    {
      id: 'input-tree',
      label: 'Coherent input tree',
      descriptor:
        'Breaks the North Star into 3-4 input metrics that plausibly drive it and that teams can move, with a sense of ownership. The inputs add up to the North Star rather than being a random list.',
    },
    {
      id: 'gaming-check',
      label: 'Gaming check',
      descriptor:
        'Identifies at least one realistic way the metric could be gamed or could mislead, plus a guardrail or counter-metric to watch. Shows the metric was pressure-tested.',
    },
  ],
  graderInstructions:
    'The single most important judgment is value-vs-vanity: a North Star of "total registered users" or "signups" should score low even if everything else is tidy, because it can climb while customers churn. Reward precise, implementable definitions and an input tree whose parts genuinely compose into the North Star. Credit a thoughtful gaming check; that is what separates a real operator from a slogan.',
};
