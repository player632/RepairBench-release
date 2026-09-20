// RepairBench observation bridge for the montage face (instrumentation only).
// READ-ONLY BY CONSTRUCTION: every member is a getter over the application's own
// state or over the rendered DOM, and the published facade is frozen, so a
// checkpoint can observe the app but can never drive it or repair it through the
// bridge. Nothing here changes a seed behaviour; the module also installs a
// pass-through network recorder whose only effect is counting.

/* eslint-disable @typescript-eslint/no-explicit-any */

const RB_GLOBAL = "__rb_montage";
const GUIDE_IDS = ["centerH", "centerV", "lineH", "lineV"];
// Canvas census has THREE classes, not two. Besides the four named guide lines, the seed puts one
// more object on the canvas at boot that is NOT user material and has NO id: the non-selectable
// centre marker Circle added at src/pages/Dashboard.vue:1014 (`centerCircle`, constructed :1005-1013
// with selectable:false). Every user object this app creates carries the store's layer id - newSvg,
// newTextbox, newImage and newVideo all pass `id: layer.id` - so an empty id means canvas chrome.
// Measured at boot on the clean tree (probe_clean.json): canvasObjectCount 5 = 4 guides + 1 chrome +
// 0 user. Counting the chrome object as user material inflated userObjectCount to 1 at boot, which
// both falsified the "no user material at boot" census and made every setup poll that waits for
// `userObjectCount >= 1` return before the material it waits for had landed.

interface NetTally {
  external: number;
  loopback: number;
  blocked: string[];
}

const net: NetTally = { external: 0, loopback: 0, blocked: [] };

const isLoopback = (u: string): boolean => {
  try {
    const h = new URL(u, location.href).hostname;
    return h === location.hostname || h === "127.0.0.1" || h === "localhost" || h === "[::1]" || h === "";
  } catch (e) {
    return true;
  }
};

const record = (u: string): void => {
  if (isLoopback(u)) net.loopback += 1;
  else {
    net.external += 1;
    if (net.blocked.length < 32) net.blocked.push(u);
  }
};

// Pass-through recorders: the original fetch / XHR are always invoked unchanged.
const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
if (nativeFetch) {
  (window as any).fetch = function rbFetch(input: any, init?: any) {
    try {
      record(typeof input === "string" ? input : (input && input.url) || String(input));
    } catch (e) {
      /* recorder must never break the app */
    }
    return nativeFetch(input, init);
  };
}

const nativeOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function rbOpen(
  this: XMLHttpRequest,
  method: string,
  url: string | URL,
  ...rest: any[]
) {
  try {
    record(String(url));
  } catch (e) {
    /* recorder must never break the app */
  }
  return (nativeOpen as any).apply(this, [method, url, ...rest]);
} as any;

const num = (v: any, d = 0): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : d;
};
const r2 = (v: any): number => Math.round(num(v) * 100) / 100;
const joinIds = (a: any[]): string => a.map((x) => String(x)).join("|");

const q = (sel: string): Element | null => document.querySelector(sel);
const qa = (sel: string): Element[] => Array.prototype.slice.call(document.querySelectorAll(sel));
const pxOf = (el: Element | null): number => {
  if (!el) return -1;
  const v = (el as HTMLElement).style.left;
  return v ? parseFloat(v) : -1;
};
const txt = (el: Element | null): string => (el ? (el.textContent || "").trim() : "~absent~");

export interface BridgeSources {
  state: any;
  store: any;
  getCanvas: () => any;
  getArtBoard: () => any;
}

export function publishMontageBridge(src: BridgeSources): void {
  const canvas = () => src.getCanvas();
  const artBoard = () => src.getArtBoard();
  const layers = (): any[] => (Array.isArray(src.store && src.store.layers) ? src.store.layers : []);

  const objects = (): any[] => {
    const c = canvas();
    if (!c || typeof c.getObjects !== "function") return [];
    return c.getObjects();
  };
  const objId = (o: any): string => {
    try {
      const v = o && typeof o.get === "function" ? o.get("id") : o && o.id;
      return v === undefined || v === null ? "" : String(v);
    } catch (e) {
      return "";
    }
  };
  // id-less canvas chrome (see the GUIDE_IDS comment block): never user material.
  const isChrome = (o: any): boolean => objId(o) === "";
  const userObjects = (): any[] => objects().filter((o) => !isChrome(o) && GUIDE_IDS.indexOf(objId(o)) === -1);
  const active = (): any => {
    const c = canvas();
    try {
      return c && typeof c.getActiveObject === "function" ? c.getActiveObject() || null : null;
    } catch (e) {
      return null;
    }
  };
  const boardMetric = (k: string): number => {
    const b = artBoard();
    try {
      return b && typeof b.get === "function" ? num(b.get(k)) : 0;
    } catch (e) {
      return 0;
    }
  };
  const activeMetric = (k: string): number => {
    const a = active();
    try {
      return a && typeof a.get === "function" ? num(a.get(k)) : 0;
    } catch (e) {
      return 0;
    }
  };

  const facade: any = {
    // --- presence / boot ---
    get ready(): boolean {
      return !!canvas();
    },
    get bridgeGlobals(): number {
      return Object.keys(window).filter((k) => k.indexOf("__rb") === 0).length;
    },

    // --- network (pass-through recorder readings) ---
    get netExternal(): number {
      return net.external;
    },
    get netLoopback(): number {
      return net.loopback;
    },
    get netExternalFirst(): string {
      return net.blocked.length ? net.blocked[0] : "";
    },
    get externalResourceNodes(): number {
      return qa("link[href],script[src],img[src],source[src],video[src],iframe[src]").filter((el) => {
        const u =
          el.getAttribute("href") || el.getAttribute("src") || "";
        return !!u && !isLoopback(u);
      }).length;
    },

    // --- fabric canvas ---
    get canvasObjectCount(): number {
      return objects().length;
    },
    get guideObjectCount(): number {
      return objects().filter((o) => GUIDE_IDS.indexOf(objId(o)) !== -1).length;
    },
    get userObjectCount(): number {
      return userObjects().length;
    },
    get chromeObjectCount(): number {
      return objects().filter(isChrome).length;
    },
    get canvasStackIds(): string {
      return joinIds(userObjects().map(objId).filter((x) => x !== ""));
    },
    get canvasTopId(): string {
      const u = userObjects().map(objId).filter((x) => x !== "");
      return u.length ? u[u.length - 1] : "";
    },
    get canvasBottomId(): string {
      const u = userObjects().map(objId).filter((x) => x !== "");
      return u.length ? u[0] : "";
    },
    get zoomPct(): number {
      const c = canvas();
      try {
        return c && typeof c.getZoom === "function" ? Math.round(num(c.getZoom(), 1) * 100) : -1;
      } catch (e) {
        return -1;
      }
    },

    // --- active object ---
    get activeObjectId(): string {
      const a = active();
      return a ? objId(a) : "";
    },
    get activeObjectType(): string {
      const a = active();
      try {
        return a ? String(a.type || (typeof a.get === "function" ? a.get("type") : "")) : "";
      } catch (e) {
        return "";
      }
    },
    get activeObjectTop(): number {
      return r2(activeMetric("top"));
    },
    get activeObjectLeft(): number {
      return r2(activeMetric("left"));
    },
    get activeObjectAngle(): number {
      return r2(activeMetric("angle"));
    },
    get activeObjectOpacity(): number {
      return r2(activeMetric("opacity"));
    },
    get activeObjectVisible(): number {
      const a = active();
      return a && a.visible ? 1 : 0;
    },
    get activeObjectScaledHeight(): number {
      const a = active();
      try {
        return a && typeof a.getScaledHeight === "function" ? r2(a.getScaledHeight()) : -1;
      } catch (e) {
        return -1;
      }
    },
    get activeObjectScaledWidth(): number {
      const a = active();
      try {
        return a && typeof a.getScaledWidth === "function" ? r2(a.getScaledWidth()) : -1;
      } catch (e) {
        return -1;
      }
    },

    // --- alignment deltas, viewport independent by construction ---
    get alignDeltaV(): number {
      return Math.round(activeMetric("top") - (boardMetric("top") + boardMetric("height") / 2));
    },
    get alignDeltaH(): number {
      return Math.round(activeMetric("left") - (boardMetric("left") + boardMetric("width") / 2));
    },
    get alignTopDelta(): number {
      return Math.round(activeMetric("top") - boardMetric("top"));
    },
    get alignBottomDelta(): number {
      return Math.round(activeMetric("top") - (boardMetric("top") + boardMetric("height")));
    },
    get alignLeftDelta(): number {
      return Math.round(activeMetric("left") - boardMetric("left"));
    },
    get alignRightDelta(): number {
      return Math.round(activeMetric("left") - (boardMetric("left") + boardMetric("width")));
    },
    get alignCenterVDeltaHalfHeight(): number {
      return Math.round(
        activeMetric("top") -
          (boardMetric("top") + boardMetric("height") / 2) +
          (activeMetric("height") * activeMetric("scaleY")) / 2
      );
    },

    // --- artboard ---
    get artboardWidth(): number {
      return r2(src.store ? src.store.artboardWidth : -1);
    },
    get artboardHeight(): number {
      return r2(src.store ? src.store.artboardHeight : -1);
    },
    get artboardColor(): string {
      return String(src.store ? src.store.artboardColor : "");
    },

    // --- store: layers ---
    get layerCount(): number {
      return layers().length;
    },
    get layerIds(): string {
      return joinIds(layers().map((l) => l.id));
    },
    get layerTypes(): string {
      return joinIds(layers().map((l) => l.type));
    },
    get layerDurations(): string {
      return joinIds(layers().map((l) => num(l.duration)));
    },
    get layerOffsets(): string {
      return joinIds(layers().map((l) => num(l.offset)));
    },
    get layerStartTrims(): string {
      return joinIds(layers().map((l) => num(l.startTrim)));
    },
    get layerEndTrims(): string {
      return joinIds(layers().map((l) => num(l.endTrim)));
    },
    get layerVisible(): string {
      return joinIds(layers().map((l) => (l && l.object && l.object.visible ? 1 : 0)));
    },
    get layerTopId(): string {
      const ls = layers();
      return ls.length ? String(ls[0].id) : "";
    },
    get layerTopType(): string {
      const ls = layers();
      return ls.length ? String(ls[0].type) : "";
    },

    // --- store: scalars ---
    get activeTab(): number {
      return num(src.store ? src.store.activeTab : -1);
    },
    get paused(): number {
      return src.store && src.store.paused ? 1 : 0;
    },
    get loading(): number {
      return src.store && src.store.loading ? 1 : 0;
    },
    get storeActiveObjectId(): string {
      const v = src.store ? src.store.activeObjectId : undefined;
      return v === undefined || v === null ? "" : String(v);
    },
    get storeActiveObjectDuration(): number {
      return r2(src.store ? src.store.activeObjectDuration : -1);
    },
    get storeActiveObjectRotation(): number {
      return r2(src.store ? src.store.activeObjectRotation : -1);
    },
    get storeActiveObjectOpacity(): number {
      return r2(src.store ? src.store.activeObjectOpacity : -1);
    },

    // --- page state (Dashboard's own reactive) ---
    get currentTime(): number {
      return num(src.state ? src.state.currentTime : -1);
    },
    get projectDuration(): number {
      return num(src.state ? src.state.duration : -1);
    },
    get seekbarOffset(): number {
      return r2(src.state ? src.state.seekbarOffset : -1);
    },
    get seekHoverOffset(): number {
      return r2(src.state ? src.state.seekHoverOffset : -1);
    },
    get seeking(): number {
      return src.state && src.state.seeking ? 1 : 0;
    },
    get dragging(): number {
      return src.state && src.state.dragging ? 1 : 0;
    },
    get zoomLevelState(): number {
      return r2(src.state ? src.state.zoomLevel : -1);
    },
    get playbackSpeed(): number {
      return num(src.state ? src.state.playbackSpeed : -1);
    },
    get outputFormat(): string {
      return String(src.state ? src.state.outputFormat : "");
    },

    // --- rendered DOM ---
    get clockText(): string {
      return txt(q('[data-testid="rb-clock"]'));
    },
    get tabTitle(): string {
      return txt(q('[data-testid="rb-tab-title"]'));
    },
    get tabButtonCount(): number {
      return qa('[data-testid="rb-tabs"] button').length;
    },
    get layerHeader(): string {
      return txt(q('[data-testid="rb-layer-header"]'));
    },
    get layerEmptyText(): string {
      return txt(q('[data-testid="rb-layer-empty"]'));
    },
    get layerRowCount(): number {
      return qa('[data-testid="rb-layer-row"]').length;
    },
    get layerRowLabels(): string {
      return joinIds(qa('[data-testid="rb-layer-row"]').map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()));
    },
    get layerRowActiveIndex(): number {
      const rows = qa('[data-testid="rb-layer-row"]');
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i].className).indexOf("bg-indigo-500") !== -1) return i;
      }
      return -1;
    },
    get timelineRowCount(): number {
      return qa('[data-testid="rb-timeline-row"]').length;
    },
    get timelineRowWidths(): string {
      return joinIds(qa('[data-testid="rb-timeline-row"]').map((el) => parseFloat((el as HTMLElement).style.width)));
    },
    get timelineRowLefts(): string {
      return joinIds(qa('[data-testid="rb-timeline-row"]').map((el) => parseFloat((el as HTMLElement).style.left)));
    },
    get trimRowWidths(): string {
      return joinIds(qa('[data-testid="rb-trim-row"]').map((el) => parseFloat((el as HTMLElement).style.width)));
    },
    get trimRowLefts(): string {
      return joinIds(qa('[data-testid="rb-trim-row"]').map((el) => parseFloat((el as HTMLElement).style.left)));
    },
    get tickCount(): number {
      return qa('[data-testid="rb-tick-second"]').length;
    },
    get tickLabels(): string {
      return joinIds(qa('[data-testid="rb-tick-second"]').map((el) => (el.textContent || "").trim()));
    },
    get halfTickCount(): number {
      return qa('[data-testid="rb-tick-half"]').length;
    },
    get seekbarLeftPx(): number {
      return r2(pxOf(q("#seekbar")));
    },
    get hoverbarLeftPx(): number {
      return r2(pxOf(q("#seek-hover")));
    },
    get hoverbarOpacity(): number {
      const el = q("#seek-hover") as HTMLElement | null;
      return el ? r2(el.style.opacity) : -1;
    },
    get endbarLeftPx(): number {
      return r2(pxOf(q("#video-duration-end-bar")));
    },
    get toastTexts(): string {
      return joinIds(qa('[data-testid="rb-toast"]').map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()));
    },
    get toastCount(): number {
      return qa('[data-testid="rb-toast"]').length;
    },
    get activeSectionPresent(): number {
      return q('[data-testid="rb-active-section"]') ? 1 : 0;
    },
    get canvasSectionPresent(): number {
      return q('[data-testid="rb-canvas-section"]') ? 1 : 0;
    },
    get transportDisabled(): string {
      return joinIds(qa('[data-testid="rb-transport"] button').map((el) => ((el as HTMLButtonElement).disabled ? 1 : 0)));
    },
    get playButtonIconClass(): string {
      const b = qa('[data-testid="rb-transport"] button')[1];
      if (!b) return "~absent~";
      const i = b.querySelector("i");
      return i ? String(i.className).split(/\s+/).filter((c) => c.indexOf("mdi-") === 0).join("|") : "~no-icon~";
    },
    get durationInputValue(): string {
      const el = q('[data-testid="rb-duration-row"] input') as HTMLInputElement | null;
      return el ? String(el.value) : "~absent~";
    },
    get canvasDurationInputValue(): string {
      const el = q('[data-testid="rb-canvas-duration-row"] input') as HTMLInputElement | null;
      return el ? String(el.value) : "~absent~";
    },
    get languageSelectItemCount(): number {
      return qa('[data-testid="rb-settings-general"] .v-select').length;
    },
    get settingsSwitchCount(): number {
      return qa('[data-testid="rb-settings-general"] .v-switch').length;
    },
    get emojiCellCount(): number {
      return qa('[data-testid="rb-emoji"]').length;
    },
    get shapeCellCount(): number {
      return qa('[data-testid="rb-shape"]').length;
    },
    get imageCellCount(): number {
      return qa('[data-testid="rb-image"]').length;
    },
    get alignButtonCount(): number {
      return qa('[data-testid="rb-align-v"] button').length + qa('[data-testid="rb-align-h"] button').length;
    },
    get arrangeButtonCount(): number {
      return qa('[data-testid="rb-arrange"] button').length;
    },
    get headingButtonText(): string {
      return txt(q("#heading-text"));
    },
    get subheadingButtonText(): string {
      return txt(q("#subheading-text"));
    },
    get bodyButtonText(): string {
      return txt(q("#body-text"));
    },

    //
    get residue(): string {
      let ls = -1;
      let ss = -1;
      let ck = -1;
      try {
        ls = window.localStorage.length;
      } catch (e) {
        ls = -2;
      }
      try {
        ss = window.sessionStorage.length;
      } catch (e) {
        ss = -2;
      }
      try {
        ck = document.cookie ? document.cookie.split(";").length : 0;
      } catch (e) {
        ck = -2;
      }
      const globals = Object.keys(window).filter((k) => k.indexOf("__rb") !== 0 && /^(rb|montage|__montage)/i.test(k)).length;
      return (
        "ls=" + ls + "|ss=" + ss + "|ck=" + ck + "|globals=" + globals +
        "|path=" + location.pathname + "|search=" + location.search + "|hash=" + location.hash
      );
    },
    get residuePathname(): string {
      return location.pathname;
    }
  };

  (window as any)[RB_GLOBAL] = Object.freeze(facade);
}
