import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// RepairBench instrumentation probe: read-only observation bridge plus the
// save-file fixture harness, published as window.__CKSE__ (see src/rb-probe.ts).
import './rb-probe';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
