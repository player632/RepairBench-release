#!/bin/bash
# RepairBench verifier for repair-solid__solid-primitives-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/solid/solid-primitives})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/solid/solid-primitives}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="site/dist/client"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/solid-primitives.nm.tar.gz"
PORT="${WLB_PORT:-12003}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

fail2() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  fail2 "source tree not found: ${SRC_DIR}"
fi
if [ ! -d "${SRC_DIR}/site" ]; then
  fail2 "${SRC_DIR}/site is absent - this instance verifies the documentation SITE, not a library package"
fi

if [ ! -d "${SRC_DIR}/node_modules/.pnpm" ] || [ ! -d "${SRC_DIR}/site/node_modules" ]; then
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" -C . ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: frozen pnpm dependency archive (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${SRC_DIR}" && pnpm install --no-frozen-lockfile --reporter=append-only ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: pnpm against the local store (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -d "${SRC_DIR}/node_modules/.pnpm" ] || [ ! -d "${SRC_DIR}/site/node_modules" ]; then
  fail2 "no usable workspace node_modules (see ${LOGS_DIR}/install.log)"
fi

node -e 'const fs=require("fs");const d=process.argv[1];for(const p of ["/site/dist","/site/.output","/site/src/_generated","/site/node_modules/.vite","/scripts/utils/_temp_calculate-bundlesize"])fs.rmSync(d+p,{recursive:true,force:true});' "${SRC_DIR}"

( cd "${SRC_DIR}" && pnpm -dir site run generate && pnpm -dir site run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
node -e 'const fs=require("fs");fs.rmSync(process.argv[1]+"/scripts/utils/_temp_calculate-bundlesize",{recursive:true,force:true});' "${SRC_DIR}"
if [ "${BUILD_RC}" -ne 0 ]; then
  fail2 "build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log)"
fi

if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  fail2 "the build reported success but ${OUTDIR}/index.html is absent - there is no static output to serve"
fi
if [ ! -f "${SRC_DIR}/${OUTDIR}/playground/keyboard/index.html" ]; then
  fail2 "${OUTDIR}/playground/keyboard/index.html is absent - the prerender step did not emit the playground documents every checkpoint navigates to"
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" --no-spa >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/playground/keyboard/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  fail2 "static server not ready on port ${PORT} (probed /playground/keyboard/)"
fi

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
}
json.dump(summary, open(reward_path, "w"), indent=2)
print(json.dumps(summary))
sys.exit(0 if reward == 1.0 else 1)
__PY__
exit $?
