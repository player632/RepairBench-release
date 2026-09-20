#!/bin/bash
# RepairBench verifier for repair-vanilla__charlie-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vanilla/charlie})
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
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vanilla/charlie}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="dist"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/charlie.nm.tar.gz"
PORT="${WLB_PORT:-12429}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verr() { echo "VERIFIER_ERROR: $1" >&2; echo 2 > "${LOGS_DIR}/exit-code.txt"; exit 2; }

if curl -s -o /dev/null -m 2 "http://127.0.0.1:${PORT}/"; then
  verr "port ${PORT} is ALREADY answering before this script served anything - refusing to grade a foreign or stale tree (this instance's pre-allocated delivery port is 12429, mirror 12929; a lane may override it with WLB_PORT)"
fi

if [ ! -d "${SRC_DIR}" ]; then
  verr "source tree ${SRC_DIR} does not exist (pass it as \$1 or set WLB_APP_SRC; the read-only support directory _build/gates/charlie is a read-only design reference and is never used as the answering tree)"
fi
if [ ! -f "${SRC_DIR}/package.json" ]; then
  verr "${SRC_DIR} has no package.json - not a charlie tree (pkg_dir is the repo root, per the gate manifest's pkg_dir \".\")"
fi
if [ ! -f "${SRC_DIR}/index.html" ]; then
  verr "${SRC_DIR} has no index.html - not a charlie tree (vite's single html entry, and the host of the page's whole CSS grid layout)"
fi
if [ ! -f "${SRC_DIR}/src/vm.ts" ]; then
  verr "${SRC_DIR} has no src/vm.ts - not a charlie tree (the VM primitives and the interpreter loop)"
fi
if [ ! -f "${SRC_DIR}/src/kernel.ts" ]; then
  verr "${SRC_DIR} has no src/kernel.ts - not a charlie tree (the Forth kernel source string)"
fi
if [ ! -d "${SRC_DIR}/lib" ]; then
  verr "${SRC_DIR} has no lib/ directory - not a charlie tree (the build copies lib/ into ${OUTDIR}/ and the REPL's include word fetches from it)"
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  if [ -f "${NM_TAR}" ]; then
    tar -xzf "${NM_TAR}" -C "${SRC_DIR}" > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: tier 2, resident dependency archive ${NM_TAR} via tar -xzf (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    echo "deps-restored" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${SRC_DIR}" && yarn install --non-interactive --no-progress --network-timeout 600000 ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: tier 3, the declared registry install command (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  ( cd "${SRC_DIR}" && yarn install --non-interactive --no-progress --network-timeout 600000 ) >> "${LOGS_DIR}/install.log" 2>&1
  echo "dependency source: tier 3 fallback after an unusable or missing supply (rc=$?)" >> "${LOGS_DIR}/install.log"
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  verr "no usable node_modules: node_modules/.bin/vite is not executable and neither the resident archive ${NM_TAR} nor \`yarn install --non-interactive --no-progress --network-timeout 600000\` produced it (see ${LOGS_DIR}/install.log)"
fi

( cd "${SRC_DIR}" && yarn run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  verr "build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log; \`yarn run build\` is \`yarn clean && vite build --base='./' && cp -R demo lib dist/\`)"
fi
if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  verr "build produced no ${OUTDIR}/index.html"
fi
if [ ! -f "${SRC_DIR}/${OUTDIR}/lib/math.fs" ]; then
  verr "build produced no ${OUTDIR}/lib/math.fs - the recipe's own \`cp -R demo lib dist/\` did not run, so the REPL's include word would 404 and the Forth-layer defects would be ungradable"
fi
ONDISK_JS_NAME="$(node -e 'const fs=require("fs");const h=fs.readFileSync(process.argv[1],"utf8");const m=h.match(/(?:src|href)="\.?\/?(assets\/index[-.][A-Za-z0-9_-]+\.js)"/);if(!m){console.error("no assets/index-*.js reference in the built index.html");process.exit(4)}console.log(m[1])' "${SRC_DIR}/${OUTDIR}/index.html" 2>>"${LOGS_DIR}/build.log")"
if [ -z "${ONDISK_JS_NAME}" ]; then
  verr "the built ${OUTDIR}/index.html names no assets/index-*.js entry chunk (the bundle every checkpoint drives)"
fi
ONDISK_JS="${SRC_DIR}/${OUTDIR}/${ONDISK_JS_NAME}"
if [ ! -f "${ONDISK_JS}" ]; then
  verr "the built index.html names ${ONDISK_JS_NAME} but ${ONDISK_JS} does not exist on disk"
fi
ONDISK_FS="${SRC_DIR}/${OUTDIR}/lib/math.fs"

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verr "static server not ready on port ${PORT}"
fi

node - "${PORT}" "${ONDISK_JS}" "${ONDISK_JS_NAME}" "${SRC_DIR}/${OUTDIR}/index.html" "${ONDISK_FS}" "${LOGS_DIR}/bundle_identity.json" <<'__JS__' > "${LOGS_DIR}/bundle-identity.txt" 2>&1
import crypto from "node:crypto";
import fs from "node:fs";
const [port, onDisk, onDiskName, onDiskHtml, onDiskFs, outPath] = process.argv.slice(2);
const sha16 = (b) => crypto.createHash("sha256").update(b).digest("hex").slice(0, 16);
const get = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u + " -> HTTP " + r.status); return Buffer.from(await r.arrayBuffer()); };
const nameOf = (html) => { const m = String(html).match(/(?:src|href)="\.?\/?(assets\/index[-.][A-Za-z0-9_-]+\.js)"/); return m ? m[1] : null; };
const servedHtml = await get("http://127.0.0.1:" + port + "/");
const servedName = nameOf(servedHtml);
if (!servedName) throw new Error("the SERVED index.html names no assets/index-*.js entry chunk");
const servedBuf = await get("http://127.0.0.1:" + port + "/" + servedName);
const diskBuf = fs.readFileSync(onDisk);
const diskHtmlBuf = fs.readFileSync(onDiskHtml);
const servedFsBuf = await get("http://127.0.0.1:" + port + "/" + onDiskFs.slice(onDiskFs.indexOf("/dist/") + 6));
const diskFsBuf = fs.readFileSync(onDiskFs);
const rec = {
  served_asset: servedName, on_disk_asset: onDiskName,
  name_match: servedName === onDiskName,
  served_sha256_16: sha16(servedBuf), on_disk_sha256_16: sha16(diskBuf),
  served_bytes: servedBuf.length, on_disk_bytes: diskBuf.length,
  index_html_served_sha256_16: sha16(servedHtml), index_html_on_disk_sha256_16: sha16(diskHtmlBuf),
  forth_source_anchor: onDiskFs.slice(onDiskFs.indexOf("/dist/") + 6),
  forth_source_served_sha256_16: sha16(servedFsBuf), forth_source_on_disk_sha256_16: sha16(diskFsBuf),
  forth_source_bytes: diskFsBuf.length,
  identical: servedName === onDiskName && sha16(servedBuf) === sha16(diskBuf) && sha16(servedHtml) === sha16(diskHtmlBuf) && sha16(servedFsBuf) === sha16(diskFsBuf),
  identity_anchor: "TWO anchors: (a) the assets/index-*.js entry chunk named by dist/index.html plus index.html itself - vite content-hashes both, and scripts.build passes --base='./' so the reference is relative and the regex accepts an optional ./ prefix; (b) dist/lib/math.fs, which the build COPIES into dist/ instead of bundling, so the chunk hash alone would not detect a wrong Forth source being served",
  port: Number(port), checked_at: new Date().toISOString(),
};
fs.writeFileSync(outPath, JSON.stringify(rec, null, 1) + "\n");
console.log(JSON.stringify(rec));
if (!rec.identical) { console.error("BUNDLE_MISMATCH served " + rec.served_asset + " " + rec.served_sha256_16 + " vs on-disk " + rec.on_disk_asset + " " + rec.on_disk_sha256_16 + "; forth source " + rec.forth_source_served_sha256_16 + " vs " + rec.forth_source_on_disk_sha256_16); process.exit(2); }
__JS__
IDENT_RC=$?
if [ "${IDENT_RC}" -ne 0 ]; then
  verr "the served surface is not the surface on disk (rc=${IDENT_RC}, see ${LOGS_DIR}/bundle-identity.txt and ${LOGS_DIR}/bundle_identity.json)"
fi

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
