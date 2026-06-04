import type { DrillBucket } from './types';

/**
 * Kano drill — STRUCTURAL CORE (industry-neutral).
 *
 * Basic (must-have) / Performance (more is better) / Delighter (surprise) /
 * Indifferent (nobody cares).
 *
 * This file owns the answer key: the four Kano categories (fixed taxonomy) and,
 * per item, its stable `id` and the single `correct` category. It carries NO
 * human-readable copy — names, rationales, framing, and the insight live in
 * `./kano.display`, one pack per home industry, merged on by `resolveKanoDrill`.
 * The correct category per item never changes across industries.
 */

export type KanoCategory = 'basic' | 'performance' | 'delighter' | 'indifferent';

/** The structural item ids — the keys every display pack must cover. */
export type KanoItemId =
  | 'login'
  | 'load-speed'
  | 'ai-suggestions'
  | 'theme-color'
  | 'dark-mode'
  | 'uptime';

/** One item's answer-bearing data: which Kano category is correct. */
export interface StructuralKanoItem {
  id: KanoItemId;
  correct: KanoCategory;
}

export interface KanoStructure {
  buckets: DrillBucket<KanoCategory>[];
  items: StructuralKanoItem[];
}

export const kanoStructure: KanoStructure = {
  buckets: [
    { key: 'basic', label: 'Basic', description: 'Must-have; absence angers' },
    { key: 'performance', label: 'Performance', description: 'More is better' },
    { key: 'delighter', label: 'Delighter', description: 'Surprise & delight' },
    { key: 'indifferent', label: 'Indifferent', description: 'Nobody really cares' },
  ],
  items: [
    { id: 'login', correct: 'basic' },
    { id: 'load-speed', correct: 'performance' },
    { id: 'ai-suggestions', correct: 'delighter' },
    { id: 'theme-color', correct: 'indifferent' },
    { id: 'dark-mode', correct: 'basic' },
    { id: 'uptime', correct: 'performance' },
  ],
};
