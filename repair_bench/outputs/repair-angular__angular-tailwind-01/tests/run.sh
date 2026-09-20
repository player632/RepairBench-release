#!/bin/bash
# RepairBench verifier for repair-angular__angular-tailwind-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/angular-tailwind})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/angular-tailwind}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR_PRIMARY="dist/angular-tailwind/browser"
OUTDIR_ALT="dist/angular-tailwind"
OUTDIR=""
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s0_nm_live/angular-tailwind/node_modules}"
NM_ARCHIVE="${WLB_NM_ARCHIVE:-${PIPELINE_ROOT}/_build/tmp/s5_nm_bake/angular-tailwind.nm.tar.gz}"
NM_ARCHIVE_EXPECT_BASENAME="angular-tailwind.nm.tar.gz"
PORT="${WLB_PORT:-12447}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
BUILD_CMD="npm run build"
INSTALL_CMD_KEY="tar -xzf ${PIPELINE_ROOT}/_build/tmp/s5_nm_bake/angular-tailwind.nm.tar.gz -C . && echo nm-restored-from-tarball"
OUTDIR_KEY="dist/angular-tailwind/browser"
mkdir -p "${LOGS_DIR}"
BRIDGE="__rb_atw__"
PROBE_VERSION="atw-probe-1"
MARKER_TABLE_HEADING="Team Members"
MARKER_DECOY_HEADLINE="Showing 08 of 100 users"
MARKER_COPYRIGHT="Angular Tailwind"
REMOTE_HOSTS="avatars.githubusercontent.com fonts.googleapis.com freetestapi.com lh3.googleusercontent.com preview.keenthemes.com ui-avatars.com"

{
  echo "instance: repair-angular__angular-tailwind-01"
  echo "src_dir: ${SRC_DIR}"
  echo "package.json name: $(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").name))}catch(e){process.stdout.write("unreadable")}' "${SRC_DIR}" 2>/dev/null)"
  echo "package.json version: $(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").version))}catch(e){process.stdout.write("unreadable")}' "${SRC_DIR}" 2>/dev/null)"
  for _f in package.json angular.json src/main.ts src/index.html src/styles.css src/rb-probe.ts; do
    if [ -f "${SRC_DIR}/${_f}" ]; then echo "  OK   ${_f}"; else echo "  MISS ${_f}"; fi
  done
} > "${LOGS_DIR}/tree.log" 2>&1
PKG_NAME="$(node -e 'try{process.stdout.write(String(require(process.argv[1]+"/package.json").name))}catch(e){process.stdout.write("")}' "${SRC_DIR}" 2>/dev/null)"
MISS_N="$(grep -c '^  MISS ' "${LOGS_DIR}/tree.log" 2>/dev/null | tr -d '[:space:]')"
if [ "${PKG_NAME}" != "angular-tailwind" ]; then
  verifier_error "the tree at ${SRC_DIR} is not this seed (package.json name is '${PKG_NAME}', want 'angular-tailwind'); see ${LOGS_DIR}/tree.log"
fi
if [ "${MISS_N}" != "0" ]; then
  verifier_error "source tree incomplete (${MISS_N} file(s) missing, among them the instrumentation probe src/rb-probe.ts); see ${LOGS_DIR}/tree.log"
fi

{
  echo "install key (recipe block, verbatim): ${INSTALL_CMD_KEY}"
  echo "declared last resort (needs network, logged only, never trusted): npm install --no-audit --no-fund"
  echo "tier 1 node_modules/.bin/ng executable in the answering tree: $([ -x "${SRC_DIR}/node_modules/.bin/ng" ] && echo yes || echo no)"
  echo "tier 2 dependency cache ${NM_DEPOT}: $([ -d "${NM_DEPOT}" ] && echo present || echo absent)"
  echo "tier 3 archive ${NM_ARCHIVE}: $([ -f "${NM_ARCHIVE}" ] && echo present || echo absent)"
} > "${LOGS_DIR}/install.log" 2>&1
if [ -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  echo "tier 1 selected: the answering tree already carries a usable dependency tree" >> "${LOGS_DIR}/install.log"
elif [ -d "${NM_DEPOT}" ]; then
  echo "tier 2 selected: clonefile copy from the shared live tree dependency cache" >> "${LOGS_DIR}/install.log"
  if [ -d "${SRC_DIR}/node_modules" ]; then
    verifier_error "the dependency cache tier was selected but ${SRC_DIR}/node_modules exists and has no usable ng binary - refusing to mix two dependency trees (see ${LOGS_DIR}/install.log)"
  fi
  cp -Rc "${NM_DEPOT}" "${SRC_DIR}/node_modules" >> "${LOGS_DIR}/install.log" 2>&1 \
    || verifier_error "clonefile copy from ${NM_DEPOT} failed (see ${LOGS_DIR}/install.log)"
elif [ -f "${NM_ARCHIVE}" ]; then
  if [ "$(basename "${NM_ARCHIVE}")" != "${NM_ARCHIVE_EXPECT_BASENAME}" ]; then
    verifier_error "refusing a near-name archive: ${NM_ARCHIVE} is not ${NM_ARCHIVE_EXPECT_BASENAME} (see ${LOGS_DIR}/install.log)"
  fi
  echo "tier 3 selected: frozen dependency archive (the install key's own command)" >> "${LOGS_DIR}/install.log"
  ( cd "${SRC_DIR}" && tar -xzf "${NM_ARCHIVE}" -C . ) >> "${LOGS_DIR}/install.log" 2>&1 \
    || verifier_error "extracting ${NM_ARCHIVE} into ${SRC_DIR} failed (see ${LOGS_DIR}/install.log)"
else
  verifier_error "no dependency supply: tier 1 (in-tree), tier 2 (${NM_DEPOT}) and tier 3 (${NM_ARCHIVE}) are all empty (see ${LOGS_DIR}/install.log)"
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "after the dependency restore there is still no usable ng binary at ${SRC_DIR}/node_modules/.bin/ng (see ${LOGS_DIR}/install.log)"
fi
NODE_MODULES_TOP="$(ls -1 "${SRC_DIR}/node_modules" 2>/dev/null | wc -l | tr -d '[:space:]')"
echo "dependency tree top-level entries after restore: ${NODE_MODULES_TOP}" >> "${LOGS_DIR}/install.log"

{
  echo "remote hosts that adaptation removed (any hit below is a tree defect, not an answer defect):"
  for _h in ${REMOTE_HOSTS}; do
    _n=$(grep -RIl --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=.angular "${_h}" "${SRC_DIR}/src" 2>/dev/null | wc -l | tr -d '[:space:]')
    echo "  ${_h}: ${_n} file(s)"
  done
} > "${LOGS_DIR}/offline-guard.log" 2>&1
REMOTE_LEFT="$(grep -E '^  [^ ]+: [1-9]' "${LOGS_DIR}/offline-guard.log" 2>/dev/null | wc -l | tr -d '[:space:]')"
if [ "${REMOTE_LEFT}" != "0" ]; then
  verifier_error "${REMOTE_LEFT} remote host(s) that environment/adaptation.patch removed are back in ${SRC_DIR}/src - with no network this hangs the page load and every checkpoint would degrade to setup_failure (see ${LOGS_DIR}/offline-guard.log)"
fi

echo "build key (recipe block, verbatim): ${BUILD_CMD}" > "${LOGS_DIR}/build.log"
echo "cwd: ${SRC_DIR}" >> "${LOGS_DIR}/build.log"
( cd "${SRC_DIR}" && NG_CLI_ANALYTICS=false npm run build ) >> "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
echo "build rc: ${BUILD_RC}" >> "${LOGS_DIR}/build.log"
if [ "${BUILD_RC}" -ne 0 ]; then
  verifier_error "build failed rc=${BUILD_RC} (${BUILD_CMD}, see ${LOGS_DIR}/build.log). The gate recipe is reproduced verbatim here (npm run build, provenance gate_recipe.build); this file substitutes no project name and no configuration of its own. The project compiles under strict TypeScript with strict templates, so read build.log for the compiler's own verdict."
fi

if [ -f "${SRC_DIR}/${OUTDIR_PRIMARY}/index.html" ]; then
  OUTDIR="${OUTDIR_PRIMARY}"
  echo "outdir resolution: ${OUTDIR_PRIMARY}/index.html present => OUTDIR=${OUTDIR_PRIMARY} (the @angular/build:application layout: the builder hard-codes a browser/ level under the object-form outputPath.base; the recorded output-directory correction registers this against provenance's 'dist')" >> "${LOGS_DIR}/build.log"
elif [ -f "${SRC_DIR}/${OUTDIR_ALT}/index.html" ]; then
  OUTDIR="${OUTDIR_ALT}"
  echo "outdir resolution: fell back to ${OUTDIR_ALT}/index.html => OUTDIR=${OUTDIR_ALT} (a flat layout - provenance's 'dist' one level down; registered in the recorded output-directory correction)" >> "${LOGS_DIR}/build.log"
else
  verifier_error "the build reported rc=0 but produced neither ${OUTDIR_PRIMARY}/index.html nor ${OUTDIR_ALT}/index.html - cannot resolve the served directory (see ${LOGS_DIR}/build.log)"
fi
echo "served directory: ${SRC_DIR}/${OUTDIR}" >> "${LOGS_DIR}/build.log"
{
  echo "artifact census of ${OUTDIR}:"
  find "${SRC_DIR}/${OUTDIR}" -maxdepth 2 -type f | sed "s|${SRC_DIR}/${OUTDIR}/||" | sort | head -40
  echo "index.html bytes: $(wc -c < "${SRC_DIR}/${OUTDIR}/index.html" | tr -d '[:space:]')"
  echo "base href in the artifact: $(grep -Eo '<base href="[^"]*"' "${SRC_DIR}/${OUTDIR}/index.html" | head -1)"
} >> "${LOGS_DIR}/build.log" 2>&1
if [ "$(grep -Eo '<base href="/"' "${SRC_DIR}/${OUTDIR}/index.html" | wc -l | tr -d '[:space:]')" != "1" ]; then
  verifier_error "the built index.html does not carry <base href=\"/\"> - the router uses real paths, so every deep link the checkpoints navigate to would resolve against the wrong prefix (see ${LOGS_DIR}/build.log)"
fi

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
  for _m in "${MARKER_TABLE_HEADING}" "${MARKER_DECOY_HEADLINE}" "${MARKER_COPYRIGHT}"; do
    _t=0
    for _j in ${JS_BUNDLES}; do
      _n=$(grep -c -F -- "${_m}" "${_j}" 2>/dev/null | tr -d '[:space:]')
      _t=$((_t + _n))
    done
    echo "   '${_m}': ${_t} hit(s)"
  done
  echo "6c remote subresources in the artifact (want 0):"
  grep -REon '(src|href)[[:space:]]*=[[:space:]]*"(https?:)?//[^"]+"' "${SRC_DIR}/${OUTDIR}" 2>/dev/null | grep -v 'www.w3.org' | head -20 || echo "   none"
  grep -REon 'url\([^)]{0,3}https?://' "${SRC_DIR}/${OUTDIR}" 2>/dev/null | head -20 || echo "   none (css url())"
  echo "6c sourcemap census (registered, not judged): $(find "${SRC_DIR}/${OUTDIR}" -name '*.map' -type f 2>/dev/null | wc -l | tr -d '[:space:]') file(s)"
} > "${LOGS_DIR}/artifact-guard.log" 2>&1
if [ "$(grep -A1 "probe contract literal" "${LOGS_DIR}/artifact-guard.log" | grep -Eo 'hits: [0-9]+' | grep -Eo '[0-9]+')" = "0" ]; then
  verifier_error "the served artifact does not carry the instrumentation probe's contract literal '${PROBE_VERSION}' - this is a stale or foreign build, not the delivered tree (see ${LOGS_DIR}/artifact-guard.log)"
fi
for _m in "${MARKER_TABLE_HEADING}" "${MARKER_DECOY_HEADLINE}" "${MARKER_COPYRIGHT}"; do
  if [ "$(grep -F "   '${_m}': " "${LOGS_DIR}/artifact-guard.log" | grep -Eo ': [0-9]+ hit' | grep -Eo '[0-9]+')" = "0" ]; then
    verifier_error "the served artifact lost the territory literal '${_m}' - the tree handed to this verifier is not the delivered tree (see ${LOGS_DIR}/artifact-guard.log)"
  fi
done
REMOTE_ART="$(grep -Ec '^[^ ]+\.js:[0-9]+:|^[^ ]+\.css:[0-9]+:|^[^ ]+\.html:[0-9]+:' "${LOGS_DIR}/artifact-guard.log" 2>/dev/null | tr -d '[:space:]')"
if [ "${REMOTE_ART}" != "0" ]; then
  verifier_error "the served artifact carries ${REMOTE_ART} remote subresource reference(s) - with no network a missing subresource can keep the document's load event from firing, which would degrade every checkpoint to setup_failure (see ${LOGS_DIR}/artifact-guard.log)"
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
DEEP_CODE="$(curl -s -o "${LOGS_DIR}/deeplink-probe.html" -w '%{http_code}' "http://127.0.0.1:${PORT}/components/table" 2>/dev/null)"
echo "deep-link probe /components/table -> HTTP ${DEEP_CODE}, bytes $(wc -c < "${LOGS_DIR}/deeplink-probe.html" | tr -d '[:space:]')" >> "${LOGS_DIR}/artifact-guard.log"
if [ "${DEEP_CODE}" != "200" ]; then
  verifier_error "the SPA fallback did not answer a deep link (/components/table -> HTTP ${DEEP_CODE}); every checkpoint that navigates there would degrade to setup_failure"
fi

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
