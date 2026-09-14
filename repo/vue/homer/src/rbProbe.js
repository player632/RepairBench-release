// Read-only probe bridge for the repair-bench verifier.
// Added by environment/instrumentation.patch and imported first from src/main.js.
//
// Contract: this module NEVER changes application behaviour.
//   * it publishes exactly one global, window.__rb, and nothing else;
//   * every accessor is a read (DOM / localStorage / the scheduler's own registry);
//   * the fetch recorder below is a strict pass-through: it appends one entry to a
//     module-private array and returns the untouched promise of the native fetch,
//     so request order, arguments, credentials, headers and rejection semantics are
//     exactly what the application asked for.
// Recording at the window.fetch layer (rather than counting network transfers) is
// deliberate: the seed builds a PWA (vite-plugin-pwa, registerType "autoUpdate"),
// so after the service worker activates a repeat request can be answered from the
// precache and would no longer show up as a transfer. The verifier measures how
// often the APPLICATION asks, which is the behaviour under test.
import updateScheduler from "@/utils/updateScheduler.js";

const CALLS = [];
const nativeFetch = window.fetch;

window.fetch = function (input, init) {
  try {
    const raw = typeof input === "string" ? input : String((input && input.url) || input);
    const method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    CALLS.push(raw + " " + method);
  } catch (e) {
    /* a recorder must never break a request */
  }
  return nativeFetch.apply(this, arguments);
};

const norm = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const q = (sel) => Array.from(document.querySelectorAll(sel));
const one = (sel) => document.querySelector(sel);
const textOf = (el) => (el ? norm(el.innerText != null && el.innerText !== "" ? el.innerText : el.textContent) : "");
const classOf = (el) => (el ? norm(el.getAttribute("class")) : "");
const join = (a) => a.join("|");

function cardOf(name) {
  const want = norm(name);
  const cards = q('[data-testid="service-card"]');
  for (const c of cards) {
    const t = c.querySelector(".title");
    if (t && norm(t.textContent) === want) return c;
  }
  return null;
}
const MISS = "__NO_CARD__";
const inCard = (name, sel) => {
  const c = cardOf(name);
  return c ? c.querySelector(sel) : null;
};

const rb = {
  version: 1,
  app: {
    mounted() {
      const el = one("#app");
      return !!el && el.children.length > 0;
    },
    classes() {
      return classOf(one("#app"));
    },
    title() {
      return textOf(one('[data-testid="dashboard-title"] h1'));
    },
    subtitle() {
      return textOf(one('[data-testid="dashboard-title"] .headline'));
    },
    documentTitle() {
      return String(document.title || "");
    },
    hash() {
      return String(window.location.hash || "");
    },
    search() {
      return String(window.location.search || "");
    },
    pathname() {
      return String(window.location.pathname || "");
    },
    href() {
      return String(window.location.href || "");
    },
    verticalLayout() {
      const el = one('[data-testid="service-columns"]');
      return el ? el.classList.contains("layout-vertical") : null;
    },
    offlineBanners() {
      return q('[data-testid="offline-banner"]').length;
    },
    footerText() {
      return textOf(one('[data-testid="app-footer"]'));
    },
    logoSrc() {
      const el = one("#bighead .logo img");
      return el ? String(el.getAttribute("src") || "") : "";
    },
    startedPanel() {
      return q("article .is-size-5").length;
    },
  },
  globals: {
    rbKeys() {
      return join(Object.keys(window).filter((k) => k.indexOf("__rb") === 0));
    },
  },
  net: {
    calls(substr) {
      const s = String(substr);
      return CALLS.filter((c) => c.indexOf(s) !== -1).length;
    },
    total() {
      return CALLS.length;
    },
    external() {
      const o = window.location.origin;
      return CALLS.filter((c) => {
        const u = c.split(" ")[0];
        return /^https?:\/\//i.test(u) && u.indexOf(o) !== 0;
      }).length;
    },
    urls() {
      return join(CALLS.slice(0, 60));
    },
  },
  storage: {
    localKeys() {
      const out = [];
      for (let i = 0; i < window.localStorage.length; i += 1) out.push(window.localStorage.key(i));
      return join(out.sort());
    },
    local(key) {
      const v = window.localStorage.getItem(key);
      return v === null ? "__MISSING__" : String(v);
    },
    sessionKeys() {
      const out = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) out.push(window.sessionStorage.key(i));
      return join(out.sort());
    },
  },
  dom: {
    count(sel) {
      return q(sel).length;
    },
    text(sel) {
      return textOf(one(sel));
    },
    classes(sel) {
      return classOf(one(sel));
    },
    attr(sel, name) {
      const el = one(sel);
      return el ? String(el.getAttribute(name) || "") : "__MISSING__";
    },
  },
  groups: {
    // In the default (vertical) layout ServiceGroup renders one .column wrapper per
    // group directly under the .columns container; in the horizontal layout the
    // wrapper disappears and every card carries the column class instead. Both are
    // read structurally so the probe needs no hook inside ServiceGroup.vue.
    wrappers() {
      return q('[data-testid="service-columns"] > .column');
    },
    count() {
      return q('[data-testid="group-title"]').length;
    },
    names() {
      return join(q('[data-testid="group-title"]').map((el) => norm(el.textContent)));
    },
    wrapperCount() {
      return rb.groups.wrappers().length;
    },
    wrapperClass(i) {
      return classOf(rb.groups.wrappers()[Number(i) || 0]);
    },
    wrapperClasses() {
      return join(rb.groups.wrappers().map((el) => classOf(el)));
    },
  },
  cards: {
    count() {
      return q('[data-testid="service-card"]').length;
    },
    names() {
      return join(
        q('[data-testid="service-card"]').map((c) => norm((c.querySelector(".title") || {}).textContent)),
      );
    },
    errorCount() {
      return q(".component-error").length;
    },
    failedLoadText() {
      return join(
        q(".component-error").map((c) => textOf(c)).slice(0, 4),
      );
    },
    titleText(name) {
      const el = inCard(name, ".title");
      return el ? norm(el.textContent) : MISS;
    },
    subtitleText(name) {
      const el = inCard(name, ".subtitle");
      return el ? textOf(el) : MISS;
    },
    hasSubtitleNode(name) {
      const el = inCard(name, '[data-testid="card-subtitle"]');
      return !!el;
    },
    mediaClasses(name) {
      const el = inCard(name, '[data-testid="card-media"]');
      return el ? classOf(el) : MISS;
    },
    statusText(name) {
      const el = inCard(name, ".media .status");
      return el ? norm(el.textContent) : MISS;
    },
    statusClasses(name) {
      const el = inCard(name, ".media .status");
      return el ? classOf(el) : MISS;
    },
    tagText(name) {
      const el = inCard(name, ".tag");
      return el ? textOf(el) : MISS;
    },
    badges(name) {
      const c = cardOf(name);
      if (!c) return MISS;
      return join(
        Array.from(c.querySelectorAll(".media .notifs .notif")).map(
          (el) =>
            String(el.getAttribute("title") || classOf(el).replace("notif", "").trim()) +
            ":" +
            norm(el.textContent),
        ),
      );
    },
    countText(name) {
      const el = inCard(name, ".media .count");
      return el ? textOf(el) : MISS;
    },
    quicklinkCount(name) {
      const el = inCard(name, '[data-testid="card-quicklinks"]');
      return el ? el.querySelectorAll("a").length : -1;
    },
    rootClasses(name) {
      const c = cardOf(name);
      return c ? classOf(c) : MISS;
    },
  },
  navbar: {
    linkCount() {
      return q('[data-testid="nav-link"]').length;
    },
    linkTexts() {
      return join(q('[data-testid="nav-link"]').map((el) => norm(el.textContent)));
    },
    linkTargets() {
      return join(q('[data-testid="nav-link"]').map((el) => String(el.getAttribute("target") || "__NONE__")));
    },
    menuClasses() {
      return classOf(one('[data-testid="nav-menu"]'));
    },
    burgerClasses() {
      return classOf(one('[data-testid="nav-burger"]'));
    },
  },
  message: {
    present() {
      return !!one('[data-testid="message-banner"]');
    },
    classes() {
      const el = one('[data-testid="message-banner"]');
      return el ? classOf(el) : MISS;
    },
    title() {
      const el = one('[data-testid="message-banner"] .message-header');
      return el ? textOf(el) : MISS;
    },
    content() {
      const el = one('[data-testid="message-banner"] .message-body');
      return el ? textOf(el) : MISS;
    },
    icons() {
      const el = one('[data-testid="message-banner"] .message-header');
      return el ? el.querySelectorAll("i").length : -1;
    },
  },
  scheduler: {
    registeredTotal() {
      return updateScheduler.registeredComponents.size;
    },
    registeredOfType(name) {
      const want = String(name);
      let n = 0;
      for (const [, entry] of updateScheduler.registeredComponents) {
        const c = entry && entry.component;
        const nm = c && c.$ && c.$.type ? String(c.$.type.name || "") : "";
        if (nm === want) n += 1;
      }
      return n;
    },
    registeredNames() {
      const out = [];
      for (const [, entry] of updateScheduler.registeredComponents) {
        const c = entry && entry.component;
        out.push(c && c.$ && c.$.type ? String(c.$.type.name || "?") : "?");
      }
      return join(out.sort());
    },
    registeredIntervals() {
      const out = [];
      for (const [, entry] of updateScheduler.registeredComponents) out.push(String(entry.interval));
      return join(out.sort());
    },
  },
};

window.__rb = rb;
