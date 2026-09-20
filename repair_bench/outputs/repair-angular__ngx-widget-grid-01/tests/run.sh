#!/bin/bash
# RepairBench verifier for repair-angular__ngx-widget-grid-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/ngx-widget-grid})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -u

_SELF="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/ngx-widget-grid}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
GATE_DIR="${WLB_GATE_DIR:-${PIPELINE_ROOT}/_build/gates/ngx-widget-grid}"
OUTDIR="dist/ngx-wg"
OUTDIR_PARENT="dist"
BASE_HREF="/ngx-widget-grid/"
STAGE_NAME="ngx-widget-grid"
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s9g_nm/ngx-widget-grid/node_modules}"
NM_ARCHIVE="${WLB_NM_ARCHIVE:-${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/ngx-widget-grid.nm.tar.gz}"
PORT="${WLB_PORT:-12043}"
MOCK_PORT="${WLB_MOCK_PORT:-12543}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

echo "mirror port ${MOCK_PORT} declared-not-bound; the only socket this verifier binds is ${PORT}" > "${LOGS_DIR}/port-declaration.txt"
cat "${LOGS_DIR}/port-declaration.txt"

if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1). The read-only support directory is ${GATE_DIR}; it is never used as the answering tree and this script refuses to build inside it."
fi
if [ "${SRC_DIR}" = "${GATE_DIR}" ]; then
  verifier_error "SRC_DIR resolves to the read-only support directory ${GATE_DIR}. Building there would dirty a shared 0-byte-change surface; pass the working copy of the seed tree as \$1 instead."
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
    echo "dependency source: resident dependency cache ${NM_DEPOT} via cp -Rc (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  elif [ -f "${NM_ARCHIVE}" ]; then
    DEP_START=$(date +%s)
    tar -xzf "${NM_ARCHIVE}" -C "${SRC_DIR}" > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    DEP_END=$(date +%s)
    echo "dependency source: frozen tier-2 archive ${NM_ARCHIVE} (119233669 B, sha256-16 95b9c2dd63967216, single top-level node_modules/) via tar -xzf (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  else
    echo "dependency source: dependency cache ${NM_DEPOT} and archive ${NM_ARCHIVE} both unusable, falling back to the AUTHORIZED declared install" > "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && yarn install --non-interactive --no-progress --network-timeout 600000 ) >> "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: authorized registry install (rc=${DEP_RC}) - NEEDS NETWORK, which the grading environment does not have" >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "no usable node_modules (see ${LOGS_DIR}/install.log); neither the dependency cache ${NM_DEPOT} nor the archive ${NM_ARCHIVE} provided node_modules/.bin/ng"
fi

if [ ! -f "${SRC_DIR}/src/app/rb-probe.ts" ]; then
  verifier_error "src/app/rb-probe.ts is absent from ${SRC_DIR} - environment/instrumentation.patch is not applied to this tree, so window.__RB__ cannot exist and no checkpoint is measurable."
fi
if ! grep -q '__RB__' "${SRC_DIR}/src/main.ts"; then
  verifier_error "src/main.ts carries no reference to __RB__ - environment/instrumentation.patch is not applied to this tree."
fi

if grep -q '"dist/ngx-widget-grid"' "${SRC_DIR}/tsconfig.json"; then
  verifier_error "tsconfig.json still maps the bare specifier to dist/ngx-widget-grid - environment/adaptation.patch (AD-1, the paths repoint) is NOT applied to this tree. All 12 defects live in projects/ngx-widget-grid/src/lib/**, so the build would compile the pristine prebuilt library, exit 0, and grade a clean application: a silent false green. Refusing to build."
fi
if ! grep -q 'projects/ngx-widget-grid/src/public_api.ts' "${SRC_DIR}/tsconfig.json"; then
  verifier_error "tsconfig.json does not carry the repointed paths entry projects/ngx-widget-grid/src/public_api.ts - environment/adaptation.patch (AD-1) is not applied to this tree."
fi

( cd "${SRC_DIR}" && node -e 'const fs=require("fs");const t=["e2e/src/app.e2e-spec.ts","e2e/src/app.po.ts"];let left=0;for(const p of t){const had=fs.existsSync(p);if(had)fs.rmSync(p,{recursive:true,force:true});const now=fs.existsSync(p);if(now)left++;console.log((had?"removed":"absent")+" "+p+(now?" STILL-PRESENT":""));}process.exit(left?1:0)' ) \
  > "${LOGS_DIR}/e2e-scrub.txt" 2>&1
E2E_RC=$?
cat "${LOGS_DIR}/e2e-scrub.txt"
if [ "${E2E_RC}" -ne 0 ]; then
  verifier_error "the two e2e survivors (e2e/src/app.e2e-spec.ts, e2e/src/app.po.ts) could not be removed from ${SRC_DIR} - see ${LOGS_DIR}/e2e-scrub.txt. They escape evaluation/workspace_scrub.mjs by name shape, so leaving them ships a hidden protractor suite alongside the answer."
fi

node -e 'const fs=require("fs");const p=process.argv[1];const had=fs.existsSync(p);if(had)fs.rmSync(p,{recursive:true,force:true});console.log((had?"erased":"absent")+" "+p+" still-present="+fs.existsSync(p));process.exit(fs.existsSync(p)?1:0)' "${SRC_DIR}/${OUTDIR_PARENT}" \
  > "${LOGS_DIR}/erase-dist.txt" 2>&1
ERASE_RC=$?
node -e 'const fs=require("fs");const p=process.argv[1];const had=fs.existsSync(p);if(had)fs.rmSync(p,{recursive:true,force:true});console.log((had?"erased":"absent")+" "+p+" still-present="+fs.existsSync(p));process.exit(fs.existsSync(p)?1:0)' "${SRC_DIR}/.angular" \
  >> "${LOGS_DIR}/erase-dist.txt" 2>&1
ERASE_RC2=$?
cat "${LOGS_DIR}/erase-dist.txt"
if [ "${ERASE_RC}" -ne 0 ] || [ "${ERASE_RC2}" -ne 0 ]; then
  verifier_error "could not erase the stale build residue (${OUTDIR_PARENT}/ rc=${ERASE_RC}, .angular rc=${ERASE_RC2}) - see ${LOGS_DIR}/erase-dist.txt. The residue is the CLEAN state (its main bundle contains the very statement D03 deletes, and its .map carries 55889 characters of sourcesContent), so building on top of it would grade a pristine application and report a false green. Refusing to continue."
fi
BUILD_STAMP="${LOGS_DIR}/.build_stamp_$$"
: > "${BUILD_STAMP}"

( cd "${SRC_DIR}" && NG_CLI_ANALYTICS=false ./node_modules/.bin/ng build --configuration production --base-href=/ngx-widget-grid/ ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
printf '%s\n' "${BUILD_RC}" > "${LOGS_DIR}/build-rc.txt"
if [ "${BUILD_RC}" -ne 0 ]; then
  tail -60 "${LOGS_DIR}/build.log" >&2
  verifier_error "build failed with rc=${BUILD_RC} (authorized script body, 0 invented flags: ng build --configuration production --base-href=/ngx-widget-grid/; log ${LOGS_DIR}/build.log)"
fi

OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"
if [ ! -f "${OUT_INDEX}" ]; then
  verifier_error "build reported rc=0 but produced no ${OUTDIR}/index.html"
fi
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "${OUTDIR}/index.html is not newer than this run's BUILD_STAMP - the build did not emit into ${OUTDIR}, so what is on disk is residue rather than this run's product. Refusing to serve it."
fi
if ! grep -q "<base href=\"${BASE_HREF}\"" "${OUT_INDEX}"; then
  verifier_error "${OUTDIR}/index.html carries no <base href=\"${BASE_HREF}\"> - the build did not honour --base-href=${BASE_HREF}, so every emitted resource resolves away from the staged path (TRAP-1)"
fi
GHB_HITS="$(awk '/ghbtns\.com/{n++} END{print n+0}' "${OUT_INDEX}")"
EXT_HITS="$(awk '/(src|href)="https?:\/\//{n++} END{print n+0}' "${OUT_INDEX}")"
echo "adaptation guard on the built document: ghbtns.com ${GHB_HITS} hit(s), any external http(s) src/href ${EXT_HITS} hit(s) (both must be 0)" > "${LOGS_DIR}/adaptation-guard.txt"
cat "${LOGS_DIR}/adaptation-guard.txt"
if [ "${GHB_HITS}" != "0" ] || [ "${EXT_HITS}" != "0" ]; then
  verifier_error "the built ${OUTDIR}/index.html still references an external host (ghbtns.com ${GHB_HITS}, external src/href ${EXT_HITS}) - environment/adaptation.patch (AD-11) is not in this tree, so every checkpoint could hang on a third-party request the grading environment cannot answer."
fi

find "${SRC_DIR}/${OUTDIR}" -name '*.map' -type f 2>/dev/null > "${LOGS_DIR}/sourcemap-census.txt"
MAP_N="$(wc -l < "${LOGS_DIR}/sourcemap-census.txt" | tr -d ' ')"
: > "${LOGS_DIR}/sourcemap-stale.txt"
while IFS= read -r MAPF; do
  if [ -n "${MAPF}" ] && [ -z "$(find "${MAPF}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
    printf '%s\n' "${MAPF}" >> "${LOGS_DIR}/sourcemap-stale.txt"
  fi
done < "${LOGS_DIR}/sourcemap-census.txt"
MAP_STALE_N="$(wc -l < "${LOGS_DIR}/sourcemap-stale.txt" | tr -d ' ')"
echo "sourcemap ledger: ${MAP_N} .map under ${OUTDIR}; ${MAP_STALE_N} of them NOT newer than BUILD_STAMP (census: sourcemap-census.txt, offenders: sourcemap-stale.txt)" > "${LOGS_DIR}/sourcemap-guard.txt"
cat "${LOGS_DIR}/sourcemap-guard.txt"
if [ "${MAP_STALE_N}" != "0" ]; then
  verifier_error "${MAP_STALE_N} sourcemap file(s) under ${OUTDIR} are NOT newer than this run's BUILD_STAMP, i.e. they were delivered in the tree or left behind by an earlier run. A stale .map carries sourcesContent = the pre-mutation source of every mutated file (offenders in ${LOGS_DIR}/sourcemap-stale.txt). Refusing to grade a leaked task."
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
STAGE="${LOGS_DIR}/stage_$$"
mkdir -p "${STAGE}"
ln -sfn "${SRC_DIR}/${OUTDIR}" "${STAGE}/${STAGE_NAME}"
ln -sfn "${SRC_DIR}/${OUTDIR}/index.html" "${STAGE}/index.html"
if [ ! -e "${STAGE}/${STAGE_NAME}/index.html" ]; then
  verifier_error "the symlink stage did not resolve: ${STAGE}/${STAGE_NAME}/index.html is not reachable through the link to ${SRC_DIR}/${OUTDIR}"
fi
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${STAGE}" --port "${PORT}" > "${LOGS_DIR}/serve.log" 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null; rm -f "${STAGE}/${STAGE_NAME}" "${STAGE}/index.html" 2>/dev/null; rmdir "${STAGE}" 2>/dev/null; rm -f "${BUILD_STAMP}" "${SUP_STOP}" 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}${BASE_HREF}"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verifier_error "static server not ready on ${PORT}${BASE_HREF} (see ${LOGS_DIR}/serve.log)"
fi

probe_code() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}$1"; }
strip_prefix() { printf '%s' "$1" | sed -e "s#^${BASE_HREF}##" -e 's#^\./##' -e 's#^/##'; }
DOC_RESOURCES="$(grep -o -E '(src|href)="[^"]+"' "${OUT_INDEX}" | sed -E 's/^(src|href)="//; s/"$//' | grep -v -E '^(https?:)?//' | grep -v -E '^data:' | grep -v -E '^#' | sort -u)"
RES_N="$(printf '%s\n' "${DOC_RESOURCES}" | grep -c . | tr -d ' ')"
: > "${LOGS_DIR}/readiness.txt"
PROBE_FAIL=0
for R in ${DOC_RESOURCES}; do
  REL="$(strip_prefix "${R}")"
  C="$(probe_code "${BASE_HREF}${REL}")"
  printf '%s %s %s\n' "${R}" "${BASE_HREF}${REL}" "${C}" >> "${LOGS_DIR}/readiness.txt"
  if [ "${C}" != "200" ]; then PROBE_FAIL=1; fi
done
ROOT_CODE="$(probe_code /)"
BASE_CODE="$(probe_code "${BASE_HREF}")"
printf 'the staged site root / %s\n' "${ROOT_CODE}" >> "${LOGS_DIR}/readiness.txt"
printf 'the base path %s %s\n' "${BASE_HREF}" "${BASE_CODE}" >> "${LOGS_DIR}/readiness.txt"
echo "document-referenced local resources: ${RES_N}" >> "${LOGS_DIR}/readiness.txt"
cat "${LOGS_DIR}/readiness.txt"
if [ "${ROOT_CODE}" != "200" ]; then
  verifier_error "the staged site root / answered ${ROOT_CODE} (expected 200) - the ${STAGE}/index.html symlink is missing or ${OUTDIR} is not being served through the stage"
fi
if [ "${BASE_CODE}" != "200" ]; then
  verifier_error "the base path ${BASE_HREF} answered ${BASE_CODE} (expected 200) - the ${STAGE}/${STAGE_NAME} symlink is missing or points somewhere else (TRAP-1)"
fi
if [ "${RES_N}" -lt 1 ]; then
  verifier_error "the built ${OUTDIR}/index.html references 0 local resources - it is not an Angular document, so the build did not emit what this task grades"
fi
if [ "${PROBE_FAIL}" -ne 0 ]; then
  verifier_error "one or more resources referenced BY THE BUILT DOCUMENT itself did not answer 200 under ${BASE_HREF} (see ${LOGS_DIR}/readiness.txt). With <base href=\"${BASE_HREF}\"> asserted above, a 404 here means the emitted tree is incomplete or is staged at the wrong path."
fi

MAIN_RES="$(printf '%s\n' "${DOC_RESOURCES}" | grep -E 'main[^/]*\.js$' | head -1)"
if [ -z "${MAIN_RES}" ]; then
  verifier_error "the built ${OUTDIR}/index.html names no main*.js bundle among its own resources (${RES_N} local resource(s) total) - cannot verify that the observation bridge reached the bundle"
fi
MAIN_REL="$(strip_prefix "${MAIN_RES}")"
BRIDGE_HITS="$(curl -s "http://127.0.0.1:${PORT}${BASE_HREF}${MAIN_REL}" | awk '/__RB__/{n++} END{print n+0}')"
echo "bridge guard: ${BRIDGE_HITS} line(s) of the served ${BASE_HREF}${MAIN_REL} carrying the __RB__ namespace" > "${LOGS_DIR}/bridge-guard.txt"
cat "${LOGS_DIR}/bridge-guard.txt"
if [ "${BRIDGE_HITS:-0}" -lt 1 ]; then
  verifier_error "the served main bundle carries 0 occurrences of the __RB__ namespace, so environment/instrumentation.patch is not in this build. Every checkpoint would read a sentinel and the task would be unmeasurable. Refusing to grade."
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 25000 \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/runner-exit.txt"
if [ "${RUNNER_EXIT}" -eq 4 ]; then
  verifier_error "dsl_runner crashed (see ${LOGS_DIR}/runner-stdout.txt)"
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
}
json.dump(summary, open(reward_path, "w"), indent=2)
print(json.dumps(summary))
sys.exit(0 if reward == 1.0 else 1)
__PY__
exit $?
