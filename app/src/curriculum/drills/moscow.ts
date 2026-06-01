import type { ClassificationDrill } from './types';

export type MoscowBucket = 'M' | 'S' | 'C' | 'W';

/**
 * MoSCoW drill — de-specialized to scoping a generic SaaS v1 launch.
 * Must / Should / Could / Won't. "Must" is defined strictly: the release
 * fails without it.
 */
export const moscowDrill: ClassificationDrill<MoscowBucket> = {
  scenario: 'SaaS · v1 launch scope',
  prompt:
    'You’re scoping the v1 launch of a team-collaboration app. Sort each feature into a MoSCoW bucket.',
  buckets: [
    { key: 'M', label: 'Must', description: 'Launch blocker' },
    { key: 'S', label: 'Should', description: 'Important, not blocking' },
    { key: 'C', label: 'Could', description: 'Nice to have' },
    { key: 'W', label: "Won't", description: 'Explicitly out' },
  ],
  items: [
    {
      id: 'auth',
      name: 'Email + password authentication',
      correct: 'M',
      why: 'Nobody can use the product without an account. "Must" means the release fails without it.',
    },
    {
      id: 'gdpr',
      name: 'GDPR data-export & delete',
      correct: 'M',
      why: 'Legal non-negotiable for launching in the EU. Shipping without it = compliance failure.',
    },
    {
      id: 'notifications',
      name: 'In-app notifications',
      correct: 'S',
      why: 'Important for engagement, but the product works at launch without it. Fast-follow.',
    },
    {
      id: 'activity-feed',
      name: 'Team activity feed',
      correct: 'C',
      why: 'Nice differentiation, but not required for v1. Could ship in a later release.',
    },
    {
      id: 'native-mobile',
      name: 'Native mobile apps',
      correct: 'W',
      why: "Explicitly out of scope for v1 — responsive web covers launch. Name it Won't so it stops resurfacing.",
    },
    {
      id: 'dark-mode',
      name: 'Dark mode',
      correct: 'S',
      why: 'Used to be a Could; now a Should — its absence gets called out in reviews.',
    },
    {
      id: 'chat-support',
      name: 'In-app live chat support',
      correct: 'C',
      why: 'Would help activation, but email support is acceptable for launch.',
    },
    {
      id: 'public-api',
      name: 'Public REST API',
      correct: 'W',
      why: 'Not a launch concern. Explicitly out of scope to keep the team focused.',
    },
  ],
  insight:
    'The common mistake is putting everything in Must. A healthy MoSCoW keeps Must to a handful of items — roughly 60% of capacity — so there’s room to absorb surprises.',
};
