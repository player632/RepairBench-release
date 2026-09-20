/**
 * rb-probe.ts - the read-only observation bridge (window.__rb) plus the gesture
 * atoms (window.__rbHost) that tests/dsl.json drives. Installed by
 * environment/instrumentation.patch; it observes the app, it never steers it.
 *
 * Two rules were held to throughout:
 *  - every __rb reader returns a SCALAR (string / number / boolean / JSON text),
 *    never a live object, because evaluation/dsl_runner.mjs compares js_eval
 *    results with a loose == against `expected` and an object/array expected
 *    value can never match;
 *  - every __rbHost atom is a user gesture the real UI could produce (a wheel
 *    frame, a click, a scroll offset, an identity written to localStorage, one
 *    server socket frame). None of them reaches into a Solid signal, a store or
 *    a query cache, so a checkpoint can only ever go green through the app's own
 *    code path.
 *
 * The offline desk published by src/rb-offline.ts is read from window.__rbDesk;
 * this module imports nothing from it, so reversing instrumentation leaves the
 *
 */

interface RbDeskView {
  version: string;
  blockedCount: () => number;
  blockedUrls: () => string;
  unknownPaths: () => string;
  apiLog: () => string;
  duckCount: () => number;
  duckNames: () => string;
  lastCreate: () => unknown;
  openedWindows: () => string;
  socketCount: () => number;
  socketUrls: () => string;
  socketMessages: () => string;
  emitSocket: (payload: unknown) => number;
}

const desk = (): RbDeskView | undefined =>
  (window as unknown as { __rbDesk?: RbDeskView }).__rbDesk;

const json = (value: unknown): string => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "null";
  }
};

const q = (selector: string): Element | null => document.querySelector(selector);
const qa = (selector: string): Element[] =>
  Array.from(document.querySelectorAll(selector));

const byTestId = (id: string): Element | null => q(`[data-testid="${id}"]`);

const textOf = (element: Element | null): string =>
  (element?.textContent ?? "").replace(/\s+/g, " ").trim();

const attrOf = (element: Element | null, name: string): string =>
  element?.getAttribute(name) ?? "";

/** Absolute-URL census at the ELEMENT layer, origin-aware (see rb-offline.ts). */
const externalElementUrls = (): string[] => {
  const selectors = [
    "link[href]",
    "script[src]",
    "img[src]",
    "iframe[src]",
    "source[src]",
    "video[src]",
    "audio[src]",
  ];
  const found: string[] = [];
  for (const selector of selectors) {
    for (const element of qa(selector)) {
      const raw =
        element.getAttribute("href") ?? element.getAttribute("src") ?? "";
      if (!raw) continue;
      if (/^(blob:|data:|#)/i.test(raw)) continue;
      let url: URL;
      try {
        url = new URL(raw, window.location.href);
      } catch {
        // Unparseable absolute reference: counted (fail closed), never waved through.
        found.push(`UNPARSEABLE:${raw.slice(0, 160)}`);
        continue;
      }
      if (url.origin !== window.location.origin) found.push(url.href.slice(0, 200));
      else if (/^(https?:)?\/\//i.test(raw)) found.push(`PROTO_ABS_SAME_ORIGIN:${url.href.slice(0, 200)}`);
    }
  }
  return found;
};

/** Request-layer census: what the page actually fetched, origin-aware. */
const crossOriginResources = (): string[] => {
  let entries: PerformanceResourceTiming[] = [];
  try {
    entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  } catch {
    entries = [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    const name = String(entry.name ?? "");
    if (/^(blob:|data:)/i.test(name)) continue;
    try {
      if (new URL(name).origin !== window.location.origin) out.push(name.slice(0, 200));
    } catch {
      out.push(`UNPARSEABLE:${name.slice(0, 160)}`);
    }
  }
  return out;
};

const canvasInner = (): HTMLElement | null =>
  byTestId("rb-canvas-inner") as HTMLElement | null;

const parseTransform = (value: string): { x: number; y: number; scale: number } => {
  const translate = /translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/.exec(value);
  const scale = /scale\(\s*(-?[\d.]+)\s*\)/.exec(value);
  return {
    x: translate ? Number(translate[1]) : Number.NaN,
    y: translate ? Number(translate[2]) : Number.NaN,
    scale: scale ? Number(scale[1]) : Number.NaN,
  };
};

const scrollAreaIn = (scopeTestId: string): HTMLElement | null => {
  const scope = byTestId(scopeTestId) ?? document.body;
  return scope.querySelector(".overflow-y-auto") as HTMLElement | null;
};

/**
 * Frozen snapshots. Some checkpoints are two-phase by nature - a momentum glide
 * has to be measured against the pan offset at the instant of release, the
 * gradient fade against the opacity before the scroll. An assert in
 * evaluation/dsl_runner.mjs POLLS until it matches, so a "value did not change"
 * reading can never be taken at assert time; __rbHost.mark(label) freezes the
 * reading at a setup step instead and the asserts compare against the frozen
 * copy. Marks live for the lifetime of the page only (each checkpoint gets a
 * fresh browser context in the runner), so nothing leaks between checkpoints.
 */
type TMarkSnapshot = {
  canvasX: number;
  canvasY: number;
  canvasScale: number;
  topGradientOpacity: string;
  scrollTop: number;
  locationPath: string;
  duckCount: number;
  alertCount: number;
};

/** Returned by every numeric mark reader when the label was never marked. */
const ABSENT_NUM = -1000000;

const marks: Record<string, TMarkSnapshot> = {};

const topGradientElement = (): HTMLElement | null => {
  const area = scrollAreaIn("rb-tab-panel");
  return (area?.parentElement?.firstElementChild as HTMLElement | null) ?? null;
};

const takeSnapshot = (): TMarkSnapshot => {
  const transform = parseTransform(canvasInner()?.style.transform ?? "");
  const area = scrollAreaIn("rb-tab-panel");
  return {
    canvasX: Number.isFinite(transform.x) ? transform.x : ABSENT_NUM,
    canvasY: Number.isFinite(transform.y) ? transform.y : ABSENT_NUM,
    canvasScale: Number.isFinite(transform.scale)
      ? transform.scale
      : ABSENT_NUM,
    topGradientOpacity: topGradientElement()?.style.opacity ?? "ABSENT",
    scrollTop: area ? Math.round(area.scrollTop) : -1,
    locationPath: window.location.pathname,
    duckCount: qa('[data-testid^="rb-duck-"]').length,
    alertCount: qa('[role="alert"]').length,
  };
};

const markOf = (label: string): TMarkSnapshot | undefined => marks[label];

const rb = {
  version: (): string => "rb-probe/1",
  deskVersion: (): string => desk()?.version ?? "ABSENT",

  // ---- offline self-containment ------------------------------------------
  blockedRequests: (): number => desk()?.blockedCount() ?? -1,
  blockedUrls: (): string => desk()?.blockedUrls() ?? "",
  unknownApiPaths: (): string => desk()?.unknownPaths() ?? "",
  apiLog: (): string => desk()?.apiLog() ?? "",
  apiCallCount: (): number => (desk()?.apiLog() ?? "").split(" | ").filter(Boolean).length,
  crossOriginResourceCount: (): number => crossOriginResources().length,
  crossOriginResources: (): string => crossOriginResources().join(" | "),
  externalElementCount: (): number => externalElementUrls().length,
  externalElements: (): string => externalElementUrls().join(" | "),
  openedWindows: (): string => desk()?.openedWindows() ?? "",
  socketCount: (): number => desk()?.socketCount() ?? -1,
  socketUrls: (): string => desk()?.socketUrls() ?? "",
  socketMessages: (): string => desk()?.socketMessages() ?? "",

  //
  storageKeys: (): string => Object.keys(localStorage).sort().join(","),
  sessionKeys: (): string => Object.keys(sessionStorage).sort().join(","),
  authToken: (): string => localStorage.getItem("authToken") ?? "",
  userData: (): string => localStorage.getItem("userData") ?? "",
  cookieNames: (): string =>
    document.cookie
      .split(";")
      .map((entry) => entry.split("=")[0].trim())
      .filter(Boolean)
      .sort()
      .join(","),
  locationPath: (): string => window.location.pathname,
  locationSearch: (): string => window.location.search,
  globalResidue: (): string =>
    Object.keys(window)
      .filter((key) => key.startsWith("__rb") === false && /^(__|rb)/.test(key))
      .sort()
      .join(","),

  // ---- generic readers ----------------------------------------------------
  rootChildCount: (): number => (q("#root")?.childElementCount ?? 0),
  text: (testId: string): string => textOf(byTestId(testId)),
  attr: (testId: string, name: string): string => attrOf(byTestId(testId), name),
  count: (selector: string): number => qa(selector).length,
  present: (testId: string): boolean => byTestId(testId) !== null,
  input: (testId: string): string =>
    (byTestId(testId) as HTMLInputElement | null)?.value ?? "",
  disabled: (testId: string): boolean =>
    (byTestId(testId) as HTMLButtonElement | null)?.disabled === true,
  alertCount: (scopeTestId: string): number =>
    (byTestId(scopeTestId) ?? document.body).querySelectorAll('[role="alert"]').length,
  alertTexts: (scopeTestId: string): string =>
    Array.from(
      (byTestId(scopeTestId) ?? document.body).querySelectorAll('[role="alert"]'),
    )
      .map((node) => textOf(node))
      .join(" | "),

  // ---- party yard ---------------------------------------------------------
  duckIds: (): string =>
    qa('[data-testid^="rb-duck-"]')
      .map((node) => attrOf(node, "data-testid"))
      .sort()
      .join(","),
  duckCount: (): number => qa('[data-testid^="rb-duck-"]').length,
  deskDuckCount: (): number => desk()?.duckCount() ?? -1,
  deskDuckNames: (): string => desk()?.duckNames() ?? "",
  canvasTransform: (): string => canvasInner()?.style.transform ?? "",
  canvasX: (): number => parseTransform(canvasInner()?.style.transform ?? "").x,
  canvasY: (): number => parseTransform(canvasInner()?.style.transform ?? "").y,
  canvasScale: (): number => parseTransform(canvasInner()?.style.transform ?? "").scale,
  soundIcon: (): string => {
    const toggle = byTestId("rb-mute-toggle");
    if (!toggle) return "ABSENT";
    if (toggle.querySelector('[data-rb-icon="mute"]')) return "mute";
    if (toggle.querySelector('[data-rb-icon="unmute"]')) return "unmute";
    return "none";
  },
  menuOpen: (): string => attrOf(q('[aria-label="Toggle menu"]'), "aria-expanded"),
  menuLabels: (): string =>
    qa('[role="menuitem"]').map((node) => textOf(node)).join(","),
  menuItemCount: (): number => qa('[role="menuitem"]').length,
  setEmailDialogPresent: (): boolean => q(".set-email-dialog") !== null,

  // ---- appearance selector -------------------------------------------------
  tabActive: (): string => {
    const active = qa('[data-testid^="rb-tab-"]').find(
      (node) => (node.className || "").includes("bg-primary"),
    );
    return active ? attrOf(active, "data-testid").replace("rb-tab-", "") : "";
  },
  appearanceItemCount: (kind: string): number =>
    qa(`[data-rb-kind="${kind}"]`).length,
  appearanceIds: (kind: string): string =>
    qa(`[data-rb-kind="${kind}"]`)
      .map((node) => attrOf(node, "data-rb-id"))
      .join(","),
  pressedAppearanceIds: (): string =>
    qa('[data-rb-kind][aria-pressed="true"]')
      .map((node) => attrOf(node, "data-rb-id"))
      .sort()
      .join(","),
  pressedSkinIds: (): string =>
    qa('[data-rb-kind="skin"][aria-pressed="true"]')
      .map((node) => attrOf(node, "data-rb-id"))
      .join(","),
  pressedAccessoryIds: (): string =>
    qa('[data-rb-kind="accessory"][aria-pressed="true"]')
      .map((node) => attrOf(node, "data-rb-id"))
      .sort()
      .join(","),
  duckPreviewSrc: (): string => {
    const preview = byTestId("rb-preview");
    const img = preview?.querySelector('img[alt="body"]');
    return img?.getAttribute("src") ?? "";
  },
  duckPreviewLayerCount: (): number =>
    byTestId("rb-preview")?.querySelectorAll("img").length ?? 0,
  finishStylingPresent: (): boolean => byTestId("rb-finish-styling") !== null,
  accessoryScroll: (): string => {
    const area = scrollAreaIn("rb-tab-panel");
    if (!area) return json({ found: false });
    const gradient = area.parentElement?.firstElementChild as HTMLElement | null;
    return json({
      found: true,
      scrollTop: Math.round(area.scrollTop),
      scrollHeight: area.scrollHeight,
      clientHeight: area.clientHeight,
      scrollable: area.scrollHeight > area.clientHeight,
      topGradientOpacity: gradient?.style.opacity ?? "",
    });
  },

  // ---- duck info modal ------------------------------------------------------
  modalOpen: (): boolean => q('[role="dialog"][aria-label="Overlay"]') !== null,
  modalFields: (): string =>
    json({
      name: textOf(byTestId("rb-info-name")),
      creator: textOf(byTestId("rb-info-creator")),
      birthday: textOf(byTestId("rb-info-birthday")),
      likes: textOf(byTestId("rb-info-likes")),
      dislikes: textOf(byTestId("rb-info-dislikes")),
      rank: textOf(byTestId("rb-info-rank")),
    }),
  birthdayText: (): string => textOf(byTestId("rb-info-birthday")),

  // ---- leaderboard / creator page -------------------------------------------
  leaderboardRows: (): string =>
    json(
      qa('[data-testid="rb-lb-row"]').map((row) => ({
        rank: textOf(row.querySelector('[data-testid="rb-lb-rank"]')),
        name: textOf(row.querySelector('[data-testid="rb-lb-name"]')),
        likes: textOf(row.querySelector('[data-testid="rb-lb-likes"]')),
        dislikes: textOf(row.querySelector('[data-testid="rb-lb-dislikes"]')),
        creator: textOf(row.querySelector('[data-testid="rb-lb-creator"]')),
      })),
    ),
  creatorCardCount: (): number => qa('[data-testid="rb-creator-card"]').length,
  socialCard: (): string => {
    const img = byTestId("rb-social-card") as HTMLImageElement | null;
    if (!img) return json({ present: false });
    const src = img.getAttribute("src") ?? "";
    return json({
      present: true,
      isDataUrl: /^data:/i.test(src),
      mime: /^data:([^;]+)/.exec(src)?.[1] ?? "",
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    });
  },
  lastCreate: (): string => json(desk()?.lastCreate() ?? null),
  githubStars: (): string => textOf(byTestId("rb-github-star")),

  // ---- frozen marks --------------------------------------------------------
  markCount: (): number => Object.keys(marks).length,
  markLabels: (): string => Object.keys(marks).sort().join(","),
  markCanvasX: (label: string): number => markOf(label)?.canvasX ?? ABSENT_NUM,
  markCanvasY: (label: string): number => markOf(label)?.canvasY ?? ABSENT_NUM,
  markCanvasScale: (label: string): number =>
    markOf(label)?.canvasScale ?? ABSENT_NUM,
  markTopGradientOpacity: (label: string): string =>
    markOf(label)?.topGradientOpacity ?? "ABSENT",
  markScrollTop: (label: string): number => markOf(label)?.scrollTop ?? -1,
  markLocationPath: (label: string): string =>
    markOf(label)?.locationPath ?? "ABSENT",
  markDuckCount: (label: string): number => markOf(label)?.duckCount ?? -1,
  markAlertCount: (label: string): number => markOf(label)?.alertCount ?? -1,
  canvasXSince: (label: string): number =>
    rb.canvasX() - (markOf(label)?.canvasX ?? ABSENT_NUM),
  canvasYSince: (label: string): number =>
    rb.canvasY() - (markOf(label)?.canvasY ?? ABSENT_NUM),
  canvasScaleSince: (label: string): number =>
    rb.canvasScale() - (markOf(label)?.canvasScale ?? ABSENT_NUM),
  snapshot: (): string => json(takeSnapshot()),
};

const host = {
  /**
   * Writes the signed-in identity the desk's GET /user answers for, then the
   * checkpoint reloads so every component reads it at setup time (the seed reads
   * localStorage synchronously in component bodies, e.g.
   * src/pages/Party/index.tsx:33 and src/components/DuckCard/DuckCard.tsx:15).
   */
  seedAuth: (): string => {
    localStorage.setItem("authToken", "rb-otp-token-0002");
    localStorage.setItem(
      "userData",
      json({
        ID: 42,
        CreatedAt: new Date(Date.now() - 120 * 86_400_000).toISOString(),
        UpdatedAt: new Date(Date.now() - 86_400_000).toISOString(),
        display_name: "Quackmaster",
      }),
    );
    return rb.storageKeys();
  },
  clearAuth: (): string => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    return rb.storageKeys();
  },
  /** One wheel frame at (x,y); Solid binds onWheel on the canvas container. */
  wheel: (x: number, y: number, deltaY: number): boolean => {
    const target = (document.elementFromPoint(x, y) ?? document.body) as HTMLElement;
    target.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
      }),
    );
    return true;
  },
  clickTestId: (testId: string): boolean => {
    const node = byTestId(testId) as HTMLElement | null;
    if (!node) return false;
    node.click();
    return true;
  },
  clickSelector: (selector: string): boolean => {
    const node = q(selector) as HTMLElement | null;
    if (!node) return false;
    node.click();
    return true;
  },
  clickAriaLabel: (label: string): boolean => {
    const node = q(`[aria-label="${label}"]`) as HTMLElement | null;
    if (!node) return false;
    node.click();
    return true;
  },
  /**
   * Scrolls the appearance selector's list. The scroll offset is set directly
   * and the scroll event dispatched by hand: the ducks/cards sit inside a
   * rounded overflow container whose scroll bar is styled away, so a synthetic
   * wheel there would be absorbed by the canvas handler instead.
   */
  scrollPanel: (y: number): string => {
    const area = scrollAreaIn("rb-tab-panel");
    if (!area) return json({ found: false });
    area.scrollTop = y;
    area.dispatchEvent(new Event("scroll", { bubbles: false }));
    return rb.accessoryScroll();
  },
  /** Delivers one server frame to every open socket (src/hooks/useSocket.hook.ts). */
  emitSocket: (type: string, data: unknown): number =>
    desk()?.emitSocket({ type, data }) ?? -1,
  escape: (): boolean => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    return true;
  },
  /** Freezes the current readings under `label` (see TMarkSnapshot above). */
  mark: (label: string): string => {
    marks[label] = takeSnapshot();
    return json({ label, ...marks[label] });
  },
  /**
   * Freezes the readings from inside a `pointerup` listener instead of from a
   * later round-trip: DucksCanvas registers its own window-level pointerup
   * handler (src/components/DucksCanvas/DucksCanvas.tsx:178), so by the time
   * this once-listener runs the app has already called endPan() and scheduled
   * the first momentum frame, which has not painted yet. That makes the frozen
   * canvasX exactly the release offset, with no CDP round-trip in between.
   */
  armPointerUpMark: (label: string): boolean => {
    window.addEventListener(
      "pointerup",
      () => {
        marks[label] = takeSnapshot();
      },
      { once: true },
    );
    return true;
  },
  clearMarks: (): number => {
    for (const key of Object.keys(marks)) delete marks[key];
    return Object.keys(marks).length;
  },
};

(window as unknown as Record<string, unknown>).__rb = rb;
(window as unknown as Record<string, unknown>).__rbHost = host;
