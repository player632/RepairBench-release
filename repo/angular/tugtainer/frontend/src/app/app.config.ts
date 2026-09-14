import {
  ApplicationConfig,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';
import { localeInitializer } from './core/initializers/locale-initializer';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { definePreset } from '@primeuix/themes';
import { SlickTranslationLoader } from './core/services/slick-translation-loader.service';
import { getStoredLang, resolveLocale } from './core/services/locale.service';
import { DialogService } from 'primeng/dynamicdialog';

const themePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      loader: provideTranslateLoader(SlickTranslationLoader),
      fallbackLang: 'en',
      lang: resolveLocale(getStoredLang()),
    }),
    {
      provide: LOCALE_ID,
      useFactory: () => resolveLocale(getStoredLang()),
    },
    providePrimeNG({
      theme: {
        preset: themePreset,
        options: {
          darkModeSelector: '.DARK',
        },
      },
    }),
    MessageService,
    DialogService,
    provideAppInitializer(() => localeInitializer()),
  ],
};
