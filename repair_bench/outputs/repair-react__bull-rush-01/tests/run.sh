#!/bin/bash
# RepairBench verifier for repair-react__bull-rush-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/react/bull-rush})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/react/bull-rush}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-8922}"
OUTDIR="dist"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

fail2() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

[ -n "${SRC_DIR}" ] && [ -d "${SRC_DIR}" ] || fail2 "source directory '${SRC_DIR}' not found"
[ -f "${SRC_DIR}/package.json" ] || fail2 "${SRC_DIR}/package.json not found"

BUILD_MARK="${LOGS_DIR}/.build-mark"
date +%s > "${BUILD_MARK}"
if [ -d "${SRC_DIR}/${OUTDIR}" ]; then
  echo "removing stale ${OUTDIR}/ ($(find "${SRC_DIR}/${OUTDIR}" -type f 2>/dev/null | wc -l | tr -d ' ') files) before rebuild"
  rm -rf "${SRC_DIR:?}/${OUTDIR:?}"
fi

VITE_BIN="${SRC_DIR}/node_modules/.bin/vite"
if [ -x "${VITE_BIN}" ]; then
  ( cd "${SRC_DIR}" && "${VITE_BIN}" build ) > "${LOGS_DIR}/build-stdout.txt" 2>&1
  BUILD_EXIT=$?
else
  ( cd "${SRC_DIR}" && npx --no-install vite build ) > "${LOGS_DIR}/build-stdout.txt" 2>&1
  BUILD_EXIT=$?
fi
if [ "${BUILD_EXIT}" -ne 0 ]; then
  tail -40 "${LOGS_DIR}/build-stdout.txt" >&2
  fail2 "build failed with exit ${BUILD_EXIT} (see build-stdout.txt)"
fi

[ -f "${SRC_DIR}/${OUTDIR}/index.html" ] || fail2 "${OUTDIR}/index.html not emitted by the build"
if [ -z "$(find "${SRC_DIR}/${OUTDIR}/index.html" -newer "${BUILD_MARK}" -print 2>/dev/null)" ]; then
  fail2 "${OUTDIR}/index.html is not newer than the build mark - serving a stale artifact"
fi

if ! grep -rlq "data-testid" "${SRC_DIR}/${OUTDIR}" 2>/dev/null; then
  fail2 "the built bundle carries no probe signature - instrumentation is missing from the served state (infra, not behaviour)"
fi
if [ ! -d "${SRC_DIR}/server" ] && [ ! -d "${SRC_DIR}/scripts" ]; then
  echo "note: seed-side verification facilities already removed by instrumentation"
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/index.html"; then READY=1; break; fi
  sleep 0.3
done
[ "${READY}" -eq 1 ] || fail2 "static server not ready on port ${PORT}"

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
json.dump(summary, open(reward_path, "w"), indent=1)
print(json.dumps(summary))
sys.exit(0)
__PY__
exit "${RUNNER_EXIT}"

