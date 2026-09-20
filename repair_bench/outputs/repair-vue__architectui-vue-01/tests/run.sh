#!/bin/bash
# RepairBench verifier for repair-vue__architectui-vue-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vue/architectui-vue})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
_SELF="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vue/architectui-vue}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="dist"
NM_ARCH="${WLB_NM_ARCH:-${PIPELINE_ROOT}/_build/tmp/s4_nm_archive/architectui-vue.nm.tar.gz}"
PORT="${WLB_PORT:-12154}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

node -e '
const fs = require("fs"), path = require("path");
const root = path.resolve(process.argv[1]);
const gone = [];
const kill = (p) => { try { if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); gone.push(path.relative(root, p)); } } catch (e) { console.error("stale-clear failed for " + p + ": " + e.message); process.exitCode = 3; } };
for (const n of ["dist", "dist-ssr", ".vite", "node_modules/.vite", "node_modules/.cache", "coverage", "stats.html"]) kill(path.join(root, n));
console.log("stale-cleared " + gone.length + (gone.length ? ": " + gone.join(", ") : ""));
' "${SRC_DIR}"
if [ $? -ne 0 ]; then
  echo "VERIFIER_ERROR: stale-artifact clearing failed" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

ensure_nm () {
  if [ -x "${SRC_DIR}/node_modules/.bin/vite" ] && [ -x "${SRC_DIR}/node_modules/.bin/vue-tsc" ]; then
    echo "nm-present-in-tree"
  elif [ -f "${NM_ARCH}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_ARCH}" -C . ) && echo "nm-from-frozen-archive-s4"
  else
    echo "nm-absent-using-registered-resolving-recipe"
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund --no-package-lock )
  fi
}
ensure_nm > "${LOGS_DIR}/nm.log" 2>&1
NM_RC=$?
cat "${LOGS_DIR}/nm.log"
if [ "${NM_RC}" -ne 0 ] || [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ] || [ ! -x "${SRC_DIR}/node_modules/.bin/vue-tsc" ]; then
  echo "VERIFIER_ERROR: node_modules acquisition failed (see ${LOGS_DIR}/nm.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

( cd "${SRC_DIR}" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  echo "VERIFIER_ERROR: build rc=0 but ${OUTDIR}/index.html is absent - refusing to serve a stale or empty outdir" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
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
  --timeout 30000 \
  --task repair-vue__architectui-vue-01 \
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
