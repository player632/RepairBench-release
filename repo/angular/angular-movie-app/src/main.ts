import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
// repair-bench INSTRUMENTATION: imported for its side effect only - it publishes window.__AMA__ and
// starts its MutationObserver before the first change detection, so the spinner latch cannot miss
// the boot transient. It adds no provider, no route and no declaration.
import './app/rb-probe';

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true
})
  .then((mod) => {
    // repair-bench INSTRUMENTATION: hand the NgModuleRef to the bridge so a checkpoint can ask for a
    // change-detection tick explicitly instead of racing one. Read-only.
    window.__AMA__.attachApp(mod);
  })
  .catch(err => console.error(err));
