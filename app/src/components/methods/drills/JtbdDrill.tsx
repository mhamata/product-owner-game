'use client';

import { useMemo } from 'react';
import { resolveJtbdDrill } from '@/curriculum/drills';
import { useActiveIndustry } from '@/store/industryStore';
import { FreeTextDrillRunner } from './FreeTextDrillRunner';

/**
 * Library JTBD drill. The persona, prompt, per-field labels/placeholders, the
 * composed "When… I want to… so I can…" preview, and the persona context sent
 * to the grader all come from the shared, industry-aware drill engine
 * (src/curriculum/drills) — resolved for the learner's home industry
 * (hydration-safe; SaaS until the store rehydrates). This keeps /methods and
 * /learn in sync. The `drillId` ('jtbd') that selects the server-side rubric is
 * unchanged, so grading is identical across industries.
 *
 * The old inline SaaS `SCENARIOS` persona array (Priya/Darren on "Hubflow") and
 * the local field/preview state were removed — that content now lives, per
 * industry, in `jtbd.display.ts`. The single resolved persona replaces the old
 * two-persona selector, matching the /learn lesson.
 */
export function JtbdDrill() {
  const industry = useActiveIndustry();
  const drill = useMemo(() => resolveJtbdDrill(industry), [industry]);
  return <FreeTextDrillRunner drill={drill} />;
}
