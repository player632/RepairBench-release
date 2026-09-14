import 'hammerjs';
import { enableProdMode, ApplicationRef } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
// RepairBench instrumentation: observation bridge (window.__RB__)
import './rb-probe';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(ref => {
    // RepairBench instrumentation: the harness needs an ApplicationRef so it can
    // nudge change detection when a FileReader completion lands outside the zone.
    if ((window as any).__RB__) { (window as any).__RB__.setBootRef(ref.injector.get(ApplicationRef)); }
  })
  .catch(err => console.error(err));
