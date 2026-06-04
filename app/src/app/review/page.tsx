import { ReviewView } from '@/components/console/review/ReviewView';

export const metadata = {
  title: 'Judgment Review | PRAXIS',
  description:
    'Rehearse product-management judgment calls on a spaced-repetition schedule, so good decision-making sticks over time.',
};

/**
 * The judgment-deck review route. A thin server shell around the client
 * `ReviewView`: the scheduling state lives in a persisted client store, so the
 * page itself carries no server logic and makes no API calls. This feature works
 * with no API key by design; all content is pre-authored.
 */
export default function ReviewPage() {
  return <ReviewView />;
}
