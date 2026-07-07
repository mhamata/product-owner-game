'use client';

import { useState, type FormEvent } from 'react';
import { Topbar } from '@/components/console/Topbar';
import { UnavailableOrError, Spinner } from '@/components/console/lesson/verdictUi';
import {
  ArrowRightIcon,
  CheckIcon,
  AlertTriangleIcon,
  RestartIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/console/Icon';
import { browserClient } from '@/lib/supabase/client';
import { useAuthStore, type SyncPhase } from '@/store/authStore';
import { runInitialSync } from '@/lib/sync/engine';

/**
 * The /account page body. Three calm states, matching the console's house style:
 *
 *  - UNCONFIGURED — accounts are off in this environment (no Supabase env vars).
 *    We explain that plainly and how to switch them on, mirroring the
 *    `UnavailableOrError` tone the AI modalities use for their no-key path.
 *  - SIGNED-OUT — an email one-time-code flow (passwordless) plus Google/Apple
 *    OAuth. We explain in one honest sentence what an account actually does.
 *  - SIGNED-IN — email, the live sync status line, a retry for a failed sync,
 *    and sign-out (which leaves local progress in place — we say so).
 *
 * All auth state comes from `useAuthStore` (the mirror of supabase-js), so this
 * component never owns the session; it only issues auth calls and renders state.
 */
export function AccountView() {
  const status = useAuthStore((s) => s.status);

  return (
    <>
      <Topbar />
      <main className="flex-auto">
        <div className="mx-auto max-w-[560px] px-6 py-10">
          <header className="mb-6">
            <div className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate">
              <ShieldIcon size={12} />
              Account
            </div>
            <h1 className="mt-3 text-[24px] font-bold leading-[1.25] tracking-[-0.015em] text-ink">
              Your account
            </h1>
          </header>

          {status === 'unconfigured' && <UnconfiguredCard />}
          {status === 'loading' && <LoadingCard />}
          {status === 'signed-out' && <SignInCard />}
          {status === 'signed-in' && <SignedInCard />}
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------
   Shared card shell so all three states share one padding/border system.
   ------------------------------------------------------------------ */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-console-lg border border-line bg-paper p-[19px_21px] shadow-console-sm">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------
   UNCONFIGURED: accounts are off in this environment.
   ------------------------------------------------------------------ */
function UnconfiguredCard() {
  return (
    <Card>
      <UnavailableOrError
        tone="warn"
        title="Accounts are off here"
        body="Accounts are off in this environment, so there is nothing to sign into. Your progress still works — it lives in this browser."
        note="To switch accounts on, copy app/.env.example to app/.env.local and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server."
      />
    </Card>
  );
}

/* ------------------------------------------------------------------
   LOADING: supabase-js is still resolving the persisted session.
   ------------------------------------------------------------------ */
function LoadingCard() {
  return (
    <Card>
      <div className="flex items-center gap-2.5 text-[13.5px] text-slate">
        <span className="h-[15px] w-[15px] flex-none animate-spin rounded-full border-2 border-line border-t-slate" />
        Checking your session…
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------
   SIGNED-OUT: email one-time-code + OAuth.
   ------------------------------------------------------------------ */
type OtpStage = 'email' | 'code';

function SignInCard() {
  const [stage, setStage] = useState<OtpStage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    const client = browserClient();
    if (!client || !email.trim() || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { error: otpError } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setStage('code');
      setNotice(`We emailed a 6-digit code to ${email.trim()}. Enter it below.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    const client = browserClient();
    if (!client || code.trim().length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      // On success, onAuthStateChange flips the store to 'signed-in' and this
      // whole card unmounts — no local success handling needed here.
      const { error: verifyError } = await client.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      });
      if (verifyError) throw verifyError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code did not work.');
      setBusy(false);
    }
  }

  async function oauth(provider: 'google' | 'apple') {
    const client = browserClient();
    if (!client || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: oauthError } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/account` },
      });
      // A successful call redirects away; if it returns with an error the
      // provider is almost certainly not switched on in the Supabase project.
      if (oauthError) throw oauthError;
    } catch (err) {
      const name = provider === 'google' ? 'Google' : 'Apple';
      setError(
        err instanceof Error && /not enabled|provider/i.test(err.message)
          ? `${name} sign-in isn't switched on yet. Use the email code above, or try another provider.`
          : err instanceof Error
            ? err.message
            : `${name} sign-in is unavailable right now.`,
      );
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-line bg-panel text-slate">
          <UsersIcon size={17} />
        </span>
        <div>
          <div className="text-[15px] font-semibold text-ink">Sign in or create an account</div>
          <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
            No password — just an emailed code
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-[13.5px] leading-[1.6] text-ink-2">
        Your progress currently lives in this browser. An account backs it up and follows you
        across devices.
      </p>

      {stage === 'email' ? (
        <form onSubmit={sendCode} className="mt-4 grid gap-2.5">
          <label htmlFor="account-email" className="sr-only">
            Email address
          </label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-console border border-line bg-panel px-3 py-2.5 text-[14px] text-ink placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || email.trim().length === 0}
            className={buttonPrimary(busy || email.trim().length === 0)}
          >
            {busy ? <Spinner /> : <ArrowRightIcon size={15} />}
            Email me a code
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-4 grid gap-2.5">
          <label htmlFor="account-code" className="sr-only">
            6-digit code
          </label>
          <input
            id="account-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(ev) => setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="mono tnum w-full rounded-console border border-line bg-panel px-3 py-2.5 text-center text-[18px] tracking-[0.3em] text-ink placeholder:text-faint placeholder:tracking-[0.3em] focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || code.trim().length === 0}
            className={buttonPrimary(busy || code.trim().length === 0)}
          >
            {busy ? <Spinner /> : <CheckIcon size={15} />}
            Verify & sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setStage('email');
              setCode('');
              setError(null);
              setNotice(null);
            }}
            className="mono text-[11.5px] uppercase tracking-[0.08em] text-slate underline-offset-2 hover:text-ink hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}

      {notice && (
        <p className="mt-3 text-[12.5px] leading-[1.55] text-slate">{notice}</p>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-[1.55] text-bad">
          <AlertTriangleIcon size={13} className="mt-0.5 flex-none" />
          <span>{error}</span>
        </p>
      )}

      {/* OAuth alternatives */}
      <div className="mt-5 border-t border-dashed border-line pt-4">
        <div className="mono mb-2.5 text-[10px] uppercase tracking-[0.12em] text-mute">
          Or continue with
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => oauth('google')} disabled={busy} className={buttonSecondary(busy)}>
            Continue with Google
          </button>
          <button type="button" onClick={() => oauth('apple')} disabled={busy} className={buttonSecondary(busy)}>
            Continue with Apple
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------
   SIGNED-IN: identity + sync status + sign out.
   ------------------------------------------------------------------ */
function SignedInCard() {
  const user = useAuthStore((s) => s.user);
  const syncPhase = useAuthStore((s) => s.syncPhase);
  const lastSyncedAt = useAuthStore((s) => s.lastSyncedAt);
  const syncError = useAuthStore((s) => s.syncError);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    const client = browserClient();
    if (!client || signingOut) return;
    setSigningOut(true);
    // onAuthStateChange('SIGNED_OUT') flips the store back to signed-out and
    // this card unmounts; local progress stays in localStorage untouched.
    await client.auth.signOut().catch(() => {
      setSigningOut(false);
    });
  }

  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-good-line bg-good-050 text-good">
          <CheckIcon size={17} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-ink">
            {user?.email ?? 'Signed in'}
          </div>
          <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
            {user?.provider ? `via ${user.provider}` : 'Signed in'}
          </div>
        </div>
      </div>

      {/* sync status line */}
      <div className="mt-4 rounded-console border border-line bg-panel p-[13px_15px]">
        <SyncStatusLine
          phase={syncPhase}
          lastSyncedAt={lastSyncedAt}
          error={syncError}
        />
      </div>

      <p className="mt-4 text-[12.5px] leading-[1.55] text-slate">
        Signing out leaves your progress in this browser — nothing is deleted. Sign back in on any
        device to pick it up.
      </p>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className={`mt-3 ${buttonSecondary(signingOut)}`}
      >
        {signingOut ? <Spinner /> : null}
        Sign out
      </button>
    </Card>
  );
}

/** The one-line sync status, with a retry button on the error path. */
function SyncStatusLine({
  phase,
  lastSyncedAt,
  error,
}: {
  phase: SyncPhase;
  lastSyncedAt: number | null;
  error: string | null;
}) {
  if (phase === 'syncing') {
    return (
      <div className="flex items-center gap-2 text-[13px] text-slate">
        <span className="h-[13px] w-[13px] flex-none animate-spin rounded-full border-2 border-line border-t-slate" />
        Backing up your progress…
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="grid gap-2">
        <div className="flex items-start gap-1.5 text-[13px] leading-[1.5] text-bad">
          <AlertTriangleIcon size={14} className="mt-0.5 flex-none" />
          <span>Sync failed{error ? `: ${error}` : '.'}</span>
        </div>
        <button
          type="button"
          onClick={() => void runInitialSync()}
          className="mono inline-flex w-fit items-center gap-1.5 rounded-console border border-line bg-paper px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate transition-[border-color,color] duration-150 hover:border-faint hover:text-ink"
        >
          <RestartIcon size={13} />
          Retry sync
        </button>
      </div>
    );
  }

  if (phase === 'synced' && lastSyncedAt) {
    const time = new Date(lastSyncedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <div className="flex items-center gap-2 text-[13px] text-good">
        <CheckIcon size={14} className="flex-none" />
        <span className="text-ink-2">
          Progress synced · <span className="tnum text-slate">last synced {time}</span>
        </span>
      </div>
    );
  }

  return <div className="text-[13px] text-slate">Your progress is backed up to this account.</div>;
}

/* ------------------------------------------------------------------
   Shared button class builders (primary accent / secondary outline).
   ------------------------------------------------------------------ */
function buttonPrimary(disabled: boolean): string {
  return [
    'mono inline-flex w-full items-center justify-center gap-2 rounded-console border-0 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform] duration-150 active:translate-y-px',
    disabled ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none' : 'bg-accent text-white hover:bg-accent-700',
  ].join(' ');
}

function buttonSecondary(disabled: boolean): string {
  return [
    'mono inline-flex w-full items-center justify-center gap-2 rounded-console border border-line bg-paper px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-[border-color,color] duration-150',
    disabled
      ? 'cursor-not-allowed text-faint'
      : 'text-slate hover:border-faint hover:text-ink active:translate-y-px',
  ].join(' ');
}
