#!/usr/bin/env node
// serve_tree.mjs - static tree server for repair-svelte__magidoc-01.
// Usage: node tests/serve_tree.mjs --dir <root> --port <port> [--spa]
//
// WHY THIS EXISTS (package-local; evaluation/serve_static.mjs is a shared criterion tool and is NOT
// modified by the packaging run). The seed builds with @sveltejs/adapter-static and
// packages/starters/carbon-multi-page/svelte.config.js:12-14 sets only `adapter({ strict: false })` and
// `paths.base`, so `kit.paths.trailingSlash` stays at the Kit default "never": route
// /introduction/welcome is emitted as the FLAT file introduction/welcome.html (MEASURED on the packaging run's
// own build: 41 *.html documents, exactly one index.html, and 0 `<route>/index.html` pairs). A plain
// static server does not resolve an extension-less request to its flat .html sibling, and
// evaluation/serve_static.mjs:31-34 only maps a request path to <path>/index.html when that path is an
// existing DIRECTORY, then falls back to the ROOT index.html for any extension-less miss. Here the root
// index.html is a 120-byte redirect document
// (`<script>location.href="/introduction/welcome";</script><meta http-equiv="refresh" ...>`), so that
// fallback would answer every deep link with a redirect back to itself - an infinite navigation loop
// that reads as a timeout, i.e. the hardest red to triage. the verifier.mjs:33-35 supports exactly this
// case: `--serve-script` names a package-local server that must accept the same --dir/--port interface,
// and the verifier.mjs:220 spawns it with precisely those two flags, so the resolution rule has to live
// in the script and not in the caller. This file adds that one platform rule and nothing else: identical
// MIME table, identical Cache-Control, identical 127.0.0.1 bind, identical traversal guard and identical
// stream/respawn hardening as evaluation/serve_static.mjs.
//
// RESOLUTION ORDER for a request path p (first hit wins):
//   1. <root>/p                 exact file
//   2. <root>/p/index.html      p is an existing directory (serve_static.mjs parity)
//   3. <root>/p.html            adapter-static flat-sibling rule (the reason this file exists)
//   4. <root>/index.html        only for p === "/" (rule 1 already covers it; kept explicit)
//   5. 404                      fail closed
// and the root document is a redirect, so a fallback could only ever wash a mis-resolved goto into a
// 200 + the WRONG document (or a redirect loop). A missing page must read as a 404.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
function opt(name, dflt) { const i = args.indexOf(name); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt; }
const dir = path.resolve(opt("--dir", "."));
const port = Number(opt("--port", "8080"));
const spa = args.includes("--spa");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json", ".txt": "text/plain; charset=utf-8", ".wasm": "application/wasm", ".mp3": "audio/mpeg",
  ".wav": "audio/wav", ".ogg": "audio/ogg", ".mp4": "video/mp4", ".webm": "video/webm", ".xml": "application/xml",
};

const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch (e) { return false; } };
const isDir = (f) => { try { return fs.statSync(f).isDirectory(); } catch (e) { return false; } };

// The resolution order as a pure function, exported so the packaging run's self-test can assert it without
// opening a socket. The server below is the only consumer at run time.
export function resolveTreeFile(root, urlPath) {
  const base = path.resolve(root);
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  let file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base)) return { file: null, reason: "traversal", status: 403 };
  if (isFile(file)) return { file, reason: "exact" };
  if (isDir(file)) {
    const idx = path.join(file, "index.html");
    if (isFile(idx)) return { file: idx, reason: "dir-index" };
  }
  if (!path.extname(rel)) {
    const flat = file + ".html";
    if (isFile(flat)) return { file: flat, reason: "flat-html-sibling" };
    const dirIdx = path.join(file, "index.html");
    if (isFile(dirIdx)) return { file: dirIdx, reason: "dir-index-after-miss" };
    if (spa) {
      const root_idx = path.join(base, "index.html");
      if (isFile(root_idx)) return { file: root_idx, reason: "spa-fallback" };
    }
  }
  return { file: null, reason: "miss", status: 404 };
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
    const r = resolveTreeFile(dir, urlPath);
    if (!r.file) { res.writeHead(r.status || 404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }); res.end("not found"); return; }
    const ext = path.extname(r.file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Tree-Resolution": r.reason,
    });
    const stream = fs.createReadStream(r.file);
    // Browser reloads/navigations abort in-flight requests; an unhandled stream/res error would crash
    // the whole server mid-verification (same hardening as evaluation/serve_static.mjs).
    stream.on("error", () => { try { res.destroy(); } catch {} });
    res.on("error", () => { try { stream.destroy(); } catch {} });
    stream.pipe(res);
  } catch (e) {
    try { res.writeHead(500); res.end(String(e)); } catch {}
  }
});
// Listening is guarded so `import` (the self-test path) has no side effect; the verifier.mjs:220 and
// tests/run.sh both spawn this file directly, which is the path that binds the port.
const invokedDirectly = (() => {
  try { return !!process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)); }
  catch (e) { return false; }
})();
if (invokedDirectly) {
  server.listen(port, "127.0.0.1", () => { /* ready */ });
  process.on("uncaughtException", () => {});
  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
}
