/**
 * Home industries.
 *
 * A learner's "home industry" re-skins the capstone simulation: same game
 * mechanics and balance, a different product story. The set is intentionally
 * small and generic — each maps to one display pack in
 * `@/scenarios/scenario01.display`. The structural engine wiring is shared and
 * lives in `@/scenarios/scenario01.structure`; only human-readable copy varies
 * by industry.
 */
export type IndustryId = 'saas' | 'fintech' | 'marketplace' | 'consumer' | 'healthcare';

export interface Industry {
  id: IndustryId;
  label: string;
}

/** The selectable industries, in display order (matches the home dropdown). */
export const INDUSTRIES: Industry[] = [
  { id: 'saas', label: 'SaaS' },
  { id: 'fintech', label: 'Fintech' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'consumer', label: 'Consumer' },
  { id: 'healthcare', label: 'Healthcare' },
];

/** The default home industry for a new learner (the original Hubflow theme). */
export const DEFAULT_INDUSTRY: IndustryId = 'saas';

/** True if a string is a known industry id (narrows to IndustryId). */
export function isIndustryId(value: string): value is IndustryId {
  return INDUSTRIES.some((i) => i.id === value);
}
