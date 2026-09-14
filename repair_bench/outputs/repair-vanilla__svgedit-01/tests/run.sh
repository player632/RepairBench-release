#!/bin/bash
# RepairBench verifier for repair-vanilla__svgedit-01
#
# Usage: bash run.sh [src_dir]
#
#   src_dir   source tree to grade; defaults to ${WLB_APP_SRC:-<repository_root>/repo/vanilla/svgedit}
#   LOGS_DIR  directory for build, serve and runner logs (default /tmp/wlb-repair-logs)
#
# Builds the project, serves the build output, runs the checkpoint DSL and writes
# ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and the task score
#   score = 100 x f2p_rate x p2p_rate.
#
# Exit status: 0 every checkpoint passed; 1 at least one checkpoint failed;
#              2 verifier or build error; 3 dependency installation error.
set -uo pipefail

_SELF="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vanilla/svgedit}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-9221}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

if [ -d "/d/nodejs" ]; then
  export PATH="/d/nodejs:${PATH}"
fi

( cd "${SRC_DIR}" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
if [ $? -ne 0 ]; then
  echo "VERIFIER_ERROR: build failed (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

if [ ! -f "${SRC_DIR}/dist/editor/index.html" ]; then
  echo "VERIFIER_ERROR: build produced no dist/editor/index.html" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

rm -rf "${SRC_DIR}/dist/editor/tests"

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/dist/editor" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null || true; pkill -P ${SERVER_PID} 2>/dev/null || true; kill ${SERVER_PID} 2>/dev/null || true' EXIT
READY=0
for _ in $(seq 1 50); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready" >&2
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

node - "${LOGS_DIR}/checkpoint_results.json" "${_SELF}/f2p_expected.json" "${_SELF}/p2p_expected.json" "${LOGS_DIR}/reward.json" <<'__JS__'
const fs = require('fs')
const [resultsPath, f2pPath, p2pPath, rewardPath] = process.argv.slice(2)
let raw
try { raw = JSON.parse(fs.readFileSync(resultsPath, 'utf8')) } catch (e) {
  console.log(JSON.stringify({ error: 'checkpoint_results.json missing' }))
  process.exit(2)
}
const list = Array.isArray(raw) ? raw : raw.checkpoint_results
const verdicts = {}
for (const r of list) verdicts[r.id] = r.status
const f2p = JSON.parse(fs.readFileSync(f2pPath, 'utf8'))
const p2p = JSON.parse(fs.readFileSync(p2pPath, 'utf8'))
const f2pFail = f2p.filter((c) => verdicts[c] !== 'pass')
const p2pFail = p2p.filter((c) => verdicts[c] !== 'pass')
const f2pRate = f2p.length ? (f2p.length - f2pFail.length) / f2p.length : 1
const p2pRate = p2p.length ? (p2p.length - p2pFail.length) / p2p.length : 1
const reward = f2pFail.length === 0 && p2pFail.length === 0 ? 1.0 : 0.0
const summary = {
  f2p: { expected: f2p.length, passed: f2p.length - f2pFail.length, failing: f2pFail, rate: +f2pRate.toFixed(4) },
  p2p: { expected: p2p.length, passed: p2p.length - p2pFail.length, failing: p2pFail, rate: +p2pRate.toFixed(4) },
  score: +(100 * f2pRate * p2pRate).toFixed(2),
  reward
}
fs.writeFileSync(rewardPath, JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary))
process.exit(reward === 1.0 ? 0 : 1)
__JS__
exit $?
