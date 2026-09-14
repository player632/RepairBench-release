#!/bin/bash
# RepairBench verifier for repair-react__word-master-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/react/word-master})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -uo pipefail

_SELF="$(dirname "$0")"
_SELF="$(cd "${_SELF}" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/react/word-master}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="build"
PORT="${WLB_PORT:-12086}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

if [ ! -d "${SRC_DIR}" ]; then
  echo "VERIFIER_ERROR: source tree not found: ${SRC_DIR}" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

if [ ! -d "${SRC_DIR}/node_modules/react-scripts" ]; then
  NM_S5="${PIPELINE_ROOT}/_build/tmp/s5_nm_archive/word-master.nm.tar.gz"
  NM_S3="${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/word-master.nm.tar.gz"
  NM_GATE="${PIPELINE_ROOT}/_build/gates/word-master/node_modules"
  if [ -f "${NM_S5}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_S5}" -C . ) > "${LOGS_DIR}/install.log" 2>&1 && echo "nm-from-frozen-archive ${NM_S5}" >> "${LOGS_DIR}/install.log"
  elif [ -f "${NM_S3}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_S3}" -C . ) > "${LOGS_DIR}/install.log" 2>&1 && echo "nm-from-s3-origin" >> "${LOGS_DIR}/install.log"
  elif [ -d "${NM_GATE}" ]; then
    ( cd "${SRC_DIR}" && cp -Rc "${NM_GATE}" . ) > "${LOGS_DIR}/install.log" 2>&1 && echo "nm-from-build-workspace-cache" >> "${LOGS_DIR}/install.log"
  else
    echo "VERIFIER_ERROR: no dependency source available (frozen archives and build-workspace cache all absent) and network access is disabled" >&2
    echo 3 > "${LOGS_DIR}/exit-code.txt"
    exit 3
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/react-scripts" ]; then
  echo "VERIFIER_ERROR: node_modules present but react-scripts binary is not executable" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node -e 'const fs=require("fs");const p=process.argv[1];fs.rmSync(p,{recursive:true,force:true});console.log("stale-outdir-removed "+p)' "${SRC_DIR}/${OUTDIR}" >> "${LOGS_DIR}/install.log" 2>&1

( cd "${SRC_DIR}" && CI=false ./node_modules/.bin/react-scripts build ) > "${LOGS_DIR}/build.log" 2>&1
if [ $? -ne 0 ]; then
  echo "VERIFIER_ERROR: build failed (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  echo "VERIFIER_ERROR: build produced no ${OUTDIR}/index.html" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" --no-spa > "${LOGS_DIR}/serve.log" 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null || true; pkill -P ${SERVER_PID} 2>/dev/null || true; kill ${SERVER_PID} 2>/dev/null || true' EXIT
READY=0
for _ in $(seq 1 60); do
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
