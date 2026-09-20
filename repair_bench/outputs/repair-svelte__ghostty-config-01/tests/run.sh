#!/bin/bash
# RepairBench verifier for repair-svelte__ghostty-config-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/ghostty-config})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/ghostty-config}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="build"
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s9g_nm/ghostty-config/node_modules}"
NM_ARCHIVE="${WLB_NM_ARCHIVE:-${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/ghostty-config.nm.tar.gz}"
PORT="${WLB_PORT:-12249}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as $1). The read-only support directory is _build/gates/ghostty-config; it is never used as the answering tree."
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  if [ -d "${SRC_DIR}/node_modules" ]; then
    verifier_error "${SRC_DIR}/node_modules exists but node_modules/.bin/vite is not executable. Refusing to delete and rebuild an existing dependency tree; remove it deliberately or point WLB_NM_DEPOT at a usable dependency cache."
  fi
  if [ -d "${NM_DEPOT}" ] && [ -x "${NM_DEPOT}/.bin/vite" ]; then
    DEP_START=$(date +%s)
    cp -Rc "${NM_DEPOT}" "${SRC_DIR}/node_modules" > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    DEP_END=$(date +%s)
    echo "dependency source: resident dependency cache ${NM_DEPOT} via cp -Rc (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  elif [ -f "${NM_ARCHIVE}" ]; then
    DEP_START=$(date +%s)
    tar -xzf "${NM_ARCHIVE}" -C "${SRC_DIR}" > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    DEP_END=$(date +%s)
    echo "dependency source: frozen dependency archive ${NM_ARCHIVE} (82687135 B, sha256-16 c5bb1118f4ff6f6e, root entry node_modules/) via tar -xzf (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  else
    echo "dependency source: dependency cache ${NM_DEPOT} and archive ${NM_ARCHIVE} both unusable, falling back to a declared install" > "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: declared install (rc=${DEP_RC}) - NEEDS NETWORK, which the grading environment does not have" >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  verifier_error "no usable node_modules (see ${LOGS_DIR}/install.log); neither the dependency cache ${NM_DEPOT} nor the archive ${NM_ARCHIVE} provided node_modules/.bin/vite"
fi

node -e 'const fs=require("fs");const d=process.argv[1];for(const p of ["/build","/.svelte-kit"]){const t=d+p;const had=fs.existsSync(t);if(had){fs.rmSync(t,{recursive:true,force:true});}console.log((had?"erased":"absent")+": "+t);}' "${SRC_DIR}" > "${LOGS_DIR}/outdir-erase.txt" 2>&1
ERASE_RC=$?
cat "${LOGS_DIR}/outdir-erase.txt"
if [ "${ERASE_RC}" -ne 0 ]; then
  verifier_error "could not erase the previous build / .svelte-kit (see ${LOGS_DIR}/outdir-erase.txt); refusing to build on top of a stale tree"
fi

BUILD_STAMP="${LOGS_DIR}/.build_start_$$"
: > "${BUILD_STAMP}"
VITE="${SRC_DIR}/node_modules/.bin/vite"

( cd "${SRC_DIR}" && "${VITE}" build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  tail -40 "${LOGS_DIR}/build.log" >&2
  verifier_error "build failed (rc=${BUILD_RC}, see ${LOGS_DIR}/build.log)"
fi

OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"
OUT_FALLBACK="${SRC_DIR}/${OUTDIR}/404.html"
if [ ! -f "${OUT_INDEX}" ]; then
  verifier_error "the build reported success but ${OUTDIR}/index.html is absent - there is no static output to serve"
fi
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "${OUTDIR}/index.html is NOT newer than the build stamp - the served tree would be a stale artifact this run never emitted (TRAP 2). Refusing to grade."
fi

if [ ! -f "${OUT_FALLBACK}" ]; then
  verifier_error "${OUTDIR}/404.html is absent, so adapter-static did not emit its fallback shell (svelte.config.js asks for fallback: \"404.html\"). Without it there is no absolute-asset shell to serve deep routes with."
fi
cp "${OUT_FALLBACK}" "${OUT_INDEX}"
CP_RC=$?
if [ "${CP_RC}" -ne 0 ]; then
  verifier_error "could not install the absolute-asset fallback shell as ${OUTDIR}/index.html (rc=${CP_RC})"
fi
ABS_HITS="$(awk '/href="\/_app\/|import\("\/_app\//{n++} END{print n+0}' "${OUT_INDEX}")"
REL_HITS="$(awk '/href="\.\/_app\/|import\("\.\/_app\//{n++} END{print n+0}' "${OUT_INDEX}")"
echo "fallback shell: ${ABS_HITS} absolute /_app/ reference(s), ${REL_HITS} relative ./_app/ reference(s) in ${OUTDIR}/index.html" > "${LOGS_DIR}/fallback-shell.txt"
cat "${LOGS_DIR}/fallback-shell.txt"
if [ "${ABS_HITS:-0}" -lt 1 ] || [ "${REL_HITS:-0}" -ne 0 ]; then
  verifier_error "the served ${OUTDIR}/index.html is not the absolute-asset shell (${ABS_HITS} absolute, ${REL_HITS} relative). Deep routes would resolve their assets against the wrong prefix, the page would stay blank and every checkpoint would read the bridge sentinel - a vacuous red set. Refusing to grade."
fi

SERVE_DIR="${SRC_DIR}/${OUTDIR}"
SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SERVE_DIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null; rm -f "${BUILD_STAMP}" "${SUP_STOP}" 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verifier_error "static server not ready on ${PORT}"
fi

probe_code() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}$1"; }
START_JS="$(cd "${SERVE_DIR}" && ls _app/immutable/entry/start.*.js 2>/dev/null | head -1)"
if [ -z "${START_JS}" ]; then
  verifier_error "no _app/immutable/entry/start.*.js in ${OUTDIR} - the client entry is missing from the build output"
fi
ROOT_CODE="$(probe_code /)"
ICON_CODE="$(probe_code /favicon.ico)"
ROBOTS_CODE="$(probe_code /robots.txt)"
START_CODE="$(probe_code "/${START_JS}")"
FONT_CODE="$(probe_code /fonts/JetBrainsMonoNerdFont-Regular.woff2)"
WINDOW_CODE="$(probe_code /settings/window)"
COLORS_CODE="$(probe_code /settings/colors)"
KEYBINDS_CODE="$(probe_code /settings/keybinds)"
IMPEXP_CODE="$(probe_code /app/import-export)"
echo "readiness: / ${ROOT_CODE} | /favicon.ico ${ICON_CODE} | /robots.txt ${ROBOTS_CODE} | /${START_JS} ${START_CODE} | /fonts/JetBrainsMonoNerdFont-Regular.woff2 ${FONT_CODE} || deep routes through the SPA fallback: /settings/window ${WINDOW_CODE} | /settings/colors ${COLORS_CODE} | /settings/keybinds ${KEYBINDS_CODE} | /app/import-export ${IMPEXP_CODE}" > "${LOGS_DIR}/readiness.txt"
cat "${LOGS_DIR}/readiness.txt"
fail_probe() {
  verifier_error "$1 answered $2 (expected 200) - the served directory, the fallback shell or the build output is wrong; expected ${OUTDIR} served at the site root"
}
[ "${ROOT_CODE}" = "200" ] || fail_probe "the site root /" "${ROOT_CODE}"
[ "${ICON_CODE}" = "200" ] || fail_probe "the copied static asset /favicon.ico" "${ICON_CODE}"
[ "${ROBOTS_CODE}" = "200" ] || fail_probe "the copied static asset /robots.txt" "${ROBOTS_CODE}"
[ "${START_CODE}" = "200" ] || fail_probe "the client entry module /${START_JS}" "${START_CODE}"
[ "${FONT_CODE}" = "200" ] || fail_probe "the copied static font /fonts/JetBrainsMonoNerdFont-Regular.woff2" "${FONT_CODE}"
[ "${WINDOW_CODE}" = "200" ] || fail_probe "the deep route /settings/window" "${WINDOW_CODE}"
[ "${COLORS_CODE}" = "200" ] || fail_probe "the deep route /settings/colors" "${COLORS_CODE}"
[ "${KEYBINDS_CODE}" = "200" ] || fail_probe "the deep route /settings/keybinds" "${KEYBINDS_CODE}"
[ "${IMPEXP_CODE}" = "200" ] || fail_probe "the deep route /app/import-export" "${IMPEXP_CODE}"

BRIDGE_FILES="$(find "${SERVE_DIR}/_app" -type f -name '*.js' -print 2>/dev/null | wc -l | tr -d ' ')"
BRIDGE_HITS="$(find "${SERVE_DIR}/_app" -type f -name '*.js' -exec awk '/__GC__/{n++} END{print n+0}' {} \; 2>/dev/null | awk '{s+=$1} END{print s+0}')"
VERSION_HITS="$(find "${SERVE_DIR}/_app" -type f -name '*.js' -exec awk '/s7-r28k3-ghostty-1/{n++} END{print n+0}' {} \; 2>/dev/null | awk '{s+=$1} END{print s+0}')"
echo "bridge guard: ${BRIDGE_HITS} occurrence(s) of the probe namespace and ${VERSION_HITS} of the version string s7-r28k3-ghostty-1 across ${BRIDGE_FILES} built js file(s) under ${OUTDIR}/_app" > "${LOGS_DIR}/bridge-guard.txt"
cat "${LOGS_DIR}/bridge-guard.txt"
if [ "${BRIDGE_HITS:-0}" -lt 1 ] || [ "${VERSION_HITS:-0}" -lt 1 ]; then
  verifier_error "the built bundle carries ${BRIDGE_HITS} occurrence(s) of the probe namespace and ${VERSION_HITS} of its version string, so environment/instrumentation.patch is not in this build. Every checkpoint would read the sentinel and the task would be unmeasurable. Refusing to grade."
fi

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
