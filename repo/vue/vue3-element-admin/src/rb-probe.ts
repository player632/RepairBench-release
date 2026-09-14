/* RepairBench read-only instrumentation probe.
 * Publishes observable application state for the verifier. Every reader is read-only and
 * fail-closed: on error it returns an inert sentinel instead of throwing.
 */
import { store } from "@/stores";
import { useAppStore } from "@/stores/app";
import { useSettingsStore } from "@/stores/settings";
import { useUserStore } from "@/stores/user";

const ACCESS_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImRlcHRJZCI6MSwiZGF0YVNjb3BlIjoxLCJ1c2VySWQiOjIsImlhdCI6MTcyODE5MzA1MiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9BRE1JTiJdLCJqdGkiOiJhZDg3NzlhZDZlYWY0OWY3OTE4M2ZmYmI5OWM4MjExMSJ9.58YHwL3sNNC22jyAmOZeSm-7MITzfHb_epBIz7LvWeA";

// ---------------------------------------------------------------- auth seed
function seedAuth(): void {
  try {
    if (sessionStorage.getItem("rb-noauth") === "1") {
      return;
    }
    sessionStorage.setItem("vea:auth:access_token", JSON.stringify(ACCESS_TOKEN));
    sessionStorage.setItem("vea:auth:refresh_token", JSON.stringify(ACCESS_TOKEN));
    if (localStorage.getItem("vea:auth:remember_me") === null) {
      localStorage.setItem("vea:auth:remember_me", "false");
    }
  } catch {
    /* storage unavailable - leave the app to its own devices */
  }
}
seedAuth();

// ---------------------------------------------------------------- bridge
type AnyStore = Record<string, any> | undefined;

function appStoreSafe(): AnyStore {
  try {
    return useAppStore(store) as unknown as AnyStore;
  } catch {
    return undefined;
  }
}

function settingsStoreSafe(): AnyStore {
  try {
    return useSettingsStore(store) as unknown as AnyStore;
  } catch {
    return undefined;
  }
}

function userStoreSafe(): AnyStore {
  try {
    return useUserStore(store) as unknown as AnyStore;
  } catch {
    return undefined;
  }
}

const bridge = {
  ready: (): boolean =>
    !!appStoreSafe() && !!document.querySelector(".layout-wrapper, .login-page"),
  hash: (): string => location.hash || "#/",
  title: (): string => document.title,
  language: (): string | null => appStoreSafe()?.language ?? null,
  elementSize: (): string | null => appStoreSafe()?.size ?? null,
  sidebarOpened: (): boolean | null => appStoreSafe()?.sidebar?.opened ?? null,
  theme: (): string | null => settingsStoreSafe()?.theme ?? null,
  settingsVisible: (): boolean | null => settingsStoreSafe()?.settingsVisible ?? null,
  grayMode: (): boolean | null => settingsStoreSafe()?.grayMode ?? null,
  userName: (): string | null => userStoreSafe()?.userInfo?.nickname ?? null,
  hasDarkClass: (): boolean => document.documentElement.classList.contains("dark"),
  grayFilter: (): string => document.documentElement.style.filter,
  colorWeakClass: (): boolean => document.documentElement.classList.contains("color-weak"),
  primaryVar: (): string =>
    getComputedStyle(document.documentElement).getPropertyValue("--el-color-primary").trim(),
  breadcrumbCount: (): number => document.querySelectorAll(".el-breadcrumb__item").length,
  tabsCount: (): number => document.querySelectorAll(".layout-tabs__item").length,
  firstTagText: (): string =>
    document.querySelector(".layout-tabs__item-text")?.textContent?.trim() ?? "",
  topMenuCount: (): number =>
    document.querySelectorAll(".el-menu .el-sub-menu, .el-menu > .el-menu-item").length,
  mainRadioCount: (): number => document.querySelectorAll(".layout-content .el-radio").length,
  loginRememberChecked: (): boolean | null =>
    document.querySelector(".login-options .el-checkbox")?.classList.contains("is-checked") ??
    null,
  tokenLocal: (): boolean => localStorage.getItem("vea:auth:access_token") !== null,
  tokenSession: (): boolean => sessionStorage.getItem("vea:auth:access_token") !== null,
  languageStorage: (): string | null => localStorage.getItem("vea:app:language"),
};

(window as any).__VEA__ = bridge;

// ---------------------------------------------------------------- stamping
const STAMPS: Array<[string, string]> = [
  [".layout-wrapper", "vea-shell"],
  [".login-page", "vea-login-page"],
  ['.login-page input[placeholder="用户名"]', "vea-login-username"],
  ['.login-page input[placeholder="密码"]', "vea-login-password"],
  ['.login-page input[placeholder="验证码"]', "vea-login-captcha"],
  [".login-page .login-btn", "vea-login-submit"],
  [".login-options .el-checkbox", "vea-login-remember"],
  [".login-toolbar .el-icon", "vea-login-theme"],
  [".hamburger-wrapper", "vea-hamburger"],
  [".el-menu", "vea-sidebar"],
  [".command-palette-trigger", "vea-search-trigger"],
  [".size-trigger", "vea-size-trigger"],
  [".i-svg\\:language", "vea-lang-trigger"],
  [".notice__trigger", "vea-notice-trigger"],
  [".fullscreen-trigger", "vea-fullscreen-trigger"],
  [".layout-user", "vea-profile-trigger"],
  [".layout-tabs", "vea-tags-bar"],
  [".layout-content", "vea-main"],
  [".layout-navbar", "vea-navbar"],
  [".settings-drawer", "vea-drawer"],
  [".el-breadcrumb", "vea-breadcrumb"],
  ['input[placeholder="搜索菜单"]', "vea-palette-input"],
];

function stampAll(): void {
  for (const [selector, testId] of STAMPS) {
    const el = document.querySelector(selector);
    if (el && !el.hasAttribute("data-testid")) {
      el.setAttribute("data-testid", testId);
    }
  }
  // 工具栏齿轮按钮（含 i-svg:setting 的 toolbar item）
  const toolbar = document.querySelector(".layout-toolbar");
  if (toolbar) {
    const items = toolbar.querySelectorAll(".layout-toolbar__item");
    for (const item of items) {
      if (item.querySelector(".i-svg\\:setting") && !item.hasAttribute("data-testid")) {
        item.setAttribute("data-testid", "vea-settings-gear");
      }
    }
  }
}

function startStamping(): void {
  stampAll();
  let ticks = 0;
  const timer = window.setInterval(() => {
    stampAll();
    ticks += 1;
    if (ticks > 300) {
      window.clearInterval(timer);
    }
  }, 250);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startStamping);
} else {
  startStamping();
}
