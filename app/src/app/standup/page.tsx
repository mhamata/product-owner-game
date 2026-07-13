import { StandupView } from '@/components/console/standup/StandupView';

export const metadata = {
  title: 'Standup | PRAXIS',
  description:
    'Your daily three-act loop: a warm-up from the judgment deck, one scheduler-chosen practice block, and your simulation standup.',
};

/**
 * The /standup daily home. A thin server shell around the client
 * `StandupView`: all of today's state (review queue, mastery, sim evidence,
 * the active run) lives in persisted client stores, so this route makes no
 * server/API calls of its own.
 */
export default function StandupPage() {
  return <StandupView />;
}
