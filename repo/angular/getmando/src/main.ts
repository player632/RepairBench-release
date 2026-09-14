import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app/app.config';

import { App } from './app/app';
// RepairBench adaptation: journal window.open instead of navigating (see src/rb-offline-nav.ts).
import { installOfflineNav } from './rb-offline-nav';
// RepairBench instrumentation: read-only observation bridge (see src/rb-probe.ts). It publishes
// window.__GM__ / window.__GM_CMD__ from the root injector AFTER bootstrap resolves, so the
// snapshot always reads the seed's own services and never participates in change detection.
import { publishProbe } from './rb-probe';

installOfflineNav();

bootstrapApplication(App, appConfig)
  .then((ref) => publishProbe(ref.injector))
  .catch((err) => console.error(err));
