'use client';

import { useMemo } from 'react';
import { resolveMomTestDrill } from '@/curriculum/drills';
import { useActiveIndustry } from '@/store/industryStore';
import { FreeTextDrillRunner } from './FreeTextDrillRunner';

/**
 * Library Mom Test drill. The discovery brief, the single "write one question
 * that passes the Mom Test" field, the composed answer, and the research-goal
 * context sent to the grader all come from the shared, industry-aware drill
 * engine (src/curriculum/drills) — resolved for the learner's home industry
 * (hydration-safe; SaaS until the store rehydrates). The `drillId` ('mom-test')
 * that selects the server-side rubric is unchanged, so grading is identical
 * across industries.
 *
 * This replaces the old inline, SaaS-only `QUOTES` "classify good/bad signal"
 * exercise. That content was hard-coded SaaS (status meetings, dashboard
 * exports, the Salesforce-integration anecdote) with no industry-aware backing,
 * and it was self-scored client-side rather than graded via /api/grade. It now
 * matches the /learn lesson: the learner writes one interview question, graded
 * by Claude against the shared Mom-Test rubric. The per-industry brief + goal
 * live in `momTest.display.ts`.
 */
export function MomTestDrill() {
  const industry = useActiveIndustry();
  const drill = useMemo(() => resolveMomTestDrill(industry), [industry]);
  return <FreeTextDrillRunner drill={drill} />;
}
