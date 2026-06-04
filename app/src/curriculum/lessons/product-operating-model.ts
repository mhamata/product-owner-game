import type { ConceptLessonContent } from './types';

/**
 * Director / VP · The Operating Model: "Product Operating Model".
 * The shift from project/output thinking to a durable way of working (Cagan,
 * TRANSFORMED); product ops as the function that scales it (Perri).
 */
export const productOperatingModel: ConceptLessonContent = {
  skillId: 'product-operating-model',
  hook: 'A product operating model is how a company consistently works, not a process you run but the principles that govern every team.',
  framework: 'Marty Cagan · TRANSFORMED · Melissa Perri · product ops',
  sections: [
    {
      heading: 'What an operating model actually is',
      body: [
        'An operating model is the set of principles and ways of working that govern how a company creates products: how it decides what to build, how teams are structured and led, and how work flows from idea to customer. It is not a single methodology or a tool. Cagan frames the move to the "product operating model" (in TRANSFORMED) as a transformation across three dimensions: how you build (continuous delivery, instrumentation), how you solve problems (continuous discovery against the four risks), and how you decide what to work on (product strategy, empowered teams).',
        'The reason a leader cares is consistency at scale. One excellent team can succeed on heroics; a 200-person product org cannot. The operating model is what makes good product work the default outcome of the system rather than the lucky result of who happens to be in the room.',
      ],
    },
    {
      heading: 'The shift it represents',
      body: [
        'Adopting the model is mostly about leaving an older model behind: the project, feature-factory, output-driven way of working. The contrast is the clearest way to see what "transformed" means.',
      ],
      bullets: [
        'From projects (start, ship, disband) → to durable empowered teams that own a problem space over time.',
        'From output (did we ship the roadmap?) → to outcomes (did the problem actually get solved?).',
        'From the loudest stakeholder’s opinion → to evidence from discovery and data.',
        'From a roadmap of committed features → to a product strategy that focuses the bets.',
      ],
    },
    {
      heading: 'Product ops: the function that scales it',
      body: [
        'Melissa Perri popularized product operations (product ops) as the discipline that makes the operating model run at scale. Product ops is not a layer of process police; it is the connective tissue that gives teams the data, tooling, and customer insight they need, and that keeps practices consistent across many teams. Roughly it covers three areas: data and analytics infrastructure (so every team can see its outcomes), customer and market insight (a steady flow of qualitative signal), and process and practice (rituals, tooling, and reporting that scale). Done well, product ops removes friction so PMs spend their time on the problem; done badly, it becomes bureaucracy that reintroduces the feature factory.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Diagnosing the operating model behind the ${ctx.product}`,
      lines: [
        (ctx) =>
          `A leader inherits a ${ctx.product} org where work arrives as a stakeholder-prioritized feature roadmap, teams form per project and disband at launch, and success is "shipped on time."`,
        'Every symptom points to the old model: output over outcomes, projects over durable teams, opinion over evidence. The fix is not a new tool. It is a different way of working.',
        (ctx) =>
          `They move teams to durable ownership of ${ctx.user} journeys, swap the feature roadmap for a product strategy plus outcomes, and stand up a small product-ops function to give every team trustworthy metrics and a steady stream of ${ctx.user} insight.`,
        'Product ops handles the plumbing (instrumentation, research cadence, consistent reporting) so the teams can spend their attention on solving the problem rather than assembling their own data.',
      ],
      takeaway:
        'Transforming the operating model is changing how the company works (durable teams, outcomes, evidence), and product ops is the function that makes that new way scale without becoming bureaucracy.',
    },
  ],
  takeaways: [
    'A product operating model is the principles and ways of working that govern how a company builds, not a single process or tool (Cagan, TRANSFORMED).',
    'The transformation is from projects/output/opinion to durable empowered teams, outcomes, and evidence.',
    'Product ops (Perri) scales the model by supplying data, customer insight, and consistent practice: connective tissue, not process police.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'An executive says, "We adopted the product operating model. We bought a new roadmapping tool and standardized our Jira workflow." Why is this a misunderstanding?',
        options: [
          { id: 'a', label: 'They chose the wrong tool; a different tool would have worked.' },
          {
            id: 'b',
            label:
              'The operating model is the principles and way of working (durable teams, outcomes, evidence), not a tool or a workflow; tooling alone doesn’t change the model.',
          },
          { id: 'c', label: 'It is correct: adopting the model is mainly about standardizing tools.' },
        ],
        correctId: 'b',
        why: 'The product operating model is about how the company decides what to build, structures and leads teams, and works from idea to customer. Swapping tools without shifting from output to outcomes and projects to durable empowered teams leaves the old model intact.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'In Melissa Perri’s framing, what is the role of a product operations (product ops) function?',
        options: [
          {
            id: 'a',
            label:
              'To act as a gate that approves each team’s roadmap before work can begin.',
          },
          {
            id: 'b',
            label:
              'To scale the operating model by giving teams data, customer insight, and consistent practice: connective tissue that removes friction.',
          },
          { id: 'c', label: 'To replace product managers with a centralized planning team.' },
        ],
        correctId: 'b',
        why: 'Product ops exists to make the operating model run at scale: data and analytics, customer and market insight, and consistent process/tooling. It serves the teams; turned into a gatekeeper it becomes the bureaucracy it was meant to remove.',
      },
    ],
  },
};
