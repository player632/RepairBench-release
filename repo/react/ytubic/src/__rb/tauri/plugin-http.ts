import { rbNote, rbProbe } from "../probe";
import {
  RB_ACCOUNT_SWITCHER,
  RB_ITUNES,
  RB_LYRICS_EMPTY,
  rbRoute,
} from "../fixtures";

/**
 * The offline transport. Upstream every byte of catalogue data flows through
 * this one export (`fetch as tauriFetch`), and `innertubePost` in
 * `src/lib/innertube/shared.ts` is the single chokepoint all of
 * `rawBrowse` / `rawSearch` / `rawNext` / the continuation helpers bottom
 * out in. Answering here means the whole data layer is served from the
 * in-tree corpus with zero runtime network, which is what
 * `task.toml`'s `allow_internet = false` requires.
 *
 * A REAL `Response` is returned (not a lookalike object) because
 * `captureSetCookies()` calls `res.headers.getSetCookie()` and
 * `innertubePost` calls `res.json()` / `res.ok` / `res.text()`.
 */
function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function urlOf(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function bodyOf(init?: RequestInit): Record<string, unknown> {
  const raw = init && typeof init.body === "string" ? init.body : null;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const LYRICS_HOSTS = [
  "lrclib.net",
  "genius.com",
  "apic-desktop.musixmatch.com",
];

export async function fetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const probe = rbProbe();
  const raw = urlOf(input);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    rbNote(probe.hosts, "unparseable");
    return jsonResponse({});
  }
  rbNote(probe.hosts, url.hostname);

  if (url.hostname === "music.youtube.com") {
    if (url.pathname === "/getAccountSwitcherEndpoint") {
      return jsonResponse(RB_ACCOUNT_SWITCHER);
    }
    const inner = url.pathname.match(/^\/youtubei\/v1\/([^/]+)/);
    if (inner) {
      // `endpoint` may carry its own query (`browse?ctoken=...`), exactly as
      // `innertubePost` builds it, so hand the search string along too.
      return jsonResponse(rbRoute(inner[1] + url.search, bodyOf(init)));
    }
    return jsonResponse(RB_LYRICS_EMPTY);
  }

  if (url.hostname === "itunes.apple.com") return jsonResponse(RB_ITUNES);
  if (LYRICS_HOSTS.includes(url.hostname)) return jsonResponse(RB_LYRICS_EMPTY);

  // Any host the pristine face could reach that is not modelled above answers
  // with an empty object rather than a rejection, so an unmodelled call site
  // degrades to "no data" instead of an infrastructure red.
  return jsonResponse({});
}

// Upstream `@tauri-apps/plugin-http` re-exports the three fetch globals next to `fetch`, so this shim keeps
// that surface. It cannot be written as `export { Response, Request, Headers }`: those are AMBIENT globals,
// and TS2661 ("Cannot export 'Response'. Only local declarations can be exported from a module") rejects the
// re-export - which matters here because `package.json` builds with `vite build && tsc --noEmit`, so a type
// error fails the whole build key even though dist/ is already on disk. Each name is therefore bound to a
// local first and exported under the upstream name. Measured with tsc 5.8.3 over the adapted tree: this
// spelling is 0 errors, while `export { ... }` and `export type { ... }` are 3 errors each (TS2661) and
// exporting the same name in both the value and the type space is 6 errors (TS2300 duplicate identifier).
// Value space is what upstream provides and what an importer can construct or `instanceof`; the identical
// type is available to any consumer from the DOM lib global, and no site in the adapted tree imports these
// three names at all (all four plugin-http import sites take `fetch as tauriFetch` only - measured).
const RbResponseCtor = globalThis.Response;
const RbRequestCtor = globalThis.Request;
const RbHeadersCtor = globalThis.Headers;

export { RbResponseCtor as Response, RbRequestCtor as Request, RbHeadersCtor as Headers };
