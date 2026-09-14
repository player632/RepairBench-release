#!/bin/bash
# RepairBench verifier for repair-angular__angular-material-dashboard-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/angular-material-dashboard})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/angular-material-dashboard}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="dist/dashboard"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/angular-material-dashboard.nm.tar.gz"
if [ ! -f "${NM_TAR}" ] && [ -f "${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/angular-material-dashboard.nm.tar.gz" ]; then
  NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/angular-material-dashboard.nm.tar.gz"
fi
PORT="${WLB_PORT:-12242}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1). This verifier does not fall back to any path under _build/."
fi
case "${SRC_DIR}" in
  */_build/gates/*|*/_build/gates)
    verifier_error "SRC_DIR ${SRC_DIR} is inside _build/, which holds read-only support data and may carry a stale build output. Refusing to grade it; point WLB_APP_SRC at the seed tree repo/angular/angular-material-dashboard instead."
    ;;
esac
for _must in angular.json package.json src/main.ts src/index.html \
             src/app/modules/dashboard.service.ts \
             src/app/modules/dashboard/dashboard.component.ts \
             src/app/modules/dashboard/dashboard.component.html \
             src/app/shared/widgets/pie/pie.component.ts \
             src/app/layouts/default/default.component.html \
             src/app/shared/components/header/header.component.ts \
             src/app/app-routing.module.ts; do
  [ -f "${SRC_DIR}/${_must}" ] || verifier_error "${SRC_DIR} is not an angular-material-dashboard tree: ${_must} is missing"
done
grep -q '"name": "dashboard"' "${SRC_DIR}/package.json" || verifier_error "${SRC_DIR}/package.json is not the angular-material-dashboard package (name != dashboard)"
grep -q '"outputPath": "dist/dashboard"' "${SRC_DIR}/angular.json" || verifier_error "${SRC_DIR}/angular.json does not declare outputPath dist/dashboard - the outdir this verifier asserts would be wrong"
if [ ! -f "${SRC_DIR}/src/app/rb-probe.ts" ]; then
  verifier_error "${SRC_DIR}/src/app/rb-probe.ts is missing - the read-only observation bridge (environment/instrumentation.patch) was not applied, so window.__AMD__ does not exist and all 41 checkpoints would read the sentinel instead of a measurement. Refusing to grade an uninstrumented tree."
fi
if ! grep -q "rb-probe" "${SRC_DIR}/src/main.ts"; then
  verifier_error "${SRC_DIR}/src/main.ts does not import the observation bridge - instrumentation.patch was applied incompletely (the file exists but is never loaded), so window.__AMD__ would be undefined at runtime."
fi

export NODE_OPTIONS="--openssl-legacy-provider"

if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" -C . ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: frozen dependency archive ${NM_TAR} (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: registry install npm install --no-audit --no-fund (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
      ( cd "${SRC_DIR}" && npm install --no-audit --no-fund --legacy-peer-deps ) >> "${LOGS_DIR}/install.log" 2>&1
      DEP_RC=$?
      echo "dependency source: retry npm install --no-audit --no-fund --legacy-peer-deps (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    fi
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "no usable node_modules in ${SRC_DIR} (see ${LOGS_DIR}/install.log) - the project's own local Angular CLI (node_modules/.bin/ng) is what the build must run through"
fi

node -e 'const fs=require("fs");const p=process.argv[1];try{fs.rmSync(p,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch(e){console.error("erase failed: "+e.message);process.exit(1);}' "${SRC_DIR}/dist" > "${LOGS_DIR}/erase-dist.log" 2>&1
if [ $? -ne 0 ] || [ -e "${SRC_DIR}/dist" ]; then
  verifier_error "could not erase ${SRC_DIR}/dist before building (see ${LOGS_DIR}/erase-dist.log) - refusing to grade a tree where a stale artifact could be mistaken for this build's output"
fi

BUILD_STAMP="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_STAMP}"
if command -v npm >/dev/null 2>&1; then
  ( cd "${SRC_DIR}" && NODE_OPTIONS=--openssl-legacy-provider npm run build ) > "${LOGS_DIR}/build.log" 2>&1
else
  ( cd "${SRC_DIR}" && NODE_OPTIONS=--openssl-legacy-provider ./node_modules/.bin/ng build ) > "${LOGS_DIR}/build.log" 2>&1
fi
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  verifier_error "build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log). If the log shows ERR_OSSL_EVP_UNSUPPORTED the legacy-OpenSSL flag was dropped from the build command; this seed is a webpack-4-generation Angular CLI 8 build and cannot run on a modern node without it."
fi

OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"
if [ ! -f "${OUT_INDEX}" ]; then
  verifier_error "build produced no ${OUTDIR}/index.html under ${SRC_DIR} (rc=${BUILD_RC}, see ${LOGS_DIR}/build.log)"
fi
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "${OUTDIR}/index.html is not newer than the build start - the build did not emit into ${OUTDIR}, so what is on disk is a stale artifact"
fi
if ! grep -q '<base href="/">' "${OUT_INDEX}"; then
  verifier_error "${OUTDIR}/index.html carries no <base href=\"/\"> - the document this verifier is about to serve at the site root was built for a different base, so every bundle and asset reference would resolve elsewhere"
fi
MAIN_BUNDLE="$(sed -n 's/.*<script src="\([^"]*\)".*/\1/p' "${OUT_INDEX}" | head -1)"
if [ -z "${MAIN_BUNDLE}" ]; then
  verifier_error "${OUTDIR}/index.html references no <script src> bundle - the emitted document is not an Angular CLI differential-loading index"
fi
echo "outdir ${OUTDIR} | index $(wc -c < "${OUT_INDEX}" | tr -d ' ') B | first bundle ${MAIN_BUNDLE} | build rc ${BUILD_RC}" > "${LOGS_DIR}/build-summary.txt"

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
  verifier_error "static server not ready on ${PORT} serving ${SRC_DIR}/${OUTDIR}"
fi

ROOT_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/")"
AVATAR_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/assets/avatar.svg")"
FAVICON_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/favicon.ico")"
BUNDLE_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/${MAIN_BUNDLE}")"
DEEP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/posts")"
ABSENT_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/assets/__rb_absent__.svg")"
echo "readiness: / ${ROOT_CODE} | /assets/avatar.svg ${AVATAR_CODE} | /favicon.ico ${FAVICON_CODE} | /${MAIN_BUNDLE} ${BUNDLE_CODE} | /posts ${DEEP_CODE} (recorded only - no checkpoint navigates there through the server) | /assets/__rb_absent__.svg ${ABSENT_CODE} (want 404)" > "${LOGS_DIR}/readiness.txt"
fail_probe() {
  verifier_error "$1 answered $2 (expected 200) - the served directory, the build's asset copy or the SPA fallback is wrong; expected ${SRC_DIR}/${OUTDIR} served at the site root with base href \"/\""
}
[ "${ROOT_CODE}" = "200" ] || fail_probe "the site root /" "${ROOT_CODE}"
[ "${AVATAR_CODE}" = "200" ] || fail_probe "the adapted local asset /assets/avatar.svg (environment/adaptation.patch replaced a remote material.angular.io image with it; if it is not in the build the adaptation did not ship)" "${AVATAR_CODE}"
[ "${FAVICON_CODE}" = "200" ] || fail_probe "the local favicon /favicon.ico" "${FAVICON_CODE}"
[ "${BUNDLE_CODE}" = "200" ] || fail_probe "the first emitted bundle /${MAIN_BUNDLE}" "${BUNDLE_CODE}"
if [ "${ABSENT_CODE}" != "404" ]; then
  verifier_error "a request for /assets/__rb_absent__.svg answered ${ABSENT_CODE} instead of 404 - the static server is falling back for extension-bearing paths, which would hollow out P03/P04 (the offline-adaptation checkpoints) because a remote or missing asset could then be answered with the document. Refusing to grade an unmeasurable task."
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 8000 \
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
