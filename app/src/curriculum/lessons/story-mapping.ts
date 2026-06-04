import type { ConceptLessonContent } from './types';

/**
 * Associate PM · Running the Backlog: "Story Mapping" (Patton).
 * The two-dimensional map of the user's journey, and slicing releases across it.
 */
export const storyMapping: ConceptLessonContent = {
  skillId: 'story-mapping',
  hook: 'A flat backlog hides the user’s journey; a story map lays it out so you can see the whole experience and slice a real release.',
  framework: 'Jeff Patton · User Story Mapping',
  sections: [
    {
      heading: 'Why a flat list isn’t enough',
      body: [
        'A backlog is a one-dimensional list, and that’s its weakness: it’s easy to lose the forest for the trees. You can’t see the user’s end-to-end journey, you can’t tell whether a release hangs together, and gaps hide between line items. Jeff Patton’s story mapping fixes this by giving the backlog a second dimension: the shape of the user’s experience.',
      ],
    },
    {
      heading: 'How a story map is built',
      body: [
        'A story map is a grid. Across the top, left to right, run the big activities in the order a user does them, the "backbone" of the journey. Underneath each activity hang the specific tasks and stories that fulfill it, arranged top-to-bottom by priority: essential at the top, nice-to-have further down. Read left-to-right and you see the whole narrative of using the product; read top-to-bottom under any step and you see depth of detail.',
      ],
      bullets: [
        'Backbone (horizontal): the user’s activities in sequence; the narrative flow.',
        'Body (vertical): the stories under each activity, ranked by priority.',
      ],
    },
    {
      heading: 'Slicing releases that actually work',
      body: [
        'The payoff is how you plan releases. Instead of building one activity fully before starting the next, you draw a horizontal slice across the whole map, taking just enough of each step to deliver a complete, usable journey. That first slice is your walking skeleton or thin first release: end-to-end and shippable, even if shallow. Later slices add depth.',
        'This is the antidote to the classic failure of building the "perfect" first step while the rest of the journey doesn’t exist yet. A user needs the whole path to be usable, not one part to be lavish.',
      ],
    },
  ],
  examples: [
    {
      title: (ctx) => `Mapping a ${ctx.product} onboarding journey`,
      lines: [
        (ctx) =>
          `Backbone, left to right: Sign up → Set up account → Invite teammates → Complete first task. That’s how a ${ctx.user} actually moves through it.`,
        'Under "Sign up": email signup (essential), social login (later), SSO (later still), stacked by priority.',
        'First release = a thin horizontal slice: basic signup, minimal setup, simple invite, one core task. The whole journey works end-to-end, even if shallow.',
        'A flat backlog might have shipped a gorgeous signup and zero way to invite anyone: a dead end.',
      ],
      takeaway:
        'Slice horizontally for a complete, usable journey first; add depth in later slices. Never perfect step one while the path is broken.',
    },
  ],
  takeaways: [
    'Story mapping (Patton) adds a second dimension to the backlog: a horizontal backbone of user activities and vertical stories ranked by priority.',
    'Reading left-to-right shows the end-to-end journey; reading top-to-bottom shows depth of detail under each step.',
    'Plan releases as horizontal slices that deliver a complete, usable journey first (a walking skeleton), then deepen.',
  ],
  check: {
    questions: [
      {
        kind: 'choice',
        id: 'q1',
        prompt: 'What does the horizontal axis (the "backbone") of a story map represent?',
        options: [
          { id: 'a', label: 'The team members assigned to each feature.' },
          { id: 'b', label: 'The sequence of user activities: the end-to-end journey through the product.' },
          { id: 'c', label: 'The sprint each story is scheduled into.' },
        ],
        correctId: 'b',
        why: 'The backbone runs left-to-right as the ordered activities a user performs, the narrative of using the product. Detailed stories hang vertically beneath each activity, ranked by priority.',
      },
      {
        kind: 'choice',
        id: 'q2',
        prompt:
          'Why does Patton recommend planning a release as a horizontal slice across the map rather than completing one activity at a time?',
        options: [
          {
            id: 'a',
            label:
              'So the first release is a complete, usable end-to-end journey, instead of one perfect step with a broken path around it.',
          },
          { id: 'b', label: 'Because horizontal slices are always faster to build.' },
          { id: 'c', label: 'Because vertical work isn’t allowed in agile.' },
        ],
        correctId: 'a',
        why: 'A horizontal slice takes just enough of every activity to make the whole journey work (a "walking skeleton"). Building one activity fully first risks a lavish step one and no usable path through the rest.',
      },
    ],
  },
};
