#!/usr/bin/env bash
# RepairBench verifier for repair-angular__tugtainer-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/tugtainer})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/tugtainer}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
APP_SUBDIR="frontend"
APP_DIR="${SRC_DIR}/${APP_SUBDIR}"
OUTDIR="${APP_SUBDIR}/dist/tugtainer/browser"
OUTDIR_ABS="${SRC_DIR}/${OUTDIR}"
DIST_ABS="${APP_DIR}/dist"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/tugtainer.nm.tar.gz"
if [ ! -f "${NM_TAR}" ] && [ -f "${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/tugtainer.nm.tar.gz" ]; then
  NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/tugtainer.nm.tar.gz"
fi
PORT="${WLB_PORT:-12013}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"
LEG_START="$(date +%s)"
echo "leg_start_epoch=${LEG_START}" > "${LOGS_DIR}/leg_start.txt"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  verifier_error "SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1)"
fi
if [ ! -f "${APP_DIR}/package.json" ] || [ ! -f "${APP_DIR}/angular.json" ]; then
  verifier_error "APP_DIR ${APP_DIR} has no package.json/angular.json - the app root of this seed is the frontend/ subdirectory and it is missing; refusing to build the tree root"
fi

if [ ! -x "${APP_DIR}/node_modules/.bin/ng" ]; then
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" -C . ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: frozen dependency archive ${NM_TAR} unpacked at the tree root (entries are prefixed frontend/) rc=${DEP_RC}" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${APP_DIR}" && npm ci --no-audit --no-fund --offline ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: npm ci against the local npm cache, offline (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    if [ ! -x "${APP_DIR}/node_modules/.bin/ng" ]; then
      ( cd "${APP_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
      DEP_RC=$?
      echo "dependency source: registry install npm install --no-audit --no-fund (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    fi
  fi
fi
if [ ! -x "${APP_DIR}/node_modules/.bin/ng" ]; then
  verifier_error "no usable node_modules: ${APP_DIR}/node_modules/.bin/ng is absent or not executable (see ${LOGS_DIR}/install.log)"
fi

node -e '
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const [root,out]=process.argv.slice(1);
const rows=[];let bytes=0;
(function walk(d){let es;try{es=fs.readdirSync(d,{withFileTypes:true});}catch(e){return;}
 for(const e of es){const p=path.join(d,e.name);
  if(e.isDirectory()){rows.push({path:path.relative(root,p),kind:"dir"});walk(p);}
  else{const st=fs.statSync(p);bytes+=st.size;
   rows.push({path:path.relative(root,p),kind:"file",bytes:st.size,mtime:st.mtime.toISOString(),
    sha256_16:crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0,16)});}}})(root);
fs.writeFileSync(out,JSON.stringify({census_at:new Date().toISOString(),root,
 files:rows.filter(r=>r.kind==="file").length,entries:rows.length,bytes,
 erased_by:"node fs.rmSync (the `rm -rf` command form is forbidden by this package discipline)",
 rows},null,1));
console.log("stale outdir census: "+rows.filter(r=>r.kind==="file").length+" files / "+bytes+" bytes -> "+out);
' "${OUTDIR_ABS}" "${LOGS_DIR}/stale_outdir_census.json" > "${LOGS_DIR}/stale_census.log" 2>&1
cat "${LOGS_DIR}/stale_census.log"

if [ -e "${DIST_ABS}" ]; then
  node -e 'const fs=require("fs");fs.rmSync(process.argv[1],{recursive:true,force:true,maxRetries:5});' "${DIST_ABS}" \
    > "${LOGS_DIR}/dist_wipe.log" 2>&1
  echo "stale dist erased through node fs.rmSync: ${DIST_ABS}" >> "${LOGS_DIR}/dist_wipe.log"
fi
if [ -e "${DIST_ABS}" ]; then
  verifier_error "could not erase the stale ${DIST_ABS} before building (see ${LOGS_DIR}/dist_wipe.log) - refusing to grade a tree whose outdir may predate this run"
fi

BUILD_RC=0
( cd "${APP_DIR}" && NG_CLI_ANALYTICS=false npm run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" != "0" ]; then
  verifier_error "build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log). Read the log before attributing the failure to dependency supply: a budgets violation (initial maximumError 2MB / anyComponentStyle maximumError 8kB) fails the WHOLE build and produces a non-specific all-red run, which is a different finding from a single moved reading."
fi
if [ ! -f "${OUTDIR_ABS}/index.html" ]; then
  verifier_error "build reported rc=0 but ${OUTDIR_ABS}/index.html is absent - the declared outdir does not match what the application builder emitted"
fi

node -e '
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const [root,startS,out,appDir]=process.argv.slice(1);const start=Number(startS)*1000;
const sha16=(b)=>crypto.createHash("sha256").update(b).digest("hex").slice(0,16);
const declared=new Map();
const aj=JSON.parse(fs.readFileSync(path.join(appDir,"angular.json"),"utf8"));
for(const pname of Object.keys(aj.projects||{})){
  const bo=(((aj.projects[pname]||{}).architect||{}).build||{}).options;
  for(const a of (bo&&bo.assets)||[]){
    if(typeof a==="string"){console.error("UNSUPPORTED_ASSET_FORM bare string entry: "+a);process.exit(4);}
    if(a.glob!=="**/*"){console.error("UNSUPPORTED_ASSET_GLOB "+JSON.stringify(a));process.exit(4);}
    const inputDir=path.resolve(appDir,a.input);
    (function walkSrc(d,rel){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);const r=rel?rel+"/"+e.name:e.name;
      if(e.isDirectory())walkSrc(p,r);else declared.set(r,{source:path.relative(appDir,p),sha256_16:sha16(fs.readFileSync(p))});}})(inputDir,"");
  }
}
const NEVER_EXEMPT=/\.(js|mjs|css|map)$/i;
let n=0,fresh=0,exempt=0;const stale=[],rows=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
 if(e.isDirectory())walk(p);else{n++;const st=fs.statSync(p);const rel=path.relative(root,p);const bytes=fs.readFileSync(p);
  const rec={path:rel,bytes:st.size,mtime:st.mtime.toISOString(),sha256_16:sha16(bytes)};
  if(st.mtimeMs>=start){rec.class="fresh";fresh++;}
  else if(rel==="index.html"||NEVER_EXEMPT.test(rel)){rec.class="stale_build_output";stale.push(rel+"@"+rec.mtime);}
  else if(declared.has(rel)&&declared.get(rel).sha256_16===rec.sha256_16){rec.class="asset_copy_mtime_preserved";rec.declared_source=declared.get(rel).source;exempt++;}
  else{rec.class="stale_undeclared";rec.declared_source=declared.has(rel)?declared.get(rel).source:null;stale.push(rel+"@"+rec.mtime);}
  rows.push(rec);}}})(root);
const idx=rows.find((r)=>r.path==="index.html");
if(!idx){stale.push("index.html absent from the emitted outdir");}
else if(idx.class!=="fresh"){stale.push("index.html is "+idx.class+" (mtime "+idx.mtime+")");}
fs.writeFileSync(out,JSON.stringify({root,leg_start_epoch:Number(startS),emitted_files:n,fresh_files:fresh,
 asset_copies_mtime_preserved:exempt,stale_files:stale.length,stale,declared_asset_inputs:declared.size,
 rule:"index.html and every emitted .js/.mjs/.css/.map must be newer than leg start; any other file older than leg start must be byte-identical (sha256) to an asset input declared by angular.json at the relative path that declaration maps it to",
 rows},null,1));
console.log("freshness: "+n+" emitted files, "+fresh+" fresh, "+exempt+" declared-asset copies with preserved source mtime, "+stale.length+" stale");
if(stale.length){console.error("STALE: "+stale.slice(0,10).join(", "));process.exit(3);}
' "${OUTDIR_ABS}" "${LEG_START}" "${LOGS_DIR}/outdir_freshness.json" "${APP_DIR}" > "${LOGS_DIR}/freshness.log" 2>&1
FRESH_RC=$?
cat "${LOGS_DIR}/freshness.log"
if [ "${FRESH_RC}" != "0" ]; then
  verifier_error "the emitted outdir is not this build's own: index.html or a .js/.mjs/.css/.map output is older than this leg's start stamp, or an older emitted file is not byte-identical to an asset input declared by angular.json (see ${LOGS_DIR}/outdir_freshness.json)"
fi

if grep -q 'fonts\.googleapis' "${OUTDIR_ABS}/index.html" 2>/dev/null; then
  verifier_error "the emitted document still references fonts.googleapis.com - environment/adaptation.patch was not applied to this tree, so the delivered page would make an off-machine request"
fi
if ! grep -rq '__TG__' "${OUTDIR_ABS}"/*.js 2>/dev/null; then
  verifier_error "no emitted bundle contains window.__TG__ - environment/instrumentation.patch is not applied to this tree, so every js_eval read would degrade to the sentinel and all 41 checkpoints would go red for a reason that is not a defect"
fi

SUP_STOP="${LOGS_DIR}/.serve-stop"
rm -f "${SUP_STOP}"
trap 'touch "${SUP_STOP}"; sleep 0.6; pkill -f "serve_static.mjs --dir ${OUTDIR_ABS}" 2>/dev/null; true' EXIT
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${OUTDIR_ABS}" --port "${PORT}" --no-spa >/dev/null 2>&1; sleep 0.4; done ) &
SERVE_PID=$!
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/" 2>/dev/null; then READY=1; break; fi
  sleep 0.5
done
if [ "${READY}" != "1" ]; then
  verifier_error "static server not ready on 127.0.0.1:${PORT}"
fi

probe() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}$1"; }
ROOT_CODE="$(probe /)"
FAVICON_CODE="$(probe /favicon.ico)"
I18N_CODE="$(probe /i18n/en.yaml)"
API_CODE="$(probe /api/auth/is_authorized)"
DEEPLINK_CODE="$(probe /auth)"
ABSENT_CODE="$(probe /__rb_absent__.txt)"
echo "readiness: / ${ROOT_CODE} | /favicon.ico ${FAVICON_CODE} | /i18n/en.yaml ${I18N_CODE} | /api/auth/is_authorized ${API_CODE} | /auth ${DEEPLINK_CODE} | /__rb_absent__.txt ${ABSENT_CODE}" | tee "${LOGS_DIR}/readiness.txt"
fail_probe() {
  verifier_error "$1 answered $2 (expected $3) - the served directory, the --no-spa policy or the emitted outdir is wrong; expected ${OUTDIR} served at the site root of 127.0.0.1:${PORT}"
}
[ "${ROOT_CODE}" = "200" ]      || fail_probe "the site root /" "${ROOT_CODE}" 200
[ "${FAVICON_CODE}" = "200" ]   || fail_probe "the local favicon /favicon.ico" "${FAVICON_CODE}" 200
[ "${I18N_CODE}" = "200" ]      || fail_probe "the translation asset /i18n/en.yaml" "${I18N_CODE}" 200
[ "${API_CODE}" = "404" ]       || fail_probe "the unreachable backend /api/auth/is_authorized" "${API_CODE}" 404
[ "${DEEPLINK_CODE}" = "404" ]  || fail_probe "the cold deep link /auth (SPA fallback must be OFF)" "${DEEPLINK_CODE}" 404
[ "${ABSENT_CODE}" = "404" ]    || fail_probe "a deliberately absent /__rb_absent__.txt" "${ABSENT_CODE}" 404

SERVED_INDEX="${LOGS_DIR}/served_index.html"
curl -s "http://127.0.0.1:${PORT}/" -o "${SERVED_INDEX}"
node -e '
const fs=require("fs"),crypto=require("crypto");
const [served,disk,out]=process.argv.slice(1);
const h=(b)=>crypto.createHash("sha256").update(b).digest("hex");
const s=fs.readFileSync(served), d=fs.readFileSync(disk);
const srcs=[...fs.readFileSync(served,"utf8").matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
fs.writeFileSync(out,JSON.stringify({served_bytes:s.length,disk_bytes:d.length,
 served_sha256_16:h(s).slice(0,16),disk_sha256_16:h(d).slice(0,16),identical:h(s)===h(d),
 script_srcs:srcs},null,1));
console.log("served index vs on-disk index: identical="+(h(s)===h(d))+" script_srcs="+srcs.length);
if(!(h(s)===h(d))){process.exit(4);}
if(!srcs.length){process.exit(5);}
' "${SERVED_INDEX}" "${OUTDIR_ABS}/index.html" "${LOGS_DIR}/served_provenance.json" > "${LOGS_DIR}/provenance.log" 2>&1
PROV_RC=$?
cat "${LOGS_DIR}/provenance.log"
if [ "${PROV_RC}" != "0" ]; then
  verifier_error "the document served over HTTP is not byte-identical to the index.html this build emitted (see ${LOGS_DIR}/served_provenance.json) - the document under test is not the document on disk"
fi
SCRIPT_SRCS="$(node -e 'const j=require(process.argv[1]);console.log(j.script_srcs.join(" "));' "${LOGS_DIR}/served_provenance.json")"
for s in ${SCRIPT_SRCS}; do
  rel="${s#/}"
  code="$(probe "/${rel}")"
  if [ "${code}" != "200" ]; then
    verifier_error "a script referenced by the SERVED document (${s}) answered ${code} - the emitted bundle set and the served document disagree, which is the stale-outdir signature"
  fi
  curl -s "http://127.0.0.1:${PORT}/${rel}" -o "${LOGS_DIR}/served_chunk.bin"
  node -e '
const fs=require("fs"),crypto=require("crypto");
const [a,b]=process.argv.slice(1);
const h=(p)=>crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
if(h(a)!==h(b)){console.error("served chunk differs from the on-disk emitted chunk: "+b);process.exit(6);}
console.log("served chunk byte-identical to the emitted file: "+b);
' "${LOGS_DIR}/served_chunk.bin" "${OUTDIR_ABS}/${rel}" >> "${LOGS_DIR}/provenance.log" 2>&1
  if [ "$?" != "0" ]; then
    verifier_error "a served chunk is not byte-identical to the file this build emitted (${rel})"
  fi
done

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
    print(json.dumps({"error": "checkpoint_results.json missing"}))
    sys.exit(2)
verdicts = {r["id"]: r["status"] for r in results.get("checkpoint_results", [])}
f2p = json.load(open(f2p_path))
p2p = json.load(open(p2p_path))
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
PARTITION_EXIT=$?
exit "${PARTITION_EXIT}"
