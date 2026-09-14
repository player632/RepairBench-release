#!/usr/bin/env bash
# RepairBench verifier for repair-angular__ng-lite-todo-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/ng-lite-todo})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/ng-lite-todo}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="dist/ng-lite-app"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/ng-lite-todo.nm.tar.gz"
if [ ! -f "${NM_TAR}" ] && [ -f "${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/ng-lite-todo.nm.tar.gz" ]; then
  NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/ng-lite-todo.nm.tar.gz"
fi
PORT="${WLB_PORT:-9224}"
BUILD_TOKEN="nlt-r24-18z20-1"
PROBE_GLOBAL="__rb_nlt"
ADAPTER_MARK="water the plants"
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
if [ ! -f "${EVAL_ROOT}/dsl_runner.mjs" ]; then
  verifier_error "EVAL_ROOT ${EVAL_ROOT} has no dsl_runner.mjs - the shared verifier runtime is not at the expected location"
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
  node -e '
    const fs = require("fs"), path = require("path");
    const target = process.argv[1], out = process.argv[2];
    const seen = [];
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else seen.push({ path: path.relative(target, p), bytes: fs.statSync(p).size }); } };
    walk(target);
    fs.writeFileSync(out, JSON.stringify({ wiped: target, at: new Date().toISOString(), files: seen.length, bytes: seen.reduce((a, f) => a + f.bytes, 0), entries: seen }, null, 1));
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 5 });
  ' "${SRC_DIR}/dist" "${LOGS_DIR}/dist_wipe_manifest.json" > "${LOGS_DIR}/dist_wipe.log" 2>&1
  echo "stale outdir wiped: rc=$? (manifest ${LOGS_DIR}/dist_wipe_manifest.json)" >> "${LOGS_DIR}/dist_wipe.log"
fi
if [ -e "${SRC_DIR}/dist" ]; then
  verifier_error "could not erase the stale ${SRC_DIR}/dist before building (see ${LOGS_DIR}/dist_wipe.log) - refusing to grade a tree whose outdir may predate this run"
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
  verifier_error "build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log). This toolchain is Angular CLI 15.2.5 / webpack 5.76.1 on node v24.20.0 and needs no --openssl-legacy-provider; a failure here is a real compile error, and since the delivered tree compiles by construction, it is almost certainly caused by the submitted edit."
fi

OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"
if [ ! -f "${OUT_INDEX}" ]; then
  verifier_error "build produced no ${OUTDIR}/index.html"
fi
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "${OUTDIR}/index.html is not newer than the build start - the build did not emit into ${OUTDIR} (stale tree)"
fi
if ! grep -q '<base href="/">' "${OUT_INDEX}"; then
  verifier_error "${OUTDIR}/index.html carries no <base href=\"/\"> - src/public/index.html was edited or the wrong index was emitted, and the site-root serve geometry below would silently 404 every hashed bundle"
fi

JS_FILES="$(find "${SRC_DIR}/${OUTDIR}" -maxdepth 1 -type f -name '*.js' -print 2>/dev/null)"
if [ -z "${JS_FILES}" ]; then
  verifier_error "no emitted *.js in ${OUTDIR} - the builder wrote somewhere else"
fi
echo "${JS_FILES}" > "${LOGS_DIR}/emitted_js.txt"
for MARK in "${BUILD_TOKEN}" "${PROBE_GLOBAL}" "${ADAPTER_MARK}"; do
  HITS="$(find "${SRC_DIR}/${OUTDIR}" -maxdepth 1 -type f -name '*.js' -exec grep -l -- "${MARK}" {} + 2>/dev/null | wc -l | tr -d ' ')"
  echo "emitted-bundle guard: marker ${MARK} present in ${HITS} emitted js file(s)" >> "${LOGS_DIR}/emitted_guards.log"
  if [ "${HITS}" -lt 1 ]; then
    verifier_error "the emitted bundle does not contain ${MARK}. ${BUILD_TOKEN} and ${PROBE_GLOBAL} come from environment/instrumentation.patch and ${ADAPTER_MARK} from environment/adaptation.patch, so a bundle without them is not from this build: either a stale dist/ng-lite-app was served or the environment patches were not applied to the tree that was built."
  fi
done
if [ ! -f "${SRC_DIR}/${OUTDIR}/favicon.ico" ]; then
  verifier_error "${OUTDIR}/favicon.ico was not emitted - the angular.json assets glob (src/public -> .) did not run, so the readiness probe for a file-pattern asset would be meaningless"
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
ALL_CODE="$(probe /tasks/all)"
ACTIVE_CODE="$(probe /tasks/active)"
COMPLETED_CODE="$(probe /tasks/completed)"
FAVICON_CODE="$(probe /favicon.ico)"
ABSENT_CODE="$(probe /assets/__rb_absent__.txt)"
echo "readiness: / ${ROOT_CODE} | /tasks/all ${ALL_CODE} | /tasks/active ${ACTIVE_CODE} | /tasks/completed ${COMPLETED_CODE} | /favicon.ico ${FAVICON_CODE} | absent /assets/__rb_absent__.txt ${ABSENT_CODE}" > "${LOGS_DIR}/readiness.txt"
fail_probe() {
  verifier_error "$1 answered $2 (expected $3) - the served directory, the SPA fallback or the emitted outdir is wrong; expected ${OUTDIR} served at the site root of 127.0.0.1:${PORT}"
}
[ "${ROOT_CODE}" = "200" ]      || fail_probe "the site root /" "${ROOT_CODE}" 200
[ "${ALL_CODE}" = "200" ]       || fail_probe "the cold deep link /tasks/all" "${ALL_CODE}" 200
[ "${ACTIVE_CODE}" = "200" ]    || fail_probe "the cold deep link /tasks/active" "${ACTIVE_CODE}" 200
[ "${COMPLETED_CODE}" = "200" ] || fail_probe "the cold deep link /tasks/completed" "${COMPLETED_CODE}" 200
[ "${FAVICON_CODE}" = "200" ]   || fail_probe "the file-pattern asset /favicon.ico" "${FAVICON_CODE}" 200
if [ "${ABSENT_CODE}" != "404" ]; then
  verifier_error "a deliberately absent /assets/__rb_absent__.txt answered ${ABSENT_CODE} instead of 404 - the static server is blanket-serving, which would make every probe above meaningless and would hide a missing bundle behind a 200 document"
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 12000 \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/exit-code.txt"

python3 - "${LOGS_DIR}/checkpoint_results.json" "${_SELF}/f2p_expected.json" "${_SELF}/p2p_expected.json" "${LOGS_DIR}/reward.json" <<'__PY__'
import json, sys
results_path, f2p_path, p2p_path, reward_path = sys.argv[1:5]
try:
    results = json.load(open(results_path))
except FileNotFoundError:
    print("VERIFIER_ERROR: no checkpoint_results.json - the runner produced nothing", file=sys.stderr)
    sys.exit(2)
verdicts = {r["id"]: r["status"] for r in results.get("checkpoint_results", [])}
f2p = json.load(open(f2p_path)); p2p = json.load(open(p2p_path))
f2p_fail = [c for c in f2p if verdicts.get(c) != "pass"]
p2p_fail = [c for c in p2p if verdicts.get(c) != "pass"]
f2p_rate = (len(f2p) - len(f2p_fail)) / len(f2p) if f2p else 1.0
p2p_rate = (len(p2p) - len(p2p_fail)) / len(p2p) if p2p else 1.0
reward = 1.0 if not f2p_fail and not p2p_fail else 0.0
summary = {
    "reward": reward,
    "score": round(100.0 * f2p_rate * p2p_rate, 4),
    "f2p": {"total": len(f2p), "passed": len(f2p) - len(f2p_fail), "failing": f2p_fail, "rate": round(f2p_rate, 6)},
    "p2p": {"total": len(p2p), "passed": len(p2p) - len(p2p_fail), "failing": p2p_fail, "rate": round(p2p_rate, 6)},
    "checkpoint_total": len(f2p) + len(p2p),
    "results_total": len(verdicts),
}
json.dump(summary, open(reward_path, "w"), indent=2)
print(json.dumps(summary))
sys.exit(0 if reward == 1.0 else 1)
__PY__
exit $?
