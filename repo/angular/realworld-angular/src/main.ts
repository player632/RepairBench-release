import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Instrumentation: boot-time hash hook. #token=<value> seeds localStorage
// jwtToken before bootstrap (empty value clears it), enabling deterministic
// invalid-token / flaky-token startup sequences for the checkpoints.
(function applyBootTokenHook(): void {
  const match = /^#token=(.*)$/.exec(window.location.hash || '');
  if (match) {
    const value = decodeURIComponent(match[1]);
    if (value) {
      window.localStorage.setItem('jwtToken', value);
    } else {
      window.localStorage.removeItem('jwtToken');
    }
  }
})();

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
