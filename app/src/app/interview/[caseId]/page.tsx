import { notFound } from 'next/navigation';
import { ALL_INTERVIEW_CASES, getInterviewCase } from '@/curriculum/interview';
import { InterviewSession, type PublicInterviewCase } from '@/components/interview/InterviewSession';

export function generateStaticParams() {
  // Every authored case gets a static session route.
  return ALL_INTERVIEW_CASES.map((c) => ({ caseId: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const interviewCase = getInterviewCase(caseId);
  return {
    title: interviewCase ? `${interviewCase.title} · Mock Interview | PRAXIS` : 'Case not found',
    description: interviewCase
      ? `${interviewCase.hook} Interviewer: ${interviewCase.interviewerName}.`
      : undefined,
  };
}

/**
 * Interview session route (server). Resolves the case, then hands the
 * candidate-visible slice to the client session component.
 *
 * SECURITY: the `brief` holds the case's answers (the seeded root cause, the
 * follow-up ladder, the data to reveal only when asked). It must NEVER cross to
 * the client — the API looks it up server-side by `caseId`. We strip it here into
 * a `PublicInterviewCase` so it is impossible for the client bundle to receive
 * it, not merely discouraged from rendering it.
 */
export default async function InterviewCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const interviewCase = getInterviewCase(caseId);
  if (!interviewCase) notFound();

  // Destructure `brief` out so only the public fields are serialized to the
  // client. `_brief` is intentionally unused: the point is to drop it.
  const { brief: _brief, ...publicCase } = interviewCase;
  void _brief;
  const safeCase: PublicInterviewCase = publicCase;

  return <InterviewSession interviewCase={safeCase} />;
}
