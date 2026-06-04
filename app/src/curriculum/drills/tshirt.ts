import type { TShirtSize } from './types';

/**
 * T-shirt sizing drill: STRUCTURAL CORE (industry-neutral).
 *
 * Relative sizing XS → XXL. Anything past M should be broken down before a
 * sprint commitment.
 *
 * This file owns the answer key: the fixed size legend (the calendar meaning of
 * each size, identical for every industry) and, per story, its stable `id` and
 * the single `correct` size. It carries NO human-readable story copy. Titles,
 * descriptions, rationales, framing, and the insight live in `./tshirt.display`,
 * one pack per home industry, merged on by `resolveTshirtDrill`. The correct
 * size per story never changes, so the relative-sizing answer is identical
 * across industries.
 */

/** The structural story ids: the keys every display pack must cover. */
export type TshirtStoryId =
  | 'locale-toggle'
  | 'sso'
  | 'copy-fix'
  | 'billing-platform'
  | 'activity-feed';

/** One story's answer-bearing data: its correct relative size. */
export interface StructuralSizingStory {
  id: TshirtStoryId;
  correct: TShirtSize;
}

export interface TshirtStructure {
  /** The legend explaining what each size means in calendar terms. */
  legend: string;
  stories: StructuralSizingStory[];
}

export const tshirtStructure: TshirtStructure = {
  legend:
    'XS ≈ 1 day · S ≈ 2-3 days · M ≈ 1 sprint · L ≈ 2 sprints · XL ≈ 1 quarter · XXL = break it down first',
  stories: [
    { id: 'locale-toggle', correct: 'S' },
    { id: 'sso', correct: 'L' },
    { id: 'copy-fix', correct: 'XS' },
    { id: 'billing-platform', correct: 'XXL' },
    { id: 'activity-feed', correct: 'M' },
  ],
};
