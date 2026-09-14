#!/bin/bash
# RepairBench verifier for repair-angular__report-editor-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/report-editor})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/report-editor}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="dist/report-editor"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/report-editor.nm.tar.gz"
if [ ! -f "${NM_TAR}" ] && [ -f "${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/report-editor.nm.tar.gz" ]; then
  NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/report-editor.nm.tar.gz"
fi
PORT="${WLB_PORT:-12251}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1)"
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" -C . ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: frozen dependency archive ${NM_TAR} (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${SRC_DIR}" && npm ci --no-audit --no-fund --offline ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: npm ci against the local npm cache, offline (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
      ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
      DEP_RC=$?
      echo "dependency source: registry install npm install --no-audit --no-fund (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    fi
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "no usable node_modules: ${SRC_DIR}/node_modules/.bin/ng is absent or not executable (see ${LOGS_DIR}/install.log)"
fi

if [ -e "${SRC_DIR}/dist" ]; then
  node -e 'const fs=require("fs");fs.rmSync(process.argv[1],{recursive:true,force:true,maxRetries:5});' "${SRC_DIR}/dist" \
    > "${LOGS_DIR}/dist_wipe.log" 2>&1
  echo "stale dist wiped: rc=$? (pre-existing $(printf '%s' "${SRC_DIR}")/dist)" >> "${LOGS_DIR}/dist_wipe.log"
fi
if [ -e "${SRC_DIR}/dist" ]; then
  verifier_error "could not erase the stale ${SRC_DIR}/dist before building (see ${LOGS_DIR}/dist_wipe.log) - refusing to grade a tree whose outdir may predate this run"
fi

BUILD_STAMP="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_STAMP}"
if command -v npm >/dev/null 2>&1; then
  ( cd "${SRC_DIR}" && NODE_OPTIONS=--openssl-legacy-provider NG_CLI_ANALYTICS=false npm run build ) > "${LOGS_DIR}/build.log" 2>&1
else
  ( cd "${SRC_DIR}" && NODE_OPTIONS=--openssl-legacy-provider NG_CLI_ANALYTICS=false ./node_modules/.bin/ng build ) > "${LOGS_DIR}/build.log" 2>&1
fi
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  verifier_error "build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log; on an OpenSSL 3 node this is almost always a missing NODE_OPTIONS=--openssl-legacy-provider, i.e. webpack 4's md4 hash)"
fi

OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"
if [ ! -f "${OUT_INDEX}" ]; then
  verifier_error "build produced no ${OUTDIR}/index.html"
fi
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "${OUTDIR}/index.html is not newer than the build start - the build did not emit into ${OUTDIR} (stale tree)"
fi
if ! grep -q '<base href="./">' "${OUT_INDEX}"; then
  verifier_error "${OUTDIR}/index.html carries no <base href=\"./\"> - src/index.html was edited or the wrong index was emitted, and the site-root serve geometry below (which depends on that base href resolving every relative bundle to \"/\") would silently 404 the app"
fi

for BUNDLE in main-es2015.js runtime-es2015.js polyfills-es2015.js styles-es2015.js vendor-es2015.js editor-editor-module-es2015.js; do
  if [ ! -f "${SRC_DIR}/${OUTDIR}/${BUNDLE}" ]; then
    verifier_error "${OUTDIR}/${BUNDLE} was not emitted - the expected chunk names (runtime, polyfills, styles, vendor, main and the lazy editor-editor-module) did not appear, so the build configuration is not the one this package was graded against"
  fi
done
if [ ! -f "${SRC_DIR}/${OUTDIR}/assets/github.svg" ]; then
  verifier_error "${OUTDIR}/assets/github.svg was not emitted - environment/adaptation.patch is not applied to this tree. Its src/assets/github.svg is what replaces the external https://github.githubassets.com/favicons/favicon.png, so without it the offline guarantee and checkpoints P12/P13 are both void"
fi
if ! grep -rq 'assets/github\.svg' "${SRC_DIR}/${OUTDIR}"/*.js 2>/dev/null; then
  verifier_error "no emitted bundle contains the string assets/github.svg - the adapted editor-panel template did not reach the build, so P12's repoImgSrc reading would come from a stale chunk"
fi
if grep -rq 'githubassets' "${SRC_DIR}/${OUTDIR}" 2>/dev/null; then
  verifier_error "an emitted file still references githubassets - the external favicon URL survived into the built output, i.e. the substitution did not land and this run would make an off-machine request"
fi
if ! grep -rq '__RE__' "${SRC_DIR}/${OUTDIR}"/*.js 2>/dev/null; then
  verifier_error "no emitted bundle contains window.__RE__ - environment/instrumentation.patch is not applied to this tree, so every js_eval read would return undefined and all 43 checkpoints would go red for a reason that is not a defect verdict"
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
  verifier_error "static server not ready on 127.0.0.1:${PORT}"
fi

probe() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}$1"; }
ROOT_CODE="$(probe /)"
EDITOR_CODE="$(probe /editor)"
SVG_CODE="$(probe /assets/github.svg)"
FAVICON_CODE="$(probe /favicon.ico)"
MAIN_CODE="$(probe /main-es2015.js)"
VENDOR_CODE="$(probe /vendor-es2015.js)"
LAZY_CODE="$(probe /editor-editor-module-es2015.js)"
FONT_CODE="$(probe /iconfont.woff)"
ABSENT_CODE="$(probe /assets/__rb_absent__.txt)"
echo "readiness: / ${ROOT_CODE} | /editor ${EDITOR_CODE} | /assets/github.svg ${SVG_CODE} | /favicon.ico ${FAVICON_CODE} | /main-es2015.js ${MAIN_CODE} | /vendor-es2015.js ${VENDOR_CODE} | /editor-editor-module-es2015.js ${LAZY_CODE} | /iconfont.woff ${FONT_CODE} | absent /assets/__rb_absent__.txt ${ABSENT_CODE}" > "${LOGS_DIR}/readiness.txt"
fail_probe() {
  verifier_error "$1 answered $2 (expected $3) - the served directory, the SPA fallback or the emitted outdir is wrong; expected ${OUTDIR} served at the site root of 127.0.0.1:${PORT}"
}
[ "${ROOT_CODE}" = "200" ]        || fail_probe "the site root /" "${ROOT_CODE}" 200
[ "${EDITOR_CODE}" = "200" ]      || fail_probe "the cold deep link /editor" "${EDITOR_CODE}" 200
[ "${SVG_CODE}" = "200" ]         || fail_probe "the neutralising local asset /assets/github.svg" "${SVG_CODE}" 200
[ "${FAVICON_CODE}" = "200" ]     || fail_probe "the file-pattern asset /favicon.ico" "${FAVICON_CODE}" 200
[ "${MAIN_CODE}" = "200" ]        || fail_probe "the entry bundle /main-es2015.js" "${MAIN_CODE}" 200
[ "${VENDOR_CODE}" = "200" ]      || fail_probe "the vendor bundle /vendor-es2015.js" "${VENDOR_CODE}" 200
[ "${LAZY_CODE}" = "200" ]        || fail_probe "the lazy editor chunk /editor-editor-module-es2015.js" "${LAZY_CODE}" 200
[ "${FONT_CODE}" = "200" ]        || fail_probe "the local icon font /iconfont.woff" "${FONT_CODE}" 200
if [ "${ABSENT_CODE}" != "404" ]; then
  verifier_error "a deliberately absent /assets/__rb_absent__.txt answered ${ABSENT_CODE} instead of 404 - the static server is blanket-serving, which would make every probe above meaningless and would hide a missing bundle behind a 200 document"
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
