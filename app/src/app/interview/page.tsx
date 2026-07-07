import { InterviewPicker } from '@/components/interview/InterviewPicker';

export const metadata = {
  title: 'Mock Interviews | PRAXIS',
  description:
    'Sit a real PM interview with an AI interviewer, then get a hiring-committee scorecard.',
};

/**
 * Mock-interview case picker (server). Renders the static case registry through
 * the picker component; the live interview loop lives on the per-case route.
 */
export default function InterviewIndexPage() {
  return <InterviewPicker />;
}
