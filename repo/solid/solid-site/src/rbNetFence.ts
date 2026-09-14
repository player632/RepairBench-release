// rbNetFence.ts - repair-bench adaptation (environment/adaptation.patch). NOT application code.
//
// Ruling G3: a runtime-fetched external resource is neutralised or vendored, and this face must be
// self-sufficient at runtime with zero network egress. Three sites in this seed reach the public
// internet while the app runs, and one of them (a storefront client) is built by a third-party
// library, so it cannot be repointed by editing a URL literal:
//   1. src/pages/Store.data.ts builds a storefront client that issues GraphQL requests to a hosted
//      shop domain as soon as the shop route is loaded;
//   2. src/components/Newsletter.tsx posts the address a visitor typed at a hosted list endpoint;
//   3. src/routes.ts sends the whole page to an external host for one legacy shortcut route.
// Site 3 is repointed by editing the route table. Sites 1 and 2 go through globalThis.fetch, and
// images that a library or a template assigns through the src property go through
// HTMLImageElement.prototype.src, so this module installs a same-origin fence over exactly those
// three request channels BEFORE the application renders.
//
// The fence is a redirect, not a block: every request still happens, still returns a Response and
// still resolves the caller's promise, so no application code path is shortened and no error
// branch is provoked that would not otherwise run. Only the DESTINATION changes, and only for a
// URL that is cross-origin. Same-origin URLs, data: URLs and blob: URLs pass through untouched.
// Statically templated <img src="https://..."> literals are compiled into a template string and
// never touch a patched channel, so those are repointed in the markup itself; this fence is the
// belt-and-braces layer for everything assigned at runtime.
//
// Every redirect is recorded on window.__RB_NET__ so the adaptation is auditable from the page.

type Record_ = { channel: string; from: string; to: string; at: number };

const INERT_DOC = "/rb-inert-page.html";
const INERT_JSON = "/rb-inert-endpoint.json";
const INERT_IMG = "/rb-inert-avatar.svg";

const ledger: Record_[] = [];

const publish = () => {
  (window as any).__RB_NET__ = {
    blocked: ledger.length,
    entries: ledger.slice(0, 50),
    inert: { doc: INERT_DOC, json: INERT_JSON, img: INERT_IMG },
  };
};

const isInert = (u: string) => u.indexOf("/rb-inert-") !== -1;

/** true only for an absolute http(s) URL that points at a different origin than this page */
const crossOrigin = (raw: unknown): string | null => {
  if (typeof raw !== "string" || raw === "") return null;
  if (isInert(raw)) return null;
  let u: URL;
  try {
    u = new URL(raw, window.location.href);
  } catch (e) {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.origin === window.location.origin) return null;
  return u.href;
};

const note = (channel: string, from: string, to: string) => {
  ledger.push({ channel, from, to, at: Date.now() });
  publish();
};

export const installNetFence = () => {
  publish();

  // ---- channel 1: fetch ----
  const realFetch = window.fetch.bind(window);
  (window as any).fetch = (input: any, init?: any) => {
    const raw = typeof input === "string" ? input : input && input.url ? String(input.url) : null;
    const cross = crossOrigin(raw);
    if (cross) {
      note("fetch", cross, INERT_JSON);
      return realFetch(INERT_JSON, init);
    }
    return realFetch(input, init);
  };

  // ---- channel 2: XMLHttpRequest ----
  const realOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method: string, url: any, ...rest: any[]) {
    const cross = crossOrigin(url);
    if (cross) {
      note("xhr", cross, INERT_JSON);
      return (realOpen as any).call(this, method, INERT_JSON, ...rest);
    }
    return (realOpen as any).call(this, method, url, ...rest);
  } as any;

  // ---- channel 3: WebSocket (nothing in this seed opens one; fenced so the face stays closed) ----
  const RealSocket = window.WebSocket;
  const FencedSocket: any = function (url: any, protocols?: any) {
    const cross = crossOrigin(url);
    if (cross) {
      note("websocket", cross, INERT_DOC);
      throw new Error("repair-bench adaptation: a cross-origin socket is not opened on this face");
    }
    return protocols === undefined ? new RealSocket(url) : new RealSocket(url, protocols);
  };
  FencedSocket.prototype = RealSocket.prototype;
  FencedSocket.CONNECTING = RealSocket.CONNECTING;
  FencedSocket.OPEN = RealSocket.OPEN;
  FencedSocket.CLOSING = RealSocket.CLOSING;
  FencedSocket.CLOSED = RealSocket.CLOSED;
  (window as any).WebSocket = FencedSocket;

  // ---- channel 4: an image address assigned at runtime (property or attribute) ----
  const localizeImage = (raw: any) => {
    const cross = crossOrigin(raw);
    if (!cross) return raw;
    let u: URL;
    try {
      u = new URL(cross);
    } catch (e) {
      return INERT_IMG;
    }
    note("img", cross, INERT_IMG);
    return `${INERT_IMG}?h=${encodeURIComponent(u.host)}&p=${encodeURIComponent(u.pathname)}`;
  };
  const imgDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if (imgDesc && imgDesc.set && imgDesc.get) {
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      enumerable: imgDesc.enumerable,
      get: imgDesc.get,
      set(value: any) {
        (imgDesc.set as any).call(this, localizeImage(value));
      },
    });
  }
  const MEDIA = { IMG: 1, SCRIPT: 1, IFRAME: 1, SOURCE: 1, EMBED: 1, VIDEO: 1, AUDIO: 1, IMAGE: 1 };
  const realSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name: string, value: string) {
    if (name === "src" && MEDIA[(this.tagName || "").toUpperCase()]) {
      return realSetAttribute.call(this, name, localizeImage(value) as string);
    }
    return realSetAttribute.call(this, name, value);
  };

  return true;
};

export default installNetFence;
