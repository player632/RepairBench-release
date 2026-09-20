#!/bin/bash
# RepairBench verifier for repair-angular__angular-material-admin-full-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/angular-material-admin-full})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -u

_SELF="$(dirname "$0")"
_SELF="$(cd "${_SELF}" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/angular-material-admin-full}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR_PRIMARY="build"
OUTDIR_ALT="build/browser"
OUTDIR=""
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s9g_nm/angular-material-admin-full/node_modules}"
NM_ARCHIVE="${WLB_NM_ARCHIVE:-${PIPELINE_ROOT}/_build/tmp/s5_nm_bake/angular-material-admin-full.nm.tar.gz}"
NM_ARCHIVE_EXPECT_BASENAME="angular-material-admin-full.nm.tar.gz"
PORT="${WLB_PORT:-12001}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"
BRIDGE="__AMAF__"
MARKER_STORAGE="mock-users-crud-list"
MARKER_ROUTE="api-docs/#/Users"
BUILD_CMD="ng build --configuration production"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1). The read-only support directory is _build/gates/angular-material-admin-full; it is a codeload zip row with no git of its own (has_git false, needs_git_init true) and is never used as the answering tree."
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  if [ -d "${SRC_DIR}/node_modules" ]; then
    verifier_error "${SRC_DIR}/node_modules exists but node_modules/.bin/ng is not executable. Refusing to delete and rebuild an existing dependency tree; remove it deliberately or point WLB_NM_DEPOT at a usable dependency cache."
  fi
  if [ -d "${NM_DEPOT}" ] && [ -x "${NM_DEPOT}/.bin/ng" ]; then
    DEP_START=$(date +%s)
    cp -Rc "${NM_DEPOT}" "${SRC_DIR}/node_modules" > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    DEP_END=$(date +%s)
    echo "dependency source: tier 2 resident dependency cache ${NM_DEPOT} via cp -Rc (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  elif [ -f "${NM_ARCHIVE}" ]; then
    NM_BASE="$(basename "${NM_ARCHIVE}")"
    if [ "${NM_BASE}" != "${NM_ARCHIVE_EXPECT_BASENAME}" ]; then
      verifier_error "WLB_NM_ARCHIVE resolves to ${NM_BASE}, expected exactly ${NM_ARCHIVE_EXPECT_BASENAME}. _build/tmp/s5_nm_bake/ also holds angular-material-admin.nm.tar.gz, which is a DIFFERENT repository (its own read-only support directory _build/gates/angular-material-admin); building it would grade the wrong app. Refusing to supply dependencies from a near-name archive."
    fi
    DEP_START=$(date +%s)
    tar -xzf "${NM_ARCHIVE}" -C "${SRC_DIR}" > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    DEP_END=$(date +%s)
    echo "dependency source: tier 3 frozen dependency archive ${NM_ARCHIVE} (117830294 B, sha256-16 71dbb774698c0c69, root entry node_modules/, layout NPM_FLAT) via tar -xzf (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  else
    echo "dependency source: dependency cache ${NM_DEPOT} and archive ${NM_ARCHIVE} both unusable, falling back to the declared install" > "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: tier 4 registry install (rc=${DEP_RC}) - NEEDS NETWORK, which the grading environment does not have" >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "no usable node_modules (see ${LOGS_DIR}/install.log); neither the dependency cache ${NM_DEPOT} nor the archive ${NM_ARCHIVE} provided node_modules/.bin/ng"
fi

node -e 'const fs=require("fs");for(const p of process.argv.slice(1)){const had=fs.existsSync(p);if(had){fs.rmSync(p,{recursive:true,force:true});}console.log((had?"erased":"absent")+": "+p);}' "${SRC_DIR}/build" "${SRC_DIR}/build/browser" "${SRC_DIR}/dist" > "${LOGS_DIR}/outdir-erase.txt" 2>&1
ERASE_RC=$?
if [ "${ERASE_RC}" -ne 0 ]; then
  verifier_error "could not erase a previous output directory (rc=${ERASE_RC}, see ${LOGS_DIR}/outdir-erase.txt). Refusing to build on top of a possibly stale tree."
fi
cat "${LOGS_DIR}/outdir-erase.txt"

BUILD_STAMP="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_STAMP}"

( cd "${SRC_DIR}" && NG_CLI_ANALYTICS=false npm run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  verifier_error "build failed rc=${BUILD_RC} (${BUILD_CMD}, see ${LOGS_DIR}/build.log). The production configuration carries budgets (initial 12mb warn / 15mb error), so a budget breach is a real build failure and is NOT to be worked around by editing angular.json."
fi

if [ -f "${SRC_DIR}/${OUTDIR_PRIMARY}/index.html" ]; then
  OUTDIR="${OUTDIR_PRIMARY}"
  echo "outdir resolution: ${OUTDIR_PRIMARY}/index.html present => OUTDIR=${OUTDIR} (provenance claimed build/browser; the @angular-devkit/build-angular:browser webpack builder emits flat)" > "${LOGS_DIR}/outdir-resolution.txt"
elif [ -f "${SRC_DIR}/${OUTDIR_ALT}/index.html" ]; then
  OUTDIR="${OUTDIR_ALT}"
  echo "outdir resolution: ${OUTDIR_PRIMARY}/index.html ABSENT, ${OUTDIR_ALT}/index.html present => OUTDIR=${OUTDIR} (provenance value build/browser was right after all; the recorded output-directory correction must be re-read against this log)" > "${LOGS_DIR}/outdir-resolution.txt"
else
  verifier_error "the build reported rc=0 but produced neither ${OUTDIR_PRIMARY}/index.html nor ${OUTDIR_ALT}/index.html - cannot resolve the served directory (see ${LOGS_DIR}/build.log)"
fi
cat "${LOGS_DIR}/outdir-resolution.txt"
OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"

if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "${OUTDIR}/index.html is not newer than the build start - the build did not emit into ${OUTDIR} (stale tree). Refusing to serve a tree this run did not produce."
fi

BASE_HREF_HITS="$(grep -c '<base href="/"' "${OUT_INDEX}" 2>/dev/null || :)"
BASE_HREF_REL_HITS="$(grep -c '<base href="\./"' "${OUT_INDEX}" 2>/dev/null || :)"
echo "base-href guard: ${BASE_HREF_HITS} occurrence(s) of <base href=\"/\"> and ${BASE_HREF_REL_HITS} of <base href=\"./\"> in ${OUTDIR}/index.html" > "${LOGS_DIR}/base-href-guard.txt"
cat "${LOGS_DIR}/base-href-guard.txt"
if [ "${BASE_HREF_HITS:-0}" -lt 1 ]; then
  verifier_error "${OUTDIR}/index.html carries no <base href=\"/\">. Deep-link full loads (/login, /dashboard, /admin/users, /admin/users/edit/4) would resolve every relative asset against the deep path and 404, so the app would not boot and every checkpoint would read the probe sentinel. environment/adaptation.patch is supposed to set it; refusing to grade an unbootable tree."
fi

find "${SRC_DIR}/${OUTDIR}" -name '*.map' -type f 2>/dev/null > "${LOGS_DIR}/sourcemap-census.txt"
MAP_N="$(wc -l < "${LOGS_DIR}/sourcemap-census.txt" | tr -d ' ')"
echo "sourcemap ledger: ${MAP_N} .map file(s) under ${OUTDIR} (census: sourcemap-census.txt)" > "${LOGS_DIR}/sourcemap-guard.txt"
cat "${LOGS_DIR}/sourcemap-guard.txt"
if [ "${MAP_N}" != "0" ]; then
  verifier_error "${MAP_N} sourcemap file(s) under ${OUTDIR} although angular.json's production configuration declares sourceMap false. A delivered .map carries sourcesContent = the PRE-MUTATION source of every file this task mutates, which is an answer leak the C12 leakage scan cannot see. Refusing to grade a leaked task (offenders in ${LOGS_DIR}/sourcemap-census.txt)."
fi

ENTRY_JS_LIST="$(node -e 'const fs=require("fs");const t=fs.readFileSync(process.argv[1],"utf8");const out=[...t.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m)=>m[1].replace(/^\.\//,"").replace(/^\//,""));process.stdout.write(out.join("\n"));' "${OUT_INDEX}")"
ENTRY_CSS_LIST="$(node -e 'const fs=require("fs");const t=fs.readFileSync(process.argv[1],"utf8");const out=[...t.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m)=>m[1].replace(/^\.\//,"").replace(/^\//,""));process.stdout.write(out.join("\n"));' "${OUT_INDEX}")"
ENTRY_JS_N="$(printf '%s\n' "${ENTRY_JS_LIST}" | grep -c . || :)"
ENTRY_CSS_N="$(printf '%s\n' "${ENTRY_CSS_LIST}" | grep -c . || :)"
echo "hashed assets: ${ENTRY_JS_N} script entry(ies), ${ENTRY_CSS_N} stylesheet entry(ies) named by ${OUTDIR}/index.html" > "${LOGS_DIR}/asset-resolution.txt"
printf 'js: %s\ncss: %s\n' "${ENTRY_JS_LIST}" "${ENTRY_CSS_LIST}" >> "${LOGS_DIR}/asset-resolution.txt"
cat "${LOGS_DIR}/asset-resolution.txt"
if [ "${ENTRY_JS_N:-0}" -lt 1 ]; then
  verifier_error "${OUTDIR}/index.html names no <script src=...> entry - outputHashing \"all\" should have emitted at least one hashed bundle. Cannot prove the probe is in the served tree."
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null; rm -f "${BUILD_STAMP}" "${SUP_STOP}" 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verifier_error "static server not ready on ${PORT}"
fi

probe_code() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}$1"; }
ROOT_CODE="$(probe_code /)"
ICON_CODE="$(probe_code /favicon.ico)"
ICON_PNG_CODE="$(probe_code /assets/favicon.png)"
ASSET_CODE="$(probe_code /assets/user/list/1.png)"
: > "${LOGS_DIR}/readiness.txt"
echo "readiness: / ${ROOT_CODE} | /favicon.ico ${ICON_CODE} (ledger only: src/favicon.ico is absent from this seed while angular.json declares it, so 404 is the intended ledger reading - see the icon probe correction comment above) | /assets/favicon.png ${ICON_PNG_CODE} | /assets/user/list/1.png ${ASSET_CODE}" >> "${LOGS_DIR}/readiness.txt"
fail_probe() {
  verifier_error "$1 answered $2 (expected 200) - the served directory or the build output is wrong; expected ${OUTDIR} served at the site root"
}
[ "${ROOT_CODE}" = "200" ] || fail_probe "the site root /" "${ROOT_CODE}"
[ "${ICON_PNG_CODE}" = "200" ] || fail_probe "the copied icon /assets/favicon.png" "${ICON_PNG_CODE}"
[ "${ASSET_CODE}" = "200" ] || fail_probe "the roster picture /assets/user/list/1.png" "${ASSET_CODE}"
JS_CODES=""
while IFS= read -r JS; do
  [ -z "${JS}" ] && continue
  C="$(probe_code "/${JS}")"
  JS_CODES="${JS_CODES} /${JS} ${C}"
  [ "${C}" = "200" ] || fail_probe "the hashed entry script /${JS}" "${C}"
done <<EOF_JS
${ENTRY_JS_LIST}
EOF_JS
CSS_CODES=""
while IFS= read -r CSS; do
  [ -z "${CSS}" ] && continue
  C="$(probe_code "/${CSS}")"
  CSS_CODES="${CSS_CODES} /${CSS} ${C}"
  [ "${C}" = "200" ] || fail_probe "the hashed stylesheet /${CSS}" "${C}"
done <<EOF_CSS
${ENTRY_CSS_LIST}
EOF_CSS
echo "readiness: hashed bundles${JS_CODES}${CSS_CODES}" >> "${LOGS_DIR}/readiness.txt"
cat "${LOGS_DIR}/readiness.txt"

DEEP_CODE="$(probe_code /admin/users)"
DEEP_DOC="${LOGS_DIR}/deep-link-document.html"
curl -s "http://127.0.0.1:${PORT}/admin/users" -o "${DEEP_DOC}"
DEEP_BASE_HITS="$(grep -c '<base href="/"' "${DEEP_DOC}" 2>/dev/null || :)"
FIRST_JS="$(printf '%s\n' "${ENTRY_JS_LIST}" | head -1)"
ROOT_JS_CODE="$(probe_code "/${FIRST_JS}")"
DEEP_JS_CODE="$(probe_code "/admin/users/${FIRST_JS}")"
{
  echo "deep-link guard: GET /admin/users ${DEEP_CODE} | that document carries <base href=\"/\"> x${DEEP_BASE_HITS}"
  echo "deep-link guard: GET /${FIRST_JS} ${ROOT_JS_CODE} (must be 200) | GET /admin/users/${FIRST_JS} ${DEEP_JS_CODE} (must NOT be 200: a path with an extension gets no SPA fallback)"
} > "${LOGS_DIR}/deep-link-guard.txt"
cat "${LOGS_DIR}/deep-link-guard.txt"
if [ "${DEEP_CODE}" != "200" ]; then
  verifier_error "GET /admin/users answered ${DEEP_CODE} - the static server's SPA fallback is not serving the entry document for an extension-less deep path, so a path-based router cannot be graded by full page loads"
fi
if [ "${DEEP_BASE_HITS:-0}" -lt 1 ]; then
  verifier_error "the document served at /admin/users carries no <base href=\"/\"> - deep-link loads would resolve assets against the deep path"
fi
if [ "${ROOT_JS_CODE}" != "200" ]; then
  verifier_error "the entry script /${FIRST_JS} answered ${ROOT_JS_CODE} at the site root - the bundle named by the served document is not reachable"
fi
if [ "${DEEP_JS_CODE}" = "200" ]; then
  verifier_error "GET /admin/users/${FIRST_JS} answered 200, which means the server is falling back for a path WITH an extension. The deep-link guard cannot distinguish a working base href from a broken one under those conditions; refusing to grade an ambiguous tree."
fi

BRIDGE_HITS=0
while IFS= read -r JS; do
  [ -z "${JS}" ] && continue
  N="$(curl -s "http://127.0.0.1:${PORT}/${JS}" | awk -v b="${BRIDGE}" 'index($0,b){n++} END{print n+0}')"
  BRIDGE_HITS=$((BRIDGE_HITS + N))
done <<EOF_BRIDGE
${ENTRY_JS_LIST}
EOF_BRIDGE
echo "bridge guard: ${BRIDGE_HITS} line(s) across ${ENTRY_JS_N} served entry script(s) carrying the probe namespace ${BRIDGE}" > "${LOGS_DIR}/bridge-guard.txt"
cat "${LOGS_DIR}/bridge-guard.txt"
if [ "${BRIDGE_HITS:-0}" -lt 1 ]; then
  verifier_error "the served bundle carries 0 occurrences of ${BRIDGE}, so environment/instrumentation.patch is not in this build. Every checkpoint would read the '-' / -1 sentinel and the task would be unmeasurable. Refusing to grade."
fi

JS_FILES_N="$(find "${SRC_DIR}/${OUTDIR}" -name '*.js' -type f 2>/dev/null | wc -l | tr -d ' ')"
MARKER_STORAGE_N="$(grep -rl "${MARKER_STORAGE}" "${SRC_DIR}/${OUTDIR}" --include='*.js' 2>/dev/null | wc -l | tr -d ' ')"
MARKER_ROUTE_N="$(grep -rl "${MARKER_ROUTE}" "${SRC_DIR}/${OUTDIR}" --include='*.js' 2>/dev/null | wc -l | tr -d ' ')"
{
  echo "territory guard: ${JS_FILES_N} emitted .js file(s) under ${OUTDIR}"
  echo "territory guard: ${MARKER_STORAGE_N} file(s) carrying the roster storage key literal '${MARKER_STORAGE}' (users.service.ts)"
  echo "territory guard: ${MARKER_ROUTE_N} file(s) carrying the API-documentation literal '${MARKER_ROUTE}' (users-list.component.ts)"
} > "${LOGS_DIR}/territory-guard.txt"
cat "${LOGS_DIR}/territory-guard.txt"
if [ "${MARKER_STORAGE_N:-0}" -lt 1 ] || [ "${MARKER_ROUTE_N:-0}" -lt 1 ]; then
  verifier_error "the emitted bundles do not carry both mutation-territory literals (${MARKER_STORAGE_N} / ${MARKER_ROUTE_N}). The lazy CRUD chunk this task mutates is not in the served tree, so the users-page checkpoints could not be red for the right reason. Refusing to grade."
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 9000 \
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
