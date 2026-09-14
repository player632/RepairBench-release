// INSTRUMENTATION (repair-bench, environment/instrumentation.patch).
//
// WHY THIS FILE EXISTS AT ALL - a MEASURED correction (leg COM4, 2026-09-08).
// The native-bridge answers used to be installed from src/routes/+layout.ts. That is too late. ES module
// imports are hoisted: every module a route chunk reaches is evaluated before a single statement of the
// importing module runs, and src/lib/stores/logs.ts:123-125 calls initLogging() as soon as the log store is
// created - initLogging() immediately awaits invoke('get_log_file_path') against a bridge that did not exist
// yet. All four faces of the first four-state leg measured the same consequence: one unhandled rejection
// ("Cannot read properties of undefined (reading 'transformCallback')"), one caught warning ("Failed to
// initialize file logging: ..."), and P01/P20 permanently red on rejectionCount() === 0.
//
// src/hooks.client.ts is the earliest client-side module SvelteKit evaluates - the generated client entry
// imports it statically, while route modules (and therefore the application's own stores) are imported
// dynamically afterwards - so installing from here puts the answers in place before any application module
// runs. rb-stub.ts imports nothing from $lib, which is what makes this ordering safe.
//
// src/routes/+layout.ts keeps its own installRbStub() call: installRbStub() is idempotent, so that call is a
// no-op guard here and still correct if the harness is ever loaded through a path that skips client hooks.
//
// The probe is published with a dynamic import so that nothing in rb-probe.ts - which DOES import the
// application's own stores - is pulled into this early module and thereby moved ahead of the bridge. The
// bridge answers are what must be first; the readers only need to be first among readers.
import { browser } from '$app/environment';
import { installRbStub } from '$lib/rb-stub';

if (browser) {
  installRbStub();
  void import('$lib/rb-probe')
    .then((m) => {
      m.installRbProbe();
    })
    .catch(() => {});
}
