#!/bin/bash
# RepairBench verifier for repair-solid__solid-focus-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/solid/solid-focus})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/solid/solid-focus}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-14019}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
NM_DEPOT="${PIPELINE_ROOT}/_build/tmp/s0_nm_live/solid-focus/node_modules"
NM_ARCHIVE="${PIPELINE_ROOT}/_build/tmp/s4_nm_archive/solid-focus.nm.tar.gz"
mkdir -p "${LOGS_DIR}"

if [ ! -f "${SRC_DIR}/package.json" ] || [ ! -f "${SRC_DIR}/vite.config.ts" ]; then
  echo "VERIFIER_ERROR: ${SRC_DIR} is not the solid-focus seed tree (package.json / vite.config.ts missing)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

if [ ! -d "${SRC_DIR}/node_modules" ]; then
  if [ -d "${NM_DEPOT}" ]; then
    ( cd "${SRC_DIR}" && cp -Rc "${NM_DEPOT}" . ) > "${LOGS_DIR}/nm-restore.log" 2>&1
    if [ $? -ne 0 ] || [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
      echo "VERIFIER_ERROR: node_modules restore from ${NM_DEPOT} failed (see ${LOGS_DIR}/nm-restore.log)" >&2
      echo 2 > "${LOGS_DIR}/exit-code.txt"
      exit 2
    fi
    echo "nm-from-stage-dependency cache ${NM_DEPOT}" > "${LOGS_DIR}/nm-supply.txt"
  elif [ -f "${NM_ARCHIVE}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_ARCHIVE}" ) > "${LOGS_DIR}/nm-restore.log" 2>&1
    if [ $? -ne 0 ] || [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
      echo "VERIFIER_ERROR: node_modules restore from ${NM_ARCHIVE} failed (see ${LOGS_DIR}/nm-restore.log)" >&2
      echo 2 > "${LOGS_DIR}/exit-code.txt"
      exit 2
    fi
    echo "nm-from-archive ${NM_ARCHIVE}" > "${LOGS_DIR}/nm-supply.txt"
  else
    echo "nm-dependency cache-absent: falling back to the manifest's own resolving key (needs a registry)" > "${LOGS_DIR}/nm-supply.txt"
    ( cd "${SRC_DIR}" && pnpm install --no-frozen-lockfile --reporter=append-only ) > "${LOGS_DIR}/nm-restore.log" 2>&1
    if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
      echo "VERIFIER_ERROR: no dependency supply available (dependency cache ${NM_DEPOT} absent and pnpm install could not produce node_modules/.bin/vite; see ${LOGS_DIR}/nm-restore.log)" >&2
      echo 2 > "${LOGS_DIR}/exit-code.txt"
      exit 2
    fi
  fi
else
  echo "nm-already-present" > "${LOGS_DIR}/nm-supply.txt"
fi

node -e 'const fs=require("fs");fs.rmSync(process.argv[1],{recursive:true,force:true});' "${SRC_DIR}/dist"

( cd "${SRC_DIR}" && ./node_modules/.bin/vite build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ] || [ ! -f "${SRC_DIR}/dist/index.html" ]; then
  echo "VERIFIER_ERROR: build failed rc=${BUILD_RC} or dist/index.html missing (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/dist" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 100); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready on port ${PORT}" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 15000 \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/exit-code.txt"
if [ "${RUNNER_EXIT}" -gt 1 ]; then
  echo "VERIFIER_ERROR: dsl_runner exited ${RUNNER_EXIT} (a runner/usage fault, not a behaviour verdict; see ${LOGS_DIR}/runner-stdout.txt)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

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
    "verifier_exit_code": 0 if reward == 1.0 else 1,
}
json.dump(summary, open(reward_path, "w"), indent=2)
print(json.dumps(summary))
sys.exit(0 if reward == 1.0 else 1)
__PY__
PY_EXIT=$?
printf '%s\n' "${PY_EXIT}" > "${LOGS_DIR}/exit-code.txt"
exit "${PY_EXIT}"
