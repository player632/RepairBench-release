#!/usr/bin/env node
// Static server for repair-vanilla__vditor-01.
// The verifier passes --dir <outdir> (i.e. dist), but vditor's
// harness index.html lives at the workspace ROOT and loads /dist/index.js,
// /dist/index.css and /dist/js/i18n/en_US.js -- so serve the parent of --dir.
// Interface-compatible with evaluation/serve_static.mjs (--dir / --port).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
function opt(name, dflt) { const i = args.indexOf(name); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt; }
let dir = path.resolve(opt("--dir", "."));
if (path.basename(dir) === "dist") dir = path.dirname(dir);
const port = Number(opt("--port", "8080"));

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json", ".txt": "text/plain; charset=utf-8", ".wasm": "application/wasm", ".mp3": "audio/mpeg",
  ".wav": "audio/wav", ".ogg": "audio/ogg", ".mp4": "video/mp4", ".webm": "video/webm", ".xml": "application/xml",
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const file = path.normalize(path.join(dir, urlPath));
    if (!file.startsWith(dir)) { res.writeHead(403); res.end(); return; }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
  } catch (e) { res.writeHead(500); res.end(); }
});
server.listen(port, "127.0.0.1", () => console.log(`vditor root server on ${port}: ${dir}`));
