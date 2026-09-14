#!/bin/bash
# RepairBench verifier for repair-vue__bitmappery-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vue/bitmappery})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vue/bitmappery}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUT_DIR="${WLB_OUT_DIR:-${SRC_DIR}/dist}"

PORT="${WLB_PORT:-8937}"

LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

fail() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

[ -f "${SRC_DIR}/index.html" ]        || fail "${SRC_DIR}/index.html not found"
[ -f "${SRC_DIR}/vite.config.js" ]    || fail "${SRC_DIR}/vite.config.js not found - wrong source root"
[ -f "${SRC_DIR}/src/main.js" ]       || fail "${SRC_DIR}/src/main.js not found - the vite entry is missing"
[ -f "${SRC_DIR}/src/probe.js" ]      || fail "${SRC_DIR}/src/probe.js not found - instrumentation.patch was not applied, so window.__BMPQ__/__BMPX__/__BMPF__ do not exist and every checkpoint would be vacuously red"
grep -q "installProbe" "${SRC_DIR}/src/main.js" \
  || fail "${SRC_DIR}/src/main.js does not install the probe bridge - instrumentation.patch was not applied"
[ ! -d "${SRC_DIR}/tests" ]           || fail "${SRC_DIR}/tests still present - the seed test suite was not removed from the answering copy, and five of its specs state the expected value of five injected defect sites verbatim"
[ -x "${SRC_DIR}/node_modules/.bin/vite" ] \
  || fail "${SRC_DIR}/node_modules/.bin/vite not executable - node_modules was not supplied. This verifier never runs npm install (network access is disabled); copy a prepared node_modules tree into the source directory before grading."

BUILD_MARK="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_MARK}"
( cd "${SRC_DIR}" && npx vite build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_EXIT=$?
if [ "${BUILD_EXIT}" -ne 0 ]; then
  tail -40 "${LOGS_DIR}/build.log" >&2
  fail "vite build failed with exit ${BUILD_EXIT} (see ${LOGS_DIR}/build.log)"
fi

[ -f "${OUT_DIR}/index.html" ] || fail "build produced no ${OUT_DIR}/index.html - the inferred outdir dist is wrong for this tree, re-check vite.config.js build.outDir"
[ "${OUT_DIR}/index.html" -nt "${BUILD_MARK}" ] \
  || fail "${OUT_DIR}/index.html is not newer than this build - a stale dist/ would be served and it would predate every patch"
grep -rq "__BMPQ__" "${OUT_DIR}" \
  || fail "the built bundle in ${OUT_DIR} contains no __BMPQ__ - probe.js did not make it into the build, so the served page has no harness bridge"
rm -f "${BUILD_MARK}"

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do
    node "${EVAL_ROOT}/serve_static.mjs" --dir "${OUT_DIR}" --port "${PORT}" >> "${LOGS_DIR}/server.log" 2>&1
    sleep 0.4
  done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null || true; pkill -P ${SERVER_PID} 2>/dev/null || true; kill ${SERVER_PID} 2>/dev/null || true; wait ${SERVER_PID} 2>/dev/null || true' EXIT
READY=0
for _ in $(seq 1 100); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/index.html"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  tail -20 "${LOGS_DIR}/server.log" >&2
  fail "static server not ready on port ${PORT} (see ${LOGS_DIR}/server.log)"
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 20000 \
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
