import { notFound } from 'next/navigation';
import { everySkill, getSkill } from '@/curriculum/data';
import { LessonRouter } from '@/components/console/lesson/LessonRouter';

export async function generateStaticParams() {
  // Every skill (ladder + specialization tracks) gets a static lesson route.
  // `ready` skills render their drill; `coming-soon` skills (incl. all tracks)
  // render the placeholder via the LessonRouter's default branch.
  return everySkill.map((s) => ({ skillId: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  const skill = getSkill(skillId);
  return {
    title: skill ? `${skill.title} | PRAXIS` : 'Skill not found',
    description: skill
      ? `Practice ${skill.title} in the PRAXIS curriculum.`
      : undefined,
  };
}

/**
 * Lesson route (server). Resolves the curriculum skill, then hands off to the
 * client-side LessonRouter, which selects the drill. The dispatch lives in the
 * client because drill definitions carry a `score` function that cannot be
 * passed across the server→client boundary as a prop.
 *
 * `ready` skills route to their existing drill/lesson loop; `coming-soon`
 * skills (every new ladder skill + all specialization tracks) fall through to
 * the "Coming soon" placeholder.
 */
export default async function LearnPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  const skill = getSkill(skillId);
  if (!skill) notFound();

  return <LessonRouter skill={skill} />;
}
