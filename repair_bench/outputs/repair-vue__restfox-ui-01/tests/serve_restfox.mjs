#!/usr/bin/env node
// serve-echo.mjs - static server + deterministic /proxy echo for Restfox web-standalone.
// Usage: node serve-echo.mjs --dir <dist> --port <port>
// POST /proxy honors the x-proxy-* protocol of packages/web-standalone:
// instead of forwarding upstream (offline!), it answers deterministically.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
function opt(name, dflt) { const i = args.indexOf(name); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt; }
const dir = path.resolve(opt("--dir", "."));
const port = Number(opt("--port", "9260"));

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".eot": "application/vnd-font/eot",
  ".map": "application/json", ".txt": "text/plain; charset=utf-8", ".wasm": "application/wasm",
};

const STATUS_TEXT = { 200: "OK", 201: "Created", 204: "No Content", 301: "Moved Permanently", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 418: "I'm a teapot", 500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable" };

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", () => resolve(Buffer.concat(chunks)));
  });
}

const server = http.createServer(async (req, res) => {
  try {
    // ---- deterministic proxy (web-standalone protocol) ----
    if (req.url === "/proxy" && req.method === "POST") {
      const rawBody = await readBody(req);
      const targetUrl = req.headers["x-proxy-req-url"] || "";
      const method = (req.headers["x-proxy-req-method"] || "GET").toUpperCase();
      const headers = {};
      Object.keys(req.headers).forEach((h) => {
        if (h.startsWith("x-proxy-req-header-")) headers[h.slice("x-proxy-req-header-".length)] = req.headers[h];
      });
      let parsed = { pathname: "/", search: "" };
      try { const u = new URL(targetUrl); parsed = { pathname: u.pathname, search: u.search }; } catch (e) { /* keep defaults */ }
      let status = 200;
      const m = parsed.pathname.match(/^\/status\/(\d{3})$/);
      if (m) status = Number(m[1]);
      const statusText = STATUS_TEXT[status] || "";
      const echo = {
        echo: true,
        method,
        url: targetUrl,
        path: parsed.pathname,
        query: parsed.search,
        headers,
        body: rawBody.toString("utf8"),
      };
      const bodyBuf = Buffer.from(JSON.stringify(echo), "utf8");
      // fixed timing values keep timeline/size displays deterministic
      const eventData = {
        status,
        statusText,
        headers: [
          ["content-type", "application/json"],
          ["x-echo-server", "restfox-bench"],
          ["x-request-method", method],
        ],
        mimeType: "application/json",
        buffer: Array.from(bodyBuf),
        timeTaken: 123,
        headTimeTaken: 100,
        bodyTimeTaken: 23,
      };
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ event: "response", eventData }));
      return;
    }

    // ---- static files with SPA fallback ----
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    let file = path.normalize(path.join(dir, urlPath));
    if (!file.startsWith(dir)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file) && !path.extname(urlPath)) file = path.join(dir, "index.html");
    if (!fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
    const stream = fs.createReadStream(file);
    stream.on("error", () => { try { res.destroy(); } catch {} });
    res.on("error", () => { try { stream.destroy(); } catch {} });
    stream.pipe(res);
  } catch (e) {
    try { res.writeHead(500); res.end(String(e)); } catch {}
  }
});
server.listen(port, "127.0.0.1", () => console.log("ready " + port));
process.on("uncaughtException", () => {});
