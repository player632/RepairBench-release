#!/bin/bash
# RepairBench verifier for repair-svelte__mdflux-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/mdflux})
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
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/mdflux}}"
APP_SUBDIR="app"
APP_DIR="${SRC_DIR}/${APP_SUBDIR}"
OUTDIR="${APP_DIR}/build"
case "${OUTDIR}" in
  /*) OUTDIR_ABS="${OUTDIR}" ;;
  *)  OUTDIR_ABS="${SRC_DIR}/${OUTDIR}" ;;
esac
PORT="${WLB_PORT:-12037}"
NM_TAR="${WLB_NM_TAR:-${PIPELINE_ROOT}/_build/tmp/s3_gates_archive/mdflux.nm.tar.gz}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
MARKER='rb-probe/mdflux/1'

mkdir -p "${LOGS_DIR}"
LEG_START="$(date +%s)"
printf '%s\n' "${LEG_START}" > "${LOGS_DIR}/leg-start-epoch.txt"

verifier_error() {
  echo "VERIFIER_ERROR: $1" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
}

if [ ! -d "${APP_DIR}" ]; then
  verifier_error "no app/ app root under ${SRC_DIR}"
fi
if [ ! -f "${APP_DIR}/package.json" ]; then
  verifier_error "no package.json in the app root ${APP_DIR}"
fi
case "$(cd "${SRC_DIR}" && pwd)" in
  "${PIPELINE_ROOT}/_build/gates/"*)
    verifier_error "refusing to install or build inside the read-only support directory ${SRC_DIR}" ;;
esac

if [ -d "${APP_DIR}/node_modules" ]; then
  echo "[run.sh] node_modules already present, skipping install"
  INSTALL_RC=0
elif [ -f "${NM_TAR}" ]; then
  echo "[run.sh] restoring node_modules from ${NM_TAR} (tar prefix ${APP_SUBDIR}/)"
  ( cd "${SRC_DIR}" && tar -xzf "${NM_TAR}" ) > "${LOGS_DIR}/install.log" 2>&1
  INSTALL_RC=$?
else
  echo "[run.sh] nm archive absent, falling back to the registered install command"
  ( cd "${APP_DIR}" && npm install --no-audit --no-fund ) > "${LOGS_DIR}/install.log" 2>&1
  INSTALL_RC=$?
fi
if [ "${INSTALL_RC}" -ne 0 ]; then
  verifier_error "dependency restore failed rc=${INSTALL_RC} (see ${LOGS_DIR}/install.log)"
fi
if [ ! -x "${APP_DIR}/node_modules/.bin/vite" ]; then
  verifier_error "no vite binary at ${APP_DIR}/node_modules/.bin/vite after the dependency restore"
fi

node -e '
const fs = require("node:fs"), path = require("node:path");
const out = process.argv[1], log = process.argv[2];
const manifest = { outdir: out, cleared_at: new Date().toISOString(), entries: [], existed: fs.existsSync(out) };
if (manifest.existed) {
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name), r = rel ? rel + "/" + e.name : e.name;
      if (e.isDirectory()) walk(p, r);
      else { const st = fs.statSync(p); manifest.entries.push({ path: r, bytes: st.size, mtime: st.mtime.toISOString() }); }
    }
  };
  walk(out, "");
}
manifest.file_count = manifest.entries.length;
manifest.top_level = manifest.existed ? fs.readdirSync(out).sort() : [];
fs.rmSync(out, { recursive: true, force: true });
manifest.empty_after = !fs.existsSync(out) || fs.readdirSync(out).length === 0;
fs.writeFileSync(log, JSON.stringify(manifest, null, 1));
console.log("[run.sh] outdir preclean: " + manifest.file_count + " stale file(s) recorded, empty_after=" + manifest.empty_after);
' "${OUTDIR_ABS}" "${LOGS_DIR}/outdir_preclean_manifest.json" > "${LOGS_DIR}/preclean.log" 2>&1
PRECLEAN_RC=$?
cat "${LOGS_DIR}/preclean.log"
if [ "${PRECLEAN_RC}" -ne 0 ]; then
  verifier_error "could not clear ${OUTDIR_ABS} to an empty state (see ${LOGS_DIR}/preclean.log)"
fi

echo "[run.sh] building ${APP_DIR} with npm run build"
( cd "${APP_DIR}" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  tail -40 "${LOGS_DIR}/build.log" >&2
  verifier_error "build failed rc=${BUILD_RC} (see ${LOGS_DIR}/build.log)"
fi
if [ ! -f "${OUTDIR_ABS}/index.html" ]; then
  verifier_error "build produced no ${OUTDIR_ABS}/index.html (adapter-static fallback page)"
fi

node -e '
const fs = require("node:fs");
const idx = process.argv[1], start = Number(fs.readFileSync(process.argv[2], "utf8").trim());
const m = fs.statSync(idx).mtimeMs / 1000;
const out = { index_html: idx, mtime_epoch: m, leg_start_epoch: start, newer_than_leg_start: m > start };
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log("[run.sh] freshness: index.html mtime " + m + " vs leg start " + start + " -> newer=" + out.newer_than_leg_start);
if (!out.newer_than_leg_start) process.exit(4);
' "${OUTDIR_ABS}/index.html" "${LOGS_DIR}/leg-start-epoch.txt" "${LOGS_DIR}/outdir_freshness.json" > "${LOGS_DIR}/freshness.log" 2>&1
FRESH_RC=$?
cat "${LOGS_DIR}/freshness.log"
if [ "${FRESH_RC}" -ne 0 ]; then
  verifier_error "${OUTDIR_ABS}/index.html is not newer than the start of this run - stale artifact"
fi

grep -rl "${MARKER}" "${OUTDIR_ABS}/_app" > "${LOGS_DIR}/marker_in_build.txt" 2>&1
MARKER_FILES=$(wc -l < "${LOGS_DIR}/marker_in_build.txt" | tr -d ' ')
if [ "${MARKER_FILES}" -lt 1 ]; then
  verifier_error "the instrumentation marker is absent from ${OUTDIR_ABS}/_app - the served bytes would not be this build"
fi
echo "[run.sh] positive control (disk): marker present in ${MARKER_FILES} built file(s)"

node "${EVAL_ROOT}/serve_static.mjs" --dir "${OUTDIR_ABS}" --port "${PORT}" > "${LOGS_DIR}/serve.log" 2>&1 &
SERVER_PID=$!
trap 'kill ${SERVER_PID} 2>/dev/null || true; wait ${SERVER_PID} 2>/dev/null || true' EXIT
READY=0
for _ in $(seq 1 200); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  verifier_error "static server not ready on ${PORT} (see ${LOGS_DIR}/serve.log)"
fi

curl -s "http://127.0.0.1:${PORT}/index.html" -o "${LOGS_DIR}/served-index.html"
node -e '
const fs = require("node:fs"), crypto = require("node:crypto");
const a = fs.readFileSync(process.argv[1]), b = fs.readFileSync(process.argv[2]);
const h = (x) => crypto.createHash("sha256").update(x).digest("hex").slice(0, 16);
const out = { on_disk_sha256_16: h(a), served_sha256_16: h(b), identical: h(a) === h(b), bytes: b.length };
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log("[run.sh] positive control (served): identical=" + out.identical + " " + out.served_sha256_16);
if (!out.identical) process.exit(5);
' "${OUTDIR_ABS}/index.html" "${LOGS_DIR}/served-index.html" "${LOGS_DIR}/served_control.json" > "${LOGS_DIR}/served-control.log" 2>&1
SERVED_RC=$?
cat "${LOGS_DIR}/served-control.log"
if [ "${SERVED_RC}" -ne 0 ]; then
  verifier_error "the bytes served on ${PORT} are not the bytes this build wrote"
fi

node "${EVAL_ROOT}/dsl_runner.mjs" \
  --dsl "${_SELF}/dsl.json" \
  --base-url "http://127.0.0.1:${PORT}" \
  --timeout 9000 \
  --out "${LOGS_DIR}/checkpoint_results.json" > "${LOGS_DIR}/runner-stdout.txt" 2>&1
RUNNER_EXIT=$?
printf '%s\n' "${RUNNER_EXIT}" > "${LOGS_DIR}/runner-exit.txt"
if [ ! -f "${LOGS_DIR}/checkpoint_results.json" ]; then
  tail -40 "${LOGS_DIR}/runner-stdout.txt" >&2
  verifier_error "dsl_runner produced no checkpoint_results.json (runner exit ${RUNNER_EXIT})"
fi

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
printf '%s\n' "${PARTITION_EXIT}" > "${LOGS_DIR}/exit-code.txt"
exit ${PARTITION_EXIT}
