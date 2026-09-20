#!/bin/bash
# RepairBench verifier for repair-vanilla__mogul-christmas-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vanilla/mogul-christmas})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -u

_SELF="$(dirname "$0")"
_SELF="$(cd "${_SELF}" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
if [ -z "${PIPELINE_ROOT:-}" ]; then
  PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
fi
if [ ! -f "${PIPELINE_ROOT}/evaluation/dsl_runner.mjs" ]; then
  _w="${PKG_DIR}"
  while [ "${_w}" != "/" ]; do
    if [ -f "${_w}/evaluation/dsl_runner.mjs" ]; then PIPELINE_ROOT="${_w}"; break; fi
    _w="$(dirname "${_w}")"
  done
fi
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vanilla/mogul-christmas}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="."
PORT="${WLB_PORT:-12441}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verr() { echo "VERIFIER_ERROR: $1" >&2; echo 2 > "${LOGS_DIR}/exit-code.txt"; exit 2; }

if curl -s -o /dev/null -m 2 "http://127.0.0.1:${PORT}/"; then
  verr "port ${PORT} is ALREADY answering before this script served anything - refusing to grade a foreign or stale tree (this instance's pre-allocated delivery port is 12441, mirror 12941; a lane may override it with WLB_PORT)"
fi

if [ ! -d "${SRC_DIR}" ]; then
  verr "source tree ${SRC_DIR} does not exist (pass it as \$1 or set WLB_APP_SRC; the read-only support directory _build/gates/mogul-christmas is a read-only design reference and is never used as the answering tree)"
fi

{
  echo "install key: 'true' (the manifest's own value; there is no manifest and no dependency directory)"
  echo "manifest present: $(ls "${SRC_DIR}"/package.json 2>/dev/null | wc -l | tr -d ' ') (expected 0)"
  echo "dependency directory present: $(ls -d "${SRC_DIR}"/node_modules 2>/dev/null | wc -l | tr -d ' ') (expected 0)"
  echo "served tree file count: $(find "${SRC_DIR}" -type f -not -path '*/.git/*' 2>/dev/null | wc -l | tr -d ' ')"
  echo "html documents: $(find "${SRC_DIR}" -type f -name '*.html' -not -path '*/.git/*' 2>/dev/null | wc -l | tr -d ' ')"
  echo "files under vendor/: $(find "${SRC_DIR}/vendor" -maxdepth 1 -type f 2>/dev/null | wc -l | tr -d ' ')"
  echo "test identifiers in the served entry document: $(grep -c 'data-test[id]' "${SRC_DIR}/index.html" 2>/dev/null | tr -d ' ')"
} > "${LOGS_DIR}/install.log" 2>&1

node - "${SRC_DIR}" "${LOGS_DIR}/offline_posture.json" <<'__JS_OFFLINE__' >> "${LOGS_DIR}/install.log" 2>&1
import fs from "node:fs";
import path from "node:path";
const [srcDir, outPath] = process.argv.slice(2);
const TAG = /<(script|link|img|iframe|video|audio|source|embed|object|input|track)\b[^>]*>/gis;
const ATTR = /(?:src|href|data|poster|content)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const REL = /rel\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i;
const CSSURL = /url\(\s*["']?(https?:\/\/[^"')\s]+)["']?\s*\)/gi;
const IMPORT = /@import\s+(?:url\()?\s*["']?(https?:\/\/[^"')\s;]+)["']?/gi;
const NEVER_FETCHED_REL = new Set(["canonical", "alternate", "author", "license", "help", "search", "prev", "next", "index", "sidebar"]);
const found = [];
const neverFetched = [];
const walk = (dir) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
};
const scanCss = (text, where) => {
  for (const m of text.matchAll(CSSURL)) found.push({ where, kind: "css url()", url: m[1] });
  for (const m of text.matchAll(IMPORT)) found.push({ where, kind: "css @import", url: m[1] });
};
let htmlScanned = 0, cssScanned = 0;
for (const abs of walk(srcDir)) {
  const rel = path.relative(srcDir, abs).split(path.sep).join("/");
  const isCss = /\.css$/i.test(rel), isHtml = /\.html?$/i.test(rel);
  if (!isCss && !isHtml) continue;
  const text = fs.readFileSync(abs, "utf8");
  if (isCss) { cssScanned++; scanCss(text, rel); continue; }
  htmlScanned++;
  for (const t of text.matchAll(TAG)) {
    const relAttr = ((t[0].match(REL) || [])[2] || "").toLowerCase();
    for (const a of t[0].matchAll(ATTR)) {
      const v = a[2] !== undefined ? a[2] : (a[3] !== undefined ? a[3] : (a[4] || ""));
      if (!/^https?:\/\//i.test(v)) continue;
      if (t[1].toLowerCase() === "link" && NEVER_FETCHED_REL.has(relAttr)) { neverFetched.push({ where: rel, rel: relAttr, url: v }); continue; }
      found.push({ where: rel, kind: "<" + t[1] + " " + a[0].split("=")[0].trim() + ">", url: v });
    }
  }
  for (const st of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) scanCss(st[1], rel + " <style>");
  for (const ia of text.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)) scanCss(ia[1], rel + " inline style");
}
const anchorHrefs = (() => { let n = 0; for (const abs of walk(srcDir)) { if (!/\.html?$/i.test(abs)) continue; n += (fs.readFileSync(abs, "utf8").match(/<a\b[^>]*href\s*=\s*["']https?:\/\//gi) || []).length; } return n; })();
const formActions = (() => { const out = []; for (const abs of walk(srcDir)) { if (!/\.html?$/i.test(abs)) continue; const rel = path.relative(srcDir, abs).split(path.sep).join("/"); for (const m of fs.readFileSync(abs, "utf8").matchAll(/<form\b[^>]*action\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) out.push({ where: rel, url: m[1] }); } return out; })();
const rec = {
  external_subresource_refs: found.length, findings: found,
  html_documents_scanned: htmlScanned, stylesheets_scanned: cssScanned,
  outbound_anchor_hrefs_not_fetched: anchorHrefs,
  never_fetched_rel_links: neverFetched,
  submit_only_form_actions: formActions,
  scanned_at: new Date().toISOString(),
  note: "anchors (<a href>), rel=canonical/alternate metadata links and <form action> are dereferenced by navigation or submit, never at load; they are counted separately and are NOT subresources",
};
fs.writeFileSync(outPath, JSON.stringify(rec, null, 1) + "\n");
console.log("html documents scanned: " + htmlScanned + ", stylesheets scanned: " + cssScanned);
console.log("external subresource references in the served tree: " + found.length);
console.log("outbound anchor hrefs (navigation only, never fetched): " + anchorHrefs);
console.log("never-fetched rel links (declared): " + neverFetched.length);
console.log("submit-only form actions (declared): " + formActions.length);
for (const f of found) console.log("  EXTERNAL " + f.where + " " + f.kind + " -> " + f.url);
process.exit(found.length ? 3 : 0);
__JS_OFFLINE__
EXT_RC=$?
EXT_LEFT=$(node -e 'try{console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).external_subresource_refs)}catch(e){console.log("UNPARSEABLE")}' "${LOGS_DIR}/offline_posture.json")
echo "offline posture check rc=${EXT_RC}, external subresource refs=${EXT_LEFT}" >> "${LOGS_DIR}/install.log"
for _core in "artists/index.html" \
  "artists/styles.css" \
  "credits/index.html" \
  "credits/styles.css" \
  "images/Ludwigssocial.png" \
  "images/apple-music.svg" \
  "images/artists-imgs/1.jpg" \
  "images/artists-imgs/10.jpg" \
  "images/artists-imgs/2.webp" \
  "images/artists-imgs/3.webp" \
  "images/artists-imgs/4.jpg" \
  "images/artists-imgs/5.jpg" \
  "images/artists-imgs/6.jpg" \
  "images/artists-imgs/7.webp" \
  "images/artists-imgs/8.jpg" \
  "images/artists-imgs/9.webp" \
  "images/ball.png" \
  "images/christmas-balls.gif" \
  "images/christmastree.png" \
  "images/christmastree1.png" \
  "images/dark-bg.png" \
  "images/dark.png" \
  "images/darksolid-bg.png" \
  "images/favicon.ico" \
  "images/home-page-img.png" \
  "images/light-bg.png" \
  "images/light.png" \
  "images/lightsolid-bg.png" \
  "images/linktree-bg.png" \
  "images/newspaper.png" \
  "images/photo-gallery-imgs/1.jpg" \
  "images/photo-gallery-imgs/10.jpg" \
  "images/photo-gallery-imgs/2.jpg" \
  "images/photo-gallery-imgs/3.jpg" \
  "images/photo-gallery-imgs/4.jpg" \
  "images/photo-gallery-imgs/5.jpg" \
  "images/photo-gallery-imgs/6.jpg" \
  "images/photo-gallery-imgs/7.jpg" \
  "images/photo-gallery-imgs/8.jpg" \
  "images/photo-gallery-imgs/9.jpg" \
  "images/reindeer.png" \
  "images/screenshots/ludwigs-social.png" \
  "images/screenshots/lyrics.png" \
  "images/screenshots/main-page-dark-mode.png" \
  "images/screenshots/main-page.png" \
  "images/screenshots/photo-gallery.png" \
  "images/screenshots/rate-song.png" \
  "images/second-family-pic.png" \
  "images/tree.png" \
  "images/youtube-music.svg" \
  "index.html" \
  "index.js" \
  "ludsocials/index.html" \
  "ludsocials/podcasts/apple-brands.svg" \
  "ludsocials/podcasts/images/theyard.jfif" \
  "ludsocials/podcasts/index.html" \
  "ludsocials/podcasts/spotify-brands.svg" \
  "ludsocials/podcasts/styles.css" \
  "ludsocials/styles.css" \
  "lyrics/README.md" \
  "lyrics/alliwantforchristmas/index.html" \
  "lyrics/alliwantforchristmas/index.js" \
  "lyrics/alliwantforchristmas/lyrics.txt" \
  "lyrics/babyitscoldoutside/index.html" \
  "lyrics/babyitscoldoutside/index.js" \
  "lyrics/babyitscoldoutside/lyrics.txt" \
  "lyrics/christmassong/index.html" \
  "lyrics/christmassong/index.js" \
  "lyrics/christmassong/lyrics.txt" \
  "lyrics/darkmode.js" \
  "lyrics/index.html" \
  "lyrics/lastchristmas/index.html" \
  "lyrics/lastchristmas/index.js" \
  "lyrics/lastchristmas/lyrics.txt" \
  "lyrics/littlesaintnick/index.html" \
  "lyrics/littlesaintnick/index.js" \
  "lyrics/littlesaintnick/lyrics.txt" \
  "lyrics/lyrics.js" \
  "lyrics/wonderfultimeoftheyear/index.html" \
  "lyrics/wonderfultimeoftheyear/index.js" \
  "lyrics/wonderfultimeoftheyear/lyrics.txt" \
  "news-articles/index.html" \
  "photo-gallery/LICENSE" \
  "photo-gallery/favicon.ico" \
  "photo-gallery/index.html" \
  "photo-gallery/styles.css" \
  "rating/index.html" \
  "rating/index.js" \
  "rating/landscape.jpg" \
  "rating/portrait.jpg" \
  "rating/star.ico" \
  "rating/styles.css" \
  "rating/test.js" \
  "scripts/christmasday.js" \
  "scripts/newyears.js" \
  "scripts/otherProjects.js" \
  "styles.css" \
  "vendor/bootstrap-5.2.1.bundle.min.js" \
  "vendor/bootstrap-5.2.1.min.css" \
  "vendor/fontawesome-6-all.min.css" \
  "vendor/fontawesome-6-v4-shims.min.css" \
  "vendor/rb-article-placeholder.html" \
  "vendor/rb-avatar-placeholder.svg" \
  "vendor/rb-determinism.js" \
  "vendor/rb-embed-placeholder.html" \
  "you-may-like/darkmode.js" \
  "you-may-like/index.html" \
  "you-may-like/index.js" \
  "you-may-like/music-notes.png" \
  "you-may-like/random-song.js" \
  "you-may-like/report-song/index.html" \
  "you-may-like/report-song/styles.css" \
  "you-may-like/song-suggestion/index.html" \
  "you-may-like/song-suggestion/requirements.html" \
  "you-may-like/song-suggestion/styles.css" \
  "you-may-like/styles.css"; do
  if [ ! -f "${SRC_DIR}/${_core}" ]; then
    verr "source tree incomplete (${_core} is missing; see ${LOGS_DIR}/install.log)"
  fi
done
if [ "${EXT_LEFT}" != "0" ]; then
  verr "the served tree still carries ${EXT_LEFT} external subresource reference(s) - the tree must run with no network at all (see ${LOGS_DIR}/install.log and ${LOGS_DIR}/offline_posture.json; anchor hrefs, rel=canonical links and submit-only form actions are NOT counted)"
fi

{
  echo "build key: 'true' (no bundler, no transpiler, no type step: the tree root is the artifact root)"
  echo "outdir key: '.' (the entry document sits at the source root; every reference in it is relative)"
  echo "served directory: ${SRC_DIR}/${OUTDIR}"
  echo "entry document for the freshness check: ${SRC_DIR}/${OUTDIR}/index.html"
} > "${LOGS_DIR}/build.log" 2>&1
if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  verr "no entry document at ${SRC_DIR}/${OUTDIR}/index.html (see ${LOGS_DIR}/build.log)"
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}" --port "${PORT}" --no-spa >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/index.html"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verr "static server not ready on port ${PORT}"
fi

node - "${PORT}" "${SRC_DIR}" "${LOGS_DIR}/surface_identity.json" "artists/index.html" "artists/styles.css" "credits/index.html" "credits/styles.css" "images/Ludwigssocial.png" "images/apple-music.svg" "images/artists-imgs/1.jpg" "images/artists-imgs/10.jpg" "images/artists-imgs/2.webp" "images/artists-imgs/3.webp" "images/artists-imgs/4.jpg" "images/artists-imgs/5.jpg" "images/artists-imgs/6.jpg" "images/artists-imgs/7.webp" "images/artists-imgs/8.jpg" "images/artists-imgs/9.webp" "images/ball.png" "images/christmas-balls.gif" "images/favicon.ico" "images/home-page-img.png" "images/newspaper.png" "images/photo-gallery-imgs/1.jpg" "images/photo-gallery-imgs/10.jpg" "images/photo-gallery-imgs/2.jpg" "images/photo-gallery-imgs/3.jpg" "images/photo-gallery-imgs/4.jpg" "images/photo-gallery-imgs/5.jpg" "images/photo-gallery-imgs/6.jpg" "images/photo-gallery-imgs/7.jpg" "images/photo-gallery-imgs/8.jpg" "images/photo-gallery-imgs/9.jpg" "images/reindeer.png" "images/second-family-pic.png" "images/tree.png" "images/youtube-music.svg" "index.html" "index.js" "ludsocials/index.html" "ludsocials/podcasts/apple-brands.svg" "ludsocials/podcasts/images/theyard.jfif" "ludsocials/podcasts/index.html" "ludsocials/podcasts/spotify-brands.svg" "ludsocials/podcasts/styles.css" "ludsocials/styles.css" "lyrics/alliwantforchristmas/index.html" "lyrics/alliwantforchristmas/index.js" "lyrics/alliwantforchristmas/lyrics.txt" "lyrics/babyitscoldoutside/index.html" "lyrics/babyitscoldoutside/index.js" "lyrics/babyitscoldoutside/lyrics.txt" "lyrics/christmassong/index.html" "lyrics/christmassong/index.js" "lyrics/christmassong/lyrics.txt" "lyrics/darkmode.js" "lyrics/index.html" "lyrics/lastchristmas/index.html" "lyrics/lastchristmas/index.js" "lyrics/lastchristmas/lyrics.txt" "lyrics/littlesaintnick/index.html" "lyrics/littlesaintnick/index.js" "lyrics/littlesaintnick/lyrics.txt" "lyrics/lyrics.js" "lyrics/wonderfultimeoftheyear/index.html" "lyrics/wonderfultimeoftheyear/index.js" "lyrics/wonderfultimeoftheyear/lyrics.txt" "news-articles/index.html" "photo-gallery/favicon.ico" "photo-gallery/index.html" "photo-gallery/styles.css" "rating/index.html" "rating/star.ico" "rating/styles.css" "scripts/christmasday.js" "scripts/newyears.js" "styles.css" "vendor/bootstrap-5.2.1.bundle.min.js" "vendor/bootstrap-5.2.1.min.css" "vendor/fontawesome-6-all.min.css" "vendor/fontawesome-6-v4-shims.min.css" "vendor/rb-article-placeholder.html" "vendor/rb-avatar-placeholder.svg" "vendor/rb-determinism.js" "vendor/rb-embed-placeholder.html" "you-may-like/darkmode.js" "you-may-like/index.html" "you-may-like/index.js" "you-may-like/music-notes.png" "you-may-like/random-song.js" "you-may-like/report-song/index.html" "you-may-like/report-song/styles.css" "you-may-like/song-suggestion/index.html" "you-may-like/song-suggestion/requirements.html" "you-may-like/song-suggestion/styles.css" "you-may-like/styles.css" <<'__JS__' > "${LOGS_DIR}/surface-identity.txt" 2>&1
import crypto from "node:crypto";
import fs from "node:fs";
const [port, srcDir, outPath, ...anchors] = process.argv.slice(2);
const sha16 = (b) => crypto.createHash("sha256").update(b).digest("hex").slice(0, 16);
const get = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u + " -> HTTP " + r.status); return Buffer.from(await r.arrayBuffer()); };
const recs = [];
let identical = true;
for (const rel of anchors) {
  const disk = fs.readFileSync(srcDir + "/" + rel);
  const served = await get("http://127.0.0.1:" + port + "/" + rel);
  const ok = sha16(served) === sha16(disk);
  if (!ok) identical = false;
  recs.push({ file: rel, on_disk_bytes: disk.length, served_bytes: served.length, on_disk_sha256_16: sha16(disk), served_sha256_16: sha16(served), identical: ok });
}
const out = {
  anchors: recs, identical, port: Number(port), served_root: srcDir,
  identity_anchor: "94 load-bearing files requested over HTTP from the origin this script started and hashed against their on-disk bytes. There is no content-hashed bundle to anchor on because this seed builds nothing (outdir '.'), so the anchors are the files themselves: the reference closure of the 3 graded documents (94 files reached by walking every local src=/href= out of /, /lyrics/lastchristmas/, /you-may-like/ and recursing into the two vendored placeholders), unioned with the 5 files environment/mutation.patch touches and the 4 environment/instrumentation.patch touches",
  checked_at: new Date().toISOString(),
};
fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + "\n");
console.log(JSON.stringify(out));
if (!identical) { console.error("SURFACE_MISMATCH " + recs.filter((r) => !r.identical).map((r) => r.file + " served " + r.served_sha256_16 + " vs on-disk " + r.on_disk_sha256_16).join("; ")); process.exit(2); }
__JS__
IDENT_RC=$?
if [ "${IDENT_RC}" -ne 0 ]; then
  verr "the served surface is not the surface on disk (rc=${IDENT_RC}, see ${LOGS_DIR}/surface-identity.txt and ${LOGS_DIR}/surface_identity.json)"
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 15000 \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/exit-code.txt"
if [ "${RUNNER_EXIT}" -gt 1 ]; then
  verr "dsl_runner exited ${RUNNER_EXIT} (a runner/usage fault, not a behaviour verdict; see ${LOGS_DIR}/runner-stdout.txt)"
fi

python3 - "${LOGS_DIR}/checkpoint_results.json" "${_SELF}/f2p_expected.json" "${_SELF}/p2p_expected.json" "${LOGS_DIR}/reward.json" <<'__PY__'
import json, sys
results_path, f2p_path, p2p_path, reward_path = sys.argv[1:5]
try:
    results = json.load(open(results_path))
except FileNotFoundError:
    print(json.dumps({"error": "checkpoint_results.json missing"})); sys.exit(2)
verdicts = {r["id"]: r["status"] for r in results.get("checkpoint_results", [])}
f2p = json.load(open(f2p_path)); p2p = json.load(open(p2p_path))
f2p_fail = [c for c in f2p if verdicts.get(c) != "pass"]
p2p_fail = [c for c in p2p if verdicts.get(c) != "pass"]
f2p_rate = (len(f2p) - len(f2p_fail)) / len(f2p) if f2p else 1.0
p2p_rate = (len(p2p) - len(p2p_fail)) / len(p2p) if p2p else 1.0
reward = 1.0 if not f2p_fail and not p2p_fail else 0.0
summary = {
    "f2p": {"expected": len(f2p), "passed": len(f2p) - len(f2p_fail), "failing": f2p_fail, "rate": round(f2p_rate, 4)},
    "p2p": {"expected": len(p2p), "passed": len(p2p) - len(p2p_fail), "failing": p2p_fail, "rate": round(p2p_rate, 4)},
    "score": round(100 * f2p_rate * p2p_rate, 2),
    "reward": reward,
    "verifier_exit_code": 0 if reward == 1.0 else 1,
}
json.dump(summary, open(reward_path, "w"), indent=2)
print(json.dumps(summary))
sys.exit(0 if reward == 1.0 else 1)
__PY__
PY_EXIT=$?
printf '%s\n' "${PY_EXIT}" > "${LOGS_DIR}/exit-code.txt"
exit "${PY_EXIT}"
