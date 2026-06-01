import { notFound } from 'next/navigation';
import { allSkills, getSkill } from '@/curriculum/data';
import { LessonRouter } from '@/components/console/lesson/LessonRouter';

export async function generateStaticParams() {
  return allSkills.map((s) => ({ skillId: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  const skill = getSkill(skillId);
  return {
    title: skill ? `${skill.title} — PRAXIS` : 'Skill not found',
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
 * Phase 2 ships every deterministic (client-graded) skill; the free-text /
 * LLM-graded drills still fall through to "Coming soon".
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
