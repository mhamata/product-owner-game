import type { DrillBucket } from './types';

/**
 * MoSCoW drill: STRUCTURAL CORE (industry-neutral).
 *
 * Must / Should / Could / Won't. "Must" is defined strictly: the release fails
 * without it.
 *
 * This file owns the answer key: the four buckets (the fixed MoSCoW taxonomy,
 * identical for every industry) and, for each item, its stable `id` and the
 * single `correct` bucket. It carries NO human-readable feature copy. Names,
 * rationales, scenario framing, and the insight live in `./moscow.display`, one
 * pack per home industry, merged on by `resolveMoscowDrill`. The correct bucket
 * per item never changes, so a fully-correct attempt is identical across
 * industries.
 */

export type MoscowBucket = 'M' | 'S' | 'C' | 'W';

/** The structural item ids: the keys every display pack must cover. */
export type MoscowItemId =
  | 'auth'
  | 'gdpr'
  | 'notifications'
  | 'activity-feed'
  | 'native-mobile'
  | 'dark-mode'
  | 'chat-support'
  | 'public-api';

/** One item's answer-bearing data: which bucket is correct. */
export interface StructuralMoscowItem {
  id: MoscowItemId;
  correct: MoscowBucket;
}

export interface MoscowStructure {
  buckets: DrillBucket<MoscowBucket>[];
  items: StructuralMoscowItem[];
}

export const moscowStructure: MoscowStructure = {
  buckets: [
    { key: 'M', label: 'Must', description: 'Launch blocker' },
    { key: 'S', label: 'Should', description: 'Important, not blocking' },
    { key: 'C', label: 'Could', description: 'Nice to have' },
    { key: 'W', label: "Won't", description: 'Explicitly out' },
  ],
  items: [
    { id: 'auth', correct: 'M' },
    { id: 'gdpr', correct: 'M' },
    { id: 'notifications', correct: 'S' },
    { id: 'activity-feed', correct: 'C' },
    { id: 'native-mobile', correct: 'W' },
    { id: 'dark-mode', correct: 'S' },
    { id: 'chat-support', correct: 'C' },
    { id: 'public-api', correct: 'W' },
  ],
};
