#!/usr/bin/env python3
"""Install seed-tree dependencies for RepairBench tasks.

The shipped seed trees contain source only; `node_modules` directories are not
part of the distribution. This tool installs the dependencies required by the
verifier of each task, using the package manager recorded for that task in
`results/dependency-install.csv`.

Usage:
  python3 tools/install_seed_deps.py --list
  python3 tools/install_seed_deps.py --dry-run --all
  python3 tools/install_seed_deps.py --task repair-vanilla__svgedit-01
  python3 tools/install_seed_deps.py --all [--jobs N] [--force]

Options:
  --list        print the installation plan and exit
  --dry-run     print the commands that would run, without executing them
  --all         every task whose verifier requires dependencies
  --task ID     restrict to one or more task ids (repeatable)
  --only-missing  skip directories that already contain node_modules (default)
  --force       reinstall even when node_modules is present
  --jobs N      number of parallel installations (default 1)
"""
from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "results", "dependency-install.csv")

COMMANDS = {
    "npm": ["npm", "install", "--no-audit", "--no-fund"],
    "pnpm": ["pnpm", "install", "--no-frozen-lockfile"],
    "yarn": ["yarn", "install", "--non-interactive", "--no-progress"],
    "bun": ["bun", "install"],
}


def load_index():
    with open(INDEX, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def plan(rows, wanted, force):
    jobs = []
    for row in rows:
        if wanted is not None and row["instance_id"] not in wanted:
            continue
        if row["dependency_class"] == "no-node-project":
            continue
        seed = os.path.join(ROOT, row["seed_path"])
        dirs = [d for d in row["install_dirs"].split(";") if d]
        managers = [m for m in row["package_manager"].split(";") if m]
        for index, directory in enumerate(dirs):
            manager = managers[min(index, len(managers) - 1)] if managers else "npm"
            target = seed if directory == "." else os.path.join(seed, directory)
            if not os.path.isfile(os.path.join(target, "package.json")):
                jobs.append((row["instance_id"], target, None, "package.json missing"))
                continue
            if not force and os.path.isdir(os.path.join(target, "node_modules")):
                jobs.append((row["instance_id"], target, None, "already installed"))
                continue
            command = COMMANDS.get(manager)
            if command is None:
                jobs.append((row["instance_id"], target, None, f"unknown package manager {manager!r}"))
                continue
            jobs.append((row["instance_id"], target, command, manager))
    return jobs


def run(job):
    task, target, command, note = job
    if command is None:
        return task, target, "SKIP", note
    print(f"[install] {task} :: {os.path.relpath(target, ROOT)} :: {' '.join(command)}", flush=True)
    proc = subprocess.run(command, cwd=target, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if proc.returncode != 0:
        tail = "\n".join(proc.stdout.strip().splitlines()[-15:])
        return task, target, "FAIL", f"exit {proc.returncode}\n{tail}"
    return task, target, "OK", ""


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--task", action="append", default=[])
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--jobs", type=int, default=1)
    args = parser.parse_args()

    rows = load_index()
    if not args.all and not args.task and not args.list:
        parser.error("select --all, --task <id>, or --list")
    wanted = set(args.task) if args.task else None
    jobs = plan(rows, wanted, args.force)

    if args.list:
        print(f"{'instance_id':<52} {'install_dir':<28} action")
        for task, target, command, note in jobs:
            action = " ".join(command) if command else note
            print(f"{task:<52} {os.path.relpath(target, ROOT):<28} {action}")
        return 0

    if args.dry_run:
        for task, target, command, note in jobs:
            action = " ".join(command) if command else f"SKIP ({note})"
            print(f"{os.path.relpath(target, ROOT)} :: {action}")
        return 0

    failures = []
    if args.jobs > 1:
        with ThreadPoolExecutor(max_workers=args.jobs) as pool:
            results = list(pool.map(run, [j for j in jobs if j[2]]))
    else:
        results = [run(j) for j in jobs if j[2]]
    for task, target, status, detail in results:
        if status == "FAIL":
            failures.append((task, target, detail))
    skipped = sum(1 for j in jobs if j[2] is None)
    print(f"\ndone: {sum(1 for r in results if r[2] == 'OK')} installed, {len(failures)} failed, {skipped} skipped")
    for task, target, detail in failures:
        print(f"\nFAIL {task} ({os.path.relpath(target, ROOT)})\n{detail}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
