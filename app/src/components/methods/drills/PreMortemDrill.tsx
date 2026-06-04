'use client';

import { useMemo } from 'react';
import { resolvePreMortemDrill } from '@/curriculum/drills';
import { useActiveIndustry } from '@/store/industryStore';
import { FreeTextDrillRunner } from './FreeTextDrillRunner';

/**
 * Library Pre-Mortem drill. The project brief, the four failure-mode fields, the
 * composed answer, and the project context sent to the grader all come from the
 * shared, industry-aware drill engine (src/curriculum/drills), resolved for the
 * learner's home industry (hydration-safe; SaaS until the store rehydrates). The
 * `drillId` ('pre-mortem') that selects the server-side coverage rubric is
 * unchanged, so grading is identical across industries.
 *
 * The old inline SaaS `PROJECT` constant (the "Hubflow Realtime Sync" cutover)
 * and the local failures state were removed; that brief now lives, per
 * industry, in `preMortem.display.ts`.
 */
export function PreMortemDrill() {
  const industry = useActiveIndustry();
  const drill = useMemo(() => resolvePreMortemDrill(industry), [industry]);
  return <FreeTextDrillRunner drill={drill} />;
}
