'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { LevelId } from '@/curriculum/types';
import { buildPlacementChallenge } from '@/curriculum/placement';
import { useActiveIndustry } from '@/store/industryStore';
import { PlacementChallengeLesson } from './PlacementChallengeLesson';

/**
 * Client-side entry for the test-out flow.
 *
 * The placement challenge is assembled HERE, in a client component, for the same
 * reason the drills are (see LessonRouter): the questions carry industry
 * `Flavoured` fields that may be functions, which cannot cross the server→client
 * boundary as props. The route just hands us the validated `levelId`; we build
 * the challenge for the learner's home industry and render it.
 *
 * If a level has no buildable challenge (too few authored checks), there is
 * nothing to test out of, so we bounce back to the map rather than show an empty
 * shell. The Practice Map only ever links here for levels that can be tested out
 * of, so this is a guard, not the common path.
 */
export function PlacementRouter({ levelId }: { levelId: LevelId }) {
  const router = useRouter();
  const industry = useActiveIndustry();

  // The assembler is deterministic and industry-independent: it picks the
  // question SET, while the child resolves each question's flavour from the
  // `industry` prop. So the challenge memoises on `levelId` alone; an industry
  // switch re-renders the child without rebuilding the set.
  const challenge = useMemo(() => buildPlacementChallenge(levelId), [levelId]);

  useEffect(() => {
    if (!challenge) router.replace('/');
  }, [challenge, router]);

  if (!challenge) return null;

  return <PlacementChallengeLesson challenge={challenge} industry={industry} />;
}
