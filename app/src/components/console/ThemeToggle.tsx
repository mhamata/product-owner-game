'use client';

import { useSyncExternalStore } from 'react';

/** The three choices the toggle offers. "system" defers to the OS. */
export type ThemeChoice = 'system' | 'light' | 'dark';

/**
 * The localStorage key this component owns. Also read by the anti-flash boot
 * script in `layout.tsx` (kept in sync there as a literal — it runs before any
 * module graph exists, so it cannot import this constant). NOT in
 * `src/lib/sync/keys.ts`'s allowlist: theme is a per-device display
 * preference, not learner progress, so it deliberately never syncs.
 */
const STORAGE_KEY = 'praxis-theme-v1';

/**
 * Same-tab notification channel. The browser's native `storage` event only
 * fires in OTHER tabs, never the tab that made the write, so `choose()` below
 * dispatches this after every write to keep `useSyncExternalStore` current in
 * the tab the learner is actually using.
 */
const LOCAL_CHANGE_EVENT = 'praxis-theme-change';

function isThemeChoice(v: string | null): v is ThemeChoice {
  return v === 'system' || v === 'light' || v === 'dark';
}

/** Read the persisted choice, or "system" if unset/unavailable. */
function getSnapshot(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemeChoice(stored)) return stored;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through.
  }
  return 'system';
}

/** The server has no localStorage; "system" matches the boot script's default. */
function getServerSnapshot(): ThemeChoice {
  return 'system';
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(LOCAL_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(LOCAL_CHANGE_EVENT, onStoreChange);
  };
}

/** Stamp (or clear) data-theme on <html> to match a choice. */
function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}

function choose(next: ThemeChoice) {
  applyTheme(next);
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Best-effort persistence only; the DOM attribute still applies.
  }
  window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
}

/**
 * Tri-state (system / light / dark) theme control for the Topbar.
 *
 * Reads the persisted choice via `useSyncExternalStore` rather than an
 * effect + setState: this IS an external system (localStorage, plus other
 * tabs via the `storage` event), which is exactly what that hook is for, and
 * it is SSR-safe by construction — `getServerSnapshot` returns "system" on
 * the server, matching the `layout.tsx` boot script's own fallback, so there
 * is never a hydration mismatch to reconcile after the fact.
 */
export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const options: { id: ThemeChoice; label: string }[] = [
    { id: 'system', label: 'Auto' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="mono inline-flex items-center gap-0.5 rounded-console border border-line bg-paper p-0.5"
    >
      {options.map((opt) => {
        const active = choice === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => choose(opt.id)}
            className={[
              'rounded-console-sm px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors duration-150',
              active ? 'bg-accent text-white' : 'text-slate hover:text-ink',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
