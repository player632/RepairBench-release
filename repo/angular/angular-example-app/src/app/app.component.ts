import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '~shared/components/header/header.component';
import { FooterComponent } from '~shared/components/footer/footer.component';
import { filter, map } from 'rxjs';
import { HeaderService } from '~core/services/ui/header.service';
import { CookiePopupComponent } from '~shared/components/cookie-popup/cookie-popup.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastStackComponent } from '~shared/components/toast-stack/toast-stack.component';
import { SeoService } from '~core/services/seo.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    CookiePopupComponent,
    ToastStackComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly headerService = inject(HeaderService);
  private readonly seoService = inject(SeoService);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly canonicalEffect = effect(() => {
    const url = this.currentUrl();
    this.headerService.setCanonical(url);
  });

  constructor() {
    this.seoService.setBasicTags();
  }
}
