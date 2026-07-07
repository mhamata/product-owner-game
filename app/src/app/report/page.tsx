import { ALL_INTERVIEW_CASES } from '@/curriculum/interview';
import {
  ReadinessReport,
  type PublicReportCase,
} from '@/components/report/ReadinessReport';

export const metadata = {
  title: 'Readiness Report | PRAXIS',
  description:
    'Your PRAXIS practice record: scored mock interviews and graded artifacts, with the work samples attached. A practice record, not a certification.',
};

/**
 * Readiness-report route (SERVER). The report is composed on the client (it reads
 * the learner's graded history from localStorage), but the interview case
 * METADATA — title, kind, interviewer, dimensions — must come from the server.
 *
 * SECURITY: the full `InterviewCase` carries the hidden `brief` (the case's
 * answers: seeded root cause, follow-up ladder, data to reveal only when asked).
 * A client component must NEVER import the interview registry, or that brief
 * would be bundled into the JS the browser downloads. So we strip each case to
 * the same `Omit<InterviewCase, 'brief'>` public shape the session route uses,
 * and hand the client only that — the leak is impossible by construction.
 */
export default function ReportPage() {
  // Pick ONLY the public metadata the report renders, server-side, so nothing
  // from the hidden `brief` (nor the opening / setup) is serialized into the
  // client component's props. Selecting an explicit subset — rather than
  // spreading and deleting — makes the leak impossible by construction.
  const publicCases: PublicReportCase[] = ALL_INTERVIEW_CASES.map((c) => ({
    id: c.id,
    kind: c.kind,
    title: c.title,
    interviewerName: c.interviewerName,
    durationMin: c.durationMin,
    dimensions: c.dimensions,
  }));

  return <ReadinessReport publicCases={publicCases} />;
}
