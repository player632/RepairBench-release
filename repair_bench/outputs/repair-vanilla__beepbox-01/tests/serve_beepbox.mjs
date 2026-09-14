#!/usr/bin/env node
// Static server for repair-vanilla__beepbox-01.
// Serves the self-contained offline build (website/beepbox_offline.html) at "/",
// plus any other static file under --dir. Interface-compatible with
// evaluation/serve_static.mjs (--dir / --port).
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
function argOf(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}
const dir = path.resolve(argOf("--dir", "."));
const port = parseInt(argOf("--port", "8800"), 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let filePath = path.normalize(path.join(dir, urlPath));
    if (!filePath.startsWith(dir)) { res.writeHead(403); res.end("forbidden"); return; }
    let st = null;
    try { st = await stat(filePath); } catch { /* fallthrough */ }
    if (st == null || st.isDirectory()) {
      // The app is a single self-contained document: serve it at "/" and any
      // directory-ish path so history/hash navigation always lands on the editor.
      filePath = path.join(dir, "beepbox_offline.html");
      try { st = await stat(filePath); } catch { res.writeHead(404); res.end("beepbox_offline.html missing (run npm run build first)"); return; }
    }
    const body = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME[ext] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
});
server.listen(port, "127.0.0.1", () => {
  console.log(`serve_beepbox: ${dir} on http://127.0.0.1:${port}/`);
});
