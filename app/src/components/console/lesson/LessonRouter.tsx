'use client';

import type { Skill } from '@/curriculum/types';
import {
  riceDrill,
  wsjfDrill,
  kanoDrill,
  tshirtDrill,
  fiveWhysDrill,
  jtbdDrill,
  momTestDrill,
  preMortemDrill,
  prFaqDrill,
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
 */
export function LessonRouter({ skill }: { skill: Skill }) {
  switch (skill.id) {
    case 'value-vs-effort':
      return <ValueVsEffortLesson skill={skill} />;
    case 'rice':
      return (
        <ScoreRankLesson
          skill={skill}
          drill={riceDrill}
          scenarioTag={`Scenario · ${industryOf(riceDrill.scenario)}`}
        />
      );
    case 'cost-of-delay':
      return (
        <ScoreRankLesson
          skill={skill}
          drill={wsjfDrill}
          scenarioTag={`Scenario · ${industryOf(wsjfDrill.scenario)}`}
        />
      );
    case 'kano-moscow':
      // Skill maps to drillType 'kano' — run the Kano classification.
      return (
        <ClassificationLesson
          skill={skill}
          drill={kanoDrill}
          scenarioTag={`Scenario · ${industryOf(kanoDrill.scenario)}`}
        />
      );
    case 'estimation':
      return (
        <SizingLesson
          skill={skill}
          drill={tshirtDrill}
          scenarioTag={`Scenario · ${industryOf(tshirtDrill.scenario)}`}
        />
      );
    case 'problem-framing':
      return (
        <SequencingLesson
          skill={skill}
          drill={fiveWhysDrill}
          scenarioTag={`Scenario · ${industryOf(fiveWhysDrill.scenario)}`}
        />
      );
    case 'jtbd':
      return <FreeTextGradeLesson skill={skill} drill={jtbdDrill} />;
    case 'user-interviews':
      return <FreeTextGradeLesson skill={skill} drill={momTestDrill} />;
    case 'pre-mortem':
      return <FreeTextGradeLesson skill={skill} drill={preMortemDrill} />;
    case 'pr-faq':
      return <FreeTextGradeLesson skill={skill} drill={prFaqDrill} />;
    default:
      return <ComingSoonLesson skill={skill} />;
  }
}
