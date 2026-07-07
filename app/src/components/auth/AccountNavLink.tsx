'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/store/authStore';
import { UsersIcon } from '@/components/console/Icon';

/**
 * Topbar entry for the account page, modeled on ReviewNavLink. A client island
 * because the label depends on auth status: "Account" when signed in, "Sign in"
 * otherwise (signed-out OR unconfigured — both offer the same destination and
 * the account page explains the unconfigured case calmly).
 *
 * Hydration-gated the same way the rest of the persisted Console is: on the
 * server and first client paint we render the neutral "Sign in" label so SSR and
 * first paint match; once mounted, `useAuthStore` drives the real label. Without
 * this gate a signed-in user would flash "Sign in" → "Account" and trip a
 * hydration warning.
 */

// A subscribe/getSnapshot pair that returns `false` on the server and first
// paint, then `true` once mounted — the same technique `useHydrated` uses.
const emptySubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function AccountNavLink() {
  const mounted = useMounted();
  const status = useAuthStore((s) => s.status);
  const signedIn = mounted && status === 'signed-in';

  return (
    <Link
      href="/account"
      aria-label={signedIn ? 'Your account' : 'Sign in'}
      className="mono inline-flex items-center gap-1.5 rounded-console border border-line bg-paper px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate no-underline transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
    >
      <UsersIcon size={13} />
      {signedIn ? 'Account' : 'Sign in'}
    </Link>
  );
}
