#!/bin/bash
# RepairBench verifier for repair-svelte__shadcn-svelte-extras-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/shadcn-svelte-extras})
#   LOGS_DIR  output directory for build/serve/runner logs (default: /tmp/wlb-repair-logs)
#
# Writes ${LOGS_DIR}/reward.json with the F2P and P2P pass rates and
#   score = 100 x f2p_rate x p2p_rate.
# Exit status: 0 = every checkpoint passed, 1 = at least one checkpoint failed,
#   2 = verifier or build error, 3 = dependency installation error.
set -uo pipefail

_SELF="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "${_SELF}/.." && pwd)"
PIPELINE_ROOT="$(cd "${PKG_DIR}/../../.." && pwd)"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/shadcn-svelte-extras}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-12236}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
OUT_REL=".svelte-kit/cloudflare"
mkdir -p "${LOGS_DIR}"

fail2() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  fail2 "source tree not found: ${SRC_DIR}"
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  ( cd "${SRC_DIR}" && pnpm install --no-frozen-lockfile --reporter=append-only ) > "${LOGS_DIR}/install.log" 2>&1
  if [ $? -ne 0 ]; then
    fail2 "dependency install failed (see ${LOGS_DIR}/install.log)"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  fail2 "build tooling absent after install (node_modules/.bin/vite) - the state tree is not buildable"
fi

node -e 'const fs=require("fs");const d=process.argv[1];for(const p of ["/.cf-vercel-build-output","/.svelte-kit","/.vercel"])fs.rmSync(d+p,{recursive:true,force:true});' "${SRC_DIR}"
( cd "${SRC_DIR}" && pnpm run build ) > "${LOGS_DIR}/build.log" 2>&1
if [ $? -ne 0 ]; then
  fail2 "build failed (see ${LOGS_DIR}/build.log)"
fi

SERVE_DIR="${SRC_DIR}/${OUT_REL}"
if [ ! -d "${SERVE_DIR}" ] || [ -z "$(ls -A "${SERVE_DIR}" 2>/dev/null | head -1)" ]; then
  for LEG in "${SRC_DIR}/.cf-vercel-build-output/static" "${SRC_DIR}/.cf-vercel-build-output" "${SRC_DIR}/.vercel/output/static"; do
    if [ -d "${LEG}" ] && [ -n "$(ls -A "${LEG}" 2>/dev/null | head -1)" ]; then
      echo "WARNING: declared output dir ${OUT_REL} is empty or absent but ${LEG} holds the build; symlinking it so the tree is servable. If you are reading this in a lane log, the outdir key for this instance has drifted from the tree's adapter path and needs re-measuring." >&2
      node -e 'const fs=require("fs"),p=require("path");const dst=process.argv[1],src=process.argv[2];fs.mkdirSync(p.dirname(dst),{recursive:true});fs.rmSync(dst,{recursive:true,force:true});fs.symlinkSync(src,dst,"dir");' "${SERVE_DIR}" "${LEG}"
      break
    fi
  done
fi
if [ ! -d "${SERVE_DIR}" ]; then
  fail2 "the build reported success but ${OUT_REL} does not exist - there is no static output to serve"
fi

node -e '
const fs=require("fs"),p=require("path");
const root=process.argv[1];
let copied=0,scanned=0;
(function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const full=p.join(dir,e.name);
    if(e.isDirectory()){walk(full);continue;}
    if(!e.name.endsWith(".html")||e.name==="index.html")continue;
    scanned++;
    const target=p.join(p.dirname(full),e.name.slice(0,-".html".length),"index.html");
    if(fs.existsSync(target))continue;
    fs.mkdirSync(p.dirname(target),{recursive:true});
    fs.copyFileSync(full,target);
    copied++;
  }
})(root);
console.log("html->dir/index.html: "+scanned+" prerendered page(s) scanned, "+copied+" sibling(s) created under "+root);
' "${SERVE_DIR}" >> "${LOGS_DIR}/build.log" 2>&1
if [ $? -ne 0 ]; then
  fail2 "the prerendered-page routing fixup failed (see ${LOGS_DIR}/build.log)"
fi

MISSING=""
for P in docs/components/number-field docs/components/stepper docs/hooks/use-frecency docs/components/meter docs/hooks/use-promise docs/components/copy-button docs/components/star-rating docs/components/tags-input docs/components/underline-tabs docs/hooks/use-media; do
  if [ ! -f "${SERVE_DIR}/${P}/index.html" ] && [ ! -f "${SERVE_DIR}/${P}.html" ]; then
    MISSING="${MISSING} /${P}"
  fi
done
if [ -n "${MISSING}" ]; then
  fail2 "prerendered doc page(s) absent from ${OUT_REL}:${MISSING} - kit.prerender.entries did not reach them (see the ADAPTATION note in this header and meta.adaptation)"
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${_SELF}/serve_tree.mjs" --dir "${SERVE_DIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/docs/components/copy-button" 2>/dev/null)"
  if [ "${CODE}" = "200" ]; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  fail2 "the tree is not serving HTTP 200 on port ${PORT} (last code for /docs/components/copy-button: '${CODE:-none}'). tests/serve_tree.mjs resolves an extension-less goto to its flat .html sibling, so a non-200 here is a build/prerender or resolver fact and is reported as a verifier error rather than scored as 36 behavioural reds"
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
