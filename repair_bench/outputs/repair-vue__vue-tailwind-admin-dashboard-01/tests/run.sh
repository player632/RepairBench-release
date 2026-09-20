#!/bin/bash
# RepairBench verifier for repair-vue__vue-tailwind-admin-dashboard-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vue/vue-tailwind-admin-dashboard})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vue/vue-tailwind-admin-dashboard}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-9205}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verr() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

[ -f "${SRC_DIR}/package.json" ] || verr "${SRC_DIR}/package.json not found"
[ -f "${SRC_DIR}/src/main.ts" ] || verr "${SRC_DIR}/src/main.ts not found"
grep -q "__RB__" "${SRC_DIR}/src/main.ts" || verr "src/main.ts carries no __RB__ bridge - the instrumentation patch is missing from this tree"
[ -f "${SRC_DIR}/src/assets/main.css" ] || verr "${SRC_DIR}/src/assets/main.css not found"
grep -q "fonts.googleapis.com" "${SRC_DIR}/src/assets/main.css" && verr "src/assets/main.css still imports Google Fonts - the adaptation patch is missing (the verifier must run offline)"
[ -d "${SRC_DIR}/node_modules" ] || verr "${SRC_DIR}/node_modules absent - run the install step first (npm install --no-audit --no-fund)"
[ -x "${SRC_DIR}/node_modules/.bin/vite" ] || verr "${SRC_DIR}/node_modules/.bin/vite missing or not executable - the install step did not complete; do NOT fall back to npx (it would substitute a foreign vite major)"

BUILD_START="$(date +%s)"
( cd "${SRC_DIR}" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_EXIT=$?
if [ "${BUILD_EXIT}" -ne 0 ]; then
  echo "VERIFIER_ERROR: production build failed (exit ${BUILD_EXIT}); last 40 lines:" >&2
  tail -40 "${LOGS_DIR}/build.log" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
[ -f "${SRC_DIR}/dist/index.html" ] || verr "build produced no dist/index.html (outdir is dist)"
grep -rq "__RB__" "${SRC_DIR}/dist" || verr "freshness check: the instrumentation signature is absent from the built bundle - refusing to serve a stale or uninstrumented build"
NEWEST="$(find "${SRC_DIR}/dist" -type f -newer "${SRC_DIR}/package.json" | head -1)"
[ -n "${NEWEST}" ] || verr "freshness check: no file in dist/ is newer than package.json - the build did not write the bundle"
echo "build ok in $(( $(date +%s) - BUILD_START ))s; served bundle carries the __RB__ instrumentation signature" > "${LOGS_DIR}/build-freshness.txt"

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/dist" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
cleanup() {
  touch "${SUP_STOP}" 2>/dev/null
  pkill -P "${SERVER_PID}" 2>/dev/null
  kill "${SERVER_PID}" 2>/dev/null
  return 0
}
trap cleanup EXIT
READY=0
for _ in $(seq 1 80); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/index.html"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready on port ${PORT}" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

DEEP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/basic-tables")"
echo "deep-link /basic-tables -> HTTP ${DEEP_CODE}" > "${LOGS_DIR}/deeplink.txt"
if [ "${DEEP_CODE}" != "200" ]; then
  echo "VERIFIER_ERROR: SPA fallback did not answer the history-mode deep link /basic-tables (HTTP ${DEEP_CODE})" >&2
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
