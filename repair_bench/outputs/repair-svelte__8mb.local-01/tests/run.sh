#!/bin/bash
# RepairBench verifier for repair-svelte__8mb.local-01
#
# Usage: bash run.sh [src_dir]
#   src_dir   source tree to grade (default: ${WLB_APP_SRC:-<repo_root>/repo/svelte/8mb.local})
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
SRC_DIR="${1:-${WLB_APP_SRC:-${PIPELINE_ROOT}/repo/svelte/8mb.local}}"
APP_ROOT="${SRC_DIR}/frontend"
OUTDIR="${APP_ROOT}/build"
EVAL_ROOT="${WLB_EVAL_ROOT:-${PIPELINE_ROOT}/evaluation}"
PORT="${WLB_PORT:-12032}"
LOGS_DIR="${LOGS_DIR:-/tmp/wlb-repair-logs}"
mkdir -p "${LOGS_DIR}"
PROV="${LOGS_DIR}/outdir_clean_provenance.json"
FRESH="${LOGS_DIR}/outdir_freshness.json"
POSCTL="${LOGS_DIR}/served_bytes_positive_control.json"

if [ ! -d "${APP_ROOT}" ]; then
  echo "VERIFIER_ERROR: app root ${APP_ROOT} does not exist (the app root is frontend/, not the tree root)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi
if [ ! -d "${APP_ROOT}/node_modules" ]; then
  echo "VERIFIER_ERROR: ${APP_ROOT}/node_modules missing - run the install key first: (cd ${APP_ROOT} && npm install --no-audit --no-fund)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

BUILD_START="$(node -e 'process.stdout.write(String(Date.now()))')"

node - "${OUTDIR}" "${PROV}" <<'__CLEAN__'
const fs = require('node:fs');
const path = require('node:path');
const [dir, out] = process.argv.slice(2);
const inv = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else inv.push({ path: p.slice(dir.length + 1), bytes: fs.statSync(p).size });
  }
};
const existed = fs.existsSync(dir);
if (existed) walk(dir);
if (existed) fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(out, JSON.stringify({
  outdir: dir, existed_before: existed, removed_files: inv.length, removed: inv,
  emptied_at: new Date().toISOString(), method: 'node fs.rmSync (the recursive shell delete command form is banned by the design standard)',
}, null, 1));
process.stdout.write('outdir ' + dir + ': ' + (existed ? inv.length + ' stale file(s) removed' : 'did not exist') + ', now empty; inventory ' + out + '\n');
__CLEAN__
CLEAN_RC=$?
if [ "${CLEAN_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: could not empty the declared outdir ${OUTDIR} (see ${PROV})" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

( cd "${APP_ROOT}" && npm run build ) > "${LOGS_DIR}/build.log" 2>&1
BUILD_RC=$?
if [ "${BUILD_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: build failed (see ${LOGS_DIR}/build.log)" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node - "${OUTDIR}" "${FRESH}" "${BUILD_START}" <<'__FRESH__'
const fs = require('node:fs');
const path = require('node:path');
const [dir, out, startRaw] = process.argv.slice(2);
const start = Number(startRaw);
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else files.push({ path: p.slice(dir.length + 1), mtime_ms: fs.statSync(p).mtimeMs, bytes: fs.statSync(p).size });
  }
};
if (!fs.existsSync(dir)) { fs.writeFileSync(out, JSON.stringify({ ok: false, reason: 'outdir missing after build' }, null, 1)); process.exit(2); }
walk(dir);
const entry = files.find((f) => f.path === 'index.html');
const stale = files.filter((f) => f.mtime_ms < start);
const verdict = {
  ok: !!entry && files.length > 0 && stale.length === 0,
  build_start_ms: start,
  outdir_files: files.length,
  entry_document: entry ? { path: entry.path, bytes: entry.bytes, mtime_ms: entry.mtime_ms } : null,
  stale_files: stale.length,
  stale_list: stale.slice(0, 20),
  checked_at: new Date().toISOString(),
};
fs.writeFileSync(out, JSON.stringify(verdict, null, 1));
process.stdout.write('outdir freshness: ' + files.length + ' file(s), entry=' + (entry ? entry.bytes + 'B' : 'MISSING') + ', stale=' + stale.length + ' -> ' + (verdict.ok ? 'OK' : 'NOT OK') + '\n');
if (!verdict.ok) process.exit(2);
__FRESH__
FRESH_RC=$?
if [ "${FRESH_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: outdir freshness check failed - refusing to serve a tree that may be stale residue (see ${FRESH})" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

SUP_STOP="${LOGS_DIR}/.sup_stop_$$"
( while [ ! -f "${SUP_STOP}" ]; do node "${EVAL_ROOT}/serve_static.mjs" --dir "${OUTDIR}" --port "${PORT}" >/dev/null 2>&1; sleep 0.4; done ) &
SERVER_PID=$!
trap 'touch "${SUP_STOP}" 2>/dev/null; pkill -P ${SERVER_PID} 2>/dev/null; kill ${SERVER_PID} 2>/dev/null' EXIT
READY=0
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then READY=1; break; fi
  sleep 0.3
done
if [ "${READY}" -ne 1 ]; then
  echo "VERIFIER_ERROR: static server not ready on 127.0.0.1:${PORT}" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
fi

node - "${OUTDIR}" "${POSCTL}" "${PORT}" <<'__POS__'
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const [dir, out, port] = process.argv.slice(2);
const disk = fs.readFileSync(path.join(dir, 'index.html'));
let served = Buffer.alloc(0);
try { served = execFileSync('curl', ['-s', 'http://127.0.0.1:' + port + '/'], { maxBuffer: 64 * 1024 * 1024 }); } catch { served = Buffer.alloc(0); }
const marker = 'RB8-8MBLOCAL-PROBE-1';
let assetHits = 0;
let assetFiles = 0;
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|mjs|css)$/.test(e.name)) {
      assetFiles += 1;
      if (fs.readFileSync(p, 'utf8').includes('__RB8__') || fs.readFileSync(p, 'utf8').includes(marker)) assetHits += 1;
    }
  }
};
const appDir = path.join(dir, '_app');
if (fs.existsSync(appDir)) walk(appDir);
const verdict = {
  ok: served.length > 0 && served.equals(disk) && assetHits > 0,
  served_bytes: served.length,
  disk_bytes: disk.length,
  served_equals_built_entry_document: served.length > 0 && served.equals(disk),
  bridge_marker: marker,
  built_asset_files_scanned: assetFiles,
  built_asset_files_carrying_bridge: assetHits,
  interpretation: 'the document the server hands out is byte-identical to the entry document this build wrote, and the built asset tree carries the observation bridge compiled into it - residue compiled in before instrumentation carries neither',
  checked_at: new Date().toISOString(),
};
fs.writeFileSync(out, JSON.stringify(verdict, null, 1));
process.stdout.write('positive control: served=' + served.length + 'B disk=' + disk.length + 'B identical=' + verdict.served_equals_built_entry_document + ' bridge_assets=' + assetHits + '/' + assetFiles + ' -> ' + (verdict.ok ? 'OK' : 'NOT OK') + '\n');
if (!verdict.ok) process.exit(2);
__POS__
POS_RC=$?
if [ "${POS_RC}" -ne 0 ]; then
  echo "VERIFIER_ERROR: served bytes are not this build's bytes (see ${POSCTL})" >&2
  echo 2 > "${LOGS_DIR}/exit-code.txt"
  exit 2
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
    data = json.load(open(results_path))
except FileNotFoundError:
    print("VERIFIER_ERROR: no checkpoint results (the runner produced no output)")
    sys.exit(2)

rows = data if isinstance(data, list) else data.get("checkpoint_results", [])
status = {r["id"]: (r.get("status") == "pass") for r in rows if isinstance(r, dict) and "id" in r}
f2p = list(json.load(open(f2p_path)))
p2p = list(json.load(open(p2p_path)))

f2p_pass = sum(1 for cid in f2p if status.get(cid, False))
p2p_pass = sum(1 for cid in p2p if status.get(cid, False))
f2p_rate = f2p_pass / len(f2p) if f2p else 0.0
p2p_rate = p2p_pass / len(p2p) if p2p else 0.0
reward = round(f2p_rate * p2p_rate, 4)

missing = sorted(set(f2p + p2p) - set(status))
if missing:
    print("VERIFIER_WARNING: checkpoints missing from results: " + ",".join(missing))
red_f2p = sorted(cid for cid in f2p if not status.get(cid, False))
red_p2p = sorted(cid for cid in p2p if not status.get(cid, False))
print("F2P: %d/%d  P2P: %d/%d  reward=%s" % (f2p_pass, len(f2p), p2p_pass, len(p2p), reward))
print("red F2P: " + (",".join(red_f2p) if red_f2p else "none"))
print("red P2P: " + (",".join(red_p2p) if red_p2p else "none"))
json.dump({"f2p_pass": f2p_pass, "f2p_total": len(f2p), "p2p_pass": p2p_pass,
           "p2p_total": len(p2p), "reward": reward,
           "red_f2p": red_f2p, "red_p2p": red_p2p}, open(reward_path, "w"), indent=2)

summary = {
    "f2p": {"expected": len(f2p), "passed": f2p_pass, "failing": red_f2p, "rate": round(f2p_rate, 4)},
    "p2p": {"expected": len(p2p), "passed": p2p_pass, "failing": red_p2p, "rate": round(p2p_rate, 4)},
    "score": round(100 * f2p_rate * p2p_rate, 2),
    "reward": 1.0 if (not red_f2p and not red_p2p) else 0.0,
}
print(json.dumps(summary))

rc = 0 if (f2p_pass == len(f2p) and p2p_pass == len(p2p) and not missing) else 1
sys.exit(rc)
__PY__
PARTITION_RC=$?
printf '%s\n' "${PARTITION_RC}" > "${LOGS_DIR}/exit-code.txt"
exit "${PARTITION_RC}"
