#!/bin/bash
# RepairBench verifier for repair-angular__ng-devui-admin-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/ng-devui-admin})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/ng-devui-admin}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="dist/devui-admin"
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s9g_nm/ng-devui-admin/node_modules}"
NM_ARCHIVE="${WLB_NM_ARCHIVE:-${PIPELINE_ROOT}/_build/tmp/s5_nm_bake/ng-devui-admin.nm.tar.gz}"
PORT="${WLB_PORT:-12208}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

if [ ! -d "${SRC_DIR}" ]; then
  echo "VERIFIER_ERROR: SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1). The read-only support directory is _build/gates/ng-devui-admin and the seed tree is ${PIPELINE_ROOT}/repo/angular/ng-devui-admin (the build process's own state tree _build/tmp/s9g_states/... is reclaimable under decision R25-P6 / W4-D1 ③ and is deliberately not relied on)." >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  if [ -d "${SRC_DIR}/node_modules" ]; then
    echo "VERIFIER_ERROR: ${SRC_DIR}/node_modules exists but node_modules/.bin/ng is not executable. Refusing to delete and rebuild an existing dependency tree; remove it deliberately or point WLB_NM_DEPOT at a usable dependency cache." >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
  fi
  if [ -d "${NM_DEPOT}" ] && [ -x "${NM_DEPOT}/.bin/ng" ]; then
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
    echo "dependency source: frozen dependency archive ${NM_ARCHIVE} via tar -xzf (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  else
    echo "dependency source: dependency cache ${NM_DEPOT} and archive ${NM_ARCHIVE} both unusable, falling back to the declared install" > "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund --legacy-peer-deps ) >> "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: registry install npm install --no-audit --no-fund --legacy-peer-deps (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  echo "VERIFIER_ERROR: no usable node_modules (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

BUILD_STAMP="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_STAMP}"
if command -v npm >/dev/null 2>&1; then
  ( cd "${SRC_DIR}" && NG_CLI_ANALYTICS=false npm run build ) > "${LOGS_DIR}/build.log" 2>&1
else
  ( cd "${SRC_DIR}" && NG_CLI_ANALYTICS=false ./node_modules/.bin/ng build ) > "${LOGS_DIR}/build.log" 2>&1
fi
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"
if [ ! -f "${OUT_INDEX}" ]; then
  echo "VERIFIER_ERROR: build produced no ${OUTDIR}/index.html" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  echo "VERIFIER_ERROR: ${OUTDIR}/index.html is not newer than the build start - the build did not emit into ${OUTDIR} (stale tree)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if ! grep -q '<base href="/"' "${OUT_INDEX}"; then
  echo "VERIFIER_ERROR: ${OUTDIR}/index.html carries no <base href=\"/\"> - the document was built for a different deployment path, so every lazy chunk and every asset would resolve somewhere other than the served root" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

find "${SRC_DIR}/${OUTDIR}" -name '*.map' -type f 2>/dev/null | head -40 > "${LOGS_DIR}/sourcemap-offenders.txt"
MAP_COUNT="$(wc -l < "${LOGS_DIR}/sourcemap-offenders.txt" | tr -d ' ')"
MAP_TOTAL="$(find "${SRC_DIR}/${OUTDIR}" -name '*.map' -type f 2>/dev/null | wc -l | tr -d ' ')"
echo "sourcemap guard: ${MAP_TOTAL} .map file(s) under ${OUTDIR} (first ${MAP_COUNT} listed in sourcemap-offenders.txt)" > "${LOGS_DIR}/sourcemap-guard.txt"
if [ "${MAP_TOTAL}" != "0" ]; then
  echo "VERIFIER_ERROR: ${MAP_TOTAL} sourcemap file(s) under ${OUTDIR}. A delivered .map carries sourcesContent, which is the pre-mutation source of every file this task mutates - an answer leak. environment/adaptation.patch (angular.json default-build \"sourceMap\": true -> false) is supposed to make the declared build emit 0 .map; if this fired, the adaptation was not applied or angular.json regressed. Refusing to grade a leaked task." >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null; rm -f "${BUILD_STAMP}" "${SUP_STOP}" 2>/dev/null' EXIT

READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready on ${PORT}" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

probe_code() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}$1"; }
ROOT_CODE="$(probe_code /)"
CARD_CODE="$(probe_code /pages/list/card)"
BASIC_CODE="$(probe_code /pages/list/basic)"
EDIT_CODE="$(probe_code /pages/list/editable)"
ADV_CODE="$(probe_code /pages/list/advance)"
TREE_CODE="$(probe_code /pages/list/tree)"
LOGIN_CODE="$(probe_code /login)"
MAIN_CODE="$(probe_code /main.js)"
CSS_CODE="$(probe_code /styles.css)"
ASSET_CODE="$(probe_code /assets/img/abnormal/404.png)"
ICON_CODE="$(probe_code /favicon.ico)"
echo "readiness: / ${ROOT_CODE} | /pages/list/card ${CARD_CODE} | /pages/list/basic ${BASIC_CODE} | /pages/list/editable ${EDIT_CODE} | /pages/list/advance ${ADV_CODE} | /pages/list/tree ${TREE_CODE} | /login ${LOGIN_CODE} | /main.js ${MAIN_CODE} | /styles.css ${CSS_CODE} | /assets/img/abnormal/404.png ${ASSET_CODE} | /favicon.ico ${ICON_CODE}" > "${LOGS_DIR}/readiness.txt"
fail_probe() {
  echo "VERIFIER_ERROR: $1 answered $2 (expected 200) - the served directory, the SPA fallback or the build output is wrong; expected ${OUTDIR} served at the site root" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}
[ "${ROOT_CODE}" = "200" ] || fail_probe "the site root /" "${ROOT_CODE}"
[ "${CARD_CODE}" = "200" ] || fail_probe "the deep link /pages/list/card" "${CARD_CODE}"
[ "${BASIC_CODE}" = "200" ] || fail_probe "the deep link /pages/list/basic" "${BASIC_CODE}"
[ "${EDIT_CODE}" = "200" ] || fail_probe "the deep link /pages/list/editable" "${EDIT_CODE}"
[ "${ADV_CODE}" = "200" ] || fail_probe "the deep link /pages/list/advance" "${ADV_CODE}"
[ "${TREE_CODE}" = "200" ] || fail_probe "the deep link /pages/list/tree" "${TREE_CODE}"
[ "${LOGIN_CODE}" = "200" ] || fail_probe "the route /login" "${LOGIN_CODE}"
[ "${MAIN_CODE}" = "200" ] || fail_probe "the application bundle /main.js" "${MAIN_CODE}"
[ "${CSS_CODE}" = "200" ] || fail_probe "the stylesheet /styles.css" "${CSS_CODE}"
[ "${ASSET_CODE}" = "200" ] || fail_probe "the copied asset /assets/img/abnormal/404.png" "${ASSET_CODE}"
[ "${ICON_CODE}" = "200" ] || fail_probe "the favicon /favicon.ico" "${ICON_CODE}"

BRIDGE_HITS="$(curl -s "http://127.0.0.1:${PORT}/main.js" | awk '/__DA__/{n++} END{print n+0}')"
echo "bridge guard: ${BRIDGE_HITS} line(s) of the served /main.js carrying the probe namespace" > "${LOGS_DIR}/bridge-guard.txt"
if [ "${BRIDGE_HITS:-0}" -lt 1 ]; then
  echo "VERIFIER_ERROR: the served /main.js carries 0 occurrences of the probe namespace, so environment/instrumentation.patch is not in this build. Every checkpoint would read the '-' sentinel and the task would be unmeasurable. Refusing to grade." >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
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
