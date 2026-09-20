#!/usr/bin/env node
// serve_overlay.mjs - static server for repair-svelte__svelte-animations-01.
//
// WHY THIS FILE EXISTS (measured, not assumed). The registered outdir for this seed is
// `.svelte-kit/output/prerendered/pages`, and that directory is NOT self-sufficient:
// every prerendered page references its assets relatively (`./_app/...` from index.html,
// `../_app/...` from a one-level route, `../../_app/...` from a two-level route) but the
// `_app` tree it points at is NOT inside pages/ - it lives in the SIBLING
// `.svelte-kit/output/client/_app`. Serving the registered outdir alone therefore answers
// 200 + HTML for every route and 404 for every script/stylesheet, i.e. a white page with
// no hydration: the single largest false-green source on this instance. Evidence:
//   .svelte-kit/output/prerendered/pages/index.html:9   href="./_app/immutable/assets/0.Cvh7ZSnV.css"
//   ls .svelte-kit/output/prerendered/pages             -> no _app entry (183 .html files, 0 __data.json)
//   ls .svelte-kit/output/client                        -> HomePage.png SEOLuxeLogo.png SEO_Logo.png _app favicon.png portfolio_svelte.png startup_sve.png
// (_build/tmp/s8_design/svelteanim/sa_leg_c.json), which is what this script implements.
//
// OVERLAY MAP (two roots, one URL namespace; pages/ wins for HTML, client/ wins for assets):
//   URL /                       -> <pages>/index.html
//   URL /<route>                -> <pages>/<route>.html            (extensionless: trailingSlash "never")
//   URL /<route>/               -> <pages>/<route>/index.html      (tolerated, never emitted by a redirect)
//   URL /<file>                 -> <pages>/<file>                  (exact file inside pages/, if any)
//   URL /_app/**                -> <client>/_app/**                (the sibling asset tree)
//   URL /favicon.png, /rb-inert/**, /*.png -> <client>/**          (static/ is emitted into client/)
// where <pages> = --dir and <client> = path.resolve(<pages>, "../../client").
//
// EXTENSIONLESS ROUTES: `src/routes/*/+page.ts:1 export const prerender = true` plus
// kit.routes trailingSlash "never" makes the builder emit `luxe.html`, `in.html`,
// `a/components/timeline.html` flat, so `/luxe/animated-tabs` must resolve to
// `luxe/animated-tabs.html`. The relative `../_app/...` prefixes in those files are
// computed by SvelteKit for the EXTENSIONLESS url, so this server must answer the
// extensionless url and must never 301 to a trailing slash: `/a/components/timeline`
// + `../../_app/x` resolves to `/_app/x` only when the url has no trailing slash.
//
// NO SPA FALLBACK (deliberate, R18 通则②): an unknown path answers 404 with a body that
// contains no app markup. F12 depends on this - defect D12 caps the exported Learnings id
// list, which feeds BOTH the prerender registry's entries() and the section's own navigation,
// so /learnings/15..19 are never emitted and never linked from a document that was; a fallback
// would wash that missing page into a 200 + HTML and turn a real red into a false green.
//
// Interface is identical to evaluation/serve_static.mjs: --dir <dir> --port <port>
// (extra flags are accepted and ignored, so the verifier.mjs's
//  `node SERVE_SCRIPT --dir <outdir> --port <port>` works unchanged; select it
//  with `--serve-script serve_overlay.mjs`). Node builtins only: 0 dependency, 0 network.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
const DIR = path.resolve(String(opt("--dir", ".")));
const PORT = Number(opt("--port", opt("-p", "12042")));

// <client> is the sibling of <pages>'s grandparent: .../output/prerendered/pages -> .../output/client
const candidateClients = [
  path.resolve(DIR, "../../client"),
  path.resolve(DIR, "../client"),
  path.resolve(DIR, "client"),
];
const CLIENT = candidateClients.find((c) => fs.existsSync(path.join(c, "_app"))) || candidateClients[0];

const TYPE = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".ico": "image/x-icon", ".avif": "image/avif",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".wasm": "application/wasm", ".mp4": "video/mp4", ".webm": "video/webm",
};
const typeOf = (p) => TYPE[path.extname(p).toLowerCase()] || "application/octet-stream";

// Resolve one URL pathname to an absolute file inside one of the two overlay roots,
// or null. Order matters: pages/ first (the prerendered documents are the product),
// then client/ (the assets they reference). Directory traversal is refused by
// re-checking the resolved path against its root.
function resolveIn(root, p) {
  const abs = path.resolve(root, "." + p);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const tries = [abs, abs + ".html", path.join(abs, "index.html")];
  for (const t of tries) {
    try { if (fs.statSync(t).isFile()) { const r = path.relative(root, t); if (!r.startsWith("..")) return t; } } catch { /* next */ }
  }
  return null;
}
function resolve(p) {
  if (p === "/" || p === "") return resolveIn(DIR, "/index.html") || resolveIn(CLIENT, "/index.html");
  return resolveIn(DIR, p) || resolveIn(CLIENT, p);
}

const NOT_FOUND = "<!doctype html><meta charset=\"utf-8\"><title>404</title><p>rb-overlay: no prerendered document and no client asset for this path</p>";
const server = http.createServer((req, res) => {
  let pathname = "/";
  try { pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname); } catch { /* keep "/" */ }
  if (pathname === "/__rb_overlay_health") {
    const body = JSON.stringify({
      ok: true, dir: DIR, client: CLIENT,
      client_app_exists: fs.existsSync(path.join(CLIENT, "_app")),
      pages_index_exists: fs.existsSync(path.join(DIR, "index.html")),
      spa_fallback: false, extensionless: true,
    });
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(req.method === "HEAD" ? undefined : body);
    return;
  }
  const file = resolve(pathname);
  if (!file) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(req.method === "HEAD" ? undefined : NOT_FOUND);
    return;
  }
  let data;
  try { data = fs.readFileSync(file); } catch {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(req.method === "HEAD" ? undefined : NOT_FOUND);
    return;
  }
  res.writeHead(200, {
    "content-type": typeOf(file),
    "content-length": String(data.byteLength),
    "cache-control": "no-store",
  });
  res.end(req.method === "HEAD" ? undefined : data);
});

server.on("clientError", (_err, socket) => { try { socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"); } catch { /* gone */ } });
server.listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`serve_overlay listening on http://127.0.0.1:${PORT} pages=${DIR} client=${CLIENT} spa_fallback=false\n`);
});
const stop = () => { try { server.close(() => process.exit(0)); } catch { process.exit(0); } setTimeout(() => process.exit(0), 800).unref(); };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
