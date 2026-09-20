#!/bin/bash
# RepairBench verifier for repair-vue__doppelkopf-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/vue/doppelkopf})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
fail2() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

_SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../.." && pwd)"
if [ ! -f "${PIPELINE_ROOT}/evaluation/dsl_runner.mjs" ]; then
  _w="${PKG_DIR}"
  while [ "${_w}" != "/" ]; do
    if [ -f "${_w}/evaluation/dsl_runner.mjs" ]; then PIPELINE_ROOT="${_w}"; break; fi
    _w="$(dirname "${_w}")"
  done
fi
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/vue/doppelkopf}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUT_REL="dist"
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s0_nm_live/doppelkopf/node_modules}"
PORT="${WLB_PORT:-14111}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
BUILD_CMD="npm run build"
INSTALL_CMD_KEY="if [ -x node_modules/.bin/vite ]; then echo nm-present-in-tree; elif [ -d ${PIPELINE_ROOT}/_build/tmp/s0_nm_live/doppelkopf/node_modules ]; then cp -Rc ${PIPELINE_ROOT}/_build/tmp/s0_nm_live/doppelkopf/node_modules . && { if [ -d node_modules/.tmp ]; then find node_modules/.tmp -delete; fi; } && echo nm-copied-from-live-dependency cache; else npm install --no-audit --no-fund && echo nm-installed-from-registry; fi"
OUTDIR_KEY="dist"
BRIDGE="__rbDoko"
GAME_BRIDGE="__rbGame"
REMOTE_HOSTS="plausible.io ingest.sentry.io"
mkdir -p "${LOGS_DIR}"

if [ ! -d "${SRC_DIR}" ]; then
  fail2 "source tree not found: ${SRC_DIR}"
fi

{
  echo "instance: repair-vue__doppelkopf-01"
  echo "src_dir: ${SRC_DIR}"
  echo "pipeline_root: ${PIPELINE_ROOT}"
  echo "package.json name: $(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").name))}catch(e){process.stdout.write("unreadable")}' "${SRC_DIR}" 2>/dev/null)"
  echo "build script: $(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").scripts.build))}catch(e){process.stdout.write("unreadable")}' "${SRC_DIR}" 2>/dev/null)"
  for _f in package.json package-lock.json vite.config.ts index.html src/main.ts src/rbProbe.ts src/App.vue \
    src/views/Game.vue src/models/card.ts src/models/trick.ts src/models/hand.ts src/models/score.ts \
    src/models/party.ts src/models/ringQueue.ts src/models/affinities.ts src/models/notifier.ts \
    src/models/playableCardFinder.ts src/models/random.ts src/components/Card.vue src/router/index.ts \
    src/assets/img/healthy.png public/favicon.ico; do
    if [ -f "${SRC_DIR}/${_f}" ]; then echo "  OK   ${_f}"; else echo "  MISS ${_f}"; fi
  done
  echo "-- model-exposure bridge assignments (must be >= 1 each) --"
  echo "  window.${BRIDGE} in src/rbProbe.ts: $(grep -c "${BRIDGE}" "${SRC_DIR}/src/rbProbe.ts" 2>/dev/null | tr -d ' ')"
  echo "  probe import in src/App.vue: $(grep -c 'rbProbe' "${SRC_DIR}/src/App.vue" 2>/dev/null | tr -d ' ')"
  echo "  window.${GAME_BRIDGE} in src/views/Game.vue: $(grep -c "${GAME_BRIDGE}" "${SRC_DIR}/src/views/Game.vue" 2>/dev/null | tr -d ' ')"
  echo "-- remote hosts surviving in the served tree (must be 0) --"
  for _h in ${REMOTE_HOSTS}; do
    echo "  ${_h}: $(grep -rl -- "${_h}" "${SRC_DIR}/index.html" "${SRC_DIR}/src" 2>/dev/null | wc -l | tr -d ' ')"
  done
} > "${LOGS_DIR}/install.log" 2>&1
PKG_NAME="$(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").name))}catch(e){process.stdout.write("")}' "${SRC_DIR}" 2>/dev/null)"
MISS_N="$(grep -c '^  MISS ' "${LOGS_DIR}/install.log" 2>/dev/null | tr -d '[:space:]')"
EXT_LEFT="$(grep -rl -E 'plausible\.io|ingest\.sentry\.io' "${SRC_DIR}/index.html" "${SRC_DIR}/src" 2>/dev/null | wc -l | tr -d ' ')"
echo "external hosts left in the served tree: ${EXT_LEFT}" >> "${LOGS_DIR}/install.log"
if [ "${PKG_NAME}" != "doppelkopf" ]; then
  fail2 "the tree at ${SRC_DIR} is not this seed (package.json name is '${PKG_NAME}', want 'doppelkopf'); see ${LOGS_DIR}/install.log"
fi
if [ "${MISS_N}" != "0" ]; then
  fail2 "source tree incomplete (${MISS_N} file(s) missing, among them the instrumentation probe src/rbProbe.ts); see ${LOGS_DIR}/install.log"
fi
if [ "${EXT_LEFT}" != "0" ]; then
  fail2 "the served tree still references ${EXT_LEFT} file(s) with an off-tree host - this tree must run with no network at all (see ${LOGS_DIR}/install.log)"
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  if [ -d "${NM_DEPOT}" ]; then
    echo "install tier 2: cp -Rc ${NM_DEPOT} -> ${SRC_DIR}/node_modules" >> "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && cp -Rc "${NM_DEPOT}" . ) >> "${LOGS_DIR}/install.log" 2>&1
    if [ $? -ne 0 ]; then
      fail2 "node_modules clone from the live dependency cache failed (see ${LOGS_DIR}/install.log): ${NM_DEPOT}"
    fi
    echo "install tier 2b: drop the copied node_modules/.tmp tsbuildinfo so vue-tsc --build really type-checks" >> "${LOGS_DIR}/install.log"
    if [ -d "${SRC_DIR}/node_modules/.tmp" ]; then
      find "${SRC_DIR}/node_modules/.tmp" -delete
      if [ $? -ne 0 ]; then
        fail2 "could not drop the copied node_modules/.tmp tsbuildinfo - vue-tsc --build would skip the type-check and the build tier would be falsely green"
      fi
    fi
  else
    echo "WARNING: ${NM_DEPOT} is absent; falling back to the declared install command, which needs network and cannot succeed when network access is disabled." >&2
    echo "install tier 3: ${INSTALL_CMD_KEY##*else }" >> "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
    if [ $? -ne 0 ]; then
      fail2 "dependency install failed and no offline dependency cache is available (see ${LOGS_DIR}/install.log)"
    fi
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  fail2 "build tooling absent after dependency restore (node_modules/.bin/vite) - the state tree is not buildable"
fi

{
  echo "build key: '${BUILD_CMD}' (package.json:11 run-p type-check \"build-only {@}\" -- => vue-tsc --build + vite build)"
  echo "outdir key: '${OUTDIR_KEY}' (vite.config.ts declares no build.outDir => vite default 'dist')"
  echo "served directory: ${SRC_DIR}/${OUT_REL}"
} > "${LOGS_DIR}/build.log" 2>&1
( cd "${SRC_DIR}" && ${BUILD_CMD} ) >> "${LOGS_DIR}/build.log" 2>&1
if [ $? -ne 0 ]; then
  fail2 "build failed (see ${LOGS_DIR}/build.log)"
fi
SERVE_DIR="${SRC_DIR}/${OUT_REL}"
if [ ! -f "${SERVE_DIR}/index.html" ]; then
  fail2 "the build reported success but ${OUT_REL}/index.html is absent - there is no static output to serve"
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SERVE_DIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  fail2 "static server not ready on port ${PORT}"
fi
if ! curl -s -o /dev/null "http://127.0.0.1:${PORT}/play"; then
  fail2 "the /play deep link was not answered on port ${PORT} - the SPA fallback is not in effect"
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 15000 \
  --out "${LOGS_DIR}/checkpoint_results.json" \
  --task repair-vue__doppelkopf-01 > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/exit-code.txt"
if [ "${RUNNER_EXIT}" -gt 1 ]; then
  fail2 "dsl_runner exited ${RUNNER_EXIT} (a runner/usage fault, not a behaviour verdict; see ${LOGS_DIR}/runner-stdout.txt)"
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
