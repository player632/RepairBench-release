/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { NbAuthService } from '@nebular/auth';
import { AnalyticsService } from './@core/utils/analytics.service';
import { SeoService } from './@core/utils/seo.service';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet><div data-testid=\"authed-indicator\" *ngIf=\"authed | async\"></div>',
})
export class AppComponent implements OnInit {

  authed = this.authService.onAuthenticationChange();

  constructor(private analytics: AnalyticsService, private seoService: SeoService, private authService: NbAuthService) {
  }

  ngOnInit(): void {
    this.analytics.trackPageViews();
    this.seoService.trackCanonicalChanges();
  }
}
