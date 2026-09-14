/**
 * INSTRUMENTATION (repair-bench, environment/instrumentation.patch) - read-only observation bridge
 * for repair-angular__angular-movie-app-01, published on `window.__AMA__`.
 *
 * WHY IT EXISTS. The seed ships *.spec.ts stubs for a handful of components but angular.json sets
 * `"skipTests": true` for every schematic and `ng test` needs karma + a real Chrome, so there is no
 * usable test facility inside the built bundle. tests/dsl.json therefore reads the rendered app
 * through this bridge. Every getter below only queries the DOM, the computed style, or the
 * performance resource timeline; every driver only dispatches the same DOM events a user would
 * (`input` for ngModel, a `keyup` KeyboardEvent for the (keyup[.enter]) binding, `change` for the
 * season <select>, `.click()` for buttons, cards and links). NOTHING here reads or writes a
 * component field: no ApiService, no HomeComponent.moviesSlider, no MoviesInfoComponent.activeTab.
 *
 * TWO CHANNELS, DELIBERATELY SEPARATED (methodology §1.4 掩盖审计 / design_lint C20). A checkpoint
 * must be able to LOCATE an element while a defect is breaking that element's own asserted
 * property, otherwise one defect turns several checkpoints red and the F2P partition stops being
 * exclusive. So:
 *   - LOCATING is by the static `data-rb-*` attributes the instrumentation patch adds, or by the
 *     seed's own static class tokens (`.label`, `.value`, `.card__name`, `.listing__title`). No
 *     locator depends on a binding this package mutates.
 *   - ASSERTING is exact and reads the property under repair (the interpolated text, the
 *     `[style.width.%]` value, the `disabled` attribute, the element count).
 *
 * FACTS ARE READ BY LABEL, NOT BY INDEX. media.component.html renders the movie/TV/person fact
 * lists as `<li><div class="label">X</div><div class="value">Y</div></li>` inside three `<ul>`s
 * that the instrumentation tags `data-rb-facts="movie|tv|person"`. `factValue('Runtime')` walks
 * that subtree and returns the `.value` text of the `<li>` whose `.label` text is exactly
 * 'Runtime'. A defect that changes a VALUE therefore cannot move the reading's address, and a
 * defect that removes the row is visible as '' rather than as a shifted index.
 *
 * TRANSIENT STATES ARE LATCHED, NOT SAMPLED. ngx-spinner is shown in ngOnInit and hidden by a
 * 2000 ms setTimeout (app/home/movies/tv/person/movie-category), the home and movies sliders add
 * `delay(2000)`, and the mock transport replies after a constant 120 ms - so the settled DOM only
 * exists after ~2.2 s. A MutationObserver samples on every DOM change and freezes the FIRST
 * in-flight reading (spinner visible, card counts, slide count) into `latch`, which the getters
 * expose, so a checkpoint can assert that the transient state really happened instead of trusting
 * a sleep. Each dsl_runner checkpoint starts a fresh browser context, so the latch always starts
 * empty and can only be filled by that checkpoint's own scenario.
 *
 * ENTROPY. No getter reads Date.now(), Math.random(), navigator, or the network. `currentYear()`
 * DOES read the clock, and it exists for exactly one purpose: the footer's `© {{ currentYear }}`
 * is the seed's own live clock read (footer.component.ts:8), so the honest assertion is
 * "the rendered four-digit year equals the year the page itself computes", not a frozen literal
 * that would silently rot on 1 January. dsl.json pins context.locale='en-US' and
 * context.timezoneId='UTC' so Angular's built-in DatePipe ('mediumDate' = MMM d, y) is stable.
 */
import { ApplicationRef } from '@angular/core';

/** Globals this package itself installs. Anything else starting with `__` is residue. */
const OWN_GLOBALS = ['__AMA__', '__AMA_API__'];
/** zone.js decorates window with `__zone_symbol__*` keys; those are the framework, not residue. */
const OWN_GLOBAL_PREFIXES = ['__zone_symbol__'];

/** Mirrors src/app/api/tmdb-mock.interceptor.ts's own channel shape, field for field. */
interface AmaApiRecord {
  n: number;
  method: string;
  path: string;
  page: string | null;
  query: string | null;
  matched: string;
  status: number;
  at: number;
}
interface AmaApiState { requests: AmaApiRecord[]; foreign: string[]; count: number }
const EMPTY_API: AmaApiState = { requests: [], foreign: [], count: 0 };

interface Latches {
  samples: number;
  spinnerSeen: boolean;
  inflightCardCount: number;
  inflightSlideCount: number;
  inflightBodyTextBytes: number;
}
const emptyLatch = (): Latches => ({
  samples: 0, spinnerSeen: false, inflightCardCount: -1, inflightSlideCount: -1, inflightBodyTextBytes: -1,
});
const latch: Latches = emptyLatch();
const errors: string[] = [];

const q = (sel: string): HTMLElement | null => document.querySelector(sel) as HTMLElement | null;
const qa = (sel: string): HTMLElement[] => Array.from(document.querySelectorAll(sel)) as HTMLElement[];
const text = (el: Element | null): string => (el === null ? '' : (el.textContent || '').replace(/\s+/g, ' ').trim());
const attr = (el: Element | null, name: string): string => (el === null ? '' : el.getAttribute(name) || '');
const computed = (el: Element | null, prop: string): string =>
  el === null ? '' : window.getComputedStyle(el).getPropertyValue(prop);

const apiState = (): AmaApiState =>
  (globalThis as unknown as { __AMA_API__?: AmaApiState }).__AMA_API__ ?? EMPTY_API;
const apiLog = (): AmaApiRecord[] => apiState().requests;

// ---------------------------------------------------------------- adaptation / determinism
const externalRefTags = (): { tag: string; attrName: string; url: string }[] =>
  qa('[src],[href]')
    .map((el) => {
      const isImg = el.tagName === 'IMG' || el.tagName === 'IFRAME' || el.tagName === 'SCRIPT';
      const name = isImg ? 'src' : 'href';
      return { el, name, url: el.getAttribute(name) || '' };
    })
    .filter((r) => /^https?:\/\//.test(r.url) && !r.url.includes('127.0.0.1') && !r.url.includes('localhost'))
    .map((r) => ({ tag: r.el.tagName.toLowerCase(), attrName: r.name, url: r.url.slice(0, 200) }));

const foreignResourceEntries = (): string[] => {
  const here = window.location.origin;
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => {
      try { return new URL(name, window.location.href).origin !== here; } catch { return true; }
    });
};

const imgs = (): HTMLImageElement[] => qa('img') as HTMLImageElement[];
const rbImgs = (): HTMLImageElement[] => imgs().filter((i) => (i.currentSrc || i.getAttribute('src') || '').includes('/rb/'));
const extraGlobals = (): string[] =>
  Object.getOwnPropertyNames(window).filter((k) => {
    if (!k.startsWith('__')) return false;
    if (OWN_GLOBALS.includes(k)) return false;
    return !OWN_GLOBAL_PREFIXES.some((p) => k.startsWith(p));
  });

// ---------------------------------------------------------------- structural helpers
const slides = (): HTMLElement[] => qa('[data-rb-slide]');
const carousels = (): HTMLElement[] => qa('[data-rb-carousel]');
const cardsOf = (root: HTMLElement | null): HTMLElement[] =>
  root === null ? [] : (Array.from(root.querySelectorAll('[data-rb-carousel-card]')) as HTMLElement[]);
const listingCards = (): HTMLElement[] => qa('[data-rb-listing-card]');
const searchCards = (): HTMLElement[] => qa('[data-rb-search-result]');
const videoCards = (): HTMLElement[] => qa('[data-rb-video-card]');
const episodeItems = (): HTMLElement[] => qa('[data-rb-episode-item]');
const backdropItems = (): HTMLElement[] => qa('[data-rb-backdrop-item]');
const posterItems = (): HTMLElement[] => qa('[data-rb-poster-item]');
const tabs = (): HTMLElement[] => qa('[data-rb-tab]');
const seasonSelect = (): HTMLSelectElement | null => q('[data-rb-season-select]') as HTMLSelectElement | null;
const seasonOptions = (): HTMLOptionElement[] => {
  const el = seasonSelect();
  if (el === null) return [];
  return Array.from(el.options);
};

/** The facts <ul> for a media kind, then the .value text of the <li> whose .label is exactly `label`. */
const factValue = (kind: string, label: string): string => {
  const ul = q(`[data-rb-facts="${kind}"]`);
  if (ul === null) return '';
  for (const li of Array.from(ul.querySelectorAll('li'))) {
    const lab = li.querySelector('.label');
    if (lab !== null && (lab.textContent || '').replace(/\s+/g, ' ').trim() === label) {
      const val = li.querySelector('.value');
      return val === null ? '' : (val.textContent || '').replace(/\s+/g, ' ').trim();
    }
  }
  return '';
};
const factLabels = (kind: string): string[] => {
  const ul = q(`[data-rb-facts="${kind}"]`);
  if (ul === null) return [];
  return Array.from(ul.querySelectorAll('li > .label')).map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim());
};
const factRowCount = (kind: string): number => {
  const ul = q(`[data-rb-facts="${kind}"]`);
  return ul === null ? 0 : ul.querySelectorAll('li').length;
};
const cardName = (card: HTMLElement | undefined): string => (card === undefined ? '' : text(card.querySelector('.card__name')));
const cardVote = (card: HTMLElement | undefined): string => (card === undefined ? '' : text(card.querySelector('.card__vote')));
const cardStarsWidth = (card: HTMLElement | undefined): string => {
  if (card === undefined) return '';
  const inner = card.querySelector('.card__stars > div');
  return inner === null ? '' : (inner as HTMLElement).style.width || computed(inner, 'width');
};
// [style.width.%] writes an inline width style; the number is normalised to 3 decimals so a
// floating-point artefact of the seed's own (va / 10) * 100 arithmetic cannot become the reading.
const widthPercent = (raw: string): number => {
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : -1;
};
const castName = (card: HTMLElement | undefined): string =>
  card === undefined ? '' : text(card.querySelector('.credits-item__name'));
const cardImgSrc = (card: HTMLElement | undefined): string =>
  card === undefined ? '' : (card.querySelector('img')?.getAttribute('src') || '');
const itemsBox = (index: number): HTMLElement | null =>
  (carousels()[index]?.querySelector('[data-rb-carousel-items]') as HTMLElement | null) ?? null;
const cardPlaceholderCount = (card: HTMLElement | undefined): number =>
  card === undefined ? 0 : card.querySelectorAll('.card__img > span > svg').length;

// ---------------------------------------------------------------- drivers (real DOM events only)
const searchInput = (): HTMLInputElement | null => q('[data-rb-search-input]') as HTMLInputElement | null;
const typeIntoQuery = (value: string): boolean => {
  const el = searchInput();
  if (el === null) return false;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
};
const pressKeyUp = (key: string): boolean => {
  const el = searchInput();
  if (el === null) return false;
  el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  return true;
};
const blurSearch = (): boolean => {
  const el = searchInput();
  if (el === null) return false;
  el.dispatchEvent(new FocusEvent('blur'));
  return true;
};
const clickByTab = (name: string): boolean => {
  const el = tabs().find((t) => attr(t, 'data-rb-tab') === name);
  if (el === undefined) return false;
  el.click();
  return true;
};
const clickFirst = (sel: string): boolean => {
  const el = q(sel);
  if (el === null) return false;
  el.click();
  return true;
};
const clickCarouselNav = (which: 'next' | 'prev', index: number): boolean => {
  const c = carousels()[index];
  if (c === undefined) return false;
  const btn = c.querySelector(`[data-rb-carousel-${which}]`) as HTMLElement | null;
  if (btn === null) return false;
  btn.click();
  return true;
};
const selectSeason = (value: string): boolean => {
  const el = q('[data-rb-season-select]') as HTMLSelectElement | null;
  if (el === null) return false;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

// ---------------------------------------------------------------- latched transient readings
let observer: MutationObserver | null = null;
let appRef: ApplicationRef | null = null;
// ngx-spinner's HOST element <ngx-spinner> is a permanent child of app.component.html; what comes
// and goes is the overlay it renders under *ngIf="spinner.show" (class .ngx-spinner-overlay, removed
// ~10 ms after NgxSpinnerService.hide() by the service's own debounce). The first version of this
// probe measured the HOST's computed display, which is 'block' whether the spinner is up or down, so
// spinnerSeen() latched on the very first sample and spinnerVisible() was true forever - a pair of
// readings that could not fail, i.e. exactly the kind of always-true assertion this package must not ship. Reading the
// overlay is what makes "it was up while the data was in flight, and it is down once settled" a real
// measurement on all four faces.
const spinnerVisibleNow = (): boolean => {
  const ov = q('.ngx-spinner-overlay');
  if (ov === null) return false;
  return computed(ov, 'display') !== 'none' && computed(ov, 'visibility') !== 'hidden';
};
const sample = (): void => {
  latch.samples += 1;
  if (latch.spinnerSeen) return;
  if (!spinnerVisibleNow()) return;
  latch.spinnerSeen = true;
  latch.inflightCardCount = cardsOf(carousels()[0] ?? null).length;
  latch.inflightSlideCount = slides().length;
  latch.inflightBodyTextBytes = (document.body?.innerText || '').length;
};
const startObserver = (): void => {
  if (observer !== null) return;
  observer = new MutationObserver(() => { sample(); });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
  sample();
};

export interface AmaApi {
  readonly version: string;
  attachApp(mod: unknown): void;
  tick(): boolean;
  // ---- document / routing chrome ----
  docTitle(): string;
  htmlLang(): string;
  baseHref(): string;
  locationPathname(): string;
  locationSearch(): string;
  locationHash(): string;
  bodyTextBytes(): number;
  appRootChildCount(): number;
  // ---- adaptation: zero remote origin ----
  externalRefTagCount(): number;
  externalRefUrls(): string;
  hasGtag(): boolean;
  hasDataLayer(): boolean;
  foreignResourceEntryCount(): number;
  foreignResourceEntryNames(): string;
  imgCount(): number;
  rbImgCount(): number;
  rbImgLeafNames(): string;
  brokenImgCount(): number;
  brokenImgSrcs(): string;
  localStubPageCount(): number;
  // ---- mock transport record ----
  apiRequestCount(): number;
  apiPathList(): string;
  apiLastPath(): string;
  apiLastPage(): string;
  apiLastQuery(): string;
  apiLastStatus(): number;
  apiForeignCount(): number;
  apiForeignList(): string;
  apiChannelCount(): number;
  apiCountForPrefix(prefix: string): number;
  apiPageListForPrefix(prefix: string): string;
  apiStatusListForPrefix(prefix: string): string;
  // ---- determinism / isolation ----
  localStorageKeyCount(): number;
  sessionStorageKeyCount(): number;
  cookieString(): string;
  extraGlobalCount(): number;
  extraGlobalNames(): string;
  errorCount(): number;
  errorDetail(): string;
  // ---- latched transient readings ----
  latchSamples(): number;
  spinnerSeen(): boolean;
  spinnerVisible(): boolean;
  inflightCardCount(): number;
  inflightSlideCount(): number;
  inflightBodyTextBytes(): number;
  // ---- hero slider (home + /movie + /tv) ----
  slideCount(): number;
  slideName(): string;
  slideDescText(): string;
  slideDescLength(): number;
  slideReviewsText(): string;
  slideStarsWidth(): string;
  slideStarsWidthPercent(): number;
  slideTrailerButtonCount(): number;
  slideBackdropSrc(): string;
  slideSeasonSpanCount(): number;
  slideDateText(): string;
  // ---- hero (detail pages) ----
  heroName(): string;
  heroDescText(): string;
  heroDescLength(): number;
  heroReviewsText(): string;
  heroStarsWidth(): string;
  heroStarsWidthPercent(): number;
  heroTrailerButtonCount(): number;
  heroBackdropSrc(): string;
  heroSeasonSpanCount(): number;
  heroDateText(): string;
  // ---- carousels ----
  carouselCount(): number;
  carouselTitle(index: number): string;
  carouselCardCount(index: number): number;
  carouselCardName(index: number, card: number): string;
  carouselCardVote(index: number, card: number): string;
  carouselCardStarsWidth(index: number, card: number): string;
  carouselCardStarsWidthPercent(index: number, card: number): number;
  carouselCastNameList(index: number): string;
  carouselCardImgSrc(index: number, card: number): string;
  carouselCardPlaceholderCount(index: number, card: number): number;
  carouselNameList(index: number): string;
  carouselExploreCardLink(index: number): string;
  carouselNextDisabled(index: number): boolean;
  carouselPrevDisabled(index: number): boolean;
  carouselScrollLeft(index: number): number;
  carouselClientWidth(index: number): number;
  carouselScrollWidth(index: number): number;
  // ---- media facts panel ----
  factLabelsOf(kind: string): string;
  factRowCountOf(kind: number | string): number;
  factValueOf(kind: string, label: string): string;
  runtimeValue(): string;
  budgetValue(): string;
  revenueValue(): string;
  releasedValue(): string;
  releasedIsMediumDate(): boolean;
  statusValue(): string;
  lastAiredValue(): string;
  lastAiredStartsWithDollar(): boolean;
  lastAiredIsDollarMediumDate(): boolean;
  firstAiredValue(): string;
  tvLanguageValue(): string;
  genreLinkCount(): number;
  genreLinkTexts(): string;
  genreLinkHref(index: number): string;
  storylineText(): string;
  storylineLength(): number;
  posterSrc(): string;
  posterNaturalWidth(): number;
  posterCount(): number;
  externalAnchorCount(): number;
  externalAnchorHrefs(): string;
  socialAnchorCount(): number;
  imdbAnchorHref(): string;
  // ---- tabs / panels ----
  tabCount(): number;
  tabNames(): string;
  tabActiveNames(): string;
  panelPresent(name: string): boolean;
  // ---- videos / images / episodes panels ----
  videoCardCount(): number;
  videoCardName(index: number): string;
  videoCardType(index: number): string;
  videoThumbSrc(index: number): string;
  videoThumbSrcIsLocal(index: number): boolean;
  videoTypeList(): string;
  backdropItemCount(): number;
  posterItemCount(): number;
  backdropCountText(): string;
  posterCountText(): string;
  backdropImgSrc(index: number): string;
  episodeItemCount(): number;
  episodeCountText(): string;
  episodeFirstName(): string;
  episodeAiredList(): string;
  seasonOptionCount(): number;
  seasonSelectedValue(): string;
  seasonOptionLabels(): string;
  // ---- modal ----
  modalPresent(): boolean;
  modalIframePresent(): boolean;
  modalIframeSrc(): string;
  modalIframeSrcIsLocalStub(): boolean;
  // ---- listing (person known-for) ----
  listingCardCount(): number;
  listingTitle(): string;
  listingFirstName(): string;
  listingNameList(): string;
  listingPlaceholderCount(): number;
  // ---- search ----
  searchPanelPresent(): boolean;
  searchInputPresent(): boolean;
  searchInputValue(): string;
  searchInputPlaceholder(): string;
  searchCloseButtonPresent(): boolean;
  searchResultCount(): number;
  searchResultTitle(index: number): string;
  searchResultStarsWidth(index: number): string;
  searchResultStarsWidthPercent(index: number): number;
  searchResultVote(index: number): string;
  searchNoResultsPresent(): boolean;
  searchNoResultsText(): string;
  searchHeadingText(): string;
  // ---- footer / navbar chrome ----
  footerCopyText(): string;
  footerCopyYear(): string;
  footerCopyYearMatchesCurrentYear(): boolean;
  footerCopyIsSeedShape(): boolean;
  currentYear(): number;
  footerAnchorHrefs(): string;
  navAnchorHrefs(): string;
  // ---- drivers ----
  typeIntoQuery(value: string): boolean;
  pressEnter(): boolean;
  pressKeyUp(key: string): boolean;
  blurSearch(): boolean;
  clickSearchToggle(): boolean;
  clickTab(name: string): boolean;
  clickHeroTrailer(): boolean;
  clickSlideTrailer(): boolean;
  clickVideoCard(index: number): boolean;
  closeModal(): boolean;
  clickCarouselNext(index: number): boolean;
  clickCarouselPrev(index: number): boolean;
  selectSeason(value: string): boolean;
}

const yearToken = (s: string): string => {
  const m = s.match(/\b(\d{4})\b/);
  return m === null ? '' : m[1];
};

const ama: AmaApi = {
  version: 'ama-probe/1',
  attachApp(mod) {
    // bootstrapModule() resolves with the NgModuleRef; the cast keeps the bridge's public signature
    // free of Angular's own Injector generics (strictFunctionTypes would otherwise reject it).
    const ref = (mod as { injector: { get(token: unknown): unknown } }).injector.get(ApplicationRef);
    appRef = ref as ApplicationRef;
  },
  tick() {
    if (appRef === null) return false;
    appRef.tick();
    return true;
  },
  docTitle: () => document.title,
  htmlLang: () => attr(document.documentElement, 'lang'),
  baseHref: () => attr(q('base'), 'href'),
  locationPathname: () => window.location.pathname,
  locationSearch: () => window.location.search,
  locationHash: () => window.location.hash,
  bodyTextBytes: () => (document.body?.innerText || '').replace(/\s+/g, ' ').trim().length,
  appRootChildCount: () => q('app-root')?.children.length ?? 0,

  externalRefTagCount: () => externalRefTags().length,
  externalRefUrls: () => externalRefTags().map((r) => `${r.tag}@${r.attrName}=${r.url}`).join('|').slice(0, 900),
  hasGtag: () => typeof (window as unknown as { gtag?: unknown }).gtag === 'function',
  hasDataLayer: () => Array.isArray((window as unknown as { dataLayer?: unknown }).dataLayer),
  foreignResourceEntryCount: () => foreignResourceEntries().length,
  foreignResourceEntryNames: () => foreignResourceEntries().join('|').slice(0, 900),
  imgCount: () => imgs().length,
  rbImgCount: () => rbImgs().length,
  rbImgLeafNames: () => rbImgs().map((i) => {
    const s = i.getAttribute('src') || '';
    return s.slice(s.lastIndexOf('/') + 1);
  }).sort().join(',').slice(0, 900),
  brokenImgCount: () => imgs().filter((i) => i.complete && i.naturalWidth === 0).length,
  brokenImgSrcs: () => imgs().filter((i) => i.complete && i.naturalWidth === 0)
    .map((i) => i.getAttribute('src') || '').join('|').slice(0, 900),
  localStubPageCount: () => qa('iframe').filter((fr) => (fr.getAttribute('src') || '').startsWith('/rb/')).length,

  apiRequestCount: () => apiLog().length,
  apiPathList: () => apiLog().map((r) => r.path).join('|').slice(0, 900),
  apiLastPath: () => apiLog().at(-1)?.path ?? '',
  apiLastPage: () => apiLog().at(-1)?.page ?? '',
  apiLastQuery: () => apiLog().at(-1)?.query ?? '',
  apiLastStatus: () => apiLog().at(-1)?.status ?? -1,
  apiForeignCount: () => apiState().foreign.length,
  apiForeignList: () => apiState().foreign.join('|').slice(0, 600),
  apiChannelCount: () => apiState().count,
  apiCountForPrefix: (prefix) => apiLog().filter((r) => r.path.startsWith(prefix)).length,
  apiPageListForPrefix: (prefix) => apiLog().filter((r) => r.path.startsWith(prefix)).map((r) => r.page ?? '-').join(',').slice(0, 400),
  apiStatusListForPrefix: (prefix) => apiLog().filter((r) => r.path.startsWith(prefix)).map((r) => String(r.status)).join(',').slice(0, 400),

  localStorageKeyCount: () => window.localStorage.length,
  sessionStorageKeyCount: () => window.sessionStorage.length,
  cookieString: () => document.cookie,
  extraGlobalCount: () => extraGlobals().length,
  extraGlobalNames: () => extraGlobals().join(',').slice(0, 400),
  errorCount: () => errors.length,
  errorDetail: () => errors.join(' | ').slice(0, 400),

  latchSamples: () => latch.samples,
  spinnerSeen: () => latch.spinnerSeen,
  spinnerVisible: () => spinnerVisibleNow(),
  inflightCardCount: () => latch.inflightCardCount,
  inflightSlideCount: () => latch.inflightSlideCount,
  inflightBodyTextBytes: () => latch.inflightBodyTextBytes,

  slideCount: () => slides().length,
  slideName: () => text(slides()[0]?.querySelector('[data-rb-slide-name]') ?? null),
  slideDescText: () => text(slides()[0]?.querySelector('[data-rb-slide-desc]') ?? null),
  slideDescLength: () => text(slides()[0]?.querySelector('[data-rb-slide-desc]') ?? null).length,
  slideReviewsText: () => text(slides()[0]?.querySelector('[data-rb-slide-reviews]') ?? null),
  slideStarsWidth: () => {
    const d = slides()[0]?.querySelector('[data-rb-slide-stars]') ?? null;
    return d === null ? '' : (d as HTMLElement).style.width || computed(d, 'width');
  },
  slideStarsWidthPercent: () => {
    const d = slides()[0]?.querySelector('[data-rb-slide-stars]') ?? null;
    return d === null ? -1 : widthPercent((d as HTMLElement).style.width || computed(d, 'width'));
  },
  slideTrailerButtonCount: () => qa('[data-rb-slide-trailer]').length,
  slideBackdropSrc: () => attr(slides()[0]?.querySelector('[data-rb-slide-backdrop]') ?? null, 'src'),
  slideSeasonSpanCount: () => (slides()[0]?.querySelectorAll('[data-rb-slide-season]') ?? []).length,
  slideDateText: () => text(slides()[0]?.querySelector('[data-rb-slide-date]') ?? null),

  heroName: () => text(q('[data-rb-hero-name]')),
  heroDescText: () => text(q('[data-rb-hero-desc]')),
  heroDescLength: () => text(q('[data-rb-hero-desc]')).length,
  heroReviewsText: () => text(q('[data-rb-hero-reviews]')),
  heroStarsWidth: () => {
    const d = q('[data-rb-hero-stars]');
    return d === null ? '' : (d as HTMLElement).style.width || computed(d, 'width');
  },
  heroStarsWidthPercent: () => {
    const d = q('[data-rb-hero-stars]');
    return d === null ? -1 : widthPercent((d as HTMLElement).style.width || computed(d, 'width'));
  },
  heroTrailerButtonCount: () => qa('[data-rb-hero-trailer]').length,
  heroBackdropSrc: () => attr(q('[data-rb-hero-backdrop]'), 'src'),
  heroSeasonSpanCount: () => qa('[data-rb-hero-season]').length,
  heroDateText: () => text(q('[data-rb-hero-date]')),

  carouselCount: () => carousels().length,
  carouselTitle: (index) => text(carousels()[index]?.querySelector('[data-rb-carousel-title]') ?? null),
  carouselCardCount: (index) => cardsOf(carousels()[index] ?? null).length,
  carouselCardName: (index, card) => cardName(cardsOf(carousels()[index] ?? null)[card]),
  carouselCardVote: (index, card) => cardVote(cardsOf(carousels()[index] ?? null)[card]),
  carouselCardStarsWidth: (index, card) => cardStarsWidth(cardsOf(carousels()[index] ?? null)[card]),
  carouselCardStarsWidthPercent: (index, card) => widthPercent(cardStarsWidth(cardsOf(carousels()[index] ?? null)[card])),
  carouselCastNameList: (index) => cardsOf(carousels()[index] ?? null).map((c) => castName(c)).join('|').slice(0, 600),
  carouselCardImgSrc: (index, card) => cardImgSrc(cardsOf(carousels()[index] ?? null)[card]),
  carouselCardPlaceholderCount: (index, card) => cardPlaceholderCount(cardsOf(carousels()[index] ?? null)[card]),
  carouselNameList: (index) => cardsOf(carousels()[index] ?? null).map((c) => cardName(c)).join('|').slice(0, 600),
  carouselExploreCardLink: (index) => attr(carousels()[index]?.querySelector('[data-rb-carousel-explore]') ?? null, 'href'),
  carouselNextDisabled: (index) => (carousels()[index]?.querySelector('[data-rb-carousel-next]') as HTMLButtonElement | null)?.disabled ?? false,
  carouselPrevDisabled: (index) => (carousels()[index]?.querySelector('[data-rb-carousel-prev]') as HTMLButtonElement | null)?.disabled ?? false,
  carouselScrollLeft: (index) => Math.round(itemsBox(index)?.scrollLeft ?? -1),
  carouselClientWidth: (index) => Math.round(itemsBox(index)?.clientWidth ?? -1),
  carouselScrollWidth: (index) => Math.round(itemsBox(index)?.scrollWidth ?? -1),

  factLabelsOf: (kind) => factLabels(kind).join('|'),
  factRowCountOf: (kind) => factRowCount(String(kind)),
  factValueOf: (kind, label) => factValue(kind, label),
  runtimeValue: () => factValue('movie', 'Runtime'),
  budgetValue: () => factValue('movie', 'Budget'),
  revenueValue: () => factValue('movie', 'Revenue'),
  releasedValue: () => factValue('movie', 'Released'),
  releasedIsMediumDate: () => /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(factValue('movie', 'Released')),
  statusValue: () => factValue('movie', 'Status'),
  lastAiredValue: () => factValue('tv', 'Last Aired'),
  lastAiredStartsWithDollar: () => factValue('tv', 'Last Aired').startsWith('$'),
  lastAiredIsDollarMediumDate: () => /^\$[A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(factValue('tv', 'Last Aired')),
  firstAiredValue: () => factValue('tv', 'First Aired'),
  tvLanguageValue: () => factValue('tv', 'language'),
  genreLinkCount: () => qa('[data-rb-facts] .comma_ a').length,
  genreLinkTexts: () => qa('[data-rb-facts] .comma_ a').map((a) => text(a)).join('|'),
  genreLinkHref: (index) => attr(qa('[data-rb-facts] .comma_ a')[index] ?? null, 'href'),
  storylineText: () => text(q('[data-rb-storyline]')),
  storylineLength: () => text(q('[data-rb-storyline]')).length,
  posterSrc: () => attr(q('[data-rb-poster]'), 'src'),
  posterNaturalWidth: () => (q('[data-rb-poster]') as HTMLImageElement | null)?.naturalWidth ?? -1,
  posterCount: () => qa('[data-rb-poster]').length,
  externalAnchorCount: () => qa('[data-rb-external] a').length,
  externalAnchorHrefs: () => qa('[data-rb-external] a').map((a) => attr(a, 'href')).join('|').slice(0, 600),
  socialAnchorCount: () => qa('[data-rb-external] a[target="_blank"]').length,
  imdbAnchorHref: () => attr(q('[data-rb-imdb-item] a'), 'href'),

  tabCount: () => tabs().length,
  tabNames: () => tabs().map((t) => attr(t, 'data-rb-tab')).join(','),
  tabActiveNames: () => tabs().filter((t) => t.classList.contains('buttonActive')).map((t) => attr(t, 'data-rb-tab')).join(','),
  panelPresent: (name) => q(`[data-rb-panel-${name}]`) !== null,

  videoCardCount: () => videoCards().length,
  videoCardName: (index) => text(videoCards()[index]?.querySelector('[data-rb-video-name]') ?? null),
  videoCardType: (index) => text(videoCards()[index]?.querySelector('[data-rb-video-type]') ?? null),
  videoThumbSrc: (index) => attr(videoCards()[index]?.querySelector('[data-rb-video-thumb]') ?? null, 'src'),
  videoThumbSrcIsLocal: (index) => attr(videoCards()[index]?.querySelector('[data-rb-video-thumb]') ?? null, 'src').startsWith('/rb/vi/'),
  videoTypeList: () => videoCards().map((c) => text(c.querySelector('[data-rb-video-type]'))).join('|'),
  backdropItemCount: () => backdropItems().length,
  posterItemCount: () => posterItems().length,
  backdropCountText: () => text(q('[data-rb-backdrop-count]')),
  posterCountText: () => text(q('[data-rb-poster-count]')),
  backdropImgSrc: (index) => attr(backdropItems()[index]?.querySelector('img') ?? null, 'src'),
  episodeItemCount: () => episodeItems().length,
  episodeCountText: () => text(q('[data-rb-episode-count]')),
  episodeFirstName: () => text(episodeItems()[0]?.querySelector('[data-rb-episode-name]') ?? null),
  episodeAiredList: () => episodeItems().map((e) => text(e.querySelector('[data-rb-episode-aired]'))).join('|'),
  seasonOptionCount: () => seasonSelect()?.options.length ?? -1,
  seasonSelectedValue: () => seasonSelect()?.value ?? '',
  seasonOptionLabels: () => seasonOptions().map((o) => (o.textContent || '').replace(/\s+/g, ' ').trim()).join('|'),

  modalPresent: () => q('[data-rb-modal]') !== null,
  modalIframePresent: () => q('[data-rb-modal-iframe]') !== null,
  modalIframeSrc: () => attr(q('[data-rb-modal-iframe]'), 'src'),
  modalIframeSrcIsLocalStub: () => attr(q('[data-rb-modal-iframe]'), 'src').startsWith('/rb/embed.html'),

  listingCardCount: () => listingCards().length,
  listingTitle: () => text(q('[data-rb-listing-title]')),
  listingFirstName: () => cardName(listingCards()[0]),
  listingNameList: () => listingCards().map((c) => cardName(c)).join('|').slice(0, 600),
  listingPlaceholderCount: () => listingCards().reduce((n, c) => n + cardPlaceholderCount(c), 0),

  searchPanelPresent: () => q('[data-rb-search-panel]') !== null,
  searchInputPresent: () => searchInput() !== null,
  searchInputValue: () => searchInput()?.value ?? '',
  searchInputPlaceholder: () => attr(searchInput(), 'placeholder'),
  searchCloseButtonPresent: () => q('[data-rb-search-close]') !== null,
  searchResultCount: () => searchCards().length,
  searchResultTitle: (index) => cardName(searchCards()[index]),
  searchResultStarsWidth: (index) => cardStarsWidth(searchCards()[index]),
  searchResultStarsWidthPercent: (index) => widthPercent(cardStarsWidth(searchCards()[index])),
  searchResultVote: (index) => cardVote(searchCards()[index]),
  searchNoResultsPresent: () => q('[data-rb-noresults]') !== null,
  searchNoResultsText: () => text(q('[data-rb-noresults]')),
  searchHeadingText: () => text(q('[data-rb-search-heading]')),

  footerCopyText: () => text(q('[data-rb-footer-copy]')),
  footerCopyYear: () => yearToken(text(q('[data-rb-footer-copy]'))),
  footerCopyYearMatchesCurrentYear: () => yearToken(text(q('[data-rb-footer-copy]'))) === String(new Date().getFullYear()),
  footerCopyIsSeedShape: () => /^\u00a9 \d{4} Abid Akram\. All rights reserved\. Cookie Policy\.$/.test(text(q('[data-rb-footer-copy]'))),
  currentYear: () => new Date().getFullYear(),
  footerAnchorHrefs: () => qa('app-footer a').map((a) => attr(a, 'href')).join('|').slice(0, 600),
  navAnchorHrefs: () => qa('app-navbar a').map((a) => attr(a, 'href')).join('|').slice(0, 400),

  typeIntoQuery,
  pressEnter: () => pressKeyUp('Enter'),
  pressKeyUp,
  blurSearch,
  clickSearchToggle: () => clickFirst('[data-rb-search-toggle]'),
  clickTab: clickByTab,
  clickHeroTrailer: () => clickFirst('[data-rb-hero-trailer]'),
  clickSlideTrailer: () => clickFirst('[data-rb-slide-trailer]'),
  clickVideoCard: (index) => {
    const el = videoCards()[index]?.querySelector('[data-rb-video-link]') as HTMLElement | null;
    if (el === null) return false;
    el.click();
    return true;
  },
  closeModal: () => clickFirst('[data-rb-modal-close]'),
  clickCarouselNext: (index) => clickCarouselNav('next', index),
  clickCarouselPrev: (index) => clickCarouselNav('prev', index),
  selectSeason,
};

window.addEventListener('error', (e) => { errors.push('error: ' + String(e.message ?? '').slice(0, 160)); });
window.addEventListener('unhandledrejection', (e) => { errors.push('unhandledrejection: ' + String(e.reason ?? '').slice(0, 160)); });

declare global {
  interface Window { __AMA__: AmaApi }
}

window.__AMA__ = ama;
startObserver();
