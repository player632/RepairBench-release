// RepairBench measurement probe. INSTRUMENTATION ONLY - it is not part of the application and it
// changes no behaviour. Every member below is a live read (or a faithful driver call) over state the
// application already owns: the pinia stores the app itself instantiates, the router singleton the
// app already exports, the two AppTabs composables the tab bar already uses, the i18n global, the
// theme <style> element index.html already ships, and the DOM the app already renders. It exists so
// an offline verifier can observe what a user observes - the persisted session, the menu the
// permission layer produced, the open tab set and its context-menu state, the breadcrumb, the theme
// ramp, the settings drawer - without guessing at timings and without scraping minified markup.
// Discipline: nothing here reads a clock or a random source into a RETURNED value; the only
// Date.now() uses are bounded polling deadlines inside the async drivers, and no member returns a
// timestamp, a token or any other per-run quantity. Every accessor returns a STRING or a NUMBER so
// the verifier can compare scalars.
import { ref } from 'vue';
import { getConfig } from '@/config';
import { translateI18n, useI18n } from '@/hooks/web/useI18n';
import { useTabsChange } from '@/layouts/page-layouts/components/AppTabs/hooks/useTabsChange';
import { useTabsView } from '@/layouts/page-layouts/components/AppTabs/hooks/useTabsView';
import { router } from '@/router';
import { initRoute } from '@/router/utils';
import { getUserInfo } from '@/server/useInfo';
import { useAppStoreHook } from '@/store/modules/app';
import { usePermissionStoreHook } from '@/store/modules/permission';
import { useUserInfoStoreHook } from '@/store/modules/user';

type Any = any;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const appOf = (): Any => {
  const el: Any = document.querySelector('#app');
  return el ? el.__vue_app__ : null;
};

// useTabsChange()/useTabsView() call useRoute()/useRouter(), which resolve through inject(). Outside
// a component setup that needs the app-level provides, so the two composable drivers are entered
// through app.runWithContext - the same router and the same route record the tab bar itself sees.
const inApp = (fn: Any): Any => {
  const app: Any = appOf();
  return app && typeof app.runWithContext === 'function' ? app.runWithContext(fn) : fn();
};

const all = (sel: string): Any[] => Array.prototype.slice.call(document.querySelectorAll(sel));
const txt = (n: Any): string => (n ? String(n.textContent || '').replace(/\s+/g, ' ').trim() : '');
const bool = (b: boolean): string => (b ? 'true' : 'false');

const menus = (): Any[] => usePermissionStoreHook().wholeMenus as Any[];
const tabs = (): Any[] => usePermissionStoreHook().multiTabs as Any[];
const positions = (): Any[] =>
  menus()
    .map(m => (m && m.meta ? (m.meta as Any).position : undefined))
    .filter(p => typeof p === 'number');

// Storage keys this seed can legitimately own: the raw appConfigMode key written by
// src/config/index.ts:22 and src/store/modules/app.ts:17, the @vueuse/core colour-scheme key, and
// the two _storage entries - listed BOTH with and without the configured namespace prefix so that
// the isolation guard measures "nothing outside the app's own vocabulary" rather than restating one
// defect's expected prefix.
const KEY_WHITELIST = [
  'appConfigMode',
  'vueuse-color-scheme',
  'XsAdmin_userInfo',
  'XsAdmin_multiTabsList',
  'userInfo',
  'multiTabsList',
];
const USER_INFO_SUFFIX = 'userInfo';
const endsWithUserInfo = (k: string): boolean =>
  k.length >= USER_INFO_SUFFIX.length && k.slice(k.length - USER_INFO_SUFFIX.length) === USER_INFO_SUFFIX;

// ---- boot / navigation surface ----
const mounted = (): string => {
  const el: Any = document.querySelector('#app');
  // index.html ships a #html_loding spinner INSIDE #app; mounting replaces it, so its absence plus a
  // live __vue_app__ handle is the seed's own "the application really rendered" signal.
  return bool(!!el && !!el.__vue_app__ && !document.getElementById('html_loding'));
};
const routePath = (): string => String(router.currentRoute.value.path);
const routeName = (): string => {
  const n = router.currentRoute.value.name;
  return n === undefined || n === null ? '' : String(n);
};
const titleSuffix = (): string => {
  const t = document.title;
  const i = t.lastIndexOf('|');
  return i < 0 ? '' : t.slice(i + 1).trim();
};
const resolvesTo = (p: string): string => {
  try {
    return String(router.resolve(p).path);
  } catch (e) {
    return 'throw';
  }
};
const routerHasRoute = (n: string): string => bool(router.hasRoute(n));

// ---- faithful drivers (the same calls the application's own views make) ----
// Mirrors src/views/login/compoontne/form.vue:31-38 onLogin() verbatim: the real permission
// endpoint through the bundled offline fake server, the real store action, the real initRoute.
const login = async (dest?: string): Promise<string> => {
  const res: Any = await getUserInfo('admin', 'admin123');
  if (!res || res.code !== 1) return 'login-failed:' + String(res && res.code);
  useUserInfoStoreHook().setUserInfo(res.data);
  await initRoute(res.data.role);
  await router.push(dest || '/welcome');
  return 'ok';
};

const settle = async (limit?: number): Promise<string> => {
  const budget = typeof limit === 'number' ? limit : 6000;
  const t0 = Date.now();
  for (;;) {
    if (mounted() === 'true' && menus().length > 0 && useUserInfoStoreHook().userInfo) return 'true';
    if (Date.now() - t0 >= budget) return 'false';
    await sleep(100);
  }
};

// In-document navigation: the AppTabs immediate watcher turns each route change into a tab, exactly
// as clicking a sidebar entry would, without a document reload (so nothing depends on persistence).
const nav = async (paths: string[]): Promise<string> => {
  for (const p of paths) {
    await router.push(p);
    await sleep(260);
  }
  return String(tabs().length);
};

// ---- config / session ----
const cfg = (k: string): string => {
  const v: Any = (useAppStoreHook() as Any).appConfigMode[k];
  return v === undefined || v === null ? '' : String(v);
};
const serverTitle = (): string => {
  const c: Any = getConfig();
  return c && c.title ? String(c.title) : '';
};
const loggedIn = (): string => bool(!!useUserInfoStoreHook().userInfo);
const roles = (): string => {
  const r: Any = useUserInfoStoreHook().roles;
  return r === undefined || r === null ? '' : String(r);
};

// ---- storage ----
const storageKeys = (): string => Object.keys(window.localStorage).sort().join(',');
const storageHas = (k: string): string => bool(Object.keys(window.localStorage).indexOf(k) >= 0);
const storageKeysOutsideWhitelist = (): string =>
  Object.keys(window.localStorage)
    .filter(k => KEY_WHITELIST.indexOf(k) < 0)
    .sort()
    .join(',');
const userInfoKeyCount = (): string => String(Object.keys(window.localStorage).filter(endsWithUserInfo).length);
const userInfoStorageRole = (): string => {
  const keys = Object.keys(window.localStorage).filter(endsWithUserInfo);
  for (const k of keys) {
    try {
      const parsed: Any = JSON.parse(window.localStorage.getItem(k) || 'null');
      // _storage.setStorage wraps as { value, time, expire } (measured from the seed's own shipped
      // bundle dist/static/index-BRSAFdOp.js: `var s={value:r,time:Date.now(),expire:o}`). The
      // unwrapped shape is accepted too so the reader cannot silently return 'none' on a wrapper
      // change; the ROLE it reports is the application's own either way.
      const cand: Any = parsed && parsed.value !== undefined && parsed.value !== null ? parsed.value : parsed;
      if (cand && cand.role) return String(cand.role);
    } catch (e) {
      /* try the next candidate key */
    }
  }
  return 'none';
};
// The literal persisted key that carries the user record, and whether it lost its namespace. Both are
// derived from the storage the application itself wrote, never from a hard-coded prefix.
const userInfoKey = (): string => {
  const keys = Object.keys(window.localStorage).filter(endsWithUserInfo);
  return keys.length ? keys.sort().join(',') : 'none';
};
const userInfoKeyIsBare = (): string =>
  bool(Object.keys(window.localStorage).filter(endsWithUserInfo).indexOf('userInfo') >= 0);

// ---- menu ----
const menuCount = (): string => String(menus().length);
const menuCountAtLeast = (n: number): string => bool(menus().length >= n);
const menuPaths = (): string => menus().map(m => String(m.path)).join(',');
const menuFirstPath = (): string => {
  const ms = menus();
  return ms.length ? String(ms[0].path) : 'none';
};
const menuHasPath = (p: string): string => bool(menus().some(m => String(m.path) === p));
const menuTitlesAllNonEmpty = (): string =>
  bool(menus().every(m => !!(m && m.meta && String((m.meta as Any).title || '').length > 0)));
const menuPathsUnique = (): string => {
  const ps = menus().map(m => String(m.path));
  return bool(ps.length === new Set(ps).size);
};
// Order predicate over the WHOLE menu as delivered: every adjacent pair of entries that carry a
// numeric meta.position must be non-descending. Membership-neutral by construction, so it measures
// the sort and nothing else.
const menuAdjacentAscending = (): string => {
  const ps = positions();
  if (ps.length < 2) return 'too-few';
  for (let i = 1; i < ps.length; i++) if (Number(ps[i]) < Number(ps[i - 1])) return 'false';
  return 'true';
};
const menuMinPositionIsFirst = (): string => {
  const ms = menus();
  const ps = positions();
  if (!ms.length || ps.length < 2) return 'too-few';
  let min = Number(ps[0]);
  for (const p of ps) if (Number(p) < min) min = Number(p);
  const first: Any = ms[0] && ms[0].meta ? (ms[0].meta as Any).position : undefined;
  return bool(typeof first === 'number' && Number(first) === min);
};

// ---- tabs ----
const tabCount = (): string => String(tabs().length);
const tabPaths = (): string => tabs().map(t => String(t.path)).join(',');

// Right-click menu state, measured through the SAME composable the tab bar uses, entered through
// app.runWithContext and fed the live store tab set. contextmenu() without a MouseEvent is the
// synchronous half of the real handler (it only recomputes the disabled flags), so this reads the
// flags the dropdown would render without depending on pointer coordinates or on the 100 ms
// positioning timer the real event path schedules.
const tabMenuDisabled = (index: number): string => {
  const tabsRef = ref([...tabs()]);
  const tv: Any = inApp(() => useTabsView(tabsRef));
  const item = tabsRef.value[index];
  if (!item) return 'no-tab';
  tv.contextmenu(item);
  return tv.rightClickTags.map((t: Any) => bool(!!t.disabled)).join(',');
};

const closeTabsFrom = (index: number, type: string): string => {
  const tabsRef = ref([...tabs()]);
  const tc: Any = inApp(() => useTabsChange(tabsRef));
  const item = tabsRef.value[index];
  if (!item) return 'no-tab';
  tc.closeTabsRoute(item, type);
  return String(tabs().length);
};

// ---- theme ----
const themeCss = (): string => {
  const el: Any = document.getElementById('admin-style-root-color');
  return el ? String(el.textContent || '') : '';
};
const themeCssHas = (s: string): string => bool(themeCss().indexOf(s) >= 0);
const paletteVarCount = (): string => String((themeCss().match(/--el-color-primary-light-/g) || []).length);
const themeCssNonEmpty = (): string => bool(themeCss().length > 0);

// ---- i18n ----
const tr = (k: string): string => String(translateI18n(k));
const trIsRaw = (k: string): string => bool(translateI18n(k) === k);
const i18nLocale = (): string => String(useI18n().locale.value);
const i18nTopKeyCount = (): string => {
  const l = String(useI18n().locale.value);
  const m: Any = (useI18n().messages as Any).value;
  return String(Object.keys((m && m[l]) || {}).length);
};
const i18nHas = (k: string): string => {
  const l = String(useI18n().locale.value);
  const m: Any = (useI18n().messages as Any).value;
  let cur: Any = m && m[l];
  for (const part of k.split('.')) {
    if (!cur || typeof cur !== 'object' || !(part in cur)) return 'false';
    cur = cur[part];
  }
  return 'true';
};

// ---- DOM surfaces the settings drawer / navbar / breadcrumb / sidebar already render ----
const navbarPresent = (): string => bool(!!document.querySelector('.navbar'));
const sidebarMenuPresent = (): string => bool(!!document.querySelector('.el-menu'));
const sidebarNodeCount = (): string => String(all('.el-menu-item, .el-sub-menu').length);
const sidebarNodeCountAtLeast = (n: number): string => bool(all('.el-menu-item, .el-sub-menu').length >= n);
const breadcrumbContainer = (): string => bool(!!document.querySelector('.app-breadcrumb'));
const breadcrumbCount = (): string => String(all('.app-breadcrumb .el-breadcrumb__item').length);
const breadcrumbLinkCount = (): string => String(all('.app-breadcrumb .el-breadcrumb__item a.redirect').length);
const tabsBarPresent = (): string => bool(!!document.querySelector('.main-container-tabs'));
const appChildren = (): string => {
  const el: Any = document.querySelector('#app');
  return el ? String(el.children.length) : '0';
};
const documentTitle = (): string => String(document.title);
// The router writes `${translateI18n(to.meta.title)} | ${Title}` (src/router/index.ts:42), so the head
// of document.title is the translated route title and the tail is the configured app name.
const titleHead = (): string => {
  const t = String(document.title);
  const i = t.lastIndexOf('|');
  return i < 0 ? t.trim() : t.slice(0, i).trim();
};
// Raw read of the boot config sidecar: src/config/index.ts:22 writes JSON.stringify(config) under the
// UNPREFIXED key 'appConfigMode', so this is the server-delivered config as it landed on disk.
const rawAppConfig = (k: string): string => {
  try {
    const o: Any = JSON.parse(window.localStorage.getItem('appConfigMode') || 'null');
    if (!o) return 'absent';
    const v: Any = o[k];
    return v === undefined || v === null ? '' : String(v);
  } catch (e) {
    return 'parse-error';
  }
};
const rawAppConfigNested = (k: string, k2: string): string => {
  try {
    const o: Any = JSON.parse(window.localStorage.getItem('appConfigMode') || 'null');
    const v: Any = o && o[k] ? o[k][k2] : undefined;
    return v === undefined || v === null ? '' : String(v);
  } catch (e) {
    return 'parse-error';
  }
};
const sessionStorageKeyCount = (): string => String(Object.keys(window.sessionStorage).length);

const openSettings = (): string => {
  const bar: Any = document.querySelector('.navbar-right');
  const trigger: Any = bar && bar.lastElementChild ? bar.lastElementChild : document.querySelector('.setting-icon');
  if (!trigger) return 'no-trigger';
  trigger.click();
  return 'clicked';
};
// The drawer body is teleported and rendered lazily by el-drawer, so .drawer-content only exists
// once the drawer has really opened; poll for the swatch row rather than trusting a fixed delay.
const openSettingsSettled = async (): Promise<string> => {
  openSettings();
  const t0 = Date.now();
  for (;;) {
    if (document.querySelector('.drawer-content') && all('.color-list-item').length > 0) return 'true';
    if (Date.now() - t0 >= 6000) return bool(!!document.querySelector('.drawer-content'));
    await sleep(100);
  }
};
const settingsOpen = (): string => bool(!!document.querySelector('.drawer-content'));
const swatchCount = (): string => String(all('.color-list .color-list-item').length);
const swatchLast = (): string => {
  const list = all('.color-list .color-list-item');
  const last: Any = list.length ? list[list.length - 1] : null;
  return last && last.style ? String(last.style.backgroundColor) : 'absent';
};
const swatchAllNonEmpty = (): string => {
  const list = all('.color-list .color-list-item');
  return bool(list.length > 0 && list.every((n: Any) => !!n.style && String(n.style.backgroundColor || '').length > 0));
};
const swatchBg = (index: number): string => {
  const list = all('.color-list .color-list-item');
  const n: Any = list[index];
  return n && n.style ? String(n.style.backgroundColor) : 'absent';
};
// SvgIcon renders only for the swatch that equals pureColor, so this counts the "currently picked"
// check marks: 0 while the configured primary colour is not one of the seven presets.
const swatchSelectIconCount = (): string => String(all('.color-list .color-list-item .icon').length);
const sidebarModeCount = (): string => String(all('.sidebar-seting .sidebar-mode').length);
const sidebarSelectCount = (): string => String(all('.sidebar-seting .sidebar-mode-select').length);
const sidebarSelectFirst = (): string => {
  const n: Any = all('.sidebar-seting .sidebar-mode')[0];
  return bool(!!n && String(n.className).indexOf('sidebar-mode-select') >= 0);
};
const clickSidebarMode = (index: number): string => {
  const box: Any = all('.sidebar-seting .sidebar-mode')[index];
  if (!box) return 'no-box';
  box.click();
  return 'clicked';
};
const clearStorageLabel = (): string => {
  const b: Any = document.querySelector('.drawer-content .clear-storage');
  return b ? txt(b) : 'absent';
};
const clearStorageIsDanger = (): string => {
  const b: Any = document.querySelector('.drawer-content .clear-storage');
  return bool(!!b && /el-button--danger/.test(String(b.className)));
};
const usernamePlaceholder = (): string => {
  const i: Any = all('.demo-ruleForm input')[0];
  return i ? String(i.getAttribute('placeholder') || '') : 'absent';
};
const passwordPlaceholder = (): string => {
  const i: Any = all('.demo-ruleForm input')[1];
  return i ? String(i.getAttribute('placeholder') || '') : 'absent';
};
const loginFormInputCount = (): string => String(all('.demo-ruleForm input').length);
const submitBtnPresent = (): string => bool(!!document.querySelector('.demo-ruleForm .submit-btn'));
const submitLabel = (): string => txt(document.querySelector('.demo-ruleForm .submit-btn'));
const checkboxPresent = (): string => bool(!!document.querySelector('.demo-ruleForm .el-checkbox'));
const forgotLabel = (): string => txt(document.querySelector('.demo-ruleForm .form-item-container .el-button'));
// Real form drive for the login-page guards: set the inner <input> values the way a user's keystrokes
// would (native input event, bubbling, so el-input's v-model picks them up) and press the shipped
// submit button. No credential is invented here - the placeholders on the page publish them.
const fillLoginForm = (u: string, p: string): string => {
  const inputs = all('.demo-ruleForm input');
  const set = (el: Any, v: string) => {
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set(inputs[0], u);
  set(inputs[1], p);
  return String(inputs.length);
};
const submitLoginForm = (): string => {
  const b: Any = document.querySelector('.demo-ruleForm .submit-btn');
  if (!b) return 'no-button';
  b.click();
  return 'clicked';
};

const RB: Any = {
  version: 'xsadmin-probe-1',
  // boot / navigation
  mounted, routePath, routeName, titleSuffix, resolvesTo, routerHasRoute,
  // drivers
  login, settle, nav, openSettingsSettled,
  // config / session
  cfg, serverTitle, loggedIn, roles,
  // storage
  storageKeys, storageHas, storageKeysOutsideWhitelist, userInfoKeyCount, userInfoStorageRole,
  userInfoKey, userInfoKeyIsBare, rawAppConfig, rawAppConfigNested, sessionStorageKeyCount,
  // menu
  menuCount, menuCountAtLeast, menuPaths, menuHasPath, menuTitlesAllNonEmpty, menuPathsUnique,
  menuAdjacentAscending, menuMinPositionIsFirst, menuFirstPath,
  // tabs
  tabCount, tabPaths, tabMenuDisabled, closeTabsFrom,
  // theme
  themeCss, themeCssHas, paletteVarCount, themeCssNonEmpty,
  // i18n
  tr, trIsRaw, i18nLocale, i18nTopKeyCount, i18nHas,
  // dom
  navbarPresent, sidebarMenuPresent, sidebarNodeCount, sidebarNodeCountAtLeast, appChildren,
  documentTitle, titleHead,
  breadcrumbContainer, breadcrumbCount, breadcrumbLinkCount, tabsBarPresent,
  openSettings, settingsOpen, swatchCount, swatchLast, swatchAllNonEmpty,
  swatchBg, swatchSelectIconCount,
  sidebarModeCount, sidebarSelectCount, sidebarSelectFirst, clickSidebarMode,
  clearStorageLabel, clearStorageIsDanger,
  usernamePlaceholder, passwordPlaceholder, loginFormInputCount,
  submitBtnPresent, submitLabel, checkboxPresent, forgotLabel,
  fillLoginForm, submitLoginForm,
};

(window as Any).__RB = RB;
