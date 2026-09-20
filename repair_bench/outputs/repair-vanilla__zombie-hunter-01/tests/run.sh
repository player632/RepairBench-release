#!/bin/bash
# RepairBench verifier for repair-vanilla__zombie-hunter-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vanilla/zombie-hunter})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vanilla/zombie-hunter}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="."
PORT="${WLB_PORT:-12271}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

{
  echo "install key: 'true' (zero-dependency zero-build tree: no manifest, no lockfile, no dependency directory to restore)"
  echo "manifest present anywhere in the tree: $(find "${SRC_DIR}" -name package.json -not -path '*/.git/*' 2>/dev/null | wc -l | tr -d ' ')"
  echo "dependency directory present: $([ -d "${SRC_DIR}/node_modules" ] && echo yes || echo no)"
  echo "entry document index.html: $([ -f "${SRC_DIR}/index.html" ] && echo present || echo MISSING)"
  echo "offline leaderboard fixture rb-offline/topscores.json: $([ -f "${SRC_DIR}/rb-offline/topscores.json" ] && echo present || echo MISSING)"
  echo "test-identifier hook script js/rb-hooks.js: $([ -f "${SRC_DIR}/js/rb-hooks.js" ] && echo present || echo MISSING)"
  echo "own script count under js/ (recursive): $(find "${SRC_DIR}/js" -name '*.js' 2>/dev/null | wc -l | tr -d ' ')"
  echo "vendored library count under libs/: $(find "${SRC_DIR}/libs" -maxdepth 1 -name '*.js' 2>/dev/null | wc -l | tr -d ' ')"
  echo "asset count under assets/ (recursive): $(find "${SRC_DIR}/assets" -type f 2>/dev/null | wc -l | tr -d ' ')"
  echo "test identifiers in the hook script: $(grep -c 'data-testid' "${SRC_DIR}/js/rb-hooks.js" 2>/dev/null | tr -d ' ')"
  echo "-- external references surviving in the served tree (both must be 0) --"
  for _pat in 'zombiehunter[.]bplaced[.]net' 'bplaced[.]net/api/score'; do
    echo "  ${_pat}: $(grep -rc -E -- "${_pat}" "${SRC_DIR}/index.html" "${SRC_DIR}/js" 2>/dev/null | grep -c ':[1-9]' | tr -d ' ')"
  done
} > "${LOGS_DIR}/install.log" 2>&1
EXT_LEFT=$(grep -rc -E 'zombiehunter\.bplaced\.net|bplaced\.net/api/score' "${SRC_DIR}/index.html" "${SRC_DIR}/js" 2>/dev/null | grep -c ':[1-9]' | tr -d ' ')
echo "external references left in the served tree: ${EXT_LEFT}" >> "${LOGS_DIR}/install.log"
for _core in "index.html" "rb-offline/topscores.json" "js/rb-hooks.js" "libs/jquery-3.3.1.min.js" "libs/phaser.min.js" \
  "js/main.js" "js/highscore.js" "js/highscore.sender.js" "js/language.js" "js/player.js" "js/stats.js" "js/utils.js" \
  "js/weapon.js" "js/world.js" "js/states/boot.js" "js/states/game.js" "js/states/menu.js" "js/states/preload.js" \
  "js/ui/button.js" "js/ui/emitter.js" "js/ui/keyboard.js" "js/ui/uioverlay.js" \
  "assets/images/bg.png" "assets/images/player.png" "assets/images/z1.png" "assets/fonts/font.png" "assets/fonts/font.fnt"; do
  if [ ! -f "${SRC_DIR}/${_core}" ]; then
    echo "VERIFIER_ERROR: source tree incomplete (${_core} is missing; see ${LOGS_DIR}/install.log)" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
  fi
done
if [ "${EXT_LEFT}" != "0" ]; then
  echo "VERIFIER_ERROR: the served tree still carries ${EXT_LEFT} external reference(s) - the tree must run with no network at all (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

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
