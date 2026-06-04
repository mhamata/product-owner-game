import type { ConceptLessonContent } from './types';

/**
 * AI / ML track: "Agentic Products".
 * What makes a system an agent (tools, loops, autonomy), matching the level of
 * autonomy to the stakes, and the guardrails non-negotiable when AI acts.
 */
export const trackAgents: ConceptLessonContent = {
  skillId: 'track-agents',
  hook: 'A chatbot answers. An agent acts. The moment AI can take actions in the world, the design question stops being "is the answer good?" and becomes "how much should it be allowed to do on its own?"',
  framework: 'Agentic products: tool use, the autonomy spectrum, and guardrails for AI that acts',
  sections: [
    {
      heading: 'What makes something an agent',
      body: [
        'An agent is an AI system that does more than produce text: it can use tools (call an API, run a query, send an email, update a record) and work in a loop, taking a step, observing the result, and deciding the next step toward a goal. The leap from a model that answers to a system that acts is the defining shift. It unlocks real leverage (the agent can actually complete a multi-step task, not just describe how) but it also raises the stakes, because now the system\'s mistakes are actions in the world, not just sentences on a screen. Understanding this loop, and what tools you do and do not hand the agent, is the heart of agentic product work.',
      ],
      bullets: [
        'Tools: the actions the agent can take (read data, call services, change state).',
        'Loop: act, observe the result, decide the next step, repeat toward a goal.',
        'Stakes: mistakes are now actions, so the cost of being wrong jumps.',
      ],
    },
    {
      heading: 'Match autonomy to the stakes',
      body: [
        'Autonomy is a spectrum, not a switch. At one end the AI only suggests and a human does everything; in the middle it drafts and a human approves before anything happens; at the far end it executes on its own. The right level is set by the cost of a mistake and how reversible it is. Low-stakes, easily-undone actions can run autonomously; high-stakes or irreversible ones (spending money, sending an external message, deleting data) should keep a human in the loop, at least until evals prove the agent is reliable enough. A common and sound pattern is to start with suggest-only, earn trust with measured quality, and expand autonomy deliberately rather than shipping full automation on day one.',
      ],
    },
    {
      heading: 'Guardrails are non-negotiable when AI acts',
      body: [
        'Because an agent acts and is probabilistic, you design the guardrails before the capability, not after. The essentials: scope the tools tightly (the agent can only do what it strictly needs), confirm before high-consequence or irreversible actions, make the agent\'s steps observable so a human can see and audit what it did, and ensure there is always a way to stop or undo. The goal is to capture the leverage of automation while bounding the blast radius of an inevitable wrong step. An agent without guardrails is not a bold product, it is an incident waiting to happen.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Designing an agent for a ${ctx.product}`,
      lines: [
        (ctx) =>
          `Goal: an agent that handles routine ${ctx.user} requests end to end, using tools to look up records and update settings, not just chat.`,
        'You scope its tools tightly: it can read account data and change low-risk preferences, but it cannot issue refunds or delete anything.',
        'Autonomy by stakes: it acts on its own for the safe, reversible changes, but for anything costly it drafts the action and a human approves first.',
        'Guardrails: every step is logged and auditable, high-consequence actions require confirmation, and there is always a stop-and-undo, so a wrong step is contained.',
      ],
      takeaway:
        'Define the tools and the loop, set autonomy by the cost and reversibility of mistakes, and build the guardrails (tight scope, confirmation, observability, undo) before shipping the capability.',
    },
  ],
  takeaways: [
    'An agent uses tools and works in an act-observe-decide loop toward a goal, so it acts rather than only answers, which is real leverage but raises the stakes of every mistake.',
    'Autonomy is a spectrum (suggest, draft-and-approve, execute): match the level to the cost and reversibility of a mistake, and earn higher autonomy with proven reliability.',
    'When AI acts, guardrails are non-negotiable: scope tools tightly, confirm high-consequence actions, keep steps observable, and always provide a stop or undo.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt:
          'What distinguishes an AI agent from a system that only answers questions?',
        options: [
          { id: 'a', label: 'An agent uses a larger model than a question-answering system.' },
          {
            id: 'b',
            label:
              'An agent can use tools to take actions and works in a loop (act, observe the result, decide the next step) toward a goal, so its mistakes become actions in the world, not just text.',
          },
          { id: 'c', label: 'An agent never makes mistakes, unlike a chatbot.' },
        ],
        correctId: 'b',
        why: 'The defining shift is from answering to acting. An agent calls tools and iterates toward a goal in an act-observe-decide loop. That unlocks real leverage but also raises the stakes, because a wrong step is now a real-world action rather than a sentence on a screen.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'An agent could either (a) auto-toggle a low-risk, easily-reversible setting or (b) issue refunds that move money irreversibly. How should autonomy differ between them?',
        options: [
          { id: 'a', label: 'Both should be fully autonomous; the agent is capable of doing each.' },
          {
            id: 'b',
            label:
              'Match autonomy to stakes and reversibility: the low-risk, reversible setting can run autonomously, but the irreversible money-moving action should keep a human in the loop (draft-and-approve) at least until evals prove reliability.',
          },
          { id: 'c', label: 'Neither should ever be automated; agents should only ever suggest.' },
        ],
        correctId: 'b',
        why: 'Autonomy is a spectrum set by the cost of a mistake and how reversible it is. Cheap, easily-undone actions can run on their own; irreversible, high-consequence ones (moving money) warrant a human approval step until measured quality earns more autonomy. One-size-fits-all in either direction is wrong.',
      },
    ],
  },
};
