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

/**
 * Plain-language nouns per industry, used to flavour concept-lesson examples in
 * the learner's world ("your marketplace", "a buyer") without each lesson
 * re-deriving the mapping. `product` is a natural noun for the thing they build;
 * `user` is a representative end-user. Kept here so the industry vocabulary has
 * a single home.
 */
export interface IndustryNouns {
  /** Natural noun for the learner's product, e.g. "marketplace", "SaaS tool". */
  product: string;
  /** Representative end-user noun, e.g. "buyer", "patient", "subscriber". */
  user: string;
}

export const INDUSTRY_NOUNS: Record<IndustryId, IndustryNouns> = {
  saas: { product: 'SaaS tool', user: 'admin' },
  fintech: { product: 'fintech app', user: 'account holder' },
  marketplace: { product: 'marketplace', user: 'buyer' },
  consumer: { product: 'consumer app', user: 'member' },
  healthcare: { product: 'healthtech product', user: 'patient' },
};
