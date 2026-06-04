'use client';

import { useMemo } from 'react';
import { resolvePrFaqDrill } from '@/curriculum/drills';
import { useActiveIndustry } from '@/store/industryStore';
import { FreeTextDrillRunner } from './FreeTextDrillRunner';

/**
 * Library PR-FAQ drill. The assignment, the headline/subtitle/summary fields,
 * the composed answer, and the assignment context sent to the grader all come
 * from the shared, industry-aware drill engine (src/curriculum/drills) —
 * resolved for the learner's home industry (hydration-safe; SaaS until the store
 * rehydrates). The `drillId` ('pr-faq') that selects the server-side rubric is
 * unchanged, so grading is identical across industries.
 *
 * The old inline SaaS `PROMPT` constant (the "Hubflow Realtime Sync" launch) and
 * the local headline/subtitle/summary state were removed — that assignment now
 * lives, per industry, in `prFaq.display.ts`.
 */
export function PrFaqDrill() {
  const industry = useActiveIndustry();
  const drill = useMemo(() => resolvePrFaqDrill(industry), [industry]);
  return <FreeTextDrillRunner drill={drill} />;
}
