#!/bin/bash
# RepairBench verifier for repair-vue__ogame-vue-ts-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vue/ogame-vue-ts})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vue/ogame-vue-ts}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUT_DIR="${WLB_OUT_DIR:-${SRC_DIR}/dist}"
PORT="${WLB_PORT:-12231}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

fail() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

[ -f "${SRC_DIR}/index.html" ]        || fail "${SRC_DIR}/index.html not found - wrong source root"
[ -f "${SRC_DIR}/vite.config.ts" ]    || fail "${SRC_DIR}/vite.config.ts not found - wrong source root (this seed is vite + TypeScript)"
[ -f "${SRC_DIR}/src/main.ts" ]       || fail "${SRC_DIR}/src/main.ts not found - the vite entry is missing"
[ -f "${SRC_DIR}/src/rb-probe.ts" ]   || fail "${SRC_DIR}/src/rb-probe.ts not found - environment/instrumentation.patch was not applied, so window.__rb does not exist and all 35 checkpoints would be vacuously red"
grep -q "rb-probe" "${SRC_DIR}/src/main.ts" \
  || fail "${SRC_DIR}/src/main.ts does not import './rb-probe' - instrumentation.patch was not applied"
grep -q "outDir" "${SRC_DIR}/vite.config.ts" && grep -q "'dist'" "${SRC_DIR}/vite.config.ts" \
  || fail "${SRC_DIR}/vite.config.ts does not build to dist - environment/adaptation.patch was not applied, so the build would overwrite the seed's checked-in docs/ bundle"
grep -q "51.la" "${SRC_DIR}/index.html" \
  && fail "${SRC_DIR}/index.html still loads the 51.la analytics script - environment/adaptation.patch was not applied and the run would not be offline"
[ ! -e "${SRC_DIR}/docs" ]            || fail "${SRC_DIR}/docs still present - the upstream published bundle is a build product, not seed source; leaving it in the answering copy ships a CLEAN pre-mutation bundle next to dist/ (leakage)"
[ -x "${SRC_DIR}/node_modules/.bin/vite" ] \
  || fail "${SRC_DIR}/node_modules/.bin/vite not executable - node_modules was not copied in. This verifier never runs npm install (network access is disabled); use the prepared cp -Rc <gate>/node_modules ."

BUILD_MARK="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_MARK}"
( cd "${SRC_DIR}" && npx vite build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_EXIT=$?
if [ "${BUILD_EXIT}" -ne 0 ]; then
  tail -40 "${LOGS_DIR}/build.log" >&2
  fail "vite build failed with exit ${BUILD_EXIT} (see ${LOGS_DIR}/build.log)"
fi
[ -f "${OUT_DIR}/index.html" ] || fail "build produced no ${OUT_DIR}/index.html - re-check vite.config.ts build.outDir"
[ "${OUT_DIR}/index.html" -nt "${BUILD_MARK}" ] \
  || fail "${OUT_DIR}/index.html is not newer than this build - a STALE dist/ would be served and it would predate every patch"
grep -rq "__rb" "${OUT_DIR}" \
  || fail "the built bundle in ${OUT_DIR} contains no __rb - src/rb-probe.ts did not make it into the build, so the served page has no measurement bridge"
grep -q "51.la" "${OUT_DIR}/index.html" \
  && fail "the built ${OUT_DIR}/index.html still references 51.la - the run is not offline"
[ ! -f "${OUT_DIR}/sw.js" ] || fail "${OUT_DIR}/sw.js was emitted - VitePWA is still registered in vite.config.ts and a service worker could serve a stale bundle between arms"
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
