#!/bin/bash
# RepairBench verifier for repair-vanilla__tetris-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vanilla/tetris})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vanilla/tetris}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="."
PORT="${WLB_PORT:-12320}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

{
  echo "install key: 'true' (zero-dependency zero-build tree: no dependency directory to restore, nothing to resolve)"
  echo "dependency directory present: $([ -d "${SRC_DIR}/node_modules" ] && echo yes || echo no)"
  echo "entry document index.html: $([ -f "${SRC_DIR}/index.html" ] && echo present || echo MISSING)"
  echo "offline stand-in rb-offline/inert.js: $([ -f "${SRC_DIR}/rb-offline/inert.js" ] && echo present || echo MISSING)"
  echo "offline stand-in rb-offline/inert.css: $([ -f "${SRC_DIR}/rb-offline/inert.css" ] && echo present || echo MISSING)"
  echo "own script files loaded by the entry document: 15 (declared order, at the tree root)"
  echo "script files present at the tree root: $(find "${SRC_DIR}" -maxdepth 1 -name '*.js' 2>/dev/null | wc -l | tr -d ' ')"
  echo "own stylesheets (controlsStyles.css, styles.css) present: $(find "${SRC_DIR}" -maxdepth 1 -name '*.css' 2>/dev/null | wc -l | tr -d ' ')"
  echo "third-party libraries shipped in the tree: jawsjs.js"
  echo "media files present under media/: $(find "${SRC_DIR}/media" -type f 2>/dev/null | wc -l | tr -d ' ')"
  echo "media references in the shipped faces: 15 (absent upstream: 5 - declared not-a-fault in the instruction)"
  echo "test identifiers in the served entry document: $(grep -c 'data-test[id]' "${SRC_DIR}/index.html" 2>/dev/null | tr -d ' ')"
  echo "-- external hosts surviving anywhere in the served tree (all 5 must be 0 files) --"
  for _pat in 'fonts[.]googleapis[.]com' 'in[.]getclicky[.]com' 'pagead2[.]googlesyndication[.]com' 'static[.]getclicky[.]com' 'www[.]googletagmanager[.]com'; do
    echo "  ${_pat}: $(grep -rl -E --exclude-dir=.git --exclude-dir=node_modules -- "${_pat}" "${SRC_DIR}" 2>/dev/null | wc -l | tr -d ' ') file(s)"
  done
} > "${LOGS_DIR}/install.log" 2>&1
EXT_LEFT=$(grep -rl -E --exclude-dir=.git --exclude-dir=node_modules -- 'fonts[.]googleapis[.]com|in[.]getclicky[.]com|pagead2[.]googlesyndication[.]com|static[.]getclicky[.]com|www[.]googletagmanager[.]com' "${SRC_DIR}" 2>/dev/null | wc -l | tr -d ' ')
echo "files still carrying an external reference: ${EXT_LEFT}" >> "${LOGS_DIR}/install.log"
for _core in "Background.js" "Block.js" "Button.js" "ControlGroup.js" "Game.js" "Game_Logic.js" "PreviewGroup.js" "RandomBag.js" "ScoreTracker.js" "Shapes.js" "TtyBlock.js" "WallKicks.js" "controlsStyles.css" "cookie.js" "gameControls.js" "index.html" "rb-offline/inert.css" "rb-offline/inert.js" "styles.css" "tetris.js"; do
  if [ ! -f "${SRC_DIR}/${_core}" ]; then
    echo "VERIFIER_ERROR: source tree incomplete (${_core} is missing; see ${LOGS_DIR}/install.log)" >&2
    echo 2 > "${LOGS_DIR}/exit-code.txt"
    exit 2
  fi
done
if [ "${EXT_LEFT}" != "0" ]; then
  echo "VERIFIER_ERROR: the served tree still carries ${EXT_LEFT} file(s) with an external reference - the tree must run with no network at all (see ${LOGS_DIR}/install.log)" >&2
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
