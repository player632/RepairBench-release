import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
// repair-bench INSTRUMENTATION: the observation bridge is imported for its side effect (it
// publishes window.__CAP__ and starts its MutationObserver before the first change detection).
import './app/rb-probe';

bootstrapApplication(AppComponent, appConfig)
  .then((ref) => {
    // repair-bench INSTRUMENTATION: hand the live ApplicationRef to the bridge so a checkpoint can
    // ask for a change-detection tick explicitly instead of racing one. Read-only.
    window.__CAP__.attachApp(ref);
  })
  .catch((err) => console.error(err));
