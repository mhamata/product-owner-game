import type { ArtifactContent } from './types';

/**
 * Artifact: an experiment plan (hypothesis + metrics) for the "A/B Test Design"
 * skill. Structured fields steer the learner through the parts that make an
 * experiment decision-ready: a falsifiable hypothesis, ONE primary metric, the
 * guardrails that stop a local win from causing global harm, and a stop rule
 * fixed in advance so the result is honest.
 */
export const experimentPlan: ArtifactContent = {
  skillId: 'experiment-plan',
  title: 'Experiment plan',
  hook: 'A good experiment is a question you have committed to answering honestly: one hypothesis, one primary metric, guardrails, and a decision rule set before you peek.',
  framework: 'Hypothesis-driven experimentation',
  scenarioTag: (ctx) => `${ctx.label} · experiment`,
  brief: [
    (ctx) =>
      `Your ${ctx.product} has a long sign-up flow, and a lot of ${ctx.user}s drop off on the third step, where you ask for extra profile details. A designer proposes making those fields optional to reduce friction.`,
    'Before you ship it to everyone, you want to test it. Write the experiment plan an engineer and a data partner could run and trust.',
    'The art here is restraint: one clear hypothesis, one primary metric, and the guardrails that keep a short-term lift from quietly hurting something that matters later.',
  ],
  whatToProduce: [
    'A falsifiable hypothesis: change, expected effect, and the reason you expect it',
    'One primary metric that decides the test (resist having three)',
    'One or two guardrail metrics that must not get worse',
    'The variants, who is exposed, and the decision rule set in advance',
  ],
  fields: [
    {
      key: 'hypothesis',
      label: 'Hypothesis',
      placeholder:
        'We believe that [change] will cause [effect on a metric] for [which users], because [reason]. Make it falsifiable: a result could prove it wrong.',
      rows: 4,
      hint: 'If no outcome could disprove it, it is not a hypothesis yet.',
    },
    {
      key: 'primary',
      label: 'Primary metric',
      placeholder:
        'The single metric that decides ship / no-ship. Why this one, and over what window?',
      rows: 3,
    },
    {
      key: 'guardrails',
      label: 'Guardrail metrics',
      placeholder:
        'One or two metrics that must not degrade (e.g. downstream profile completion, week-two retention, support load). What is the line you will not cross?',
      rows: 3,
    },
    {
      key: 'design',
      label: 'Design and decision rule',
      placeholder:
        'Variants (control vs treatment), who is in the test, roughly how long, and the rule you commit to NOW: under what result do you ship, kill, or iterate?',
      rows: 5,
    },
  ],
  rubric: [
    {
      id: 'falsifiable-hypothesis',
      label: 'Falsifiable hypothesis',
      descriptor:
        'States the change, the expected directional effect on a specific metric, and a reason. A result could prove it wrong. Avoids vague "this will be better" phrasing.',
    },
    {
      id: 'single-primary-metric',
      label: 'One decisive primary metric',
      descriptor:
        'Commits to a single primary metric that maps to the hypothesis and would actually settle the decision. Does not hedge with several co-primary metrics.',
    },
    {
      id: 'guardrails',
      label: 'Guardrail thinking',
      descriptor:
        'Names at least one guardrail metric that protects against a local win causing downstream harm (for example, optional fields lifting signups but hurting later completion or retention).',
    },
    {
      id: 'decision-rule',
      label: 'Pre-committed decision rule',
      descriptor:
        'Specifies variants, exposure, and a ship/kill/iterate rule decided in advance, so the readout is not rationalized after the fact. Shows awareness of not stopping early on noise.',
    },
  ],
  graderInstructions:
    'Reward a crisp, falsifiable hypothesis and the discipline of a single primary metric. A plan with three primary metrics and no guardrail should score low. The most common real failure is no pre-committed decision rule (peeking and shipping on the first good day); reward plans that fix the rule up front. Do not require specific sample-size math, but credit any awareness of needing enough data before deciding.',
};
