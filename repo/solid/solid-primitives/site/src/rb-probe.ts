/* RepairBench instrumentation - read-only observation bridge for the solid-primitives
 * documentation-site playground face.
 *
 * Installed from site/src/client.tsx at module scope, BEFORE hydrateStart(), so the two
 * exception traps below are live from module evaluation onward and cover hydration plus the
 * lazily imported `packages/<name>/dev/index.tsx` harness chunk alike.
 *
 * READ CONTRACT (this is what makes the bridge a measurement device and not a second app):
 *  - the read side never writes anything the application reads: no Solid signal, no store,
 *    no DOM attribute, no storage key, no timer the app owns. It keeps only its own records
 *    (a max-count map, a seen-message map, one frozen latch per key) and one MutationObserver.
 *  - exceptions are RECORDED, never swallowed: neither trap calls preventDefault() and neither
 *    re-dispatches, so the browser's own reporting is untouched and `errorCount()` only grows.
 *  - resource load failures (an <img>/<script> that 404s) carry no `.error` on the ErrorEvent
 *    and are deliberately NOT counted: they are supply problems, not application logic.
 *  - every read is idempotent and safe to poll. The one time-sensitive reader (the timer
 *    latch) is a ONE-SHOT freeze: `armNumDelta` refuses to re-arm, so a runner that polls the
 *
 *    inside the page, freeze one scalar, never assert a monotonic clock value).
 *
 * WRITE CONTRACT (setup drivers only - the F2P partition must reach its gestures without raw
 * Playwright locators, so every gesture is a real bubbling DOM event dispatched from here):
 *  - click/dblClick/setInput/select/submit dispatch exactly what a user gesture produces; they
 *    do not call application internals and do not touch any signal directly.
 *  - pressKeys dispatches KeyboardEvent objects on window in the given order with a real gap
 *    between them, so each key is its own task and the app's own sequence bookkeeping sees the
 *    same incremental states a human typing would produce.
 *
 * Structural hooks are `data-rb-*` attributes added by the same instrumentation patch to the
 * playground harnesses; the bridge only ever reads them.
 */

const A_ROOT = "data-rb-root";
const A_TEXT = "data-rb-text";
const A_COUNT = "data-rb-count";
const A_MAX = "data-rb-max";
const A_HAS = "data-rb-has";
const A_INPUT = "data-rb-input";
const A_SELECT = "data-rb-select";
const A_FORM = "data-rb-form";
const A_CLICK = "data-rb-click";
const A_DBL = "data-rb-dbl";
const A_SCOPE = "data-rb-scope";
const A_MSG = "data-rb-msg";

type Latch = { done: boolean; value: number | null };

export function installRbProbe(): void {
  const w = window as any;
  if (w.__SPRB__) return;

  const errors: string[] = [];
  const maxCounts = new Map<string, number>();
  const msgSeen = new Map<string, Set<string>>();
  const latches = new Map<string, Latch>();

  const norm = (s: any): string => String(s === null || s === undefined ? "" : s).replace(/\s+/g, " ").trim();
  const all = (sel: string): Element[] => Array.prototype.slice.call(document.querySelectorAll(sel));
  const byAttr = (attr: string, key: string): Element[] => all("[" + attr + '="' + key + '"]');
  const one = (attr: string, key: string): Element | null => document.querySelector("[" + attr + '="' + key + '"]');
  const lastInt = (s: any): number => {
    const m = String(s === null || s === undefined ? "" : s).match(/-?\d+(?:\.\d+)?/g);
    return m && m.length ? Number(m[m.length - 1]) : NaN;
  };
  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  // ---- one MutationObserver keeps the two "ever seen" records honest -----------------------
  const scan = (): void => {
    const groups = new Map<string, number>();
    for (const el of all("[" + A_COUNT + "]")) {
      const k = el.getAttribute(A_COUNT) || "";
      groups.set(k, (groups.get(k) || 0) + 1);
    }
    for (const k of Array.from(groups.keys())) {
      const n = groups.get(k) || 0;
      if (n > (maxCounts.get(k) || 0)) maxCounts.set(k, n);
    }
    const mgroups = new Map<string, number>();
    for (const el of all("[" + A_MAX + "]")) {
      const k = el.getAttribute(A_MAX) || "";
      mgroups.set(k, (mgroups.get(k) || 0) + 1);
    }
    for (const k of Array.from(mgroups.keys())) {
      const n = mgroups.get(k) || 0;
      if (n > (maxCounts.get("max:" + k) || 0)) maxCounts.set("max:" + k, n);
    }
    for (const el of all("[" + A_MSG + "]")) {
      const k = el.getAttribute(A_MSG) || "";
      let set = msgSeen.get(k);
      if (!set) {
        set = new Set<string>();
        msgSeen.set(k, set);
      }
      set.add(norm(el.textContent));
    }
  };

  const obs = new MutationObserver(() => {
    scan();
  });
  const obsRoot: Node = document.documentElement || document;
  obs.observe(obsRoot, { childList: true, subtree: true, characterData: true, attributes: true });

  window.addEventListener(
    "error",
    ev => {
      const e = ev as ErrorEvent;
      if (e && e.error) errors.push(String(e.message || e.error).split("\n")[0]);
    },
    false,
  );
  window.addEventListener("unhandledrejection", (ev: any) => {
    errors.push("unhandledrejection: " + String(ev && ev.reason).split("\n")[0]);
  });

  const fire = (el: Element, type: string) => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
  };

  w.__SPRB__ = {
    v: 1,
    installed: 1,

    // ---------------- readiness / health ----------------
    mounted: (): number => (all("[" + A_ROOT + "]").length ? 1 : 0),
    rootCount: (): number => all("[" + A_ROOT + "]").length,
    hookCount: (): number => all("[data-rb-root],[data-rb-text],[data-rb-count],[data-rb-has],[data-rb-input],[data-rb-click]").length,
    errorCount: (): number => errors.length,
    errors: (): string => errors.join(" | ").slice(0, 400),
    async waitReady(timeoutMs: number): Promise<number> {
      const budget = Number(timeoutMs) > 0 ? Number(timeoutMs) : 8000;
      const t0 = Date.now();
      while (Date.now() - t0 < budget) {
        if (all("[" + A_ROOT + "]").length > 0) return 1;
        await sleep(80);
      }
      return all("[" + A_ROOT + "]").length > 0 ? 1 : 0;
    },

    // ---------------- scalar readers (pure) ----------------
    text: (key: string): string | null => {
      const el = one(A_TEXT, key);
      return el ? norm(el.textContent) : null;
    },
    textHas: (key: string, needle: string): number | null => {
      const el = one(A_TEXT, key);
      return el ? (norm(el.textContent).indexOf(needle) >= 0 ? 1 : 0) : null;
    },
    value: (key: string): string | null => {
      const el = (one(A_INPUT, key) || one(A_SELECT, key)) as any;
      return el ? String(el.value) : null;
    },
    has: (key: string): number => (one(A_HAS, key) ? 1 : 0),
    count: (key: string): number => byAttr(A_COUNT, key).length,
    maxCount: (key: string): number => maxCounts.get(key) || 0,
    maxEver: (key: string): number => maxCounts.get("max:" + key) || 0,
    selCount: (scopeKey: string, sel: string): number => {
      const scope = one(A_SCOPE, scopeKey);
      return scope ? scope.querySelectorAll(sel).length : -1;
    },
    nthText: (key: string, i: number): string | null => {
      const el = byAttr(A_COUNT, key)[Number(i) || 0];
      return el ? norm(el.textContent) : null;
    },
    nthNum: (key: string, i: number, reSrc: string): number => {
      const el = byAttr(A_COUNT, key)[Number(i) || 0];
      if (!el) return -1;
      const m = norm(el.textContent).match(new RegExp(reSrc));
      if (!m) return -1;
      const raw = m[1] === undefined ? m[0] : m[1];
      const n = Number(raw);
      return Number.isFinite(n) ? n : -1;
    },
    nthTagCount: (key: string, i: number, tag: string): number => {
      const el = byAttr(A_COUNT, key)[Number(i) || 0];
      return el ? el.querySelectorAll(tag).length : -1;
    },
    nthHas: (key: string, i: number, sel: string): number => {
      const el = byAttr(A_COUNT, key)[Number(i) || 0];
      return el ? (el.querySelectorAll(sel).length ? 1 : 0) : -1;
    },
    afterLastEq: (key: string): string | null => {
      const el = one(A_TEXT, key);
      if (!el) return null;
      const t = norm(el.textContent);
      const i = t.lastIndexOf("=");
      return i < 0 ? null : t.slice(i + 1).trim();
    },
    sawMsg: (key: string, s: string): number => {
      const set = msgSeen.get(key);
      return set && set.has(norm(s)) ? 1 : 0;
    },
    msgCount: (key: string): number => {
      const set = msgSeen.get(key);
      return set ? set.size : 0;
    },

    // ---------------- one-shot frozen latch (timing) ----------------
    armNumDelta: (textKey: string, ms: number): number => {
      if (latches.has(textKey)) return 0;
      const t0 = lastInt((one(A_TEXT, textKey) || { textContent: "" }).textContent);
      latches.set(textKey, { done: false, value: null });
      const budget = Number(ms) > 0 ? Number(ms) : 2500;
      setTimeout(() => {
        const t1 = lastInt((one(A_TEXT, textKey) || { textContent: "" }).textContent);
        latches.set(textKey, {
          done: true,
          value: Number.isFinite(t0) && Number.isFinite(t1) ? t1 - t0 : -9999,
        });
      }, budget);
      return 1;
    },
    latchDone: (textKey: string): number => {
      const l = latches.get(textKey);
      return l && l.done ? 1 : 0;
    },
    latchValue: (textKey: string): number | null => {
      const l = latches.get(textKey);
      return l && l.done ? l.value : null;
    },

    // ---------------- isolation readers ----------------
    storageLength: (): number => {
      try {
        return window.localStorage.length;
      } catch {
        return -1;
      }
    },
    storageKeys: (): string => {
      try {
        const out: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) out.push(String(window.localStorage.key(i)));
        return out.sort().join("|");
      } catch {
        return "<blocked>";
      }
    },
    pathname: (): string => location.pathname,
    residueCount: (): number =>
      Object.getOwnPropertyNames(window).filter(n => /^__SPRB|^__rb|^rbProbe|^sprb/i.test(n)).length,

    // ---------------- setup drivers (real DOM events) ----------------
    click: (key: string, i?: number): number => {
      const el = byAttr(A_CLICK, key)[Number(i) || 0] as any;
      if (!el) return 0;
      if (typeof el.click === "function") el.click();
      else fire(el, "click");
      return 1;
    },
    dblClick: (key: string, i?: number): number => {
      const el = byAttr(A_DBL, key)[Number(i) || 0];
      if (!el) return 0;
      fire(el, "dblclick");
      return 1;
    },
    setInput: (key: string, s: string): number => {
      const el = one(A_INPUT, key) as any;
      if (!el) return 0;
      el.value = String(s);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return 1;
    },
    select: (key: string, v: string): number => {
      const el = one(A_SELECT, key) as any;
      if (!el) return 0;
      el.value = String(v);
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return 1;
    },
    submit: (key: string): number => {
      const el = one(A_FORM, key) as any;
      if (!el) return 0;
      if (typeof el.requestSubmit === "function") el.requestSubmit();
      else el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      return 1;
    },
    async pressKeys(keys: string[], gapMs?: number): Promise<number> {
      const gap = Number(gapMs) > 0 ? Number(gapMs) : 150;
      let n = 0;
      for (const k of keys) {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: String(k), bubbles: true, cancelable: true }));
        n++;
        await sleep(gap);
      }
      return n;
    },
    async repeatClick(key: string, times: number, gapMs?: number): Promise<number> {
      const gap = Number(gapMs) > 0 ? Number(gapMs) : 150;
      let n = 0;
      for (let i = 0; i < (Number(times) || 0); i++) {
        const el = byAttr(A_CLICK, key)[0] as any;
        if (!el) break;
        if (typeof el.click === "function") el.click();
        else fire(el, "click");
        n++;
        await sleep(gap);
      }
      return n;
    },
  };

  scan();
}
