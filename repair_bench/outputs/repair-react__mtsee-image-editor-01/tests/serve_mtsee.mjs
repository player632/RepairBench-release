// mtsee package-local server: dist static + offline API stubs (AD-2).
// Shapes derived from BasicService (code===0 guard) and its consumers:
//   templates/materials/collects -> {data:[], total}; categories/tree -> []; type-items -> {data:[]}
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const dir = path.resolve(process.argv[process.argv.indexOf("--dir") + 1] || ".");
const port = Number(process.argv[process.argv.indexOf("--port") + 1] || 9585);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
const PAGE = { code: 0, message: "ok", data: { data: [], total: 0, count: 0 } };
const TREE = { code: 0, message: "ok", data: [] };
const TYPE_ITEMS = { code: 0, message: "ok", data: { data: [] } };
function stubFor(u) {
  if (u.startsWith("/api/v1/template/categories/tree")) return TREE;
  if (u.startsWith("/api/v1/common/type-items/page")) return TYPE_ITEMS;
  return PAGE;
}
http.createServer((req, res) => {
  const u = (req.url || "/").split("?")[0];
  if (u.startsWith("/api/")) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(stubFor(u)));
    return;
  }
  const p = u === "/" ? "/index.html" : u;
  const f = path.normalize(path.join(dir, p));
  if (!f.startsWith(dir)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
    res.end(buf);
  });
}).listen(port, "127.0.0.1", () => console.log("mtsee stub server on " + port));
