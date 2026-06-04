/**
 * Barrel for the shared, industry-aware drill engine. Both the Console lesson
 * loop (/learn) and the /methods library import drill content + grading from
 * here.
 *
 * Each drill follows the same structural/display split as the capstone sim (see
 * `@/scenarios/buildScenario`):
 *   • `./<drill>.ts`         — the industry-NEUTRAL answer-bearing structure
 *                              (correct option / ranking / categories / sizes /
 *                              chain order, plus the answer-determining numbers
 *                              and labels). Identical across all industries.
 *   • `./<drill>.display.ts` — five per-industry DISPLAY packs (human strings
 *                              only) + a `resolve<Drill>(industry)` that merges
 *                              the chosen pack onto the shared structure.
 *
 * Because the structure is shared, the graded answer is provably identical for
 * every home industry; only the feature names / framing change.
 *
 * For convenience and backward compatibility, the un-suffixed `…Drill` exports
 * below are the DEFAULT-industry (SaaS) assemblies — the original content, now
 * produced through the resolver. Industry-aware surfaces should call the
 * `resolve…Drill(industry)` functions instead.
 */
import { DEFAULT_INDUSTRY } from '@/curriculum/industries';
import { resolveRiceDrill } from './rice.display';
import { resolveWsjfDrill } from './wsjf.display';
import { resolveMoscowDrill } from './moscow.display';
import { resolveKanoDrill } from './kano.display';
import { resolveTshirtDrill } from './tshirt.display';
import { resolveFiveWhysDrill } from './fiveWhys.display';
import { resolveJtbdDrill } from './jtbd.display';
import { resolveMomTestDrill } from './momTest.display';
import { resolvePreMortemDrill } from './preMortem.display';
import { resolvePrFaqDrill } from './prFaq.display';

export * from './types';

// ---- per-industry resolvers (the industry-aware API) ------------------------
export { resolveRiceDrill } from './rice.display';
export { resolveWsjfDrill } from './wsjf.display';
export { resolveMoscowDrill } from './moscow.display';
export { resolveKanoDrill } from './kano.display';
export { resolveTshirtDrill } from './tshirt.display';
export { resolveFiveWhysDrill } from './fiveWhys.display';
export { resolveJtbdDrill } from './jtbd.display';
export { resolveMomTestDrill } from './momTest.display';
export { resolvePreMortemDrill } from './preMortem.display';
export { resolvePrFaqDrill } from './prFaq.display';
export {
  resolveValueVsEffortDrill,
  type ResolvedValueVsEffortDrill,
  type ResolvedValueVsEffortRow,
  type ResolvedValueVsEffortOption,
} from './valueVsEffort.display';

// ---- category unions (still defined in the structure modules) ---------------
export { type MoscowBucket } from './moscow';
export { type KanoCategory } from './kano';

// ---- default-industry (SaaS) assemblies, for non-industry-aware callers -----
export const riceDrill = resolveRiceDrill(DEFAULT_INDUSTRY);
export const wsjfDrill = resolveWsjfDrill(DEFAULT_INDUSTRY);
export const moscowDrill = resolveMoscowDrill(DEFAULT_INDUSTRY);
export const kanoDrill = resolveKanoDrill(DEFAULT_INDUSTRY);
export const tshirtDrill = resolveTshirtDrill(DEFAULT_INDUSTRY);
export const fiveWhysDrill = resolveFiveWhysDrill(DEFAULT_INDUSTRY);
export const jtbdDrill = resolveJtbdDrill(DEFAULT_INDUSTRY);
export const momTestDrill = resolveMomTestDrill(DEFAULT_INDUSTRY);
export const preMortemDrill = resolvePreMortemDrill(DEFAULT_INDUSTRY);
export const prFaqDrill = resolvePrFaqDrill(DEFAULT_INDUSTRY);
