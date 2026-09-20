/**
 * rb-offline.ts - the same-origin request desk for the RepairBench face of
 * omidnikrah/duckparty-frontend. Installed as the FIRST import of src/index.tsx
 * by environment/adaptation.patch, so it runs before src/api/axios-instance.ts
 * calls axios.create(...) and before any component mounts.
 *
 * WHAT IT DOES (four things, all same-origin)
 *  1. axios adapter. axios.defaults.adapter is replaced, and axios v1's
 *     mergeConfig.js:79 lists `adapter: defaultToConfig2`, so every instance
 *     created afterwards (src/api/axios-instance.ts) inherits it. One desk
 *     therefore answers BOTH the orval-generated client (relative paths with a
 *     baseURL of the literal string "undefined", because
 *     `${import.meta.env.VITE_API_URL}` is unset offline) AND the direct
 *     axios.get("https://api.github.com/...") in GithubStarButton.tsx:53.
 *     Data comes from rb-fixtures.ts. Unknown paths are answered 404 AND
 *     recorded, so a missing fixture can never masquerade as a green run.
 *  2. WebSocket shim. src/hooks/useSocket.hook.ts:95-96 does
 *     `new WebSocket(import.meta.env.VITE_WS_URL)` - offline that is
 *     `new WebSocket(undefined)`, i.e. a real connection attempt to
 *     ws://127.0.0.1:<port>/undefined followed by five 1 s reconnects. The shim
 *     opens instantly, never touches the network, and exposes a message bus the
 *     probe can drive, so the app's own socket merge logic stays reachable.
 *  3. egress containment. fetch / XMLHttpRequest.open / navigator.sendBeacon /
 *     window.open are wrapped: same-origin passes through, anything else is
 *     BLOCKED AND COUNTED. The count is the evidence for the offline sentinel;
 *     it is measured at the REQUEST layer, never by counting DOM
 *     link/script/img declarations (that shape is origin-blind and would
 *     falsely match the app's own same-origin loopback assets).
 *  4. index.html de-linking. adaptation.patch drops the three cross-origin
 *     <link> lines (fonts.googleapis.com preconnect x2 + the Modak/Carter One
 *     stylesheet) that render-blocked mounting; the two families fall back to
 *     the generic sans-serif and no checkpoint asserts on font metrics.
 *     src/helpers/analytics.helper.ts is neutered to a no-op by the same patch
 *     (it is gated on import.meta.env.PROD, which every `vite build` sets, so
 *     the umami beacon at umami.apps.omid.to/script.js WOULD be injected).
 *
 * 🔴 THE DESK IS NOT THE SURFACE UNDER TEST. It owns no routing decision the
 * checkpoints grade, no assertion, and no defect: all twelve mutation sites are
 * the app's own modules. The one behavioural policy it enforces - POST /duck and
 * the other write endpoints require a bearer token - mirrors the real backend
 * (src/api/axios-instance.ts:11-16 attaches Authorization from localStorage),
 * and it is what makes the app's own anonymous-bootstrap step observable.
 */

import axios, { AxiosError } from "axios";
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  RB_ANON_TOKEN,
  RB_DELETE_MESSAGE,
  RB_GITHUB_STARS,
  RB_OTP_TOKEN,
  RB_SIGNED_IN_DISPLAY_NAME,
  RB_SIGNED_IN_USER_ID,
  RB_UNAUTHORIZED,
  rbCreatedDuck,
  rbDucks,
  rbGithubRepo,
  rbLeaderboard,
  rbSignedInUser,
  rbUserDucks,
  type RbAppearance,
  type RbDuck,
} from "./rb-fixtures";

// ---------------------------------------------------------------------------
// ledger (published on window.__rbDesk; rb-probe.ts reads it, never writes it)
// ---------------------------------------------------------------------------

interface RbCreateRecord {
  name: string;
  appearance: string;
  imageType: string;
  imageSize: number;
  imageWidth: number;
  imageHeight: number;
  status: number;
}

interface RbDeskState {
  blocked: number;
  blockedUrls: string[];
  unknown: string[];
  log: string[];
  ducks: RbDuck[];
  nextDuckId: number;
  lastCreate: RbCreateRecord | null;
  openedWindows: string[];
  sockets: RbWebSocket[];
  socketMessages: string[];
}

const state: RbDeskState = {
  blocked: 0,
  blockedUrls: [],
  unknown: [],
  log: [],
  ducks: rbDucks(),
  nextDuckId: 7,
  lastCreate: null,
  openedWindows: [],
  sockets: [],
  socketMessages: [],
};

const isSameOrigin = (raw: string): boolean => {
  const value = String(raw ?? "");
  if (!value) return true;
  if (/^(blob:|data:|about:)/i.test(value)) return true;
  if (value.startsWith("/")) return true;
  try {
    return new URL(value, window.location.href).origin === window.location.origin;
  } catch {
    // An unparseable absolute reference cannot be proven same-origin: count it
    // (fail closed) rather than waving it through.
    return false;
  }
};

const block = (kind: string, url: string): void => {
  state.blocked += 1;
  state.blockedUrls.push(`${kind} ${url}`.slice(0, 300));
};

// ---------------------------------------------------------------------------
// 2. WebSocket shim
// ---------------------------------------------------------------------------

type RbSocketListener = (event: { data: string; type: string; target: RbWebSocket }) => void;

class RbWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  url: string;
  readyState: number = RbWebSocket.CONNECTING;
  protocol = "";
  bufferedAmount = 0;
  extensions = "";
  binaryType: "blob" | "arraybuffer" = "blob";
  sent: string[] = [];

  onopen: RbSocketListener | null = null;
  onmessage: RbSocketListener | null = null;
  onclose: ((event: { code: number; reason: string; type: string; target: RbWebSocket }) => void) | null = null;
  onerror: RbSocketListener | null = null;

  constructor(url: string | URL, _protocols?: string | string[]) {
    // Recorded verbatim so the face can prove the app asked for the unset
    // VITE_WS_URL rather than silently swallowing it.
    this.url = String(url);
    state.sockets.push(this);
    setTimeout(() => {
      if (this.readyState !== RbWebSocket.CONNECTING) return;
      this.readyState = RbWebSocket.OPEN;
      this.onopen?.({ data: "", type: "open", target: this });
    }, 0);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    this.sent.push(String(data));
  }

  /** code 1000 keeps src/hooks/useSocket.hook.ts:109-117 out of its retry loop. */
  close(code = 1000, reason = ""): void {
    if (this.readyState === RbWebSocket.CLOSED) return;
    this.readyState = RbWebSocket.CLOSED;
    this.onclose?.({ code, reason, type: "close", target: this });
  }

  addEventListener(type: string, listener: RbSocketListener): void {
    if (type === "open") this.onopen = listener;
    else if (type === "message") this.onmessage = listener;
    else if (type === "error") this.onerror = listener;
  }

  removeEventListener(): void {
    /* the shim holds a single listener slot per type; the app never removes */
  }

  dispatchEvent(): boolean {
    return true;
  }

  /** Test hook: deliver one server frame to this socket. */
  __emit(payload: unknown): void {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    state.socketMessages.push(data);
    this.onmessage?.({ data, type: "message", target: this });
  }
}

// ---------------------------------------------------------------------------
// 3. egress containment
// ---------------------------------------------------------------------------

const installEgressGuards = (): void => {
  const nativeFetch = window.fetch?.bind(window);
  if (nativeFetch) {
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (!isSameOrigin(url)) {
        block("fetch", url);
        return Promise.reject(new TypeError(`rb-offline: blocked cross-origin fetch to ${url}`));
      }
      return nativeFetch(input as RequestInfo, init);
    }) as typeof window.fetch;
  }

  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function patchedOpen(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    const target = String(url);
    if (!isSameOrigin(target)) {
      block("xhr", target);
      throw new Error(`rb-offline: blocked cross-origin XHR to ${target}`);
    }
    return (nativeOpen as unknown as (...args: unknown[]) => void).apply(this, [
      method,
      target,
      ...rest,
    ]);
  } as typeof XMLHttpRequest.prototype.open;

  if (navigator.sendBeacon) {
    const nativeBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = ((url: string | URL, data?: BodyInit | null) => {
      const target = String(url);
      if (!isSameOrigin(target)) {
        block("beacon", target);
        return false;
      }
      return nativeBeacon(target, data);
    }) as typeof navigator.sendBeacon;
  }

  const nativeOpenWindow = window.open?.bind(window);
  window.open = ((url?: string | URL, ...rest: unknown[]) => {
    const target = String(url ?? "");
    state.openedWindows.push(target);
    if (!isSameOrigin(target)) block("window.open", target);
    // Never actually open a tab: the grading browser has no popup affordance
    // and a real popup would escape the checkpoint's own context.
    void nativeOpenWindow;
    void rest;
    return null;
  }) as typeof window.open;
};

// ---------------------------------------------------------------------------
// 1. axios adapter
// ---------------------------------------------------------------------------

const headerValue = (config: InternalAxiosRequestConfig, name: string): string => {
  const headers = config.headers as unknown as Record<string, unknown> | undefined;
  if (!headers) return "";
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === name.toLowerCase()) return String(headers[key] ?? "");
  }
  return "";
};

/**
 * Normalises whatever axios hands the adapter into a route key.
 * `${import.meta.env.VITE_API_URL}` is the literal string "undefined" offline,
 * so the generated client's URLs arrive as "undefined/ducks"; the GitHub call
 * arrives absolute. Both are reduced to a stable "host/path" or "/path" key.
 */
const routeKey = (config: InternalAxiosRequestConfig): string => {
  let raw = String(config.url ?? "");
  const base = config.baseURL == null ? "" : String(config.baseURL);
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && base) {
    raw = `${base.replace(/\/+$/, "")}/${raw.replace(/^\/+/, "")}`;
  }
  raw = raw.replace(/^undefined\/?/, "/");
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      raw = `${parsed.host}${parsed.pathname}`;
    } catch {
      /* keep the raw form so it lands in the unknown ledger */
    }
  }
  return raw.replace(/\/+$/, "") || "/";
};

const decodeImage = async (blob: Blob): Promise<{ width: number; height: number }> => {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  } catch {
    URL.revokeObjectURL(url);
    return { width: 0, height: 0 };
  }
};

interface RbBody {
  json: Record<string, unknown>;
  image: { type: string; size: number; width: number; height: number } | null;
}

const readBody = async (config: InternalAxiosRequestConfig): Promise<RbBody> => {
  const data: unknown = config.data;
  if (data == null) return { json: {}, image: null };
  // src/api/generated/endpoints.ts:340-352 builds POST /duck as multipart
  // FormData (image Blob + name + appearance), so the adapter sees FormData
  // rather than a JSON string. Walk it entry by entry; the Blob is decoded to
  // its natural size so the merged-image pipeline stays observable offline.
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const fields: Record<string, unknown> = {};
    let image: RbBody["image"] = null;
    for (const [key, value] of Array.from(data.entries())) {
      if (typeof Blob !== "undefined" && value instanceof Blob) {
        const dims = await decodeImage(value);
        image = {
          type: value.type,
          size: value.size,
          width: dims.width,
          height: dims.height,
        };
        fields[key] = `[blob ${value.type} ${value.size}B]`;
      } else {
        fields[key] = String(value);
      }
    }
    return { json: fields, image };
  }
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    const dims = await decodeImage(data);
    return {
      json: {},
      image: { type: data.type, size: data.size, width: dims.width, height: dims.height },
    };
  }
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      return {
        json: (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>,
        image: null,
      };
    } catch {
      return { json: {}, image: null };
    }
  }
  if (typeof data === "object") {
    return { json: data as Record<string, unknown>, image: null };
  }
  return { json: {}, image: null };
};

type RbOutcome = { status: number; data: unknown };

const unauthorized = (): RbOutcome => ({ status: 401, data: { error: RB_UNAUTHORIZED } });

const str = (value: unknown): string => (typeof value === "string" ? value : "");
const num = (value: unknown): number => (typeof value === "number" ? value : Number(value) || 0);

const route = async (config: InternalAxiosRequestConfig): Promise<RbOutcome> => {
  const method = String(config.method ?? "get").toUpperCase();
  const path = routeKey(config);
  const authed = /^Bearer\s+\S+/.test(headerValue(config, "Authorization"));
  const body = await readBody(config);

  // --- the one third-party host the seed really calls -----------------------
  if (path === "api.github.com/repos/omidnikrah/duckparty-frontend") {
    return { status: 200, data: rbGithubRepo() };
  }

  // --- any other off-origin host: blocked, counted, never answered ----------
  if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?\//i.test(path)) {
    block("axios", path);
    return { status: 200, data: { stargazers_count: RB_GITHUB_STARS, rbBlocked: true } };
  }

  const segments = path.split("/").filter(Boolean);

  if (method === "GET" && path === "/ducks") {
    return { status: 200, data: state.ducks.map((duck) => ({ ...duck })) };
  }

  if (method === "GET" && path === "/leaderboard") {
    const ranked = rbLeaderboard().map((duck) => {
      const live = state.ducks.find((candidate) => candidate.id === duck.id);
      return live ? { ...live } : duck;
    });
    return { status: 200, data: ranked };
  }

  if (method === "GET" && path === "/user") {
    if (!authed) return unauthorized();
    return { status: 200, data: { user: rbSignedInUser() } };
  }

  if (method === "GET" && segments[0] === "user" && segments[2] === "ducks") {
    const userId = num(segments[1]);
    return { status: 200, data: rbUserDucks(userId, state.ducks).map((duck) => ({ ...duck })) };
  }

  if (method === "POST" && path === "/auth/anonymous") {
    const name = str(body.json.name) || "Anonymous Ducker";
    return {
      status: 200,
      data: {
        token: RB_ANON_TOKEN,
        user: { ...rbSignedInUser(), display_name: name },
      },
    };
  }

  if (method === "POST" && path === "/auth") {
    return { status: 200, data: { message: "OTP sent to your email", email: str(body.json.email) } };
  }

  if (method === "POST" && path === "/auth/verify") {
    const email = str(body.json.email);
    if (!str(body.json.otp)) return { status: 400, data: { error: "Invalid code" } };
    return {
      status: 200,
      data: { token: RB_OTP_TOKEN, user: rbSignedInUser(email || "quackmaster@example.com") },
    };
  }

  if (method === "POST" && path === "/user/set-email") {
    if (!authed) return unauthorized();
    return { status: 200, data: { message: "OTP sent to your email" } };
  }

  if (method === "POST" && path === "/user/verify-set-email") {
    if (!authed) return unauthorized();
    if (!str(body.json.otp)) return { status: 400, data: { error: "Invalid code" } };
    return {
      status: 200,
      data: {
        token: RB_OTP_TOKEN,
        user: rbSignedInUser(str(body.json.email) || "quackmaster@example.com"),
      },
    };
  }

  if (method === "PUT" && path === "/user/change-name") {
    if (!authed) return unauthorized();
    return { status: 200, data: { message: "Name updated", display_name: str(body.json.name) } };
  }

  if (method === "POST" && path === "/duck") {
    // Bearer required - this is the desk's only policy, and it mirrors the real
    // backend: src/api/axios-instance.ts:11-16 attaches the token from
    // localStorage, and src/components/CreateDuckFormSection/CreateDuckFormSection.tsx:111-113
    // bootstraps an anonymous identity first when the visitor has none.
    const record: RbCreateRecord = {
      name: str(body.json.name),
      appearance: str(body.json.appearance),
      imageType: body.image?.type ?? "",
      imageSize: body.image?.size ?? 0,
      imageWidth: body.image?.width ?? 0,
      imageHeight: body.image?.height ?? 0,
      status: authed ? 201 : 401,
    };
    state.lastCreate = record;
    if (!authed) return unauthorized();
    let appearance: RbAppearance = {};
    try {
      const parsed: unknown = JSON.parse(str(body.json.appearance) || "{}");
      if (parsed && typeof parsed === "object") appearance = parsed as RbAppearance;
    } catch {
      appearance = {};
    }
    const created = rbCreatedDuck(state.nextDuckId, record.name || "Nameless Duck", appearance);
    state.nextDuckId += 1;
    state.ducks = [created, ...state.ducks];
    return { status: 201, data: { ...created } };
  }

  if (method === "PUT" && segments[0] === "duck" && segments[2] === "reaction") {
    if (!authed) return unauthorized();
    const duckId = num(segments[1]);
    const reaction = str(segments[3]);
    const target = state.ducks.find((duck) => duck.id === duckId);
    if (!target) return { status: 404, data: { error: "Duck not found" } };
    if (reaction === "like") target.likes_count += 1;
    else if (reaction === "dislike") target.dislikes_count += 1;
    else return { status: 400, data: { error: "Unknown reaction" } };
    return {
      status: 200,
      data: {
        duck: { ...target },
        duck_id: duckId,
        reaction,
        user_id: RB_SIGNED_IN_USER_ID,
        created_at: new Date().toISOString(),
        user: { id: RB_SIGNED_IN_USER_ID, display_name: RB_SIGNED_IN_DISPLAY_NAME },
      },
    };
  }

  if (method === "DELETE" && segments[0] === "duck" && segments.length === 2) {
    if (!authed) return unauthorized();
    const duckId = num(segments[1]);
    const before = state.ducks.length;
    state.ducks = state.ducks.filter((duck) => duck.id !== duckId);
    if (state.ducks.length === before) return { status: 404, data: { error: "Duck not found" } };
    return { status: 200, data: { message: RB_DELETE_MESSAGE } };
  }

  if (method === "GET" && path === "/ws") {
    return { status: 200, data: { url: "offline-desk", note: "the desk serves the socket in-process" } };
  }

  state.unknown.push(`${method} ${path}`);
  return { status: 404, data: { error: `rb-offline: no fixture for ${method} ${path}` } };
};

const rbAdapter: AxiosAdapter = async (config) => {
  const method = String(config.method ?? "get").toUpperCase();
  const path = routeKey(config);
  const started = Date.now();
  let outcome: RbOutcome;
  try {
    outcome = await route(config);
  } catch (error) {
    outcome = {
      status: 500,
      data: { error: `rb-offline desk threw: ${String((error as Error)?.message ?? error)}` },
    };
  }
  state.log.push(`${method} ${path} -> ${outcome.status} (${Date.now() - started}ms)`);

  const response: AxiosResponse = {
    data: outcome.data,
    status: outcome.status,
    statusText: outcome.status === 200 ? "OK" : outcome.status === 201 ? "Created" : "Error",
    headers: { "content-type": "application/json" },
    config,
    request: { rbOfflineDesk: true },
  };

  if (outcome.status >= 400) {
    throw new AxiosError(
      `Request failed with status code ${outcome.status}`,
      String(outcome.status),
      config,
      response.request,
      response,
    );
  }
  return response;
};

// ---------------------------------------------------------------------------
// install
// ---------------------------------------------------------------------------

const install = (): void => {
  const win = window as unknown as Record<string, unknown>;

  installEgressGuards();

  axios.defaults.adapter = rbAdapter;
  win.WebSocket = RbWebSocket;
  win.__rbDesk = {
    version: "rb-offline/1",
    blockedCount: () => state.blocked,
    blockedUrls: () => state.blockedUrls.join(" | "),
    unknownPaths: () => state.unknown.join(" | "),
    apiLog: () => state.log.join(" | "),
    duckCount: () => state.ducks.length,
    duckNames: () => state.ducks.map((duck) => duck.name).join(","),
    lastCreate: () => state.lastCreate,
    openedWindows: () => state.openedWindows.join(" | "),
    socketCount: () => state.sockets.length,
    socketUrls: () => state.sockets.map((socket) => socket.url).join(" | "),
    socketMessages: () => state.socketMessages.join(" | "),
    emitSocket: (payload: unknown) => {
      const open = state.sockets.filter((socket) => socket.readyState === RbWebSocket.OPEN);
      for (const socket of open) socket.__emit(payload);
      return open.length;
    },
  };
};

install();
