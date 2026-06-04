import { ProgressView } from '@/components/console/ProgressView';

export const metadata = {
  title: 'Progress | PRAXIS',
  description:
    'Your PRAXIS standing: level certifications and the 12-competency matrix showing where you are strong and where you are thin.',
};

/**
 * Progress / profile route (server shell). The view is a client component
 * because it reads persisted mastery from the learn store; this page just sets
 * metadata and mounts it, mirroring how the home map and lesson routes compose.
 */
export default function ProgressPage() {
  return <ProgressView />;
}
