import { AccountView } from '@/components/auth/AccountView';

export const metadata = {
  title: 'Account | PRAXIS',
  description:
    'Sign in to back your progress up and carry it across devices. Accounts are optional — progress works locally without one.',
};

/**
 * The /account route. A thin server shell around the client `AccountView`: all
 * auth state and the sync engine live client-side (supabase-js persists the
 * session in localStorage and API calls carry a bearer token), so the page
 * itself carries no server logic. Degrades to a calm "accounts are off" card
 * when Supabase is unconfigured.
 */
export default function AccountPage() {
  return <AccountView />;
}
