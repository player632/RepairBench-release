#!/bin/bash
# RepairBench verifier for repair-angular__code-editor-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/angular/code-editor})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/angular/code-editor}}"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
OUTDIR="dist/dev-app/browser"
NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_nm_archive/code-editor.nm.tar.gz"
if [ ! -f "${NM_TAR}" ] && [ -f "${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/code-editor.nm.tar.gz" ]; then
  NM_TAR="${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/code-editor.nm.tar.gz"
fi
PORT="${WLB_PORT:-12010}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"

if [ ! -d "${SRC_DIR}" ]; then
  echo "VERIFIER_ERROR: SRC_DIR ${SRC_DIR} does not exist (set WLB_APP_SRC or pass the source tree as \$1)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  if [ -f "${NM_TAR}" ]; then
    ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" -C . ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: frozen dependency archive ${NM_TAR} (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
  else
    ( cd "${SRC_DIR}" && yarn install --non-interactive --no-progress --offline ) > "${LOGS_DIR}/install.log" 2>&1
    DEP_RC=$?
    echo "dependency source: yarn against the local yarn cache, offline (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
      ( cd "${SRC_DIR}" && yarn install --non-interactive --no-progress --network-timeout 600000 ) >> "${LOGS_DIR}/install.log" 2>&1
      DEP_RC=$?
      echo "dependency source: registry install yarn install --non-interactive --no-progress --network-timeout 600000 (rc=${DEP_RC})" >> "${LOGS_DIR}/install.log"
    fi
  fi
fi
if [ ! -x "${SRC_DIR}/node_modules/.bin/ng" ]; then
  echo "VERIFIER_ERROR: no usable node_modules (see ${LOGS_DIR}/install.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

BUILD_STAMP="${LOGS_DIR}/.build_start_$$"
touch "${BUILD_STAMP}"
if command -v yarn >/dev/null 2>&1; then
  ( cd "${SRC_DIR}" && NG_CLI_ANALYTICS=false yarn run build ) > "${LOGS_DIR}/build.log" 2>&1
else
  ( cd "${SRC_DIR}" && NG_CLI_ANALYTICS=false ./node_modules/.bin/ng build dev-app --base-href=/code-editor/ ) > "${LOGS_DIR}/build.log" 2>&1
fi
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

OUT_INDEX="${SRC_DIR}/${OUTDIR}/index.html"
if [ ! -f "${OUT_INDEX}" ]; then
  echo "VERIFIER_ERROR: build produced no ${OUTDIR}/index.html" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ -z "$(find "${OUT_INDEX}" -newer "${BUILD_STAMP}" -print 2>/dev/null)" ]; then
  echo "VERIFIER_ERROR: ${OUTDIR}/index.html is not newer than the build start - the build did not emit into ${OUTDIR} (stale tree)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if ! grep -q '<base href="/code-editor/">' "${OUT_INDEX}"; then
  echo "VERIFIER_ERROR: ${OUTDIR}/index.html carries no <base href=\"/code-editor/\"> - the build ran without the project's own --base-href flag, so every asset and the language-sample fetch would resolve against the origin instead of the served path" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
STAGE="${LOGS_DIR}/stage_$$"
mkdir -p "${STAGE}"
ln -sfn "${SRC_DIR}/${OUTDIR}" "${STAGE}/code-editor"
ln -sfn "${SRC_DIR}/${OUTDIR}/index.html" "${STAGE}/index.html"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${STAGE}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null; rm -f "${STAGE}/code-editor" "${STAGE}/index.html" 2>/dev/null; rmdir "${STAGE}" 2>/dev/null; rm -f "${BUILD_STAMP}" "${SUP_STOP}" 2>/dev/null' EXIT

READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/code-editor/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready on ${PORT}" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

ROOT_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/")"
BASE_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/code-editor/")"
DEEP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/code-editor/home")"
DIFF_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/code-editor/diff")"
SAMPLE_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/code-editor/lang_samples/javascript.txt")"
ROOTED_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/lang_samples/javascript.txt")"
echo "readiness: / ${ROOT_CODE} | /code-editor/ ${BASE_CODE} | /code-editor/home ${DEEP_CODE} | /code-editor/diff ${DIFF_CODE} | /code-editor/lang_samples/javascript.txt ${SAMPLE_CODE} | rooted /lang_samples/javascript.txt ${ROOTED_CODE}" > "${LOGS_DIR}/readiness.txt"
fail_probe() {
  echo "VERIFIER_ERROR: $1 answered $2 (expected 200) - the staging symlinks, the SPA fallback or the served directory is wrong; expected ${OUTDIR} staged as ${STAGE}/code-editor with a root index.html symlink" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}
[ "${ROOT_CODE}" = "200" ] || fail_probe "the staged site root /" "${ROOT_CODE}"
[ "${BASE_CODE}" = "200" ] || fail_probe "the base path /code-editor/" "${BASE_CODE}"
[ "${DEEP_CODE}" = "200" ] || fail_probe "the deep link /code-editor/home" "${DEEP_CODE}"
[ "${DIFF_CODE}" = "200" ] || fail_probe "the deep link /code-editor/diff" "${DIFF_CODE}"
[ "${SAMPLE_CODE}" = "200" ] || fail_probe "the same-origin sample text /code-editor/lang_samples/javascript.txt" "${SAMPLE_CODE}"
if [ "${ROOTED_CODE}" != "404" ]; then
  echo "VERIFIER_ERROR: a rooted /lang_samples/javascript.txt answered ${ROOTED_CODE} instead of 404 - the static server is falling back for extension-bearing paths, which would make defect D02 unobservable (its rooted fetch would succeed and F02 would pass on the nop state). Refusing to grade an unmeasurable task." >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 8000 \
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
