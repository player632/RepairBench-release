#!/bin/bash
# RepairBench verifier for repair-angular__sakai-ng-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/sakai-ng})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -u
_SELF="${(dirname "$0")}"
_SELF="${(cd "${_SELF}" && pwd)}"
PKG_DIR="${(cd "${_SELF}/.." && pwd)}"
PIPELINE_ROOT="${(cd "${PKG_DIR}/../../.." && pwd)}"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/sakai-ng}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR_ROOT="dist/sakai-ng"
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s0_nm_live/sakai-ng/node_modules}"
NM_ARCHIVE="${WLB_NM_ARCHIVE:-${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/sakai-ng.nm.tar.gz}"
PORT="${WLB_PORT:-8873}"
MOCK_PORT="${WLB_MOCK_PORT:-9373}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1). The read-only support directory is _build/gates/sakai-ng; it is never used as the answering tree."
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
    echo "dependency source: frozen dependency archive ${NM_ARCHIVE} (98003157 B, sha256-16 d389f47f17022e76, root entry node_modules/) via tar -xzf (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  else
    echo "dependency source: dependency cache ${NM_DEPOT} and archive ${NM_ARCHIVE} both unusable, falling back to the declared install" > "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: registry install (rc=${DEP_RC}) - NEEDS NETWORK, which the grading environment does not have" >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "no usable node_modules (see ${LOGS_DIR}/install.log); neither the dependency cache ${NM_DEPOT} nor the archive ${NM_ARCHIVE} provided node_modules/.bin/ng"
fi

node -e 'const fs=require("fs");const p=process.argv[1];const had=fs.existsSync(p);if(had){fs.rmSync(p,{recursive:true,force:true});}console.log((had?"erased":"absent")+": "+p);' "${SRC_DIR}/${OUTDIR_ROOT}" > "${LOGS_DIR}/dist-erase.txt" 2>&1
DIST_RC=$?
if [ "${DIST_RC}" -ne 0 ]; then
  verifier_error "could not erase ${SRC_DIR}/${OUTDIR_ROOT} (rc=${DIST_RC}, see ${LOGS_DIR}/dist-erase.txt). Refusing to build on top of a possibly stale dist/: a stale bundle would grade the tree green without measuring anything."
fi
cat "${LOGS_DIR}/dist-erase.txt"

BUILD_STAMP="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_STAMP}"
NG="${SRC_DIR}/node_modules/.bin/ng"

( cd "${SRC_DIR}" && NG_CLI_ANALYTICS=false "${NG}" build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  verifier_error "build failed rc=${BUILD_RC} (ng build, see ${LOGS_DIR}/build.log)"
fi

if [ -f "${SRC_DIR}/${OUTDIR_ROOT}/browser/index.html" ]; then
  SERVED="${SRC_DIR}/${OUTDIR_ROOT}/browser"
elif [ -f "${SRC_DIR}/${OUTDIR_ROOT}/index.html" ]; then
  SERVED="${SRC_DIR}/${OUTDIR_ROOT}"
else
  verifier_error "build reported rc=0 but produced no index.html under ${OUTDIR_ROOT} (looked for ${OUTDIR_ROOT}/browser/index.html then ${OUTDIR_ROOT}/index.html)"
fi
echo "served root: ${SERVED}" > "${LOGS_DIR}/outdir.txt"
OUT_INDEX="${SERVED}/index.html"
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "${OUT_INDEX} is not newer than the build start - the build did not emit into ${OUTDIR_ROOT} (stale tree)"
fi
if ! grep -q '<base href="/"' "${OUT_INDEX}"; then
  verifier_error "${OUT_INDEX} carries no document-root base href - the document was built for a different deployment path, so every lazy chunk and every asset would resolve somewhere other than the served root"
fi
JS_N=$(find "${SERVED}" -maxdepth 1 -name '*.js' -type f | wc -l | tr -d ' ')
CSS_N=$(find "${SERVED}" -maxdepth 1 -name '*.css' -type f | wc -l | tr -d ' ')
echo "outdir census: ${JS_N} top-level .js, ${CSS_N} top-level .css, index.html newer than BUILD_STAMP" >> "${LOGS_DIR}/outdir.txt"
cat "${LOGS_DIR}/outdir.txt"
if [ "${JS_N}" -lt 1 ]; then
  verifier_error "the emitted ${OUTDIR_ROOT} holds 0 top-level .js files - nothing to serve and nothing to probe"
fi

find "${SERVED}" -name '*.map' -type f 2>/dev/null > "${LOGS_DIR}/sourcemap-census.txt"
MAP_N=$(wc -l < "${LOGS_DIR}/sourcemap-census.txt" | tr -d ' ')
: > "${LOGS_DIR}/sourcemap-stale.txt"
while IFS= read -r MAPF; do
  if [ -n "${MAPF}" ] && [ -z "$(find "${MAPF}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
    printf '%s\n' "${MAPF}" >> "${LOGS_DIR}/sourcemap-stale.txt"
  fi
done < "${LOGS_DIR}/sourcemap-census.txt"
MAP_STALE_N=$(wc -l < "${LOGS_DIR}/sourcemap-stale.txt" | tr -d ' ')
echo "sourcemap ledger: ${MAP_N} .map under the served root; ${MAP_STALE_N} of them NOT newer than BUILD_STAMP (census: sourcemap-census.txt, offenders: sourcemap-stale.txt)" > "${LOGS_DIR}/sourcemap-guard.txt"
cat "${LOGS_DIR}/sourcemap-guard.txt"
if [ "${MAP_STALE_N}" != "0" ]; then
  verifier_error "${MAP_STALE_N} sourcemap file(s) under the served root are NOT newer than this run's BUILD_STAMP, i.e. they were delivered in the tree or left behind by an earlier run. A stale .map leaks the pre-mutation source of every mutated file. Refusing to grade a leaked task (offenders in ${LOGS_DIR}/sourcemap-stale.txt)."
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SERVED}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null; rm -f "${BUILD_STAMP}" "${SUP_STOP}" 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verifier_error "static server not ready on ${PORT} (mock/mirror port ${MOCK_PORT} is declared but never bound by this script)"
fi

probe_code() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}$1"; }
ROOT_CODE="$(probe_code /)"
DEEP_ROUTES="/auth/login /pages/crud /uikit/input /uikit/list /uikit/menu /uikit/table"
DEEP_BAD=""
DEEP_LOG=""
for R in ${DEEP_ROUTES}; do
  RC="$(probe_code "${R}")"
  DEEP_LOG="${DEEP_LOG}${R}=${RC} "
  if [ "${RC}" != "200" ]; then DEEP_BAD="${DEEP_BAD}${R}(${RC}) " ; fi
done
JS_ONE="$(find "${SERVED}" -maxdepth 1 -name '*.js' -type f | sort | head -1)"
JS_NAME="/${(basename "${JS_ONE}")}"
JS_CODE="$(probe_code "${JS_NAME}")"
CSS_ONE="$(find "${SERVED}" -maxdepth 1 -name '*.css' -type f | sort | head -1)"
CSS_CODE="n/a"
if [ -n "${CSS_ONE}" ]; then CSS_CODE="$(probe_code "/${(basename "${CSS_ONE}")}")"; fi
IMG_CODE="$(probe_code /demo/images/product/bamboo-watch.jpg)"
echo "readiness: / ${ROOT_CODE} | ${JS_NAME} ${JS_CODE} | css ${CSS_CODE} | /demo/images/product/bamboo-watch.jpg ${IMG_CODE} | deep links: ${DEEP_LOG}" > "${LOGS_DIR}/readiness.txt"
cat "${LOGS_DIR}/readiness.txt"
fail_probe() {
  verifier_error "$1 answered $2 (expected 200) - the served directory or the build output is wrong; expected ${OUTDIR_ROOT}/browser served at the site root with single-page fallback ON"
}
[ "${ROOT_CODE}" = "200" ] || fail_probe "the site root /" "${ROOT_CODE}"
if [ -n "${DEEP_BAD}" ]; then
  verifier_error "these deep links did not answer 200: ${DEEP_BAD}- the router uses REAL paths, so serve_static.mjs single-page fallback must answer a nested address with the document. Without it every checkpoint whose route is not / degrades to a setup_failure and the tree measures nothing."
fi
[ "${JS_CODE}" = "200" ] || fail_probe "a top-level bundle ${JS_NAME}" "${JS_CODE}"
[ "${IMG_CODE}" = "200" ] || fail_probe "the localised demo image /demo/images/product/bamboo-watch.jpg" "${IMG_CODE}"

cat > "${LOGS_DIR}/probe-literals.txt" <<'PROBES'
topbar-menu-toggle
topbar-theme-toggle
topbar-theme-icon
topbar-palette-toggle
config-menumode
float-configurator
menu-overlay-title
crud-new
crud-row-name-
crud-row-edit-
crud-dialog-name
crud-dialog-cancel
crud-save
ac-country
PROBES
PROBE_MISSING="$(node -e '
const fs=require("fs"),path=require("path");
const dir=process.argv[1];
const lits=fs.readFileSync(process.argv[2],"utf8").split("\n").filter(Boolean);
const files=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/[.]js$/.test(e.name))files.push(p);}})(dir);
let blob="";for(const f of files)blob+=fs.readFileSync(f,"utf8");
const counts={},missing=[];
for(const l of lits){let n=0,i=0;while((i=blob.indexOf(l,i))>=0){n++;i+=l.length;}counts[l]=n;if(n<1)missing.push(l);}
fs.writeFileSync(process.argv[3],JSON.stringify({dir:dir,js_files:files.length,js_bytes:blob.length,literals:lits.length,counts:counts,missing:missing},null,1));
console.log(missing.length);
' "${SERVED}" "${LOGS_DIR}/probe-literals.txt" "${LOGS_DIR}/bundle-probe.json")"
echo "instrumentation bundle probe: ${PROBE_MISSING} of 14 literal(s) missing from the served *.js (per-literal counts in bundle-probe.json)" > "${LOGS_DIR}/bundle-probe.txt"
cat "${LOGS_DIR}/bundle-probe.txt"
if [ "${PROBE_MISSING}" != "0" ]; then
  verifier_error "${PROBE_MISSING} instrumentation literal(s) are absent from the served bundles, so environment/instrumentation.patch is not in this build. Every target-based reading would fail and the task would be unmeasurable. Refusing to grade (missing list in ${LOGS_DIR}/bundle-probe.json)."
fi

cat > "${LOGS_DIR}/marker-literals.txt" <<'MARKERS'
Manage Products
SAKAI
Orders for
View Source
Get Started
MARKERS
MARKER_MISSING="$(node -e '
const fs=require("fs"),path=require("path");
const dir=process.argv[1];
const lits=fs.readFileSync(process.argv[2],"utf8").split("\n").filter(Boolean);
const files=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/[.]js$/.test(e.name))files.push(p);}})(dir);
let blob="";for(const f of files)blob+=fs.readFileSync(f,"utf8");
const counts={},missing=[];
for(const l of lits){let n=0,i=0;while((i=blob.indexOf(l,i))>=0){n++;i+=l.length;}counts[l]=n;if(n<1)missing.push(l);}
fs.writeFileSync(process.argv[3],JSON.stringify({dir:dir,js_files:files.length,markers:lits.length,counts:counts,missing:missing},null,1));
console.log(missing.length);
' "${SERVED}" "${LOGS_DIR}/marker-literals.txt" "${LOGS_DIR}/marker-probe.json")"
echo "seed-content marker probe: ${MARKER_MISSING} of 5 marker(s) missing from the served *.js" > "${LOGS_DIR}/marker-probe.txt"
cat "${LOGS_DIR}/marker-probe.txt"
if [ "${MARKER_MISSING}" != "0" ]; then
  verifier_error "${MARKER_MISSING} seed-content marker(s) are absent from the served bundles, so the served root was not compiled from this source tree. Refusing to grade a tree that cannot show the defects."
fi

OFFLINE_READ="$(node -e '
const fs=require("fs"),path=require("path");
const root=process.argv[1];
const files=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/[.](ts|html|scss|css|json)$/.test(e.name))files.push(p);}})(root);
let fonts=0,cdnFiles=0;
const cdnList=[];
for(const f of files){const s=fs.readFileSync(f,"utf8");
  let n=0,i=0;while((i=s.indexOf("fonts.cdnfonts.com",i))>=0){n++;i+=18;}
  fonts+=n;
  if(s.indexOf("https://primefaces.org/cdn/")>=0){cdnFiles++;cdnList.push(path.relative(root,f));}}
fs.writeFileSync(process.argv[2],JSON.stringify({root:root,files_scanned:files.length,webfont_hits:fonts,cdn_files:cdnFiles,cdn_file_list:cdnList},null,1));
console.log(fonts+" "+cdnFiles);
' "${SRC_DIR}/src" "${LOGS_DIR}/offline-guard.json")"
WEBFONT_HITS="$(echo "${OFFLINE_READ}" | cut -d' ' -f1)"
CDN_FILES="$(echo "${OFFLINE_READ}" | cut -d' ' -f2)"
echo "offline guard: ${WEBFONT_HITS} hit(s) of the removed webfont host (must be 0); ${CDN_FILES} file(s) still carrying a remote CDN image address (registered residue ceiling 10)" > "${LOGS_DIR}/offline-guard.txt"
cat "${LOGS_DIR}/offline-guard.txt"
if [ "${WEBFONT_HITS}" != "0" ]; then
  verifier_error "${WEBFONT_HITS} reference(s) to the removed external webfont host are back in src/. This tree is offline by construction; a rendering that depends on a remote font is not reproducible in the grading environment."
fi
if [ "${CDN_FILES}" -gt 10 ]; then
  verifier_error "${CDN_FILES} source file(s) carry a remote CDN image address, above the 10 registered as offline residue at packaging time. Either a remote dependency was re-added or an observed route lost its localised image; both change what the checkpoints can see (list in ${LOGS_DIR}/offline-guard.json)."
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
