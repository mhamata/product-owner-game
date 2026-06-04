import type { ConceptLessonContent } from './types';

/**
 * Foundations · Literacy — "Technical Literacy".
 * Front/back-end, APIs, databases, and how software gets built — enough to be
 * a credible partner to engineering without writing code.
 */
export const technicalLiteracy: ConceptLessonContent = {
  skillId: 'technical-literacy',
  hook: 'You don’t need to code, but you do need to understand the moving parts well enough to make good trade-offs with engineers.',
  sections: [
    {
      heading: 'Front-end, back-end, and the API between them',
      body: [
        'Most products split into a front-end and a back-end. The front-end is what runs on the user’s device — the screens, buttons, and interactions in a browser or app. The back-end is the server-side: the business logic, the data, and the heavy lifting the device can’t or shouldn’t do.',
        'They talk through an API — an Application Programming Interface, a contract for how one piece of software asks another for data or actions. When the app loads your profile, the front-end calls a back-end API ("give me this user"), and the back-end responds with data. APIs are also how you integrate with other companies’ systems. "Is there an API for that?" is one of the most useful questions a PM can ask.',
      ],
    },
    {
      heading: 'Where the data lives',
      body: [
        'The back-end stores information in a database. You can picture much of it as tables of rows and columns — users, orders, messages — that the system reads from and writes to. Two practical truths fall out of this: data has structure (changing that structure, a "migration", is real work), and some questions are cheap to answer while others are expensive, depending on how the data is organized and indexed.',
        'You don’t need to write queries. You do need to sense when a request is "just read a field" versus "reshape how we store everything," because that distinction drives estimates.',
      ],
    },
    {
      heading: 'How software actually gets built',
      body: [
        'Engineers write code, store it in version control (so changes are tracked and reviewable), and put it through review and automated tests before it merges. It then deploys to environments — typically a staging environment to verify, then production where users live. Modern teams ship continuously in small increments rather than in big-bang releases.',
        'Two ideas worth carrying: technical debt (shortcuts that speed you up now but cost you later) and the value of small, reversible changes. Both shape what engineering can safely promise.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Tracing one click in a ${ctx.product}`,
      lines: [
        (ctx) =>
          `A ${ctx.user} clicks "Save" in the ${ctx.product}. The front-end packages the form and calls a back-end API.`,
        'The back-end validates the request, writes a row to the database, and returns a success response.',
        'The front-end updates the screen to confirm. If saving feels slow, the bottleneck could be the network, the back-end logic, or a slow database query — three different fixes.',
        'Knowing those layers lets you ask engineering a sharp question instead of "make it faster".',
      ],
      takeaway:
        'Understanding front-end → API → back-end → database turns vague complaints into precise, debuggable questions.',
    },
  ],
  takeaways: [
    'Front-end (the device) and back-end (the server) communicate through APIs — contracts for requesting data or actions.',
    'Data lives in a database with structure; "just read a field" and "reshape how we store data" are very different sizes of work.',
    'Software ships through version control, review, tests, and staged deploys — and technical debt is a real, ongoing trade-off.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt: 'In one sentence, what is an API?',
        options: [
          { id: 'a', label: 'The visual design of an app’s screens.' },
          {
            id: 'b',
            label:
              'A contract that lets one piece of software request data or actions from another.',
          },
          { id: 'c', label: 'The database where all of a product’s information is stored.' },
        ],
        correctId: 'b',
        why: 'An API (Application Programming Interface) is the defined way one system asks another for data or actions — the contract the front-end uses to talk to the back-end, and the way products integrate with each other.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Engineering says a small-sounding request is large because it requires a database "migration". What does that imply?',
        options: [
          { id: 'a', label: 'They’re moving the app to a new hosting provider.' },
          {
            id: 'b',
            label:
              'The structure of how data is stored has to change — which is real, careful work, not just a code tweak.',
          },
          { id: 'c', label: 'The feature can only run in the staging environment.' },
        ],
        correctId: 'b',
        why: 'A migration changes the shape of stored data (new columns, restructured tables, backfilling existing rows). That’s why a UI change that touches the data model can be far larger than it looks.',
      },
    ],
  },
};
