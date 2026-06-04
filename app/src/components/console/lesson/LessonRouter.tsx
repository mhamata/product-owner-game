'use client';

import { useMemo } from 'react';
import type { Skill } from '@/curriculum/types';
import { useActiveIndustry } from '@/store/industryStore';
import {
  resolveRiceDrill,
  resolveWsjfDrill,
  resolveKanoDrill,
  resolveTshirtDrill,
  resolveFiveWhysDrill,
  resolveJtbdDrill,
  resolveMomTestDrill,
  resolvePreMortemDrill,
  resolvePrFaqDrill,
} from '@/curriculum/drills';
import { ValueVsEffortLesson } from './ValueVsEffortLesson';
import { ScoreRankLesson } from './ScoreRankLesson';
import { ClassificationLesson } from './ClassificationLesson';
import { SizingLesson } from './SizingLesson';
import { SequencingLesson } from './SequencingLesson';
import { FreeTextGradeLesson } from './FreeTextGradeLesson';
import { ComingSoonLesson } from './ComingSoonLesson';

/** First segment of a "X · Y" scenario string, e.g. "SaaS". */
const industryOf = (scenario: string) => scenario.split(' · ')[0];

/**
 * Client-side lesson dispatcher.
 *
 * Drill definitions carry a `score` function (RICE/WSJF), which cannot cross
 * the server→client boundary as a prop. So the drill data is selected HERE, in
 * a client component, rather than threaded through the server route. The route
 * just resolves the curriculum `skill` and hands it to this dispatcher.
 *
 * The drill content is now industry-aware: we read the learner's home industry
 * from the persisted store and resolve each drill for it. Reads are
 * hydration-safe — until the store rehydrates we render the DEFAULT industry,
 * matching SSR + the first client paint (the same pattern the capstone sim uses
 * in SimRunner) so there is no hydration mismatch.
 */
export function LessonRouter({ skill }: { skill: Skill }) {
  const industry = useActiveIndustry();

  // Resolve only the drill this skill needs, re-resolving when the industry
  // changes. Each resolver merges the industry's display pack onto the shared
  // (answer-bearing) structure, so the graded answer is identical across them.
  const rice = useMemo(() => resolveRiceDrill(industry), [industry]);
  const wsjf = useMemo(() => resolveWsjfDrill(industry), [industry]);
  const kano = useMemo(() => resolveKanoDrill(industry), [industry]);
  const tshirt = useMemo(() => resolveTshirtDrill(industry), [industry]);
  const fiveWhys = useMemo(() => resolveFiveWhysDrill(industry), [industry]);
  const jtbd = useMemo(() => resolveJtbdDrill(industry), [industry]);
  const momTest = useMemo(() => resolveMomTestDrill(industry), [industry]);
  const preMortem = useMemo(() => resolvePreMortemDrill(industry), [industry]);
  const prFaq = useMemo(() => resolvePrFaqDrill(industry), [industry]);

  switch (skill.id) {
    case 'value-vs-effort':
      return <ValueVsEffortLesson skill={skill} industry={industry} />;
    case 'rice':
      return (
        <ScoreRankLesson
          skill={skill}
          drill={rice}
          scenarioTag={`Scenario · ${industryOf(rice.scenario)}`}
        />
      );
    case 'cost-of-delay':
      return (
        <ScoreRankLesson
          skill={skill}
          drill={wsjf}
          scenarioTag={`Scenario · ${industryOf(wsjf.scenario)}`}
        />
      );
    case 'kano-moscow':
      // Skill maps to drillType 'kano' — run the Kano classification.
      return (
        <ClassificationLesson
          skill={skill}
          drill={kano}
          scenarioTag={`Scenario · ${industryOf(kano.scenario)}`}
        />
      );
    case 'estimation':
      return (
        <SizingLesson
          skill={skill}
          drill={tshirt}
          scenarioTag={`Scenario · ${industryOf(tshirt.scenario)}`}
        />
      );
    case 'problem-framing':
      return (
        <SequencingLesson
          skill={skill}
          drill={fiveWhys}
          scenarioTag={`Scenario · ${industryOf(fiveWhys.scenario)}`}
        />
      );
    case 'jtbd':
      return <FreeTextGradeLesson skill={skill} drill={jtbd} />;
    case 'user-interviews':
      return <FreeTextGradeLesson skill={skill} drill={momTest} />;
    case 'pre-mortem':
      return <FreeTextGradeLesson skill={skill} drill={preMortem} />;
    case 'pr-faq':
      return <FreeTextGradeLesson skill={skill} drill={prFaq} />;
    default:
      return <ComingSoonLesson skill={skill} />;
  }
}
