#!/bin/bash
# RepairBench verifier for repair-svelte__15puzzle-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/15puzzle})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/15puzzle}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="build"
NM_TAR="${WLB_NM_TAR:-${PIPELINE_ROOT}/_build/tmp/s5_nm_bake/15puzzle.nm.tar.gz}"
PORT="${WLB_PORT:-12499}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"
echo "src_dir=${SRC_DIR}" > "${LOGS_DIR}/recipe.log"
echo "eval_root=${EVAL_ROOT} outdir=${OUTDIR} port=${PORT} nm_tar=${NM_TAR}" >> "${LOGS_DIR}/recipe.log"

case "${SRC_DIR}" in
  */_build/gates/*|*/_build/gates)
    echo "VERIFIER_ERROR: src_dir must never be the read-only support directory (${SRC_DIR}); no path under _build/ is writable" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
    ;;
esac

if [ ! -f "${SRC_DIR}/package.json" ] || [ ! -f "${SRC_DIR}/rollup.config.js" ] || [ ! -d "${SRC_DIR}/src" ]; then
  echo "VERIFIER_ERROR: src_dir ${SRC_DIR} is not a 15puzzle tree (needs package.json + rollup.config.js + src/)." >&2
  echo "              The seed tree repo/svelte/15puzzle is supplied at intake; pass it explicitly" >&2
  echo "              (bash run.sh <src_dir>) or export WLB_APP_SRC." >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node -e '
const fs = require("node:fs"), path = require("node:path");
const root = process.argv[1];
const removed = [];
for (const rel of ["build", "public/build", "node_modules/.cache", ".rollup.cache"]) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  fs.rmSync(p, { recursive: true, force: true });
  removed.push(rel);
}
for (const e of fs.readdirSync(path.join(root, "public"))) {
  if (!/^(sw\.js|sw\.js\.map|workbox-.*\.js|workbox-.*\.js\.map)$/.test(e)) continue;
  fs.rmSync(path.join(root, "public", e), { recursive: true, force: true });
  removed.push("public/" + e);
}
console.log("stale wipe: " + (removed.length ? removed.join(", ") : "nothing to remove"));
' "${SRC_DIR}" 2>&1 | tee "${LOGS_DIR}/wipe.log"

if [ ! -x "${SRC_DIR}/node_modules/.bin/rollup" ] || [ ! -d "${SRC_DIR}/node_modules/svelte" ]; then
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: frozen dependency archive ${NM_TAR} (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: the registered npm command against the warm local cache + the committed package-lock.json (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  fi
else
  echo "dependency source: node_modules already present in the tree, restore skipped" > "${LOGS_DIR}/install.log"
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/rollup" ] || [ ! -d "${SRC_DIR}/node_modules/svelte" ]; then
  echo "VERIFIER_ERROR: no usable node_modules (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node -e '
const { createRequire } = require("node:module"), path = require("node:path"), fs = require("node:fs");
const root = process.argv[1];
const req = createRequire(path.join(root, "package.json"));
let bad = 0;
const report = (name, ok, detail) => { console.log((ok ? "toolchain ok: " : "toolchain FAIL: ") + name + " :: " + detail); if (!ok) bad++; };
try {
  const bin = path.join(root, "node_modules/.bin/rollup");
  const st = fs.statSync(bin);
  report("rollup-bin", st.size > 0, "bytes=" + st.size + " resolved=" + req.resolve("rollup"));
} catch (e) { report("rollup-bin", false, String(e.message || e).split("\n")[0]); }
try {
  const sv = req("svelte/compiler");
  const out = sv.compile("<h1>hi</h1>", { generate: "dom" });
  report("svelte-compiler", String(out.js.code).length > 0, "resolved=" + req.resolve("svelte/compiler") + " compiled_bytes=" + String(out.js.code).length);
} catch (e) { report("svelte-compiler", false, String(e.message || e).split("\n")[0]); }
for (const lib of ["canvas-confetti", "idb-keyval", "lodash.shuffle", "workbox-window"]) {
  try { req.resolve(lib); report(lib, true, "resolved=" + req.resolve(lib)); }
  catch (e) { report(lib, false, String(e.message || e).split("\n")[0]); }
}
for (const plugin of ["rollup-plugin-svelte", "@rollup/plugin-node-resolve", "@rollup/plugin-commonjs", "rollup-plugin-workbox"]) {
  try { req.resolve(plugin); report(plugin, true, "resolved=" + req.resolve(plugin)); }
  catch (e) { report(plugin, false, String(e.message || e).split("\n")[0]); }
}
process.exit(bad ? 3 : 0);
' "${SRC_DIR}" > "${LOGS_DIR}/toolchain.log" 2>&1
TOOL_RC=$?
cat "${LOGS_DIR}/toolchain.log"
if [ "${TOOL_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: toolchain unusable (see ${LOGS_DIR}/toolchain.log)" >&2
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
const outdir = process.argv[1], outFile = process.argv[2];
const names = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else names.push(path.relative(outdir, p).split(path.sep).join("/"));
  }
})(outdir);
names.sort();
const dig = (p) => fs.existsSync(p) ? crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16) : null;
const idx = path.join(outdir, "index.html");
const bundles = names.filter((n) => /^bundle\.[0-9a-f]+\.js$/.test(n));
const inv = {
  outdir: "build",
  files: names.length,
  html_n: names.filter((n) => n.endsWith(".html")).length,
  bundle_n: bundles.length,
  bundle_names: bundles,
  index_html_bytes: fs.existsSync(idx) ? fs.statSync(idx).size : null,
  index_html_sha256_16: dig(idx),
  inventory_sha256_16: crypto.createHash("sha256").update(names.join("\n")).digest("hex").slice(0, 16),
  captured_at: new Date().toISOString()
};
fs.writeFileSync(outFile, JSON.stringify(inv, null, 1) + "\n");
console.log("output inventory: files=" + inv.files + " html=" + inv.html_n + " bundles=" + inv.bundle_n + " index=" + inv.index_html_bytes + "B/" + inv.index_html_sha256_16 + " inventory_sha256_16=" + inv.inventory_sha256_16);
if (!inv.html_n || !inv.index_html_bytes || !inv.bundle_n) process.exit(4);
' "${SRC_DIR}/${OUTDIR}" "${LOGS_DIR}/output_inventory.json" > "${LOGS_DIR}/inventory.log" 2>&1
INV_RC=$?
cat "${LOGS_DIR}/inventory.log"
if [ "${INV_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: build output unusable (no index.html, no bundle, or empty tree) - see ${LOGS_DIR}/inventory.log" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" >> "${LOGS_DIR}/serve.log" 2>&1 &
SERVER_PID=$!
trap 'kill ${SERVER_PID} 2>/dev/null; wait ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 100); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready on ${PORT} (see ${LOGS_DIR}/serve.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
MANIFEST_NAME="$(cd "${SRC_DIR}/${OUTDIR}" && ls manifest.*.webmanifest 2>/dev/null | head -1)"
if [ -z "${MANIFEST_NAME}" ]; then
  echo "VERIFIER_ERROR: the built tree carries no manifest.*.webmanifest (the seed own static-asset hash step did not run)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
echo "resolved manifest name: ${MANIFEST_NAME}" >> "${LOGS_DIR}/serve.log"
for probe in "/" "/index.html" "/sw.js" "/${MANIFEST_NAME}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${probe}")
  echo "serve probe ${probe} -> ${code}" >> "${LOGS_DIR}/serve.log"
  if [ "${code}" != "200" ]; then
    echo "VERIFIER_ERROR: serve probe ${probe} answered ${code}, the served tree is incomplete" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
  fi
done

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 9000 \
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
