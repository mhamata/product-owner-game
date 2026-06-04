import { notFound } from 'next/navigation';
import { levels, getLevel } from '@/curriculum/data';
import { canTestOut } from '@/curriculum/placement';
import type { LevelId } from '@/curriculum/types';
import { PlacementRouter } from '@/components/console/lesson/PlacementRouter';

/**
 * Test-out route (server). One static page per level. Resolves + validates the
 * `levelId`, then hands off to the client-side PlacementRouter, which assembles
 * the placement challenge (it must build client-side because the questions carry
 * industry `Flavoured` fields that can be functions, which can't cross the
 * server→client boundary as props, the same constraint the drill router has).
 */
export function generateStaticParams() {
  return levels.map((l) => ({ levelId: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  const level = getLevel(levelId as LevelId);
  return {
    title: level ? `Test out of ${level.label} | PRAXIS` : 'Test out',
    description: level
      ? `Demonstrate ${level.label} in a short placement challenge and skip ahead.`
      : undefined,
  };
}

export default async function TestOutPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  const level = getLevel(levelId as LevelId);
  // Unknown level, or a level with no buildable challenge: there is nothing to
  // test out of, so this route does not exist for it.
  if (!level || !canTestOut(level.id)) notFound();

  return <PlacementRouter levelId={level.id} />;
}
