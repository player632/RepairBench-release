// tests/serve_tree.mjs — repair-svelte__compress-lol-01's own static tree server.
//
// WHY THIS PACKAGE SHIPS ITS OWN SERVER (measured, not assumed)
// ------------------------------------------------------------
// The application is ffmpeg.wasm. src/routes/+page.svelte:141-146 loads the MULTITHREADED core
// (ffmpeg-core.js / ffmpeg-core.wasm / ffmpeg-core.worker.js) and a worker core needs
// SharedArrayBuffer, which the browser only exposes when the document is cross-origin isolated,
// i.e. when every response carries BOTH
//     Cross-Origin-Opener-Policy: same-origin
//     Cross-Origin-Embedder-Policy: require-corp
// The seed knows this: vite.config.ts:24-28 sets exactly that header pair for `vite dev`. The
// shared evaluation/serve_static.mjs sets neither (it only sets Content-Type and Cache-Control),
// so under it `crossOriginIsolated` is false, getOptimalThreadCount() (+page.svelte:71-82) falls
// back to 1 thread and loadFFmpeg()'s catch arm (+page.svelte:150-155) sets
// errorMessage = "Failed to load FFmpeg. Please refresh the page." — the tree never reaches
// isLoaded, so 12 of the graded checkpoints would read an uninitialised page.
// _build/tmp/s13_clol/Z82.json):
//     plain serve_static  -> crossOriginIsolated false, console "Failed to load FFmpeg:", no body
//     this server (COOP/COEP) -> crossOriginIsolated true, console "FFmpeg load completed!",
//                                isLoaded true, full body text, 0 remote requests
// Checkpoints P15/P16/P17 exist precisely to keep this property under observation, so a future
// serve regression cannot pass silently.
//
// Interface parity with evaluation/serve_static.mjs: --dir <root> --port <n> [--no-spa].
// _build/the verifier.mjs:204 spawns a --serve-script with exactly --dir and --port, so those two
// flags are the whole contract; --no-spa is accepted for parity and is not needed here (the app has
// a single route, /, and adapter-static emitted build/index.html plus a fallback of the same file).
// Cross-Origin-Resource-Policy: same-origin is added so that COEP does not reject the package's own
// same-origin .wasm/.js bodies. Nothing else is rewritten: no response body is touched, no request
// is proxied, no application file is modified.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const dir = path.resolve(opt("--dir", "."));
const port = Number(opt("--port", "8080"));
const spa = !args.includes("--no-spa");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm", ".mp4": "video/mp4", ".webm": "video/webm",
};
const ISO = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
};

http.createServer((req, res) => {
  try {
    let u = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
    if (u === "/") u = "/index.html";
    let f = path.normalize(path.join(dir, u));
    if (!f.startsWith(dir)) { res.writeHead(403, ISO); res.end(); return; }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!fs.existsSync(f) && spa && !path.extname(u)) {
      f = path.join(dir, "index.html");
      if (!fs.existsSync(f)) { res.writeHead(404, ISO); res.end("not found"); return; }
    }
    if (!fs.existsSync(f)) { res.writeHead(404, ISO); res.end("not found"); return; }
    const st = fs.statSync(f);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "Content-Length": st.size,
      ...ISO,
    });
    const s = fs.createReadStream(f);
    s.on("error", () => { try { res.destroy(); } catch { /* already gone */ } });
    res.on("error", () => { try { s.destroy(); } catch { /* already gone */ } });
    s.pipe(res);
  } catch (e) { try { res.writeHead(500, ISO); res.end(String(e)); } catch { /* socket gone */ } }
}).listen(port, "127.0.0.1", () => {});

process.on("uncaughtException", () => {});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
