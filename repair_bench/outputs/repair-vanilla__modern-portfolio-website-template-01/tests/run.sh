#!/bin/bash
# RepairBench verifier for repair-vanilla__modern-portfolio-website-template-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vanilla/modern-portfolio-website-template})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vanilla/modern-portfolio-website-template}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="."
PORT="${WLB_PORT:-9245}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

{
  echo "install key: 'true' (zero-dependency zero-build tree; the two behaviour-carrying libraries are vendored under assets/*/vendor by environment/adaptation.patch)"
  echo "dependency directory present: $([ -d "${SRC_DIR}/node_modules" ] && echo yes || echo no)"
  echo "package manifest present: $([ -f "${SRC_DIR}/package.json" ] && echo yes || echo no)"
  echo "required file assets/css/vendor/aos.css: $([ -f "${SRC_DIR}/assets/css/vendor/aos.css" ] && echo present || echo MISSING)"
  echo "required file assets/js/vendor/aos.js: $([ -f "${SRC_DIR}/assets/js/vendor/aos.js" ] && echo present || echo MISSING)"
  echo "required file assets/js/vendor/typed.min.js: $([ -f "${SRC_DIR}/assets/js/vendor/typed.min.js" ] && echo present || echo MISSING)"
  echo "required file assets/css/icons-offline.css: $([ -f "${SRC_DIR}/assets/css/icons-offline.css" ] && echo present || echo MISSING)"
  echo "required file assets/img/testimonial-placeholder.svg: $([ -f "${SRC_DIR}/assets/img/testimonial-placeholder.svg" ] && echo present || echo MISSING)"
  echo "required file assets/js/swiper-bundle.min.js: $([ -f "${SRC_DIR}/assets/js/swiper-bundle.min.js" ] && echo present || echo MISSING)"
  echo "required file assets/css/swiper-bundle.min.css: $([ -f "${SRC_DIR}/assets/css/swiper-bundle.min.css" ] && echo present || echo MISSING)"
} > "${LOGS_DIR}/install.log" 2>&1
if [ ! -f "${SRC_DIR}/assets/css/vendor/aos.css" ]; then
  echo "VERIFIER_ERROR: required file assets/css/vendor/aos.css is missing (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/assets/js/vendor/aos.js" ]; then
  echo "VERIFIER_ERROR: required file assets/js/vendor/aos.js is missing (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/assets/js/vendor/typed.min.js" ]; then
  echo "VERIFIER_ERROR: required file assets/js/vendor/typed.min.js is missing (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/assets/css/icons-offline.css" ]; then
  echo "VERIFIER_ERROR: required file assets/css/icons-offline.css is missing (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/assets/img/testimonial-placeholder.svg" ]; then
  echo "VERIFIER_ERROR: required file assets/img/testimonial-placeholder.svg is missing (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/assets/js/swiper-bundle.min.js" ]; then
  echo "VERIFIER_ERROR: required file assets/js/swiper-bundle.min.js is missing (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/assets/css/swiper-bundle.min.css" ]; then
  echo "VERIFIER_ERROR: required file assets/css/swiper-bundle.min.css is missing (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

{
  echo "build key: 'true' (no bundler, no tsc, no sass: the entry page loads the page script as shipped)"
  echo "entry page: $([ -f "${SRC_DIR}/${OUTDIR}/index.html" ] && echo present || echo MISSING)"
  echo "core file assets/js/main.js: $([ -f "${SRC_DIR}/assets/js/main.js" ] && echo present || echo MISSING)"
  echo "core file assets/css/style.css: $([ -f "${SRC_DIR}/assets/css/style.css" ] && echo present || echo MISSING)"
} > "${LOGS_DIR}/build.log" 2>&1
if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  echo "VERIFIER_ERROR: no entry page at ${SRC_DIR}/${OUTDIR}/index.html (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/assets/js/main.js" ]; then
  echo "VERIFIER_ERROR: source tree incomplete (assets/js/main.js is loaded by the entry page)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -f "${SRC_DIR}/assets/css/style.css" ]; then
  echo "VERIFIER_ERROR: source tree incomplete (assets/css/style.css is loaded by the entry page)" >&2
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
