import type { ConceptLessonContent } from './types';

/**
 * Senior · Growth & Monetization: "Growth Loops & Retention".
 * Why loops beat funnels, the retention equation, and why retention is the
 * multiplier that decides whether any growth effort compounds.
 */
export const growthLoopsRetention: ConceptLessonContent = {
  skillId: 'growth-loops-retention',
  hook: 'A funnel pours users in the top and they fall out the bottom. A loop turns the output back into the input, so growth compounds instead of leaking.',
  framework: 'Reforge (Brian Balfour / Andrew Chen) · Growth Loops',
  sections: [
    {
      heading: 'Funnels run down; loops feed back',
      body: [
        'A funnel is a one-way path: acquire → activate → … → some convert, the rest leak. It’s a useful diagnostic for finding where you lose people, but as a growth model it’s linear: every new user costs another unit of spend or effort. A growth loop is a closed system where the output of one cycle becomes the input to the next. New users produce something (content, invites, supply, data) that brings in the next users. The output re-enters as input, so each turn of the loop can drive the one after it.',
        'This is why Reforge pushes teams past "optimize the funnel." Funnels describe a moment; loops describe a system that reinvests its own output. The strategic question shifts from "how do we get more people into the top?" to "what does each user produce that pulls in the next user?"',
      ],
      bullets: [
        'Viral loop: users invite users (each new user generates invites).',
        'Content loop: users create content that ranks and draws in more users.',
        'Paid loop: revenue from users funds the ads that acquire the next ones.',
        'Supply loop: supply attracts demand, which attracts more supply (marketplaces).',
      ],
    },
    {
      heading: 'Retention is the multiplier',
      body: [
        'Acquisition gets the attention, but retention decides whether any of it matters. If users don’t come back, you’re refilling a leaky bucket: every dollar of acquisition is spent again next month. Retention is also what powers a loop: only retained users keep producing the output (invites, content, revenue) that feeds the next cycle. Improving retention lifts the ceiling on growth, lifetime value, and payback all at once. It is the highest-leverage number in the system.',
      ],
    },
    {
      heading: 'The retention equation',
      body: [
        'Reforge frames retention as the product of three things: how often the user has a reason to return (Frequency) × the one action that delivers your core value (Core Behavior) × the segment that genuinely needs you (Who). Read together they tell you the natural cadence of a healthy user. A weekly tool shouldn’t be benchmarked on daily use; a daily habit shouldn’t celebrate monthly logins. First find the natural frequency of your core behavior for the right Who, then measure retention against that cadence, not against a generic "DAU" everyone copies.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Turning a ${ctx.product} funnel into a loop`,
      lines: [
        (ctx) =>
          `Funnel view: spend to acquire ${ctx.user}s, activate some, watch the rest drop. Doubling growth means doubling spend. Linear.`,
        (ctx) =>
          `Loop view: each active ${ctx.user} produces something that pulls in the next: a shared result, a public listing, a referral.`,
        'Now pin the retention equation: what’s the Core Behavior, how often does a healthy user have a reason to do it, and for which Who?',
        'If the natural cadence is weekly, judge retention on a weekly curve, and fix the loop and retention before pouring more into the top.',
      ],
      takeaway:
        'Find the loop and the natural retention cadence first; acquisition spend only compounds once the system holds onto and reinvests its users.',
    },
  ],
  takeaways: [
    'Funnels are linear and leak; growth loops feed output back as input so growth compounds. Ask what each user produces that brings the next.',
    'Retention is the multiplier: it powers the loop and sets the ceiling on growth and LTV. Acquisition into a leaky bucket just re-spends.',
    'Reforge’s retention equation: Frequency × Core Behavior × Who. Measure retention against the natural cadence of your core behavior, not a generic DAU.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'What fundamentally distinguishes a growth loop from a growth funnel?',
        options: [
          { id: 'a', label: 'A loop has more stages than a funnel.' },
          {
            id: 'b',
            label:
              'In a loop the output of one cycle (new content, invites, supply, revenue) becomes the input that drives the next, so growth can compound rather than run down linearly.',
          },
          { id: 'c', label: 'A funnel is for B2C and a loop is for B2B.' },
        ],
        correctId: 'b',
        why: 'A funnel is a one-way path where users leak out the bottom; each new user costs more spend. A loop is a closed system that reinvests its own output as the next cycle’s input, which is what lets growth compound.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'A team is proud of fast acquisition growth, but the 8-week retention curve flattens close to zero. Why is this a problem for growth, not just satisfaction?',
        options: [
          { id: 'a', label: 'It isn’t; acquisition growth is what matters, and retention is a separate concern.' },
          {
            id: 'b',
            label:
              'Without retention you’re refilling a leaky bucket and the loop has nothing to reinvest: every dollar of acquisition must be re-spent next period, capping growth and LTV.',
          },
          { id: 'c', label: 'Low retention only matters for paid products, not free ones.' },
        ],
        correctId: 'b',
        why: 'Retention is the multiplier on the whole system: only retained users keep producing the loop’s output, and only they let acquisition spend pay back. A flat-to-zero curve means growth can’t compound no matter how good acquisition looks.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'Reforge’s retention equation multiplies three factors: Frequency × Core Behavior × ___ (the segment that genuinely needs the product). Name the third factor.',
        accept: ['who', 'the who'],
        why: 'The equation is Frequency × Core Behavior × Who. The "Who" is the user segment with a real, recurring need; retention is always relative to the right audience, not the general population.',
        placeholder: 'one word',
      },
    ],
  },
};
