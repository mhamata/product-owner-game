import { UpgradeView } from '@/components/checkout/UpgradeView';

export const metadata = {
  title: 'Upgrade | PRAXIS',
  description:
    'Unlock the Interview Gym: unlimited mock interviews and AI grading. A six-week sprint or a monthly plan with a free trial.',
};

/**
 * The /upgrade route. A thin server shell around the client `UpgradeView`,
 * mirroring how /account wraps AccountView: the pricing cards read auth state
 * from the client store and POST to /api/checkout with a bearer header, so all
 * the logic is client-side and this page carries none.
 *
 * Reachable from /account only for now — there is deliberately NO Topbar nav
 * link to it yet (see the note in UpgradeView).
 */
export default function UpgradePage() {
  return <UpgradeView />;
}
