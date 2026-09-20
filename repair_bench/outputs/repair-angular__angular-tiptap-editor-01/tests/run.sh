#!/bin/bash
# RepairBench verifier for repair-angular__angular-tiptap-editor-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/angular-tiptap-editor})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/angular-tiptap-editor}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR_PRIMARY="demo-dist/browser"
OUTDIR_ALT="demo-dist"
OUTDIR=""
NM_DEPOT="${WLB_NM_DEPOT:-${PIPELINE_ROOT}/_build/tmp/s9g_nm/angular-tiptap-editor/node_modules}"
NM_ARCHIVE="${WLB_NM_ARCHIVE:-${PIPELINE_ROOT}/_build/tmp/s1_nm_bake/angular-tiptap-editor.nm.tar.gz}"
NM_ARCHIVE_EXPECT_BASENAME="angular-tiptap-editor.nm.tar.gz"
PORT="${WLB_PORT:-12222}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"
BRIDGE="__rb_ate__"
PROBE_VERSION="ate-probe-1"
MARKER_LIB_TOC="Table of Contents"
MARKER_STORAGE_KEY="ate_demo_config"
MARKER_EXT_FONT="fonts.googleapis.com"
APP_ROOT_TAG="<app-root>"
BUILD_CMD="npm run build"
DSL_TIMEOUT="9000"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1). The read-only support directory is _build/gates/angular-tiptap-editor and is never used as the answering tree."
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  if [ -d "${SRC_DIR}/node_modules" ]; then
    verifier_error "${SRC_DIR}/node_modules exists but node_modules/.bin/ng is not executable. Refusing to delete and rebuild an existing dependency tree; remove it deliberately or point WLB_NM_DEPOT / WLB_NM_ARCHIVE at a usable supply."
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
      verifier_error "WLB_NM_ARCHIVE resolves to ${NM_BASE}, expected exactly ${NM_ARCHIVE_EXPECT_BASENAME}. Refusing to supply dependencies from a near-name archive: building a different seed's tree would silently invalidate every reading."
    fi
    DEP_START=$(date +%s)
    tar -xzf "${NM_ARCHIVE}" -C "${SRC_DIR}" > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    DEP_END=$(date +%s)
    echo "dependency source: tier 3 frozen dependency archive ${NM_ARCHIVE} (90994838 B, sha256-16 a466abd1968f7ff1, 52603 entries, root entry node_modules/, layout NPM_FLAT; frozen by 'npm ci --no-audit --no-fund' rc=0 in 72152 ms on node v24.19.0) via tar -xzf (rc=${DEP_RC}, $((DEP_END - DEP_START))s)" >> "${LOGS_DIR}/install.log"
  else
    echo "dependency source: dependency cache ${NM_DEPOT} and archive ${NM_ARCHIVE} both unusable, falling back to the declared install (npm install --no-audit --no-fund)" > "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: tier 4 registry install (rc=${DEP_RC}) - NEEDS NETWORK, which the grading environment does not have; and src/extensions/task.extension.ts:1 imports the UNDECLARED ghost dep @tiptap/extension-list, so a fresh resolve is not guaranteed to reproduce the frozen tree. This tier is a last resort and is logged, not trusted." >> "${LOGS_DIR}/install.log"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "no usable node_modules (see ${LOGS_DIR}/install.log); neither the dependency cache ${NM_DEPOT} nor the archive ${NM_ARCHIVE} provided node_modules/.bin/ng. 🔴 The 90994838 B archive angular-tiptap-editor.nm.tar.gz WAS on disk at design time (_build/tmp/s1_nm_bake/angular-tiptap-editor.nm.tar.gz, sha256-16 a466abd1968f7ff1, 52603 entries, root node_modules/; re-frozen 2026-09-18T02:51:05.562Z by 'tar -czf _build/tmp/s1_nm_bake/angular-tiptap-editor.nm.tar.gz -C _build/gates/angular-tiptap-editor node_modules' rc=0). If it has since been reclaimed, re-bake it with 'npm ci --no-audit --no-fund' (or 'tar -czf _build/tmp/s1_nm_bake/angular-tiptap-editor.nm.tar.gz -C _build/gates/angular-tiptap-editor node_modules' against a read-only support directory whose node_modules is in place) before boarding a lane."
fi

node -e 'const fs=require("fs");for(const p of process.argv.slice(1)){const had=fs.existsSync(p);if(had){fs.rmSync(p,{recursive:true,force:true});}console.log((had?"erased":"absent")+": "+p);}' \
  "${SRC_DIR}/demo-dist/browser" "${SRC_DIR}/demo-dist" > "${LOGS_DIR}/outdir-erase.txt" 2>&1
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
  verifier_error "build failed rc=${BUILD_RC} (${BUILD_CMD}, see ${LOGS_DIR}/build.log). 🔴 angular.json has 2 projects (angular-tiptap-editor's demo and angular-tiptap-editor) and NO top-level defaultProject, and demo:build declares NO defaultConfiguration, so which project a bare 'ng build' picks is not statically decidable - read build.log for the CLI's own verdict. The gate recipe is reproduced verbatim here (npm run build, provenance gate_recipe.build); this file does not substitute a project name of its own."
fi

if [ -f "${SRC_DIR}/${OUTDIR_PRIMARY}/index.html" ]; then
  OUTDIR="${OUTDIR_PRIMARY}"
  echo "outdir resolution: ${OUTDIR_PRIMARY}/index.html present => OUTDIR=${OUTDIR} (the @angular-devkit/build-angular:application layout: the builder hard-codes a browser/ level under the string outputPath; the recorded output-directory correction registers this against provenance's 'demo-dist')" > "${LOGS_DIR}/outdir-resolution.txt"
elif [ -f "${SRC_DIR}/${OUTDIR_ALT}/index.html" ]; then
  OUTDIR="${OUTDIR_ALT}"
  echo "outdir resolution: ${OUTDIR_PRIMARY}/index.html ABSENT, ${OUTDIR_ALT}/index.html present => OUTDIR=${OUTDIR} (flat layout; matches provenance gate_recipe.outdir verbatim, so the nested-browser derivation would be the thing to correct)" > "${LOGS_DIR}/outdir-resolution.txt"
else
  verifier_error "the build reported rc=0 but produced neither ${OUTDIR_PRIMARY}/index.html nor ${OUTDIR_ALT}/index.html - cannot resolve the served directory (see ${LOGS_DIR}/build.log). 🔴 Most likely cause on this seed: a bare 'ng build' resolved to the LIBRARY project angular-tiptap-editor instead of demo, because angular.json declares no defaultProject. That is a recipe-level finding, not an answer-quality finding, hence exit 2."
fi
cat "${LOGS_DIR}/outdir-resolution.txt"
OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"

if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "${OUTDIR}/index.html is not newer than the build start - the build did not emit into ${OUTDIR} (stale tree). Refusing to serve a tree this run did not produce."
fi

BASE_HREF_HITS="$(awk 'index($0,"<base href=\"/\""){n++} END{print n+0}' "${OUT_INDEX}" 2>/dev/null)"
BASE_HREF_REL_HITS="$(awk 'index($0,"<base href=\"./\""){n++} END{print n+0}' "${OUT_INDEX}" 2>/dev/null)"
echo "base-href guard: ${BASE_HREF_HITS} occurrence(s) of <base href=\"/\"> and ${BASE_HREF_REL_HITS} of <base href=\"./\"> in ${OUTDIR}/index.html" > "${LOGS_DIR}/base-href-guard.txt"
cat "${LOGS_DIR}/base-href-guard.txt"
if [ "${BASE_HREF_HITS:-0}" -lt 1 ]; then
  verifier_error "${OUTDIR}/index.html carries no <base href=\"/\"> (src/index.html:10 declares it). Every relative asset URL would resolve against the wrong base and the page would boot empty, turning all 24 checkpoints into sentinels."
fi

find "${SRC_DIR}/${OUTDIR}" -name '*.map' -type f 2>/dev/null > "${LOGS_DIR}/sourcemap-census.txt"
MAP_N="$(awk 'END{print NR+0}' "${LOGS_DIR}/sourcemap-census.txt" 2>/dev/null)"
JS_N="$(find "${SRC_DIR}/${OUTDIR}" -name '*.js' -type f 2>/dev/null | awk 'END{print NR+0}')"
SMALLEST_JS_BYTES="$(find "${SRC_DIR}/${OUTDIR}" -name '*.js' -type f -exec wc -c {} + 2>/dev/null | awk '$2!="total"{print $1}' | sort -n | awk 'END{print $1+0}')"
{
  echo "sourcemap ledger: ${MAP_N} .map file(s) under ${OUTDIR} (census: sourcemap-census.txt)"
  echo "minification ledger: ${JS_N} .js file(s) under ${OUTDIR}; largest-bundle byte census in sourcemap-census.txt; probe byte ${SMALLEST_JS_BYTES}"
  echo "verdict: NOT GRADED. demo:build's options (angular.json:31-44) declare neither sourceMap nor optimization; the two configurations that DO declare them (angular.json:15-30: development optimization false / sourceMap true, production optimization true / sourceMap false) are opposite, and a bare 'npm run build' selects neither because demo:build has no defaultConfiguration; @angular/build's own schema defaults are unreadable on this host (node_modules absent, dependency archive missing). This run's numbers are the evidence that promotes this line from ledger to guard."
} > "${LOGS_DIR}/sourcemap-guard.txt"
cat "${LOGS_DIR}/sourcemap-guard.txt"

ENTRY_JS_LIST="$(node -e 'const fs=require("fs");const t=fs.readFileSync(process.argv[1],"utf8");const out=[...t.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m)=>m[1].replace(/^\.\//,"").replace(/^\//,""));process.stdout.write(out.join("\n"));' "${OUT_INDEX}")"
ENTRY_CSS_LIST="$(node -e 'const fs=require("fs");const t=fs.readFileSync(process.argv[1],"utf8");const out=[...t.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m)=>m[1].replace(/^\.\//,"").replace(/^\//,""));process.stdout.write(out.join("\n"));' "${OUT_INDEX}")"
ENTRY_JS_N="$(printf '%s\n' "${ENTRY_JS_LIST}" | grep -c .)"
ENTRY_CSS_N="$(printf '%s\n' "${ENTRY_CSS_LIST}" | grep -c .)"
echo "hashed assets: ${ENTRY_JS_N} script entry(ies), ${ENTRY_CSS_N} stylesheet entry(ies) named by ${OUTDIR}/index.html" > "${LOGS_DIR}/asset-resolution.txt"
printf 'js: %s\ncss: %s\n' "${ENTRY_JS_LIST}" "${ENTRY_CSS_LIST}" >> "${LOGS_DIR}/asset-resolution.txt"
cat "${LOGS_DIR}/asset-resolution.txt"
if [ "${ENTRY_JS_N:-0}" -lt 1 ]; then
  verifier_error "${OUTDIR}/index.html names no <script src=...> entry - cannot prove the probe is in the served tree, so every checkpoint would read a sentinel."
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
  verifier_error "static server not ready on ${PORT} (serving ${SRC_DIR}/${OUTDIR})"
fi

JS_CODES=""
while IFS= read -r JS; do
  [ -z "${JS}" ] && continue
  C="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/${JS}")"
  JS_CODES="${JS_CODES} /${JS} ${C}"
  if [ "${C}" != "200" ]; then
    verifier_error "the entry script /${JS} answered ${C} - the served directory or the build output is wrong; expected ${OUTDIR} served at the site root"
  fi
done <<EOF_JS
${ENTRY_JS_LIST}
EOF_JS
CSS_CODES=""
while IFS= read -r CSS; do
  [ -z "${CSS}" ] && continue
  C="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/${CSS}")"
  CSS_CODES="${CSS_CODES} /${CSS} ${C}"
  if [ "${C}" != "200" ]; then
    verifier_error "the stylesheet /${CSS} answered ${C} - expected ${OUTDIR} served at the site root. 🔴 On this seed the styles array (angular.json:38-42) pulls node_modules/@fontsource/material-symbols-outlined/index.css, whose woff2 assets must be emitted beside it; a 404 here means the icon font did not bundle."
  fi
done <<EOF_CSS
${ENTRY_CSS_LIST}
EOF_CSS
ROOT_DOC="${LOGS_DIR}/served-root-document.html"
ROOT_CODE="$(curl -s -o "${ROOT_DOC}" -w '%{http_code}' "http://127.0.0.1:${PORT}/")"
ICON_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/favicon.ico")"
{
  echo "readiness: entry bundles${JS_CODES}${CSS_CODES}"
  echo "readiness: / ${ROOT_CODE} | /favicon.ico ${ICON_CODE} (ledger only: adaptation.patch sets angular.json options.assets to [] because src/favicon.ico is absent from the read-only support directory, so 404 is the expected reading)"
} > "${LOGS_DIR}/readiness.txt"
cat "${LOGS_DIR}/readiness.txt"
if [ "${ROOT_CODE}" != "200" ]; then
  verifier_error "the site root / answered ${ROOT_CODE} (expected 200) - the served directory or the build output is wrong; expected ${OUTDIR} served at the site root"
fi

APP_ROOT_HITS="$(awk -v t="${APP_ROOT_TAG}" 'index($0,t){n++} END{print n+0}' "${ROOT_DOC}" 2>/dev/null)"
EXT_PATH_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/no-such-file")"
{
  echo "single-address guard: the served document at / carries ${APP_ROOT_HITS} occurrence(s) of ${APP_ROOT_TAG}"
  echo "single-address guard: GET /no-such-file ${EXT_PATH_CODE} (ledger only: this tree has no router, so an unknown path has no meaning; the graded goto target is '/' for all 24 checkpoints)"
} > "${LOGS_DIR}/single-address-guard.txt"
cat "${LOGS_DIR}/single-address-guard.txt"
if [ "${APP_ROOT_HITS:-0}" -lt 1 ]; then
  verifier_error "the document served at / carries no ${APP_ROOT_TAG} (declared at src/index.html:18 of the read-only support directory; 14 in the answering tree, because environment/adaptation.patch deletes 4 line(s) above it). The served root is not this application, so every checkpoint would read a sentinel."
fi

BRIDGE_HITS=0
PROBEVER_HITS=0
while IFS= read -r JS; do
  [ -z "${JS}" ] && continue
  BODY="${LOGS_DIR}/served-entry.js"
  curl -s "http://127.0.0.1:${PORT}/${JS}" -o "${BODY}"
  N="$(awk -v b="${BRIDGE}" 'index($0,b){n++} END{print n+0}' "${BODY}" 2>/dev/null)"
  M="$(awk -v b="${PROBE_VERSION}" 'index($0,b){n++} END{print n+0}' "${BODY}" 2>/dev/null)"
  BRIDGE_HITS=$((BRIDGE_HITS + N))
  PROBEVER_HITS=$((PROBEVER_HITS + M))
done <<EOF_BRIDGE
${ENTRY_JS_LIST}
EOF_BRIDGE
echo "bridge guard: ${BRIDGE_HITS} line(s) carrying the probe namespace ${BRIDGE} and ${PROBEVER_HITS} carrying probeVersion '${PROBE_VERSION}', across ${ENTRY_JS_N} served entry script(s)" > "${LOGS_DIR}/bridge-guard.txt"
cat "${LOGS_DIR}/bridge-guard.txt"
if [ "${BRIDGE_HITS:-0}" -lt 1 ]; then
  verifier_error "the served bundle carries 0 occurrences of ${BRIDGE}, so environment/instrumentation.patch is not in this build. Every checkpoint would read the '-' / -1 sentinel and look like 24 behavioural failures instead of one missing probe."
fi
if [ "${PROBEVER_HITS:-0}" -lt 1 ]; then
  verifier_error "the served bundle carries ${BRIDGE} but 0 occurrences of the probeVersion contract value '${PROBE_VERSION}' - the probe that shipped is not the one this tree's dsl.json was written against."
fi

FONT_HITS_DOC="$(awk -v b="${MARKER_EXT_FONT}" 'index($0,b){n++} END{print n+0}' "${ROOT_DOC}" 2>/dev/null)"
FONT_HITS_TREE="$(grep -rl -F "${MARKER_EXT_FONT}" "${SRC_DIR}/${OUTDIR}" 2>/dev/null | awk 'END{print NR+0}')"
{
  echo "offline-adaptation guard: ${FONT_HITS_DOC} occurrence(s) of '${MARKER_EXT_FONT}' in the served document, ${FONT_HITS_TREE} file(s) under ${OUTDIR} carrying it"
  echo "offline-adaptation guard: the icon font is NOT external - angular.json:39 pulls node_modules/@fontsource/material-symbols-outlined/index.css from the restored dependency tree, so icons render as ligatures offline"
} > "${LOGS_DIR}/offline-adaptation-guard.txt"
cat "${LOGS_DIR}/offline-adaptation-guard.txt"
if [ "${FONT_HITS_DOC:-0}" -ne 0 ] || [ "${FONT_HITS_TREE:-0}" -ne 0 ]; then
  verifier_error "the served tree still references ${MARKER_EXT_FONT} (${FONT_HITS_DOC} in the document, ${FONT_HITS_TREE} file(s) under ${OUTDIR}). environment/adaptation.patch removes that link from src/index.html:11-14 because the grading environment has no network; a first paint blocked on an external font timeout would put every timing budget in dsl.json at risk."
fi

REMOTE_FETCH_RE='<(img|script|link|source|iframe)[^>]*(src|href)=[^ >]{0,3}https?://|url\([^)]{0,3}https?://'
HYPERLINK_RE='<a[^>]*href=[^ >]{0,3}(https?://[a-zA-Z0-9.-]+)'
REMOTE_FETCH_DOC="$(grep -oE "$REMOTE_FETCH_RE" "${ROOT_DOC}" 2>/dev/null | awk 'END{print NR+0}')"
REMOTE_FETCH_TREE="$(grep -roE "$REMOTE_FETCH_RE" "${SRC_DIR}/${OUTDIR}" --include='*.js' --include='*.css' --include='*.html' 2>/dev/null | awk 'END{print NR+0}')"
REMOTE_FETCH_SAMPLE="$(grep -roE "$REMOTE_FETCH_RE" "${SRC_DIR}/${OUTDIR}" --include='*.js' --include='*.css' --include='*.html' 2>/dev/null | head -3 | tr '\n' ' ')"
HYPERLINK_HOSTS="$(grep -rhoE "$HYPERLINK_RE" "${SRC_DIR}/${OUTDIR}" --include='*.js' --include='*.html' 2>/dev/null | sed -E 's#.*href=[^h]*(https?://)##' | sort -u | head -6 | tr '\n' ' ')"
HYPERLINK_N="$(grep -rhoE "$HYPERLINK_RE" "${SRC_DIR}/${OUTDIR}" --include='*.js' --include='*.html' 2>/dev/null | sort -u | awk 'END{print NR+0}')"
{
  echo "remote-subresource guard: ${REMOTE_FETCH_DOC} fetchable remote reference(s) in the served document, ${REMOTE_FETCH_TREE} in the emitted tree under ${OUTDIR}"
  echo "remote-subresource guard: in scope = img/script/link/source/iframe src|href and CSS url(); out of scope by design = <a href> hyperlinks (never fetched at load)"
  echo "remote-subresource guard: hyperlink-hosts (ledger only, ${HYPERLINK_N} distinct) -> ${HYPERLINK_HOSTS:-none}"
  if [ -n "${REMOTE_FETCH_SAMPLE}" ]; then echo "remote-subresource guard: sample -> ${REMOTE_FETCH_SAMPLE}"; fi
} > "${LOGS_DIR}/remote-subresource-guard.txt"
cat "${LOGS_DIR}/remote-subresource-guard.txt"
if [ "${REMOTE_FETCH_DOC:-0}" -ne 0 ] || [ "${REMOTE_FETCH_TREE:-0}" -ne 0 ]; then
  verifier_error "the served tree still carries ${REMOTE_FETCH_DOC} fetchable remote reference(s) in the document and ${REMOTE_FETCH_TREE} in the emitted tree under ${OUTDIR} (sample: ${REMOTE_FETCH_SAMPLE:-none}). In the offline grading environment such a reference does not fail fast - it HANGS: the document load event never fires, so every checkpoint dies as setup_failure inside page.goto and one environment defect masquerades as a wall of behaviour failures. environment/adaptation.patch must localize it (self-contained data URI or a bundled asset)."
fi

TERRITORY_OK=1
for MK in "${MARKER_LIB_TOC}" "${MARKER_STORAGE_KEY}"; do
  N="$(grep -rl -F "${MK}" "${SRC_DIR}/${OUTDIR}" --include='*.js' 2>/dev/null | awk 'END{print NR+0}')"
  echo "territory guard: ${N} file(s) under ${OUTDIR} carry the literal '${MK}'" >> "${LOGS_DIR}/territory-guard.txt"
  if [ "${N:-0}" -lt 1 ]; then TERRITORY_OK=0; fi
done
echo "territory guard: ${JS_N} emitted .js file(s) under ${OUTDIR}" >> "${LOGS_DIR}/territory-guard.txt"
cat "${LOGS_DIR}/territory-guard.txt"
if [ "${TERRITORY_OK}" -ne 1 ]; then
  verifier_error "the emitted bundles do not carry both mutation-territory string literals (see ${LOGS_DIR}/territory-guard.txt). Code this task mutates is not in the served tree, so the affected checkpoints would read sentinels rather than behaviour."
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout ${DSL_TIMEOUT} \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/exit-code.txt"
cat "${LOGS_DIR}/runner-stdout.txt"
if [ ! -f "${LOGS_DIR}/checkpoint_results.json" ]; then
  verifier_error "dsl_runner exited ${RUNNER_EXIT} and wrote no checkpoint_results.json (see ${LOGS_DIR}/runner-stdout.txt)"
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
PARTITION_RC=$?

echo "partition rc=${PARTITION_RC} (0 = reward 1.0, 1 = at least one expected-green checkpoint red, 2 = no checkpoint_results.json)" >> "${LOGS_DIR}/readiness.txt"
exit ${PARTITION_RC}
