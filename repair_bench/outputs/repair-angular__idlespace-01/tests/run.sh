#!/bin/bash
# RepairBench verifier for repair-angular__idlespace-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/idlespace})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/idlespace}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
GATE_DIR="${WLB_GATE_DIR:-${PIPELINE_ROOT}/_build/gates/idlespace}"
SHIM="${_SELF}/http-parser-shim.js"
OUT_REL="dist/IdleSpace"
PORT="${WLB_PORT:-8919}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

case "${SRC_DIR}" in
  */_build/gates/*)
    echo "VERIFIER_ERROR: refusing to build inside the read-only support directory ${SRC_DIR}; pass a working copy of the seed tree" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
    ;;
esac

if [ ! -f "${SRC_DIR}/package.json" ] || [ ! -f "${SRC_DIR}/angular.json" ]; then
  echo "VERIFIER_ERROR: ${SRC_DIR} is not the IdleSpace workspace (package.json/angular.json missing)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

if [ ! -e "${SRC_DIR}/node_modules" ]; then
  if [ ! -d "${GATE_DIR}/node_modules" ]; then
    echo "VERIFIER_ERROR: no node_modules in ${SRC_DIR} and none to copy from ${GATE_DIR}" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
  fi
  if [ "${WLB_NM_MODE:-copy}" = "link" ]; then
    ln -s "${GATE_DIR}/node_modules" "${SRC_DIR}/node_modules"
  else
    cp -Rc "${GATE_DIR}/node_modules" "${SRC_DIR}/node_modules"
  fi
  if [ ! -e "${SRC_DIR}/node_modules/@angular/cli" ]; then
    echo "VERIFIER_ERROR: dependency tree is incomplete (@angular/cli missing)" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
  fi
  echo "dependencies supplied (${WLB_NM_MODE:-copy}) from ${GATE_DIR}/node_modules"
fi

if ! grep -q "__rb = { ms: this.ms, os: this.os }" "${SRC_DIR}/src/app/app.component.ts"; then
  echo "VERIFIER_ERROR: probe bridge missing from src/app/app.component.ts - this is not the instrumented state" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if ! grep -q 'data-testid="rb-topnav"' "${SRC_DIR}/src/app/app.component.html"; then
  echo "VERIFIER_ERROR: data-testid probes missing from src/app/app.component.html - this is not the instrumented state" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

if [ ! -f "${SRC_DIR}/src/assets/vendor/jquery-3.3.1.slim.min.js" ]; then
  echo "VERIFIER_WARN: vendored jQuery missing from src/assets/vendor/ - adaptation.patch not applied" >&2
fi

if [ -d "${SRC_DIR}/${OUT_REL}" ]; then
  rm -rf "${SRC_DIR}/${OUT_REL}"
fi
(
  cd "${SRC_DIR}" &&
  NODE_OPTIONS="--openssl-legacy-provider --require ${SHIM}" npm run build
) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: build failed with exit ${BUILD_RC} (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/${OUT_REL}/index.html" ]; then
  echo "VERIFIER_ERROR: build succeeded but produced no ${OUT_REL}/index.html" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/${OUT_REL}/assets/vendor/jquery-3.3.1.slim.min.js" ]; then
  echo "VERIFIER_WARN: vendored jQuery did not reach ${OUT_REL}/assets/vendor/ - check the angular.json asset entry" >&2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUT_REL}" --port "${PORT}" > "${LOGS_DIR}/serve.log" 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null || true; pkill -P ${SERVER_PID} 2>/dev/null || true; kill ${SERVER_PID} 2>/dev/null || true' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/index.html"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready on port ${PORT} (see ${LOGS_DIR}/serve.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 25000 \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/runner-exit.txt"
if [ "${RUNNER_EXIT}" -eq 4 ]; then
  echo "VERIFIER_ERROR: dsl_runner crashed (see ${LOGS_DIR}/runner-stdout.txt)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

python3 - "${LOGS_DIR}/checkpoint_results.json" "${_SELF}/f2p_expected.json" "${_SELF}/p2p_expected.json" "${LOGS_DIR}/reward.json" <<'__PY__'
import json, sys
results_path, f2p_path, p2p_path, reward_path = sys.argv[1:5]
try:
    results = json.load(open(results_path))
except FileNotFoundError:
    print(json.dumps({"error": "checkpoint_results.json missing"}))
    sys.exit(2)
verdicts = {r["id"]: r["status"] for r in results.get("checkpoint_results", [])}
f2p = json.load(open(f2p_path))
p2p = json.load(open(p2p_path))
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
sys.exit(0 if reward == 1.0 else 1)
__PY__
RC=$?
printf '%s\n' "${RC}" > "${LOGS_DIR}/exit-code.txt"
exit "${RC}"
