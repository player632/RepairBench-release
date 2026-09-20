#!/bin/bash
# RepairBench verifier for repair-angular__free-angular-tailwind-dashboard-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/free-angular-tailwind-dashboard})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -u

_SELF="$(dirname "$0")"; _SELF="$(cd "${_SELF}" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/free-angular-tailwind-dashboard}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="dist/ng-tailadmin/browser"
PORT="${WLB_PORT:-12202}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

[ -d "${SRC_DIR}" ] || verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1)"
[ -f "${EVAL_ROOT}/dsl_runner.mjs" ] || verifier_error "dsl_runner.mjs not found under EVAL_ROOT ${EVAL_ROOT}"
[ -f "${EVAL_ROOT}/serve_static.mjs" ] || verifier_error "serve_static.mjs not found under EVAL_ROOT ${EVAL_ROOT}"
cd "${SRC_DIR}" || verifier_error "cannot cd into ${SRC_DIR}"

BUILD_START="$(node -e 'process.stdout.write(String(Date.now()))')"
echo "build_start_ms=${BUILD_START}" > "${LOGS_DIR}/timing.txt"

if [ -x "node_modules/.bin/ng" ]; then
  echo "dependency source: pre-existing node_modules in ${SRC_DIR} (no-op, no install run)" > "${LOGS_DIR}/install.log"
else
  echo "dependency source: registry install 'npm install --no-audit --no-fund' (NO dependency cache exists for this seed)" > "${LOGS_DIR}/install.log"
  npm install --no-audit --no-fund >> "${LOGS_DIR}/install.log" 2>&1
  DEP_RC=$?
  echo "install rc=${DEP_RC}" >> "${LOGS_DIR}/install.log"
  [ "${DEP_RC}" -eq 0 ] || verifier_error "dependency install failed rc=${DEP_RC} (see ${LOGS_DIR}/install.log)"
fi
[ -x "node_modules/.bin/ng" ] || verifier_error "node_modules/.bin/ng still absent after the dependency step"

node -e 'const fs=require("fs");fs.rmSync(process.argv[1],{recursive:true,force:true,maxRetries:5});' "${SRC_DIR}/dist" \
  > "${LOGS_DIR}/dist_wipe.log" 2>&1
echo "stale dist wiped: rc=$? (outdir is ABSENT_ON_DISK in the read-only support directory, so this is defence in depth)" >> "${LOGS_DIR}/dist_wipe.log"
[ -d "${SRC_DIR}/dist" ] && verifier_error "dist still present after fs.rmSync - refusing to build over an unerasable tree"

NG_CLI_ANALYTICS=false npm run build > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
echo "build rc=${BUILD_RC}" >> "${LOGS_DIR}/timing.txt"
[ "${BUILD_RC}" -eq 0 ] || verifier_error "ng build failed rc=${BUILD_RC} - if the log names a budget, that is a size-budget failure caused by the answer, not a checkpoint result (see ${LOGS_DIR}/build.log)"
[ -f "${SRC_DIR}/${OUTDIR}/index.html" ] || verifier_error "no ${OUTDIR}/index.html after a zero-exit build"

node - "$SRC_DIR" "$OUTDIR" "$BUILD_START" "$LOGS_DIR" <<'__GUARD__'
const fs=require('fs'), path=require('path');
const [src, outdir, buildStart, logs]=process.argv.slice(2);
const root=path.join(src,outdir);
const fail=[];
const idx=path.join(root,'index.html');
const html=fs.readFileSync(idx,'utf8');
const mt=fs.statSync(idx).mtimeMs;
if (!(mt > Number(buildStart))) fail.push('index.html mtime '+mt+' is not newer than build start '+buildStart+' - the served bytes are not from this build');
const walked=[]; (function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory())w(p); else walked.push(p);}})(root);
const js=walked.filter(p=>p.endsWith('.js'));
const css=walked.filter(p=>p.endsWith('.css'));
if(!js.length) fail.push('0 emitted .js files');
const probeHits=js.filter(p=>fs.readFileSync(p,'utf8').includes('__FTD__')).length;
if(probeHits<1) fail.push('the observation bridge is absent from every emitted bundle - the tree is not instrumented');
const remote=[];
for(const p of [idx,...css]){ const t=fs.readFileSync(p,'utf8'); const m=t.match(/https?:\/\/[A-Za-z0-9.\-]+/g)||[]; for(const x of m){ if(!/w3\.org/.test(x)) remote.push(path.basename(p)+':'+x); } }
if(remote.length) fail.push('external origin still named by the emitted document or stylesheets: '+remote.slice(0,6).join(' '));
const ATTR=/data-testid\s*=|data-rb-[A-Za-z0-9_-]+\s*=|["']data-testid["']|["']data-rb-/;
const LOOSE=/data-testid|data-rb-/;
const testids=[]; const mentions=[]; (function w2(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory()){if(e.name!=='node_modules')w2(p);} else if(/\.(ts|html)$/.test(e.name)){const t=fs.readFileSync(p,'utf8'); const rel=path.relative(src,p); if(ATTR.test(t)) testids.push(rel); else if(LOOSE.test(t)){const ln=t.split('\n').findIndex(l=>LOOSE.test(l))+1; mentions.push(rel+':'+ln+' (the words appear in a comment; no test-only attribute is declared)');}}}})(path.join(src,'src'));
if(testids.length) fail.push('test-only selector ATTRIBUTE present in the answer tree: '+testids.slice(0,6).join(' '));
const base=(html.match(/<base[^>]*href="([^"]*)"/i)||[])[1];
fs.writeFileSync(path.join(logs,'bundle_guard.json'), JSON.stringify({emitted_files:walked.length, js_files:js.length, css_files:css.length, index_mtime_ms:mt, build_start_ms:Number(buildStart), rb_probe_bundles:probeHits, remote_origin_hits:remote, testid_files:testids, testid_literal_mentions:mentions, testid_scan:'attribute-form regex over src/**/*.{ts,html}; a bare-word mention is reported as informational evidence and never fails the guard', base_href: base===undefined?'UNMEASURED':base, verdict: fail.length?'FAIL':'PASS', findings:fail},null,1));
if(fail.length){ console.error('BUNDLE_GUARD_FAIL: '+fail.join(' | ')); process.exit(3); }
__GUARD__
[ $? -eq 0 ] || verifier_error "emitted-bundle guard failed (see ${LOGS_DIR}/bundle_guard.json)"

BASE_HREF="$(node -e 'const j=require(process.argv[1]);process.stdout.write(String(j.base_href))' "${LOGS_DIR}/bundle_guard.json")"
echo "emitted base href: ${BASE_HREF} (the seed index.html base href was never measured in the light phase; this is the first on-disk reading of it)" >> "${LOGS_DIR}/timing.txt"

node "${EVAL_ROOT}/serve_static.mjs" --dir "${SRC_DIR}/${OUTDIR}" --port "${PORT}" > "${LOGS_DIR}/serve.log" 2>&1 &
SERVER_PID=$!
trap 'kill ${SERVER_PID} 2>/dev/null || true' EXIT
for i in $(seq 1 60); do
  code="$(node -e 'const h=require("http");const r=h.get({host:"127.0.0.1",port:Number(process.argv[1]),path:"/"},res=>{process.stdout.write(String(res.statusCode));res.resume();});r.on("error",()=>process.stdout.write("000"));r.setTimeout(2000,()=>{r.destroy();process.stdout.write("000")});' "${PORT}" 2>/dev/null)"
  [ "${code}" = "200" ] && break
  sleep 1
done
[ "${code}" = "200" ] || verifier_error "serve on 127.0.0.1:${PORT} never returned 200 for / (see ${LOGS_DIR}/serve.log)"

probe() { node -e 'const h=require("http");const r=h.get({host:"127.0.0.1",port:Number(process.argv[1]),path:process.argv[2]},res=>{process.stdout.write(String(res.statusCode));res.resume();});r.on("error",()=>process.stdout.write("000"));r.setTimeout(3000,()=>{r.destroy();process.stdout.write("000")});' "${PORT}" "$1" 2>/dev/null; }
ROOT_CODE="$(probe /)"; BADGE_CODE="$(probe /badge)"; CAL_CODE="$(probe /calendar)"; ABSENT_CODE="$(probe /__rb_absent__.txt)"
echo "readiness: / ${ROOT_CODE} | /badge ${BADGE_CODE} | /calendar ${CAL_CODE} | absent /__rb_absent__.txt ${ABSENT_CODE} | base_href ${BASE_HREF}" > "${LOGS_DIR}/readiness.txt"
[ "${ROOT_CODE}" = "200" ] || verifier_error "readiness: / returned ${ROOT_CODE}"
[ "${ABSENT_CODE}" = "404" ] || verifier_error "readiness: an absent asset returned ${ABSENT_CODE} instead of 404 - the serve geometry or fallback is wrong and every js_eval would degrade to the sentinel '-'"

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
