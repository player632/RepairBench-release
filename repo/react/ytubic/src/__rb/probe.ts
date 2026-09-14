/**
 * Offline probe shared by every Tauri shim in this directory.
 *
 * WHY. Upstream YTubic is a Tauri desktop app: all catalogue data reaches it
 * through `@tauri-apps/plugin-http` (a Rust-side client that rejects in a
 * plain browser tab) and all native side effects through `invoke` on
 * `@tauri-apps/api/core`. `environment/adaptation.patch` repoints those nine
 * module specifiers at the shims in `src/__rb/tauri/` through
 * `vite.config.ts`'s `resolve.alias`, so the served build answers from the
 * in-tree corpus in `src/__rb/fixtures.ts` with ZERO runtime network.
 *
 * The probe records what the shims were asked for. It exists so a checkpoint
 * can assert the OFFLINE POSTURE itself (which hosts the transport was asked
 * for, which native commands ran, which external navigations were requested)
 * instead of taking it on faith. Everything is append-only and de-duplicated,
 * so the recorded lists are stable regardless of render order.
 */
export type RbProbe = {
  /** Every `invoke` command name the app asked the native side for. */
  cmds: string[];
  /** Every host the plugin-http shim was asked to reach. */
  hosts: string[];
  /** Every Tauri event name a `listen` was registered for. */
  events: string[];
  /** Every URL handed to `openUrl` / `relaunch` (never actually opened). */
  nav: string[];
  /** `invoke` command names with no entry in the shim table. */
  unknown: string[];
};

declare global {
  interface Window {
    __rb?: RbProbe;
  }
}

export function rbProbe(): RbProbe {
  const host = globalThis as { __rb?: RbProbe };
  if (!host.__rb) {
    host.__rb = { cmds: [], hosts: [], events: [], nav: [], unknown: [] };
  }
  return host.__rb;
}

/** Append `value` to `list` unless it is already there (order-stable set). */
export function rbNote(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value);
}
