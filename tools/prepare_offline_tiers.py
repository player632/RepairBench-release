#!/usr/bin/env python3
"""Recreate the offline dependency archives expected by a subset of verifiers.

Three verifiers extract a frozen `node_modules` archive unconditionally and terminate with
a verifier error when the archive is absent, with no alternative supply path:

    repair-react__arcomage-hd-01
    repair-react__crossnote-app-01
    repair-react__ytubic-01

A further set of verifiers consult the same archives only when `node_modules` is missing
from the seed tree. For those, installing dependencies with `install_seed_deps.py` is
sufficient and this tool is not required; pass `--include-optional` to rebuild their
archives as well.

The frozen archives are not part of this distribution. This tool rebuilds them from the
dependencies installed in the seed tree, so the affected verifiers can run unchanged.
Dependency versions are resolved from the lockfile shipped in the seed tree and may differ
in patch level from the archives used for the published reference results.

Usage:
  python3 tools/prepare_offline_tiers.py --list
  python3 tools/prepare_offline_tiers.py --dry-run
  python3 tools/prepare_offline_tiers.py --task repair-react__ytubic-01
  python3 tools/prepare_offline_tiers.py --all

Run `tools/install_seed_deps.py` for the affected tasks first.
"""
from __future__ import annotations

import argparse
import csv
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "results", "dependency-install.csv")
OUT_DIR = os.path.join(ROOT, "repair_bench", "outputs")

ARCHIVE = re.compile(r"\$\{PIPELINE_ROOT\}/(_build/[A-Za-z0-9_./-]+\.nm\.tar\.gz)")
NM_GUARD = re.compile(r"\[\s*!?\s*-[dex]\s+\"[^\"]*node_modules")
REGISTRY_INSTALL = re.compile(r"\b(?:npm (?:install|ci)|pnpm install|yarn install|corepack yarn install|bun install)\b")


def load_index():
    with open(INDEX, newline="", encoding="utf-8") as handle:
        return {row["instance_id"]: row for row in csv.DictReader(handle)}


def scan():
    index = load_index()
    entries = []
    for task, row in sorted(index.items()):
        run_sh = os.path.join(OUT_DIR, task, "tests", "run.sh")
        if not os.path.isfile(run_sh):
            continue
        text = open(run_sh, encoding="utf-8").read()
        archives = list(dict.fromkeys(ARCHIVE.findall(text)))
        if not archives:
            continue
        required = not NM_GUARD.search(text) and not REGISTRY_INSTALL.search(text)
        members = []
        for directory in [d for d in row["install_dirs"].split(";") if d]:
            members.append("node_modules" if directory == "." else f"{directory}/node_modules")
        entries.append(dict(task=task, seed=row["seed_path"], archives=archives,
                            required=required, members=members))
    return entries


def create(entry, dry_run):
    seed_abs = os.path.join(ROOT, entry["seed"])
    target = os.path.join(ROOT, entry["archives"][0])
    present = [m for m in entry["members"] if os.path.isdir(os.path.join(seed_abs, m))]
    if not present:
        return entry["task"], "SKIP", (
            "no installed node_modules under %s; run tools/install_seed_deps.py --task %s first"
            % (entry["seed"], entry["task"]))
    command = ["tar", "-czf", target, "-C", seed_abs] + present
    if dry_run:
        return entry["task"], "DRY", " ".join(os.path.relpath(c, ROOT) if c.startswith(ROOT) else c for c in command)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    proc = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if proc.returncode != 0:
        return entry["task"], "FAIL", proc.stdout.strip()[-400:]
    return entry["task"], "OK", "%s (%.1f MiB)" % (
        os.path.relpath(target, ROOT), os.path.getsize(target) / 1024 ** 2)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--task", action="append", default=[])
    parser.add_argument("--include-optional", action="store_true",
                        help="also rebuild archives for verifiers that only consult them when node_modules is missing")
    args = parser.parse_args()

    entries = scan()
    if not args.include_optional:
        entries = [e for e in entries if e["required"]]
    if args.task:
        entries = [e for e in entries if e["task"] in set(args.task)]

    if args.list:
        print(f"{'instance_id':<48} {'required':<9} archive")
        for e in entries:
            print(f"{e['task']:<48} {str(e['required']):<9} {e['archives'][0]}")
        return 0

    if not args.all and not args.task and not args.dry_run:
        parser.error("select --all, --task <id>, --dry-run or --list")

    failures = 0
    for entry in entries:
        task, status, detail = create(entry, args.dry_run)
        if status == "FAIL":
            failures += 1
        print(f"[{status}] {task}: {detail}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
