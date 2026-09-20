#!/bin/bash
# RepairBench verifier for repair-svelte__compress-lol-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/compress.lol})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/compress.lol}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-14103}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
OUT_REL="build"
NM_LIVE="${WLB_NM_LIVE:-${PIPELINE_ROOT}/_build/tmp/s0_nm_live/compress-lol}"
NM_TAR="${WLB_NM_TAR:-${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/compress-lol.nm.tar.gz}"
VITE_BIN="${SRC_DIR}/node_modules/.bin/vite"
mkdir -p "${LOGS_DIR}"

fail2() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${SRC_DIR}" ]; then
  fail2 "source tree not found: ${SRC_DIR}"
fi

if [ ! -x "${VITE_BIN}" ]; then
  if [ -d "${NM_LIVE}/node_modules" ]; then
    node -e 'const fs=require("fs"),p=require("path"),cp=require("child_process");const src=p.join(process.argv[1],"node_modules"),dst=p.join(process.argv[2],"node_modules");if(!fs.existsSync(src)){console.log("live dependency cache has no node_modules");process.exit(0);}if(fs.existsSync(dst)){console.log("state tree already carries node_modules");process.exit(0);}try{cp.execFileSync("cp",["-Rc",src,dst]);}catch(e){cp.execFileSync("cp",["-R",src,dst]);}console.log("offline nm live-tree restore (clonefile, 0 disk) from "+src);' "${NM_LIVE}" "${SRC_DIR}" >> "${LOGS_DIR}/install.log" 2>&1
  elif [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" ) >> "${LOGS_DIR}/install.log" 2>&1
  fi
  if [ ! -x "${VITE_BIN}" ]; then
    ( cd "${SRC_DIR}" && npm install --no-audit --no-fund ) >> "${LOGS_DIR}/install.log" 2>&1
    if [ $? -ne 0 ]; then
      fail2 "dependency install failed (see ${LOGS_DIR}/install.log)"
    fi
  fi
fi
if [ ! -x "${VITE_BIN}" ]; then
  fail2 "build tooling absent after install (node_modules/.bin/vite) - the state tree is not buildable. This is a supply fact, not a behavioural red, so it is reported as a verifier error rather than scored as 52 red checkpoints"
fi

node -e 'const fs=require("fs"),p=require("path");const root=process.argv[1];let n=0;for(const rel of ["build",".svelte-kit"]){const q=p.join(root,rel);if(fs.existsSync(q)){fs.rmSync(q,{recursive:true,force:true});n++;}}console.log("stale build output wiped: "+n+" entr(ies) under "+root);' "${SRC_DIR}" >> "${LOGS_DIR}/build.log" 2>&1
( cd "${SRC_DIR}" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
if [ $? -ne 0 ]; then
  fail2 "build failed (see ${LOGS_DIR}/build.log)"
fi

SERVE_DIR="${SRC_DIR}/${OUT_REL}"
if [ ! -d "${SERVE_DIR}" ] || [ -z "$(ls -A "${SERVE_DIR}" 2>/dev/null | head -1)" ]; then
  fail2 "the build reported success but ${OUT_REL} does not exist or is empty - there is no static output to serve"
fi
if [ ! -f "${SERVE_DIR}/index.html" ]; then
  fail2 "${OUT_REL}/index.html is absent after a successful build - the graded tree is the single route / and there is nothing to serve. This is a build/prerender fact, not a behavioural red, so it is reported as a verifier error rather than scored as 52 red checkpoints"
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${_SELF}/serve_tree.mjs" --dir "${SERVE_DIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/" 2>/dev/null)"
  if [ "${CODE}" = "200" ]; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  fail2 "the tree is not serving HTTP 200 on port ${PORT} (last code for /: '${CODE:-none}'). tests/serve_tree.mjs is a plain static resolver, so a non-200 here is a build or resolver fact and is reported as a verifier error rather than scored as 52 behavioural reds"
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
