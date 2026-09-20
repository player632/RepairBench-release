#!/bin/bash
# RepairBench verifier for repair-svelte__gittok.dev-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/gittok.dev})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -uo pipefail

TASK="repair-svelte__gittok.dev-01"
_SELF="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/gittok.dev}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="build"
PORT="${WLB_PORT:-12230}"
MIRROR_PORT=12730
BASE="http://127.0.0.1:${PORT}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
RUN_STAMP_FILE="${LOGS_DIR}/start_stamp_ms"
SERVE_DIR="${SRC_DIR}/${OUTDIR}"
mkdir -p "${LOGS_DIR}"
node -e 'process.stdout.write(String(Date.now()))' > "${RUN_STAMP_FILE}"
START_MS="$(cat "${RUN_STAMP_FILE}")"

verifier_error() {
  echo "VERIFIER_ERROR: $*" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  node -e 'const p=process.argv[1];require("fs").writeFileSync(p,JSON.stringify({task:process.argv[2],verdict:"VERIFIER_ERROR",reason:process.argv[3],reward:0.0},null,1)+"\n")' "${LOGS_DIR}/reward.json" "$TASK" "$*"
  exit 2
}

echo "==[1/7] tree: ${SRC_DIR} (task ${TASK}, serving on ${PORT} = the frozen delivery port 12230 unless WLB_PORT overrode it, mirror ${MIRROR_PORT})"
[ -f "${SRC_DIR}/package.json" ] || verifier_error "no package.json at ${SRC_DIR} - wrong tree geometry"
[ -f "${SRC_DIR}/svelte.config.js" ] || verifier_error "no svelte.config.js - this is not the gittok.dev SvelteKit tree"
[ -f "${SRC_DIR}/src/lib/rb-probe.ts" ] || verifier_error "instrumentation not applied: src/lib/rb-probe.ts is absent, so window.__GT__ cannot exist and every assert would degrade to the sentinel"
grep -q "rb-probe" "${SRC_DIR}/src/routes/+layout.ts" || verifier_error "instrumentation not applied: the single import line is missing from src/routes/+layout.ts"

echo "==[2/7] dependencies (three keys, first key: npm install --no-audit --no-fund)"
if [ -d "${SRC_DIR}/node_modules/vite" ] && [ -d "${SRC_DIR}/node_modules/@sveltejs/kit" ]; then
  echo "   node_modules already usable (vite + @sveltejs/kit resolve) - install is a guarded no-op on a frozen lane"
else
  ( cd "$SRC_DIR" && npm install --no-audit --no-fund ) > "${LOGS_DIR}/install.log" 2>&1 \
    || verifier_error "npm install failed, tail: $(tail -n 12 "${LOGS_DIR}/install.log" | tr '\n' '|')"
fi
[ -f "${SRC_DIR}/node_modules/vite/package.json" ] || verifier_error "vite did not resolve after install"

echo "==[3/7] erase the declared outdir BEFORE building (node fs.rmSync, never a rm -rf command form)"
( cd "$SRC_DIR" && node -e '
const fs=require("fs");const p=process.argv[1];
let before=-1;try{before=fs.readdirSync(p).length;}catch(e){before=0;}
fs.rmSync(p,{recursive:true,force:true,maxRetries:3});
let after=0;try{after=fs.readdirSync(p).length;}catch(e){after=0;}
process.stdout.write(JSON.stringify({outdir:p,entries_before:before,entries_after:after}));
' "$OUTDIR" ) > "${LOGS_DIR}/erase.json" 2>&1 || verifier_error "outdir erase failed: $(cat "${LOGS_DIR}/erase.json")"
echo "   $(cat "${LOGS_DIR}/erase.json")"
[ -d "${SRC_DIR}/${OUTDIR}" ] && verifier_error "outdir ${OUTDIR} still present after fs.rmSync - a stale tree could be graded"

echo "==[4/7] build (three keys, second key: npm run build -> vite build)"
( cd "$SRC_DIR" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
[ "$BUILD_RC" -eq 0 ] || verifier_error "npm run build exited ${BUILD_RC}, tail: $(tail -n 20 "${LOGS_DIR}/build.log" | tr '\n' '|')"
[ -d "${SRC_DIR}/${OUTDIR}" ] || verifier_error "build exited 0 but the declared outdir ${OUTDIR} does not exist"

echo "==[5/7] emitted-tree guards (each one fail-closed; a tree that cannot show the defects is not graded)"
need() { [ -e "${SRC_DIR}/${OUTDIR}/$1" ] || verifier_error "emitted tree is missing $1"; }
need "index.html"
need "200.html"
need "manifest.json"
need "_app"
FEED_OK=0
for cand in "feed/index.html" "feed.html"; do [ -f "${SRC_DIR}/${OUTDIR}/${cand}" ] && FEED_OK=1; done
[ "$FEED_OK" -eq 1 ] || verifier_error "no prerendered /feed document (looked for feed/index.html and feed.html)"
for r in setup about test; do
  R_OK=0
  for cand in "${r}/index.html" "${r}.html"; do [ -f "${SRC_DIR}/${OUTDIR}/${cand}" ] && R_OK=1; done
  [ "$R_OK" -eq 1 ] || verifier_error "no prerendered /${r} document"
done
node -e '
const fs=require("fs");const f=process.argv[1];const start=Number(process.argv[2]);
const m=fs.statSync(f).mtimeMs;
if(!(m>start)){console.error("STALE_ARTEFACT mtime "+m+" <= run start "+start+" at "+f);process.exit(3);}
console.log("   freshness ok: "+f+" mtime_ms="+Math.round(m)+" > run_start_ms="+start+" (delta "+Math.round(m-start)+" ms)");
' "${SRC_DIR}/${OUTDIR}/index.html" "$START_MS" || verifier_error "outdir mtime freshness assertion failed - the served bytes may be a stale artifact"
grep -rlq "__GT__" "${SRC_DIR}/${OUTDIR}/_app" 2>/dev/null \
  || verifier_error "window.__GT__ is absent from every emitted bundle under ${OUTDIR}/_app - the observation bridge was tree-shaken or never applied"
for bad in "//www.googletagmanager.com" "https://www.googletagmanager.com" "gtag/js" "dataLayer" "//cdn.jsdelivr.net" "https://cdn.jsdelivr.net" "//eu.i.posthog.com" "https://eu.i.posthog.com" "phc_Fcp58Qw6TH48to35dd0wtJxZ8QpBxbLjsOqHER6OpJq"; do
  if grep -rlq -- "$bad" "${SRC_DIR}/${OUTDIR}" 2>/dev/null; then
    verifier_error "the live external reference ${bad} survived into the emitted outdir - environment/adaptation.patch was not applied to this tree"
  fi
done
for mk in "RepairBench adaptation A1" "RepairBench adaptation A2"; do
  grep -q -- "$mk" "${SRC_DIR}/${OUTDIR}/index.html" 2>/dev/null \
    || verifier_error "adaptation marker '$mk' is absent from the emitted ${OUTDIR}/index.html - environment/adaptation.patch was not applied to this tree"
done
grep -q "RepairBench adaptation A3" "${SRC_DIR}/src/routes/+layout.ts" 2>/dev/null \
  || verifier_error "adaptation marker A3 is absent from src/routes/+layout.ts - environment/adaptation.patch was not applied to this tree"
echo "   emitted-tree guards: PASS (index.html, 200.html, manifest.json, _app/, 4 prerendered routes, freshness, __GT__ in bundle, 0 live external references over 9 URL-shaped patterns, adaptation markers A1+A2+A3 present)"

echo "==[6/7] serve ${OUTDIR} AT THE SITE ROOT on 127.0.0.1:${PORT} (SPA fallback -> 200.html)"
SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${SERVE_DIR}" --port "${PORT}" >>"${LOGS_DIR}/serve.log" 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
[ "${READY}" -eq 1 ] || verifier_error "static server not ready on port ${PORT} (log: ${LOGS_DIR}/serve.log)"

probe() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE}$1"; }
fail_probe() { verifier_error "readiness probe $1 returned $2 (want $3) - serve geometry or outdir content is wrong"; }
for p in "/" "/index.html" "/200.html" "/manifest.json" "/favicon.ico" "/feed" "/setup" "/about" "/test" "/no-such-route-rb"; do
  code="$(probe "$p")"
  [ "$code" = "200" ] || fail_probe "$p" "$code" "200"
done
echo "   readiness: 10/10 probes 200 (including the unknown path, which the 200.html SPA fallback answers by design)"

echo "==[7/7] run the DSL and partition the verdicts"
[ -f "${EVAL_ROOT}/dsl_runner.mjs" ] || verifier_error "evaluation/dsl_runner.mjs not found under ${EVAL_ROOT}"
node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "${BASE}" \
  --timeout 15000 \
  --out "${LOGS_DIR}/checkpoint_results.json" \
  --task "${TASK}" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/exit-code.txt"
[ -f "${LOGS_DIR}/checkpoint_results.json" ] || verifier_error "dsl_runner produced no checkpoint_results.json (exit ${RUNNER_EXIT}, tail: $(tail -n 15 "${LOGS_DIR}/runner-stdout.txt" | tr '\n' '|'))"

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
