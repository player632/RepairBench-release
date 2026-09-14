import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

setBasePath('/shoelace');

bootstrapApplication(AppComponent, appConfig).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});
