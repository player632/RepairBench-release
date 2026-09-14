import { DOCUMENT, inject, Injectable } from '@angular/core';
import { httpResource, type HttpResourceRef } from '@angular/common/http';
import { getEndpoints } from '~core/constants/endpoints.constants';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly endpoints = getEndpoints();
  private readonly document = inject(DOCUMENT);

  loadGtmScript() {
    // eslint-disable-next-line no-multi-assign
    const dataLayer = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??= []);
    dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=GTM-TJQKDC6M`;
    this.document.head.appendChild(script);
  }

  getRealtimeUsersResource(): HttpResourceRef<{ activeUsers: number }> {
    return httpResource<{ activeUsers: number }>(
      () => ({ url: this.endpoints.analytics.v1.realtimeUsers }),
      {
        defaultValue: { activeUsers: 1 },
      },
    );
  }
}
