// INSTRUMENTATION (repair-bench, environment/instrumentation.patch).
// The seed's own route module keeps `ssr = false` (Tauri has no Node server, so the app is a
// static SPA). The two installs below are IDEMPOTENT GUARDS, not the primary install point: the
// harness is installed from src/hooks.client.ts, the earliest client-side module SvelteKit
// evaluates, because installing from a route module is measurably too late - see the note there.
// Kept here so the bridge is live before src/routes/+layout.svelte's onMount calls
// getCurrentWindow() / invoke() even on a load path that skips client hooks.
import { browser } from '$app/environment';
import { installRbStub } from '$lib/rb-stub';
import { installRbProbe } from '$lib/rb-probe';

export const ssr = false;

if (browser) {
  installRbStub();
  installRbProbe();
}
