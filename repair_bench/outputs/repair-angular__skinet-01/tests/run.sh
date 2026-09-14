#!/bin/bash
# RepairBench verifier for repair-angular__skinet-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/skinet})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/skinet}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
APP_DIR="${SRC_DIR}/client"
OUTDIR="${SRC_DIR}/API/wwwroot"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/skinet.nm.tar.gz"
if [ ! -f "${NM_TAR}" ] && [ -f "${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/skinet.nm.tar.gz" ]; then
  NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/skinet.nm.tar.gz"
fi
PORT="${WLB_PORT:-8948}"
STALE_PORT="${WLB_STALE_PORT:-9448}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"
verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}
if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1)"
fi
if [ ! -d "${APP_DIR}" ]; then
  verifier_error "APP_DIR ${APP_DIR} does not exist - the Angular application root is the client/ subdirectory of the tree, and this tree does not carry it, so the wrong tree was supplied"
fi

if [ ! -x "${APP_DIR}/node_modules/.bin/ng" ]; then
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" -C . ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: frozen dependency archive ${NM_TAR} unpacked at the tree root (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${APP_DIR}" && npm ci --no-audit --no-fund --offline ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: npm ci against the local npm cache, offline, inside client/ (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    if [ ! -x "${APP_DIR}/node_modules/.bin/ng" ]; then
      ( cd "${APP_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
      DEP_RC=$?
      echo "dependency source: registry install npm install --no-audit --no-fund inside client/ (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    fi
  fi
fi
if [ ! -x "${APP_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "no usable node_modules: ${APP_DIR}/node_modules/.bin/ng is absent or not executable (see ${LOGS_DIR}/install.log)"
fi

node -e '
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const dir=process.argv[1], out=process.argv[2];
const rows=[];
let bytes=0;
const walk=(d)=>{ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name);
  if(e.isDirectory()){walk(p);} else if(e.isFile()){ const st=fs.statSync(p); bytes+=st.size;
    rows.push({path:path.relative(dir,p),bytes:st.size,mtime:st.mtime.toISOString(),
      sha256_16:crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0,16)}); } } };
if(fs.existsSync(dir)) walk(dir);
rows.sort((a,b)=>a.path<b.path?-1:1);
fs.writeFileSync(out, JSON.stringify({generated_at:new Date().toISOString(),outdir:dir,
  existed:fs.existsSync(dir),file_count:rows.length,total_bytes:bytes,files:rows},null,1));
console.log("outdir pre-build inventory: "+rows.length+" files / "+bytes+" bytes -> "+out);
' "${OUTDIR}" "${LOGS_DIR}/outdir_prebuild_inventory.json" > "${LOGS_DIR}/outdir_inventory.log" 2>&1
if [ ! -f "${LOGS_DIR}/outdir_prebuild_inventory.json" ]; then
  verifier_error "could not inventory the pre-existing ${OUTDIR} before erasing it (see ${LOGS_DIR}/outdir_inventory.log) - refusing to erase tracked content before recording its inventory"
fi

if [ -e "${OUTDIR}" ]; then
  node -e 'const fs=require("fs");fs.rmSync(process.argv[1],{recursive:true,force:true,maxRetries:5});' "${OUTDIR}" \
    > "${LOGS_DIR}/outdir_wipe.log" 2>&1
  echo "tracked outdir erased before build: rc=$? (${OUTDIR})" >> "${LOGS_DIR}/outdir_wipe.log"
fi
if [ -e "${OUTDIR}" ]; then
  verifier_error "could not erase the pre-existing ${OUTDIR} before building (see ${LOGS_DIR}/outdir_wipe.log) - refusing to grade a tree whose output directory may predate this run, because API/wwwroot is a tracked directory and its committed artifacts would otherwise be served as if they were the output of this build"
fi

if [ "${RB_STALE_CONTROL:-0}" = "1" ]; then
  STALE_LISTENERS="$(lsof -nP -iTCP:"${STALE_PORT}" -sTCP:LISTEN 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')"
  if [ -z "${STALE_LISTENERS}" ]; then
    verifier_error "could not probe the staleness-check port ${STALE_PORT} - a port-probe failure is never treated as free, so the staleness check refuses to run rather than guess"
  fi
  if [ "${STALE_LISTENERS}" != "0" ]; then
    verifier_error "the staleness-check port ${STALE_PORT} already has ${STALE_LISTENERS} listener(s) - a server this run did not start would answer the checkpoint runner, which invalidates the staleness check; free the port or pass a different WLB_STALE_PORT and re-run"
  fi
  mkdir -p "${OUTDIR}"
  CTRL_STOP="${LOGS_DIR}/.ctrl_stop_$$"
  ( while [ ! -f "${CTRL_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${OUTDIR}" --port "${STALE_PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
  CTRL_PID=$!
  sleep 1.5
  node "${EVAL_ROOT}/dsl_runner.mjs" \
    --dsl "${_SELF}/dsl.json" \
    --base-url "http://127.0.0.1:${STALE_PORT}" \
    --timeout 4000 \
    --only F01,F02,F03,F04,F05,F06,F07,F08,F09,F10,F11,F12 \
    --out "${LOGS_DIR}/stale_control_results.json" > "${LOGS_DIR}/stale-control-stdout.txt" 2>&1
  CTRL_RC=$?
  touch "${CTRL_STOP}" 2>/dev/null
  pkill -P ${CTRL_PID} 2>/dev/null
  kill ${CTRL_PID} 2>/dev/null
  for _ in $(seq 1 20); do
    if [ "$(lsof -nP -iTCP:"${STALE_PORT}" -sTCP:LISTEN 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')" = "0" ]; then break; fi
    sleep 0.3
  done
  CTRL_LEFT="$(lsof -nP -iTCP:"${STALE_PORT}" -sTCP:LISTEN 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')"
  node -e '
const fs=require("fs");
const res=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
const rows=res.checkpoint_results||[];
const green=rows.filter((r)=>r.status==="pass").map((r)=>r.id);
const out={generated_at:new Date().toISOString(),mode:"stale-negative-control",build_skipped:true,
  served_dir:process.argv[3],runner_rc:Number(process.argv[2]),checkpoints:rows.length,green: green,
  green_count:green.length,
  verdict: green.length===0 ? "CONTROL_OK_NO_BUILD_NO_GREEN" : "CONTROL_FAILED_STALE_FACE_WENT_GREEN"};
fs.writeFileSync(process.argv[4],JSON.stringify(out,null,1));
console.log("staleness negative control: "+out.verdict+" (green "+green.length+"/"+rows.length+")");
if(green.length!==0) process.exit(3);
' "${LOGS_DIR}/stale_control_results.json" "${CTRL_RC}" "${OUTDIR}" "${LOGS_DIR}/stale_negative_control.json" \
    >> "${LOGS_DIR}/stale-control-stdout.txt" 2>&1
  CTRL_VERDICT_RC=$?
  node -e 'const fs=require("fs");fs.rmSync(process.argv[1],{recursive:true,force:true});' "${OUTDIR}" >> "${LOGS_DIR}/outdir_wipe.log" 2>&1
  if [ "${CTRL_VERDICT_RC}" -ne 0 ]; then
    verifier_error "the staleness check FAILED: with the build skipped, ${LOGS_DIR}/stale_negative_control.json records F2P checkpoints passing, which means the checkpoints can pass on files this run never produced"
  fi
  if [ "${CTRL_LEFT}" != "0" ]; then
    verifier_error "the staleness check leaked ${CTRL_LEFT} listener(s) on port ${STALE_PORT} after teardown (serve_static outlived its subshell) - refusing to exit successfully while a server started by this run is still bound, because later checks on this port would be answered by files this run did not serve"
  fi
fi

BUILD_STAMP="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_STAMP}"
if command -v npm >/dev/null 2>&1; then
  ( cd "${APP_DIR}" && NG_CLI_ANALYTICS=false npm run build ) > "${LOGS_DIR}/build.log" 2>&1
else
  ( cd "${APP_DIR}" && NG_CLI_ANALYTICS=false ./node_modules/.bin/ng build ) > "${LOGS_DIR}/build.log" 2>&1
fi
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  verifier_error "build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log). Note: client/angular.json sets defaultConfiguration \"production\" for the build target, and that configuration carries budgets (initial maximumError 2MB, anyComponentStyle maximumError 4kB), so an over-budget build fails HERE and not in the browser. NODE_OPTIONS is deliberately unset: the builder is the esbuild-generation @angular-devkit/build-angular:application."
fi

OUT_INDEX="${OUTDIR}/index.html"
if [ ! -f "${OUT_INDEX}" ]; then
  verifier_error "build produced no API/wwwroot/index.html. angular.json declares outputPath {base: \"../API/wwwroot\", browser: \"\"}, so with browser set to the empty string the artifacts land DIRECTLY in API/wwwroot with no browser/ subdirectory - if index.html is missing the builder geometry changed"
fi
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  verifier_error "API/wwwroot/index.html is not newer than the build start - the build did not emit into the tracked outdir, and serving it would grade the committed upstream artifacts instead of this build"
fi
EMITTED_JS="$(find "${OUTDIR}" -maxdepth 1 -type f -name '*.js' 2>/dev/null | wc -l | tr -d ' ')"
if [ "${EMITTED_JS}" -lt 1 ]; then
  verifier_error "no *.js was emitted directly inside API/wwwroot - the browser bundle is missing, so the served document would be an empty shell"
fi
if ! grep -q '<base href="/">' "${OUT_INDEX}"; then
  verifier_error "API/wwwroot/index.html carries no <base href=\"/\"> - src/index.html was edited or the wrong index was emitted, and the site-root serve geometry below would silently 404 every deep link"
fi
if grep -rq 'fonts\.googleapis' "${OUTDIR}" 2>/dev/null; then
  verifier_error "an emitted file still references fonts.googleapis - environment/adaptation.patch is not applied to this tree, so the page would make an off-machine request and the externalOriginCount guard in P02 is void"
fi
if grep -rq 'data-testid' "${OUTDIR}"/*.html 2>/dev/null; then
  verifier_error "an emitted HTML file carries a data-testid attribute - the instrumentation contract is 0 markup hooks, so this build was not produced from the delivered instrumentation.patch"
fi
DT_ALL=$(grep -roa 'data-testid' "${OUTDIR}" 2>/dev/null | wc -l | tr -d ' ')
DT_SELECTOR=$(grep -roa '\[data-testid\]' "${OUTDIR}" 2>/dev/null | wc -l | tr -d ' ')
if [ "${DT_ALL}" != "${DT_SELECTOR}" ]; then
  verifier_error "an emitted file carries data-testid in a NON-selector form (${DT_ALL} total occurrences vs ${DT_SELECTOR} read-only '[data-testid]' selector occurrences) - the instrumentation contract is 0 markup hooks, so this build was not produced from the delivered instrumentation.patch"
fi
if ! grep -rq '__SK__' "${OUTDIR}"/*.js 2>/dev/null; then
  verifier_error "no emitted bundle contains window.__SK__ - environment/instrumentation.patch is not applied to this tree, so every js_eval read would return the sentinel and all 41 checkpoints would go red for a reason that is not a defect verdict"
fi
if grep -rq 'rb-probe' "${OUTDIR}" 2>/dev/null; then
  verifier_error "the string rb-probe survived into the emitted artifacts - the observation bridge's own name must not be visible in the built output"
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${OUTDIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null; rm -f "${BUILD_STAMP}" "${SUP_STOP}" 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verifier_error "static server not ready on 127.0.0.1:${PORT}"
fi
probe() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}$1"; }
ROOT_CODE="$(probe /)"
SHOP_CODE="$(probe /shop)"
CART_CODE="$(probe /cart)"
NOTFOUND_CODE="$(probe /not-found)"
SERVERERROR_CODE="$(probe /server-error)"
TESTERROR_CODE="$(probe /test-error)"
LOGIN_CODE="$(probe /account/login)"
LOGO_CODE="$(probe /images/logo.png)"
HERO_CODE="$(probe /images/hero1.jpg)"
FAVICON_CODE="$(probe /favicon.ico)"
ABSENT_CODE="$(probe /assets/__rb_absent__.txt)"
echo "readiness: / ${ROOT_CODE} | /shop ${SHOP_CODE} | /cart ${CART_CODE} | /not-found ${NOTFOUND_CODE} | /server-error ${SERVERERROR_CODE} | /test-error ${TESTERROR_CODE} | /account/login ${LOGIN_CODE} | /images/logo.png ${LOGO_CODE} | /images/hero1.jpg ${HERO_CODE} | /favicon.ico ${FAVICON_CODE} | absent /assets/__rb_absent__.txt ${ABSENT_CODE}" > "${LOGS_DIR}/readiness.txt"
fail_probe() {
  verifier_error "$1 answered $2 (expected $3) - the served directory, the SPA fallback or the emitted outdir is wrong; expected API/wwwroot served at the site root of 127.0.0.1:${PORT}"
}
[ "${ROOT_CODE}" = "200" ]         || fail_probe "the site root /" "${ROOT_CODE}" 200
[ "${SHOP_CODE}" = "200" ]         || fail_probe "the cold deep link /shop" "${SHOP_CODE}" 200
[ "${CART_CODE}" = "200" ]         || fail_probe "the cold deep link /cart" "${CART_CODE}" 200
[ "${NOTFOUND_CODE}" = "200" ]     || fail_probe "the cold deep link /not-found" "${NOTFOUND_CODE}" 200
[ "${SERVERERROR_CODE}" = "200" ]  || fail_probe "the cold deep link /server-error" "${SERVERERROR_CODE}" 200
[ "${TESTERROR_CODE}" = "200" ]    || fail_probe "the cold deep link /test-error" "${TESTERROR_CODE}" 200
[ "${LOGIN_CODE}" = "200" ]        || fail_probe "the cold lazy deep link /account/login" "${LOGIN_CODE}" 200
[ "${LOGO_CODE}" = "200" ]         || fail_probe "the copied local asset /images/logo.png" "${LOGO_CODE}" 200
[ "${HERO_CODE}" = "200" ]         || fail_probe "the copied local asset /images/hero1.jpg" "${HERO_CODE}" 200
[ "${FAVICON_CODE}" = "200" ]      || fail_probe "the file-pattern asset /favicon.ico" "${FAVICON_CODE}" 200
if [ "${ABSENT_CODE}" != "404" ]; then
  verifier_error "a deliberately absent /assets/__rb_absent__.txt answered ${ABSENT_CODE} instead of 404 - the static server is blanket-serving, which would make every probe above meaningless and would hide a missing bundle behind a 200 document"
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 15000 \
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
