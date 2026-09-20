#!/bin/bash
# RepairBench verifier for repair-react__facebook-clone-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/react/facebook-clone})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -u
verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}
_SELF="$(dirname "$0")"
_SELF="$(cd "${_SELF}" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/react/facebook-clone}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR_KEY="dist"
OUTDIR=""
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s0_nm_live/facebook-clone/node_modules}"
PORT="${WLB_PORT:-14020}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
BUILD_CMD="npm run build"
INSTALL_CMD_KEY='if [ -x node_modules/.bin/vite ]; then echo nm-present-in-tree; elif [ -d ${PIPELINE_ROOT}/_build/tmp/s0_nm_live/facebook-clone/node_modules ]; then cp -Rc ${PIPELINE_ROOT}/_build/tmp/s0_nm_live/facebook-clone/node_modules . && echo deps-copied-from-dependency cache; else npm install --no-audit --no-fund; fi'
mkdir -p "${LOGS_DIR}"
BRIDGE="__rb_fbc__"
PROBE_VERSION="fbc-probe-1"
MARKER_MODAL_TITLE="Today's picks"
MARKER_GROUP_HEADING="Claude Ai Community"
MARKER_CREATE_ACCT="Create New Account"
REMOTE_HOSTS="commondatastorage.googleapis.com cdnjs.cloudflare.com random.imagecdn.app"
{
  echo "instance: repair-react__facebook-clone-01"
  echo "src_dir: ${SRC_DIR}"
  echo "package.json name: $(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").name))}catch(e){process.stdout.write("unreadable")}' "${SRC_DIR}" 2>/dev/null)"
  echo "package.json version: $(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").version))}catch(e){process.stdout.write("unreadable")}' "${SRC_DIR}" 2>/dev/null)"
  for _f in package.json vite.config.ts tsconfig.json index.html src/main.tsx src/App.tsx src/rb-probe.ts src/lib/data.ts tailwind.config.js; do
    if [ -f "${SRC_DIR}/${_f}" ]; then echo "  OK   ${_f}"; else echo "  MISS ${_f}"; fi
  done
} > "${LOGS_DIR}/tree.log" 2>&1
PKG_NAME="$(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").name))}catch(e){process.stdout.write("")}' "${SRC_DIR}" 2>/dev/null)"
MISS_N="$(grep -c '^  MISS ' "${LOGS_DIR}/tree.log" 2>/dev/null | tr -d '[:space:]')"
if [ "${PKG_NAME}" != "facebook-ui-clone" ]; then
  verifier_error "the tree at ${SRC_DIR} is not this seed (package.json name is '${PKG_NAME}', want 'facebook-ui-clone'); see ${LOGS_DIR}/tree.log"
fi
if [ "${MISS_N}" != "0" ]; then
  verifier_error "source tree incomplete (${MISS_N} file(s) missing, among them the instrumentation probe src/rb-probe.ts); see ${LOGS_DIR}/tree.log"
fi
{
  echo "install key (recipe block, verbatim): ${INSTALL_CMD_KEY}"
  echo "declared last resort (needs network, logged only, never executed on the verdict path): npm install --no-audit --no-fund"
  echo "tier 1 node_modules/.bin/vite executable in the answering tree: $([ -x "${SRC_DIR}/node_modules/.bin/vite" ] && echo yes || echo no)"
  echo "tier 2 dependency cache ${NM_DEPOT}: $([ -d "${NM_DEPOT}" ] && echo present || echo absent)"
  echo "tier 3 frozen tar archive: ABSENT BY FACT for this seed (0 hits under _build/tmp/{s5_nm_archive,s4_nm_archive,s3_nm_archive,s5_nm_bake}/facebook-clone.*)"
} > "${LOGS_DIR}/install.log" 2>&1
if [ -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  echo "tier 1 selected: the answering tree already carries a usable dependency tree" >> "${LOGS_DIR}/install.log"
elif [ -d "${NM_DEPOT}" ]; then
  echo "tier 2 selected: clonefile copy from the shared live tree dependency cache" >> "${LOGS_DIR}/install.log"
  if [ -d "${SRC_DIR}/node_modules" ]; then
    verifier_error "the dependency cache tier was selected but ${SRC_DIR}/node_modules exists and has no usable vite binary - refusing to mix two dependency trees (see ${LOGS_DIR}/install.log)"
  fi
  cp -Rc "${NM_DEPOT}" "${SRC_DIR}/node_modules" >> "${LOGS_DIR}/install.log" 2>&1 \
    || verifier_error "clonefile copy from ${NM_DEPOT} failed (see ${LOGS_DIR}/install.log)"
else
  verifier_error "no dependency-tree tier available (neither an in-tree node_modules/.bin/vite nor the dependency cache ${NM_DEPOT}); this is a supply failure, not a behavioural red (see ${LOGS_DIR}/install.log)"
fi
{
  echo "source-tree remote-host census of ${SRC_DIR} (src/ + index.html + public/):"
  for _h in ${REMOTE_HOSTS}; do
    _n=$(grep -RIl -F -- "${_h}" "${SRC_DIR}/src" "${SRC_DIR}/index.html" "${SRC_DIR}/public" 2>/dev/null | wc -l | tr -d '[:space:]')
    echo "   ${_h}: ${_n} file(s)"
  done
} > "${LOGS_DIR}/adaptation-guard.log" 2>&1
REMOTE_SRC="$(grep -Ec '^[^ ]+: [1-9]' "${LOGS_DIR}/adaptation-guard.log" 2>/dev/null | tr -d '[:space:]')"
if [ "${REMOTE_SRC}" != "0" ]; then
  verifier_error "the source tree carries ${REMOTE_SRC} remote host(s) that environment/adaptation.patch removed - this is not the delivered tree, and offline it would stall every goto (see ${LOGS_DIR}/adaptation-guard.log)"
fi
{
  echo "build key (recipe block, verbatim): ${BUILD_CMD}"
  echo "cwd: ${SRC_DIR}"
  echo "node: $(node -v 2>&1)"
} > "${LOGS_DIR}/build.log" 2>&1
( cd "${SRC_DIR}" && eval "${BUILD_CMD}" ) >> "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
echo "build rc=${BUILD_RC}" >> "${LOGS_DIR}/build.log"
if [ "${BUILD_RC}" -ne 0 ]; then
  verifier_error "the gate recipe '${BUILD_CMD}' exited ${BUILD_RC} (see ${LOGS_DIR}/build.log) - a build break is an environment/answer defect, never a behavioural red"
fi
if [ -f "${SRC_DIR}/${OUTDIR_KEY}/index.html" ]; then
  OUTDIR="${OUTDIR_KEY}"
  echo "outdir resolution: ${OUTDIR_KEY}/index.html present => OUTDIR=${OUTDIR_KEY} (vite's default outDir; vite.config.ts sets base '/' and no outDir, and the build step proved the landing spot)" >> "${LOGS_DIR}/build.log"
else
  verifier_error "the build reported rc=0 but produced no ${OUTDIR_KEY}/index.html - cannot resolve the served directory (see ${LOGS_DIR}/build.log)"
fi
echo "served directory: ${SRC_DIR}/${OUTDIR}" >> "${LOGS_DIR}/build.log"
{
  echo "artifact census of ${OUTDIR}:"
  find "${SRC_DIR}/${OUTDIR}" -maxdepth 2 -type f | sed "s|${SRC_DIR}/${OUTDIR}/||" | sort | head -40
  echo "index.html bytes: $(wc -c < "${SRC_DIR}/${OUTDIR}/index.html" | tr -d '[:space:]')"
  echo "asset script tags in the artifact: $(grep -Eo '<script[^>]*src="[^"]*"' "${SRC_DIR}/${OUTDIR}/index.html" | wc -l | tr -d '[:space:]')"
} >> "${LOGS_DIR}/build.log" 2>&1
{
  echo "served artifact: ${SRC_DIR}/${OUTDIR}"
  JS_BUNDLES="$(find "${SRC_DIR}/${OUTDIR}" -name '*.js' -type f 2>/dev/null)"
  echo "js files in the artifact: $(echo "${JS_BUNDLES}" | grep -c . | tr -d '[:space:]')"
  echo "6a probe contract literal '${PROBE_VERSION}':"
  PROBE_HITS=0
  for _j in ${JS_BUNDLES}; do
    _n=$(grep -c -- "${PROBE_VERSION}" "${_j}" 2>/dev/null | tr -d '[:space:]')
    PROBE_HITS=$((PROBE_HITS + _n))
  done
  echo "   hits: ${PROBE_HITS}"
  echo "6a bridge namespace literal '${BRIDGE}':"
  BRIDGE_HITS=0
  for _j in ${JS_BUNDLES}; do
    _n=$(grep -c -- "${BRIDGE}" "${_j}" 2>/dev/null | tr -d '[:space:]')
    BRIDGE_HITS=$((BRIDGE_HITS + _n))
  done
  echo "   hits: ${BRIDGE_HITS}"
  echo "6b defect-territory literals (static copy no defect and no adaptation touches):"
  for _m in "${MARKER_MODAL_TITLE}" "${MARKER_GROUP_HEADING}" "${MARKER_CREATE_ACCT}"; do
    _t=0
    for _j in ${JS_BUNDLES}; do
      _n=$(grep -c -F -- "${_m}" "${_j}" 2>/dev/null | tr -d '[:space:]')
      _t=$((_t + _n))
    done
    echo "   '${_m}': ${_t} hit(s)"
  done
  echo "6c remote SUBRESOURCE census (blocking class only: src= / srcSet= / css url() / @import):"
  grep -REon '(src|srcSet)=["'"'"'](https?:)?//[^"'"'"']+' "${SRC_DIR}/${OUTDIR}" 2>/dev/null | grep -v 'www.w3.org' | head -20 || echo "   none (attributes)"
  grep -REon 'url\([^)]{0,3}(https?:)?//[^)]+' "${SRC_DIR}/${OUTDIR}" 2>/dev/null | head -20 || echo "   none (css url())"
  grep -REon '@import[^;]{0,80}' "${SRC_DIR}/${OUTDIR}" 2>/dev/null | head -20 || echo "   none (@import)"
  echo "6c removed-host residue census (adaptation.patch took these out; any hit means the tree is not the delivered one):"
  for _h in ${REMOTE_HOSTS}; do
    _n=$(grep -RIl -F -- "${_h}" "${SRC_DIR}/${OUTDIR}" 2>/dev/null | wc -l | tr -d '[:space:]')
    echo "   ${_h}: ${_n} file(s)"
  done
  echo "6c outbound-link census (registered, NOT judged: an <a href> to a remote origin is never fetched, so it cannot stall a load event): $(grep -REoh '(https?:)?//[a-zA-Z0-9._-]+' "${SRC_DIR}/${OUTDIR}" 2>/dev/null | grep -v 'www.w3.org' | sort -u | wc -l | tr -d '[:space:]') distinct origin literal(s)"
  echo "6c sourcemap census (registered, not judged): $(find "${SRC_DIR}/${OUTDIR}" -name '*.map' -type f 2>/dev/null | wc -l | tr -d '[:space:]') file(s)"
} > "${LOGS_DIR}/artifact-guard.log" 2>&1
if [ "$(grep -A1 "probe contract literal" "${LOGS_DIR}/artifact-guard.log" | grep -Eo 'hits: [0-9]+' | grep -Eo '[0-9]+')" = "0" ]; then
  verifier_error "the served artifact does not carry the instrumentation probe's contract literal '${PROBE_VERSION}' - this is a stale or foreign build, not the delivered tree (see ${LOGS_DIR}/artifact-guard.log)"
fi
for _m in "${MARKER_MODAL_TITLE}" "${MARKER_GROUP_HEADING}" "${MARKER_CREATE_ACCT}"; do
  if [ "$(grep -F "   '${_m}': " "${LOGS_DIR}/artifact-guard.log" | grep -Eo ': [0-9]+ hit' | grep -Eo '[0-9]+')" = "0" ]; then
    verifier_error "the served artifact lost the territory literal '${_m}' - the tree handed to this verifier is not the delivered tree (see ${LOGS_DIR}/artifact-guard.log)"
  fi
done
REMOTE_ART="$(grep -Ec '^[^ ]+\.(js|css|html|svg):[0-9]+:' "${LOGS_DIR}/artifact-guard.log" 2>/dev/null | tr -d '[:space:]')"
if [ "${REMOTE_ART}" != "0" ]; then
  verifier_error "the served artifact carries ${REMOTE_ART} remote SUBRESOURCE reference(s) - with no network a missing subresource can keep the document's load event from firing, which would degrade every checkpoint to setup_failure (see ${LOGS_DIR}/artifact-guard.log)"
fi
REMOTE_RES="$(awk '/removed-host residue census/{f=1;next} /outbound-link census/{f=0} f' "${LOGS_DIR}/artifact-guard.log" | grep -Ec ': [1-9]' | tr -d '[:space:]')"
if [ "${REMOTE_RES}" != "0" ]; then
  verifier_error "the served artifact still references ${REMOTE_RES} host(s) that environment/adaptation.patch removed (${REMOTE_HOSTS}) - not the delivered tree (see ${LOGS_DIR}/artifact-guard.log)"
fi
SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 80); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verifier_error "static server not ready on port ${PORT} (see ${LOGS_DIR}/artifact-guard.log)"
fi
for _dl in /reel /stories/2 /marketplace; do
  DEEP_CODE="$(curl -s -o "${LOGS_DIR}/deeplink-probe.html" -w '%{http_code}' "http://127.0.0.1:${PORT}${_dl}" 2>/dev/null)"
  echo "deep-link probe ${_dl} -> HTTP ${DEEP_CODE}, bytes $(wc -c < "${LOGS_DIR}/deeplink-probe.html" | tr -d '[:space:]')" >> "${LOGS_DIR}/artifact-guard.log"
  if [ "${DEEP_CODE}" != "200" ]; then
    verifier_error "the SPA fallback did not answer a deep link (${_dl} -> HTTP ${DEEP_CODE}); every checkpoint that navigates there would degrade to setup_failure"
  fi
done
node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 12000 \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/exit-code.txt"
if [ "${RUNNER_EXIT}" -gt 1 ]; then
  verifier_error "dsl_runner exited ${RUNNER_EXIT} (a runner/usage fault, not a behaviour verdict; see ${LOGS_DIR}/runner-stdout.txt)"
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
exit ${PY_EXIT}
