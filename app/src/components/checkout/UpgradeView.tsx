'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/console/Topbar';
import { UnavailableOrError, Spinner } from '@/components/console/lesson/verdictUi';
import { ArrowRightIcon, RocketIcon, SparkleIcon, AlertTriangleIcon } from '@/components/console/Icon';
import { authHeaders } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { PlanId } from '@/lib/stripe';

/**
 * The /upgrade page body. Two pricing cards for the Interview Gym wedge, in the
 * console house style (same Card/border/button system as AccountView).
 *
 *  - Interview Sprint — $99 one-time, six weeks of access.
 *  - Monthly — $39/mo with a 3-day free trial.
 *
 * Each buy button POSTs /api/checkout with the bearer header and redirects to
 * the returned Stripe URL. The three non-success shapes are handled calmly:
 *  - `{ unavailable }` → payments are off in this environment (warn tone).
 *  - 401 → a prompt to sign in, with a link to /account.
 *  - error → the message, in the bad tone.
 *
 * When signed-out or unconfigured (from the auth store), the buttons become
 * "Sign in to purchase" links to /account instead — a purchase needs a user.
 *
 * NOTE: there is intentionally no Topbar nav link to /upgrade yet; it is
 * reachable from /account only for now.
 */
export function UpgradeView() {
  const status = useAuthStore((s) => s.status);
  const canPurchase = status === 'signed-in';

  return (
    <>
      <Topbar />
      <main className="flex-auto">
        <div className="mx-auto max-w-[720px] px-6 py-10">
          <header className="mb-6">
            <div className="mono inline-flex items-center gap-1.5 rounded-console-sm border border-line bg-panel px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate">
              <RocketIcon size={12} />
              Interview Gym
            </div>
            <h1 className="mt-3 text-[24px] font-bold leading-[1.25] tracking-[-0.015em] text-ink">
              Unlock the Interview Gym
            </h1>
            <p className="mt-2 text-[14px] leading-[1.6] text-ink-2">
              Unlimited mock interviews with a hiring-committee scorecard, plus AI grading on your
              real PM deliverables. Pick the plan that fits how you are preparing.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <PlanCard
              plan="sprint"
              title="Interview Sprint"
              price="$99"
              cadence="one-time"
              blurb="Six weeks of full access — built for a focused run at an upcoming loop."
              canPurchase={canPurchase}
            />
            <PlanCard
              plan="monthly"
              title="Monthly"
              price="$39"
              cadence="per month"
              blurb="Keep sharp between searches. Starts with a 3-day free trial — cancel anytime."
              badge="3-day free trial"
              canPurchase={canPurchase}
            />
          </div>

          {!canPurchase && (
            <p className="mt-5 text-[12.5px] leading-[1.55] text-slate">
              {status === 'unconfigured'
                ? 'Accounts are off in this environment, so checkout is unavailable here.'
                : 'Sign in first so your purchase attaches to your account.'}
            </p>
          )}
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------
   Shared card shell — same padding/border system as AccountView's Card.
   ------------------------------------------------------------------ */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-console-lg border border-line bg-paper p-[19px_21px] shadow-console-sm">
      {children}
    </div>
  );
}

type CheckoutState =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'unavailable'; message: string }
  | { kind: 'needs-auth' }
  | { kind: 'error'; message: string };

function PlanCard({
  plan,
  title,
  price,
  cadence,
  blurb,
  badge,
  canPurchase,
}: {
  plan: PlanId;
  title: string;
  price: string;
  cadence: string;
  blurb: string;
  badge?: string;
  canPurchase: boolean;
}) {
  const [state, setState] = useState<CheckoutState>({ kind: 'idle' });

  async function startCheckout() {
    if (state.kind === 'busy') return;
    setState({ kind: 'busy' });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ plan }),
      });

      if (res.status === 401) {
        setState({ kind: 'needs-auth' });
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        unavailable?: boolean;
        message?: string;
        error?: string;
      };

      if (data.unavailable) {
        setState({ kind: 'unavailable', message: data.message ?? 'Payments are off here.' });
        return;
      }
      if (!res.ok || !data.url) {
        setState({ kind: 'error', message: data.error ?? 'Could not start checkout.' });
        return;
      }

      // Hand off to Stripe's hosted checkout.
      window.location.assign(data.url);
    } catch {
      setState({ kind: 'error', message: 'Could not reach checkout. Check your connection and try again.' });
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-line bg-panel text-slate">
          <SparkleIcon size={17} />
        </span>
        <div>
          <div className="text-[15px] font-semibold text-ink">{title}</div>
          {badge && (
            <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-good">{badge}</div>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex items-baseline gap-1.5">
        <span className="tnum text-[28px] font-bold leading-none tracking-[-0.02em] text-ink">
          {price}
        </span>
        <span className="mono text-[11px] uppercase tracking-[0.08em] text-mute">{cadence}</span>
      </div>

      <p className="mt-2.5 flex-auto text-[13px] leading-[1.6] text-ink-2">{blurb}</p>

      {/* Result surfaces below the copy, above the action. */}
      {state.kind === 'unavailable' && (
        <div className="mt-3.5 rounded-console border border-line bg-panel p-[13px_15px]">
          <UnavailableOrError
            tone="warn"
            title="Payments are off here"
            body={state.message}
            note="This environment has no Stripe keys set. Your progress and drills are unaffected."
          />
        </div>
      )}
      {state.kind === 'needs-auth' && (
        <p className="mt-3.5 flex items-start gap-1.5 text-[12.5px] leading-[1.55] text-slate">
          <AlertTriangleIcon size={13} className="mt-0.5 flex-none" />
          <span>
            Sign in first —{' '}
            <Link href="/account" className="text-accent underline-offset-2 hover:underline">
              go to your account
            </Link>
            .
          </span>
        </p>
      )}
      {state.kind === 'error' && (
        <p className="mt-3.5 flex items-start gap-1.5 text-[12.5px] leading-[1.55] text-bad">
          <AlertTriangleIcon size={13} className="mt-0.5 flex-none" />
          <span>{state.message}</span>
        </p>
      )}

      <div className="mt-4">
        {canPurchase ? (
          <button
            type="button"
            onClick={startCheckout}
            disabled={state.kind === 'busy'}
            className={buttonPrimary(state.kind === 'busy')}
          >
            {state.kind === 'busy' ? <Spinner /> : <ArrowRightIcon size={15} />}
            {plan === 'monthly' ? 'Start free trial' : 'Get the Sprint'}
          </button>
        ) : (
          <Link href="/account" className={buttonPrimary(false)}>
            <ArrowRightIcon size={15} />
            Sign in to purchase
          </Link>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------
   Primary button class builder — matches AccountView's buttonPrimary.
   ------------------------------------------------------------------ */
function buttonPrimary(disabled: boolean): string {
  return [
    'mono inline-flex w-full items-center justify-center gap-2 rounded-console border-0 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] shadow-console-md transition-[background,transform] duration-150 active:translate-y-px',
    disabled
      ? 'cursor-not-allowed bg-panel-2 text-faint shadow-none'
      : 'bg-accent text-white hover:bg-accent-700',
  ].join(' ');
}
