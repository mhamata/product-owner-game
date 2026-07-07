/**
 * A dependency-free seam between the raw localStorage write sites
 * (`artifactVersionsV2`, `InterviewSession`) and the sync engine.
 *
 * `artifactVersionsV2` is a pure, React-free module with node-env unit tests and
 * ZERO side effects; importing the executor (which pulls in the eight Zustand
 * store hooks and supabase-js) directly there would create an import cycle and
 * break those tests. So the write sites call `notifySyncKeyChanged(key)` — a
 * one-liner — and the executor registers a handler at runtime. When no handler
 * is registered (SSR, tests, signed-out) the call is a silent no-op.
 */

type SyncKeyHandler = (key: string) => void;

let handler: SyncKeyHandler | null = null;

/** The executor installs its `schedulePush` here once, in the browser. */
export function registerSyncKeyHandler(fn: SyncKeyHandler | null): void {
  handler = fn;
}

/** Notify the sync engine that an allowlisted localStorage key changed. */
export function notifySyncKeyChanged(key: string): void {
  handler?.(key);
}
