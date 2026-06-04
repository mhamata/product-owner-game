import type { ArtifactContent } from './types';

/**
 * Artifact: a one-page PRD for the "PRDs & Specs" skill.
 *
 * The brief is industry-flavoured (the product and user nouns follow the
 * learner's home industry) so the scenario lands in their world. The rubric is
 * industry-neutral: the bar for a good PRD is the same whether the product is a
 * marketplace or a clinic tool. Structured into four fields so the learner is
 * scaffolded toward the rubric (problem, solution, success metrics, scope).
 */
export const onePagePrd: ArtifactContent = {
  skillId: 'prd-artifact',
  title: 'One-page PRD',
  hook: 'A PRD earns its keep by making one decision crisp: what we are building, for whom, and how we will know it worked.',
  framework: 'Problem first, then solution',
  scenarioTag: (ctx) => `${ctx.label} · spec`,
  brief: [
    (ctx) =>
      `You are the PM for a ${ctx.product}. Support and sales keep flagging the same thing: new ${ctx.user}s sign up, poke around once, and never come back. Activation in the first week is low, and the team has a hunch that the first-run experience is the problem.`,
    'Your lead engineer has two weeks of capacity opening up next sprint and wants a clear, one-page PRD before committing. The exec sponsor will skim it in five minutes, so it has to be tight.',
    'Write the PRD for ONE focused improvement to the first-week experience. Pick a real, specific change. Do not try to fix everything.',
  ],
  whatToProduce: [
    'A problem statement grounded in the user and the evidence above',
    'A proposed solution that is specific enough for an engineer to estimate',
    'One or two success metrics with a direction and rough target',
    'An explicit scope: what is in, and what is deliberately out for v1',
  ],
  fields: [
    {
      key: 'problem',
      label: 'Problem',
      placeholder:
        'Who is hurting, when, and how do we know? Tie it to the activation evidence, not a vague "users want more".',
      rows: 5,
      hint: 'Lead with the user and the evidence, not the feature.',
    },
    {
      key: 'solution',
      label: 'Proposed solution',
      placeholder:
        'What are we building? Be concrete enough that an engineer could estimate it. One focused change, not a list.',
      rows: 6,
    },
    {
      key: 'metrics',
      label: 'Success metrics',
      placeholder:
        'How will we know it worked? Name one or two metrics, the direction, and a rough target (e.g. week-one activation from 18% to 28%).',
      rows: 4,
    },
    {
      key: 'scope',
      label: 'Scope: in and out',
      placeholder:
        'What is in v1, and what are you explicitly NOT doing now? Cutting scope on paper is the job.',
      rows: 4,
    },
  ],
  rubric: [
    {
      id: 'problem-clarity',
      label: 'Problem clarity',
      descriptor:
        'States a specific user, a specific moment of pain, and the evidence for it. Frames the problem before any solution, and avoids "users want feature X" framing.',
    },
    {
      id: 'solution-specificity',
      label: 'Solution specificity',
      descriptor:
        'Describes one focused change concretely enough that an engineer could size it. Avoids a laundry list and avoids vague verbs like "improve" or "optimize" with no substance.',
    },
    {
      id: 'measurable-success',
      label: 'Measurable success',
      descriptor:
        'Names one or two outcome metrics (not vanity or output metrics), each with a direction and a plausible target, that actually reflect whether the problem was solved.',
    },
    {
      id: 'scope-discipline',
      label: 'Scope discipline',
      descriptor:
        'Makes an explicit in/out call for v1 and cuts something. Shows judgment about what to defer, rather than committing to everything.',
    },
  ],
  graderInstructions:
    'This is a one-page PRD, so reward tightness and penalize padding. A solution-first PRD that skips or hand-waves the problem should score low on problem clarity even if the solution is clever. Output metrics (shipped, clicks) without an outcome metric should not earn full marks on measurable success.',
};
