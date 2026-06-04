import type { ConceptLessonContent } from './types';

/**
 * Platform & API track: "API as Product".
 * Treating an API as a product whose users are developers, where developer
 * experience is the UX, and the build-vs-buy decision on the other side.
 */
export const trackApiAsProduct: ConceptLessonContent = {
  skillId: 'track-api-as-product',
  hook: 'An API is a product. Its users are developers, its UX is the developer experience, and its forever cost is that you can never quietly break a published contract.',
  framework: 'API-as-a-product and developer experience (DX); build-vs-buy on the consumer side',
  sections: [
    {
      heading: 'The API is the product; developers are the users',
      body: [
        'When you ship an API, the API is the product, not an afterthought bolted onto one. Its users are developers, and they make the same product judgments your end users do: is it easy to understand, does it do the job, is it reliable, would I recommend it. That means an API needs the full product treatment: a clear value proposition, real documentation, onboarding that gets a developer to a first successful call quickly, versioning, and support. "We exposed some endpoints" is not an API product any more than a pile of screens is an app.',
      ],
    },
    {
      heading: 'Developer experience is the UX',
      body: [
        'For an API, developer experience (DX) is the entire user experience. The decisive metric is time-to-first-call: how fast a developer goes from landing on your docs to a working request that returns something useful. Good DX means predictable, consistent design (so one endpoint teaches you the next), honest and actionable error messages, copy-pasteable examples, and an SDK or sandbox that removes friction. Friction here is not cosmetic. A confusing or flaky API loses developers exactly the way a confusing app loses users, except developers are less forgiving and have already half-decided to build it themselves.',
      ],
      bullets: [
        'Time-to-first-call: the activation metric for an API; minimize it ruthlessly.',
        'Consistency: predictable patterns so learning one endpoint teaches the rest.',
        'Honest errors: messages that tell a developer exactly what to fix.',
      ],
    },
    {
      heading: 'The contract is forever; choosing to consume is build-vs-buy',
      body: [
        'A published API is a promise. Once developers depend on it you cannot quietly change it: a breaking change ripples out and breaks their software, so APIs demand real versioning and deprecation discipline, and you live with old contracts for a long time. The flip side is the consumer\'s decision. When your own team needs a capability (payments, auth, maps, messaging), the question is build-vs-buy: build it only if it is a source of durable differentiation, and consume a mature third-party API for the necessary-but-generic parts so your scarce engineering goes to what actually wins. Knowing both sides, the cost of publishing a contract and the leverage of consuming one, is the platform PM\'s core trade.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Shipping a public API for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `You expose the ${ctx.product}\'s core data so partner developers can build on it. The API is now a product with its own users: those developers.`,
        'You treat DX as the UX: clear docs, a sandbox key, copy-paste examples, and a relentless focus on time-to-first-successful-call.',
        'You version from day one, because the contract is forever: once partners depend on it, a breaking change breaks their software.',
        (ctx) =>
          `On the consumer side, the ${ctx.product} itself buys a mature payments API rather than building one, saving its engineers for the differentiating work.`,
      ],
      takeaway:
        'Give the API full product treatment, make developer experience the priority, version the contract you can never quietly break, and buy generic capabilities so you build only what differentiates.',
    },
  ],
  takeaways: [
    'An API is a product whose users are developers: it needs a value proposition, docs, fast onboarding, versioning, and support, not just exposed endpoints.',
    'Developer experience is the UX; time-to-first-successful-call is the activation metric, and consistency plus honest errors are what keep developers from leaving.',
    'A published API contract is forever (version and deprecate with discipline); on the consumer side, build only what differentiates and buy a mature API for the rest.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'What does it mean to treat an API "as a product"?',
        options: [
          { id: 'a', label: 'Charging money for every endpoint.' },
          {
            id: 'b',
            label:
              'Recognizing that developers are its users and giving it full product treatment: a clear value proposition, real documentation, fast onboarding, versioning, and support, with developer experience as the UX.',
          },
          { id: 'c', label: 'Making sure the API has a user interface with screens and buttons.' },
        ],
        correctId: 'b',
        why: 'An API\'s users are developers, who judge it like any product: easy, reliable, worth recommending. Treating it as a product means documentation, onboarding to a fast first call, versioning, and support, with developer experience standing in for UX. Exposed endpoints alone are not a product.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Why does a published API demand serious versioning and deprecation discipline that an internal feature often does not?',
        options: [
          { id: 'a', label: 'Because APIs are written in different programming languages than features.' },
          {
            id: 'b',
            label:
              'Because the contract is effectively forever: once external developers depend on it, a breaking change ripples out and breaks their software, so you cannot quietly change it.',
          },
          { id: 'c', label: 'Because versioning makes the API run faster.' },
        ],
        correctId: 'b',
        why: 'A published API is a promise others build on. Unlike an internal change you control end to end, a breaking change to a depended-on API breaks consumers\' software, so you must version, deprecate gracefully, and live with old contracts for a long time.',
      },
      {
        kind: 'fill',
        id: 'q3',
        prompt:
          'For an API, the entire user experience is captured by a two-word term abbreviated "DX." Spell it out.',
        accept: ['developer experience'],
        why: 'DX is developer experience: how easy and pleasant the API is to learn and use. Its key activation signal is time-to-first-successful-call, and good DX (consistency, honest errors, examples, SDKs) is what retains developers.',
        placeholder: 'two words',
      },
    ],
  },
};
