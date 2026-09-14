import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { chatMockInterceptor } from './chat-mock.interceptor';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [provideAnimations(), provideHttpClient(withInterceptors([chatMockInterceptor]))],
};
