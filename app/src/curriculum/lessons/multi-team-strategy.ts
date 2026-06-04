import type { ConceptLessonContent } from './types';

/**
 * Staff / Principal · Scope & Leverage: "Multi-Team Strategy".
 * Coherent strategy across many teams: a diagnosis-led core (Rumelt), aligned
 * autonomy over central control, and Conway's Law as a design constraint.
 */
export const multiTeamStrategy: ConceptLessonContent = {
  skillId: 'multi-team-strategy',
  hook: 'A dozen well-run teams pulling in slightly different directions is worse than one: strategy is what makes their effort add up instead of cancel out.',
  framework: 'Richard Rumelt · Good Strategy / Bad Strategy · Conway\'s Law',
  sections: [
    {
      heading: 'Good strategy has a kernel, not a wish list',
      body: [
        'Richard Rumelt argues that real strategy has three parts: a diagnosis (what is actually going on), a guiding policy (the overall approach to the challenge), and coherent actions (the coordinated moves that carry it out). A list of goals ("grow revenue 30%, delight customers, win the enterprise") is not strategy; Rumelt calls that "bad strategy." The hard, valuable work is the diagnosis: naming the one or two critical challenges so that many teams can aim at the same crux instead of each chasing its own local goal.',
      ],
      bullets: [
        'Diagnosis: the honest read of the situation and the critical obstacle.',
        'Guiding policy: the chosen approach that addresses the obstacle.',
        'Coherent actions: coordinated moves across teams that reinforce, not fight, each other.',
      ],
    },
    {
      heading: 'Aligned autonomy beats central control',
      body: [
        'You cannot, and should not, plan every team\'s work from the center. The scalable pattern is aligned autonomy: the center owns the diagnosis and the guiding policy (the "why" and the boundaries), and each team owns the solution within them (the "how"). Strong shared context plus local decision rights lets teams move fast without diverging. Weak alignment with high autonomy produces chaos; tight alignment with low autonomy produces a bottleneck and disengaged teams. The staff PM\'s leverage is in the alignment half: making the shared intent so clear that independent teams still cohere.',
      ],
    },
    {
      heading: 'Conway\'s Law: structure shapes the product',
      body: [
        'Conway\'s Law observes that organizations ship their org chart: a system\'s design tends to mirror the communication structure of the teams that built it. Three teams that don\'t talk will produce three products with awkward seams between them. So team boundaries are a product-design decision, not just an HR one. When you draw where one team\'s ownership ends and another\'s begins, you are deciding where the product will have its joints. Strategy at this level includes shaping team topology so the boundaries fall where the product wants them, not where they create friction.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Aligning four ${ctx.product} teams on one crux`,
      lines: [
        (ctx) =>
          `Four teams each have a sensible-sounding goal (more signups, fewer bugs, a new integration, a redesign) but a ${ctx.user} still hits a broken end-to-end journey.`,
        'Diagnosis (Rumelt): the critical obstacle is that no single team owns the cross-team journey, so each optimizes its slice while the seams break. That\'s the crux to name.',
        'Guiding policy: for two quarters, every team\'s top bet must reduce friction on the shared journey; local goals come second. The center sets that boundary, not the solutions.',
        'Conway check: the journey breaks exactly at the team handoffs. Redraw two ownership lines so one team owns each painful seam end-to-end: the structure now matches the product.',
      ],
      takeaway:
        'Name the one shared crux, set a guiding policy that points every team at it, and align team boundaries with the product\'s real seams.',
    },
  ],
  takeaways: [
    'Good strategy (Rumelt) is diagnosis + guiding policy + coherent actions; a list of goals is "bad strategy."',
    'Scale through aligned autonomy: the center owns the why and the boundaries; teams own the how within them.',
    'Conway\'s Law means org structure leaks into the product, so team boundaries are a product-design decision: draw them where the product wants its seams.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'A leadership "strategy" reads: "Grow revenue 30%, delight customers, and win enterprise deals." By Rumelt\'s definition, what is missing that makes this bad strategy?',
        options: [
          { id: 'a', label: 'Nothing. Ambitious goals are exactly what strategy is.' },
          {
            id: 'b',
            label:
              'A diagnosis of the critical challenge and a guiding policy: it lists desired outcomes but names no obstacle and no coordinated approach.',
          },
          { id: 'c', label: 'A bigger budget and more headcount to hit the numbers.' },
        ],
        correctId: 'b',
        why: 'Rumelt\'s kernel is diagnosis, guiding policy, and coherent action. A set of goals skips the hardest part (honestly naming the critical obstacle and choosing an approach to it) so teams have nothing to coordinate around. That\'s the hallmark of "bad strategy."',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'An end-to-end customer journey keeps breaking precisely at the points where one team hands off to another. Which principle best explains this, and what does it imply?',
        options: [
          { id: 'a', label: 'Bad luck. Reassign more QA engineers to find the bugs.' },
          {
            id: 'b',
            label:
              'Conway\'s Law: the product mirrors team communication structure, so the fix is to redraw ownership so one team owns each seam.',
          },
          { id: 'c', label: 'The teams simply need to work harder within their existing boundaries.' },
        ],
        correctId: 'b',
        why: 'Conway\'s Law predicts that systems mirror the org that built them, so seams appear at team handoffs. Adding QA treats the symptom; aligning team boundaries with the product\'s real seams treats the cause.',
      },
    ],
  },
};
