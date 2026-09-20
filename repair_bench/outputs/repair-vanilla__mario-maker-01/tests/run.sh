#!/bin/bash
# RepairBench verifier for repair-vanilla__mario-maker-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vanilla/mario-maker})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
PIPELINE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
_SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
if [ ! -f "${PIPELINE_ROOT}/evaluation/dsl_runner.mjs" ]; then
  _w="${PKG_DIR}"
  while [ "${_w}" != "/" ]; do
    if [ -f "${_w}/evaluation/dsl_runner.mjs" ]; then PIPELINE_ROOT="${_w}"; break; fi
    _w="$(dirname "${_w}")"
  done
fi
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vanilla/mario-maker}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="."
PORT="${WLB_PORT:-9209}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

{
  echo "install key: 'true' (zero-dependency zero-build tree: no manifest, no dependency directory, nothing to resolve)"
  echo "dependency directory present: $([ -d "${SRC_DIR}/node_modules" ] && echo yes || echo no)"
  echo "entry document index.html: $([ -f "${SRC_DIR}/index.html" ] && echo present || echo MISSING)"
  echo "observation bridge js/rb-probe.js: $([ -f "${SRC_DIR}/js/rb-probe.js" ] && echo present || echo MISSING)"
  echo "bridge script tag in index.html: $(grep -c 'js/rb-probe.js' "${SRC_DIR}/index.html" 2>/dev/null)"
  echo "code files under js/: $(find "${SRC_DIR}/js" -name '*.js' 2>/dev/null | wc -l | tr -d ' ')"
  echo "sprite sheets under images/: $(find "${SRC_DIR}/images" -name '*.png' 2>/dev/null | wc -l | tr -d ' ')"
  echo "audio files under sounds/: $(find "${SRC_DIR}/sounds" -name '*.wav' 2>/dev/null | wc -l | tr -d ' ')"
  echo "off-machine addresses left in the served tree: $(grep -rEl 'https?://|//cdn\.|googleapis|jsdelivr|unpkg' "${SRC_DIR}/index.html" "${SRC_DIR}/css" "${SRC_DIR}/js" 2>/dev/null | wc -l | tr -d ' ')"
} > "${LOGS_DIR}/install.log" 2>&1
for _core in "index.html" "css/style.css" "css/reset.css" "fonts/SuperMario256.ttf" "images/mario-sprites.png" "images/enemies.png" "images/powerups.png" "images/elements.png" "sounds/jump.wav" "sounds/coin.wav" "sounds/power-up-appear.wav" "sounds/power-up.wav" "js/View.js" "js/GameUI.js" "js/MarioMaker.js" "js/Preloader.js" "js/mainGame/MarioGame.js" "js/mainGame/Mario.js" "js/mainGame/Score.js" "js/mainGame/Enemy.js" "js/mainGame/PowerUp.js" "js/mainGame/GameSound.js" "js/mainGame/Element.js" "js/levelEditor/Editor.js" "js/levelEditor/Storage.js" "js/levelEditor/CreatedLevels.js" "js/rb-probe.js"; do
  if [ ! -f "${SRC_DIR}/${_core}" ]; then
    echo "VERIFIER_ERROR: source tree incomplete (${_core} is missing; see ${LOGS_DIR}/install.log)" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
  fi
done

{
  echo "build key: 'true' (no bundler, no transpiler, no type step: the tree root is the artifact root)"
  echo "outdir key: '.' (the entry document sits at the source root; every reference in it is relative)"
  echo "served directory: ${SRC_DIR}/${OUTDIR}"
  echo "entry document for the freshness check: ${SRC_DIR}/${OUTDIR}/index.html"
} > "${LOGS_DIR}/build.log" 2>&1
if [ ! -f "${SRC_DIR}/${OUTDIR}/index.html" ]; then
  echo "VERIFIER_ERROR: no entry document at ${SRC_DIR}/${OUTDIR}/index.html (see ${LOGS_DIR}/build.log)" >&2
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
  echo "VERIFIER_ERROR: static server not ready on port ${PORT}" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 12000 \
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
