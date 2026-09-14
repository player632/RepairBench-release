#!/usr/bin/env node
// serve_code-run.mjs - static server for code-run (vue-cli build, publicPath /code-run/).
// Usage: node serve_code-run.mjs --dir <docsDir> --port <port>
// The app is built with publicPath '/code-run/' and uses hash routing, so the
// browser loads http://host:port/code-run/#/... . This server strips the
// /code-run/ prefix and serves the bundle from <dir>; extension-less misses
// fall back to <dir>/index.html (SPA friendly).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
function opt(name, dflt) { const i = args.indexOf(name); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt; }
const dir = path.resolve(opt("--dir", "."));
const port = Number(opt("--port", "9500"));
const spa = !args.includes("--no-spa");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".eot": "application/vnd.ms-font/eot",
  ".map": "application/json", ".txt": "text/plain; charset=utf-8", ".wasm": "application/wasm", ".webmanifest": "application/manifest+json",
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
    if (urlPath.startsWith("/code-run/")) urlPath = urlPath.slice("/code-run".length);
    else if (urlPath === "/code-run") urlPath = "/";
    if (urlPath === "/") urlPath = "/index.html";
    let file = path.normalize(path.join(dir, urlPath));
    if (!file.startsWith(dir)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file) && spa && !path.extname(urlPath)) {
      file = path.join(dir, "index.html");
      if (!fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    }
    if (!fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    const stream = fs.createReadStream(file);
    stream.on("error", () => { try { res.destroy(); } catch {} });
    res.on("error", () => { try { stream.destroy(); } catch {} });
    stream.pipe(res);
  } catch (e) {
    try { res.writeHead(500); res.end(String(e)); } catch {}
  }
});
server.listen(port, "127.0.0.1", () => { /* ready */ });
process.on("uncaughtException", () => {});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
