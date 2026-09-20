import { enableProdMode, ApplicationRef } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
// RepairBench instrumentation: observation bridge (window.__RB__)
import './app/rb-probe';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .then((ref) => {
    // RepairBench instrumentation: hand the ApplicationRef to the bridge so
    // readiness means BOOTSTRAP + ONE CHANGE-DETECTION TURN, never window.load.
    if ((window as any).__RB__) { (window as any).__RB__.setBootRef(ref.injector.get(ApplicationRef)); }
  })
  .catch(err => console.error(err));

