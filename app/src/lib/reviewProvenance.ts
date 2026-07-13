import type { IndustryId } from '@/curriculum/industries';
import { pickRefreshIndustry } from './skillRefresh';

/**
 * REVIEW-DECK PROVENANCE (W4-I, design-sim-2.0.md's "wrongness is never
 * punished — absence is" ruling: a card the sim surfaced comes back "in a
 * different industry skin").
 *
 * A due card is rendered in the learner's home industry UNLESS it was pulled
 * forward by `reviewStore.resurface()` (see `CardSchedule.resurfaced`), in
 * which case it is rendered in the next industry in the cyclic rotation —
 * reusing `skillRefresh.ts`'s `pickRefreshIndustry`, the SAME "always
 * different, deterministic" rule the 90-second tech-tree refresh already
 * uses, rather than inventing a second variation rule.
 *
 * This is the one place that decides "what industry does this due card
 * render in, and does that fact deserve a chip" — `ReviewView` reads it once
 * per card in its session-queue snapshot.
 */
export interface ReviewProvenance {
  /** True if this due card was pulled forward by a sim run/event, not normal scheduling. */
  fromRun: boolean;
  /** The industry this instance of the card is actually rendered in. */
  renderedIndustry: IndustryId;
  /** The learner's home industry, for comparison/display. */
  homeIndustry: IndustryId;
  /** True when the rendered industry differs from home — the "skin" chip condition. */
  showSkinChip: boolean;
}

/**
 * PURE: derive a card's provenance from its `resurfaced` flag and the
 * learner's home industry. Only resurfaced cards ever render in a varied
 * industry today (no other path introduces variation), so `showSkinChip` is
 * only ever true alongside `fromRun` — computed independently anyway so a
 * future variation source (e.g. a second resurface path) does not need this
 * function to change.
 */
export function deriveProvenance(
  resurfaced: boolean | undefined,
  homeIndustry: IndustryId,
): ReviewProvenance {
  const renderedIndustry = resurfaced ? pickRefreshIndustry(homeIndustry) : homeIndustry;
  return {
    fromRun: !!resurfaced,
    renderedIndustry,
    homeIndustry,
    showSkinChip: renderedIndustry !== homeIndustry,
  };
}
