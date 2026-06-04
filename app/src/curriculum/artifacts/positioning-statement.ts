import type { ArtifactContent } from './types';

/**
 * Artifact: a positioning statement for the "Positioning Basics" skill.
 *
 * Built on the classic Moore template (For / Who / Our product is / That /
 * Unlike / Our product). The first field is the statement in that shape; the
 * second asks the learner to defend the one claim that makes or breaks it: the
 * differentiation. A positioning statement that could describe any competitor is
 * the failure mode the rubric targets.
 */
export const positioningStatement: ArtifactContent = {
  skillId: 'positioning-statement',
  title: 'Positioning statement',
  hook: 'Positioning is the promise that makes a specific customer choose you over the alternative. If your statement could describe a competitor word for word, you have not positioned anything.',
  framework: 'Geoffrey Moore positioning template',
  scenarioTag: (ctx) => `${ctx.label} · positioning`,
  brief: [
    (ctx) =>
      `Your ${ctx.product} is preparing to relaunch. In user calls, ${ctx.user}s like it but cannot explain what makes it different from two well-known competitors, and the marketing site reads like everyone else's: "powerful, simple, all-in-one".`,
    'Write a single positioning statement the whole company can rally behind, then defend the differentiation that makes it true.',
    'The test: a competitor should NOT be able to lift your statement and use it unchanged.',
  ],
  whatToProduce: [
    'A positioning statement naming the target customer, their need, your category, and your key differentiator',
    'A target that is a specific segment, not "everyone"',
    'A differentiator that is real and hard for the obvious competitor to claim too',
    'A short defense of why that differentiator actually matters to this customer',
  ],
  fields: [
    {
      key: 'statement',
      label: 'Positioning statement',
      placeholder:
        'For [target customer] who [need or pain], [product] is a [category] that [key benefit]. Unlike [main alternative], [product] [the one thing that is different].',
      rows: 5,
      hint: 'Name a specific customer and a specific alternative. Fill every slot.',
    },
    {
      key: 'differentiation',
      label: 'Why the differentiator holds',
      placeholder:
        'Why does your "unlike" actually matter to this customer, and why can the obvious competitor not credibly claim the same thing? If they could, pick a sharper differentiator.',
      rows: 5,
    },
  ],
  rubric: [
    {
      id: 'specific-target',
      label: 'Specific target',
      descriptor:
        'Names a concrete target customer or segment with a real need, not "everyone" or "all users". The reader can picture exactly who this is for.',
    },
    {
      id: 'clear-category',
      label: 'Clear category and benefit',
      descriptor:
        'Places the product in a category the customer already understands and states the core benefit in the customer\'s terms, not internal jargon or a feature list.',
    },
    {
      id: 'real-differentiation',
      label: 'Real differentiation',
      descriptor:
        'The "unlike" names something genuinely distinct that the obvious competitor cannot easily claim too. The statement could not be copy-pasted by a rival unchanged.',
    },
    {
      id: 'differentiation-defense',
      label: 'Differentiation that matters',
      descriptor:
        'Defends why the differentiator matters to the chosen customer, connecting it back to their need rather than asserting it is better in the abstract.',
    },
  ],
  graderInstructions:
    'The decisive test is the copy-paste test: if a named competitor could use the statement unchanged, real-differentiation should score low. Penalize buzzword benefits ("powerful, simple, all-in-one") and targets of "everyone". Reward a sharp segment and a differentiator tied to a real customer need.',
};
