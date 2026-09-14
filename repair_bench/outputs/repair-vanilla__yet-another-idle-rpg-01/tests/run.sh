#!/bin/bash
# RepairBench verifier for repair-vanilla__yet-another-idle-rpg-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vanilla/yet-another-idle-rpg})
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
if [ ! -f "${PIPELINE_ROOT}/evaluation/dsl_runner.mjs" ]; then
  _w="${PKG_DIR}"
  while [ "${_w}" != "/" ]; do
    if [ -f "${_w}/evaluation/dsl_runner.mjs" ]; then PIPELINE_ROOT="${_w}"; break; fi
    _w="$(dirname "${_w}")"
  done
fi
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vanilla/yet-another-idle-rpg}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="."
PORT="${WLB_PORT:-9216}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

{
  echo "install key: 'true' (zero-dependency zero-build tree; the module graph resolves against the served source root)"
  echo "dependency directory present: $([ -d "${SRC_DIR}/node_modules" ] && echo yes || echo no)"
  echo "package manifest present: $([ -f "${SRC_DIR}/package.json" ] && echo yes || echo no)"
  echo "required file src/main.js: $([ -f "${SRC_DIR}/src/main.js" ] && echo present || echo MISSING)"
  echo "required file src/rb_probe.js: $([ -f "${SRC_DIR}/src/rb_probe.js" ] && echo present || echo MISSING)"
  echo "required file style.css: $([ -f "${SRC_DIR}/style.css" ] && echo present || echo MISSING)"
  echo "required file resources/css/material-icons-offline.css: $([ -f "${SRC_DIR}/resources/css/material-icons-offline.css" ] && echo present || echo MISSING)"
  echo "required file resources/js/HackTimer/HackTimer.min.js: $([ -f "${SRC_DIR}/resources/js/HackTimer/HackTimer.min.js" ] && echo present || echo MISSING)"
  echo "answer-leak surface dist/bundle.js present: $([ -f "${SRC_DIR}/dist/bundle.js" ] && echo YES || echo no)"
  echo "answer-leak surface dist/bundle.js.map present: $([ -f "${SRC_DIR}/dist/bundle.js.map" ] && echo YES || echo no)"
} > "${LOGS_DIR}/install.log" 2>&1
if [ ! -f "${SRC_DIR}/src/main.js" ]; then
  echo "VERIFIER_ERROR: required file src/main.js is missing - the entry document loads it as a module (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/src/rb_probe.js" ]; then
  echo "VERIFIER_ERROR: required file src/rb_probe.js is missing - the read-only probe every checkpoint reads through (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/style.css" ]; then
  echo "VERIFIER_ERROR: required file style.css is missing (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/resources/css/material-icons-offline.css" ]; then
  echo "VERIFIER_ERROR: required file resources/css/material-icons-offline.css is missing - the in-tree stand-in the adaptation put in place of a remote icon stylesheet (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/resources/js/HackTimer/HackTimer.min.js" ]; then
  echo "VERIFIER_ERROR: required file resources/js/HackTimer/HackTimer.min.js is missing - the in-tree timer shim the game loop runs on (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

{
  echo "build key: 'true' (no bundler, no transpiler, no preprocessor: the entry document loads the ES module graph as shipped)"
  echo "entry page: $([ -f "${SRC_DIR}/${OUTDIR}/index.html" ] && echo present || echo MISSING)"
  echo "entry document points at the module graph: $(grep -c '<script type="module" src="src/main.js">' "${SRC_DIR}/${OUTDIR}/index.html" 2>/dev/null || echo 0)"
  echo "entry document still points at a committed bundle: $(grep -c "^[[:space:]]*<script[^>]*src=\"dist/" "${SRC_DIR}/${OUTDIR}/index.html" 2>/dev/null || echo 0)"
} > "${LOGS_DIR}/build.log" 2>&1
if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  echo "VERIFIER_ERROR: no entry page at ${SRC_DIR}/${OUTDIR}/index.html (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}" --port "${PORT}" --no-spa >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/index.html"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
curl -s -o /dev/null "http://127.0.0.1:${PORT}/src/main.js"

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 15000 \
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
