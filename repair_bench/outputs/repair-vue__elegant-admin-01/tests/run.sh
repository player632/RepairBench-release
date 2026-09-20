#!/bin/bash
# RepairBench verifier for repair-vue__elegant-admin-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vue/elegant-admin})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vue/elegant-admin}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-12015}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verr() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

case "${SRC_DIR}" in
  */_build/gates/*) verr "SRC_DIR resolves inside _build/gates (${SRC_DIR}) - a read-only support directory is a design reference and must never be built, mutated or served" ;;
  */_build/design/*) verr "SRC_DIR resolves inside _build/design (${SRC_DIR}) - that is the package tree, not an answering workspace" ;;
esac
[ -d "${SRC_DIR}" ] || verr "source tree not found: ${SRC_DIR} (pass it as $1 or via WLB_APP_SRC; there is deliberately no gate-clone fallback)"
[ -f "${SRC_DIR}/package.json" ] || verr "${SRC_DIR}/package.json not found"
[ -f "${SRC_DIR}/src/main.ts" ] || verr "${SRC_DIR}/src/main.ts not found"
[ -f "${SRC_DIR}/vite.config.ts" ] || verr "${SRC_DIR}/vite.config.ts not found - wrong seed tree?"
grep -q "rb-probe" "${SRC_DIR}/src/main.ts" || verr "src/main.ts carries no rb-probe import - environment/instrumentation.patch is missing from this tree"
[ -f "${SRC_DIR}/src/rb-probe.ts" ] || verr "src/rb-probe.ts absent - environment/instrumentation.patch is missing from this tree"
grep -q "__EAD__" "${SRC_DIR}/src/rb-probe.ts" || verr "src/rb-probe.ts does not publish the __EAD__ bridge - the instrumentation patch in this tree is not this task probe"
grep -q "open: false" "${SRC_DIR}/vite/plugins/visualizer.ts" || verr "vite/plugins/visualizer.ts still has open:true - environment/adaptation.patch is missing, and the post-build browser spawn would hang an unattended verifier"
if grep -q "aliyuncs.com" "${SRC_DIR}/src/mock/user.ts"; then verr "src/mock/user.ts still points the login avatar at an external OSS host - environment/adaptation.patch is missing and the graded state would not be offline-deterministic"; fi
if grep -q "aliyuncs.com" "${SRC_DIR}/src/setting/config.ts"; then verr "src/setting/config.ts still carries the external ossPath - environment/adaptation.patch is missing"; fi
[ -d "${SRC_DIR}/node_modules" ] || verr "${SRC_DIR}/node_modules absent - run the install step first (roster literal npm install --no-audit --no-fund is rejected by preinstall only-allow pnpm; the effective install is pnpm install)"
[ -x "${SRC_DIR}/node_modules/.bin/vite" ] || verr "${SRC_DIR}/node_modules/.bin/vite missing or not executable - the install step did not complete; do NOT fall back to npx (it would substitute a foreign vite major)"

node -e 'const fs=require("fs");const d=process.argv[1];for(const p of [d+"/dist",d+"/stats.html"])fs.rmSync(p,{recursive:true,force:true});' "${SRC_DIR}"

BUILD_START="$(date +%s)"
( cd "${SRC_DIR}" && npm run build:test ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_EXIT=$?
if [ "${BUILD_EXIT}" -ne 0 ]; then
  echo "VERIFIER_ERROR: production build failed (exit ${BUILD_EXIT}); last 40 lines:" >&2
  tail -40 "${LOGS_DIR}/build.log" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
BUILD_SECONDS=$(( $(date +%s) - BUILD_START ))

[ -f "${SRC_DIR}/dist/index.html" ] || verr "build produced no dist/index.html (roster outdir is dist)"
grep -rq "__EAD__" "${SRC_DIR}/dist" || verr "freshness check: the __EAD__ instrumentation signature is absent from the built bundle - refusing to serve a stale or uninstrumented build"
NEWEST="$(find "${SRC_DIR}/dist" -type f -newer "${SRC_DIR}/package.json" | head -1)"
[ -n "${NEWEST}" ] || verr "freshness check: no file in dist/ is newer than package.json - the build did not write the bundle"
echo "build ok in ${BUILD_SECONDS}s; served bundle carries the __EAD__ instrumentation signature (no digest comparison: this seed dist is nondeterministic across cold builds)" > "${LOGS_DIR}/build-freshness.txt"

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

ROOT_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/")"
echo "root / -> HTTP ${ROOT_CODE} (hash router: createWebHashHistory, src/router/index.ts:17)" > "${LOGS_DIR}/deeplink.txt"
if [ "${ROOT_CODE}" != "200" ]; then
  echo "VERIFIER_ERROR: the static server did not answer / with 200 (HTTP ${ROOT_CODE})" >&2
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
