// tests/serve_routes.mjs — repair-svelte__gesvelte-01's own static tree server (the fourth recipe key).
//
// WHY THIS PACKAGE SHIPS ITS OWN SERVER (measured on this instance, not assumed)
// ------------------------------------------------------------------------------
// The app is SvelteKit 1.5.2 + @sveltejs/adapter-static 2.0.3 with `kit.prerender` at its defaults
// (entries ['*'], crawl true) and no `kit.paths`. Its own resolved prerenderer
// (src/core/postbuild/prerender.js:136-140 output_filename(), read out of the pinned dependency tree)
// writes ONE FLAT FILE per single-segment route: '/', '/stage', '/docs', '/about' become
// build/index.html, build/stage.html, build/docs.html, build/about.html. It never writes
// build/stage/index.html, so a static server that only maps a path to a same-named file or to a
// directory's index.html cannot answer GET /stage from that outdir.
//
// The shared evaluation/serve_static.mjs is exactly such a server, and its SPA fallback is ON unless
// the caller passes --no-spa:
//     serve_static.mjs:14   const spa = !args.includes("--no-spa");
//     serve_static.mjs:33   if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = .../index.html
//     serve_static.mjs:34-37 if (!fs.existsSync(file) && spa && !path.extname(urlPath)) file = <root>/index.html
// GET /stage therefore misses (no file named "stage"), has no extension, and is answered with
// build/index.html — the HOME document — at a URL whose pathname claims to be /stage. HTTP 200, no
// error anywhere, and every route-specific checkpoint reads the wrong document.
//
// That is not a hypothesis; it is what the heavy lane measured on this instance
// (_build/tmp/s1_rehearse/LANE_RESULT_repair-svelte__gesvelte-01.json, ended 2026-09-18T21:24:36Z):
// recipe_serve = null (so _build/the verifier.mjs:204 spawned the default server, and :204 passes only
// --dir/--port, i.e. SPA fallback ON), G-install/G-build ok, G1-baseline red on 24 of 31 checkpoints
// G1_RED_FULLY_ATTRIBUTED__LANE_DEFAULT_SERVE_ROUTE_SHAPE__24_OF_24: all 24 reds carry at least one
// token that is present in the route's own flat HTML and absent from index.html
// ("Customize a New Form", "Enter Username", .main-heading, .gesvelte-form-panel, ...), and all 7
// greens are either home-consistent (shared header nav, footer, window.__rb censuses, window.__rb.path
// which reports the ADDRESS BAR pathname /stage no matter which document was served) or vacuous
// (every expected value "0"/""). The same false-red generator is on record for a delivered neighbour:
// svelte-animations, 26 reds across all three states, fixed by its own tests/serve_overlay.mjs.
//
// WHAT THIS SERVER CHANGES, AND WHAT IT DELIBERATELY DOES NOT
// -----------------------------------------------------------
// One rule is added, ahead of any fallback: an extension-less request is probed as <name>.html and
// then as <name>/index.html, so /stage answers with build/stage.html — the real prerendered route
// document, byte-for-byte the file the build emitted. Nothing is rewritten: no response body is
// touched, no header beyond Content-Type/Cache-Control/Content-Length is invented, no request is
// proxied, no application file is modified, and the outdir is never written to.
// There is NO SPA fallback here, by design and in both directions: every route this task reads has its
// own real prerendered HTML, so a fallback could only ever mask a routing break by serving the home
// document under another route's pathname — the exact failure this file exists to close. A miss is a
// loud 404 whose body names the route shape, and tests/run.sh additionally fail-closes on each route
// before any checkpoint runs. A trailing-slash request (/stage/) is 404'd rather than answered, because
// the emitted HTML references its bundles relatively ('./_app/...') and would resolve them against
// /stage/ into a white page; tests/dsl.json only ever navigates to /stage, /docs, /about and /.
//
// Interface parity with evaluation/serve_static.mjs: --dir <root> --port <n> [--no-spa].
// _build/the verifier.mjs:204 spawns a --serve-script with exactly --dir and --port, so those two flags
// are the whole contract; --no-spa is accepted and is a no-op here (this server never falls back).
// the identical geometry from identical bytes.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const dir = path.resolve(opt("--dir", "."));
const port = Number(opt("--port", "8080"));
// Accepted for interface parity with evaluation/serve_static.mjs. This server has no SPA fallback to
// turn off: a miss is always a 404, so the flag cannot change a single response.
const NO_SPA = args.includes("--no-spa");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json", ".txt": "text/plain; charset=utf-8", ".wasm": "application/wasm", ".mp3": "audio/mpeg",
  ".wav": "audio/wav", ".ogg": "audio/ogg", ".mp4": "video/mp4", ".webm": "video/webm", ".xml": "application/xml",
};

const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };
const isDir = (f) => { try { return fs.statSync(f).isDirectory(); } catch { return false; } };

// Route-shape resolution for ONE already-normalized, in-root absolute path.
// Order: the path itself -> <path>/index.html -> <path>.html. Returns null when nothing answers.
function resolveFile(abs, urlPath) {
  if (isFile(abs)) return { file: abs, rule: "exact" };
  if (isDir(abs)) {
    const idx = path.join(abs, "index.html");
    if (isFile(idx)) return { file: idx, rule: "dir-index" };
  }
  if (!path.extname(urlPath)) {
    const flat = abs + ".html";
    if (isFile(flat)) return { file: flat, rule: "flat-html-route" };
  }
  return null;
}

http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
    if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
    // A trailing slash on a route is refused loudly rather than answered with a document whose relative
    // './_app/...' bundle URLs would resolve against the wrong base (see the header note).
    if (urlPath.length > 1 && urlPath.endsWith("/")) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("route-shape: " + urlPath + " is not addressable with a trailing slash; this tree's prerendered routes are /stage, /docs, /about, / (no SPA fallback by design)");
      return;
    }
    const abs = path.normalize(path.join(dir, urlPath));
    if (abs !== dir && !abs.startsWith(dir + path.sep)) { res.writeHead(403, { "Cache-Control": "no-store" }); res.end(); return; }
    const hit = resolveFile(abs, urlPath);
    if (!hit) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("not found (no SPA fallback): " + urlPath + " — expected one of the build's prerendered routes or a real asset under " + path.basename(dir) + "/");
      return;
    }
    const st = fs.statSync(hit.file);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(hit.file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "Content-Length": st.size,
    });
    const stream = fs.createReadStream(hit.file);
    // Browser reloads/navigations abort in-flight requests; an unhandled stream/res error would crash
    // the whole server mid-verification (same guard the shared server carries).
    stream.on("error", () => { try { res.destroy(); } catch { /* socket already gone */ } });
    res.on("error", () => { try { stream.destroy(); } catch { /* socket already gone */ } });
    stream.pipe(res);
  } catch (e) {
    try { res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }); res.end(String(e)); } catch { /* socket already gone */ }
  }
}).listen(port, "127.0.0.1", () => {
  if (process.env.SERVE_ROUTES_VERBOSE === "1") {
    // Only used by the packaging run's own attribution legs; the lane spawns with stdio ignored.
    console.log(JSON.stringify({ schema: "serve_routes/ready/v1", dir, port, no_spa_accepted: NO_SPA, spa_fallback: false }));
  }
});

process.on("uncaughtException", () => {});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
