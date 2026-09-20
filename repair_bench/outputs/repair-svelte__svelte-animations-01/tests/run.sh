#!/bin/bash
# RepairBench verifier for repair-svelte__svelte-animations-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/svelte-animations})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -uo pipefail

_SELF="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/svelte-animations}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR=".svelte-kit/output/prerendered/pages"
NM_TAR="${WLB_NM_TAR:-${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/svelte-animations.nm.tar.gz}"
PORT="${WLB_PORT:-12042}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

case "${SRC_DIR}" in
  */_build/gates/*|*/_build/gates)
    echo "VERIFIER_ERROR: src_dir must never be the read-only support directory (${SRC_DIR}); no path under _build/ is writable" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
    ;;
esac
if [ ! -f "${SRC_DIR}/package.json" ] || [ ! -f "${SRC_DIR}/svelte.config.js" ]; then
  echo "VERIFIER_ERROR: src_dir ${SRC_DIR} is not a svelte-animations tree (no package.json/svelte.config.js)." >&2
  echo "              The seed tree repo/svelte/svelte-animations is supplied by stage 1 at registration;" >&2
  echo "              pass it explicitly (bash run.sh <src_dir>) or export WLB_APP_SRC." >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node -e '
const fs = require("node:fs"), path = require("node:path");
const root = process.argv[1];
const targets = [".svelte-kit", ".output", ".vercel"];
const removed = [];
for (const rel of targets) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  const st = fs.statSync(p);
  fs.rmSync(p, { recursive: true, force: true });
  removed.push(rel + (st.isDirectory() ? "/" : " (" + st.size + " B)"));
}
for (const e of fs.readdirSync(root)) {
  if (!/^vite\.config\.[cm]?[jt]s\.timestamp-/.test(e)) continue;
  const p = path.join(root, e);
  fs.rmSync(p, { recursive: true, force: true });
  removed.push(e);
}
console.log("stale wipe: " + (removed.length ? removed.join(", ") : "nothing to remove"));
' "${SRC_DIR}" 2>&1 | tee "${LOGS_DIR}/wipe.log"

if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ] || [ ! -d "${SRC_DIR}/node_modules/@sveltejs/kit" ]; then
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: frozen dependency archive ${NM_TAR} (rc=${DEP_RC}; R25 path, byte-identical to the stage-8 original)" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: the registered npm command against the warm local cache + the committed package-lock.json (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ] || [ ! -d "${SRC_DIR}/node_modules/@sveltejs/kit" ]; then
  echo "VERIFIER_ERROR: no usable node_modules (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node -e '
const { createRequire } = require("node:module"), path = require("node:path"), fs = require("node:fs");
const root = process.argv[1];
const req = createRequire(path.join(root, "package.json"));
let bad = 0;
const report = (name, ok, detail) => { console.log((ok ? "native ok: " : "native FAIL: ") + name + " :: " + detail); if (!ok) bad++; };
try { const m = req("esbuild"); const out = m.transformSync("const answer = 42;", { loader: "ts" });
  report("esbuild", String(out.code).indexOf("42") >= 0, "resolved=" + req.resolve("esbuild") + " transform ok"); }
catch (e) { report("esbuild", false, String(e.message || e).split("\n")[0]); }
for (const rel of ["node_modules/@esbuild/darwin-arm64/bin/esbuild", "node_modules/vite/node_modules/@esbuild/darwin-arm64/bin/esbuild"]) {
  const p = path.join(root, rel);
  try { const st = fs.statSync(p); report(rel, st.size > 0 && (st.mode & 0o111) !== 0, "bytes=" + st.size + " mode=" + (st.mode & 0o777).toString(8)); }
  catch (e) { report(rel, false, String(e.message || e).split("\n")[0]); }
}
try { const f = req("fsevents"); report("fsevents", typeof f.watch === "function", "resolved=" + req.resolve("fsevents") + " typeof watch=" + typeof f.watch); }
catch (e) { report("fsevents", false, String(e.message || e).split("\n")[0]); }
process.exit(bad ? 3 : 0);
' "${SRC_DIR}" > "${LOGS_DIR}/native.log" 2>&1
NATIVE_RC=$?
cat "${LOGS_DIR}/native.log"
if [ "${NATIVE_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: native modules unusable (see ${LOGS_DIR}/native.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

( cd "${SRC_DIR}" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  echo "VERIFIER_ERROR: build produced no ${OUTDIR}/index.html" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node -e '
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const pages = process.argv[1], out = process.argv[2];
const names = [];
(function walk(d, base) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, base); else names.push(path.relative(base, p).split(path.sep).join("/"));
  }
})(pages, pages);
names.sort();
const html = names.filter((n) => n.endsWith(".html"));
const idx = path.join(pages, "index.html");
const dig = (p) => fs.existsSync(p) ? crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16) : null;
const inv = {
  outdir: ".svelte-kit/output/prerendered/pages",
  files: names.length,
  html_n: html.length,
  data_json_n: names.filter((n) => n.endsWith("__data.json")).length,
  inventory_sha256_16: crypto.createHash("sha256").update(names.join("\n")).digest("hex").slice(0, 16),
  index_html_bytes: fs.existsSync(idx) ? fs.statSync(idx).size : null,
  index_html_sha256_16: dig(idx),
  client_dir_present: fs.existsSync(path.resolve(pages, "../../client/_app")),
  captured_at: new Date().toISOString(),
};
fs.writeFileSync(out, JSON.stringify(inv, null, 1) + "\n");
console.log("prerender inventory: html_n=" + inv.html_n + " files=" + inv.files + " inventory_sha256_16=" + inv.inventory_sha256_16 + " index=" + inv.index_html_bytes + "B/" + inv.index_html_sha256_16 + " client_overlay_present=" + inv.client_dir_present);
if (!inv.html_n || !inv.index_html_bytes || !inv.client_dir_present) process.exit(4);
' "${SRC_DIR}/${OUTDIR}" "${LOGS_DIR}/prerender_inventory.json" > "${LOGS_DIR}/inventory.log" 2>&1
INV_RC=$?
cat "${LOGS_DIR}/inventory.log"
if [ "${INV_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: prerendered inventory unusable (0 html, no index.html, or no sibling client/_app to overlay) - see ${LOGS_DIR}/inventory.log" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${_SELF}/serve_overlay.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" >> "${LOGS_DIR}/serve.log" 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null || true; pkill -P ${SERVER_PID} 2>/dev/null || true; kill ${SERVER_PID} 2>/dev/null || true; wait ${SERVER_PID} 2>/dev/null || true' EXIT
READY=0
for _ in $(seq 1 100); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/__rb_overlay_health"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: overlay server not ready on ${PORT} (see ${LOGS_DIR}/serve.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
for probe in "/try/sidebar" "/learnings/1"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${probe}")
  echo "deep-link ${probe} -> ${code}" >> "${LOGS_DIR}/serve.log"
  if [ "${code}" != "200" ]; then
    echo "VERIFIER_ERROR: deep link ${probe} answered ${code}, extensionless routing or the overlay is broken" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
  fi
done

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 15000 \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/exit-code.txt"

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
}
json.dump(summary, open(reward_path, "w"), indent=2)
print(json.dumps(summary))
sys.exit(0 if reward == 1.0 else 1)
__PY__
exit $?
