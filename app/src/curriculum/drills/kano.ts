import type { ClassificationDrill } from './types';

export type KanoCategory = 'basic' | 'performance' | 'delighter' | 'indifferent';

/**
 * Kano drill — de-specialized to a generic SaaS product, mainstream segment.
 * Basic (must-have) / Performance (more is better) / Delighter (surprise) /
 * Indifferent (nobody cares).
 */
export const kanoDrill: ClassificationDrill<KanoCategory> = {
  scenario: 'SaaS · mainstream segment',
  prompt:
    'For a mainstream SaaS audience today, classify each feature on the Kano model.',
  buckets: [
    { key: 'basic', label: 'Basic', description: 'Must-have; absence angers' },
    { key: 'performance', label: 'Performance', description: 'More is better' },
    { key: 'delighter', label: 'Delighter', description: 'Surprise & delight' },
    { key: 'indifferent', label: 'Indifferent', description: 'Nobody really cares' },
  ],
  items: [
    {
      id: 'login',
      name: 'Secure login with MFA',
      correct: 'basic',
      why: 'Expected. Missing = angry users and failed security reviews. Present = nobody notices.',
    },
    {
      id: 'load-speed',
      name: 'Page load speed',
      correct: 'performance',
      why: 'More is better — users continuously compare apps on responsiveness.',
    },
    {
      id: 'ai-suggestions',
      name: 'AI-generated content suggestions',
      correct: 'delighter',
      why: 'Most users don’t expect it; when it’s good it creates genuine surprise and word of mouth.',
    },
    {
      id: 'theme-color',
      name: 'Custom accent-color picker',
      correct: 'indifferent',
      why: 'Almost nobody cares. Engineering effort with little impact on either axis.',
    },
    {
      id: 'dark-mode',
      name: 'Dark mode',
      correct: 'basic',
      why: 'A classic category drift: Delighter (2016) → Performance → now Basic; its absence triggers complaints.',
    },
    {
      id: 'uptime',
      name: 'Reliable uptime / SLA',
      correct: 'performance',
      why: 'More nines = more satisfaction for serious customers. Scales with the number.',
    },
  ],
  insight:
    'Dark mode is the textbook "category drift" example — Delighters decay into Basics over time. Re-survey periodically; yesterday’s wow is today’s table stakes.',
};
