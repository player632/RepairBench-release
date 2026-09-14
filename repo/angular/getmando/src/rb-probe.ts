/**
 * RepairBench instrumentation probe for getMando (repair-angular__getmando-01).
 *
 * READ-ONLY observation bridge. It publishes two globals and changes no application behaviour:
 *
 *   window.__GM__()      a snapshot recomputed on every call, built from the seed's OWN services
 *                        (AppService / CategoryService / SearchService / SettingsService /
 *                        ThemeService / MetadataService / BookmarkService / ConfigService /
 *                        YamlLoaderService, all reached through the root injector) plus the live
 *                        DOM. Every field is individually guarded and degrades to an "ERR:..."
 *                        sentinel or a {found:false} record instead of throwing, so a broken state
 *                        is reported as a FAILED ASSERTION (behaviour evidence) and never as a
 *                        runner crash or a page error.
 *   window.__GM_CMD__    a thin interaction surface that drives the seed's own handlers by
 *                        dispatching real DOM events on real nodes located by data-testid
 *                        (click / fill / key / focus / blur). Missing handles return
 *                        {found:false,...}; they never throw.
 *
 * The probe never writes to a signal, never calls a service mutator, never patches a seed
 * function and never stores application state of its own beyond the error/journal buffers it
 * reads back. The window.open journal it exposes is created by the ADAPTATION layer
 * (src/rb-offline-nav.ts), not here.
 */
import type { Injector } from '@angular/core';

import { AppService } from './app/core/services/app.service';
import { BookmarkService } from './app/core/services/bookmark.service';
import { CategoryService } from './app/core/services/category.service';
import { ConfigService } from './app/core/services/config.service';
import { MetadataService } from './app/core/services/metadata.service';
import { SearchService } from './app/core/services/search.service';
import { SettingsService } from './app/core/services/settings.service';
import { ThemeService } from './app/core/services/theme.service';
import { YamlLoaderService } from './app/core/services/yaml-loader.service';
//
// resolves BARE calls against collectBindings(), which does not collect import specifiers, so an
// imported function called bare would be filed as an undefined name. Every cross-module call in
// this probe is therefore qualified.
import * as offlineNav from './rb-offline-nav';

const ERR = 'ERR:unavailable';

function safeStr(fn: () => string): string {
  try {
    const v = fn();
    return typeof v === 'string' ? v : String(v);
  } catch (e) {
    return 'ERR:' + (e instanceof Error ? e.message : String(e));
  }
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

const capturedErrors: string[] = [];
let errorListenerInstalled = false;

function installErrorCapture(): void {
  if (errorListenerInstalled) return;
  errorListenerInstalled = true;
  window.addEventListener('error', (event) => {
    capturedErrors.push('error:' + (event && event.message ? event.message : 'unknown'));
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    capturedErrors.push('rejection:' + (reason instanceof Error ? reason.message : String(reason)));
  });
}

function q(sel: string): Element | null {
  return safe(() => document.querySelector(sel), null);
}

function qa(sel: string): Element[] {
  return safe(() => Array.from(document.querySelectorAll(sel)), []);
}

function byTestId(id: string): Element | null {
  return q('[data-testid="' + id + '"]');
}

function allByTestId(id: string): Element[] {
  return qa('[data-testid="' + id + '"]');
}

function attrOf(el: Element | null, name: string): string | null {
  return el ? safe(() => el.getAttribute(name), null) : null;
}

function textOf(el: Element | null): string {
  return el ? safe(() => (el.textContent || '').trim(), '') : '';
}

/** ng-icon renders an inline <svg>; its `name` input is not reflected as a DOM attribute, so
 *  icon identity is read off the rendered paths (count + first path head). Deterministic per icon. */
function iconFingerprint(scopeTestId: string): { paths: number; head: string; svgFound: boolean } {
  const svg = q('[data-testid="' + scopeTestId + '"] ng-icon svg');
  if (!svg) return { paths: -1, head: 'ERR:no-svg', svgFound: false };
  const paths = qa('[data-testid="' + scopeTestId + '"] ng-icon svg path');
  const d = paths.length ? String(paths[0].getAttribute('d') || '') : '';
  return { paths: paths.length, head: d.slice(0, 24), svgFound: true };
}

/** Reads a Tailwind responsive grid-cols utility back out of the element's class attribute. */
function gridColsOf(el: Element | null, breakpoint: string): number {
  const cls = el ? String(el.getAttribute('class') || '') : '';
  const re = new RegExp('(?:^|\\s)' + breakpoint + ':grid-cols-(\\d+)(?:\\s|$)');
  const m = re.exec(cls);
  return m ? Number(m[1]) : -1;
}

function isExternal(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:') || url.startsWith('blob:')) return false;
  if (url.startsWith('/')) return false;
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function resourceEntries(): PerformanceResourceTiming[] {
  return safe(() => performance.getEntriesByType('resource') as PerformanceResourceTiming[], []);
}

interface CardView {
  testid: string;
  appId: string;
  name: string;
  description: string;
  tags: string[];
  ariaLabel: string;
  imgSrc: string;
  imgAlt: string;
  imgLoaded: boolean;
  imgNaturalWidth: number;
  type: string;
}

function cardView(el: Element): CardView {
  const testid = attrOf(el, 'data-testid') || '';
  const img = safe(() => el.querySelector('[data-testid="card-img"]') as HTMLImageElement | null, null);
  return {
    testid,
    appId: testid.replace(/^app-card-/, ''),
    name: textOf(safe(() => el.querySelector('[data-testid="card-name"]'), null)),
    description: textOf(safe(() => el.querySelector('[data-testid="card-desc"]'), null)),
    tags: qa('[data-testid="' + testid + '"] [data-testid="card-tag"]').map(textOf),
    ariaLabel: attrOf(el, 'aria-label') || '',
    imgSrc: img ? safe(() => String(img.getAttribute('src') || ''), '') : 'ERR:no-img',
    imgAlt: img ? safe(() => String(img.getAttribute('alt') || ''), '') : 'ERR:no-img',
    imgLoaded: img ? safe(() => img.complete && img.naturalWidth > 0, false) : false,
    imgNaturalWidth: img ? safe(() => img.naturalWidth, -1) : -1,
    type: safe(() => el.tagName.toLowerCase(), ''),
  };
}

function snapshot(injector: Injector | null) {
  const get = <T,>(token: unknown): T | null => {
    if (!injector) return null;
    return safe(() => (injector.get as (t: unknown) => T)(token), null);
  };
  const appService = get<AppService>(AppService);
  const categoryService = get<CategoryService>(CategoryService);
  const searchService = get<SearchService>(SearchService);
  const settingsService = get<SettingsService>(SettingsService);
  const themeService = get<ThemeService>(ThemeService);
  const metadataService = get<MetadataService>(MetadataService);
  const bookmarkService = get<BookmarkService>(BookmarkService);
  const configService = get<ConfigService>(ConfigService);
  const yamlLoader = get<YamlLoaderService>(YamlLoaderService);

  const settings = safe(() => settingsService?.settings(), undefined);
  const config = safe(() => configService?.config(), undefined);
  const metadata = safe(() => metadataService?.metadata(), undefined);
  const categories = safe(() => categoryService?.categories() ?? [], []);
  const apps = safe(() => appService?.apps() ?? [], []);
  const filtered = safe(() => appService?.filteredApps(), undefined);
  const bookmarks = safe(() => bookmarkService?.bookmarks() ?? [], []);
  const mounted = safe(() => yamlLoader?.mountedConfigResult(), undefined);

  const cards = qa('[data-testid^="app-card-"]').map(cardView);
  const options = qa('[data-testid^="sel-option-"]');
  const toasts = qa('[data-testid="toast-item"]');
  const html = document.documentElement;
  const bg = q('#app-background') as HTMLElement | null;
  const clockTime = byTestId('clock-time');
  const resources = resourceEntries();

  return {
    // ---- boot / hygiene -------------------------------------------------------------
    ready: true,
    probe: 'getmando-rb-probe/1',
    errors: capturedErrors.slice(),
    errorCount: capturedErrors.length,
    residueKeys: safe(
      () =>
        Object.keys(window).filter((k) =>
          /repairbench|repair_bench|__rb_|mutation|mutated|defect|goldpatch|oracle/i.test(k),
        ),
      [],
    ),
    extScripts: qa('script[src]').filter((el) => isExternal(attrOf(el, 'src') || '')).length,
    extLinks: qa('link[href]').filter((el) => isExternal(attrOf(el, 'href') || '')).length,
    extImgs: qa('img[src]').filter((el) => isExternal(attrOf(el, 'src') || '')).length,
    extResources: resources.filter((r) => isExternal(r.name)).map((r) => r.name),
    extResourceCount: resources.filter((r) => isExternal(r.name)).length,
    resourceCount: resources.length,
    // ---- configuration --------------------------------------------------------------
    configPresent: !!config,
    mountedStatus: safe(() => (mounted ? String((mounted as { status?: string }).status) : 'none'), 'none'),
    title: safeStr(() => metadata?.title ?? ''),
    description: safeStr(() => metadata?.description ?? ''),
    appVersion: safeStr(() => String(appService?.appVersion ?? '')),
    applicationCount: safe(() => config?.applications.length ?? -1, -1),
    bookmarkCount: safe(() => bookmarks.length, -1),
    configuredCategoryCount: safe(() => config?.categories.length ?? -1, -1),
    // ---- settings -------------------------------------------------------------------
    settings: settings
      ? {
          theme: safeStr(() => String(settings.theme)),
          dateFormat: safeStr(() => String(settings.dateFormat)),
          datePosition: safeStr(() => String(settings.datePosition)),
          showSeconds: safe(() => Boolean(settings.showSeconds), null),
          showDate: safe(() => Boolean(settings.showDate), null),
          itemsPerRow: safe(() => Number(settings.itemsPerRow), -1),
          allowBookmarks: safe(() => Boolean(settings.allowBookmarks), null),
          showAllCategory: safe(() => Boolean(settings.showAllCategory), null),
          showDescriptions: safe(() => Boolean(settings.showDescriptions), null),
          showLabels: safe(() => Boolean(settings.showLabels), null),
          searchEngines: safe(() => settings.searchEngines.slice(), []),
          lightBackgroundImage: safeStr(() => String(settings.lightBackgroundImage)),
          darkBackgroundImage: safeStr(() => String(settings.darkBackgroundImage)),
        }
      : ERR,
    // ---- theme ----------------------------------------------------------------------
    themeMode: safeStr(() => String(themeService?.themeMode() ?? ERR)),
    currentTheme: safeStr(() => String(themeService?.currentTheme() ?? ERR)),
    isDark: safe(() => Boolean(themeService?.isDark()), null),
    htmlHasDarkClass: safe(() => html.classList.contains('dark'), null),
    htmlDataTheme: safeStr(() => String(html.getAttribute('data-theme') ?? '')),
    htmlClass: safeStr(() => String(html.className ?? '')),
    backgroundImage: safeStr(() => String(bg?.style.backgroundImage ?? '')),
    backgroundFound: !!bg,
    // ---- categories -----------------------------------------------------------------
    categoryIds: categories.map((c) => safeStr(() => c.id)),
    categoryNames: categories.map((c) => safeStr(() => c.name)),
    categoryCount: safe(() => categories.length, -1),
    selectedCategory: safeStr(() => String(categoryService?.selectedCategory() ?? ERR)),
    categoryBarFound: !!byTestId('cat-bar'),
    categoryButtons: qa('[data-testid^="cat-"]').map((el) => ({
      testid: attrOf(el, 'data-testid') || '',
      name: textOf(el),
      pressed: attrOf(el, 'aria-pressed'),
      disabled: safe(() => (el as HTMLButtonElement).disabled, null),
    })),
    // ---- applications / grid --------------------------------------------------------
    appNames: apps.map((a) => safeStr(() => a.name)),
    appIds: apps.map((a) => safeStr(() => a.id)),
    appCount: safe(() => apps.length, -1),
    filteredCount: safe(() => (filtered === undefined ? -1 : filtered.length), -1),
    filteredIds: safe(() => (filtered ?? []).map((a) => safeStr(() => a.id)), []),
    filteredNames: safe(() => (filtered ?? []).map((a) => safeStr(() => a.name)), []),
    cardCount: cards.length,
    cards,
    cardNames: cards.map((c) => c.name),
    cardIds: cards.map((c) => c.appId),
    gridFound: !!byTestId('app-grid'),
    gridClass: safeStr(() => String(attrOf(byTestId('app-grid'), 'class') ?? '')),
    gridAriaLabel: safeStr(() => String(attrOf(byTestId('app-grid'), 'aria-label') ?? '')),
    gridItems: safe(() => qa('[data-testid="app-grid"] > li').length, -1),
    gridColsXl: safe(() => gridColsOf(byTestId('app-grid'), 'xl'), -1),
    gridColsLg: safe(() => gridColsOf(byTestId('app-grid'), 'lg'), -1),
    emptyVisible: !!byTestId('empty-state'),
    emptyTitle: textOf(byTestId('empty-title')),
    emptyText: textOf(byTestId('empty-text')),
    loadingVisible: !!byTestId('loading-state'),
    // ---- clock ----------------------------------------------------------------------
    clockFound: !!clockTime,
    clockTimeText: textOf(clockTime),
    clockTimeIsHHMM: safe(() => /^\d{2}:\d{2}$/.test(textOf(clockTime)), null),
    clockSecondsFound: !!byTestId('clock-seconds'),
    clockSecondsIsTwoDigits: safe(() => /^\d{2}$/.test(textOf(byTestId('clock-seconds'))), null),
    clockDateCount: allByTestId('clock-date').length,
    clockDateTexts: allByTestId('clock-date').map(textOf),
    clockDateIsBeforeTime: safe(() => {
      const dates = allByTestId('clock-date');
      if (dates.length !== 1 || !clockTime) return null;
      return !!(dates[0].compareDocumentPosition(clockTime) & Node.DOCUMENT_POSITION_FOLLOWING);
    }, null),
    // ---- finder ---------------------------------------------------------------------
    finderFound: !!byTestId('finder-input'),
    finderValue: safeStr(() => String((byTestId('finder-input') as HTMLInputElement | null)?.value ?? '')),
    finderPlaceholder: safeStr(() =>
      String((byTestId('finder-input') as HTMLInputElement | null)?.getAttribute('placeholder') ?? ''),
    ),
    finderClearFound: !!byTestId('finder-clear'),
    finderGoFound: !!byTestId('finder-go'),
    // ---- search engine selector -----------------------------------------------------
    selTriggerFound: !!byTestId('sel-trigger'),
    selTriggerDisabled: safe(() => (byTestId('sel-trigger') as HTMLButtonElement | null)?.disabled ?? null, null),
    selTriggerAriaExpanded: safeStr(() => String(attrOf(byTestId('sel-trigger'), 'aria-expanded') ?? '')),
    selTriggerAriaHasPopup: safeStr(() => String(attrOf(byTestId('sel-trigger'), 'aria-haspopup') ?? '')),
    selTriggerHasEngineIcon: safe(() => !!q('[data-testid="sel-trigger"] ng-icon[name]:not([name="heroMagnifyingGlass"])'), null),
    selListboxFound: !!byTestId('sel-listbox'),
    selOptionCount: options.length,
    selOptionTestids: options.map((el) => attrOf(el, 'data-testid') || ''),
    selOptionTexts: options.map(textOf),
    selOptionTabindex: options.map((el) => attrOf(el, 'tabindex')),
    selOptionAriaSelected: options.map((el) => attrOf(el, 'aria-selected')),
    selOptionIconPaths: options.map((el) => safe(() => el.querySelectorAll('ng-icon svg path').length, -1)),
    selActiveIndex: safe(() => options.findIndex((el) => attrOf(el, 'tabindex') === '0'), -2),
    selFocusedOptionTestid: safeStr(() => {
      const active = document.activeElement;
      return active ? String(active.getAttribute('data-testid') ?? active.tagName.toLowerCase()) : '';
    }),
    // ---- header / navigation --------------------------------------------------------
    navFound: !!byTestId('hdr-nav'),
    navHref: safeStr(() => String(attrOf(byTestId('hdr-nav'), 'href') ?? '')),
    navAriaLabel: safeStr(() => String(attrOf(byTestId('hdr-nav'), 'aria-label') ?? '')),
    navIconName: safeStr(() => String(attrOf(q('[data-testid="hdr-nav"] ng-icon'), 'name') ?? '')),
    navIcon: safe(() => iconFingerprint('hdr-nav'), { paths: -1, head: 'ERR:unavailable', svgFound: false }),
    themeButtonFound: !!byTestId('hdr-theme'),
    themeButtonAriaLabel: safeStr(() => String(attrOf(byTestId('hdr-theme'), 'aria-label') ?? '')),
    themeButtonIconName: safeStr(() => String(attrOf(q('[data-testid="hdr-theme"] ng-icon'), 'name') ?? '')),
    themeButtonIcon: safe(() => iconFingerprint('hdr-theme'), { paths: -1, head: 'ERR:unavailable', svgFound: false }),
    // ---- footer ---------------------------------------------------------------------
    footerFound: !!byTestId('ftr'),
    footerVersionText: textOf(byTestId('ftr-version')),
    footerLinkCount: safe(() => qa('[data-testid="ftr"] a').length, -1),
    // ---- notifications --------------------------------------------------------------
    toastStackFound: !!byTestId('toast-stack'),
    toastCount: toasts.length,
    toasts: toasts.map((el) => ({
      level: textOf(safe(() => el.querySelector('[data-testid="toast-level"]'), null)),
      message: textOf(safe(() => el.querySelector('[data-testid="toast-message"]'), null)),
      role: attrOf(el, 'role'),
      className: safeStr(() => String((el as HTMLElement).className ?? '')),
    })),
    // ---- offline navigation journal (adaptation layer) ------------------------------
    navJournal: safe(() => offlineNav.readOfflineNav().map((e) => ({ url: e.url, target: e.target, seq: e.seq })), []),
    navJournalCount: safe(() => offlineNav.readOfflineNav().length, -1),
    // ---- storage / routing ----------------------------------------------------------
    storageKeys: safe(() => Object.keys(localStorage), []),
    storageTheme: safeStr(() => String(localStorage.getItem('dashboard-theme') ?? '')),
    routePath: safeStr(() => window.location.pathname),
    documentTitle: safeStr(() => document.title),
  };
}

export type GmSnapshot = ReturnType<typeof snapshot>;

export interface GmCmdResult {
  found: boolean;
  testid?: string;
  action?: string;
  value?: string;
  detail?: string;
}

function notFound(testid: string, action: string): GmCmdResult {
  return { found: false, testid, action, detail: 'no element carries data-testid="' + testid + '"' };
}

function publishCommands(): void {
  const cmd = {
    byTestId(testid: string): GmCmdResult {
      const el = byTestId(testid);
      return el ? { found: true, testid, detail: el.tagName.toLowerCase() } : notFound(testid, 'byTestId');
    },
    click(testid: string): GmCmdResult {
      const el = byTestId(testid) as HTMLElement | null;
      if (!el) return notFound(testid, 'click');
      return safe<GmCmdResult>(() => {
        el.focus();
        el.click();
        return { found: true, testid, action: 'click' };
      }, { found: true, testid, action: 'click', detail: 'ERR:dispatch-failed' });
    },
    fill(testid: string, value: string): GmCmdResult {
      const el = byTestId(testid) as HTMLInputElement | null;
      if (!el) return notFound(testid, 'fill');
      return safe<GmCmdResult>(() => {
        el.focus();
        el.value = value;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
        return { found: true, testid, action: 'fill', value };
      }, { found: true, testid, action: 'fill', value, detail: 'ERR:dispatch-failed' });
    },
    key(testid: string, key: string, kind: string): GmCmdResult {
      const el = byTestId(testid) as HTMLElement | null;
      if (!el) return notFound(testid, 'key');
      return safe<GmCmdResult>(() => {
        el.focus();
        const init: KeyboardEventInit = { key, bubbles: true, cancelable: true, code: 'Key' + key.toUpperCase() };
        if (kind !== 'keyup') el.dispatchEvent(new KeyboardEvent('keydown', init));
        el.dispatchEvent(new KeyboardEvent(kind === 'keydown' ? 'keydown' : 'keyup', init));
        return { found: true, testid, action: 'key', value: key };
      }, { found: true, testid, action: 'key', value: key, detail: 'ERR:dispatch-failed' });
    },
    focus(testid: string): GmCmdResult {
      const el = byTestId(testid) as HTMLElement | null;
      if (!el) return notFound(testid, 'focus');
      return safe<GmCmdResult>(() => {
        el.focus();
        return { found: true, testid, action: 'focus' };
      }, { found: true, testid, action: 'focus', detail: 'ERR:focus-failed' });
    },
    blur(testid: string): GmCmdResult {
      const el = byTestId(testid) as HTMLElement | null;
      if (!el) return notFound(testid, 'blur');
      return safe<GmCmdResult>(() => {
        el.blur();
        return { found: true, testid, action: 'blur' };
      }, { found: true, testid, action: 'blur', detail: 'ERR:blur-failed' });
    },
    clearStorage(): GmCmdResult {
      return safe<GmCmdResult>(() => {
        localStorage.clear();
        return { found: true, action: 'clearStorage' };
      }, { found: true, action: 'clearStorage', detail: 'ERR:storage-blocked' });
    },
  };
  Object.defineProperty(window, '__GM_CMD__', {
    value: cmd,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

/** Publishes the read-only snapshot global. Called once from main.ts after bootstrap. */
export function publishProbe(injector: Injector): void {
  installErrorCapture();
  Object.defineProperty(window, '__GM__', {
    value: () => snapshot(injector),
    writable: true,
    configurable: true,
    enumerable: false,
  });
  publishCommands();
}
