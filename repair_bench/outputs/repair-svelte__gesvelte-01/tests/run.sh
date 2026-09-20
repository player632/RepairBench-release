#!/bin/bash
# RepairBench verifier for repair-svelte__gesvelte-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/gesvelte})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/gesvelte}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-12454}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
OUT_REL="build"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/gesvelte.nm.tar.gz"
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
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" -C . ) > "${LOGS_DIR}/install.log" 2>&1
    INSTALL_RC=$?
    echo "install: node_modules restored from the frozen dependency archive ${NM_TAR} (rc=${INSTALL_RC})" >> "${LOGS_DIR}/install.log"
  else
    echo "install: WARNING dependency archive absent at ${NM_TAR} - falling back to a RESOLVING npm ci, which needs registry access and must fail on an offline lane" > "${LOGS_DIR}/install.log"
    ( cd "${SRC_DIR}" && npm ci --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
    INSTALL_RC=$?
  fi
  if [ "${INSTALL_RC}" -ne 0 ]; then
    fail2 "dependency install failed (see ${LOGS_DIR}/install.log)"
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/vite" ]; then
  fail2 "build tooling absent after install (node_modules/.bin/vite) - the state tree is not buildable"
fi

node -e 'const fs=require("fs");const d=process.argv[1];for(const p of ["/build","/.svelte-kit"])fs.rmSync(d+p,{recursive:true,force:true});' "${SRC_DIR}"
( cd "${SRC_DIR}" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
if [ $? -ne 0 ]; then
  fail2 "build failed (see ${LOGS_DIR}/build.log)"
fi

SERVE_DIR="${SRC_DIR}/${OUT_REL}"
if [ ! -f "${SERVE_DIR}/index.html" ]; then
  for LEG in "${SRC_DIR}/dist" "${SRC_DIR}/public" "${SRC_DIR}/.svelte-kit/output/client"; do
    if [ -f "${LEG}/index.html" ]; then
      echo "WARNING: declared output dir ${OUT_REL} holds no index.html but ${LEG} does; symlinking it so the tree is servable. 名册值待同步 - if you are reading this in a lane log, the roster/manifest outdir for this instance needs a main-line ruling." >&2
      node -e 'const fs=require("fs"),p=require("path");const dst=process.argv[1],src=process.argv[2];fs.mkdirSync(p.dirname(dst),{recursive:true});fs.rmSync(dst,{recursive:true,force:true});fs.symlinkSync(src,dst,"dir");' "${SERVE_DIR}" "${LEG}"
      break
    fi
  done
fi
if [ ! -f "${SERVE_DIR}/index.html" ]; then
  fail2 "the build reported success but ${OUT_REL}/index.html is absent - there is no static output to serve"
fi

node -e 'const fs=require("fs"),p=require("path");const dir=process.argv[1];let added=0;for(const name of fs.readdirSync(dir)){if(!name.endsWith(".html"))continue;const stem=name.slice(0,-5);if(stem==="index")continue;const sub=p.join(dir,stem);let isDir=false;try{isDir=fs.statSync(sub).isDirectory();}catch(e){}if(!isDir)fs.mkdirSync(sub,{recursive:true});const dst=p.join(sub,"index.html");if(!fs.existsSync(dst)){fs.copyFileSync(p.join(dir,name),dst);added++;console.log("route-normalized "+name+" -> "+stem+"/index.html");}}console.log("route_normalization_added="+added);' "${SERVE_DIR}" > "${LOGS_DIR}/normalize.log" 2>&1
if [ $? -ne 0 ]; then
  fail2 "route normalization failed (see ${LOGS_DIR}/normalize.log)"
fi
cat "${LOGS_DIR}/normalize.log" >&2

SUP_STOP="${LOGS_DIR}/.sup_stop_$"
if [ ! -f "${_SELF}/serve_routes.mjs" ]; then
  fail2 "tests/serve_routes.mjs is not next to this run.sh - refusing to serve. Falling back to the shared default server would answer /stage, /docs and /about with the HOME document and turn 24 route-specific checkpoints into false reds (see Consequence 2)."
fi
( while [ ! -f "${SUP_STOP}" ]; do node "${_SELF}/serve_routes.mjs" --dir "${SERVE_DIR}" --port "${PORT}" --no-spa >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  fail2 "static server not ready on port ${PORT}"
fi
for R in /stage /docs /about; do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${R}")"
  if [ "${CODE}" != "200" ]; then
    fail2 "route ${R} is not servable (HTTP ${CODE}) - either the build did not prerender it, or tests/serve_routes.mjs did not resolve it, or the adds-only route normalization did not land (see ${LOGS_DIR}/normalize.log)"
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
