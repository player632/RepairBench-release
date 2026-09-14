/**
 * RepairBench adaptation (offline-ization; disclosed, never a defect target).
 *
 * Two seed code paths call `window.open` on a URL that comes from the dashboard configuration:
 *   - AppCardComponent.openApp()          -> the application's own url (https://plex.example.com ...)
 *   - AppFinderComponent.onSearchEnter()  -> the selected search engine's searchUrl template
 * With [environment].allow_internet = false those calls would be cross-origin navigations that
 * either hang or fail DNS, and a checkpoint that exercises "click a card" / "press enter in the
 * finder" would measure the sandbox's network instead of the seed. This module installs a
 * same-process journal in front of `window.open`: the call is recorded (url + target) and a
 * truthy stub window is returned, so every branch that inspects the return value
 * (`if (openedWindow) this.onHandleResetSearch();` in AppFinderComponent) still takes the
 * success path it would have taken online. No navigation and no request happens.
 *
 * The journal is published read-only through the instrumentation probe (src/rb-probe.ts).
 */
export interface OfflineNavEntry {
  readonly url: string;
  readonly target: string;
  readonly features: string;
  readonly seq: number;
}

const journal: OfflineNavEntry[] = [];
let installed = false;
let nativeOpen: typeof window.open | null = null;

/** Replaces window.open with a recording stub. Idempotent; call once before bootstrap. */
export function installOfflineNav(): void {
  if (installed) return;
  installed = true;
  nativeOpen = window.open.bind(window);
  const stub = {
    closed: false,
    close(): void {},
    focus(): void {},
    blur(): void {},
    location: { href: '', replace(): void {}, assign(): void {} },
  } as unknown as Window;
  const recording = (url?: string | URL, target?: string, features?: string): Window | null => {
    journal.push({
      url: url === undefined ? '' : String(url),
      target: target === undefined ? '' : String(target),
      features: features === undefined ? '' : String(features),
      seq: journal.length + 1,
    });
    return stub;
  };
  window.open = recording as typeof window.open;
}

/** Read-only copy of every window.open call recorded so far. */
export function readOfflineNav(): readonly OfflineNavEntry[] {
  return journal.map((entry) => ({ ...entry }));
}

/** Number of recorded window.open calls. */
export function offlineNavCount(): number {
  return journal.length;
}

/** Escape hatch kept for parity with the native API; never used by the harness. */
export function nativeWindowOpen(): typeof window.open | null {
  return nativeOpen;
}
