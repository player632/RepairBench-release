#!/bin/bash
# RepairBench verifier for repair-vue__vite-vue3-lowcode-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vue/vite-vue3-lowcode})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -u

_SELF="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vue/vite-vue3-lowcode}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-12099}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
OUT_REL="dist"
GATE_NM="${PIPELINE_ROOT}/_build/gates/vite-vue3-lowcode/node_modules"
mkdir -p "${LOGS_DIR}"

fail2() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  fail2 "source tree not found: ${SRC_DIR}"
fi
if [ ! -f "${SRC_DIR}/package.json" ]; then
  fail2 "package.json absent under ${SRC_DIR} - this is not the vite-vue3-lowcode tree the recipe was measured on"
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  if [ -d "${GATE_NM}" ]; then
    ( cd "${SRC_DIR}" && cp -Rc "${GATE_NM}" . ) > "${LOGS_DIR}/install.log" 2>&1
    if [ $? -ne 0 ]; then
      fail2 "node_modules copy from the read-only support directory failed (see ${LOGS_DIR}/install.log): ${GATE_NM}"
    fi
    echo "install: node_modules cloned from ${GATE_NM}"
  else
    echo "WARNING: ${GATE_NM} is absent, falling back to a registry install which needs network and will fail when network access is disabled." >&2
    ( cd "${SRC_DIR}" && COREPACK_ENABLE_PROJECT_SPEC=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm@7.33.7 install --frozen-lockfile --reporter=append-only ) > "${LOGS_DIR}/install.log" 2>&1
    if [ $? -ne 0 ]; then
      fail2 "dependency install failed (see ${LOGS_DIR}/install.log)"
    fi
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  fail2 "build tooling absent after install (node_modules/.bin/vite) - the state tree is not buildable"
fi

( cd "${SRC_DIR}" && ./node_modules/.bin/rimraf dist && NODE_ENV=production ./node_modules/.bin/vite build ) > "${LOGS_DIR}/build.log" 2>&1
if [ $? -ne 0 ]; then
  fail2 "build failed (see ${LOGS_DIR}/build.log)"
fi

SERVE_DIR="${SRC_DIR}/${OUT_REL}"
if [ ! -f "${SERVE_DIR}/index.html" ]; then
  fail2 "the build reported success but ${OUT_REL}/index.html is absent - there is no static output to serve"
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SERVE_DIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  fail2 "static server not ready on port ${PORT}"
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 15000 \
  --out "${LOGS_DIR}/checkpoint_results.json" \
  --task repair-vue__vite-vue3-lowcode-01 > "${LOGS_DIR}/runner-stdout.txt" 2>&1
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
